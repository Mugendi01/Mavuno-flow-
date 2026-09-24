"use client";

import React, { useState } from "react";
import { ReceivableDTO } from "@/lib/types";
import { format } from "date-fns";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { Users2, DollarSign, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ReceivablesTableProps {
  receivables: ReceivableDTO[];
  currency?: string;
  onRefresh: () => void;
}

export function ReceivablesTable({
  receivables,
  currency = "KES",
  onRefresh,
}: ReceivablesTableProps) {
  const [selectedReceivable, setSelectedReceivable] = useState<ReceivableDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenPayment = (r: ReceivableDTO) => {
    setSelectedReceivable(r);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </span>
        );
      case "PARTIALLY_PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            Partially Paid
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            Pending
          </span>
        );
    }
  };

  return (
    <>
      <div className="bg-farm-surface border border-farm-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-farm-bg/70 border-b border-farm-border text-farm-slate font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Sale Date</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farm-border">
              {receivables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-farm-muted text-xs">
                    No debtor records found.
                  </td>
                </tr>
              ) : (
                receivables.map((r) => (
                  <tr key={r.id} className="hover:bg-farm-bg/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-farm-charcoal">
                      <div>{r.customerName}</div>
                      {r.customerPhone && (
                        <div className="text-[11px] text-farm-muted font-normal">
                          {r.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-farm-slate text-xs">
                      {r.transaction?.transactionDate
                        ? format(new Date(r.transaction.transactionDate), "dd MMM yyyy")
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-farm-charcoal">
                      {currency} {r.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-farm-positive">
                      {currency} {r.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-farm-warning">
                      {currency} {r.balanceAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-farm-slate">
                      {r.dueDate ? format(new Date(r.dueDate), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(r.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {r.balanceAmount > 0 ? (
                        <button
                          onClick={() => handleOpenPayment(r)}
                          className="px-3 py-1.5 bg-farm-primary hover:bg-farm-secondary text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Record Pay
                        </button>
                      ) : (
                        <span className="text-xs text-farm-muted">Settled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecordPaymentModal
        receivable={selectedReceivable}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
        currency={currency}
      />
    </>
  );
}
