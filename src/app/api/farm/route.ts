import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { prisma } from "@/lib/prisma";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

const updateFarmSchema = z.object({
  name: z.string().min(2, "Farm name must be at least 2 characters").optional(),
  locationCounty: z.string().min(2, "Location is required").optional(),
  currency: z.string().length(3, "Currency code must be 3 characters").optional(),
  farmSizeAcres: z.number().nullable().optional(),
  timezone: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get("farmId");

    const context = await AuthContextService.getActiveContext(farmId);
    return NextResponse.json({
      success: true,
      farm: context.farm,
      user: context.user,
      role: context.membership.role,
    });
  } catch (error: any) {
    console.error("GET /api/farm error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load farm details" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId") || body.farmId;

    const context = await AuthContextService.getActiveContext(farmIdParam);
    if (!context.canEdit) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Only farm Owner or Manager can edit farm details" },
        { status: 403 }
      );
    }

    const validated = updateFarmSchema.parse(body);

    const oldFarm = await prisma.farm.findUnique({
      where: { id: context.farm.id },
    });

    const updated = await prisma.farm.update({
      where: { id: context.farm.id },
      data: {
        name: validated.name ?? undefined,
        locationCounty: validated.locationCounty ?? undefined,
        currency: validated.currency ?? undefined,
        farmSizeAcres: validated.farmSizeAcres !== undefined ? validated.farmSizeAcres : undefined,
        timezone: validated.timezone ?? undefined,
      },
    });

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "FARM",
      entityId: context.farm.id,
      action: "UPDATE",
      actorId: context.user.id,
      oldValues: oldFarm,
      newValues: updated,
    });

    return NextResponse.json({
      success: true,
      farm: updated,
      message: "Farm details successfully updated in database",
    });
  } catch (error: any) {
    console.error("PUT /api/farm error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update farm" },
      { status: 400 }
    );
  }
}
