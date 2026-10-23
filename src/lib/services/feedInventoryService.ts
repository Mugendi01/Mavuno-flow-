import { prisma } from "../prisma";
import {
  FeedProductDTO,
  FeedPurchaseDTO,
  FeedStockMovementDTO,
  FeedAlertDTO,
  FeedInventorySummaryDTO,
  FeedStockStatus,
  FeedMovementType,
  FeedAlertType,
} from "../types";
import { LivestockService } from "./livestockService";

export interface CreateFeedProductInput {
  enterpriseId?: string | null;
  name: string;
  feedType: string;
  intendedUse?: string | null;
  storageLocation?: string | null;
  defaultUnit?: string;
  defaultBagWeightKg?: number | null;
  initialStockKg?: number;
  unitCost?: number | null;
  minReserveKg?: number;
  criticalReserveKg?: number;
  reorderQuantityKg?: number | null;
  leadTimeDays?: number | null;
  reminderPeriodDays?: number | null;
  expectedDailyUsageKg?: number | null;
}

export interface CreateFeedPurchaseInput {
  feedProductId: string;
  enterpriseId?: string | null;
  purchaseDate?: string;
  supplierName: string;
  quantity: number;
  unit: string;
  bagWeightKg?: number | null;
  unitPrice: number;
  paymentMethod?: string;
  paymentStatus?: string;
  invoiceRef?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  storageLocation?: string | null;
  status?: "DRAFT" | "RECEIVED" | "CANCELLED";
  notes?: string | null;
}

export interface ManualAdjustmentInput {
  feedProductId: string;
  movementType: "WASTAGE_LOSS" | "RETURN_TO_STOCK" | "MANUAL_ADJUSTMENT";
  quantityKg: number;
  reason: string;
  storageLocation?: string | null;
}

export class FeedInventoryService {
  /**
   * Helper to compute average daily consumption for a feed product based on recent issues (last 14 days).
   */
  static async getAverageDailyConsumptionKg(
    farmId: string,
    feedProductId: string,
    fallbackUsage?: number | null,
    dbClient: any = prisma
  ): Promise<number | null> {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const feedRecords = await dbClient.feedRecord.findMany({
      where: {
        farmId,
        feedProductId,
        date: { gte: fourteenDaysAgo },
      },
      select: { quantityIssuedKg: true, quantityConsumedKg: true },
    });

    if (feedRecords.length === 0) {
      return fallbackUsage && fallbackUsage > 0 ? fallbackUsage : null;
    }

    const totalIssued = feedRecords.reduce(
      (sum: number, r: { quantityIssuedKg: number }) => sum + r.quantityIssuedKg,
      0
    );
    const avg = totalIssued / 14;
    return avg > 0 ? Math.round(avg * 100) / 100 : null;
  }

  /**
   * Evaluate and maintain active alerts for a single feed product.
   * Auto-resolves alerts when stock replenishes, prevents duplicate active alerts,
   * and escalates between LOW_STOCK, CRITICAL_STOCK, OUT_OF_STOCK, and REPLENISHMENT_REMINDER.
   */
  static async evaluateProductAlerts(
    farmId: string,
    productId: string,
    dbClient: any = prisma
  ): Promise<void> {
    const product = await dbClient.feedProduct.findFirst({
      where: { id: productId, farmId },
    });
    if (!product || product.status === "ARCHIVED") return;

    const avgDaily = await this.getAverageDailyConsumptionKg(
      farmId,
      productId,
      product.expectedDailyUsageKg,
      dbClient
    );

    let daysRemaining: number | null = null;
    if (avgDaily && avgDaily > 0) {
      daysRemaining = Math.max(0, Math.round((product.currentStockKg / avgDaily) * 10) / 10);
    }

    let alertType: FeedAlertType | null = null;
    let severity: "INFO" | "WARNING" | "CRITICAL" = "INFO";
    let message = "";

    const leadTime = product.leadTimeDays || 3;
    const reminderBuffer = product.reminderPeriodDays || 2;
    const triggerDays = leadTime + reminderBuffer;

    if (product.currentStockKg <= 0) {
      alertType = "OUT_OF_STOCK";
      severity = "CRITICAL";
      message = `Critical: ${product.name} is completely out of stock (0 kg available)! Livestock issues blocked.`;
    } else if (product.currentStockKg <= product.criticalReserveKg) {
      alertType = "CRITICAL_STOCK";
      severity = "CRITICAL";
      message = `Critical Stock: ${product.name} has only ${product.currentStockKg.toFixed(1)} kg remaining, below critical threshold of ${product.criticalReserveKg} kg. Immediate replenishment needed!`;
    } else if (product.currentStockKg <= product.minReserveKg) {
      alertType = "LOW_STOCK";
      severity = "WARNING";
      message = `Low Stock Warning: ${product.name} has fallen below minimum reserve (${product.currentStockKg.toFixed(1)} kg remaining, reserve: ${product.minReserveKg} kg).`;
    } else if (daysRemaining !== null && daysRemaining <= triggerDays) {
      alertType = "REPLENISHMENT_REMINDER";
      severity = "INFO";
      message = `Replenishment Reminder: ${product.name} has ~${daysRemaining} days of stock remaining (${product.currentStockKg.toFixed(1)} kg). Expected delivery lead time is ${leadTime} days.`;
    }

    // Find any existing active/acknowledged alerts for this product
    const existingAlerts = await dbClient.feedAlert.findMany({
      where: {
        farmId,
        feedProductId: productId,
        status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
      },
    });

    if (!alertType) {
      // Stock is healthy — auto-resolve any active alerts
      if (existingAlerts.length > 0) {
        await dbClient.feedAlert.updateMany({
          where: {
            farmId,
            feedProductId: productId,
            status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
          },
          data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
          },
        });
      }
      return;
    }

