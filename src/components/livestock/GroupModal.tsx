"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, Layers, Sparkles } from "lucide-react";
import { LivestockGroupDTO } from "@/lib/types";

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  enterprises: Array<{ id: string; name: string; code: string }>;
  initialGroup?: LivestockGroupDTO | null;
}

const SPECIES_OPTIONS = [
  { value: "POULTRY", label: "Poultry (Layers / Broilers / Kienyeji)" },
  { value: "DAIRY_CATTLE", label: "Dairy Cattle" },
  { value: "BEEF_CATTLE", label: "Beef Cattle" },
  { value: "GOATS", label: "Goats (Dairy / Meat)" },
  { value: "SHEEP", label: "Sheep" },
  { value: "PIGS", label: "Pigs (Piggery)" },
  { value: "RABBITS", label: "Rabbits" },
  { value: "OTHER", label: "Other Livestock" },
];

const STAGE_SUGGESTIONS: Record<string, string[]> = {
  POULTRY: ["Laying", "Brooding", "Growing / Pullets", "Finishing", "Breeding"],
  DAIRY_CATTLE: ["Lactating (In Milk)", "Dry Cows", "In-Calf Heifers", "Weaned Calves", "Pre-Weaning"],
  BEEF_CATTLE: ["Fattening / Feedlot", "Stocker / Grazing", "Cow-Calf", "Bull Breeding"],
  GOATS: ["Lactating Does", "Dry Does", "Grower Bucks", "Kids"],
  SHEEP: ["Ewes Breeding", "Lambs", "Ram Fattening"],
  PIGS: ["Breeding Sows", "Nursery / Weaners", "Grower Pen", "Finishing / Baconers"],
  RABBITS: ["Breeding Does & Bucks", "Grower Fryers", "Kits Nursery"],
};

export function GroupModal({
  isOpen,
  onClose,
  onSuccess,
  enterprises,
  initialGroup,
}: GroupModalProps) {
  const [enterpriseId, setEnterpriseId] = useState("");
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("POULTRY");
  const [breed, setBreed] = useState("");
  const [productionStage, setProductionStage] = useState("Laying");
  const [initialCount, setInitialCount] = useState("100");
  const [currentCount, setCurrentCount] = useState("100");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialGroup) {
      setEnterpriseId(initialGroup.enterpriseId);
      setName(initialGroup.name);
      setSpecies(initialGroup.species);
      setBreed(initialGroup.breed || "");
      setProductionStage(initialGroup.productionStage || "");
      setInitialCount(initialGroup.initialCount.toString());
      setCurrentCount(initialGroup.currentCount.toString());
      setStartDate(new Date(initialGroup.startDate).toISOString().slice(0, 10));
      setNotes(initialGroup.notes || "");
    } else {
      if (enterprises.length > 0 && !enterpriseId) {
        setEnterpriseId(enterprises[0].id);
        const code = enterprises[0].code?.toUpperCase() || "POULTRY";
        if (code === "CATTLE") setSpecies("DAIRY_CATTLE");
        else if (code === "GOATS_SHEEP") setSpecies("GOATS");
        else if (code === "PIGGERY") setSpecies("PIGS");
        else setSpecies(code);
      }
      setName("");
      setBreed("");
      setProductionStage("Laying");
      setInitialCount("100");
      setCurrentCount("100");
      setStartDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
    setError(null);
  }, [isOpen, initialGroup, enterprises]);

  if (!isOpen) return null;

  const stageList = STAGE_SUGGESTIONS[species] || ["Active Production", "Breeding", "Growing"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please provide a name for this animal group or batch.");
      return;
    }

    const init = parseInt(initialCount);
    const curr = parseInt(currentCount);

    if (isNaN(init) || init < 0 || isNaN(curr) || curr < 0) {
      setError("Counts cannot be negative.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        enterpriseId,
        name: name.trim(),
        species: species.toUpperCase(),
        breed: breed.trim() || null,
        productionStage: productionStage.trim() || null,
        initialCount: init,
        currentCount: curr,
        startDate: new Date(startDate).toISOString(),
        notes: notes.trim() || null,
      };

      const url = initialGroup
        ? `/api/livestock/groups/${initialGroup.id}`
        : "/api/livestock/groups";
      const method = initialGroup ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save livestock group.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save group error:", err);
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
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-farm-charcoal tracking-tight">
                {initialGroup ? "Edit Animal Group / Batch" : "Create Animal Group or Batch"}
              </h2>
              <p className="text-xs text-farm-slate">
                Register a distinct flock, milking herd, feedlot pen, or cage.
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
          {/* Enterprise & Species */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Farm Enterprise *
              </label>
              <select
                value={enterpriseId}
                onChange={(e) => setEnterpriseId(e.target.value)}
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
                Livestock Species *
              </label>
              <select
                value={species}
                onChange={(e) => {
                  setSpecies(e.target.value);
                  const stg = STAGE_SUGGESTIONS[e.target.value]?.[0] || "Active";
                  setProductionStage(stg);
                }}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-bold text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              >
                {SPECIES_OPTIONS.map((sp) => (
                  <option key={sp.value} value={sp.value}>
                    {sp.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Group / Batch Name */}
          <div>
            <label className="block text-xs font-bold text-farm-charcoal mb-1">
              Group Name or Batch Identifier *
            </label>
            <input
              type="text"
              placeholder="e.g. Flock 1 - Isa Brown Layers, Herd Alpha, Pen 3 Broilers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-bold text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              required
            />
          </div>

          {/* Breed & Production Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Breed / Variety (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Isa Brown, Friesian, Boer, Landrace"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs text-farm-charcoal font-medium focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Production Stage
              </label>
              <input
                type="text"
                list="stage-suggestions"
                placeholder="e.g. Laying, Lactating, Brooding"
                value={productionStage}
                onChange={(e) => setProductionStage(e.target.value)}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs text-farm-charcoal font-medium focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              />
              <datalist id="stage-suggestions">
                {stageList.map((st) => (
                  <option key={st} value={st} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Initial Count & Current Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Initial Head / Birds Count *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 500"
                value={initialCount}
                onChange={(e) => {
                  setInitialCount(e.target.value);
                  if (!initialGroup) setCurrentCount(e.target.value);
                }}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-black text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-farm-charcoal mb-1">
                Currently Alive / In Group *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 488"
                value={currentCount}
                onChange={(e) => setCurrentCount(e.target.value)}
                className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-black text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Start Date / Age */}
          <div>
            <label className="block text-xs font-bold text-farm-charcoal mb-1">
              Start Date / Batch Placement Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-farm-bg border border-farm-border rounded-xl text-xs font-medium text-farm-charcoal focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-farm-charcoal mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Sourced from Kenchic day-olds, vaccinated on day 1"
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
              <span>{initialGroup ? "Save Changes" : "Create Group / Batch"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
