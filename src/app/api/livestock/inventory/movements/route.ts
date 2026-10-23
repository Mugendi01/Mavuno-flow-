import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { FeedInventoryService } from "@/lib/services/feedInventoryService";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createAdjustmentSchema = z.object({
  feedProductId: z.string().min(1, "Feed product is required"),
  movementType: z.enum(["WASTAGE_LOSS", "RETURN_TO_STOCK", "MANUAL_ADJUSTMENT"]),
  quantityKg: z.number().positive("Quantity must be greater than zero"),
  reason: z.string().min(1, "Reason is required for manual adjustments"),
  storageLocation: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");
    const feedProductId = searchParams.get("feedProductId") || undefined;
    const movementType = searchParams.get("movementType") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 100;

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const movements = await FeedInventoryService.getStockMovements(context.farm.id, {
      feedProductId,
      movementType,
      limit,
    });

    return NextResponse.json({ success: true, movements });
  } catch (error: any) {
    console.error("GET /api/livestock/inventory/movements error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load stock movements" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
    const validated = createAdjustmentSchema.parse(body);

    const movement = await FeedInventoryService.recordManualAdjustment(
      context.farm.id,
      context.user.id,
      validated
    );

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "FeedStockMovement",
      entityId: movement.id,
      action: "CREATE",
      actorId: context.user.id,
      newValues: { ...movement, reason: validated.reason },
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, movement }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/livestock/inventory/movements error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record adjustment" },
      { status: 400 }
    );
  }
}
