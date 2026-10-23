"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Sparkles, AlertCircle, Scale, DollarSign, Calendar, Layers } from "lucide-react";
import { FeedRecordDTO, LivestockGroupDTO, FeedProductDTO } from "@/lib/types";

interface FeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  enterprises: Array<{ id: string; name: string; code: string }>;
  groups: LivestockGroupDTO[];
  feedProducts?: FeedProductDTO[];
  initialRecord?: FeedRecordDTO | null;
}

const FEED_SUGGESTIONS: Record<string, string[]> = {
  POULTRY: [
    "Layers Complete Mash",
    "Broiler Starter Crumbs",
    "Broiler Grower Pellets",
    "Broiler Finisher Pellets",
    "Chick & Duckling Mash",
    "Kienyeji Growers Mash",
    "Oyster Shells / Calcium Grit",
  ],
  CATTLE: [
    "High-Yield Dairy Meal (16% CP)",
    "Standard Dairy Meal",
    "Calf Starter Pellets",
    "Maize Silage",
    "Boma Rhodes Hay",
    "Lucerne / Alfalfa Hay",
    "Mineral Salt Lick",
  ],
  DAIRY_CATTLE: [
    "High-Yield Dairy Meal (16% CP)",
    "Standard Dairy Meal",
    "Calf Starter Pellets",
    "Maize Silage",
    "Boma Rhodes Hay",
    "Lucerne / Alfalfa Hay",
    "Mineral Salt Lick",
  ],
  BEEF_CATTLE: [
    "Beef Fattening Mash",
    "Feedlot Concentrates",
    "Silage",
    "Rhodes Grass Hay",
    "Molasses / Urea Mix",
  ],
  GOATS_SHEEP: [
    "Dairy Goat Pellets",
    "Sheep & Goat Commercial Mash",
    "Lucerne / Desmodium Fodder",
    "Boma Rhodes Hay",
    "Mineral Block",
  ],
  GOATS: [
    "Dairy Goat Pellets",
    "Sheep & Goat Commercial Mash",
    "Lucerne / Desmodium Fodder",
    "Boma Rhodes Hay",
  ],
  SHEEP: [
    "Sheep & Lamb Pellets",
    "Boma Rhodes Hay",
    "Mineral Block",
  ],
  PIGGERY: [
    "Creep Feed (Piglets)",
    "Sow & Weaner Mash",
    "Pig Grower Pellets",
    "Pig Finisher Meal",
    "Lactating Sow Ration",
  ],
  PIGS: [
    "Creep Feed (Piglets)",
    "Sow & Weaner Mash",
    "Pig Grower Pellets",
    "Pig Finisher Meal",
  ],
  RABBITS: [
    "Commercial Rabbit Pellets",
    "Hay / Dried Grass",
    "Greens / Sweet Potato Vines",
  ],
};

