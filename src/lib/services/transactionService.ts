import { prisma } from "../prisma";
import { TransactionCreateInput, TransactionDTO } from "../types";
import { logAuditAction } from "./auditService";
import { ReceiptService } from "./receiptService";
import { v4 as uuidv4 } from "uuid";

export class TransactionService {
  /**
   * Create a new transaction with idempotency and automated receivable provisioning.
   */
  static async createTransaction(input: TransactionCreateInput): Promise<{
    transaction: TransactionDTO;
    isExisting: boolean;
  }> {
    const localId = input.localId || uuidv4();

    // 1. Idempotency Check: if this client-generated localId already exists, return it
    const existing = await prisma.transaction.findUnique({
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
        transaction: this.mapToDTO(existing),
        isExisting: true,
      };
    }

    // 2. Validate Enterprise belongs to this farm
    const enterprise = await prisma.enterprise.findFirst({
      where: { id: input.enterpriseId, farmId: input.farmId },
    });
    if (!enterprise) {
      throw new Error("Specified enterprise does not exist or does not belong to this farm.");
    }

    // 3. Normalize amount and calculations
    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Amount must be a positive number.");
    }

    const txDate = new Date(input.transactionDate);

    // 4. Create Transaction
    const newTx = await prisma.transaction.create({
      data: {
        localId,
        farmId: input.farmId,
        enterpriseId: input.enterpriseId,
        categoryId: input.categoryId,
        createdById: input.createdById,
        type: input.type,
        transactionDate: txDate,
        amount,
        quantity: input.quantity ? Number(input.quantity) : null,
        unit: input.unit || null,
        unitPrice: input.unitPrice ? Number(input.unitPrice) : null,
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
        receivable: true,
      },
    });

    // 5. Automated Accounts Receivable if credit or partially paid sale
    if (
      input.type === "SALE" &&
      (input.paymentStatus === "CREDIT" || input.paymentStatus === "PARTIALLY_PAID")
    ) {
      const isPartiallyPaid = input.paymentStatus === "PARTIALLY_PAID";
      // If partially paid, we default initial collection to whatever was paid or half, else 0
      const paidAmount = 0; // Recorded payments will adjust this
      const balanceAmount = amount - paidAmount;

      const dueDate = new Date(txDate);
      dueDate.setDate(dueDate.getDate() + 14); // Default 14 days credit terms

      await prisma.receivable.create({
        data: {
          farmId: input.farmId,
          transactionId: newTx.id,
          customerName: input.buyerName || "Unnamed Customer",
          customerPhone: null,
          totalAmount: amount,
          paidAmount,
          balanceAmount,
          dueDate,
          status: isPartiallyPaid ? "PARTIALLY_PAID" : "PENDING",
        },
      });
    }

    // 6. Record Audit Log
    await logAuditAction({
      farmId: input.farmId,
      entityType: "TRANSACTION",
      entityId: newTx.id,
      action: "CREATE",
      actorId: input.createdById,
      newValues: {
        type: input.type,
        amount,
        enterpriseId: input.enterpriseId,
        categoryId: input.categoryId,
        paymentMethod: input.paymentMethod,
      },
    });

    // 7. Automatically generate unique digital receipt with QR code verification
    await ReceiptService.createReceiptForTransaction(newTx.id, input.farmId);

    // Re-fetch to include created receivable and receipt
    const fullTx = await prisma.transaction.findUnique({
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
      transaction: this.mapToDTO(fullTx!),
      isExisting: false,
    };
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
    const where: any = {
      farmId: filters.farmId,
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
      transactions: items.map(this.mapToDTO),
      total,
    };
  }

  /**
   * Soft delete a transaction with audit trail and void its receipt.
   */
  static async softDeleteTransaction(
    id: string,
    farmId: string,
    actorId: string
  ): Promise<TransactionDTO> {
    const existing = await prisma.transaction.findFirst({
      where: { id, farmId, isDeleted: false },
    });

    if (!existing) {
      throw new Error("Transaction not found or already deleted.");
    }

    const updated = await prisma.transaction.update({
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
    await ReceiptService.voidReceiptForTransaction(id, actorId, "Transaction soft-deleted");

    await logAuditAction({
      farmId,
      entityType: "TRANSACTION",
      entityId: id,
      action: "DELETE",
      actorId,
      oldValues: existing,
      newValues: { isDeleted: true, deletedAt: new Date() },
    });

    return this.mapToDTO(updated);
  }

  /**
   * Map raw Prisma Transaction model to clean DTO
   */
  private static mapToDTO(tx: any): TransactionDTO {
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
