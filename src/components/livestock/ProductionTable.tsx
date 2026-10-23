"use client";

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { ProductionRecordDTO } from "@/lib/types";
import { TrendingUp, Edit2, Trash2, Search, ArrowRight, Egg, Milk, Scale } from "lucide-react";

interface ProductionTableProps {
  records: ProductionRecordDTO[];
  onEdit: (record: ProductionRecordDTO) => void;
  onDelete: (recordId: string) => void;
  onRecordProduction?: () => void;
}

export function ProductionTable({
  records,
  onEdit,
  onDelete,
  onRecordProduction,
}: ProductionTableProps) {
  const [search, setSearch] = useState("");

  const filtered = records.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.metric.toLowerCase().includes(s) ||
      (r.livestockGroupName && r.livestockGroupName.toLowerCase().includes(s)) ||
      (r.qualityGrade && r.qualityGrade.toLowerCase().includes(s)) ||
      (r.notes && r.notes.toLowerCase().includes(s))
    );
  });

  const getMetricBadge = (metric: string) => {
    switch (metric.toUpperCase()) {
      case "EGGS":
        return {
          bg: "bg-amber-100 text-amber-900 border-amber-200",
          icon: Egg,
          label: "Eggs",
        };
      case "MILK":
        return {
          bg: "bg-blue-100 text-blue-900 border-blue-200",
          icon: Milk,
          label: "Milk",
        };
      case "WEIGHT":
        return {
          bg: "bg-emerald-100 text-emerald-900 border-emerald-200",
          icon: Scale,
          label: "Weight",
        };
      case "MORTALITY":
        return {
          bg: "bg-red-100 text-red-900 border-red-200",
          icon: null,
          label: "Mortality",
        };
      default:
        return {
          bg: "bg-purple-100 text-purple-900 border-purple-200",
          icon: null,
          label: metric,
        };
    }
  };

  return (
    <div className="bg-farm-surface border border-farm-border rounded-3xl overflow-hidden shadow-xs">
      {/* Search Header */}
      <div className="p-4 sm:p-5 border-b border-farm-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-farm-primary">
            Production Output Ledger
          </h3>
          <p className="text-xs text-farm-slate">
            Historical output records, egg batches, milk collections, and live weights.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-farm-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search metric or group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-farm-bg border border-farm-border rounded-xl text-xs font-medium text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table / Empty State */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-farm-charcoal">No production records found</p>
            <p className="text-xs text-farm-slate mt-0.5 max-w-sm mx-auto">
              {search
                ? "No entries match your search query."
                : "No production records have been entered for this time period yet."}
            </p>
          </div>
          {onRecordProduction && (
            <button
              onClick={onRecordProduction}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-farm-primary text-white rounded-xl text-xs font-bold hover:bg-farm-primaryDark transition-colors shadow-xs"
            >
              <span>+ Record First Output</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-farm-bg/70 text-farm-slate font-bold uppercase tracking-wider border-b border-farm-border text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Group / Enterprise</th>
                <th className="py-3 px-4">Output Metric</th>
                <th className="py-3 px-4 text-right">Primary Quantity</th>
                <th className="py-3 px-4 text-right">Damaged / Rejected</th>
                <th className="py-3 px-4">Grade / Details</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farm-border/60">
              {filtered.map((r) => {
                let formattedDate = r.date;
                try {
                  formattedDate = format(parseISO(r.date), "dd MMM yyyy");
                } catch {}

                const badge = getMetricBadge(r.metric);

                return (
                  <tr key={r.id} className="hover:bg-farm-bg/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-farm-charcoal whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="py-3.5 px-4 text-farm-slate">
                      <span className="font-semibold text-farm-charcoal">
                        {r.livestockGroupName || "General Farm"}
                      </span>
                      <span className="block text-[11px] text-farm-muted">{r.enterpriseName}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${badge.bg}`}
                      >
                        {badge.icon && <badge.icon className="w-3 h-3" />}
                        <span>{badge.label}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-farm-charcoal text-sm">
                        {r.quantity.toLocaleString()} {r.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.secondaryQuantity !== null && r.secondaryQuantity !== undefined && r.secondaryQuantity > 0 ? (
                        <span className="font-semibold text-red-600">
                          {r.secondaryQuantity.toLocaleString()} {r.unit}
                        </span>
                      ) : (
                        <span className="text-farm-muted">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.qualityGrade ? (
                        <span className="font-semibold text-farm-charcoal">{r.qualityGrade}</span>
                      ) : (
                        <span className="text-farm-muted">—</span>
                      )}
                      {r.notes && (
                        <span className="block text-[11px] text-farm-slate truncate max-w-xs">
                          {r.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(r)}
                          className="p-1.5 rounded-lg text-farm-slate hover:text-farm-primary hover:bg-farm-bg transition-colors"
                          title="Edit Production Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this production record?")) {
                              onDelete(r.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete Production Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
