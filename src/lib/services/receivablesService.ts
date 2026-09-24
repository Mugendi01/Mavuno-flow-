import { prisma } from "../prisma";
import { ReceivableDTO, PaymentMethod } from "../types";
import { logAuditAction } from "./auditService";

export class ReceivablesService {
  /**
   * Get receivables for a farm with optional status filtering.
   */
  static async getReceivables(
    farmId: string,
    statusFilter?: string
  ): Promise<ReceivableDTO[]> {
    const where: any = { farmId };

    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    const items = await prisma.receivable.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        transaction: {
          include: {
            enterprise: true,
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    const now = new Date();

    return items.map((r) => {
      // Dynamically mark overdue if due date passed and still has balance
      let currentStatus = r.status;
      if (
        (currentStatus === "PENDING" || currentStatus === "PARTIALLY_PAID") &&
        r.dueDate &&
        new Date(r.dueDate) < now
      ) {
        currentStatus = "OVERDUE";
      }

      return {
        id: r.id,
        farmId: r.farmId,
        transactionId: r.transactionId,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        totalAmount: Number(r.totalAmount),
        paidAmount: Number(r.paidAmount),
        balanceAmount: Number(r.balanceAmount),
        dueDate: r.dueDate ? r.dueDate.toISOString() : null,
        status: currentStatus as any,
        createdAt: r.createdAt.toISOString(),
        transaction: {
          transactionDate: r.transaction.transactionDate.toISOString(),
          enterpriseName: r.transaction.enterprise.name,
          notes: r.transaction.notes,
        },
        payments: r.payments.map((p) => ({
          id: p.id,
          receivableId: p.receivableId,
          amount: Number(p.amount),
          paymentDate: p.paymentDate.toISOString(),
          paymentMethod: p.paymentMethod as PaymentMethod,
          referenceCode: p.referenceCode,
          recordedById: p.recordedById,
          notes: p.notes,
          createdAt: p.createdAt.toISOString(),
        })),
      };
    });
  }

  /**
   * Record a payment against an outstanding receivable.
   */
  static async recordPayment(input: {
    receivableId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceCode?: string;
    recordedById: string;
    notes?: string;
  }) {
    const receivable = await prisma.receivable.findUnique({
      where: { id: input.receivableId },
    });

    if (!receivable) {
      throw new Error("Receivable not found.");
    }

    const payAmount = Number(input.amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    const currentBalance = Number(receivable.balanceAmount);
    const newPaidAmount = Number(receivable.paidAmount) + payAmount;
    const newBalance = Math.max(0, currentBalance - payAmount);
    const newStatus = newBalance === 0 ? "PAID" : "PARTIALLY_PAID";

    // Atomically create payment and update receivable
    const [payment, updatedReceivable] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          receivableId: input.receivableId,
          amount: payAmount,
          paymentMethod: input.paymentMethod,
          referenceCode: input.referenceCode || null,
          recordedById: input.recordedById,
          notes: input.notes || null,
        },
      }),
      prisma.receivable.update({
        where: { id: input.receivableId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalance,
          status: newStatus,
        },
      }),
    ]);

    // Also update parent transaction paymentStatus if fully settled
    if (newBalance === 0) {
      await prisma.transaction.update({
        where: { id: receivable.transactionId },
        data: { paymentStatus: "PAID" },
      });
    }

    await logAuditAction({
      farmId: receivable.farmId,
      entityType: "RECEIVABLE_PAYMENT",
      entityId: payment.id,
      action: "CREATE",
      actorId: input.recordedById,
      newValues: {
        paymentId: payment.id,
        amount: payAmount,
        remainingBalance: newBalance,
        status: newStatus,
      },
    });

    return {
      payment,
      updatedReceivable,
    };
  }
}
