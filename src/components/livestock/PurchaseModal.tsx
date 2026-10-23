"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  ShoppingCart,
  DollarSign,
  Calendar,
  Layers,
  Building,
  FileText,
  AlertCircle,
  PackageCheck,
  CheckCircle2,
} from "lucide-react";
import { FeedProductDTO } from "@/lib/types";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  feedProducts: FeedProductDTO[];
  enterprises: Array<{ id: string; name: string; code: string }>;
  initialProductId?: string;
}

export function PurchaseModal({
  isOpen,
  onClose,
  onSuccess,
  feedProducts,
  enterprises,
  initialProductId,
}: PurchaseModalProps) {
  const [feedProductId, setFeedProductId] = useState("");
  const [enterpriseId, setEnterpriseId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("bags");
  const [bagWeightKg, setBagWeightKg] = useState("50");
  const [unitPrice, setUnitPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MPESA");
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [storageLocation, setStorageLocation] = useState("Main Feed Store");
  const [status, setStatus] = useState<"RECEIVED" | "DRAFT">("RECEIVED");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialProductId) {
        setFeedProductId(initialProductId);
        const prod = feedProducts.find((p) => p.id === initialProductId);
        if (prod) {
          if (prod.enterpriseId) setEnterpriseId(prod.enterpriseId);
          setUnit(prod.defaultUnit || "bags");
          setBagWeightKg(prod.defaultBagWeightKg ? prod.defaultBagWeightKg.toString() : "50");
          if (prod.storageLocation) setStorageLocation(prod.storageLocation);
        }
      } else if (feedProducts.length > 0) {
        setFeedProductId(feedProducts[0].id);
        if (feedProducts[0].enterpriseId) setEnterpriseId(feedProducts[0].enterpriseId);
        setUnit(feedProducts[0].defaultUnit || "bags");
        setBagWeightKg(
          feedProducts[0].defaultBagWeightKg
            ? feedProducts[0].defaultBagWeightKg.toString()
            : "50"
        );
        if (feedProducts[0].storageLocation) setStorageLocation(feedProducts[0].storageLocation);
      }
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setSupplierName("");
      setQuantity("");
      setUnitPrice("");
      setPaymentMethod("MPESA");
      setPaymentStatus("PAID");
      setInvoiceRef("");
      setBatchNumber("");
      setExpiryDate("");
      setStatus("RECEIVED");
      setNotes("");
    }
  }, [isOpen, initialProductId, feedProducts]);

  if (!isOpen) return null;

  const selectedProduct = feedProducts.find((p) => p.id === feedProductId);

  // Compute normalized kg
  const numQty = parseFloat(quantity) || 0;
  const numBagWeight = parseFloat(bagWeightKg) || 50;
  let normalizedKg = 0;
  if (unit === "kg") normalizedKg = numQty;
  else if (unit === "bags") normalizedKg = numQty * numBagWeight;
  else if (unit === "bales") normalizedKg = numQty * (numBagWeight || 15);
  else if (unit === "tonnes") normalizedKg = numQty * 1000;
  else if (unit === "g") normalizedKg = numQty / 1000;
  else normalizedKg = numQty;

  const numUnitPrice = parseFloat(unitPrice) || 0;
  const totalCost = Math.round(numQty * numUnitPrice * 100) / 100;
  const costPerKg = normalizedKg > 0 ? Math.round((totalCost / normalizedKg) * 10) / 10 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!feedProductId) {
      setError("Please select a feed product to purchase.");
      return;
    }
    if (!supplierName.trim()) {
      setError("Please enter the supplier name.");
      return;
    }
    if (numQty <= 0) {
      setError("Please enter a valid purchase quantity greater than zero.");
      return;
    }
    if (numUnitPrice < 0) {
      setError("Unit price cannot be negative.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        feedProductId,
        enterpriseId: enterpriseId || null,
        purchaseDate: new Date(purchaseDate).toISOString(),
        supplierName: supplierName.trim(),
        quantity: numQty,
        unit,
        bagWeightKg: unit === "bags" || unit === "bales" ? numBagWeight : null,
        unitPrice: numUnitPrice,
        paymentMethod,
        paymentStatus,
        invoiceRef: invoiceRef.trim() || null,
        batchNumber: batchNumber.trim() || null,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        storageLocation: storageLocation.trim() || null,
        status,
        notes: notes.trim() || null,
      };

      const res = await fetch("/api/livestock/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record feed purchase.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Purchase error:", err);
      setError(err.message || "Failed to record feed purchase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-farm-surface border border-farm-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-farm-border flex items-center justify-between bg-farm-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-farm-primary/10 text-farm-primary flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-farm-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-farm-primary">Record Feed Purchase</h2>
              <p className="text-xs text-farm-slate">
                Add received feed to inventory with automatic stock replenishment
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product & Enterprise */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1.5">
                Feed Product <span className="text-red-500">*</span>
              </label>
              <select
                value={feedProductId}
                onChange={(e) => {
                  setFeedProductId(e.target.value);
                  const p = feedProducts.find((prod) => prod.id === e.target.value);
                  if (p) {
                    if (p.enterpriseId) setEnterpriseId(p.enterpriseId);
                    setUnit(p.defaultUnit || "bags");
                    setBagWeightKg(p.defaultBagWeightKg ? p.defaultBagWeightKg.toString() : "50");
                    if (p.storageLocation) setStorageLocation(p.storageLocation);
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
                required
              >
                {feedProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.currentStockKg.toFixed(0)} kg in stock)
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <p className="text-[11px] text-farm-slate mt-1">
                  Type: <span className="font-medium text-farm-primary">{selectedProduct.feedType}</span> • Store:{" "}
                  <span className="font-medium text-farm-primary">{selectedProduct.storageLocation}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1.5">
                Intended Enterprise (Optional)
              </label>
              <select
                value={enterpriseId}
                onChange={(e) => setEnterpriseId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              >
                <option value="">General / Multiple Enterprises</option>
                {enterprises.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Supplier & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1.5">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Unga Farm Care, Kenchic, Pembe Feeds"
                className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary placeholder:text-farm-slate/50 focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1.5">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
                required
              />
            </div>
          </div>

          {/* Quantity, Unit, Bag Weight */}
          <div className="bg-farm-bg/60 p-4 rounded-xl border border-farm-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-farm-slate mb-1">
                  Quantity Purchased <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-farm-slate mb-1">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
                >
                  <option value="bags">Bags</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="bales">Bales (Hay)</option>
                  <option value="tonnes">Tonnes</option>
                  <option value="g">Grams (g)</option>
                </select>
              </div>

              {(unit === "bags" || unit === "bales") && (
                <div>
                  <label className="block text-xs font-semibold text-farm-slate mb-1">
                    Weight per {unit === "bags" ? "Bag" : "Bale"} (kg)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={bagWeightKg}
                    onChange={(e) => setBagWeightKg(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
                  />
                </div>
              )}
            </div>

            {numQty > 0 && (
              <div className="flex items-center justify-between text-xs text-farm-slate pt-1 border-t border-farm-border/60">
                <span>Normalized Total Weight:</span>
                <span className="font-bold text-farm-primary">
                  {normalizedKg.toLocaleString()} kg
                </span>
              </div>
            )}
          </div>

          {/* Pricing & Cost Calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1.5">
                Unit Price (KES per {unit}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-farm-slate">KSh</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="e.g. 3200"
                  className="w-full pl-11 pr-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
                  required
                />
              </div>
            </div>

            <div className="bg-farm-bg/60 p-3 rounded-xl border border-farm-border flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-farm-slate">Total Purchase Cost:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-farm-primary">
                  KSh {totalCost.toLocaleString()}
                </span>
                {costPerKg > 0 && (
                  <span className="text-xs text-farm-slate">
                    (~KSh {costPerKg}/kg)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method & Delivery Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              >
                <option value="MPESA">M-Pesa</option>
                <option value="CASH">Cash</option>
                <option value="BANK">Bank Transfer</option>
                <option value="CREDIT">Supplier Credit (Pay later)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1.5">
                Delivery & Receipt Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              >
                <option value="RECEIVED">Received into Inventory (Stock increases now)</option>
                <option value="DRAFT">Draft Order (Pending delivery, stock unchanged)</option>
              </select>
            </div>
          </div>

          {/* Storage Location & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Storage Location
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Main Feed Store"
                className="w-full px-3 py-2 text-xs bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Invoice / Receipt Ref
              </label>
              <input
                type="text"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                placeholder="e.g. INV-9843 / MPESA ref"
                className="w-full px-3 py-2 text-xs bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Batch / Lot Number
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. BATCH-2026-10"
                className="w-full px-3 py-2 text-xs bg-farm-card border border-farm-border rounded-xl text-farm-primary focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">
              Notes / Delivery Details (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified 5 bags intact, driver paid via M-Pesa."
              className="w-full px-3 py-2 text-xs bg-farm-card border border-farm-border rounded-xl text-farm-primary placeholder:text-farm-slate/50 focus:outline-hidden focus:ring-2 focus:ring-farm-primary/30"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-farm-border flex items-center justify-between bg-farm-bg/50">
          <div className="text-xs text-farm-slate">
            {status === "RECEIVED" ? (
              <span className="flex items-center gap-1.5 text-farm-primary font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-farm-primary" />
                Will increase available stock by +{normalizedKg} kg
              </span>
            ) : (
              <span className="text-amber-600 font-medium">
                Draft order: stock will NOT be changed until marked received
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
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
              <span>{status === "RECEIVED" ? "Confirm & Receive Stock" : "Save Draft Purchase"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
