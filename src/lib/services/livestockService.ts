import { prisma } from "../prisma";
import {
  LivestockGroupDTO,
  FeedRecordDTO,
  ProductionRecordDTO,
  LivestockAnalyticsDTO,
  LivestockSpecies,
} from "../types";
import { subDays, differenceInDays, format, parseISO } from "date-fns";

export interface CreateLivestockGroupInput {
  enterpriseId: string;
  name: string;
  species: LivestockSpecies | string;
  breed?: string | null;
  productionStage?: string | null;
  initialCount: number;
  currentCount?: number;
  startDate?: string;
  notes?: string | null;
}

export interface CreateFeedRecordInput {
  enterpriseId: string;
  livestockGroupId?: string | null;
  feedProductId?: string | null;
  date: string;
  feedType: string;
  quantityIssued: number;
  unit: string;
  bagWeightKg?: number | null;
  quantityConsumed?: number | null;
  quantityWasted?: number | null;
  feedCost?: number | null;
  notes?: string | null;
}

export interface CreateProductionRecordInput {
  enterpriseId: string;
  livestockGroupId?: string | null;
  date: string;
  metric: string;
  quantity: number;
  unit: string;
  secondaryQuantity?: number | null;
  qualityGrade?: string | null;
  quantitySold?: number | null;
  quantityFarmUse?: number | null;
  notes?: string | null;
}

export class LivestockService {
  /**
   * Convert any recorded feed unit into normalized Kilograms (kg).
   * Supports kg, g, litres, bags (with custom bag weight), bales, and tonnes.
   */
  static normalizeFeedQuantity(
    quantity: number,
    unit: string,
    bagWeightKg?: number | null
  ): number {
    if (!quantity || quantity <= 0) return 0;
    const u = unit.toLowerCase().trim();

    if (u === "kg" || u === "kilogram" || u === "kilograms") {
      return quantity;
    }
    if (u === "g" || u === "gram" || u === "grams") {
      return quantity / 1000;
    }
    if (u === "bag" || u === "bags") {
      const perBag = bagWeightKg && bagWeightKg > 0 ? bagWeightKg : 50;
      return quantity * perBag;
    }
    if (u === "bale" || u === "bales") {
      const perBale = bagWeightKg && bagWeightKg > 0 ? bagWeightKg : 15;
      return quantity * perBale;
    }
    if (u === "tonne" || u === "tonnes" || u === "ton" || u === "tons") {
      return quantity * 1000;
    }
    if (u === "litre" || u === "litres" || u === "l") {
      return quantity; // Approximate 1L ~ 1kg for liquid feed & milk replacer
    }

    return quantity;
  }

  // ==========================================
  // LIVESTOCK GROUPS / BATCHES
  // ==========================================

