import { NextRequest, NextResponse } from "next/server";
import { TransactionService } from "@/lib/services/transactionService";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get("farmId");
    const actorId = searchParams.get("actorId");

    if (!farmId || !actorId) {
      return NextResponse.json(
        { error: "farmId and actorId are required query parameters" },
        { status: 400 }
      );
    }

    const deleted = await TransactionService.softDeleteTransaction(
      params.id,
      farmId,
      actorId
    );

    return NextResponse.json({ success: true, transaction: deleted });
  } catch (error: any) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
