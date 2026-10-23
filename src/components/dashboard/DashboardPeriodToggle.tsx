"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface DashboardPeriodToggleProps {
  activePeriod: "week" | "month" | "season";
}

export function DashboardPeriodToggle({
  activePeriod = "month",
}: DashboardPeriodToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (period: "week" | "month" | "season") => {
    if (period === activePeriod) return;
    startTransition(() => {
      router.push(`/dashboard?period=${period}`, { scroll: false });
    });
  };

  return (
    <div className="flex items-center gap-1.5 bg-farm-bg p-1 rounded-xl border border-farm-border text-xs font-semibold self-start sm:self-auto shadow-2xs">
      <button
        type="button"
        disabled={isPending}
        onClick={() => handlePeriodChange("week")}
        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
          activePeriod === "week"
            ? "bg-farm-primary text-white font-bold shadow-xs"
            : "text-farm-slate hover:text-farm-primary hover:bg-farm-surface"
        }`}
      >
        <span>This Week</span>
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={() => handlePeriodChange("month")}
        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
          activePeriod === "month"
            ? "bg-farm-primary text-white font-bold shadow-xs"
            : "text-farm-slate hover:text-farm-primary hover:bg-farm-surface"
        }`}
      >
        <span>This Month</span>
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={() => handlePeriodChange("season")}
        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
          activePeriod === "season"
            ? "bg-farm-primary text-white font-bold shadow-xs"
            : "text-farm-slate hover:text-farm-primary hover:bg-farm-surface"
        }`}
      >
        <span>This Season</span>
      </button>

      {isPending && (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-farm-primary mr-1" />
      )}
    </div>
  );
}
