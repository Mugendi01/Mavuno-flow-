import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { FeedInventoryService } from "@/lib/services/feedInventoryService";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateFeedProductSchema = z.object({
  enterpriseId: z.string().optional().nullable(),
  name: z.string().min(1, "Product name cannot be empty").optional(),
  feedType: z.string().min(1, "Feed type cannot be empty").optional(),
  intendedUse: z.string().optional().nullable(),
  storageLocation: z.string().optional().nullable(),
  defaultUnit: z.string().optional(),
  defaultBagWeightKg: z.number().positive().optional().nullable(),
  unitCost: z.number().min(0).optional().nullable(),
  minReserveKg: z.number().min(0).optional(),
  criticalReserveKg: z.number().min(0).optional(),
  reorderQuantityKg: z.number().positive().optional().nullable(),
  leadTimeDays: z.number().int().min(0).optional().nullable(),
  reminderPeriodDays: z.number().int().min(0).optional().nullable(),
  expectedDailyUsageKg: z.number().min(0).optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const product = await FeedInventoryService.getFeedProductById(context.farm.id, productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Feed product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("GET /api/livestock/inventory/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load product" },
      { status: 400 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");

    const context = await AuthContextService.getActiveContext(farmIdParam);
    if (!context.canEdit) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient farm permissions." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = updateFeedProductSchema.parse(body);

    const updated = await FeedInventoryService.updateFeedProduct(
      context.farm.id,
      productId,
      validated
    );

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "FeedProduct",
      entityId: productId,
      action: "UPDATE",
      actorId: context.user.id,
      newValues: updated,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("PUT /api/livestock/inventory/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");

    const context = await AuthContextService.getActiveContext(farmIdParam);
    if (!context.canEdit) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient farm permissions." },
        { status: 403 }
      );
    }

    await FeedInventoryService.archiveFeedProduct(context.farm.id, productId);

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "FeedProduct",
      entityId: productId,
      action: "DELETE",
      actorId: context.user.id,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/livestock/inventory/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to archive product" },
      { status: 400 }
    );
  }
}
