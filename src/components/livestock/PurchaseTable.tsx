"use client";

import React, { useState } from "react";
import {
  ShoppingCart,
  Calendar,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { FeedPurchaseDTO } from "@/lib/types";

interface PurchaseTableProps {
  purchases: FeedPurchaseDTO[];
  currency?: string;
  onRefresh: () => void;
}

export function PurchaseTable({
  purchases,
  currency = "KES",
  onRefresh,
}: PurchaseTableProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCancelConfirm = async () => {
    if (!cancellingId) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/livestock/purchases/${cancellingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Cancelled by farmer" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel purchase");
      }

      setCancellingId(null);
      setCancelReason("");
      onRefresh();
    } catch (err: any) {
      console.error("Cancel purchase error:", err);
      setActionError(err.message || "Failed to cancel purchase");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            Received (In Stock)
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            Draft Order
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400 line-through">
            <XCircle className="w-3 h-3" />
            Cancelled / Reversed
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300">
          {actionError}
        </div>
      )}

      {/* Confirmation Modal for Cancel/Reverse */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-farm-surface border border-farm-border rounded-2xl p-6 shadow-xl w-full max-w-md space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-farm-primary">Cancel & Reverse Purchase?</h3>
            </div>
            <p className="text-xs text-farm-slate">
              If this purchase was already received into inventory, the stock quantity will be
              automatically reversed and deducted. An audit trail entry will be permanently logged.
            </p>
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Reason for Cancellation (Mandatory)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Order returned to supplier due to wrong feed type received."
                className="w-full px-3 py-2 text-xs bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-red-500/30"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingId(null)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-farm-border rounded-xl text-xs font-semibold text-farm-slate hover:bg-farm-card"
              >
                Keep Purchase
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={isSubmitting || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Reversal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchases Table */}
      <div className="bg-farm-surface border border-farm-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-farm-border bg-farm-bg/50 text-farm-slate uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Date & Supplier</th>
                <th className="py-3 px-4">Feed Product</th>
                <th className="py-3 px-4 text-right">Quantity (Weight)</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farm-border/60">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-farm-slate">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No feed purchases recorded</p>
                    <p className="text-xs text-farm-slate/80 mt-1">
                      Click &quot;Record Feed Purchase&quot; to log your first feed shipment.
                    </p>
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-farm-card/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-farm-primary text-xs">{p.supplierName}</div>
                      <div className="text-[11px] text-farm-slate mt-0.5">
                        {new Date(p.purchaseDate).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {p.invoiceRef && <span> • Ref: {p.invoiceRef}</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-farm-primary text-xs">
                        {p.feedProductName}
                      </div>
                      <div className="text-[11px] text-farm-slate mt-0.5">
                        {p.enterpriseName || "General Store"}
                        {p.storageLocation && <span> • {p.storageLocation}</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="font-extrabold text-farm-primary text-xs">
                        {p.quantity} {p.unit}
                      </div>
                      <div className="text-[10px] text-farm-slate mt-0.5">
                        ({p.quantityKg.toLocaleString()} kg)
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-farm-slate">
                      {currency} {p.unitPrice.toLocaleString()} / {p.unit}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="font-black text-xs text-farm-primary">
                        {currency} {p.totalCost.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-farm-slate mt-0.5">{p.paymentMethod}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(p.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {p.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => setCancellingId(p.id)}
                          className="px-2.5 py-1 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-semibold transition-colors"
                          title="Reverse this purchase"
                        >
                          Cancel
                        </button>
                      )}
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
