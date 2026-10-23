"use client";

import React, { useState, useEffect } from "react";
import { ReceivableDTO } from "@/lib/types";
import { ReceivablesTable } from "@/components/receivables/ReceivablesTable";
import { Users2, AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<ReceivableDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadReceivables = async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === "ALL"
          ? "/api/receivables"
          : `/api/receivables?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReceivables(data.receivables || []);
      }
    } catch (e) {
      console.error("Failed to load receivables", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceivables();
  }, [statusFilter]);

  const currency = "KES";

  const totalOutstanding = receivables.reduce((sum, r) => sum + r.balanceAmount, 0);
  const totalOriginal = receivables.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalCollected = receivables.reduce((sum, r) => sum + r.paidAmount, 0);
  const overdueCount = receivables.filter((r) => r.status === "OVERDUE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-farm-surface p-4 sm:p-5 rounded-2xl border border-farm-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-farm-primary tracking-tight">
            Accounts Receivable (Debtors Ledger)
          </h1>
          <p className="text-xs sm:text-sm text-farm-muted mt-0.5">
            Track produce sold on credit, outstanding balances & collect payments.
          </p>
        </div>

        <button
          onClick={loadReceivables}
          className="p-2 text-farm-slate hover:text-farm-primary hover:bg-farm-bg rounded-lg border border-farm-border self-start sm:self-auto"
          title="Refresh ledger"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase">Outstanding Balance</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-xl font-black text-amber-950 mt-1">
            {currency} {totalOutstanding.toLocaleString()}
          </p>
          <span className="text-[11px] text-amber-700">Awaiting customer collection</span>
        </div>

        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase">Payments Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl font-black text-emerald-950 mt-1">
            {currency} {totalCollected.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-700">Recovered debt</span>
        </div>

        <div className="p-4 bg-red-50/60 rounded-2xl border border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-900 uppercase">Overdue Accounts</span>
            <AlertTriangle className="w-4 h-4 text-red-700" />
          </div>
          <p className="text-xl font-black text-red-950 mt-1">{overdueCount}</p>
          <span className="text-[11px] text-red-700">Passed payment due date</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {["ALL", "PENDING", "PARTIALLY_PAID", "OVERDUE", "PAID"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
              statusFilter === st
                ? "bg-farm-primary text-white border-farm-primary"
                : "bg-farm-surface text-farm-slate border-farm-border hover:bg-farm-bg"
            }`}
          >
            {st === "ALL" ? "All Debtors" : st.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <ReceivablesTable
        receivables={receivables}
        currency={currency}
        onRefresh={loadReceivables}
      />
    </div>
  );
}
