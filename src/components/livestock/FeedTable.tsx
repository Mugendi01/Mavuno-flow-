"use client";

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { FeedRecordDTO } from "@/lib/types";
import { Scale, Edit2, Trash2, Search, AlertCircle, ArrowRight } from "lucide-react";

interface FeedTableProps {
  records: FeedRecordDTO[];
  onEdit: (record: FeedRecordDTO) => void;
  onDelete: (recordId: string) => void;
  currency?: string;
  onRecordFeed?: () => void;
}

export function FeedTable({
  records,
  onEdit,
  onDelete,
  currency = "KES",
  onRecordFeed,
}: FeedTableProps) {
  const [search, setSearch] = useState("");

  const filtered = records.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.feedType.toLowerCase().includes(s) ||
      (r.livestockGroupName && r.livestockGroupName.toLowerCase().includes(s)) ||
      (r.notes && r.notes.toLowerCase().includes(s))
    );
  });

  return (
    <div className="bg-farm-surface border border-farm-border rounded-3xl overflow-hidden shadow-xs">
      {/* Search Header */}
      <div className="p-4 sm:p-5 border-b border-farm-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-farm-primary">
            Feed Rations & Consumption Log
          </h3>
          <p className="text-xs text-farm-slate">
            Complete audit trail of feeds issued, bags weighed, and measured consumption.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-farm-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search feed type or group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-farm-bg border border-farm-border rounded-xl text-xs font-medium text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table / Empty State */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-farm-charcoal">No feed records found</p>
            <p className="text-xs text-farm-slate mt-0.5 max-w-sm mx-auto">
              {search
                ? "No entries match your search query."
                : "No feed records have been entered for this time period yet."}
            </p>
          </div>
          {onRecordFeed && (
            <button
              onClick={onRecordFeed}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-farm-primary text-white rounded-xl text-xs font-bold hover:bg-farm-primaryDark transition-colors shadow-xs"
            >
              <span>+ Record First Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-farm-bg/70 text-farm-slate font-bold uppercase tracking-wider border-b border-farm-border text-[11px]">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Animal Group / Batch</th>
                <th className="py-3 px-4">Feed Type</th>
                <th className="py-3 px-4 text-right">Quantity Issued</th>
                <th className="py-3 px-4 text-right">Actual Consumed</th>
                <th className="py-3 px-4 text-right">Cost ({currency})</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farm-border/60">
              {filtered.map((r) => {
                let formattedDate = r.date;
                try {
                  formattedDate = format(parseISO(r.date), "dd MMM yyyy, HH:mm");
                } catch {}

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
                      <span className="font-bold text-farm-charcoal">{r.feedType}</span>
                      {r.notes && (
                        <span className="block text-[11px] text-farm-slate truncate max-w-xs">
                          {r.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-farm-charcoal">
                        {r.quantityIssued.toLocaleString()} {r.unit}
                      </span>
                      {r.unit !== "kg" && (
                        <span className="block text-[11px] text-farm-muted">
                          ({r.quantityIssuedKg.toLocaleString()} kg)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.quantityConsumed !== null && r.quantityConsumed !== undefined ? (
                        <span className="font-bold text-emerald-800">
                          {r.quantityConsumed.toLocaleString()} {r.unit}
                          {r.unit !== "kg" && r.quantityConsumedKg && (
                            <span className="block text-[11px] text-emerald-600">
                              ({r.quantityConsumedKg.toLocaleString()} kg)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[11px] text-farm-muted italic">Not measured</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-farm-charcoal">
                      {r.feedCost ? `${currency} ${r.feedCost.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(r)}
                          className="p-1.5 rounded-lg text-farm-slate hover:text-farm-primary hover:bg-farm-bg transition-colors"
                          title="Edit Feed Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this feed record?")) {
                              onDelete(r.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete Feed Entry"
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
