import { NextRequest, NextResponse } from "next/server";
import { TransactionService } from "@/lib/services/transactionService";
import { TransactionCreateInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transactions: TransactionCreateInput[] = body.transactions || [];

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ syncedIds: [], skippedIds: [], errors: [] });
    }

    const syncedIds: string[] = [];
    const skippedIds: string[] = [];
    const errors: { localId: string; error: string }[] = [];

    for (const item of transactions) {
      const localId = item.localId || "unknown";
      try {
        const result = await TransactionService.createTransaction(item);
        if (result.isExisting) {
          skippedIds.push(localId);
        } else {
          syncedIds.push(localId);
        }
      } catch (err: any) {
        console.error(`Failed to sync item ${localId}:`, err);
        errors.push({
          localId,
          error: err.message || "Failed to process offline transaction",
        });
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: syncedIds.length,
      syncedIds,
      skippedIds,
      errors,
    });
  } catch (error: any) {
    console.error("POST /api/sync/batch error:", error);
    return NextResponse.json(
      { error: error.message || "Batch synchronization failed" },
      { status: 500 }
    );
  }
}
