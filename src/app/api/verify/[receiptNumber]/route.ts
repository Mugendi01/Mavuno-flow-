import { NextRequest, NextResponse } from "next/server";
import { ReceiptService } from "@/lib/services/receiptService";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { receiptNumber: string } }
) {
  try {
    const { receiptNumber } = params;

    if (!receiptNumber || receiptNumber.trim().length === 0) {
      return NextResponse.json(
        {
          isValid: false,
          status: "NOT_FOUND",
          receiptNumber: "",
          verificationMessage: "Missing or invalid receipt number parameter.",
        },
        { status: 400 }
      );
    }

    const verification = await ReceiptService.getPublicVerification(receiptNumber);

    return NextResponse.json(verification, {
      status: verification.isValid ? 200 : verification.status === "VOIDED" ? 200 : 404,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error: any) {
    console.error("GET /api/verify/[receiptNumber] error:", error);
    return NextResponse.json(
      {
        isValid: false,
        status: "NOT_FOUND",
        receiptNumber: params.receiptNumber,
        verificationMessage: "Failed to process receipt verification.",
      },
      { status: 500 }
    );
  }
}
