import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { LivestockService } from "@/lib/services/livestockService";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateFeedSchema = z.object({
  enterpriseId: z.string().optional(),
  livestockGroupId: z.string().optional().nullable(),
  feedProductId: z.string().optional().nullable(),
  date: z.string().optional(),
  feedType: z.string().optional(),
  quantityIssued: z.number().positive().optional(),
  unit: z.string().optional(),
  bagWeightKg: z.number().positive().optional().nullable(),
  quantityConsumed: z.number().min(0).optional().nullable(),
  quantityWasted: z.number().min(0).optional().nullable(),
  feedCost: z.number().min(0).optional().nullable(),
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
    const validated = updateFeedSchema.parse(body);

    const updated = await LivestockService.updateFeedRecord(
      context.farm.id,
      recordId,
      validated
    );

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "FeedRecord",
      entityId: recordId,
      action: "UPDATE",
      actorId: context.user.id,
      newValues: updated,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (error: any) {
    console.error("PUT /api/livestock/feed/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update feed record" },
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

    await LivestockService.deleteFeedRecord(context.farm.id, recordId);

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "FeedRecord",
      entityId: recordId,
      action: "DELETE",
      actorId: context.user.id,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, message: "Feed record deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/livestock/feed/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete feed record" },
      { status: 400 }
    );
  }
}
