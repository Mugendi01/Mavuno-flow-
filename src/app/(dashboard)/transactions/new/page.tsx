"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { QuickLogForm } from "@/components/transactions/QuickLogForm";
import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";

export default function NewTransactionPage() {
  const router = useRouter();

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 text-farm-slate hover:text-farm-primary hover:bg-farm-surface rounded-lg border border-farm-border transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-farm-primary">Record Transaction</h1>
          <p className="text-xs text-farm-muted">Fast mobile-friendly logging</p>
        </div>
      </div>

      <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs">
        <QuickLogForm
          onSuccess={() => router.push("/dashboard")}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
