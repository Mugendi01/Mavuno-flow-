"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Scale, TrendingUp, Sparkles, Layers } from "lucide-react";

interface LivestockChartsProps {
  feedData: Array<{ date: string; issuedKg: number; consumedKg: number; cost: number }>;
  productionData: Array<{ date: string; quantity: number; secondaryQuantity: number; unit: string }>;
  conversionData: Array<{ date: string; feedKg: number; productionQty: number; ratio: number | null }>;
  primaryUnit?: string;
  species?: string;
}

export function LivestockCharts({
  feedData,
  productionData,
  conversionData,
  primaryUnit = "units",
  species = "POULTRY",
}: LivestockChartsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeChart, setActiveChart] = useState<"FEED" | "PRODUCTION" | "EFFICIENCY">("FEED");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-64 bg-farm-surface border border-farm-border rounded-3xl p-6 flex items-center justify-center text-xs text-farm-muted">
        Loading charts...
      </div>
    );
  }

  const hasFeedData = feedData.length > 0 && feedData.some((d) => d.issuedKg > 0 || d.consumedKg > 0);
  const hasProdData = productionData.length > 0 && productionData.some((d) => d.quantity > 0);

  const formatShortDate = (str: string) => {
    try {
      const parts = str.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      return str;
    } catch {
      return str;
    }
  };

  return (
    <div className="bg-farm-surface border border-farm-border rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Chart Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-farm-primary tracking-tight">
            Productivity & Input Trends
          </h3>
          <p className="text-xs text-farm-slate">
            Visual comparison of daily feed usage against output yields.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 bg-farm-bg p-1 rounded-2xl border border-farm-border text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveChart("FEED")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeChart === "FEED"
                ? "bg-farm-primary text-white shadow-xs"
                : "text-farm-slate hover:text-farm-charcoal"
            }`}
          >
            Feed Quantities (kg)
          </button>
          <button
            onClick={() => setActiveChart("PRODUCTION")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeChart === "PRODUCTION"
                ? "bg-farm-primary text-white shadow-xs"
                : "text-farm-slate hover:text-farm-charcoal"
            }`}
          >
            Production ({primaryUnit})
          </button>
          <button
            onClick={() => setActiveChart("EFFICIENCY")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeChart === "EFFICIENCY"
                ? "bg-farm-primary text-white shadow-xs"
                : "text-farm-slate hover:text-farm-charcoal"
            }`}
          >
            Feed-to-Yield Ratio
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {activeChart === "FEED" && (
          <>
            {!hasFeedData ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-farm-slate border border-dashed border-farm-border rounded-2xl">
                <Scale className="w-8 h-8 text-farm-muted mb-2" />
                <p className="text-xs font-bold text-farm-charcoal">No feed records for this period</p>
                <p className="text-[11px] text-farm-muted mt-0.5">
                  Record daily feed rations to generate the feed quantity trend chart.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit="kg"
                  />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      `${val.toLocaleString()} kg`,
                      name === "issuedKg" ? "Feed Issued" : "Actual Consumed",
                    ]}
                    labelFormatter={(l) => `Date: ${l}`}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="issuedKg"
                    name="issuedKg"
                    fill="#D97706"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="consumedKg"
                    name="consumedKg"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}

        {activeChart === "PRODUCTION" && (
          <>
            {!hasProdData ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-farm-slate border border-dashed border-farm-border rounded-2xl">
                <TrendingUp className="w-8 h-8 text-farm-muted mb-2" />
                <p className="text-xs font-bold text-farm-charcoal">No production records for this period</p>
                <p className="text-[11px] text-farm-muted mt-0.5">
                  Log your daily harvests or weight measurements to view output trends over time.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${val.toLocaleString()} ${primaryUnit}`, "Output Yield"]}
                    labelFormatter={(l) => `Date: ${l}`}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="quantity"
                    name="Output Yield"
                    stroke="#15803D"
                    strokeWidth={3}
                    dot={{ fill: "#15803D", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </>
        )}

        {activeChart === "EFFICIENCY" && (
          <>
            {conversionData.length === 0 || !conversionData.some((d) => d.ratio !== null) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-farm-slate border border-dashed border-farm-border rounded-2xl">
                <Sparkles className="w-8 h-8 text-farm-muted mb-2" />
                <p className="text-xs font-bold text-farm-charcoal">Insufficient matching data</p>
                <p className="text-[11px] text-farm-muted mt-0.5 max-w-sm">
                  Record both feed inputs and production outputs on the same dates to view your conversion ratio trend.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${val}`, "Feed-to-Yield Ratio"]}
                    labelFormatter={(l) => `Date: ${l}`}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ratio"
                    name="Feed / Unit Ratio"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    dot={{ fill: "#8B5CF6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </div>
    </div>
  );
}