export function FeedModal({
  isOpen,
  onClose,
  onSuccess,
  enterprises,
  groups,
  feedProducts = [],
  initialRecord,
}: FeedModalProps) {
  const [enterpriseId, setEnterpriseId] = useState("");
  const [livestockGroupId, setLivestockGroupId] = useState("");
  const [feedProductId, setFeedProductId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [feedType, setFeedType] = useState("");
  const [quantityIssued, setQuantityIssued] = useState("");
  const [unit, setUnit] = useState("kg");
  const [bagWeightKg, setBagWeightKg] = useState("50");
  const [knowsConsumption, setKnowsConsumption] = useState(false);
  const [quantityConsumed, setQuantityConsumed] = useState("");
  const [quantityWasted, setQuantityWasted] = useState("");
  const [feedCost, setFeedCost] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (initialRecord) {
      setEnterpriseId(initialRecord.enterpriseId);
      setLivestockGroupId(initialRecord.livestockGroupId || "");
      setFeedProductId(initialRecord.feedProductId || "");
      setDate(new Date(initialRecord.date).toISOString().slice(0, 16));
      setFeedType(initialRecord.feedType);
      setQuantityIssued(initialRecord.quantityIssued.toString());
      setUnit(initialRecord.unit || "kg");
      setBagWeightKg(initialRecord.bagWeightKg ? initialRecord.bagWeightKg.toString() : "50");
      if (initialRecord.quantityConsumed !== null && initialRecord.quantityConsumed !== undefined) {
        setKnowsConsumption(true);
        setQuantityConsumed(initialRecord.quantityConsumed.toString());
      } else {
        setKnowsConsumption(false);
        setQuantityConsumed("");
      }
      setQuantityWasted(
        initialRecord.quantityWasted !== null && initialRecord.quantityWasted !== undefined
          ? initialRecord.quantityWasted.toString()
          : ""
      );
      setFeedCost(initialRecord.feedCost ? initialRecord.feedCost.toString() : "");
      setNotes(initialRecord.notes || "");
    } else {
      if (enterprises.length > 0 && !enterpriseId) {
        setEnterpriseId(enterprises[0].id);
      }
      setFeedProductId("");
      setDate(new Date().toISOString().slice(0, 16));
      setFeedType("");
      setQuantityIssued("");
      setUnit("kg");
      setBagWeightKg("50");
      setKnowsConsumption(false);
      setQuantityConsumed("");
      setQuantityWasted("");
      setFeedCost("");
      setNotes("");
    }
    setError(null);
  }, [isOpen, initialRecord, enterprises]);

  if (!isOpen) return null;

  const selectedEnterprise = enterprises.find((e) => e.id === enterpriseId);
  const filteredGroups = groups.filter(
    (g) => !enterpriseId || g.enterpriseId === enterpriseId
  );

  const numIssued = parseFloat(quantityIssued) || 0;
  const numBagWeight = parseFloat(bagWeightKg) || 50;
  let normalizedIssuedKg = numIssued;
  if (unit === "bags") normalizedIssuedKg = numIssued * numBagWeight;
  else if (unit === "bales") normalizedIssuedKg = numIssued * (numBagWeight || 15);
  else if (unit === "g") normalizedIssuedKg = numIssued / 1000;
  else if (unit === "tonnes") normalizedIssuedKg = numIssued * 1000;

  const selectedFeedProduct = feedProducts.find((p) => p.id === feedProductId);
  const isOverStock =
    selectedFeedProduct &&
    !initialRecord &&
    numIssued > 0 &&
    normalizedIssuedKg > selectedFeedProduct.currentStockKg;

  const entCode = selectedEnterprise?.code?.toUpperCase() || "POULTRY";
  const suggestions = FEED_SUGGESTIONS[entCode] || FEED_SUGGESTIONS.POULTRY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const issued = parseFloat(quantityIssued);
    if (isNaN(issued) || issued <= 0) {
      setError("Please enter a valid quantity issued greater than 0.");
      return;
    }

    if (!feedType.trim()) {
      setError("Please enter or select a feed type.");
      return;
    }

    if (isOverStock) {
      setError(
        `Requested quantity (${normalizedIssuedKg.toFixed(
          1
        )} kg) exceeds available stock (${selectedFeedProduct.currentStockKg.toFixed(
          1
        )} kg) for "${selectedFeedProduct.name}". Transaction blocked to prevent negative inventory.`
      );
      return;
    }

    let consumedVal: number | null = null;
    if (knowsConsumption) {
      const c = parseFloat(quantityConsumed);
      if (isNaN(c) || c < 0) {
        setError("Please enter a valid quantity consumed (or leave unselected).");
        return;
      }
      consumedVal = c;
    }

    setLoading(true);
    try {
      const payload: any = {
        enterpriseId,
        livestockGroupId: livestockGroupId || null,
        feedProductId: feedProductId || null,
        date: new Date(date).toISOString(),
        feedType: feedType.trim(),
        quantityIssued: issued,
        unit,
        bagWeightKg: unit === "bags" || unit === "bales" ? parseFloat(bagWeightKg) || 50 : null,
        quantityConsumed: consumedVal,
        quantityWasted: quantityWasted ? parseFloat(quantityWasted) : null,
        feedCost: feedCost ? parseFloat(feedCost) : null,
        notes: notes.trim() || null,
      };

      const url = initialRecord
        ? `/api/livestock/feed/${initialRecord.id}`
        : "/api/livestock/feed";
      const method = initialRecord ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save feed record.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save feed error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-farm-border my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-farm-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Scale className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-farm-charcoal tracking-tight">
                {initialRecord ? "Edit Feed Entry" : "Record Feed Issued & Consumed"}
              </h2>
              <p className="text-xs text-farm-slate">
                Log daily ration, feed type, and consumption metrics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-farm-muted hover:text-farm-charcoal hover:bg-farm-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Enterprise & Animal Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Livestock Enterprise *
              </label>
              <select
                value={enterpriseId}
                onChange={(e) => {
                  setEnterpriseId(e.target.value);
                  setLivestockGroupId("");
                }}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-semibold text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
                required
              >
                {enterprises.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Animal Group / Batch
              </label>
              <select
                value={livestockGroupId}
                onChange={(e) => setLivestockGroupId(e.target.value)}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-medium text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              >
                <option value="">General (Whole Enterprise)</option>
                {filteredGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.currentCount} head/birds)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-bold text-farm-charcoal mb-1">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs text-farm-charcoal font-medium focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              required
            />
          </div>

          {/* Central Inventory Selector */}
          {feedProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-farm-charcoal">
                  Select from Tracked Feed Inventory
                </label>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-farm-primary/10 text-farm-primary">
                  Auto Stock Deduction
                </span>
              </div>
              <select
                value={feedProductId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setFeedProductId(pid);
                  const p = feedProducts.find((prod) => prod.id === pid);
                  if (p) {
                    setFeedType(p.name);
                    setUnit(p.defaultUnit || "kg");
                    if (p.defaultBagWeightKg) setBagWeightKg(p.defaultBagWeightKg.toString());
                    if (p.unitCost && numIssued > 0) {
                      setFeedCost((normalizedIssuedKg * p.unitCost).toFixed(0));
                    }
                  }
                }}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-semibold text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              >
                <option value="">-- Choose from Inventory (or enter custom feed below) --</option>
                {feedProducts
                  .filter((p) => !enterpriseId || !p.enterpriseId || p.enterpriseId === enterpriseId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.currentStockKg.toFixed(1)} kg available in {p.storageLocation})
                    </option>
                  ))}
              </select>

              {selectedFeedProduct && (
                <div
                  className={`mt-1.5 px-3 py-1.5 rounded-lg text-[11px] flex items-center justify-between border ${
                    isOverStock
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <span className="font-medium">
                    Store: {selectedFeedProduct.storageLocation} • Available:{" "}
                    <strong>{selectedFeedProduct.currentStockKg.toFixed(1)} kg</strong>
                  </span>
                  {numIssued > 0 && (
                    <span className="font-bold">
                      {isOverStock
                        ? "⚠ Insufficient Stock"
                        : `Stock after issue: ${(
                            selectedFeedProduct.currentStockKg - normalizedIssuedKg
                          ).toFixed(1)} kg`}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Feed Type / Product */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-farm-charcoal">
                Feed Type or Product Name *
              </label>
              <span className="text-[11px] text-farm-slate">Type or pick from below</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Layers Mash, Dairy Meal, Boma Rhodes Hay"
              value={feedType}
              onChange={(e) => setFeedType(e.target.value)}
              className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs text-farm-charcoal font-semibold focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              required
            />
            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestions.slice(0, 4).map((sugg) => (
                <button
                  type="button"
                  key={sugg}
                  onClick={() => setFeedType(sugg)}
                  className="px-2 py-0.5 rounded-lg bg-farm-bg hover:bg-farm-mint border border-farm-border text-[11px] text-farm-slate hover:text-farm-primary transition-colors"
                >
                  {sugg}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Issued & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Quantity Issued *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.01"
                placeholder="e.g. 50"
                value={quantityIssued}
                onChange={(e) => setQuantityIssued(e.target.value)}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-black text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Unit *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-bold text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="bags">Bags (Mifuko)</option>
                <option value="g">Grams (g)</option>
                <option value="litres">Litres (L)</option>
                <option value="bales">Bales (Hay)</option>
              </select>
            </div>
          </div>

          {/* If unit is bags or bales: Bag weight in kg */}
          {(unit === "bags" || unit === "bales") && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
              <label className="block text-[11px] font-bold text-amber-950">
                Weight per {unit === "bags" ? "Bag" : "Bale"} in Kilograms (kg) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={bagWeightKg}
                  onChange={(e) => setBagWeightKg(e.target.value)}
                  className="w-28 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-950 focus:outline-hidden"
                />
                <span className="text-xs text-amber-800">
                  kg per {unit === "bags" ? "bag (e.g. 50kg or 70kg)" : "bale (e.g. 15kg)"}
                </span>
              </div>
            </div>
          )}

          {/* Actual Feed Consumed (Separate from Issued) */}
          <div className="border border-farm-border/80 rounded-2xl p-3.5 bg-farm-bg/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-farm-charcoal">
                  Was Actual Feed Consumption Measured?
                </span>
                <p className="text-[11px] text-farm-slate">
                  Check this only if you weighed left-over feed or know exact intake.
                </p>
              </div>
              <input
                type="checkbox"
                checked={knowsConsumption}
                onChange={(e) => setKnowsConsumption(e.target.checked)}
                className="w-4 h-4 rounded text-farm-primary focus:ring-farm-primary cursor-pointer"
              />
            </div>

            {knowsConsumption && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-farm-border/60">
                <div>
                  <label className="block text-[11px] font-bold text-farm-charcoal mb-1">
                    Actual Quantity Consumed ({unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 48.5"
                    value={quantityConsumed}
                    onChange={(e) => setQuantityConsumed(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-farm-border rounded-lg text-xs font-bold text-farm-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-farm-charcoal mb-1">
                    Feed Wasted or Leftover ({unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 1.5"
                    value={quantityWasted}
                    onChange={(e) => setQuantityWasted(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-farm-border rounded-lg text-xs font-medium text-farm-charcoal"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cost & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Feed Cost (KES, optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-farm-muted font-bold">
                  KSh
                </span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 3200"
                  value={feedCost}
                  onChange={(e) => setFeedCost(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-semibold text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Switched to new feed supplier brand"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-medium text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-farm-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-farm-border text-xs font-bold text-farm-slate hover:bg-farm-bg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-farm-primary hover:bg-farm-primaryDark text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialRecord ? "Save Changes" : "Save Feed Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
