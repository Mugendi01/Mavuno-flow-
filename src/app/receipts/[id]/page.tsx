import React from "react";
import { ReceiptService } from "@/lib/services/receiptService";
import { ReceiptCard } from "@/components/receipts/ReceiptCard";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const receipt = await ReceiptService.getReceiptDetails(params.id);

  if (!receipt) {
    return (
      <div className="min-h-screen bg-farm-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-farm-surface p-6 rounded-2xl border border-farm-border text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-farm-charcoal">Receipt Not Found</h2>
            <p className="text-xs text-farm-muted mt-1">
              Could not find receipt record for identifier:{" "}
              <span className="font-mono">{params.id}</span>
            </p>
          </div>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-farm-primary text-white rounded-lg text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Transactions</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-farm-bg py-6 px-3 sm:px-6">
      <ReceiptCard receipt={receipt} />
    </div>
  );
}
