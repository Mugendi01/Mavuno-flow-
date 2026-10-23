import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { FeedInventoryService } from "@/lib/services/feedInventoryService";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const cancelPurchaseSchema = z.object({
  reason: z.string().optional(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const purchaseId = params.id;
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");

    const context = await AuthContextService.getActiveContext(farmIdParam);
    if (!context.canEdit) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient farm permissions." },
        { status: 403 }
      );
    }

    let reason: string | undefined;
    try {
      const body = await req.json();
      const parsed = cancelPurchaseSchema.parse(body);
      reason = parsed.reason;
    } catch {
      // Body is optional
    }

    await FeedInventoryService.cancelPurchase(
      context.farm.id,
      context.user.id,
      purchaseId,
      reason
    );

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "FeedPurchase",
      entityId: purchaseId,
      action: "VOID",
      actorId: context.user.id,
      newValues: { reason: reason || "Purchase cancelled / reversed" },
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/livestock/purchases/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel purchase" },
      { status: 400 }
    );
  }
}
