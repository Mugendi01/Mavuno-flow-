import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { LivestockService } from "@/lib/services/livestockService";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateProductionSchema = z.object({
  enterpriseId: z.string().optional(),
  livestockGroupId: z.string().optional().nullable(),
  date: z.string().optional(),
  metric: z.string().optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().optional(),
  secondaryQuantity: z.number().min(0).optional().nullable(),
  qualityGrade: z.string().optional().nullable(),
  quantitySold: z.number().min(0).optional().nullable(),
  quantityFarmUse: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordId = params.id;
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
    const validated = updateProductionSchema.parse(body);

    const updated = await LivestockService.updateProductionRecord(
      context.farm.id,
      recordId,
      validated
    );

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "ProductionRecord",
      entityId: recordId,
      action: "UPDATE",
      actorId: context.user.id,
      newValues: updated,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (error: any) {
    console.error("PUT /api/livestock/production/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update production record" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordId = params.id;
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");

    const context = await AuthContextService.getActiveContext(farmIdParam);
    if (!context.canEdit) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient farm permissions." },
        { status: 403 }
      );
    }

    await LivestockService.deleteProductionRecord(context.farm.id, recordId);

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "ProductionRecord",
      entityId: recordId,
      action: "DELETE",
      actorId: context.user.id,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, message: "Production record deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/livestock/production/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete production record" },
      { status: 400 }
    );
  }
}
