import { prisma } from "../prisma";
import { ReceiptDTO, PublicReceiptVerificationDTO } from "../types";
import { QRCodeService } from "./qrCodeService";
import { logAuditAction } from "./auditService";
import crypto from "crypto";
import { format } from "date-fns";

export class ReceiptService {
  /**
   * Generates a globally unique receipt number.
   * Format: FP-YYYYMMDD-XXXXXX (e.g. FP-20260922-000184)
   * Guaranteed unique at the database level.
   */
  static async generateReceiptNumber(
    txDate: Date = new Date(),
    dbClient: any = prisma
  ): Promise<string> {
    const datePrefix = `FP-${format(txDate, "yyyyMMdd")}`;

    for (let attempt = 0; attempt < 10; attempt++) {
      // 6-character random alphanumeric uppercase
      const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
      const candidate = `${datePrefix}-${randomSuffix}`;

      const existing = await dbClient.receipt.findUnique({
        where: { receiptNumber: candidate },
      });

      if (!existing) {
        return candidate;
      }
    }

    // Fallback: timestamp suffix
    return `${datePrefix}-${Date.now().toString().slice(-6)}`;
  }

  /**
   * Automatically creates a unique digital receipt for a successfully committed transaction.
   * Idempotent: returns existing receipt if already generated.
   */
  static async createReceiptForTransaction(
    transactionId: string,
    farmId: string,
    baseUrl?: string,
    dbClient: any = prisma
  ): Promise<ReceiptDTO> {
    // 1. Check existing receipt for this transaction
    const existing = await dbClient.receipt.findUnique({
      where: { transactionId },
      include: {
        farm: true,
        transaction: {
          include: { enterprise: true, category: true, createdBy: true },
        },
      },
    });

    if (existing) {
      const qrCodeDataURL = await QRCodeService.generateQRCodeDataURL(existing.qrPayload);
      return this.mapToDTO(existing, qrCodeDataURL);
    }

    // 2. Fetch transaction details
    const tx = await dbClient.transaction.findUnique({
      where: { id: transactionId },
      include: { farm: true },
    });

    if (!tx) {
      throw new Error(`Transaction with ID ${transactionId} not found.`);
    }

    // 3. Generate unique identifiers
    const receiptNumber = await this.generateReceiptNumber(tx.transactionDate, dbClient);
    const verificationToken = crypto.randomBytes(24).toString("hex");
    const qrPayload = QRCodeService.buildVerificationURL(receiptNumber, baseUrl);

    // 4. Create receipt in DB
    const receipt = await dbClient.receipt.create({
      data: {
        transactionId: tx.id,
        farmId: tx.farmId,
        receiptNumber,
        verificationToken,
        qrPayload,
        status: "VALID",
        issuedAt: new Date(),
        version: 1,
      },
      include: {
        farm: true,
        transaction: {
          include: { enterprise: true, category: true, createdBy: true },
        },
      },
    });

    // 5. Audit Log
    await logAuditAction(
      {
        farmId: tx.farmId,
        entityType: "RECEIPT",
        entityId: receipt.id,
        action: "CREATE",
        actorId: tx.createdById,
        newValues: {
          receiptNumber,
          transactionId: tx.id,
          amount: Number(tx.amount),
          type: tx.type,
        },
      },
      dbClient
    );

    const qrCodeDataURL = await QRCodeService.generateQRCodeDataURL(qrPayload);
    return this.mapToDTO(receipt, qrCodeDataURL);
  }

