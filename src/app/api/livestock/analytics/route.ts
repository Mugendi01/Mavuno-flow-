import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { LivestockService } from "@/lib/services/livestockService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");
    const enterpriseId = searchParams.get("enterpriseId") || undefined;
    const livestockGroupId = searchParams.get("livestockGroupId") || undefined;
    const species = searchParams.get("species") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const analytics = await LivestockService.getLivestockAnalytics(context.farm.id, {
      enterpriseId,
      livestockGroupId,
      species,
      dateFrom,
      dateTo,
    });

    return NextResponse.json({ success: true, analytics });
  } catch (error: any) {
    console.error("GET /api/livestock/analytics error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate livestock analytics" },
      { status: 400 }
    );
  }
}
