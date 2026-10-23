"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Sliders, AlertTriangle, Scale, Building } from "lucide-react";
import { FeedProductDTO } from "@/lib/types";

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  feedProducts: FeedProductDTO[];
  initialProductId?: string;
}

export function AdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  feedProducts,
  initialProductId,
}: AdjustmentModalProps) {
  const [feedProductId, setFeedProductId] = useState("");
  const [movementType, setMovementType] = useState<
    "WASTAGE_LOSS" | "RETURN_TO_STOCK" | "MANUAL_ADJUSTMENT"
  >("WASTAGE_LOSS");
  const [quantityKg, setQuantityKg] = useState("");
  const [reason, setReason] = useState("");
  const [storageLocation, setStorageLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialProductId) {
        setFeedProductId(initialProductId);
        const p = feedProducts.find((prod) => prod.id === initialProductId);
        if (p?.storageLocation) setStorageLocation(p.storageLocation);
      } else if (feedProducts.length > 0) {
        setFeedProductId(feedProducts[0].id);
        if (feedProducts[0].storageLocation) setStorageLocation(feedProducts[0].storageLocation);
      }
      setMovementType("WASTAGE_LOSS");
      setQuantityKg("");
      setReason("");
    }
  }, [isOpen, initialProductId, feedProducts]);

  if (!isOpen) return null;

  const selectedProduct = feedProducts.find((p) => p.id === feedProductId);
  const currentStock = selectedProduct ? selectedProduct.currentStockKg : 0;
  const numQty = parseFloat(quantityKg) || 0;

  let resultingStock = currentStock;
  if (movementType === "WASTAGE_LOSS") {
    resultingStock = currentStock - numQty;
  } else if (movementType === "RETURN_TO_STOCK") {
    resultingStock = currentStock + numQty;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!feedProductId) {
      setError("Please select a feed product.");
      return;
    }
    if (numQty <= 0) {
      setError("Adjustment quantity must be greater than zero.");
      return;
    }
    if (!reason.trim()) {
      setError("A clear reason is required for manual stock adjustments.");
      return;
    }
    if (resultingStock < 0) {
      setError(
        `Adjustment rejected: resulting stock (${resultingStock.toFixed(
          1
        )} kg) cannot be negative. Maximum deductible is ${currentStock.toFixed(1)} kg.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/livestock/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedProductId,
          movementType,
          quantityKg: numQty,
          reason: reason.trim(),
          storageLocation: storageLocation.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record adjustment.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Adjustment error:", err);
      setError(err.message || "Failed to record adjustment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-farm-surface border border-farm-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-farm-border flex items-center justify-between bg-farm-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-farm-primary">Manual Stock Adjustment</h2>
              <p className="text-xs text-farm-slate">Record wastage, spoilage, or physical stock reconciliation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-farm-slate hover:text-farm-primary hover:bg-farm-card rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">
              Feed Product <span className="text-red-500">*</span>
            </label>
            <select
              value={feedProductId}
              onChange={(e) => {
                setFeedProductId(e.target.value);
                const p = feedProducts.find((prod) => prod.id === e.target.value);
                if (p?.storageLocation) setStorageLocation(p.storageLocation);
              }}
              className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              required
            >
              {feedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.currentStockKg.toFixed(1)} kg available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">
              Adjustment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
            >
              <option value="WASTAGE_LOSS">Wastage / Spoilage / Damage (Deduct from Stock)</option>
              <option value="RETURN_TO_STOCK">Return to Stock / Unused Ration (Add to Stock)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Quantity (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                placeholder="e.g. 15.5"
                className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
                required
              />
            </div>

            <div className="bg-farm-bg/60 p-3 rounded-xl border border-farm-border flex flex-col justify-center">
              <span className="text-[11px] text-farm-slate">Resulting Balance:</span>
              <span
                className={`text-base font-bold ${
                  resultingStock < 0 ? "text-red-600" : "text-farm-primary"
                }`}
              >
                {resultingStock.toFixed(1)} kg
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">
              Mandatory Reason / Audit Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Bag damaged by water leak; 10kg spoiled."
              className="w-full px-3 py-2 text-xs bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-farm-border rounded-xl text-xs font-semibold text-farm-slate hover:bg-farm-card transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || resultingStock < 0}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Post Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
