import { prisma } from "../prisma";
import { TransactionCreateInput, TransactionDTO } from "../types";
import { logAuditAction } from "./auditService";
import { ReceiptService } from "./receiptService";
import { AuthContextService } from "./authContext";
import { v4 as uuidv4 } from "uuid";

export class TransactionService {
  /**
   * Create a new transaction with idempotency, server calculations, and atomic database transaction.
   */
  static async createTransaction(input: TransactionCreateInput): Promise<{
    transaction: TransactionDTO;
    isExisting: boolean;
  }> {
    // 1. Authoritative Farm & User Resolution
    const authContext = await AuthContextService.getActiveContext(input.farmId);
    const farmId = authContext.farm.id;
    const createdById = input.createdById && input.createdById.length > 20
      ? input.createdById
      : authContext.user.id;

    // 2. Server-side validation of calculations: do not blindly trust client amount
    let finalAmount = Number(input.amount);
    let qty: number | null = input.quantity ? Number(input.quantity) : null;
    let unitP: number | null = input.unitPrice ? Number(input.unitPrice) : null;

    if (qty !== null && unitP !== null && qty > 0 && unitP > 0) {
      finalAmount = Math.round(qty * unitP * 100) / 100;
    }

    if (isNaN(finalAmount) || finalAmount <= 0) {
      throw new Error("Transaction amount must be a positive number.");
    }

    const localId = input.localId || uuidv4();
    const txDate = new Date(input.transactionDate);

    // 3. Execute entirely within an atomic database transaction
    return await prisma.$transaction(async (tx) => {
      // Idempotency Check: if this localId already exists, return the authoritative record
      const existing = await tx.transaction.findUnique({
        where: { localId },
        include: {
          enterprise: true,
          category: true,
          createdBy: true,
          receivable: true,
          receipt: true,
        },
      });

      if (existing) {
        return {
          transaction: TransactionService.mapToDTO(existing),
          isExisting: true,
        };
      }

      // Verify Enterprise belongs to this farm
      const enterprise = await tx.enterprise.findFirst({
        where: { id: input.enterpriseId, farmId },
      });
      if (!enterprise) {
        throw new Error(
          `Specified enterprise does not exist or does not belong to farm '${authContext.farm.name}'.`
        );
      }

      // Verify Category exists
      const category = await tx.category.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) {
        throw new Error("Specified category does not exist.");
      }

      // Create Transaction Record
      const newTx = await tx.transaction.create({
        data: {
          localId,
          farmId,
          enterpriseId: input.enterpriseId,
          categoryId: input.categoryId,
          createdById,
          type: input.type,
          transactionDate: txDate,
          amount: finalAmount,
          quantity: qty,
          unit: input.unit || null,
          unitPrice: unitP,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentStatus,
          salesChannel: input.salesChannel || null,
          buyerName: input.buyerName || null,
          notes: input.notes || null,
          receiptUrl: input.receiptUrl || null,
        },
        include: {
          enterprise: true,
          category: true,
          createdBy: true,
        },
      });

      // Automated Accounts Receivable if credit or partially paid sale
      if (
        input.type === "SALE" &&
        (input.paymentStatus === "CREDIT" || input.paymentStatus === "PARTIALLY_PAID")
      ) {
        const isPartiallyPaid = input.paymentStatus === "PARTIALLY_PAID";
        const paidAmount = 0;
        const balanceAmount = finalAmount - paidAmount;

        const dueDate = new Date(txDate);
        dueDate.setDate(dueDate.getDate() + 14);

        await tx.receivable.create({
          data: {
            farmId,
            transactionId: newTx.id,
            customerName: input.buyerName || "Unnamed Customer",
            customerPhone: null,
            totalAmount: finalAmount,
            paidAmount,
            balanceAmount,
            dueDate,
            status: isPartiallyPaid ? "PARTIALLY_PAID" : "PENDING",
          },
        });
      }

      // Automated Receipt Generation (atomic with transaction)
      await ReceiptService.createReceiptForTransaction(newTx.id, farmId, undefined, tx);

      // Audit Log
      await logAuditAction(
        {
          farmId,
          entityType: "TRANSACTION",
          entityId: newTx.id,
          action: "CREATE",
          actorId: createdById,
          newValues: {
            type: input.type,
            amount: finalAmount,
            enterpriseId: input.enterpriseId,
            categoryId: input.categoryId,
            paymentMethod: input.paymentMethod,
            paymentStatus: input.paymentStatus,
          },
        },
        tx
      );

      // Re-fetch full committed transaction with all relations
      const fullTx = await tx.transaction.findUniqueOrThrow({
        where: { id: newTx.id },
        include: {
          enterprise: true,
          category: true,
          createdBy: true,
          receivable: true,
          receipt: true,
        },
      });

      return {
        transaction: TransactionService.mapToDTO(fullTx),
        isExisting: false,
      };
    });
  }

  /**
   * Update an existing transaction atomically with audit trail.
   */
  static async updateTransaction(
    id: string,
    farmIdOrSlug: string,
    actorId: string,
    input: {
      enterpriseId?: string;
      categoryId?: string;
      type?: "EXPENSE" | "SALE";
      transactionDate?: string;
      amount?: number;
      quantity?: number | null;
      unit?: string | null;
      unitPrice?: number | null;
      paymentMethod?: any;
      paymentStatus?: any;
      salesChannel?: string | null;
      buyerName?: string | null;
      notes?: string | null;
    }
  ): Promise<TransactionDTO> {
    const authContext = await AuthContextService.getActiveContext(farmIdOrSlug);
    const farmId = authContext.farm.id;

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id, farmId, isDeleted: false },
        include: { receivable: true, receipt: true },
      });

      if (!existing) {
        throw new Error("Transaction not found or has been deleted.");
      }

      // Validate Enterprise if changed
      if (input.enterpriseId && input.enterpriseId !== existing.enterpriseId) {
        const ent = await tx.enterprise.findFirst({
          where: { id: input.enterpriseId, farmId },
        });
        if (!ent) {
          throw new Error("Specified enterprise does not belong to this farm.");
        }
      }

      // Recalculate amount if quantity/unitPrice updated
      let newAmount = input.amount !== undefined ? Number(input.amount) : Number(existing.amount);
      const newQty = input.quantity !== undefined ? (input.quantity ? Number(input.quantity) : null) : existing.quantity;
      const newUnitPrice = input.unitPrice !== undefined ? (input.unitPrice ? Number(input.unitPrice) : null) : existing.unitPrice;

      if (newQty !== null && newUnitPrice !== null && newQty > 0 && newUnitPrice > 0) {
        newAmount = Math.round(newQty * newUnitPrice * 100) / 100;
      }

      if (newAmount <= 0) {
        throw new Error("Transaction amount must be greater than zero.");
      }

      const updateData: any = {
        amount: newAmount,
        quantity: newQty,
        unit: input.unit !== undefined ? input.unit : existing.unit,
        unitPrice: newUnitPrice,
        enterpriseId: input.enterpriseId || existing.enterpriseId,
        categoryId: input.categoryId || existing.categoryId,
        type: input.type || existing.type,
        paymentMethod: input.paymentMethod || existing.paymentMethod,
        paymentStatus: input.paymentStatus || existing.paymentStatus,
        salesChannel: input.salesChannel !== undefined ? input.salesChannel : existing.salesChannel,
        buyerName: input.buyerName !== undefined ? input.buyerName : existing.buyerName,
        notes: input.notes !== undefined ? input.notes : existing.notes,
      };

      if (input.transactionDate) {
        updateData.transactionDate = new Date(input.transactionDate);
      }

      const updated = await tx.transaction.update({
        where: { id },
        data: updateData,
        include: {
          enterprise: true,
          category: true,
          createdBy: true,
          receivable: true,
          receipt: true,
        },
      });

      // Update associated receivable if amount or customer changed
      if (existing.receivable) {
        const newPaid = Number(existing.receivable.paidAmount);
        const newBalance = Math.max(0, newAmount - newPaid);
        const newStatus = newBalance === 0 ? "PAID" : newPaid > 0 ? "PARTIALLY_PAID" : "PENDING";

        await tx.receivable.update({
          where: { id: existing.receivable.id },
          data: {
            totalAmount: newAmount,
            balanceAmount: newBalance,
            customerName: input.buyerName || existing.receivable.customerName,
            status: newStatus,
          },
        });
      }

      // Log Audit
      await logAuditAction(
        {
          farmId,
          entityType: "TRANSACTION",
          entityId: id,
          action: "UPDATE",
          actorId,
          oldValues: {
            amount: existing.amount,
            quantity: existing.quantity,
            unitPrice: existing.unitPrice,
            enterpriseId: existing.enterpriseId,
            categoryId: existing.categoryId,
            paymentStatus: existing.paymentStatus,
          },
          newValues: {
            amount: newAmount,
            quantity: newQty,
            unitPrice: newUnitPrice,
            enterpriseId: updateData.enterpriseId,
            categoryId: updateData.categoryId,
            paymentStatus: updateData.paymentStatus,
          },
        },
        tx
      );

      return TransactionService.mapToDTO(updated);
    });
  }

  /**
   * Query transactions with filters, search, and pagination.
   */
  static async getTransactions(filters: {
    farmId: string;
    enterpriseId?: string;
    type?: "EXPENSE" | "SALE";
    paymentStatus?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: TransactionDTO[]; total: number }> {
    // Resolve farmId (supports both slug and UUID)
    const farm = await prisma.farm.findFirst({
      where: {
        OR: [{ id: filters.farmId }, { slug: filters.farmId }],
      },
    });
    const farmId = farm ? farm.id : filters.farmId;

    const where: any = {
      farmId,
      isDeleted: false,
    };

    if (filters.enterpriseId && filters.enterpriseId !== "ALL") {
      where.enterpriseId = filters.enterpriseId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.paymentStatus && filters.paymentStatus !== "ALL") {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters.paymentMethod && filters.paymentMethod !== "ALL") {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.transactionDate = {};
      if (filters.dateFrom) {
        where.transactionDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        where.transactionDate.lte = to;
      }
    }

    if (filters.search) {
      where.OR = [
        { notes: { contains: filters.search } },
        { buyerName: { contains: filters.search } },
        { category: { name: { contains: filters.search } } },
        { enterprise: { name: { contains: filters.search } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        include: {
          enterprise: true,
          category: true,
          createdBy: true,
          receivable: true,
          receipt: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions: items.map((tx) => this.mapToDTO(tx)),
      total,
    };
  }

  /**
   * Soft delete a transaction with audit trail and void its receipt.
   */
  static async softDeleteTransaction(
    id: string,
    farmIdOrSlug: string,
    actorId: string
  ): Promise<TransactionDTO> {
    const authContext = await AuthContextService.getActiveContext(farmIdOrSlug);
    const farmId = authContext.farm.id;

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id, farmId, isDeleted: false },
      });

      if (!existing) {
        throw new Error("Transaction not found or already deleted.");
      }

      const updated = await tx.transaction.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedById: actorId,
        },
        include: {
          enterprise: true,
          category: true,
          createdBy: true,
          receivable: true,
          receipt: true,
        },
      });

      // Void the digital receipt
      await tx.receipt.updateMany({
        where: { transactionId: id },
        data: {
          status: "VOIDED",
          voidedAt: new Date(),
        },
      });

      // If associated receivable exists, mark CANCELLED
      await tx.receivable.updateMany({
        where: { transactionId: id },
        data: {
          status: "CANCELLED",
        },
      });

      await logAuditAction(
        {
          farmId,
          entityType: "TRANSACTION",
          entityId: id,
          action: "DELETE",
          actorId,
          oldValues: existing,
          newValues: { isDeleted: true, deletedAt: new Date() },
        },
        tx
      );

      return TransactionService.mapToDTO(updated);
    });
  }

  /**
   * Map raw Prisma Transaction model to clean DTO
   */
  public static mapToDTO(tx: any, qrCodeDataURL?: string): TransactionDTO {
    return {
      id: tx.id,
      localId: tx.localId,
      farmId: tx.farmId,
      enterpriseId: tx.enterpriseId,
      enterpriseName: tx.enterprise?.name,
      categoryId: tx.categoryId,
      categoryName: tx.category?.name,
      createdById: tx.createdById,
      createdByName: tx.createdBy?.fullName,
      type: tx.type,
      transactionDate: tx.transactionDate.toISOString(),
      amount: Number(tx.amount),
      quantity: tx.quantity !== null ? Number(tx.quantity) : null,
      unit: tx.unit,
      unitPrice: tx.unitPrice !== null ? Number(tx.unitPrice) : null,
      paymentMethod: tx.paymentMethod,
      paymentStatus: tx.paymentStatus,
      salesChannel: tx.salesChannel,
      buyerName: tx.buyerName,
      notes: tx.notes,
      receiptUrl: tx.receiptUrl,
      isDeleted: tx.isDeleted,
      receivableId: tx.receivable?.id || null,
      receivableStatus: tx.receivable?.status || null,
      receivableBalance: tx.receivable ? Number(tx.receivable.balanceAmount) : null,
      receiptId: tx.receipt?.id || null,
      receiptNumber: tx.receipt?.receiptNumber || null,
      receiptStatus: tx.receipt?.status || null,
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString(),
    };
  }
}
