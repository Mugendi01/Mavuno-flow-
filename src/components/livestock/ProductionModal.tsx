"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, TrendingUp, Sparkles, Egg, Milk, Scale, HeartHandshake } from "lucide-react";
import { ProductionRecordDTO, LivestockGroupDTO } from "@/lib/types";

interface ProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  enterprises: Array<{ id: string; name: string; code: string }>;
  groups: LivestockGroupDTO[];
  initialRecord?: ProductionRecordDTO | null;
}

export function ProductionModal({
  isOpen,
  onClose,
  onSuccess,
  enterprises,
  groups,
  initialRecord,
}: ProductionModalProps) {
  const [enterpriseId, setEnterpriseId] = useState("");
  const [livestockGroupId, setLivestockGroupId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [metric, setMetric] = useState("EGGS");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pieces");
  const [secondaryQuantity, setSecondaryQuantity] = useState("");
  const [qualityGrade, setQualityGrade] = useState("");
  const [quantitySold, setQuantitySold] = useState("");
  const [quantityFarmUse, setQuantityFarmUse] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  useEffect(() => {
    if (initialRecord) {
      setEnterpriseId(initialRecord.enterpriseId);
      setLivestockGroupId(initialRecord.livestockGroupId || "");
      setDate(new Date(initialRecord.date).toISOString().slice(0, 10));
      setMetric(initialRecord.metric);
      setQuantity(initialRecord.quantity.toString());
      setUnit(initialRecord.unit || "pieces");
      setSecondaryQuantity(
        initialRecord.secondaryQuantity !== null && initialRecord.secondaryQuantity !== undefined
          ? initialRecord.secondaryQuantity.toString()
          : ""
      );
      setQualityGrade(initialRecord.qualityGrade || "");
      setQuantitySold(
        initialRecord.quantitySold !== null && initialRecord.quantitySold !== undefined
          ? initialRecord.quantitySold.toString()
          : ""
      );
      setQuantityFarmUse(
        initialRecord.quantityFarmUse !== null && initialRecord.quantityFarmUse !== undefined
          ? initialRecord.quantityFarmUse.toString()
          : ""
      );
      setNotes(initialRecord.notes || "");
    } else {
      if (enterprises.length > 0 && !enterpriseId) {
        setEnterpriseId(enterprises[0].id);
      }
      setDate(new Date().toISOString().slice(0, 10));
      setQuantity("");
      setSecondaryQuantity("");
      setQualityGrade("");
      setQuantitySold("");
      setQuantityFarmUse("");
      setNotes("");
    }
    setError(null);
  }, [isOpen, initialRecord, enterprises]);

  const selectedEnterprise = enterprises.find((e) => e.id === enterpriseId);
  const entCode = selectedEnterprise?.code?.toUpperCase() || "POULTRY";
  const filteredGroups = groups.filter(
    (g) => !enterpriseId || g.enterpriseId === enterpriseId
  );
  const selectedGroup = groups.find((g) => g.id === livestockGroupId);

  // Auto-adapt metric & unit to enterprise species if not editing
  useEffect(() => {
    if (!initialRecord) {
      if (entCode === "POULTRY") {
        setMetric("EGGS");
        setUnit("pieces");
      } else if (entCode === "CATTLE" || entCode === "DAIRY_CATTLE") {
        setMetric("MILK");
        setUnit("litres");
      } else if (entCode === "BEEF_CATTLE" || entCode === "PIGGERY" || entCode === "PIGS") {
        setMetric("WEIGHT");
        setUnit("kg");
      } else if (entCode === "GOATS_SHEEP") {
        setMetric("WEIGHT");
        setUnit("kg");
      } else {
        setMetric("WEIGHT");
        setUnit("kg");
      }
    }
  }, [entCode, initialRecord]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) {
      setError("Please enter a valid quantity of 0 or greater.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        enterpriseId,
        livestockGroupId: livestockGroupId || null,
        date: new Date(date).toISOString(),
        metric: metric.toUpperCase().trim(),
        quantity: qty,
        unit,
        secondaryQuantity: secondaryQuantity ? parseFloat(secondaryQuantity) : null,
        qualityGrade: qualityGrade.trim() || null,
        quantitySold: quantitySold ? parseFloat(quantitySold) : null,
        quantityFarmUse: quantityFarmUse ? parseFloat(quantityFarmUse) : null,
        notes: notes.trim() || null,
      };

      const url = initialRecord
        ? `/api/livestock/production/${initialRecord.id}`
        : "/api/livestock/production";
      const method = initialRecord ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save production record.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save production error:", err);
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
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-farm-charcoal tracking-tight">
                {initialRecord ? "Edit Production Record" : "Record Production Output"}
              </h2>
              <p className="text-xs text-farm-slate">
                Log milk litres, egg harvests, weights, or herd growth.
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

          {/* Date & Production Metric */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Date of Record *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-medium text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Production Metric *
              </label>
              <select
                value={metric}
                onChange={(e) => {
                  const m = e.target.value;
                  setMetric(m);
                  if (m === "EGGS") setUnit("pieces");
                  else if (m === "MILK") setUnit("litres");
                  else if (m === "WEIGHT") setUnit("kg");
                  else if (m === "BIRTHS" || m === "WEANED" || m === "MORTALITY") setUnit("head");
                }}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-bold text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              >
                {entCode === "POULTRY" && <option value="EGGS">Egg Production (Harvest)</option>}
                {(entCode === "CATTLE" || entCode === "DAIRY_CATTLE" || entCode === "GOATS_SHEEP") && (
                  <option value="MILK">Milk Yield (Litres)</option>
                )}
                <option value="WEIGHT">Body Weight / Weight Gain (kg)</option>
                <option value="BIRTHS">Offspring Born (Births / Hatch)</option>
                <option value="WEANED">Weaned Count</option>
                <option value="MORTALITY">Mortality (Loss)</option>
                <option value="OTHER">Other Production Output</option>
              </select>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                {metric === "EGGS"
                  ? "Good / Saleable Eggs Collected *"
                  : metric === "MILK"
                  ? "Total Milk Collected *"
                  : metric === "WEIGHT"
                  ? "Total Live Weight / Gain *"
                  : "Quantity Produced *"}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder={metric === "EGGS" ? "e.g. 240 (or 8 trays)" : "e.g. 150"}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
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
                {metric === "EGGS" && (
                  <>
                    <option value="pieces">Pieces / Eggs</option>
                    <option value="trays">Trays (30 eggs)</option>
                  </>
                )}
                {metric === "MILK" && <option value="litres">Litres (L)</option>}
                {metric === "WEIGHT" && (
                  <>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                  </>
                )}
                {(metric === "BIRTHS" || metric === "WEANED" || metric === "MORTALITY") && (
                  <option value="head">Head / Birds</option>
                )}
                {metric === "OTHER" && (
                  <>
                    <option value="units">Units</option>
                    <option value="kg">kg</option>
                    <option value="litres">litres</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Contextual Secondary Metrics */}
          {metric === "EGGS" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
              <div>
                <label className="block text-[11px] font-bold text-amber-950 mb-1">
                  Broken / Damaged Eggs (Count)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 4"
                  value={secondaryQuantity}
                  onChange={(e) => setSecondaryQuantity(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-medium text-amber-950"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-950 mb-1">
                  Egg Grade / Size (optional)
                </label>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-medium text-amber-950"
                >
                  <option value="">Ungraded</option>
                  <option value="Grade A / Large">Grade A / Large (56-65g)</option>
                  <option value="Medium">Medium (45-55g)</option>
                  <option value="Small">Small / Pullet (&lt;45g)</option>
                  <option value="Jumbo">Jumbo (&gt;65g)</option>
                </select>
              </div>
            </div>
          )}

          {metric === "MILK" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl">
              <div>
                <label className="block text-[11px] font-bold text-blue-950 mb-1">
                  Rejected / Spoilage (Litres)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 2.0"
                  value={secondaryQuantity}
                  onChange={(e) => setSecondaryQuantity(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-xl text-xs font-medium text-blue-950"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-950 mb-1">
                  Milk Quality / Butterfat
                </label>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-xl text-xs font-medium text-blue-950"
                >
                  <option value="">Standard Grade</option>
                  <option value="Premium / High Fat">Premium / High Fat (Above 3.8%)</option>
                  <option value="Chilled Tank">Bulk Chilled Tank</option>
                  <option value="Pasteurized">Pasteurized Farm Gate</option>
                </select>
              </div>
            </div>
          )}

          {/* Distribution: Quantity Sold & Used on Farm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Quantity Sold ({unit}, optional)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 200"
                value={quantitySold}
                onChange={(e) => setQuantitySold(e.target.value)}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs text-farm-charcoal font-medium focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Farm Use / Calf Fed ({unit}, optional)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 10"
                value={quantityFarmUse}
                onChange={(e) => setQuantityFarmUse(e.target.value)}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs text-farm-charcoal font-medium focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-farm-charcoal mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. High morning harvest, all cows completed milking"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-medium text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
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
              <span>{initialRecord ? "Save Changes" : "Save Production Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
