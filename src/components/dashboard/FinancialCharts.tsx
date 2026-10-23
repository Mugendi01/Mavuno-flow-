"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface FinancialChartsProps {
  currency?: string;
  periodLabel?: string;
}

export function FinancialCharts({ currency = "KES", periodLabel }: FinancialChartsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mock weekly comparison data
  const data = [
    { day: "Mon", Revenue: 24200, Expenses: 19500 },
    { day: "Tue", Revenue: 32000, Expenses: 4500 },
    { day: "Wed", Revenue: 18500, Expenses: 8000 },
    { day: "Thu", Revenue: 28500, Expenses: 6200 },
    { day: "Fri", Revenue: 21000, Expenses: 14000 },
    { day: "Sat", Revenue: 34500, Expenses: 12500 },
    { day: "Sun", Revenue: 29000, Expenses: 9000 },
  ];

  if (!isMounted) {
    return (
      <div className="h-64 sm:h-72 w-full bg-farm-surface border border-farm-border rounded-2xl p-4 flex items-center justify-center text-farm-muted text-xs">
        Loading financial chart...
      </div>
    );
  }

  const formatYAxis = (tick: number) => {
    if (tick >= 1000) return `${(tick / 1000).toFixed(0)}k`;
    return `${tick}`;
  };

  return (
    <div className="bg-farm-surface border border-farm-border rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-farm-primary">
            Revenue vs. Expenses {periodLabel ? `(${periodLabel})` : "(Current Period)"}
          </h3>
          <p className="text-xs text-farm-muted">Comparison in {currency}</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-farm-positive"></span>
            <span className="text-farm-slate">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-farm-negative"></span>
            <span className="text-farm-slate">Expenses</span>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="day"
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: "#6B7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(val: number) => [`${currency} ${val.toLocaleString()}`, ""]}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="Revenue" fill="#15803D" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="Expenses" fill="#DC2626" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
