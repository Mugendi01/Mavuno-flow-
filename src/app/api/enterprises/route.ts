import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { prisma } from "@/lib/prisma";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const defaultUnitsByCode: Record<string, string> = {
  POULTRY: "Tray",
  CATTLE: "Litre",
  AQUACULTURE: "Kg",
  GOATS_SHEEP: "Head",
  PIGGERY: "Head",
  CROPS: "Bale",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const farmId = context.farm.id;

    const enterprises = await prisma.enterprise.findMany({
      where: { farmId },
      include: {
        enterpriseType: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const mapped = enterprises.map((e) => ({
      id: e.id,
      name: e.name,
      code: e.enterpriseType.code,
      status: e.status,
      enterpriseTypeId: e.enterpriseTypeId,
      defaultUnit: defaultUnitsByCode[e.enterpriseType.code] || "Unit",
    }));

    return NextResponse.json({
      success: true,
      enterprises: mapped,
    });
  } catch (error: any) {
    console.error("GET /api/enterprises error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch enterprises" },
      { status: 500 }
    );
  }
}

const createEnterpriseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  enterpriseTypeId: z.string().min(1, "Enterprise type ID is required"),
  farmId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createEnterpriseSchema.parse(body);

    const context = await AuthContextService.getActiveContext(validated.farmId);
    if (!context.canEdit) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Only farm Owner or Manager can add enterprises" },
        { status: 403 }
      );
    }

    const created = await prisma.enterprise.create({
      data: {
        farmId: context.farm.id,
        enterpriseTypeId: validated.enterpriseTypeId,
        name: validated.name,
        status: "ACTIVE",
      },
      include: { enterpriseType: true },
    });

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "ENTERPRISE",
      entityId: created.id,
      action: "CREATE",
      actorId: context.user.id,
      newValues: created,
    });

    return NextResponse.json({
      success: true,
      enterprise: {
        id: created.id,
        name: created.name,
        code: created.enterpriseType.code,
        status: created.status,
        defaultUnit: defaultUnitsByCode[created.enterpriseType.code] || "Unit",
      },
    });
  } catch (error: any) {
    console.error("POST /api/enterprises error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create enterprise" },
      { status: 400 }
    );
  }
}
