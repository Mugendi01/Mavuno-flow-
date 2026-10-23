"use client";

import React, { useState } from "react";
import {
  Package,
  AlertTriangle,
  Clock,
  PlusCircle,
  Sliders,
  Settings,
  ArrowRight,
  TrendingDown,
  Warehouse,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { FeedProductDTO, FeedStockStatus } from "@/lib/types";

interface InventoryTableProps {
  products: FeedProductDTO[];
  currency?: string;
  onOpenPurchase: (productId?: string) => void;
  onOpenAdjustment: (productId?: string) => void;
  onOpenEditSettings: (product: FeedProductDTO) => void;
  onOpenIssueFeed: (productId?: string) => void;
}

export function InventoryTable({
  products,
  currency = "KES",
  onOpenPurchase,
  onOpenAdjustment,
  onOpenEditSettings,
  onOpenIssueFeed,
}: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.feedType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.enterpriseName && p.enterpriseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.storageLocation && p.storageLocation.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || p.stockStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: FeedStockStatus) => {
    switch (status) {
      case "IN_STOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            In Stock
          </span>
        );
      case "LOW_STOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3" />
            Low Stock
          </span>
        );
      case "CRITICAL_STOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            Critical Stock
          </span>
        );
      case "OUT_OF_STOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-200">
            Out of Stock
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search feed product, store location, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-farm-card border border-farm-border rounded-xl text-farm-primary placeholder:text-farm-slate/50 focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-farm-card border border-farm-border rounded-xl text-farm-primary font-medium focus:outline-hidden"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="CRITICAL_STOCK">Critical Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-farm-surface border border-farm-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-farm-border bg-farm-bg/50 text-farm-slate uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Feed Product</th>
                <th className="py-3 px-4">Enterprise & Store</th>
                <th className="py-3 px-4 text-right">Available Stock</th>
                <th className="py-3 px-4 text-right">Reserves (Min / Crit)</th>
                <th className="py-3 px-4 text-center">Days Remaining</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farm-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-farm-slate">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No feed products found</p>
                    <p className="text-xs text-farm-slate/80 mt-1">
                      {searchTerm
                        ? "Try clearing your search query"
                        : "Click 'Track Feed Product' to register your inventory items."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-farm-card/50 transition-colors group"
                  >
                    {/* Feed Product */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-farm-primary text-xs">{p.name}</div>
                      <div className="text-[11px] text-farm-slate flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-farm-bg border border-farm-border text-[10px]">
                          {p.feedType}
                        </span>
                        {p.intendedUse && (
                          <span className="truncate max-w-[160px] text-farm-slate/80">
                            • {p.intendedUse}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Enterprise & Location */}
                    <td className="py-3.5 px-4 text-farm-slate">
                      <div className="font-semibold text-farm-primary">
                        {p.enterpriseName || "General / Farm"}
                      </div>
                      <div className="text-[11px] flex items-center gap-1 text-farm-slate mt-0.5">
                        <Warehouse className="w-3 h-3 text-farm-slate/70" />
                        <span>{p.storageLocation || "Main Store"}</span>
                      </div>
                    </td>

                    {/* Available Stock & Value */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-extrabold text-sm text-farm-primary">
                        {p.currentStockKg.toLocaleString()} kg
                      </div>
                      <div className="text-[10px] text-farm-slate mt-0.5">
                        {p.defaultUnit === "bags" && p.defaultBagWeightKg ? (
                          <span>
                            ~{(p.currentStockKg / p.defaultBagWeightKg).toFixed(1)} bags ({p.defaultBagWeightKg}kg)
                          </span>
                        ) : p.defaultUnit === "bales" ? (
                          <span>~{(p.currentStockKg / 15).toFixed(1)} bales</span>
                        ) : (
                          <span>
                            {p.totalStockValue ? `Valued: ${currency} ${p.totalStockValue.toLocaleString()}` : "—"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Reserves */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-semibold text-farm-primary text-xs">
                        Min: {p.minReserveKg.toLocaleString()} kg
                      </div>
                      <div className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 font-medium">
                        Critical: {p.criticalReserveKg.toLocaleString()} kg
                      </div>
                    </td>

                    {/* Estimated Days Remaining */}
                    <td className="py-3.5 px-4 text-center">
                      {p.daysRemaining !== null && p.daysRemaining !== undefined ? (
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                              p.daysRemaining <= (p.leadTimeDays || 3)
                                ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-extrabold"
                                : p.daysRemaining <= (p.leadTimeDays || 3) + 2
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            ~{p.daysRemaining} days
                          </span>
                          <span className="text-[10px] text-farm-slate mt-0.5">
                            Lead time: {p.leadTimeDays || 3}d
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-farm-slate/70 italic">
                          Need usage data
                        </span>
                      )}
                    </td>

                    {/* Stock Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(p.stockStatus)}
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenPurchase(p.id)}
                          className="px-2.5 py-1 bg-farm-primary hover:bg-farm-primary/90 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
                          title="Record feed purchase"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Buy</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenIssueFeed(p.id)}
                          className="px-2.5 py-1 border border-farm-border hover:bg-farm-card text-farm-primary rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          title="Issue feed to livestock"
                        >
                          <span>Issue</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenAdjustment(p.id)}
                          className="p-1 text-farm-slate hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                          title="Manual adjustment (wastage/return)"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenEditSettings(p)}
                          className="p-1 text-farm-slate hover:text-farm-primary hover:bg-farm-card rounded-lg transition-colors"
                          title="Edit product settings & reserves"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
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
