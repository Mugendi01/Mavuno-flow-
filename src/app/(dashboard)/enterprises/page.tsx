import React from "react";
import { AnalyticsService } from "@/lib/services/analyticsService";
import { AuthContextService } from "@/lib/services/authContext";
import { Layers, ArrowUpRight, ArrowDownRight, PieChart, Sparkles, AlertTriangle } from "lucide-react";
import { EnterpriseCardActions } from "@/components/enterprises/EnterpriseCardActions";

export const revalidate = 0;

export default async function EnterprisesPage() {
  let enterprises: any[] = [];
  let dbErrorNotice: string | null = null;
  let currency = "KES";

  try {
    const authContext = await AuthContextService.getActiveContext();
    const farmId = authContext.farm.id;
    currency = authContext.farm.currency || "KES";
    enterprises = await AnalyticsService.getEnterprisePerformance(farmId);
  } catch (error: any) {
    console.error("EnterprisesPage data fetch error:", error);
    dbErrorNotice = error?.message || "Failed to load enterprise data from database.";
  }

  return (
    <div className="space-y-6">
      {/* Database Notice if error */}
      {dbErrorNotice && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-950">Database Connection Notice</p>
            <p className="text-amber-800 font-mono text-[11px]">{dbErrorNotice}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-farm-surface p-4 sm:p-5 rounded-2xl border border-farm-border shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-farm-primary tracking-tight">
          Enterprise Profitability & Cost Drivers
        </h1>
        <p className="text-xs sm:text-sm text-farm-muted mt-0.5">
          Detailed unit-economics, feed expenses, and profit margins for each agricultural unit.
        </p>
      </div>

      {enterprises.length === 0 && !dbErrorNotice && (
        <div className="bg-farm-surface border border-farm-border rounded-2xl p-8 text-center text-xs text-farm-muted">
          No enterprises found. Set up your farm enterprises in onboarding or settings.
        </div>
      )}

      {/* Enterprise Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {enterprises.map((e) => {
          const isProfitable = e.netProfit >= 0;
          return (
            <div
              key={e.enterpriseId}
              className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between pb-3 border-b border-farm-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-farm-mint text-farm-primary flex items-center justify-center font-bold text-xs">
                      {e.enterpriseCode.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-farm-charcoal">{e.enterpriseName}</h3>
                      <span className="text-[11px] text-farm-muted uppercase font-semibold">
                        Type: {e.enterpriseCode}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
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
                      {e.marginPercent}% margin
                    </span>
                    <EnterpriseCardActions
                      enterpriseId={e.enterpriseId}
                      enterpriseName={e.enterpriseName}
                      status={e.status || "ACTIVE"}
                    />
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 py-3 text-center">
                  <div className="p-2.5 bg-farm-bg rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-farm-muted">Revenue</span>
                    <p className="text-sm font-extrabold text-farm-positive mt-0.5">
                      {currency} {e.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2.5 bg-farm-bg rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-farm-muted">Expenses</span>
                    <p className="text-sm font-extrabold text-farm-negative mt-0.5">
                      {currency} {e.expenses.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`p-2.5 rounded-xl ${
                      isProfitable ? "bg-emerald-50" : "bg-red-50"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-farm-slate">Net Result</span>
                    <p
                      className={`text-sm font-extrabold mt-0.5 ${
                        isProfitable ? "text-emerald-900" : "text-red-900"
                      }`}
                    >
                      {isProfitable ? "+" : ""}
                      {currency} {e.netProfit.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Cost per unit indicator */}
                {e.costPerUnit && (
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-blue-900">{e.costPerUnit.metricName}:</span>
                      <span className="text-blue-800 ml-1">
                        {currency} {e.costPerUnit.value.toLocaleString()} / {e.costPerUnit.unit}
                      </span>
                    </div>
                    {e.costPerUnit.isEstimated && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">
                        Estimated
                      </span>
                    )}
                  </div>
                )}

                {/* Cost Drivers Breakdown */}
                <div className="space-y-2 mt-4">
                  <span className="text-xs font-bold text-farm-slate uppercase tracking-wider block">
                    Expense Drivers Breakdown
                  </span>
                  {e.costBreakdown.length === 0 ? (
                    <p className="text-xs text-farm-muted">No expenses recorded for this period.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {e.costBreakdown.map((item: any) => (
                        <div key={item.category} className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-farm-charcoal font-medium">{item.category}</span>
                            <span className="text-farm-muted font-bold">
                              {currency} {item.amount.toLocaleString()} ({item.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-farm-bg rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-farm-secondary h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, item.percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
