import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { LivestockService } from "@/lib/services/livestockService";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createProductionSchema = z.object({
  enterpriseId: z.string().min(1, "Enterprise is required"),
  livestockGroupId: z.string().optional().nullable(),
  date: z.string().min(1, "Date is required"),
  metric: z.string().min(1, "Metric is required"),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  secondaryQuantity: z.number().min(0).optional().nullable(),
  qualityGrade: z.string().optional().nullable(),
  quantitySold: z.number().min(0).optional().nullable(),
  quantityFarmUse: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");
    const enterpriseId = searchParams.get("enterpriseId") || undefined;
    const livestockGroupId = searchParams.get("livestockGroupId") || undefined;
    const metric = searchParams.get("metric") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : 0;

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const data = await LivestockService.getProductionRecords(context.farm.id, {
      enterpriseId,
      livestockGroupId,
      metric,
      dateFrom,
      dateTo,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error("GET /api/livestock/production error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load production records" },
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
    const validated = createProductionSchema.parse(body);

    const record = await LivestockService.recordProduction(
      context.farm.id,
      context.user.id,
      validated
    );

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "ProductionRecord",
      entityId: record.id,
      action: "CREATE",
      actorId: context.user.id,
      newValues: record,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/livestock/production error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record production" },
      { status: 400 }
    );
  }
}
