"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  Clock,
  Check,
  ShoppingCart,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { FeedAlertDTO } from "@/lib/types";

interface AlertsBannerProps {
  alerts: FeedAlertDTO[];
  onAcknowledge: (alertId: string) => void;
  onOpenPurchase: (productId?: string) => void;
}

export function AlertsBanner({
  alerts,
  onAcknowledge,
  onOpenPurchase,
}: AlertsBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {alerts.map((alert) => {
        const isCritical = alert.severity === "CRITICAL";
        const isWarning = alert.severity === "WARNING";

        return (
          <div
            key={alert.id}
            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all ${
              isCritical
                ? "bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200"
                : isWarning
                ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200"
                : "bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  isCritical
                    ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                    : isWarning
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                }`}
              >
                {isCritical ? (
                  <AlertCircle className="w-4 h-4 animate-bounce" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10">
                    {alert.alertType.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] font-semibold text-farm-slate">
                    {alert.feedProductName}
                  </span>
                </div>
                <p className="text-xs font-medium mt-1 leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => onOpenPurchase(alert.feedProductId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors ${
                  isCritical
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : isWarning
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Replenish Stock</span>
              </button>

              {alert.status === "ACTIVE" && (
                <button
                  type="button"
                  onClick={() => onAcknowledge(alert.id)}
                  className="px-2.5 py-1.5 border border-current/20 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                  title="Acknowledge alert"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Acknowledge</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
