import { NextRequest, NextResponse } from "next/server";
import { ReceivablesService } from "@/lib/services/receivablesService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get("farmId");
    const status = searchParams.get("status") || undefined;

    if (!farmId) {
      return NextResponse.json({ error: "Missing farmId parameter" }, { status: 400 });
    }

    const receivables = await ReceivablesService.getReceivables(farmId, status);
    return NextResponse.json({ receivables });
  } catch (error: any) {
    console.error("GET /api/receivables error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch receivables" },
      { status: 500 }
    );
  }
}
