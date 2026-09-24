"use client";

import React, { useState, useEffect } from "react";
import { WeeklyFarmDigestData } from "@/lib/types";
import {
  Printer,
  Mail,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";

export function WeeklyDigestView() {
  const [digest, setDigest] = useState<WeeklyFarmDigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadDigest() {
      try {
        setLoading(true);
        const res = await fetch("/api/reports/weekly?farmId=baraka-agri-ventures");
        if (res.ok) {
          const data = await res.json();
          setDigest(data);
        }
      } catch (err) {
        console.error("Failed to load digest", err);
      } finally {
        setLoading(false);
      }
    }
    loadDigest();
  }, []);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleTriggerEmail = async () => {
    setIsSending(true);
    setEmailStatus(null);
    try {
      const res = await fetch("/api/cron/weekly-digest", {
        method: "POST",
      });
      if (res.ok) {
        setEmailStatus("Digest dispatched to farmer@farmpulse.co.ke successfully!");
      } else {
        setEmailStatus("Dispatch failed. Please check mail settings.");
      }
    } catch (e) {
      setEmailStatus("Failed to send test email.");
    } finally {
      setIsSending(false);
    }
  };

  if (loading || !digest) {
    return (
      <div className="py-16 text-center text-farm-muted flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-farm-primary" />
        <span className="text-xs">Compiling farm weekly digest...</span>
      </div>
    );
  }

  const { farm, period, kpi, enterprises, topExpenses, outstandingDebtors, keyInsights } = digest;
  const currency = farm.currency;

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print flex items-center justify-between flex-wrap gap-3 p-4 bg-farm-surface rounded-2xl border border-farm-border">
        <div>
          <h2 className="text-base font-bold text-farm-primary">Weekly Farm Digest</h2>
          <p className="text-xs text-farm-muted">
            Week {period.weekNumber}, {period.year} ({period.startDate} to {period.endDate})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerEmail}
            disabled={isSending}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-farm-primary bg-farm-mint/70 hover:bg-farm-mint rounded-lg transition-colors border border-farm-accent/30"
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            <span>Email Digest</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-farm-primary hover:bg-farm-secondary rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {emailStatus && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{emailStatus}</span>
        </div>
      )}

      {/* Printable Weekly Summary Report (Styled for 1-Page PDF) */}
      <div className="bg-farm-surface border border-farm-border rounded-2xl p-6 shadow-sm print:p-0 print:border-none print:shadow-none">
        {/* Report Header */}
        <div className="flex justify-between items-start border-b-2 border-farm-primary pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-farm-primary tracking-tight">FARMPULSE</span>
              <span className="text-xs font-bold bg-farm-mint text-farm-primary px-2 py-0.5 rounded">
                WEEKLY DIGEST
              </span>
            </div>
            <h1 className="text-lg font-extrabold text-farm-charcoal mt-1">{farm.name}</h1>
            <p className="text-xs text-farm-muted">{farm.locationCounty}, Kenya</p>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-farm-primary">Week {period.weekNumber}, {period.year}</div>
            <div className="text-farm-muted">{period.startDate} — {period.endDate}</div>
            <div className="text-[11px] text-farm-muted mt-1">Generated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* 3 Top KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 bg-farm-bg rounded-xl border border-farm-border text-center">
            <span className="text-[11px] font-bold text-farm-muted uppercase">Revenue</span>
            <p className="text-lg font-black text-farm-positive mt-1">
              {currency} {kpi.totalRevenue.toLocaleString()}
            </p>
            <span className="text-[10px] font-bold text-farm-positive">
              ▲ +{Math.abs(kpi.comparison?.revenueChangePercent || 0)}% WoW
            </span>
          </div>

          <div className="p-3.5 bg-farm-bg rounded-xl border border-farm-border text-center">
            <span className="text-[11px] font-bold text-farm-muted uppercase">Expenses</span>
            <p className="text-lg font-black text-farm-negative mt-1">
              {currency} {kpi.totalExpenses.toLocaleString()}
            </p>
            <span className="text-[10px] font-bold text-farm-muted">
              {kpi.comparison?.expensesChangePercent || 0}% WoW
            </span>
          </div>

          <div
            className={`p-3.5 rounded-xl border text-center ${
              kpi.netProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
            }`}
          >
            <span className="text-[11px] font-bold text-farm-slate uppercase">Net Profit / Loss</span>
            <p
              className={`text-lg font-black mt-1 ${
                kpi.netProfit >= 0 ? "text-emerald-900" : "text-red-900"
              }`}
            >
              {kpi.netProfit >= 0 ? "+" : ""}
              {currency} {kpi.netProfit.toLocaleString()}
            </p>
            <span
              className={`text-[10px] font-bold ${
                kpi.netProfit >= 0 ? "text-emerald-800" : "text-red-800"
              }`}
            >
              {kpi.netProfit >= 0 ? "SURPLUS" : "DEFICIT"}
            </span>
          </div>
        </div>

        {/* Cash Flow vs Receivables Callout */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-xs p-3 bg-farm-bg/50 rounded-xl border border-farm-border">
          <div>
            <span className="text-farm-muted font-medium">Actual Cash Collected:</span>
            <span className="font-bold text-farm-charcoal ml-1.5">
              {currency} {kpi.cashReceived.toLocaleString()}
            </span>
          </div>
          <div className="text-right">
            <span className="text-farm-muted font-medium">Customer Receivables Outstanding:</span>
            <span className="font-bold text-amber-700 ml-1.5">
              {currency} {kpi.outstandingReceivables.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Key Observations */}
        <div className="mb-6 p-3.5 bg-farm-mint/30 border-l-4 border-farm-secondary rounded-r-xl">
          <h4 className="text-xs font-bold text-farm-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-farm-secondary" />
            <span>Key Observations & Farm Health</span>
          </h4>
          <ul className="text-xs text-farm-charcoal space-y-1 pl-4 list-disc">
            {keyInsights.map((insight, idx) => (
              <li key={idx}>{insight}</li>
            ))}
          </ul>
        </div>

        {/* Enterprise Profitability Matrix */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase text-farm-primary border-b border-farm-border pb-1.5 mb-2">
            Enterprise Profitability Matrix
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-farm-border text-farm-slate font-bold">
                <th className="py-1.5 text-left">Enterprise</th>
                <th className="py-1.5 text-right">Revenue</th>
                <th className="py-1.5 text-right">Expenses</th>
                <th className="py-1.5 text-right">Net Result</th>
                <th className="py-1.5 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farm-border">
              {enterprises.map((e) => (
                <tr key={e.enterpriseId}>
                  <td className="py-2 font-bold text-farm-charcoal">{e.enterpriseName}</td>
                  <td className="py-2 text-right font-semibold text-farm-positive">
                    {currency} {e.revenue.toLocaleString()}
                  </td>
                  <td className="py-2 text-right font-semibold text-farm-negative">
                    {currency} {e.expenses.toLocaleString()}
                  </td>
                  <td className="py-2 text-right font-bold text-farm-charcoal">
                    {e.netProfit >= 0 ? "+" : ""}
                    {currency} {e.netProfit.toLocaleString()}
                  </td>
                  <td className="py-2 text-right font-bold text-farm-slate">{e.marginPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top 3 Cost Drivers & Unpaid Debtors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-farm-surface border border-farm-border rounded-xl">
            <h4 className="font-bold text-farm-primary uppercase mb-2">Top 3 Cost Drivers</h4>
            {topExpenses.map((t) => (
              <div key={t.category} className="flex justify-between py-1 border-b border-farm-border last:border-none">
                <span className="text-farm-slate">{t.category}</span>
                <span className="font-bold text-farm-charcoal">
                  {currency} {t.amount.toLocaleString()} ({t.percentage}%)
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-farm-surface border border-farm-border rounded-xl">
            <h4 className="font-bold text-farm-primary uppercase mb-2">Unpaid Customer Receivables</h4>
            {outstandingDebtors.length === 0 ? (
              <p className="text-farm-muted">All customer accounts current.</p>
            ) : (
              outstandingDebtors.map((d) => (
                <div key={d.customerName} className="flex justify-between py-1 border-b border-farm-border last:border-none">
                  <span className="text-farm-slate">{d.customerName}</span>
                  <span className="font-bold text-amber-800">
                    {currency} {d.balance.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Report Footer */}
        <div className="mt-8 pt-3 border-t border-farm-border text-center text-[10px] text-farm-muted">
          FarmPulse Platform • Automated weekly farm summary for Nakuru County • Confidential farm management record
        </div>
      </div>
    </div>
  );
}
