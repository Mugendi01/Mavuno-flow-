import { NextRequest, NextResponse } from "next/server";
import { ReceivablesService } from "@/lib/services/receivablesService";
import { AuthContextService } from "@/lib/services/authContext";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");
    const status = searchParams.get("status") || undefined;

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const receivables = await ReceivablesService.getReceivables(context.farm.id, status);
    return NextResponse.json({ receivables, currency: context.farm.currency });
  } catch (error: any) {
    console.error("GET /api/receivables error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch receivables" },
      { status: 500 }
    );
  }
}
