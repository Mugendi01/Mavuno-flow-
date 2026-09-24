import { NextRequest, NextResponse } from "next/server";
import { ReceiptService } from "@/lib/services/receiptService";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get("farmId") || undefined;

    const receipt = await ReceiptService.getReceiptDetails(id, farmId);

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    return NextResponse.json({ receipt });
  } catch (error: any) {
    console.error("GET /api/receipts/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch receipt." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, actorId, reason } = body;

    if (action === "VOID") {
      if (!actorId) {
        return NextResponse.json({ error: "actorId is required to void a receipt." }, { status: 400 });
      }

      const receipt = await ReceiptService.getReceiptDetails(params.id);
      if (!receipt) {
        return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
      }

      await ReceiptService.voidReceiptForTransaction(receipt.transactionId, actorId, reason);
      const updated = await ReceiptService.getReceiptDetails(params.id);

      return NextResponse.json({ success: true, receipt: updated });
    }

    return NextResponse.json({ error: "Unsupported receipt action." }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/receipts/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update receipt." },
      { status: 500 }
    );
  }
}
