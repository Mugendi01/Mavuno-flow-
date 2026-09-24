import { NextRequest, NextResponse } from "next/server";
import { ReportService } from "@/lib/services/reportService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get("farmId");
    const dateStr = searchParams.get("date");
    const format = searchParams.get("format"); // 'json' | 'html'

    if (!farmId) {
      return NextResponse.json({ error: "Missing farmId parameter" }, { status: 400 });
    }

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const digestData = await ReportService.compileWeeklyDigest(farmId, targetDate);

    if (format === "html") {
      const html = ReportService.generateEmailHTML(digestData);
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json(digestData);
  } catch (error: any) {
    console.error("GET /api/reports/weekly error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate weekly digest" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { farmId, dateStr } = body;

    if (!farmId) {
      return NextResponse.json({ error: "farmId is required" }, { status: 400 });
    }

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const digestData = await ReportService.compileWeeklyDigest(farmId, targetDate);
    const persisted = await ReportService.persistReport(digestData);

    return NextResponse.json({
      success: true,
      reportId: persisted.id,
      digestData,
    });
  } catch (error: any) {
    console.error("POST /api/reports/weekly error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to persist report" },
      { status: 500 }
    );
  }
}
