import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  amount: string;
  subtext?: string;
  changePercent?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "neutral" | "positive" | "negative" | "warning" | "info";
}

export function StatCard({
  title,
  amount,
  subtext,
  changePercent,
  changeLabel = "WoW",
  icon: Icon,
  variant = "neutral",
}: StatCardProps) {
  const variantStyles = {
    neutral: "border-farm-border text-farm-primary",
    positive: "border-emerald-200 bg-emerald-50/40 text-farm-positive",
    negative: "border-red-200 bg-red-50/30 text-farm-negative",
    warning: "border-amber-200 bg-amber-50/40 text-farm-warning",
    info: "border-blue-200 bg-blue-50/40 text-farm-info",
  };

  const iconBgStyles = {
    neutral: "bg-farm-bg text-farm-primary",
    positive: "bg-emerald-100 text-emerald-800",
    negative: "bg-red-100 text-red-800",
    warning: "bg-amber-100 text-amber-800",
    info: "bg-blue-100 text-blue-800",
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-farm-surface border shadow-xs flex flex-col justify-between transition-all hover:shadow-sm ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-farm-slate">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${iconBgStyles[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-farm-charcoal">
          {amount}
        </h3>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {changePercent !== undefined && (
            <span
              className={`text-xs font-bold px-1.5 py-0.2 rounded-md ${
                changePercent >= 0
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {changePercent >= 0 ? "▲ +" : "▼ "}
              {changePercent}% {changeLabel}
            </span>
          )}

          {subtext && <span className="text-xs text-farm-muted">{subtext}</span>}
        </div>
      </div>
    </div>
  );
}
