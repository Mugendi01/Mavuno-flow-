import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { FeedInventoryService } from "@/lib/services/feedInventoryService";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createFeedProductSchema = z.object({
  enterpriseId: z.string().optional().nullable(),
  name: z.string().min(1, "Product name is required"),
  feedType: z.string().min(1, "Feed type is required"),
  intendedUse: z.string().optional().nullable(),
  storageLocation: z.string().optional().nullable(),
  defaultUnit: z.string().optional(),
  defaultBagWeightKg: z.number().positive().optional().nullable(),
  initialStockKg: z.number().min(0).optional(),
  unitCost: z.number().min(0).optional().nullable(),
  minReserveKg: z.number().min(0).optional(),
  criticalReserveKg: z.number().min(0).optional(),
  reorderQuantityKg: z.number().positive().optional().nullable(),
  leadTimeDays: z.number().int().min(0).optional().nullable(),
  reminderPeriodDays: z.number().int().min(0).optional().nullable(),
  expectedDailyUsageKg: z.number().min(0).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");
    const enterpriseId = searchParams.get("enterpriseId") || undefined;
    const feedType = searchParams.get("feedType") || undefined;
    const status = searchParams.get("status") || undefined;

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const [products, summary, alerts] = await Promise.all([
      FeedInventoryService.getFeedProducts(context.farm.id, {
        enterpriseId,
        feedType,
        status,
      }),
      FeedInventoryService.getInventorySummary(context.farm.id),
      FeedInventoryService.getActiveAlerts(context.farm.id),
    ]);

    return NextResponse.json({
      success: true,
      products,
      summary,
      alerts,
    });
  } catch (error: any) {
    console.error("GET /api/livestock/inventory error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load feed inventory" },
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
    const validated = createFeedProductSchema.parse(body);

    const product = await FeedInventoryService.createFeedProduct(
      context.farm.id,
      context.user.id,
      validated
    );

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "FeedProduct",
      entityId: product.id,
      action: "CREATE",
      actorId: context.user.id,
      newValues: product,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/livestock/inventory error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create feed product" },
      { status: 400 }
    );
  }
}
