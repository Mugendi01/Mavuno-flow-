import React from "react";
import Link from "next/link";
import { TransactionDTO } from "@/lib/types";
import { ArrowUpRight, ArrowDownRight, Smartphone, Banknote, Building, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface RecentTransactionsProps {
  transactions: TransactionDTO[];
  currency?: string;
}

export function RecentTransactions({
  transactions,
  currency = "KES",
}: RecentTransactionsProps) {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case "MPESA":
        return <Smartphone className="w-3.5 h-3.5 text-blue-600" />;
      case "CASH":
        return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
      case "BANK":
        return <Building className="w-3.5 h-3.5 text-purple-600" />;
      case "CREDIT":
        return <CreditCard className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-farm-surface border border-farm-border rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-farm-primary">Recent Transactions</h3>
          <p className="text-xs text-farm-muted">Latest operational income & expenses</p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-bold text-farm-secondary hover:text-farm-primary hover:underline"
        >
          View All →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="py-8 text-center text-xs text-farm-muted">
          No transactions recorded yet. Tap Quick Log to start!
        </div>
      ) : (
        <div className="divide-y divide-farm-border">
          {transactions.slice(0, 6).map((tx) => {
            const isSale = tx.type === "SALE";
            return (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-farm-bg/40 px-1 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSale
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {isSale ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-farm-charcoal truncate">
                      {tx.categoryName || (isSale ? "Sale" : "Expense")}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-farm-muted flex-wrap">
                      <span>{tx.enterpriseName}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(tx.transactionDate), "dd MMM yyyy")}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        {getMethodIcon(tx.paymentMethod)}
                        <span className="font-semibold text-farm-slate">{tx.paymentMethod}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`text-xs sm:text-sm font-extrabold ${
                      isSale ? "text-farm-positive" : "text-farm-negative"
                    }`}
                  >
                    {isSale ? "+" : "−"}
                    {currency} {tx.amount.toLocaleString()}
                  </p>

                  {tx.paymentStatus !== "PAID" ? (
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                      {tx.paymentStatus === "PARTIALLY_PAID" ? "Partially Paid" : "Credit"}
                    </span>
                  ) : (
                    <span className="text-[10px] text-farm-muted">Paid</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
