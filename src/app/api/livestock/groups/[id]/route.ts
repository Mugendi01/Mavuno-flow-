import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { LivestockService } from "@/lib/services/livestockService";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateGroupSchema = z.object({
  name: z.string().min(2).optional(),
  species: z.string().optional(),
  breed: z.string().optional().nullable(),
  productionStage: z.string().optional().nullable(),
  initialCount: z.number().int().min(0).optional(),
  currentCount: z.number().int().min(0).optional(),
  startDate: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
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
    const validated = updateGroupSchema.parse(body);

    const updated = await LivestockService.updateLivestockGroup(
      context.farm.id,
      groupId,
      validated
    );

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "LivestockGroup",
      entityId: groupId,
      action: "UPDATE",
      actorId: context.user.id,
      newValues: updated,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, group: updated });
  } catch (error: any) {
    console.error("PUT /api/livestock/groups/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update livestock group" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");

    const context = await AuthContextService.getActiveContext(farmIdParam);
    if (!context.canEdit) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient farm permissions." },
        { status: 403 }
      );
    }

    await LivestockService.deleteLivestockGroup(context.farm.id, groupId);

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "LivestockGroup",
      entityId: groupId,
      action: "DELETE",
      actorId: context.user.id,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, message: "Group archived successfully." });
  } catch (error: any) {
    console.error("DELETE /api/livestock/groups/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete livestock group" },
      { status: 400 }
    );
  }
}
