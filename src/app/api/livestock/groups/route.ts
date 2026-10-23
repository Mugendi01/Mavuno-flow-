import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { LivestockService } from "@/lib/services/livestockService";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createGroupSchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional().nullable(),
  productionStage: z.string().optional().nullable(),
  initialCount: z.number().int().min(0, "Count cannot be negative"),
  currentCount: z.number().int().min(0, "Current count cannot be negative").optional(),
  startDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");
    const enterpriseId = searchParams.get("enterpriseId") || undefined;
    const species = searchParams.get("species") || undefined;
    const status = searchParams.get("status") || undefined;

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const groups = await LivestockService.getLivestockGroups(context.farm.id, {
      enterpriseId,
      species,
      status,
    });

    return NextResponse.json({ success: true, groups });
  } catch (error: any) {
    console.error("GET /api/livestock/groups error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load livestock groups" },
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
    const validated = createGroupSchema.parse(body);

    const group = await LivestockService.createLivestockGroup(context.farm.id, validated);

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "LivestockGroup",
      entityId: group.id,
      action: "CREATE",
      actorId: context.user.id,
      newValues: group,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, group }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/livestock/groups error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create livestock group" },
      { status: 400 }
    );
  }
}
