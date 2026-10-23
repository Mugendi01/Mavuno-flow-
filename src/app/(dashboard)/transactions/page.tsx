import React from "react";
import { TransactionService } from "@/lib/services/transactionService";
import { format } from "date-fns";
import {
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
} from "lucide-react";
import Link from "next/link";

import { AuthContextService } from "@/lib/services/authContext";
import { TransactionRowActions } from "@/components/transactions/TransactionRowActions";

export const revalidate = 0;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  let farmId = "";
  const typeFilter = searchParams.type as any;
  const enterpriseId = searchParams.enterpriseId;
  const search = searchParams.search;

  let data = { transactions: [] as any[], total: 0 };
  let dbErrorNotice: string | null = null;
  let currency = "KES";

  try {
    const authContext = await AuthContextService.getActiveContext(searchParams.farmId);
    farmId = authContext.farm.id;
    currency = authContext.farm.currency || "KES";

    data = await TransactionService.getTransactions({
      farmId,
      type: typeFilter,
      enterpriseId,
      search,
      limit: 100,
    });
  } catch (error: any) {
    console.error("TransactionsPage data fetch error:", error);
    dbErrorNotice = error?.message || "Failed to load transactions from database.";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-farm-surface p-4 sm:p-5 rounded-2xl border border-farm-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-farm-primary tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-xs sm:text-sm text-farm-muted mt-0.5">
            Complete audit-logged history of sales, expenses, and payments.
          </p>
        </div>

        <Link
          href="/transactions/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-farm-primary hover:bg-farm-secondary text-white rounded-xl text-xs font-bold transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-farm-lime" />
          <span>New Entry</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        <Link
          href="/transactions"
          className={`px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
            !typeFilter
              ? "bg-farm-primary text-white border-farm-primary"
              : "bg-farm-surface text-farm-slate border-farm-border hover:bg-farm-bg"
          }`}
        >
          All Entries ({data.total})
        </Link>
        <Link
          href="/transactions?type=SALE"
          className={`px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
            typeFilter === "SALE"
              ? "bg-farm-positive text-white border-farm-positive"
              : "bg-farm-surface text-farm-slate border-farm-border hover:bg-farm-bg"
          }`}
        >
          Income / Sales Only
        </Link>
        <Link
          href="/transactions?type=EXPENSE"
          className={`px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
            typeFilter === "EXPENSE"
              ? "bg-farm-negative text-white border-farm-negative"
              : "bg-farm-surface text-farm-slate border-farm-border hover:bg-farm-bg"
          }`}
        >
          Expenses Only
        </Link>
      </div>

      {/* Transactions Table */}
      <div className="bg-farm-surface border border-farm-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-farm-bg/70 border-b border-farm-border text-farm-slate font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Enterprise</th>
                <th className="py-3 px-4">Category / Item</th>
                <th className="py-3 px-4">Qty & Unit</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Receipt</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farm-border">
              {data.transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-farm-muted text-xs">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                data.transactions.map((tx) => {
                  const isSale = tx.type === "SALE";
                  return (
                    <tr key={tx.id} className="hover:bg-farm-bg/40 transition-colors">
                      <td className="py-3.5 px-4 text-farm-slate whitespace-nowrap">
                        {format(new Date(tx.transactionDate), "dd MMM yyyy")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isSale
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isSale ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          {isSale ? "Sale" : "Expense"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-farm-charcoal">
                        {tx.enterpriseName}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-farm-charcoal">{tx.categoryName}</div>
                        {tx.notes && (
                          <div className="text-[11px] text-farm-muted truncate max-w-[220px]">
                            {tx.notes}
                          </div>
                        )}
                        {tx.buyerName && (
                          <div className="text-[11px] text-emerald-800 font-medium">
                            Buyer: {tx.buyerName}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-farm-slate text-xs">
                        {tx.quantity ? `${tx.quantity} ${tx.unit || ""}` : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-farm-bg border border-farm-border text-xs font-semibold text-farm-slate">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-black text-sm ${
                            isSale ? "text-farm-positive" : "text-farm-negative"
                          }`}
                        >
                          {isSale ? "+" : "−"}
                          {currency} {tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {tx.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {tx.paymentStatus === "PARTIALLY_PAID" ? "Partially Paid" : "Credit"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {tx.receiptNumber ? (
                          <Link
                            href={`/receipts/${tx.receiptId || tx.receiptNumber}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-farm-mint/60 hover:bg-farm-mint text-farm-primary border border-farm-secondary/30 transition-colors shadow-2xs"
                            title="View Digital Receipt & QR"
                          >
                            <QrCode className="w-3.5 h-3.5 text-farm-secondary" />
                            <span>{tx.receiptNumber}</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-farm-muted">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <TransactionRowActions transaction={tx} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