    // An alert is required. Check if an active alert with the exact same alertType already exists
    const matchingAlert = existingAlerts.find((a: { alertType: string }) => a.alertType === alertType);

    if (matchingAlert) {
      // Update the existing alert without creating a duplicate
      await dbClient.feedAlert.update({
        where: { id: matchingAlert.id },
        data: {
          message,
          currentStockKg: product.currentStockKg,
          thresholdKg:
            alertType === "OUT_OF_STOCK"
              ? 0
              : alertType === "CRITICAL_STOCK"
              ? product.criticalReserveKg
              : alertType === "LOW_STOCK"
              ? product.minReserveKg
              : null,
          daysRemaining,
        },
      });

      // Resolve any older alerts of a different type (e.g. stock dropped from LOW_STOCK to CRITICAL_STOCK)
      const otherAlerts = existingAlerts.filter((a: { id: string }) => a.id !== matchingAlert.id);
      if (otherAlerts.length > 0) {
        await dbClient.feedAlert.updateMany({
          where: { id: { in: otherAlerts.map((a: { id: string }) => a.id) } },
          data: { status: "RESOLVED", resolvedAt: new Date() },
        });
      }
    } else {
      // Resolve any existing alert of a different type
      if (existingAlerts.length > 0) {
        await dbClient.feedAlert.updateMany({
          where: { id: { in: existingAlerts.map((a: { id: string }) => a.id) } },
          data: { status: "RESOLVED", resolvedAt: new Date() },
        });
      }

      // Create new active alert
      await dbClient.feedAlert.create({
        data: {
          farmId,
          feedProductId: productId,
          alertType,
          severity,
          message,
          currentStockKg: product.currentStockKg,
          thresholdKg:
            alertType === "OUT_OF_STOCK"
              ? 0
              : alertType === "CRITICAL_STOCK"
              ? product.criticalReserveKg
              : alertType === "LOW_STOCK"
              ? product.minReserveKg
              : null,
          daysRemaining,
          status: "ACTIVE",
        },
      });
    }
  }

  // ==========================================
  // FEED PRODUCTS & INVENTORY ITEMS
  // ==========================================

  static async getFeedProducts(
    farmId: string,
    options?: {
      enterpriseId?: string;
      feedType?: string;
      status?: string;
    }
  ): Promise<FeedProductDTO[]> {
    const where: any = { farmId };
    if (options?.enterpriseId) where.enterpriseId = options.enterpriseId;
    if (options?.feedType) where.feedType = options.feedType;
    if (options?.status) {
      where.status = options.status;
    } else {
      where.status = { not: "ARCHIVED" };
    }

    const products = await prisma.feedProduct.findMany({
      where,
      include: {
        enterprise: true,
        purchases: {
          where: { status: "RECEIVED" },
          select: { quantityKg: true, totalCost: true },
        },
        feedRecords: {
          select: { quantityIssuedKg: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const result: FeedProductDTO[] = [];

    for (const p of products) {
      const avgDaily = await this.getAverageDailyConsumptionKg(
        farmId,
        p.id,
        p.expectedDailyUsageKg
      );

      let daysRemaining: number | null = null;
      if (avgDaily && avgDaily > 0) {
        daysRemaining = Math.max(0, Math.round((p.currentStockKg / avgDaily) * 10) / 10);
      }

      let stockStatus: FeedStockStatus = "IN_STOCK";
      if (p.currentStockKg <= 0) {
        stockStatus = "OUT_OF_STOCK";
      } else if (p.currentStockKg <= p.criticalReserveKg) {
        stockStatus = "CRITICAL_STOCK";
      } else if (p.currentStockKg <= p.minReserveKg) {
        stockStatus = "LOW_STOCK";
      }

      const totalPurchasedKg = p.purchases.reduce((sum, item) => sum + item.quantityKg, 0);
      const totalIssuedKg = p.feedRecords.reduce((sum, item) => sum + item.quantityIssuedKg, 0);
      const totalStockValue = Math.round(p.currentStockKg * (p.unitCost || 0));

      result.push({
        id: p.id,
        farmId: p.farmId,
        enterpriseId: p.enterpriseId,
        enterpriseName: p.enterprise?.name,
        name: p.name,
        feedType: p.feedType,
        intendedUse: p.intendedUse,
        storageLocation: p.storageLocation,
        defaultUnit: p.defaultUnit,
        defaultBagWeightKg: p.defaultBagWeightKg,
        currentStockKg: p.currentStockKg,
        unitCost: p.unitCost,
        minReserveKg: p.minReserveKg,
        criticalReserveKg: p.criticalReserveKg,
        reorderQuantityKg: p.reorderQuantityKg,
        leadTimeDays: p.leadTimeDays,
        reminderPeriodDays: p.reminderPeriodDays,
        expectedDailyUsageKg: p.expectedDailyUsageKg,
        status: p.status as "ACTIVE" | "ARCHIVED",
        daysRemaining,
        stockStatus,
        totalPurchasedKg,
        totalIssuedKg,
        totalStockValue,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      });
    }

    return result;
  }

  static async getFeedProductById(
    farmId: string,
    productId: string
  ): Promise<FeedProductDTO | null> {
    const p = await prisma.feedProduct.findFirst({
      where: { id: productId, farmId },
      include: {
        enterprise: true,
        purchases: {
          where: { status: "RECEIVED" },
          select: { quantityKg: true, totalCost: true },
        },
        feedRecords: {
          select: { quantityIssuedKg: true },
        },
      },
    });
    if (!p) return null;

    const avgDaily = await this.getAverageDailyConsumptionKg(
      farmId,
      p.id,
      p.expectedDailyUsageKg
    );

    let daysRemaining: number | null = null;
    if (avgDaily && avgDaily > 0) {
      daysRemaining = Math.max(0, Math.round((p.currentStockKg / avgDaily) * 10) / 10);
    }

    let stockStatus: FeedStockStatus = "IN_STOCK";
    if (p.currentStockKg <= 0) {
      stockStatus = "OUT_OF_STOCK";
    } else if (p.currentStockKg <= p.criticalReserveKg) {
      stockStatus = "CRITICAL_STOCK";
    } else if (p.currentStockKg <= p.minReserveKg) {
      stockStatus = "LOW_STOCK";
    }

    const totalPurchasedKg = p.purchases.reduce((sum, item) => sum + item.quantityKg, 0);
    const totalIssuedKg = p.feedRecords.reduce((sum, item) => sum + item.quantityIssuedKg, 0);
    const totalStockValue = Math.round(p.currentStockKg * (p.unitCost || 0));

    return {
      id: p.id,
      farmId: p.farmId,
      enterpriseId: p.enterpriseId,
      enterpriseName: p.enterprise?.name,
      name: p.name,
      feedType: p.feedType,
      intendedUse: p.intendedUse,
      storageLocation: p.storageLocation,
      defaultUnit: p.defaultUnit,
      defaultBagWeightKg: p.defaultBagWeightKg,
      currentStockKg: p.currentStockKg,
      unitCost: p.unitCost,
      minReserveKg: p.minReserveKg,
      criticalReserveKg: p.criticalReserveKg,
      reorderQuantityKg: p.reorderQuantityKg,
      leadTimeDays: p.leadTimeDays,
      reminderPeriodDays: p.reminderPeriodDays,
      expectedDailyUsageKg: p.expectedDailyUsageKg,
      status: p.status as "ACTIVE" | "ARCHIVED",
      daysRemaining,
      stockStatus,
      totalPurchasedKg,
      totalIssuedKg,
      totalStockValue,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  static async createFeedProduct(
    farmId: string,
    userId: string,
    input: CreateFeedProductInput
  ): Promise<FeedProductDTO> {
    if (!input.name || !input.name.trim()) {
      throw new Error("Feed product name is required.");
    }
    if (!input.feedType || !input.feedType.trim()) {
      throw new Error("Feed type is required.");
    }

    if (input.enterpriseId) {
      const ent = await prisma.enterprise.findFirst({
        where: { id: input.enterpriseId, farmId },
      });
      if (!ent) {
        throw new Error("Invalid enterprise selected or unauthorized for this farm.");
      }
    }

    const initialStock = Math.max(0, input.initialStockKg || 0);

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.feedProduct.create({
        data: {
          farmId,
          enterpriseId: input.enterpriseId || null,
          name: input.name.trim(),
          feedType: input.feedType.trim(),
          intendedUse: input.intendedUse?.trim() || null,
          storageLocation: input.storageLocation?.trim() || "Main Feed Store",
          defaultUnit: input.defaultUnit?.trim() || "kg",
          defaultBagWeightKg: input.defaultBagWeightKg ?? 50,
          currentStockKg: initialStock,
          unitCost: input.unitCost ?? 0,
          minReserveKg: input.minReserveKg ?? 100,
          criticalReserveKg: input.criticalReserveKg ?? 30,
          reorderQuantityKg: input.reorderQuantityKg ?? null,
          leadTimeDays: input.leadTimeDays ?? 3,
          reminderPeriodDays: input.reminderPeriodDays ?? 2,
          expectedDailyUsageKg: input.expectedDailyUsageKg ?? null,
          status: "ACTIVE",
        },
        include: { enterprise: true },
      });

      if (initialStock > 0) {
        await tx.feedStockMovement.create({
          data: {
            farmId,
            feedProductId: created.id,
            movementType: "MANUAL_ADJUSTMENT",
            quantityKg: initialStock,
            previousStockKg: 0,
            resultingStockKg: initialStock,
            unitCost: input.unitCost ?? 0,
            totalValue: initialStock * (input.unitCost ?? 0),
            storageLocation: created.storageLocation,
            createdById: userId,
            reason: "Initial stock / Opening balance",
          },
        });
      }

      await this.evaluateProductAlerts(farmId, created.id, tx);
      return created;
    });

    const full = await this.getFeedProductById(farmId, product.id);
    return full!;
  }

  static async updateFeedProduct(
    farmId: string,
    productId: string,
    input: Partial<CreateFeedProductInput>
  ): Promise<FeedProductDTO> {
    const existing = await prisma.feedProduct.findFirst({
      where: { id: productId, farmId },
    });
    if (!existing) {
      throw new Error("Feed product not found or unauthorized.");
    }

    const data: any = {};
    if (input.name) data.name = input.name.trim();
    if (input.feedType) data.feedType = input.feedType.trim();
    if (input.intendedUse !== undefined) data.intendedUse = input.intendedUse?.trim() || null;
    if (input.storageLocation !== undefined)
      data.storageLocation = input.storageLocation?.trim() || "Main Feed Store";
    if (input.defaultUnit) data.defaultUnit = input.defaultUnit.trim();
    if (input.defaultBagWeightKg !== undefined)
      data.defaultBagWeightKg = input.defaultBagWeightKg;
    if (input.unitCost !== undefined) data.unitCost = input.unitCost;
    if (input.minReserveKg !== undefined) data.minReserveKg = Math.max(0, input.minReserveKg);
    if (input.criticalReserveKg !== undefined)
      data.criticalReserveKg = Math.max(0, input.criticalReserveKg);
    if (input.reorderQuantityKg !== undefined)
      data.reorderQuantityKg = input.reorderQuantityKg;
    if (input.leadTimeDays !== undefined) data.leadTimeDays = input.leadTimeDays;
    if (input.reminderPeriodDays !== undefined)
      data.reminderPeriodDays = input.reminderPeriodDays;
    if (input.expectedDailyUsageKg !== undefined)
      data.expectedDailyUsageKg = input.expectedDailyUsageKg;

    await prisma.$transaction(async (tx) => {
      await tx.feedProduct.update({
        where: { id: productId },
        data,
      });
      await this.evaluateProductAlerts(farmId, productId, tx);
    });

    const full = await this.getFeedProductById(farmId, productId);
    return full!;
  }

  static async archiveFeedProduct(farmId: string, productId: string): Promise<boolean> {
    const existing = await prisma.feedProduct.findFirst({
      where: { id: productId, farmId },
    });
    if (!existing) {
      throw new Error("Feed product not found or unauthorized.");
    }

    await prisma.feedProduct.update({
      where: { id: productId },
      data: { status: "ARCHIVED" },
    });
    return true;
  }

  // ==========================================
  // FEED PURCHASES
  // ==========================================

  static async recordPurchase(
    farmId: string,
    userId: string,
    input: CreateFeedPurchaseInput
  ): Promise<FeedPurchaseDTO> {
    if (!input.quantity || input.quantity <= 0) {
      throw new Error("Quantity purchased must be greater than zero.");
    }
    if (input.unitPrice === undefined || input.unitPrice < 0) {
      throw new Error("Unit price must be non-negative.");
    }
    if (!input.supplierName || !input.supplierName.trim()) {
      throw new Error("Supplier name is required.");
    }

    const product = await prisma.feedProduct.findFirst({
      where: { id: input.feedProductId, farmId },
    });
    if (!product) {
      throw new Error("Invalid feed product selected or unauthorized for this farm.");
    }

    const quantityKg = LivestockService.normalizeFeedQuantity(
      input.quantity,
      input.unit,
      input.bagWeightKg ?? product.defaultBagWeightKg
    );

    const totalCost = Math.round(input.quantity * input.unitPrice * 100) / 100;
    const status = input.status || "RECEIVED";

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.feedPurchase.create({
        data: {
          farmId,
          feedProductId: product.id,
          enterpriseId: input.enterpriseId || product.enterpriseId || null,
          purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : new Date(),
          supplierName: input.supplierName.trim(),
          quantity: input.quantity,
          unit: input.unit.trim(),
          bagWeightKg: input.bagWeightKg ?? product.defaultBagWeightKg,
          quantityKg,
          unitPrice: input.unitPrice,
          totalCost,
          paymentMethod: input.paymentMethod || "MPESA",
          paymentStatus: input.paymentStatus || "PAID",
          invoiceRef: input.invoiceRef?.trim() || null,
          batchNumber: input.batchNumber?.trim() || null,
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
          storageLocation: input.storageLocation?.trim() || product.storageLocation,
          status,
          receivedAt: status === "RECEIVED" ? new Date() : null,
          receivedQuantityKg: status === "RECEIVED" ? quantityKg : null,
          createdById: userId,
          notes: input.notes?.trim() || null,
        },
        include: {
          feedProduct: true,
          enterprise: true,
          createdBy: true,
        },
      });

      // If purchase is confirmed & received, atomically increase inventory
      if (status === "RECEIVED") {
        const previousStock = product.currentStockKg;
        const resultingStock = previousStock + quantityKg;

        // Calculate weighted average unit cost per kg
        const currentVal = previousStock * (product.unitCost || 0);
        const addedVal = totalCost;
        const newUnitCost =
          resultingStock > 0 ? (currentVal + addedVal) / resultingStock : product.unitCost || 0;

        await tx.feedProduct.update({
          where: { id: product.id },
          data: {
            currentStockKg: resultingStock,
            unitCost: Math.round(newUnitCost * 100) / 100,
          },
        });

        await tx.feedStockMovement.create({
          data: {
            farmId,
            feedProductId: product.id,
            movementType: "PURCHASE_RECEIPT",
            quantityKg,
            previousStockKg: previousStock,
            resultingStockKg: resultingStock,
            feedPurchaseId: created.id,
            unitCost: Math.round(newUnitCost * 100) / 100,
            totalValue: totalCost,
            storageLocation: created.storageLocation,
            createdById: userId,
            reason: `Feed purchase from ${created.supplierName}`,
          },
        });

        await this.evaluateProductAlerts(farmId, product.id, tx);
      }

      return created;
    });

    return {
      id: purchase.id,
      farmId: purchase.farmId,
      feedProductId: purchase.feedProductId,
      feedProductName: purchase.feedProduct.name,
      enterpriseId: purchase.enterpriseId,
      enterpriseName: purchase.enterprise?.name,
      purchaseDate: purchase.purchaseDate.toISOString(),
      supplierName: purchase.supplierName,
      quantity: purchase.quantity,
      unit: purchase.unit,
      bagWeightKg: purchase.bagWeightKg,
      quantityKg: purchase.quantityKg,
      unitPrice: purchase.unitPrice,
      totalCost: purchase.totalCost,
      paymentMethod: purchase.paymentMethod,
      paymentStatus: purchase.paymentStatus,
      invoiceRef: purchase.invoiceRef,
      batchNumber: purchase.batchNumber,
      expiryDate: purchase.expiryDate ? purchase.expiryDate.toISOString() : null,
      storageLocation: purchase.storageLocation,
      status: purchase.status as any,
      receivedAt: purchase.receivedAt ? purchase.receivedAt.toISOString() : null,
      receivedQuantityKg: purchase.receivedQuantityKg,
      createdById: purchase.createdById,
      createdByName: purchase.createdBy.fullName,
      notes: purchase.notes,
      createdAt: purchase.createdAt.toISOString(),
    };
  }

  static async getPurchases(
    farmId: string,
    options?: {
      feedProductId?: string;
      enterpriseId?: string;
      status?: string;
      limit?: number;
    }
  ): Promise<FeedPurchaseDTO[]> {
    const where: any = { farmId };
    if (options?.feedProductId) where.feedProductId = options.feedProductId;
    if (options?.enterpriseId) where.enterpriseId = options.enterpriseId;
    if (options?.status) where.status = options.status;

    const purchases = await prisma.feedPurchase.findMany({
      where,
      include: {
        feedProduct: true,
        enterprise: true,
        createdBy: true,
      },
      orderBy: { purchaseDate: "desc" },
      take: options?.limit || 100,
    });

    return purchases.map((p) => ({
      id: p.id,
      farmId: p.farmId,
      feedProductId: p.feedProductId,
      feedProductName: p.feedProduct.name,
      enterpriseId: p.enterpriseId,
      enterpriseName: p.enterprise?.name,
      purchaseDate: p.purchaseDate.toISOString(),
      supplierName: p.supplierName,
      quantity: p.quantity,
      unit: p.unit,
      bagWeightKg: p.bagWeightKg,
      quantityKg: p.quantityKg,
      unitPrice: p.unitPrice,
      totalCost: p.totalCost,
      paymentMethod: p.paymentMethod,
      paymentStatus: p.paymentStatus,
      invoiceRef: p.invoiceRef,
      batchNumber: p.batchNumber,
      expiryDate: p.expiryDate ? p.expiryDate.toISOString() : null,
      storageLocation: p.storageLocation,
      status: p.status as any,
      receivedAt: p.receivedAt ? p.receivedAt.toISOString() : null,
      receivedQuantityKg: p.receivedQuantityKg,
      createdById: p.createdById,
      createdByName: p.createdBy.fullName,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  static async cancelPurchase(
    farmId: string,
    userId: string,
    purchaseId: string,
    reason?: string
  ): Promise<boolean> {
    const purchase = await prisma.feedPurchase.findFirst({
      where: { id: purchaseId, farmId },
      include: { feedProduct: true },
    });
    if (!purchase) {
      throw new Error("Purchase record not found or unauthorized.");
    }
    if (purchase.status === "CANCELLED") {
      throw new Error("Purchase is already cancelled.");
    }

    await prisma.$transaction(async (tx) => {
      // If purchase was already received into inventory, reverse the stock addition
      if (purchase.status === "RECEIVED") {
        const product = await tx.feedProduct.findUnique({
          where: { id: purchase.feedProductId },
        });
        if (!product) throw new Error("Related feed product not found.");

        const previousStock = product.currentStockKg;
        const deductionKg = purchase.quantityKg;
        const resultingStock = Math.max(0, previousStock - deductionKg);

        await tx.feedProduct.update({
          where: { id: product.id },
          data: { currentStockKg: resultingStock },
        });

        await tx.feedStockMovement.create({
          data: {
            farmId,
            feedProductId: product.id,
            movementType: "PURCHASE_REVERSAL",
            quantityKg: -deductionKg,
            previousStockKg: previousStock,
            resultingStockKg: resultingStock,
            feedPurchaseId: purchase.id,
            unitCost: product.unitCost,
            totalValue: deductionKg * (product.unitCost || 0),
            storageLocation: purchase.storageLocation,
            createdById: userId,
            reason: reason?.trim() || `Reversal of purchase from ${purchase.supplierName}`,
          },
        });

        await this.evaluateProductAlerts(farmId, product.id, tx);
      }

      await tx.feedPurchase.update({
        where: { id: purchaseId },
        data: { status: "CANCELLED" },
      });
    });

    return true;
  }

  // ==========================================
  // STOCK DEDUCTION ATOMICS & ADJUSTMENTS
  // ==========================================

  /**
   * Atomically validates available stock and records deduction when feed is issued to livestock.
   * Throws an explicit error if available stock is insufficient to prevent negative stock balances.
   */
  static async recordFeedIssueDeduction(
    farmId: string,
    userId: string,
    params: {
      feedProductId: string;
      feedRecordId: string;
      quantityIssuedKg: number;
      storageLocation?: string | null;
      tx?: any;
    }
  ): Promise<{ previousStockKg: number; resultingStockKg: number }> {
    const execute = async (tx: any) => {
      const product = await tx.feedProduct.findFirst({
        where: { id: params.feedProductId, farmId },
      });
      if (!product) {
        throw new Error("Specified feed inventory product not found.");
      }

      if (product.currentStockKg < params.quantityIssuedKg) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available stock is ${product.currentStockKg.toFixed(
            1
          )} kg, but ${params.quantityIssuedKg.toFixed(
            1
          )} kg was requested. Please replenish stock or adjust issued quantity.`
        );
      }

      const previousStockKg = product.currentStockKg;
      const resultingStockKg = Math.round((previousStockKg - params.quantityIssuedKg) * 100) / 100;

      await tx.feedProduct.update({
        where: { id: product.id },
        data: { currentStockKg: resultingStockKg },
      });

      await tx.feedStockMovement.create({
        data: {
          farmId,
          feedProductId: product.id,
          movementType: "FEED_ISSUE",
          quantityKg: -params.quantityIssuedKg,
          previousStockKg,
          resultingStockKg,
          feedRecordId: params.feedRecordId,
          unitCost: product.unitCost,
          totalValue: Math.round(params.quantityIssuedKg * (product.unitCost || 0) * 100) / 100,
          storageLocation: params.storageLocation || product.storageLocation,
          createdById: userId,
          reason: "Daily ration issued to livestock",
        },
      });

      await this.evaluateProductAlerts(farmId, product.id, tx);
      return { previousStockKg, resultingStockKg };
    };

    if (params.tx) {
      return execute(params.tx);
    } else {
      return prisma.$transaction(execute);
    }
  }

  /**
   * Record a manual stock adjustment (wastage/loss, return to stock, or reconciliation).
   * Strictly verifies that stock cannot become negative.
   */
  static async recordManualAdjustment(
    farmId: string,
    userId: string,
    input: ManualAdjustmentInput
  ): Promise<FeedStockMovementDTO> {
    if (!input.quantityKg || input.quantityKg <= 0) {
      throw new Error("Adjustment quantity must be greater than zero.");
    }
    if (!input.reason || !input.reason.trim()) {
      throw new Error("A clear reason is required for manual stock adjustments.");
    }

    const product = await prisma.feedProduct.findFirst({
      where: { id: input.feedProductId, farmId },
    });
    if (!product) {
      throw new Error("Feed product not found or unauthorized.");
    }

    const movement = await prisma.$transaction(async (tx) => {
      let deltaKg = 0;
      if (input.movementType === "WASTAGE_LOSS") {
        deltaKg = -input.quantityKg;
      } else if (input.movementType === "RETURN_TO_STOCK") {
        deltaKg = input.quantityKg;
      } else {
        // Manual adjustment - quantityKg can be positive or negative based on reason
        deltaKg = input.quantityKg;
      }

      const previousStock = product.currentStockKg;
      const resultingStock = previousStock + deltaKg;

      if (resultingStock < 0) {
        throw new Error(
          `Adjustment rejected: resulting stock (${resultingStock.toFixed(
            1
          )} kg) cannot be negative. Current available: ${previousStock.toFixed(1)} kg.`
        );
      }

      await tx.feedProduct.update({
        where: { id: product.id },
        data: { currentStockKg: Math.round(resultingStock * 100) / 100 },
      });

      const mov = await tx.feedStockMovement.create({
        data: {
          farmId,
          feedProductId: product.id,
          movementType: input.movementType,
          quantityKg: deltaKg,
          previousStockKg: previousStock,
          resultingStockKg: Math.round(resultingStock * 100) / 100,
          unitCost: product.unitCost,
          totalValue: Math.round(Math.abs(deltaKg) * (product.unitCost || 0) * 100) / 100,
          storageLocation: input.storageLocation?.trim() || product.storageLocation,
          createdById: userId,
          reason: input.reason.trim(),
        },
        include: {
          feedProduct: true,
          createdBy: true,
        },
      });

      await this.evaluateProductAlerts(farmId, product.id, tx);
      return mov;
    });

    return {
      id: movement.id,
      farmId: movement.farmId,
      feedProductId: movement.feedProductId,
      feedProductName: movement.feedProduct.name,
      movementType: movement.movementType as FeedMovementType,
      quantityKg: movement.quantityKg,
      previousStockKg: movement.previousStockKg,
      resultingStockKg: movement.resultingStockKg,
      feedPurchaseId: movement.feedPurchaseId,
      feedRecordId: movement.feedRecordId,
      unitCost: movement.unitCost,
      totalValue: movement.totalValue,
      storageLocation: movement.storageLocation,
      createdById: movement.createdById,
      createdByName: movement.createdBy.fullName,
      reason: movement.reason,
      createdAt: movement.createdAt.toISOString(),
    };
  }

  static async getStockMovements(
    farmId: string,
    options?: {
      feedProductId?: string;
      movementType?: string;
      limit?: number;
    }
  ): Promise<FeedStockMovementDTO[]> {
    const where: any = { farmId };
    if (options?.feedProductId) where.feedProductId = options.feedProductId;
    if (options?.movementType) where.movementType = options.movementType;

    const movements = await prisma.feedStockMovement.findMany({
      where,
      include: {
        feedProduct: true,
        createdBy: true,
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 100,
    });

    return movements.map((m) => ({
      id: m.id,
      farmId: m.farmId,
      feedProductId: m.feedProductId,
      feedProductName: m.feedProduct.name,
      movementType: m.movementType as FeedMovementType,
      quantityKg: m.quantityKg,
      previousStockKg: m.previousStockKg,
      resultingStockKg: m.resultingStockKg,
      feedPurchaseId: m.feedPurchaseId,
      feedRecordId: m.feedRecordId,
      unitCost: m.unitCost,
      totalValue: m.totalValue,
      storageLocation: m.storageLocation,
      createdById: m.createdById,
      createdByName: m.createdBy.fullName,
      reason: m.reason,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  // ==========================================
  // ALERTS & NOTIFICATIONS
  // ==========================================

  static async getActiveAlerts(farmId: string): Promise<FeedAlertDTO[]> {
    // Re-evaluate alerts for all products in this farm first to ensure up-to-date state
    const products = await prisma.feedProduct.findMany({
      where: { farmId, status: "ACTIVE" },
      select: { id: true },
    });
    for (const p of products) {
      await this.evaluateProductAlerts(farmId, p.id);
    }

    const alerts = await prisma.feedAlert.findMany({
      where: {
        farmId,
        status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
      },
      include: { feedProduct: true },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });

    return alerts.map((a) => ({
      id: a.id,
      farmId: a.farmId,
      feedProductId: a.feedProductId,
      feedProductName: a.feedProduct.name,
      alertType: a.alertType as FeedAlertType,
      severity: a.severity as "INFO" | "WARNING" | "CRITICAL",
      message: a.message,
      currentStockKg: a.currentStockKg,
      thresholdKg: a.thresholdKg,
      daysRemaining: a.daysRemaining,
      status: a.status as any,
      acknowledgedAt: a.acknowledgedAt ? a.acknowledgedAt.toISOString() : null,
      resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }

  static async acknowledgeAlert(farmId: string, alertId: string): Promise<boolean> {
    const alert = await prisma.feedAlert.findFirst({
      where: { id: alertId, farmId },
    });
    if (!alert) {
      throw new Error("Alert not found or unauthorized.");
    }

    await prisma.feedAlert.update({
      where: { id: alertId },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
      },
    });
    return true;
  }

  static async resolveAlert(farmId: string, alertId: string): Promise<boolean> {
    const alert = await prisma.feedAlert.findFirst({
      where: { id: alertId, farmId },
    });
    if (!alert) {
      throw new Error("Alert not found or unauthorized.");
    }

    await prisma.feedAlert.update({
      where: { id: alertId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });
    return true;
  }

  // ==========================================
  // INVENTORY SUMMARY & KPI DASHBOARD
  // ==========================================

  static async getInventorySummary(farmId: string): Promise<FeedInventorySummaryDTO> {
    const products = await this.getFeedProducts(farmId);
    const activeAlerts = await prisma.feedAlert.count({
      where: { farmId, status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
    });
    const recentPurchases = await prisma.feedPurchase.count({
      where: {
        farmId,
        purchaseDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    let totalAvailableStockKg = 0;
    let totalStockValueKes = 0;
    let productsBelowReserve = 0;
    let productsCriticallyLowOrOut = 0;

    for (const p of products) {
      totalAvailableStockKg += p.currentStockKg;
      totalStockValueKes += p.totalStockValue || 0;
      if (p.stockStatus === "LOW_STOCK") productsBelowReserve++;
      if (p.stockStatus === "CRITICAL_STOCK" || p.stockStatus === "OUT_OF_STOCK") {
        productsCriticallyLowOrOut++;
      }
    }

    return {
      totalProductsTracked: products.length,
      totalAvailableStockKg: Math.round(totalAvailableStockKg * 10) / 10,
      totalStockValueKes: Math.round(totalStockValueKes),
      productsBelowReserve,
      productsCriticallyLowOrOut,
      activeAlertsCount: activeAlerts,
      recentPurchasesCount: recentPurchases,
    };
  }
}
