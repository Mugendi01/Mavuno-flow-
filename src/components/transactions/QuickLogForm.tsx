"use client";

import React, { useState, useEffect } from "react";
import { syncEngine } from "@/lib/offline/syncEngine";
import { TransactionType, PaymentMethod, PaymentStatus } from "@/lib/types";
import {
  CheckCircle2,
  Calendar,
  Layers,
  Tag,
  DollarSign,
  CreditCard,
  User,
  FileText,
  Camera,
  AlertCircle,
  Loader2,
  Sparkles,
  QrCode,
  ArrowRight,
  Printer,
  Receipt as ReceiptIcon,
} from "lucide-react";
import Link from "next/link";

interface QuickLogFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultType?: TransactionType;
}

export function QuickLogForm({
  onSuccess,
  onCancel,
  defaultType = "EXPENSE",
}: QuickLogFormProps) {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [enterpriseId, setEnterpriseId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState<string>("Bag");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MPESA");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PAID");
  const [buyerName, setBuyerName] = useState("");
  const [salesChannel, setSalesChannel] = useState("Farm gate");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // Metadata
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [createdReceipt, setCreatedReceipt] = useState<{
    receiptNumber: string;
    receiptId?: string;
    isOffline: boolean;
  } | null>(null);

  // Fallback farm ID and user ID for demo context
  const farmId = "baraka-agri-ventures";
  const createdById = "farmer-john";

  // Load enterprises and categories
  useEffect(() => {
    async function loadMeta() {
      try {
        setLoadingMeta(true);
        // Standard default enterprises for Kenyan farming
        const mockEnterprises = [
          { id: "ent-poultry", name: "Poultry (Layers & Kienyeji)", code: "POULTRY", defaultUnit: "Tray" },
          { id: "ent-dairy", name: "Dairy Cattle (Friesians)", code: "CATTLE", defaultUnit: "Litre" },
          { id: "ent-fish", name: "Tilapia Ponds (Aquaculture)", code: "AQUACULTURE", defaultUnit: "Kg" },
          { id: "ent-goats", name: "Goats & Sheep (Boer/Dairy)", code: "GOATS_SHEEP", defaultUnit: "Head" },
          { id: "ent-crops", name: "Crops & Silage (Boma Rhodes)", code: "CROPS", defaultUnit: "Bale" },
        ];
        setEnterprises(mockEnterprises);
        setEnterpriseId(mockEnterprises[0].id);

        const mockCategories = [
          // Expense categories
          { id: "cat-feed", name: "Feed (Pellets, Mash, Dairy Meal)", type: "EXPENSE" },
          { id: "cat-vet", name: "Veterinary Drugs & Dewormers", type: "EXPENSE" },
          { id: "cat-vac", name: "Vaccines (Newcastle, Gumboro)", type: "EXPENSE" },
          { id: "cat-labour", name: "Labour & Casual Wages", type: "EXPENSE" },
          { id: "cat-transport", name: "Transport & Boda Delivery", type: "EXPENSE" },
          { id: "cat-supplies", name: "Agrovet Equipment & Supplies", type: "EXPENSE" },
          { id: "cat-chicks", name: "Day-Old Chicks / Stock", type: "EXPENSE" },
          { id: "cat-power", name: "Electricity, Solar & Generator Fuel", type: "EXPENSE" },
          { id: "cat-other-exp", name: "General Maintenance & Other", type: "EXPENSE" },
          // Income categories
          { id: "cat-eggs", name: "Fresh Eggs (Trays)", type: "INCOME" },
          { id: "cat-milk", name: "Raw Morning & Evening Milk", type: "INCOME" },
          { id: "cat-fish-sale", name: "Harvested Whole Tilapia", type: "INCOME" },
          { id: "cat-birds-live", name: "Live Mature Birds / Culled Layers", type: "INCOME" },
          { id: "cat-hay", name: "Boma Rhodes Hay Bales", type: "INCOME" },
          { id: "cat-manure", name: "Farmyard Manure / Organic Compost", type: "INCOME" },
          { id: "cat-other-inc", name: "Other Farm Produce", type: "INCOME" },
        ];
        setCategories(mockCategories);
      } catch (err) {
        console.error("Meta loading error", err);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMeta();
  }, []);

  // Filter categories by type
  const availableCategories = categories.filter(
    (c) => c.type === (type === "EXPENSE" ? "EXPENSE" : "INCOME")
  );

  // Set default category when type or enterprise changes
  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.find((c) => c.id === categoryId)) {
      setCategoryId(availableCategories[0].id);
    }
  }, [type, availableCategories, categoryId]);

  // Automatically calculate Total Amount when Quantity or Unit Price changes
  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const q = parseFloat(val);
    const p = parseFloat(unitPrice);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setAmount((q * p).toString());
    }
  };

  const handleUnitPriceChange = (val: string) => {
    setUnitPrice(val);
    const q = parseFloat(quantity);
    const p = parseFloat(val);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setAmount((q * p).toString());
    }
  };

  // Quick Amount presets
  const applyPreset = (preset: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + preset).toString());
  };

  // Handle Receipt Upload simulation
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Please enter a valid amount greater than zero.");
      return;
    }

    if (!enterpriseId) {
      setFormError("Please select a farm enterprise.");
      return;
    }

    if (!categoryId) {
      setFormError("Please select a category.");
      return;
    }

    if (type === "SALE" && (paymentStatus === "CREDIT" || paymentStatus === "PARTIALLY_PAID") && !buyerName.trim()) {
      setFormError("Customer / Buyer name is required for credit or partially-paid sales to track Accounts Receivable.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        farmId,
        enterpriseId,
        categoryId,
        createdById,
        type,
        transactionDate: new Date(transactionDate).toISOString(),
        amount: parsedAmount,
        quantity: quantity ? parseFloat(quantity) : undefined,
        unit: quantity ? unit : undefined,
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        paymentMethod,
        paymentStatus,
        salesChannel: type === "SALE" ? salesChannel : undefined,
        buyerName: buyerName.trim() || undefined,
        notes: notes.trim() || undefined,
        receiptUrl: receiptUrl || undefined,
      };

      // Enqueue to offline sync engine (handles both instant online fetch and offline queue)
      const res = await syncEngine.enqueueTransaction(payload);

      setIsSubmitting(false);

      if (res.syncedImmediately && res.receiptNumber) {
        setCreatedReceipt({
          receiptNumber: res.receiptNumber,
          receiptId: res.receiptId,
          isOffline: false,
        });
      } else {
        setCreatedReceipt({
          receiptNumber: res.temporaryReceiptNumber || `OFFLINE-${res.localId.slice(0, 8).toUpperCase()}`,
          receiptId: undefined,
          isOffline: true,
        });
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      setFormError(err.message || "Failed to record transaction.");
      setIsSubmitting(false);
    }
  };

  if (createdReceipt) {
    return (
      <div className="py-6 px-3 text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        <div>
          <h3 className="text-lg font-black text-farm-charcoal">Transaction Recorded Successfully</h3>
          <p className="text-xs text-farm-muted mt-1">
            {createdReceipt.isOffline
              ? "Saved locally! Authoritative QR verification will be generated on sync."
              : "Official digital receipt and unique QR code generated."}
          </p>
        </div>

        {/* Receipt Code Box */}
        <div className="p-4 bg-farm-bg rounded-2xl border border-farm-border inline-block max-w-xs w-full space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-farm-muted">
            {createdReceipt.isOffline ? "Temporary Receipt Reference" : "Official Receipt Number"}
          </span>
          <div className="font-mono font-black text-base text-farm-primary tracking-wide">
            {createdReceipt.receiptNumber}
          </div>
          {createdReceipt.isOffline && (
            <p className="text-[10px] text-amber-700 font-medium">
              Offline receipt — verification available after sync.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          {!createdReceipt.isOffline && (
            <Link
              href={`/receipts/${createdReceipt.receiptId || createdReceipt.receiptNumber}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-farm-primary hover:bg-farm-secondary text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
            >
              <QrCode className="w-4 h-4 text-farm-lime" />
              <span>View & Print Receipt</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setCreatedReceipt(null);
              setAmount("");
              setQuantity("");
              setUnitPrice("");
              setNotes("");
              setBuyerName("");
              if (onSuccess) onSuccess();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-farm-surface hover:bg-farm-bg border border-farm-border text-farm-charcoal font-bold rounded-xl text-xs transition-colors"
          >
            <span>Record Another Entry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Dual Mode Switcher */}
      <div className="grid grid-cols-2 p-1 bg-farm-bg rounded-xl border border-farm-border">
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={`py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            type === "EXPENSE"
              ? "bg-farm-negative text-white shadow-xs"
              : "text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <span>− Expense / Spend</span>
        </button>
        <button
          type="button"
          onClick={() => setType("SALE")}
          className={`py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            type === "SALE"
              ? "bg-farm-positive text-white shadow-xs"
              : "text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <span>+ Sale / Income</span>
        </button>
      </div>

      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{formError}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{successNotice}</span>
        </div>
      )}

      {/* Date & Enterprise Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-farm-slate mb-1">Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-farm-muted" />
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-farm-slate mb-1">Farm Enterprise</label>
          <div className="relative">
            <Layers className="w-4 h-4 absolute left-3 top-2.5 text-farm-muted" />
            <select
              value={enterpriseId}
              onChange={(e) => setEnterpriseId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
              required
            >
              {enterprises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold text-farm-slate mb-1">
          {type === "EXPENSE" ? "Expense Category" : "Product / Produce Category"}
        </label>
        <div className="relative">
          <Tag className="w-4 h-4 absolute left-3 top-2.5 text-farm-muted" />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
            required
          >
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quantity, Unit & Unit Price (Auto-calculating total) */}
      <div className="p-3 bg-farm-bg/60 rounded-xl border border-farm-border space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-farm-slate">
          <span>OPERATIONAL MEASUREMENTS (OPTIONAL)</span>
          <span className="text-farm-muted">Auto-calculates total</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <input
              type="number"
              step="any"
              placeholder="Qty (e.g. 40)"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:outline-hidden"
            />
          </div>
          <div>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:outline-hidden"
            >
              <option value="Bag">Bags</option>
              <option value="Tray">Trays (Eggs)</option>
              <option value="Litre">Litres (Milk)</option>
              <option value="Kg">Kilograms</option>
              <option value="Piece">Pieces / Birds</option>
              <option value="Head">Head (Livestock)</option>
              <option value="Bale">Bales (Hay)</option>
              <option value="Trip">Trips</option>
              <option value="Day">Days (Labour)</option>
            </select>
          </div>
          <div>
            <input
              type="number"
              step="any"
              placeholder="Unit Price"
              value={unitPrice}
              onChange={(e) => handleUnitPriceChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-xs font-semibold text-farm-slate mb-1">
          Total Amount <span className="text-farm-muted font-normal">(Default Currency: KES)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-sm font-bold text-farm-primary">KSh</span>
          <input
            type="number"
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-14 pr-3 py-2 text-lg font-bold bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
            required
          />
        </div>

        {/* Quick presets for rapid mobile input */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="text-[11px] text-farm-muted">Quick add:</span>
          {[500, 1000, 2500, 5000, 10000].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-[11px] px-2 py-0.5 bg-farm-surface hover:bg-farm-mint border border-farm-border rounded-md text-farm-charcoal font-medium transition-colors"
            >
              +{preset.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method & Payment Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-farm-slate mb-1">Payment Method</label>
          <div className="relative">
            <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-farm-muted" />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
            >
              <option value="MPESA">M-Pesa (Till / Paybill)</option>
              <option value="CASH">Cash in Hand</option>
              <option value="BANK">Bank Transfer / EFT</option>
              <option value="CREDIT">Credit (Accounts Receivable)</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-farm-slate mb-1">Payment Status</label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
          >
            <option value="PAID">Paid in Full</option>
            <option value="PARTIALLY_PAID">Partially Paid (Deposit)</option>
            <option value="CREDIT">Unpaid Credit (Pending)</option>
          </select>
        </div>
      </div>

      {/* Credit / Sale Details (Accounts Receivable triggers) */}
      {type === "SALE" && (
        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-farm-primary">
            <User className="w-3.5 h-3.5 text-farm-secondary" />
            <span>Buyer & Sales Channel</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                placeholder={
                  paymentStatus !== "PAID"
                    ? "Customer Name (Required for Credit) *"
                    : "Customer / Buyer Name (Optional)"
                }
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:outline-hidden"
                required={paymentStatus !== "PAID"}
              />
            </div>
            <div>
              <select
                value={salesChannel}
                onChange={(e) => setSalesChannel(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:outline-hidden"
              >
                <option value="Farm gate">Farm Gate Sales</option>
                <option value="Market">Market Wholesale</option>
                <option value="Dairy Cooperative">Cooperative / Processor</option>
                <option value="Restaurant">Hotel / Restaurant</option>
                <option value="Retailer">Retailer / Supermarket</option>
                <option value="Direct customer">Direct Consumer</option>
              </select>
            </div>
          </div>
          {paymentStatus !== "PAID" && (
            <p className="text-[11px] text-amber-700 font-medium">
              ℹ️ An Accounts Receivable record will be automatically created with 14-day terms.
            </p>
          )}
        </div>
      )}

      {/* Notes & Receipt Attachment */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-farm-slate">Notes / Receipt (Optional)</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Unga 6 bags, invoice #902, driver Boda"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:outline-hidden"
          />
          <label className="cursor-pointer px-3 py-2 bg-farm-bg hover:bg-farm-mint border border-farm-border rounded-lg text-farm-primary flex items-center gap-1.5 text-xs font-semibold transition-colors">
            <Camera className="w-4 h-4 text-farm-secondary" />
            <span className="hidden sm:inline">Receipt</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleReceiptUpload}
              className="hidden"
            />
          </label>
        </div>

        {receiptUrl && (
          <div className="mt-2 flex items-center gap-2 p-1.5 bg-farm-bg rounded-lg border border-farm-border w-fit">
            <img src={receiptUrl} alt="Receipt preview" className="w-12 h-12 object-cover rounded" />
            <button
              type="button"
              onClick={() => setReceiptUrl(null)}
              className="text-[11px] text-red-600 hover:underline px-2"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-semibold text-farm-slate hover:bg-farm-bg rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white shadow-xs transition-all ${
            type === "EXPENSE"
              ? "bg-farm-negative hover:bg-red-700"
              : "bg-farm-primary hover:bg-farm-secondary"
          } ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Record {type === "EXPENSE" ? "Expense" : "Sale"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
