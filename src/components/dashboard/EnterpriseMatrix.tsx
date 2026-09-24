import React from "react";
import { EnterprisePerformanceMetric } from "@/lib/types";
import { Layers, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface EnterpriseMatrixProps {
  enterprises: EnterprisePerformanceMetric[];
  currency?: string;
}

export function EnterpriseMatrix({
  enterprises,
  currency = "KES",
}: EnterpriseMatrixProps) {
  return (
    <div className="bg-farm-surface border border-farm-border rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-farm-primary text-white flex items-center justify-center">
            <Layers className="w-4 h-4 text-farm-lime" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-farm-primary">
              Enterprise Profitability
            </h3>
            <p className="text-xs text-farm-muted">Which enterprises are making or losing money</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-farm-border text-farm-slate font-bold uppercase tracking-wider text-[11px] pb-2">
              <th className="py-2.5 px-2">Enterprise</th>
              <th className="py-2.5 px-2 text-right">Revenue</th>
              <th className="py-2.5 px-2 text-right">Expenses</th>
              <th className="py-2.5 px-2 text-right">Net Profit/Loss</th>
              <th className="py-2.5 px-2 text-center">Margin</th>
              <th className="py-2.5 px-2 hidden sm:table-cell">Top Cost Driver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-farm-border">
            {enterprises.map((e) => {
              const isProfitable = e.netProfit >= 0;
              return (
                <tr key={e.enterpriseId} className="hover:bg-farm-bg/50 transition-colors">
                  <td className="py-3 px-2 font-bold text-farm-charcoal">
                    {e.enterpriseName}
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-farm-positive">
                    {currency} {e.revenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-farm-negative">
                    {currency} {e.expenses.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-black">
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md ${
                        isProfitable
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isProfitable ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      {isProfitable ? "+" : ""}
                      {currency} {e.netProfit.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-farm-slate">
                    {e.marginPercent}%
                  </td>
                  <td className="py-3 px-2 hidden sm:table-cell text-farm-slate text-xs">
                    {e.topCostDriver ? (
                      <span className="bg-farm-bg px-2 py-0.5 rounded border border-farm-border text-farm-charcoal">
                        {e.topCostDriver}
                      </span>
                    ) : (
                      <span className="text-farm-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
