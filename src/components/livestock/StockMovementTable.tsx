"use client";

import React, { useState } from "react";
import {
  History,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Sliders,
  User,
  Layers,
} from "lucide-react";
import { FeedStockMovementDTO, FeedMovementType } from "@/lib/types";

interface StockMovementTableProps {
  movements: FeedStockMovementDTO[];
  currency?: string;
}

export function StockMovementTable({
  movements,
  currency = "KES",
}: StockMovementTableProps) {
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const filtered = movements.filter((m) => {
    if (typeFilter === "ALL") return true;
    return m.movementType === typeFilter;
  });

  const getMovementBadge = (type: FeedMovementType) => {
    switch (type) {
      case "PURCHASE_RECEIPT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
            Purchase Inflow
          </span>
        );
      case "FEED_ISSUE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <ArrowDownRight className="w-3 h-3 text-blue-600" />
            Issued to Livestock
          </span>
        );
      case "RETURN_TO_STOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
            <RotateCcw className="w-3 h-3 text-teal-600" />
            Return to Stock
          </span>
        );
      case "WASTAGE_LOSS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
            Wastage / Loss
          </span>
        );
      case "MANUAL_ADJUSTMENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Sliders className="w-3 h-3" />
            Manual Adjustment
          </span>
        );
      case "PURCHASE_REVERSAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            Purchase Reversal
          </span>
        );
      default:
        return <span>{type}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-farm-slate">
          Showing <strong>{filtered.length}</strong> stock movements
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-farm-card border border-farm-border rounded-xl text-farm-primary font-medium focus:outline-hidden"
        >
          <option value="ALL">All Movement Types</option>
          <option value="PURCHASE_RECEIPT">Purchase Inflows</option>
          <option value="FEED_ISSUE">Feed Issued</option>
          <option value="RETURN_TO_STOCK">Returns to Stock</option>
          <option value="WASTAGE_LOSS">Wastage & Losses</option>
          <option value="MANUAL_ADJUSTMENT">Manual Adjustments</option>
          <option value="PURCHASE_REVERSAL">Purchase Reversals</option>
        </select>
      </div>

      {/* Movement Table */}
      <div className="bg-farm-surface border border-farm-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-farm-border bg-farm-bg/50 text-farm-slate uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Feed Product</th>
                <th className="py-3 px-4 text-center">Movement Type</th>
                <th className="py-3 px-4 text-right">Quantity Delta</th>
                <th className="py-3 px-4 text-right">Stock Balance</th>
                <th className="py-3 px-4">User & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farm-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-farm-slate">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No stock movements recorded</p>
                    <p className="text-xs text-farm-slate/80 mt-1">
                      Purchases, daily feed issues, and adjustments will appear here automatically.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-farm-card/50 transition-colors">
                    <td className="py-3.5 px-4 text-farm-slate">
                      <div className="font-semibold text-farm-primary">
                        {new Date(m.createdAt).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-[10px] text-farm-slate/80">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-farm-primary">
                      {m.feedProductName}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getMovementBadge(m.movementType)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-xs">
                      <span
                        className={
                          m.quantityKg > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-blue-600 dark:text-blue-400"
                        }
                      >
                        {m.quantityKg > 0 ? `+${m.quantityKg.toLocaleString()}` : m.quantityKg.toLocaleString()} kg
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-semibold text-farm-slate">
                      <span className="text-[11px] text-farm-slate/70">
                        {m.previousStockKg.toLocaleString()} kg
                      </span>
                      <span className="mx-1.5 text-farm-slate/50">→</span>
                      <span className="font-bold text-farm-primary">
                        {m.resultingStockKg.toLocaleString()} kg
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-farm-primary font-medium">{m.reason || "—"}</div>
                      <div className="text-[10px] text-farm-slate flex items-center gap-1 mt-0.5">
                        <User className="w-2.5 h-2.5" />
                        <span>{m.createdByName || "Farm Member"}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
