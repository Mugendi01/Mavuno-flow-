import React from "react";
import Link from "next/link";
import { AuthContextService } from "@/lib/services/authContext";
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
  PlusCircle,
  Sprout,
  Receipt,
  FileSpreadsheet,
  QrCode,
  ArrowRight,
  Sparkles,
  Wheat,
} from "lucide-react";

export const revalidate = 0; // Fresh SSR data

export default async function DashboardPage() {
  let authContext: any = null;
  let farm: any = null;
  let user: any = null;

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
  let activeEnterprises: any[] = [];
  let dbErrorNotice: string | null = null;

  try {
    // 1. Resolve authoritative authenticated user and farm
    authContext = await AuthContextService.getActiveContext();
    farm = authContext.farm;
    user = authContext.user;

    const farmId = farm.id;

    // 2. Fetch active enterprises for this farm
    activeEnterprises = await prisma.enterprise.findMany({
      where: { farmId, status: "ACTIVE" },
      include: { enterpriseType: true },
    });

    // 3. Fetch real aggregated data using server domain services
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

  const currency = farm?.currency || "KES";
  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Farmer";
  const hasTransactions = txData.total > 0;

  return (
    <div className="space-y-6">
      {/* Database Error / Setup Banner if connection failed */}
      {dbErrorNotice && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-950">Database Connection Notice</p>
            <p className="text-amber-800 leading-relaxed font-mono text-[11px]">{dbErrorNotice}</p>
          </div>
        </div>
      )}

      {/* Header & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-farm-surface p-4 sm:p-5 rounded-2xl border border-farm-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-farm-primary tracking-tight">
              {hasTransactions ? "Financial Health Dashboard" : `Welcome to MavunoFlow, ${firstName}`}
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-farm-mint text-farm-primary">
              {farm?.name || "Your Farm"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-farm-muted mt-0.5">
            {hasTransactions
              ? "Real-time revenue, spending, enterprise margins & cash collections."
              : `Your farm profile in ${farm?.locationCounty || "Kenya"} is ready. Let's record your first activity.`}
          </p>
        </div>

        {/* Date Filter selector if transactions exist */}
        {hasTransactions ? (
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
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/transactions/new?type=EXPENSE"
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </Link>
            <Link
              href="/transactions/new?type=SALE"
              className="px-3.5 py-2 bg-farm-primary hover:bg-farm-primaryDark text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-farm-lime" />
              <span>Record Sale</span>
            </Link>
          </div>
        )}
      </div>

      {/* =========================================================================
          FIRST-TIME EMPTY STATE (When no transactions have been logged yet)
      ========================================================================= */}
      {!hasTransactions && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Welcome Banner Card */}
          <div className="bg-white rounded-3xl border border-farm-border p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-farm-border pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌱</span>
                  <h2 className="text-lg sm:text-xl font-black text-farm-charcoal">
                    Your Farm Enterprises Are Configured
                  </h2>
                </div>
                <p className="text-xs text-farm-slate">
                  We've initialized dedicated enterprise ledgers tailored to your onboarding choices:
                </p>
              </div>

              {/* Active Enterprise Pills */}
              <div className="flex flex-wrap gap-2">
                {activeEnterprises.map((ent) => (
                  <span
                    key={ent.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-farm-mint/50 border border-farm-border text-xs font-bold text-farm-primary"
                  >
                    <span>{ent.enterpriseType?.name || ent.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Explanatory callout */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-emerald-950">
                  Once you start recording transactions, MavunoFlow will turn them into useful financial insights.
                </p>
                <p className="text-emerald-800 leading-relaxed">
                  Log your daily feeds, medications, egg or milk harvests, customer payments, and casual wages. Your profit margins, cost driver breakdowns, and weekly reports will generate automatically.
                </p>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl border border-red-200 bg-red-50/40 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-farm-charcoal">Record Farm Expense</h3>
                  <p className="text-xs text-farm-slate mt-0.5">
                    Feeds, casual wages, veterinary vaccines, transport, or supplies.
                  </p>
                </div>
                <Link
                  href="/transactions/new?type=EXPENSE"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-800 pt-1"
                >
                  <span>+ Record First Expense</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-farm-charcoal">Record Produce Sale</h3>
                  <p className="text-xs text-farm-slate mt-0.5">
                    Egg trays, milk litres, live birds, tilapia, goat kids, or fodder.
                  </p>
                </div>
                <Link
                  href="/transactions/new?type=SALE"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 pt-1"
                >
                  <span>+ Record First Sale</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Wheat className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-farm-charcoal">Animal Feed & Store</h3>
                  <p className="text-xs text-farm-slate mt-0.5">
                    Central stock balances, purchases, low-stock alerts, and daily rations.
                  </p>
                </div>
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 pt-1"
                >
                  <span>Open Feed & Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-farm-charcoal">Production Tracking</h3>
                  <p className="text-xs text-farm-slate mt-0.5">
                    Daily egg harvests, milk yields, batch tracking, and laying rates.
                  </p>
                </div>
                <Link
                  href="/production"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-800 hover:text-purple-950 pt-1"
                >
                  <span>Open Production Tracking</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ACTIVE DASHBOARD WITH CONFIRMED TRANSACTION METRICS
      ========================================================================= */}
      {hasTransactions && (
        <>
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Farm Revenue"
              amount={`${currency} ${kpi.totalRevenue.toLocaleString()}`}
              subtext="Money coming into farm"
              changePercent={kpi.comparison?.revenueChangePercent}
              icon={TrendingUp}
              variant="positive"
            />

            <StatCard
              title="Total Farm Expenses"
              amount={`${currency} ${kpi.totalExpenses.toLocaleString()}`}
              subtext="Cost of feeds, labour & vet"
              changePercent={kpi.comparison?.expensesChangePercent}
              icon={TrendingDown}
              variant="negative"
            />

            <StatCard
              title="Net Profit / Loss"
              amount={`${kpi.netProfit >= 0 ? "+" : ""}${currency} ${kpi.netProfit.toLocaleString()}`}
              subtext={kpi.netProfit >= 0 ? "Operating surplus" : "Operating deficit"}
              changePercent={kpi.comparison?.netProfitChangePercent}
              icon={Scale}
              variant={kpi.netProfit >= 0 ? "positive" : "negative"}
            />

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

            <Link
              href="/feed"
              className="p-4 bg-amber-50/60 hover:bg-amber-100/60 rounded-2xl border border-amber-200 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                  <Wheat className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-900 uppercase">
                    Animal Feed & Central Store
                  </span>
                  <p className="text-sm font-black text-amber-950">
                    Feed Balances, Purchases, Low-Stock Alerts & Rations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-800 shrink-0">
                <span>Manage Feed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/production"
              className="p-4 bg-purple-50/60 hover:bg-purple-100/60 rounded-2xl border border-purple-200 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-800">
                  <TrendingUp className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-900 uppercase">
                    Livestock Production Tracking
                  </span>
                  <p className="text-sm font-black text-purple-950">
                    Daily Egg Collections, Milk Harvests & Laying Rates
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-purple-800 shrink-0">
                <span>Track Yields</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>

          {/* Charts & Enterprise Profitability Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialCharts currency={currency} />
            <EnterpriseMatrix enterprises={enterpriseMetrics} currency={currency} />
          </div>

          {/* Recent Operational Entries */}
          <RecentTransactions transactions={txData.transactions} currency={currency} />
        </>
      )}
    </div>
  );
}