  /**
   * Public verification query for scanned QR codes.
   * Strips all sensitive information (no emails, phone numbers, passwords, internal IDs, private notes).
   */
  static async getPublicVerification(
    receiptNumber: string
  ): Promise<PublicReceiptVerificationDTO> {
    const cleanNumber = receiptNumber.trim();

    const receipt = await prisma.receipt.findUnique({
      where: { receiptNumber: cleanNumber },
      include: {
        farm: true,
        transaction: {
          include: { enterprise: true, category: true },
        },
      },
    });

    if (!receipt) {
      return {
        isValid: false,
        status: "NOT_FOUND",
        receiptNumber: cleanNumber,
        verificationMessage: "Receipt not found in MavunoFlow registry. Please verify the code or contact the issuing farm.",
      };
    }

    const isVoided = receipt.status === "VOIDED" || receipt.transaction?.isDeleted;

    if (isVoided) {
      return {
        isValid: false,
        status: "VOIDED",
        receiptNumber: receipt.receiptNumber,
        verificationMessage: "Receipt Voided: This transaction receipt has been cancelled or invalidated.",
        farmName: receipt.farm.name,
        locationCounty: receipt.farm.locationCounty,
        transactionType: receipt.transaction?.type as any,
        enterpriseName: receipt.transaction?.enterprise?.name,
        categoryName: receipt.transaction?.category?.name,
        amount: receipt.transaction ? Number(receipt.transaction.amount) : undefined,
        currency: receipt.farm.currency,
        issuedAt: receipt.issuedAt.toISOString(),
        voidedAt: receipt.voidedAt ? receipt.voidedAt.toISOString() : null,
      };
    }

    return {
      isValid: true,
      status: "VALID",
      receiptNumber: receipt.receiptNumber,
      verificationMessage: "Authentic MavunoFlow Digital Receipt",
      farmName: receipt.farm.name,
      locationCounty: receipt.farm.locationCounty,
      transactionType: receipt.transaction.type as any,
      enterpriseName: receipt.transaction.enterprise.name,
      categoryName: receipt.transaction.category.name,
      amount: Number(receipt.transaction.amount),
      currency: receipt.farm.currency,
      paymentMethod: receipt.transaction.paymentMethod as any,
      paymentStatus: receipt.transaction.paymentStatus as any,
      issuedAt: receipt.issuedAt.toISOString(),
      quantity: receipt.transaction.quantity ? Number(receipt.transaction.quantity) : null,
      unit: receipt.transaction.unit,
    };
  }

  /**
   * Internal authenticated receipt retrieval (for viewing, sharing, PDF export).
   */
  static async getReceiptDetails(
    receiptIdOrNumber: string,
    farmId?: string
  ): Promise<ReceiptDTO | null> {
    const where: any = {};
    if (receiptIdOrNumber.startsWith("FP-")) {
      where.receiptNumber = receiptIdOrNumber;
    } else {
      where.id = receiptIdOrNumber;
    }

    if (farmId) {
      where.farmId = farmId;
    }

    const receipt = await prisma.receipt.findFirst({
      where,
      include: {
        farm: true,
        transaction: {
          include: { enterprise: true, category: true, createdBy: true },
        },
      },
    });

    if (!receipt) return null;

    const qrCodeDataURL = await QRCodeService.generateQRCodeDataURL(receipt.qrPayload);
    return this.mapToDTO(receipt, qrCodeDataURL);
  }

  /**
   * Mark a receipt as VOIDED (e.g. when transaction is cancelled or soft-deleted).
   */
  static async voidReceiptForTransaction(
    transactionId: string,
    actorId: string,
    reason?: string
  ): Promise<boolean> {
    const receipt = await prisma.receipt.findUnique({
      where: { transactionId },
    });

    if (!receipt) return false;

    await prisma.receipt.update({
      where: { id: receipt.id },
      data: {
        status: "VOIDED",
        voidedAt: new Date(),
      },
    });

    await logAuditAction({
      farmId: receipt.farmId,
      entityType: "RECEIPT",
      entityId: receipt.id,
      action: "VOID",
      actorId,
      oldValues: { status: receipt.status },
      newValues: { status: "VOIDED", reason, voidedAt: new Date() },
    });

    return true;
  }

  private static mapToDTO(receipt: any, qrCodeDataURL?: string): ReceiptDTO {
    const tx = receipt.transaction;
    return {
      id: receipt.id,
      transactionId: receipt.transactionId,
      farmId: receipt.farmId,
      farmName: receipt.farm?.name,
      locationCounty: receipt.farm?.locationCounty,
      currency: receipt.farm?.currency || "KES",
      receiptNumber: receipt.receiptNumber,
      verificationToken: receipt.verificationToken,
      qrPayload: receipt.qrPayload,
      qrCodeDataURL,
      status: receipt.status as "VALID" | "VOIDED",
      issuedAt: receipt.issuedAt.toISOString(),
      voidedAt: receipt.voidedAt ? receipt.voidedAt.toISOString() : null,
      version: receipt.version,
      transaction: tx
        ? {
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
            receiptId: receipt.id,
            receiptNumber: receipt.receiptNumber,
            receiptStatus: receipt.status as any,
            createdAt: tx.createdAt.toISOString(),
            updatedAt: tx.updatedAt.toISOString(),
          }
        : undefined,
    };
  }
}
