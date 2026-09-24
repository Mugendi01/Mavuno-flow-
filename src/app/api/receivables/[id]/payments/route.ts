import { NextRequest, NextResponse } from "next/server";
import { ReceivablesService } from "@/lib/services/receivablesService";
import { PaymentMethod } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { amount, paymentMethod, referenceCode, recordedById, notes } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be greater than zero" },
        { status: 400 }
      );
    }

    if (!recordedById) {
      return NextResponse.json(
        { error: "recordedById is required" },
        { status: 400 }
      );
    }

    const result = await ReceivablesService.recordPayment({
      receivableId: params.id,
      amount: Number(amount),
      paymentMethod: (paymentMethod || "MPESA") as PaymentMethod,
      referenceCode,
      recordedById,
      notes,
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/receivables/[id]/payments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record payment" },
      { status: 400 }
    );
  }
}
