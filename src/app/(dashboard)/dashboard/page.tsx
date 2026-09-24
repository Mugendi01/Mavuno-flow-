import React from "react";
import { AnalyticsService } from "@/lib/services/analyticsService";
import { TransactionService } from "@/lib/services/transactionService";
import { StatCard } from "@/components/dashboard/StatCard";
import { FinancialCharts } from "@/components/dashboard/FinancialCharts";
import { EnterpriseMatrix } from "@/components/dashboard/EnterpriseMatrix";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import prisma from "@/lib/prisma";
import { FinancialSummaryKPI, EnterprisePerformanceMetric } from "@/lib/types";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Users2,
  Wallet,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export const revalidate = 0; // Fresh SSR data

export default async function DashboardPage() {
  let farmId = "baraka-agri-ventures"; // Using Baraka Agri-Ventures demo farm

  let kpi: FinancialSummaryKPI = {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashReceived: 0,
    cashSpent: 0,
    outstandingReceivables: 0,
    overdueReceivables: 0,
    dateRange: { start: new Date().toISOString(), end: new Date().toISOString() },
    comparison: {
      prevRevenue: 0,
      prevExpenses: 0,
      prevNetProfit: 0,
      revenueChangePercent: 0,
      expensesChangePercent: 0,
      netProfitChangePercent: 0,
    },
  };
  let enterpriseMetrics: EnterprisePerformanceMetric[] = [];
  let txData = { transactions: [] as any[], total: 0 };
  let dbErrorNotice: string | null = null;

  try {
    // Resolve farm by slug or id
    const farm = await prisma.farm.findFirst({
      where: {
        OR: [{ slug: farmId }, { id: farmId }],
      },
    });
    if (farm) {
      farmId = farm.id;
    }

    // Fetch real aggregated data using server domain services
    [kpi, enterpriseMetrics, txData] = await Promise.all([
      AnalyticsService.getFinancialKPIs(farmId),
      AnalyticsService.getEnterprisePerformance(farmId),
      TransactionService.getTransactions({ farmId, limit: 6 }),
    ]);
  } catch (error: any) {
    console.error("Dashboard server-side data fetch error:", error);
    dbErrorNotice =
      error?.message ||
      "Could not connect to the database. Ensure DATABASE_URL is configured and tables are migrated.";
  }

  const currency = "KES";

  return (
    <div className="space-y-6">
      {/* Database Error / Setup Banner if connection failed */}
      {dbErrorNotice && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-950">
              Database Connection Notice
            </p>
            <p className="text-amber-800 leading-relaxed font-mono text-[11px]">
              {dbErrorNotice}
            </p>
            <p className="text-amber-700 text-[11px] pt-1">
              On Vercel, ensure a persistent PostgreSQL database is linked, <code>DATABASE_URL</code> is added in Vercel Project Settings, and <code>npx prisma db push</code> has been executed.
            </p>
          </div>
        </div>
      )}

      {/* Welcome & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-farm-surface p-4 sm:p-5 rounded-2xl border border-farm-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-farm-primary tracking-tight">
            Financial Health Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-farm-muted mt-0.5">
            Real-time revenue, spending, enterprise margins & cash collections.
          </p>
        </div>

        {/* Date Filter selector */}
        <div className="flex items-center gap-1.5 bg-farm-bg p-1 rounded-xl border border-farm-border text-xs font-semibold self-start sm:self-auto">
          <button className="px-3 py-1.5 bg-farm-primary text-white rounded-lg shadow-xs">
            This Month
          </button>
          <button className="px-3 py-1.5 text-farm-slate hover:text-farm-primary rounded-lg">
            This Week
          </button>
          <button className="px-3 py-1.5 text-farm-slate hover:text-farm-primary rounded-lg">
            This Season
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards (Answering core farmer questions) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Q1: Money coming in */}
        <StatCard
          title="Total Farm Revenue"
          amount={`${currency} ${kpi.totalRevenue.toLocaleString()}`}
          subtext="Money coming into farm"
          changePercent={kpi.comparison?.revenueChangePercent}
          icon={TrendingUp}
          variant="positive"
        />

        {/* Q2: Money going out */}
        <StatCard
          title="Total Farm Expenses"
          amount={`${currency} ${kpi.totalExpenses.toLocaleString()}`}
          subtext="Cost of feeds, labour & vet"
          changePercent={kpi.comparison?.expensesChangePercent}
          icon={TrendingDown}
          variant="negative"
        />

        {/* Q3: Net Profit / Loss */}
        <StatCard
          title="Net Profit / Loss"
          amount={`${kpi.netProfit >= 0 ? "+" : ""}${currency} ${kpi.netProfit.toLocaleString()}`}
          subtext={kpi.netProfit >= 0 ? "Operating surplus" : "Operating deficit"}
          changePercent={kpi.comparison?.netProfitChangePercent}
          icon={Scale}
          variant={kpi.netProfit >= 0 ? "positive" : "negative"}
        />

        {/* Q4: Outstanding Receivables */}
        <StatCard
          title="Customer Receivables"
          amount={`${currency} ${kpi.outstandingReceivables.toLocaleString()}`}
          subtext={
            kpi.overdueReceivables > 0
              ? `${currency} ${kpi.overdueReceivables.toLocaleString()} overdue`
              : "Pending collection"
          }
          icon={Users2}
          variant={kpi.overdueReceivables > 0 ? "warning" : "info"}
        />
      </div>

      {/* Cash Flow vs Revenue Insight Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-900 uppercase">Actual Cash Received</span>
              <p className="text-base font-black text-emerald-950">
                {currency} {kpi.cashReceived.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-emerald-700 max-w-[160px] text-right">
            Cash collected in hand & M-Pesa (excludes unpaid credit).
          </p>
        </div>

        <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-900 uppercase">Next Weekly Digest</span>
              <p className="text-base font-black text-blue-950">Monday 07:00 AM</p>
            </div>
          </div>
          <p className="text-[11px] text-blue-700 max-w-[160px] text-right">
            Automated PDF & email summary sent to farm owner.
          </p>
        </div>
      </div>

      {/* Charts & Enterprise Profitability Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialCharts currency={currency} />
        <EnterpriseMatrix enterprises={enterpriseMetrics} currency={currency} />
      </div>

      {/* Recent Operational Entries */}
      <RecentTransactions transactions={txData.transactions} currency={currency} />
    </div>
  );
}