  static async getLivestockGroups(
    farmId: string,
    options?: {
      enterpriseId?: string;
      species?: string;
      status?: string;
    }
  ): Promise<LivestockGroupDTO[]> {
    const where: any = { farmId };
    if (options?.enterpriseId) where.enterpriseId = options.enterpriseId;
    if (options?.species) where.species = options.species;
    if (options?.status) {
      where.status = options.status;
    } else {
      where.status = { not: "ARCHIVED" };
    }

    const groups = await prisma.livestockGroup.findMany({
      where,
      include: {
        enterprise: true,
        _count: {
          select: { feedRecords: true, productionRecords: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return groups.map((g) => ({
      id: g.id,
      farmId: g.farmId,
      enterpriseId: g.enterpriseId,
      enterpriseName: g.enterprise.name,
      name: g.name,
      species: g.species,
      breed: g.breed,
      productionStage: g.productionStage,
      initialCount: g.initialCount,
      currentCount: g.currentCount,
      startDate: g.startDate.toISOString(),
      status: g.status as any,
      notes: g.notes,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      _count: g._count,
    }));
  }

  static async createLivestockGroup(
    farmId: string,
    input: CreateLivestockGroupInput
  ): Promise<LivestockGroupDTO> {
    const enterprise = await prisma.enterprise.findFirst({
      where: { id: input.enterpriseId, farmId },
    });
    if (!enterprise) {
      throw new Error("Invalid enterprise selected or unauthorized for this farm.");
    }

    const initial = Math.max(0, input.initialCount || 0);
    const current = input.currentCount !== undefined ? Math.max(0, input.currentCount) : initial;

    const group = await prisma.livestockGroup.create({
      data: {
        farmId,
        enterpriseId: enterprise.id,
        name: input.name.trim(),
        species: input.species.toUpperCase().trim(),
        breed: input.breed?.trim() || null,
        productionStage: input.productionStage?.trim() || null,
        initialCount: initial,
        currentCount: current,
        startDate: input.startDate ? new Date(input.startDate) : new Date(),
        status: "ACTIVE",
        notes: input.notes?.trim() || null,
      },
      include: { enterprise: true },
    });

    return {
      id: group.id,
      farmId: group.farmId,
      enterpriseId: group.enterpriseId,
      enterpriseName: group.enterprise.name,
      name: group.name,
      species: group.species,
      breed: group.breed,
      productionStage: group.productionStage,
      initialCount: group.initialCount,
      currentCount: group.currentCount,
      startDate: group.startDate.toISOString(),
      status: group.status as any,
      notes: group.notes,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    };
  }

  static async updateLivestockGroup(
    farmId: string,
    groupId: string,
    input: Partial<CreateLivestockGroupInput> & { status?: string }
  ): Promise<LivestockGroupDTO> {
    const existing = await prisma.livestockGroup.findFirst({
      where: { id: groupId, farmId },
    });
    if (!existing) {
      throw new Error("Livestock group not found or unauthorized.");
    }

    const data: any = {};
    if (input.name) data.name = input.name.trim();
    if (input.species) data.species = input.species.toUpperCase().trim();
    if (input.breed !== undefined) data.breed = input.breed ? input.breed.trim() : null;
    if (input.productionStage !== undefined)
      data.productionStage = input.productionStage ? input.productionStage.trim() : null;
    if (input.initialCount !== undefined) data.initialCount = Math.max(0, input.initialCount);
    if (input.currentCount !== undefined) data.currentCount = Math.max(0, input.currentCount);
    if (input.startDate) data.startDate = new Date(input.startDate);
    if (input.status) data.status = input.status;
    if (input.notes !== undefined) data.notes = input.notes ? input.notes.trim() : null;

    const updated = await prisma.livestockGroup.update({
      where: { id: groupId },
      data,
      include: { enterprise: true },
    });

    return {
      id: updated.id,
      farmId: updated.farmId,
      enterpriseId: updated.enterpriseId,
      enterpriseName: updated.enterprise.name,
      name: updated.name,
      species: updated.species,
      breed: updated.breed,
      productionStage: updated.productionStage,
      initialCount: updated.initialCount,
      currentCount: updated.currentCount,
      startDate: updated.startDate.toISOString(),
      status: updated.status as any,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  static async deleteLivestockGroup(farmId: string, groupId: string): Promise<boolean> {
    const existing = await prisma.livestockGroup.findFirst({
      where: { id: groupId, farmId },
    });
    if (!existing) {
      throw new Error("Livestock group not found or unauthorized.");
    }

    // Soft archive or delete
    await prisma.livestockGroup.update({
      where: { id: groupId },
      data: { status: "ARCHIVED" },
    });
    return true;
  }

  // ==========================================
  // FEED RECORDS
  // ==========================================

  static async recordFeed(
    farmId: string,
    userId: string,
    input: CreateFeedRecordInput
  ): Promise<FeedRecordDTO> {
    if (!input.quantityIssued || input.quantityIssued <= 0) {
      throw new Error("Quantity issued must be greater than zero.");
    }

    const enterprise = await prisma.enterprise.findFirst({
      where: { id: input.enterpriseId, farmId },
    });
    if (!enterprise) {
      throw new Error("Invalid enterprise selected or unauthorized for this farm.");
    }

    if (input.livestockGroupId) {
      const group = await prisma.livestockGroup.findFirst({
        where: { id: input.livestockGroupId, farmId },
      });
      if (!group) {
        throw new Error("Invalid livestock group selected.");
      }
    }

    const issuedKg = this.normalizeFeedQuantity(
      input.quantityIssued,
      input.unit,
      input.bagWeightKg
    );

    let consumedKg: number | null = null;
    if (input.quantityConsumed !== undefined && input.quantityConsumed !== null) {
      consumedKg = this.normalizeFeedQuantity(
        input.quantityConsumed,
        input.unit,
        input.bagWeightKg
      );
    }

    // Check if linked to an inventory feed product
    let targetProduct: any = null;
    if (input.feedProductId) {
      targetProduct = await prisma.feedProduct.findFirst({
        where: { id: input.feedProductId, farmId },
      });
      if (!targetProduct) {
        throw new Error("Selected feed inventory product not found.");
      }
    } else {
      // Auto-match by name if an active inventory product exists
      targetProduct = await prisma.feedProduct.findFirst({
        where: { farmId, name: input.feedType.trim(), status: "ACTIVE" },
      });
    }

    // Enforce stock validation: block transaction if available stock is insufficient
    if (targetProduct) {
      if (targetProduct.currentStockKg < issuedKg) {
        throw new Error(
          `Insufficient stock for "${targetProduct.name}". Available: ${targetProduct.currentStockKg.toFixed(
            1
          )} kg, Requested: ${issuedKg.toFixed(
            1
          )} kg. Please replenish stock or adjust issued quantity.`
        );
      }
    }

    const calculatedCost =
      input.feedCost !== undefined && input.feedCost !== null
        ? input.feedCost
        : targetProduct && targetProduct.unitCost
        ? Math.round(issuedKg * targetProduct.unitCost * 100) / 100
        : null;

    const record = await prisma.$transaction(async (tx) => {
      const createdRecord = await tx.feedRecord.create({
        data: {
          farmId,
          enterpriseId: enterprise.id,
          livestockGroupId: input.livestockGroupId || null,
          feedProductId: targetProduct ? targetProduct.id : null,
          recordedById: userId,
          date: input.date ? new Date(input.date) : new Date(),
          feedType: input.feedType.trim(),
          quantityIssued: input.quantityIssued,
          unit: input.unit.trim(),
          bagWeightKg: input.bagWeightKg ?? null,
          quantityIssuedKg: issuedKg,
          quantityConsumed: input.quantityConsumed ?? null,
          quantityConsumedKg: consumedKg,
          quantityWasted: input.quantityWasted ?? null,
          feedCost: calculatedCost,
          notes: input.notes?.trim() || null,
        },
        include: {
          enterprise: true,
          livestockGroup: true,
          recordedBy: true,
          feedProduct: true,
        },
      });

      // Atomically deduct issued quantity from inventory
      if (targetProduct) {
        const previousStockKg = targetProduct.currentStockKg;
        const resultingStockKg = Math.round((previousStockKg - issuedKg) * 100) / 100;

        await tx.feedProduct.update({
          where: { id: targetProduct.id },
          data: { currentStockKg: resultingStockKg },
        });

        await tx.feedStockMovement.create({
          data: {
            farmId,
            feedProductId: targetProduct.id,
            movementType: "FEED_ISSUE",
            quantityKg: -issuedKg,
            previousStockKg,
            resultingStockKg,
            feedRecordId: createdRecord.id,
            unitCost: targetProduct.unitCost,
            totalValue: Math.round(issuedKg * (targetProduct.unitCost || 0) * 100) / 100,
            storageLocation: targetProduct.storageLocation,
            createdById: userId,
            reason: `Issued to ${createdRecord.livestockGroup?.name || enterprise.name}`,
          },
        });
      }

      return createdRecord;
    });

    // If an inventory product was updated, evaluate alerts
    if (targetProduct) {
      const { FeedInventoryService } = await import("./feedInventoryService");
      await FeedInventoryService.evaluateProductAlerts(farmId, targetProduct.id);
    }

    return {
      id: record.id,
      farmId: record.farmId,
      enterpriseId: record.enterpriseId,
      enterpriseName: record.enterprise.name,
      livestockGroupId: record.livestockGroupId,
      livestockGroupName: record.livestockGroup?.name,
      feedProductId: record.feedProductId,
      feedProductName: record.feedProduct?.name,
      recordedById: record.recordedById,
      recordedByName: record.recordedBy.fullName,
      date: record.date.toISOString(),
      feedType: record.feedType,
      quantityIssued: record.quantityIssued,
      unit: record.unit,
      bagWeightKg: record.bagWeightKg,
      quantityIssuedKg: record.quantityIssuedKg,
      quantityConsumed: record.quantityConsumed,
      quantityConsumedKg: record.quantityConsumedKg,
      quantityWasted: record.quantityWasted,
      feedCost: record.feedCost,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
    };
  }

  static async updateFeedRecord(
    farmId: string,
    recordId: string,
    input: Partial<CreateFeedRecordInput>
  ): Promise<FeedRecordDTO> {
    const existing = await prisma.feedRecord.findFirst({
      where: { id: recordId, farmId },
    });
    if (!existing) {
      throw new Error("Feed record not found or unauthorized.");
    }

    const unit = input.unit ? input.unit.trim() : existing.unit;
    const bagWeight =
      input.bagWeightKg !== undefined ? input.bagWeightKg : existing.bagWeightKg;
    const qtyIssued =
      input.quantityIssued !== undefined ? input.quantityIssued : existing.quantityIssued;

    const issuedKg = this.normalizeFeedQuantity(qtyIssued, unit, bagWeight);

    let consumedKg: number | null = existing.quantityConsumedKg;
    if (input.quantityConsumed !== undefined) {
      consumedKg =
        input.quantityConsumed !== null
          ? this.normalizeFeedQuantity(input.quantityConsumed, unit, bagWeight)
          : null;
    }

    // Handle stock delta if quantityIssued changed on an inventory-linked record
    const targetProductId = input.feedProductId !== undefined ? input.feedProductId : existing.feedProductId;
    const issuedDeltaKg = issuedKg - existing.quantityIssuedKg;

    const updated = await prisma.$transaction(async (tx) => {
      if (targetProductId && Math.abs(issuedDeltaKg) > 0.001) {
        const product = await tx.feedProduct.findFirst({
          where: { id: targetProductId, farmId },
        });
        if (product) {
          if (issuedDeltaKg > 0 && product.currentStockKg < issuedDeltaKg) {
            throw new Error(
              `Insufficient stock for "${product.name}". Additional required: ${issuedDeltaKg.toFixed(
                1
              )} kg, Available: ${product.currentStockKg.toFixed(1)} kg.`
            );
          }

          const previousStock = product.currentStockKg;
          const resultingStock = Math.round((previousStock - issuedDeltaKg) * 100) / 100;

          await tx.feedProduct.update({
            where: { id: product.id },
            data: { currentStockKg: resultingStock },
          });

          await tx.feedStockMovement.create({
            data: {
              farmId,
              feedProductId: product.id,
              movementType: issuedDeltaKg > 0 ? "FEED_ISSUE" : "RETURN_TO_STOCK",
              quantityKg: -issuedDeltaKg,
              previousStockKg: previousStock,
              resultingStockKg: resultingStock,
              feedRecordId: recordId,
              unitCost: product.unitCost,
              totalValue: Math.round(Math.abs(issuedDeltaKg) * (product.unitCost || 0) * 100) / 100,
              storageLocation: product.storageLocation,
              createdById: existing.recordedById,
              reason: "Feed issue record updated",
            },
          });
        }
      }

      return tx.feedRecord.update({
        where: { id: recordId },
        data: {
          ...(input.enterpriseId ? { enterpriseId: input.enterpriseId } : {}),
          ...(input.livestockGroupId !== undefined
            ? { livestockGroupId: input.livestockGroupId || null }
            : {}),
          ...(input.feedProductId !== undefined ? { feedProductId: input.feedProductId || null } : {}),
          ...(input.date ? { date: new Date(input.date) } : {}),
          ...(input.feedType ? { feedType: input.feedType.trim() } : {}),
          quantityIssued: qtyIssued,
          unit,
          bagWeightKg: bagWeight,
          quantityIssuedKg: issuedKg,
          quantityConsumed:
            input.quantityConsumed !== undefined ? input.quantityConsumed : existing.quantityConsumed,
          quantityConsumedKg: consumedKg,
          quantityWasted:
            input.quantityWasted !== undefined ? input.quantityWasted : existing.quantityWasted,
          feedCost: input.feedCost !== undefined ? input.feedCost : existing.feedCost,
          notes: input.notes !== undefined ? (input.notes ? input.notes.trim() : null) : existing.notes,
        },
        include: {
          enterprise: true,
          livestockGroup: true,
          recordedBy: true,
          feedProduct: true,
        },
      });
    });

    if (targetProductId) {
      const { FeedInventoryService } = await import("./feedInventoryService");
      await FeedInventoryService.evaluateProductAlerts(farmId, targetProductId);
    }

    return {
      id: updated.id,
      farmId: updated.farmId,
      enterpriseId: updated.enterpriseId,
      enterpriseName: updated.enterprise.name,
      livestockGroupId: updated.livestockGroupId,
      livestockGroupName: updated.livestockGroup?.name,
      feedProductId: updated.feedProductId,
      feedProductName: updated.feedProduct?.name,
      recordedById: updated.recordedById,
      recordedByName: updated.recordedBy.fullName,
      date: updated.date.toISOString(),
      feedType: updated.feedType,
      quantityIssued: updated.quantityIssued,
      unit: updated.unit,
      bagWeightKg: updated.bagWeightKg,
      quantityIssuedKg: updated.quantityIssuedKg,
      quantityConsumed: updated.quantityConsumed,
      quantityConsumedKg: updated.quantityConsumedKg,
      quantityWasted: updated.quantityWasted,
      feedCost: updated.feedCost,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  static async deleteFeedRecord(farmId: string, recordId: string): Promise<boolean> {
    const existing = await prisma.feedRecord.findFirst({
      where: { id: recordId, farmId },
    });
    if (!existing) {
      throw new Error("Feed record not found or unauthorized.");
    }

    await prisma.$transaction(async (tx) => {
      // If linked to an inventory feed product, restore the issued quantity to stock
      if (existing.feedProductId) {
        const product = await tx.feedProduct.findFirst({
          where: { id: existing.feedProductId, farmId },
        });
        if (product) {
          const previousStock = product.currentStockKg;
          const resultingStock = Math.round((previousStock + existing.quantityIssuedKg) * 100) / 100;

          await tx.feedProduct.update({
            where: { id: product.id },
            data: { currentStockKg: resultingStock },
          });

          await tx.feedStockMovement.create({
            data: {
              farmId,
              feedProductId: product.id,
              movementType: "RETURN_TO_STOCK",
              quantityKg: existing.quantityIssuedKg,
              previousStockKg: previousStock,
              resultingStockKg: resultingStock,
              unitCost: product.unitCost,
              totalValue: Math.round(existing.quantityIssuedKg * (product.unitCost || 0) * 100) / 100,
              storageLocation: product.storageLocation,
              createdById: existing.recordedById,
              reason: "Feed issue deleted: returned to stock",
            },
          });
        }
      }

      await tx.feedRecord.delete({ where: { id: recordId } });
    });

    if (existing.feedProductId) {
      const { FeedInventoryService } = await import("./feedInventoryService");
      await FeedInventoryService.evaluateProductAlerts(farmId, existing.feedProductId);
    }

    return true;
  }

  static async getFeedRecords(
    farmId: string,
    options?: {
      enterpriseId?: string;
      livestockGroupId?: string;
      feedType?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ records: FeedRecordDTO[]; total: number }> {
    const where: any = { farmId };
    if (options?.enterpriseId) where.enterpriseId = options.enterpriseId;
    if (options?.livestockGroupId) where.livestockGroupId = options.livestockGroupId;
    if (options?.feedType) where.feedType = { contains: options.feedType };

    if (options?.dateFrom || options?.dateTo) {
      where.date = {};
      if (options.dateFrom) where.date.gte = new Date(options.dateFrom);
      if (options.dateTo) {
        const dTo = new Date(options.dateTo);
        dTo.setHours(23, 59, 59, 999);
        where.date.lte = dTo;
      }
    }

    const [total, list] = await Promise.all([
      prisma.feedRecord.count({ where }),
      prisma.feedRecord.findMany({
        where,
        include: {
          enterprise: true,
          livestockGroup: true,
          recordedBy: true,
          feedProduct: true,
        },
        orderBy: { date: "desc" },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
    ]);

    return {
      total,
      records: list.map((r) => ({
        id: r.id,
        farmId: r.farmId,
        enterpriseId: r.enterpriseId,
        enterpriseName: r.enterprise.name,
        livestockGroupId: r.livestockGroupId,
        livestockGroupName: r.livestockGroup?.name,
        feedProductId: r.feedProductId,
        feedProductName: r.feedProduct?.name,
        recordedById: r.recordedById,
        recordedByName: r.recordedBy.fullName,
        date: r.date.toISOString(),
        feedType: r.feedType,
        quantityIssued: r.quantityIssued,
        unit: r.unit,
        bagWeightKg: r.bagWeightKg,
        quantityIssuedKg: r.quantityIssuedKg,
        quantityConsumed: r.quantityConsumed,
        quantityConsumedKg: r.quantityConsumedKg,
        quantityWasted: r.quantityWasted,
        feedCost: r.feedCost,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  // ==========================================
  // PRODUCTION RECORDS
  // ==========================================

  static async recordProduction(
    farmId: string,
    userId: string,
    input: CreateProductionRecordInput
  ): Promise<ProductionRecordDTO> {
    if (input.quantity < 0) {
      throw new Error("Quantity produced cannot be negative.");
    }

    const enterprise = await prisma.enterprise.findFirst({
      where: { id: input.enterpriseId, farmId },
    });
    if (!enterprise) {
      throw new Error("Invalid enterprise selected or unauthorized for this farm.");
    }

    if (input.livestockGroupId) {
      const group = await prisma.livestockGroup.findFirst({
        where: { id: input.livestockGroupId, farmId },
      });
      if (!group) {
        throw new Error("Invalid livestock group selected.");
      }

      // If recording mortality, adjust current count safely
      if (input.metric.toUpperCase() === "MORTALITY" && input.quantity > 0) {
        const newCount = Math.max(0, group.currentCount - Math.round(input.quantity));
        await prisma.livestockGroup.update({
          where: { id: group.id },
          data: { currentCount: newCount },
        });
      }
    }

    const record = await prisma.productionRecord.create({
      data: {
        farmId,
        enterpriseId: enterprise.id,
        livestockGroupId: input.livestockGroupId || null,
        recordedById: userId,
        date: input.date ? new Date(input.date) : new Date(),
        metric: input.metric.toUpperCase().trim(),
        quantity: input.quantity,
        unit: input.unit.trim(),
        secondaryQuantity: input.secondaryQuantity ?? null,
        qualityGrade: input.qualityGrade?.trim() || null,
        quantitySold: input.quantitySold ?? null,
        quantityFarmUse: input.quantityFarmUse ?? null,
        notes: input.notes?.trim() || null,
      },
      include: {
        enterprise: true,
        livestockGroup: true,
        recordedBy: true,
      },
    });

    return {
      id: record.id,
      farmId: record.farmId,
      enterpriseId: record.enterpriseId,
      enterpriseName: record.enterprise.name,
      livestockGroupId: record.livestockGroupId,
      livestockGroupName: record.livestockGroup?.name,
      recordedById: record.recordedById,
      recordedByName: record.recordedBy.fullName,
      date: record.date.toISOString(),
      metric: record.metric,
      quantity: record.quantity,
      unit: record.unit,
      secondaryQuantity: record.secondaryQuantity,
      qualityGrade: record.qualityGrade,
      quantitySold: record.quantitySold,
      quantityFarmUse: record.quantityFarmUse,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
    };
  }

  static async updateProductionRecord(
    farmId: string,
    recordId: string,
    input: Partial<CreateProductionRecordInput>
  ): Promise<ProductionRecordDTO> {
    const existing = await prisma.productionRecord.findFirst({
      where: { id: recordId, farmId },
    });
    if (!existing) {
      throw new Error("Production record not found or unauthorized.");
    }

    const updated = await prisma.productionRecord.update({
      where: { id: recordId },
      data: {
        ...(input.enterpriseId ? { enterpriseId: input.enterpriseId } : {}),
        ...(input.livestockGroupId !== undefined
          ? { livestockGroupId: input.livestockGroupId || null }
          : {}),
        ...(input.date ? { date: new Date(input.date) } : {}),
        ...(input.metric ? { metric: input.metric.toUpperCase().trim() } : {}),
        ...(input.quantity !== undefined ? { quantity: Math.max(0, input.quantity) } : {}),
        ...(input.unit ? { unit: input.unit.trim() } : {}),
        ...(input.secondaryQuantity !== undefined
          ? { secondaryQuantity: input.secondaryQuantity }
          : {}),
        ...(input.qualityGrade !== undefined
          ? { qualityGrade: input.qualityGrade ? input.qualityGrade.trim() : null }
          : {}),
        ...(input.quantitySold !== undefined ? { quantitySold: input.quantitySold } : {}),
        ...(input.quantityFarmUse !== undefined ? { quantityFarmUse: input.quantityFarmUse } : {}),
        ...(input.notes !== undefined
          ? { notes: input.notes ? input.notes.trim() : null }
          : {}),
      },
      include: {
        enterprise: true,
        livestockGroup: true,
        recordedBy: true,
      },
    });

    return {
      id: updated.id,
      farmId: updated.farmId,
      enterpriseId: updated.enterpriseId,
      enterpriseName: updated.enterprise.name,
      livestockGroupId: updated.livestockGroupId,
      livestockGroupName: updated.livestockGroup?.name,
      recordedById: updated.recordedById,
      recordedByName: updated.recordedBy.fullName,
      date: updated.date.toISOString(),
      metric: updated.metric,
      quantity: updated.quantity,
      unit: updated.unit,
      secondaryQuantity: updated.secondaryQuantity,
      qualityGrade: updated.qualityGrade,
      quantitySold: updated.quantitySold,
      quantityFarmUse: updated.quantityFarmUse,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  static async deleteProductionRecord(farmId: string, recordId: string): Promise<boolean> {
    const existing = await prisma.productionRecord.findFirst({
      where: { id: recordId, farmId },
    });
    if (!existing) {
      throw new Error("Production record not found or unauthorized.");
    }
    await prisma.productionRecord.delete({ where: { id: recordId } });
    return true;
  }

  static async getProductionRecords(
    farmId: string,
    options?: {
      enterpriseId?: string;
      livestockGroupId?: string;
      metric?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ records: ProductionRecordDTO[]; total: number }> {
    const where: any = { farmId };
    if (options?.enterpriseId) where.enterpriseId = options.enterpriseId;
    if (options?.livestockGroupId) where.livestockGroupId = options.livestockGroupId;
    if (options?.metric) where.metric = options.metric.toUpperCase();

    if (options?.dateFrom || options?.dateTo) {
      where.date = {};
      if (options.dateFrom) where.date.gte = new Date(options.dateFrom);
      if (options.dateTo) {
        const dTo = new Date(options.dateTo);
        dTo.setHours(23, 59, 59, 999);
        where.date.lte = dTo;
      }
    }

    const [total, list] = await Promise.all([
      prisma.productionRecord.count({ where }),
      prisma.productionRecord.findMany({
        where,
        include: {
          enterprise: true,
          livestockGroup: true,
          recordedBy: true,
        },
        orderBy: { date: "desc" },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
    ]);

    return {
      total,
      records: list.map((r) => ({
        id: r.id,
        farmId: r.farmId,
        enterpriseId: r.enterpriseId,
        enterpriseName: r.enterprise.name,
        livestockGroupId: r.livestockGroupId,
        livestockGroupName: r.livestockGroup?.name,
        recordedById: r.recordedById,
        recordedByName: r.recordedBy.fullName,
        date: r.date.toISOString(),
        metric: r.metric,
        quantity: r.quantity,
        unit: r.unit,
        secondaryQuantity: r.secondaryQuantity,
        qualityGrade: r.qualityGrade,
        quantitySold: r.quantitySold,
        quantityFarmUse: r.quantityFarmUse,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  // ==========================================
  // LIVESTOCK ANALYTICS & PRODUCTIVITY KPIS
  // ==========================================

  static async getLivestockAnalytics(
    farmId: string,
    options?: {
      enterpriseId?: string;
      livestockGroupId?: string;
      species?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<LivestockAnalyticsDTO> {
    const now = new Date();
    const startDate = options?.dateFrom ? new Date(options.dateFrom) : subDays(now, 30);
    const endDate = options?.dateTo ? new Date(options.dateTo) : now;
    endDate.setHours(23, 59, 59, 999);

    const daysCount = Math.max(1, differenceInDays(endDate, startDate) + 1);

    // Filter criteria
    const feedWhere: any = {
      farmId,
      date: { gte: startDate, lte: endDate },
    };
    const prodWhere: any = {
      farmId,
      date: { gte: startDate, lte: endDate },
    };
    const groupWhere: any = { farmId, status: "ACTIVE" };

    if (options?.enterpriseId) {
      feedWhere.enterpriseId = options.enterpriseId;
      prodWhere.enterpriseId = options.enterpriseId;
      groupWhere.enterpriseId = options.enterpriseId;
    }
    if (options?.livestockGroupId) {
      feedWhere.livestockGroupId = options.livestockGroupId;
      prodWhere.livestockGroupId = options.livestockGroupId;
      groupWhere.id = options.livestockGroupId;
    }

    const [feedList, prodList, groups] = await Promise.all([
      prisma.feedRecord.findMany({
        where: feedWhere,
        include: { livestockGroup: true },
        orderBy: { date: "asc" },
      }),
      prisma.productionRecord.findMany({
        where: prodWhere,
        include: { livestockGroup: true },
        orderBy: { date: "asc" },
      }),
      prisma.livestockGroup.findMany({
        where: groupWhere,
      }),
    ]);

    // Determine primary species for the context
    let primarySpecies = options?.species || "POULTRY";
    if (!options?.species && groups.length > 0) {
      primarySpecies = groups[0].species;
    }

    let totalFeedIssuedKg = 0;
    let totalFeedConsumedKg = 0;
    let hasKnownConsumption = false;
    let totalFeedCost = 0;

    // Time-series map by day YYYY-MM-DD
    const feedByDay: Record<string, { issued: number; consumed: number; cost: number }> = {};
    const prodByDay: Record<
      string,
      { quantity: number; secondary: number; unit: string; metric: string }
    > = {};

    for (const f of feedList) {
      const issued = f.quantityIssuedKg || 0;
      totalFeedIssuedKg += issued;

      if (f.quantityConsumedKg !== null && f.quantityConsumedKg !== undefined) {
        totalFeedConsumedKg += f.quantityConsumedKg;
        hasKnownConsumption = true;
      }

      if (f.feedCost) {
        totalFeedCost += f.feedCost;
      }

      const dayKey = format(f.date, "yyyy-MM-dd");
      if (!feedByDay[dayKey]) {
        feedByDay[dayKey] = { issued: 0, consumed: 0, cost: 0 };
      }
      feedByDay[dayKey].issued += issued;
      if (f.quantityConsumedKg !== null && f.quantityConsumedKg !== undefined) {
        feedByDay[dayKey].consumed += f.quantityConsumedKg;
      }
      if (f.feedCost) {
        feedByDay[dayKey].cost += f.feedCost;
      }
    }

    // Production aggregation
    let totalProdQty = 0;
    let totalSecondaryQty = 0;
    let primaryMetric = "EGGS";
    let primaryUnit = "pieces";
    let mortalityCount = 0;

    for (const p of prodList) {
      if (p.metric === "MORTALITY") {
        mortalityCount += p.quantity;
      } else {
        totalProdQty += p.quantity;
        primaryMetric = p.metric;
        primaryUnit = p.unit;
      }

      if (p.secondaryQuantity) {
        totalSecondaryQty += p.secondaryQuantity;
      }

      const dayKey = format(p.date, "yyyy-MM-dd");
      if (!prodByDay[dayKey]) {
        prodByDay[dayKey] = { quantity: 0, secondary: 0, unit: p.unit, metric: p.metric };
      }
      if (p.metric !== "MORTALITY") {
        prodByDay[dayKey].quantity += p.quantity;
      }
      if (p.secondaryQuantity) {
        prodByDay[dayKey].secondary += p.secondaryQuantity;
      }
    }

    // Active animals count
    const totalActiveAnimals = groups.reduce((acc, g) => acc + (g.currentCount || 0), 0);

    // Productivity calculations
    // Use actual consumed kg if known; otherwise estimate based on issued feed and flag it
    const effectiveFeedKg = hasKnownConsumption ? totalFeedConsumedKg : totalFeedIssuedKg;
    const isFeedEstimated = !hasKnownConsumption && totalFeedIssuedKg > 0;

    let eggProductionRatePercent: number | null = null;
    let feedPerEggGrams: number | null = null;
    let feedPerTrayKg: number | null = null;
    let eggDamagedRatePercent: number | null = null;

    let avgMilkYieldPerCowLitres: number | null = null;
    let feedPerLitreKg: number | null = null;

    let weightGainKg: number | null = null;
    let averageDailyGainKg: number | null = null;
    let feedConversionRatio: number | null = null;

    const spec = primarySpecies.toUpperCase();

    if (spec === "POULTRY") {
      // Eggs & Laying metrics
      if (primaryMetric === "EGGS" || totalProdQty > 0) {
        // Laying rate: eggs laid / (laying birds * days) * 100
        if (totalActiveAnimals > 0) {
          const expectedBirdDays = totalActiveAnimals * daysCount;
          eggProductionRatePercent = Math.min(
            100,
            Math.round((totalProdQty / expectedBirdDays) * 1000) / 10
          );
        }

        // Feed per egg in grams: (effectiveFeedKg * 1000) / totalProdQty
        if (totalProdQty > 0 && effectiveFeedKg > 0) {
          feedPerEggGrams = Math.round((effectiveFeedKg * 1000) / totalProdQty);

          // Trays count (30 eggs = 1 tray)
          const trayCount = totalProdQty / 30;
          if (trayCount > 0) {
            feedPerTrayKg = Math.round((effectiveFeedKg / trayCount) * 10) / 10;
          }
        }

        if (totalProdQty > 0 && totalSecondaryQty > 0) {
          eggDamagedRatePercent =
            Math.round((totalSecondaryQty / (totalProdQty + totalSecondaryQty)) * 1000) / 10;
        }
      } else if (primaryMetric === "WEIGHT") {
        // Meat birds (Broilers)
        weightGainKg = totalProdQty;
        averageDailyGainKg = Math.round((totalProdQty / daysCount) * 1000) / 1000;
        if (totalProdQty > 0 && effectiveFeedKg > 0) {
          feedConversionRatio = Math.round((effectiveFeedKg / totalProdQty) * 100) / 100;
        }
      }
    } else if (spec === "DAIRY_CATTLE" || spec === "CATTLE") {
      if (totalProdQty > 0) {
        if (totalActiveAnimals > 0) {
          const cowDays = totalActiveAnimals * daysCount;
          avgMilkYieldPerCowLitres = Math.round((totalProdQty / cowDays) * 10) / 10;
        }
        if (effectiveFeedKg > 0) {
          feedPerLitreKg = Math.round((effectiveFeedKg / totalProdQty) * 100) / 100;
        }
      }
    } else {
      // Meat animals: Beef, Pigs, Goats, Sheep, Rabbits
      if (primaryMetric === "WEIGHT" || totalProdQty > 0) {
        weightGainKg = totalProdQty;
        averageDailyGainKg = Math.round((totalProdQty / daysCount) * 100) / 100;
        if (totalProdQty > 0 && effectiveFeedKg > 0) {
          feedConversionRatio = Math.round((effectiveFeedKg / totalProdQty) * 100) / 100;
        }
      }
    }

    const mortalityRatePercent =
      totalActiveAnimals > 0 && mortalityCount > 0
        ? Math.round((mortalityCount / (totalActiveAnimals + mortalityCount)) * 1000) / 10
        : null;

    // Build timeline for chart
    const allDays = new Set([...Object.keys(feedByDay), ...Object.keys(prodByDay)]);
    const sortedDays = Array.from(allDays).sort();

    const feedTimeSeries = sortedDays.map((date) => ({
      date,
      issuedKg: Math.round((feedByDay[date]?.issued || 0) * 10) / 10,
      consumedKg: Math.round((feedByDay[date]?.consumed || 0) * 10) / 10,
      cost: Math.round(feedByDay[date]?.cost || 0),
    }));

    const productionTimeSeries = sortedDays.map((date) => ({
      date,
      quantity: Math.round((prodByDay[date]?.quantity || 0) * 10) / 10,
      secondaryQuantity: Math.round((prodByDay[date]?.secondary || 0) * 10) / 10,
      unit: prodByDay[date]?.unit || primaryUnit,
    }));

    const conversionTimeSeries = sortedDays.map((date) => {
      const feed = feedByDay[date]?.consumed || feedByDay[date]?.issued || 0;
      const prod = prodByDay[date]?.quantity || 0;
      const ratio = prod > 0 && feed > 0 ? Math.round((feed / prod) * 100) / 100 : null;
      return {
        date,
        feedKg: Math.round(feed * 10) / 10,
        productionQty: Math.round(prod * 10) / 10,
        ratio,
      };
    });

    return {
      period: {
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString(),
      },
      summary: {
        totalFeedIssuedKg: Math.round(totalFeedIssuedKg * 10) / 10,
        totalFeedConsumedKg: Math.round(totalFeedConsumedKg * 10) / 10,
        hasKnownConsumption,
        totalFeedCost: Math.round(totalFeedCost),
        totalActiveAnimals,
        primarySpecies,
      },
      productionSummary: {
        metric: primaryMetric,
        totalQuantity: Math.round(totalProdQty * 10) / 10,
        unit: primaryUnit,
        secondaryQuantity: totalSecondaryQty > 0 ? Math.round(totalSecondaryQty * 10) / 10 : undefined,
        averagePerDay: Math.round((totalProdQty / daysCount) * 10) / 10,
        averagePerAnimal:
          totalActiveAnimals > 0
            ? Math.round((totalProdQty / (totalActiveAnimals * daysCount)) * 10) / 10
            : null,
      },
      productivityIndicators: {
        eggProductionRatePercent,
        feedPerEggGrams,
        feedPerTrayKg,
        isFeedPerEggEstimated: isFeedEstimated,
        eggDamagedRatePercent,
        avgMilkYieldPerCowLitres,
        feedPerLitreKg,
        isFeedPerLitreEstimated: isFeedEstimated,
        weightGainKg,
        averageDailyGainKg,
        feedConversionRatio,
        isFcrEstimated: isFeedEstimated,
        mortalityCount,
        mortalityRatePercent,
      },
      feedTimeSeries,
      productionTimeSeries,
      conversionTimeSeries,
    };
  }
}
