"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Package,
  Layers,
  AlertTriangle,
  Clock,
  Scale,
  Sparkles,
  Info,
  DollarSign,
} from "lucide-react";
import { FeedProductDTO } from "@/lib/types";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  enterprises: Array<{ id: string; name: string; code: string }>;
  initialProduct?: FeedProductDTO | null;
}

export function InventoryModal({
  isOpen,
  onClose,
  onSuccess,
  enterprises,
  initialProduct,
}: InventoryModalProps) {
  const [enterpriseId, setEnterpriseId] = useState("");
  const [name, setName] = useState("");
  const [feedType, setFeedType] = useState("Layers Mash");
  const [intendedUse, setIntendedUse] = useState("");
  const [storageLocation, setStorageLocation] = useState("Main Feed Store");
  const [defaultUnit, setDefaultUnit] = useState("bags");
  const [defaultBagWeightKg, setDefaultBagWeightKg] = useState("50");
  const [initialStockKg, setInitialStockKg] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [minReserveKg, setMinReserveKg] = useState("100");
  const [criticalReserveKg, setCriticalReserveKg] = useState("30");
  const [reorderQuantityKg, setReorderQuantityKg] = useState("200");
  const [leadTimeDays, setLeadTimeDays] = useState("3");
  const [reminderPeriodDays, setReminderPeriodDays] = useState("2");
  const [expectedDailyUsageKg, setExpectedDailyUsageKg] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialProduct) {
        setEnterpriseId(initialProduct.enterpriseId || "");
        setName(initialProduct.name);
        setFeedType(initialProduct.feedType);
        setIntendedUse(initialProduct.intendedUse || "");
        setStorageLocation(initialProduct.storageLocation || "Main Feed Store");
        setDefaultUnit(initialProduct.defaultUnit || "bags");
        setDefaultBagWeightKg(
          initialProduct.defaultBagWeightKg ? initialProduct.defaultBagWeightKg.toString() : "50"
        );
        setInitialStockKg(initialProduct.currentStockKg.toString());
        setUnitCost(initialProduct.unitCost ? initialProduct.unitCost.toString() : "");
        setMinReserveKg(initialProduct.minReserveKg.toString());
        setCriticalReserveKg(initialProduct.criticalReserveKg.toString());
        setReorderQuantityKg(
          initialProduct.reorderQuantityKg ? initialProduct.reorderQuantityKg.toString() : "200"
        );
        setLeadTimeDays(
          initialProduct.leadTimeDays ? initialProduct.leadTimeDays.toString() : "3"
        );
        setReminderPeriodDays(
          initialProduct.reminderPeriodDays ? initialProduct.reminderPeriodDays.toString() : "2"
        );
        setExpectedDailyUsageKg(
          initialProduct.expectedDailyUsageKg
            ? initialProduct.expectedDailyUsageKg.toString()
            : ""
        );
      } else {
        setEnterpriseId(enterprises.length > 0 ? enterprises[0].id : "");
        setName("");
        setFeedType("Layers Mash");
        setIntendedUse("");
        setStorageLocation("Main Feed Store");
        setDefaultUnit("bags");
        setDefaultBagWeightKg("50");
        setInitialStockKg("0");
        setUnitCost("");
        setMinReserveKg("100");
        setCriticalReserveKg("30");
        setReorderQuantityKg("200");
        setLeadTimeDays("3");
        setReminderPeriodDays("2");
        setExpectedDailyUsageKg("");
      }
    }
  }, [isOpen, initialProduct, enterprises]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please provide a feed product name.");
      return;
    }
    if (!feedType.trim()) {
      setError("Please provide a feed type category.");
      return;
    }

    const minRes = parseFloat(minReserveKg);
    const critRes = parseFloat(criticalReserveKg);
    if (isNaN(minRes) || minRes < 0) {
      setError("Minimum reserve must be a non-negative number.");
      return;
    }
    if (isNaN(critRes) || critRes < 0) {
      setError("Critical threshold must be a non-negative number.");
      return;
    }
    if (critRes > minRes) {
      setError("Critical stock threshold cannot be higher than minimum reserve.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        enterpriseId: enterpriseId || null,
        name: name.trim(),
        feedType: feedType.trim(),
        intendedUse: intendedUse.trim() || null,
        storageLocation: storageLocation.trim() || "Main Feed Store",
        defaultUnit,
        defaultBagWeightKg: parseFloat(defaultBagWeightKg) || 50,
        initialStockKg: !initialProduct ? parseFloat(initialStockKg) || 0 : undefined,
        unitCost: unitCost ? parseFloat(unitCost) : null,
        minReserveKg: minRes,
        criticalReserveKg: critRes,
        reorderQuantityKg: reorderQuantityKg ? parseFloat(reorderQuantityKg) : null,
        leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : 3,
        reminderPeriodDays: reminderPeriodDays ? parseInt(reminderPeriodDays) : 2,
        expectedDailyUsageKg: expectedDailyUsageKg ? parseFloat(expectedDailyUsageKg) : null,
      };

      const url = initialProduct
        ? `/api/livestock/inventory/${initialProduct.id}`
        : "/api/livestock/inventory";
      const method = initialProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save feed product.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Inventory error:", err);
      setError(err.message || "Failed to save feed product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-farm-surface border border-farm-border rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-farm-border flex items-center justify-between bg-farm-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-farm-primary/10 text-farm-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-farm-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-farm-primary">
                {initialProduct ? "Configure Feed Product & Reserves" : "Add Tracked Feed Product"}
              </h2>
              <p className="text-xs text-farm-slate">
                Configure minimum reserves, thresholds, and replenishment lead times
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-farm-slate hover:text-farm-primary hover:bg-farm-card rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Product Name & Enterprise */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Feed Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Layers Complete Mash (70kg)"
                className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Enterprise (Optional)
              </label>
              <select
                value={enterpriseId}
                onChange={(e) => setEnterpriseId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              >
                <option value="">General (All enterprises)</option>
                {enterprises.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feed Type & Intended Use */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Feed Type Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={feedType}
                onChange={(e) => setFeedType(e.target.value)}
                placeholder="e.g. Layers Mash, Dairy Meal, Hay"
                className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Intended Use / Stage
              </label>
              <input
                type="text"
                value={intendedUse}
                onChange={(e) => setIntendedUse(e.target.value)}
                placeholder="e.g. Laying Hens 18+ weeks"
                className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              />
            </div>
          </div>

          {/* Storage & Units */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Storage Location
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Main Store"
                className="w-full px-3 py-2 text-xs bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">Default Unit</label>
              <select
                value={defaultUnit}
                onChange={(e) => setDefaultUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              >
                <option value="bags">Bags</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="bales">Bales (Hay)</option>
                <option value="tonnes">Tonnes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Default Bag Weight (kg)
              </label>
              <input
                type="number"
                value={defaultBagWeightKg}
                onChange={(e) => setDefaultBagWeightKg(e.target.value)}
                placeholder="50"
                className="w-full px-3 py-2 text-xs bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              />
            </div>
          </div>

          {/* Opening stock (new only) & Unit Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!initialProduct && (
              <div>
                <label className="block text-xs font-semibold text-farm-slate mb-1">
                  Opening Stock Balance (kg)
                </label>
                <input
                  type="number"
                  step="any"
                  value={initialStockKg}
                  onChange={(e) => setInitialStockKg(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Average Cost per kg (KES/kg)
              </label>
              <input
                type="number"
                step="any"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="e.g. 45"
                className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              />
            </div>
          </div>

          {/* Reserve & Replenishment Thresholds Box */}
          <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Stock Reserve & Replenishment Alert Rules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-farm-slate mb-1">
                  Minimum Reserve (kg) <span className="text-amber-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={minReserveKg}
                  onChange={(e) => setMinReserveKg(e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-1.5 text-xs bg-farm-card border border-farm-border rounded-lg text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                  required
                />
                <span className="text-[10px] text-farm-slate">Triggers Low Stock alert</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-farm-slate mb-1">
                  Critical Threshold (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={criticalReserveKg}
                  onChange={(e) => setCriticalReserveKg(e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-1.5 text-xs bg-farm-card border border-farm-border rounded-lg text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-red-500/30"
                  required
                />
                <span className="text-[10px] text-farm-slate">Triggers Critical alert</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-farm-slate mb-1">
                  Reorder Qty (kg)
                </label>
                <input
                  type="number"
                  step="any"
                  value={reorderQuantityKg}
                  onChange={(e) => setReorderQuantityKg(e.target.value)}
                  placeholder="200"
                  className="w-full px-2.5 py-1.5 text-xs bg-farm-card border border-farm-border rounded-lg text-farm-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-farm-slate mb-1">
                  Supplier Lead Time (days)
                </label>
                <input
                  type="number"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  placeholder="3"
                  className="w-full px-2.5 py-1.5 text-xs bg-farm-card border border-farm-border rounded-lg text-farm-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-farm-slate mb-1">
                  Reminder Buffer (days)
                </label>
                <input
                  type="number"
                  value={reminderPeriodDays}
                  onChange={(e) => setReminderPeriodDays(e.target.value)}
                  placeholder="2"
                  className="w-full px-2.5 py-1.5 text-xs bg-farm-card border border-farm-border rounded-lg text-farm-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-farm-slate mb-1">
                Expected Daily Usage Baseline (kg/day, optional)
              </label>
              <input
                type="number"
                step="any"
                value={expectedDailyUsageKg}
                onChange={(e) => setExpectedDailyUsageKg(e.target.value)}
                placeholder="e.g. 35 (auto-computed from actual issues if empty)"
                className="w-full px-3 py-1.5 text-xs bg-farm-card border border-farm-border rounded-lg text-farm-primary"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-farm-border flex items-center justify-end gap-2 bg-farm-bg/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-farm-border rounded-xl text-xs font-semibold text-farm-slate hover:bg-farm-card transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-farm-primary hover:bg-farm-primary/90 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{initialProduct ? "Update Settings" : "Save Product"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
