import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { FeedInventoryService } from "@/lib/services/feedInventoryService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const alertActionSchema = z.object({
  alertId: z.string().min(1, "Alert ID is required"),
  action: z.enum(["ACKNOWLEDGE", "RESOLVE"]),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const alerts = await FeedInventoryService.getActiveAlerts(context.farm.id);

    return NextResponse.json({ success: true, alerts });
  } catch (error: any) {
    console.error("GET /api/livestock/alerts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load alerts" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const body = await req.json();
    const validated = alertActionSchema.parse(body);

    if (validated.action === "ACKNOWLEDGE") {
      await FeedInventoryService.acknowledgeAlert(context.farm.id, validated.alertId);
    } else {
      await FeedInventoryService.resolveAlert(context.farm.id, validated.alertId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/livestock/alerts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update alert" },
      { status: 400 }
    );
  }
}
