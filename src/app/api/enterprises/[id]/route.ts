import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { prisma } from "@/lib/prisma";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

const updateEnterpriseSchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  farmId: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = updateEnterpriseSchema.parse(body);

    const context = await AuthContextService.getActiveContext(validated.farmId);
    if (!context.canEdit) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Only Owner or Manager can edit enterprises" },
        { status: 403 }
      );
    }

    const existing = await prisma.enterprise.findFirst({
      where: { id: params.id, farmId: context.farm.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Enterprise not found on this farm" },
        { status: 404 }
      );
    }

    const updated = await prisma.enterprise.update({
      where: { id: params.id },
      data: {
        name: validated.name ?? undefined,
        status: validated.status ?? undefined,
      },
      include: { enterpriseType: true },
    });

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "ENTERPRISE",
      entityId: updated.id,
      action: "UPDATE",
      actorId: context.user.id,
      oldValues: existing,
      newValues: updated,
    });

    return NextResponse.json({
      success: true,
      enterprise: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/enterprises/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update enterprise" },
      { status: 400 }
    );
  }
}
