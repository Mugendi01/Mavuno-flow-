"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TransactionDTO, PaymentMethod, PaymentStatus } from "@/lib/types";
import { X, Save, AlertCircle, Loader2, Edit2 } from "lucide-react";

interface EditTransactionModalProps {
  transaction: TransactionDTO;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  const router = useRouter();

  const [transactionDate, setTransactionDate] = useState(
    transaction.transactionDate ? transaction.transactionDate.split("T")[0] : ""
  );
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [quantity, setQuantity] = useState(
    transaction.quantity ? transaction.quantity.toString() : ""
  );
  const [unit, setUnit] = useState(transaction.unit || "");
  const [unitPrice, setUnitPrice] = useState(
    transaction.unitPrice ? transaction.unitPrice.toString() : ""
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    transaction.paymentMethod
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    transaction.paymentStatus
  );
  const [buyerName, setBuyerName] = useState(transaction.buyerName || "");
  const [notes, setNotes] = useState(transaction.notes || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let parsedAmount = parseFloat(amount);
    const parsedQty = quantity ? parseFloat(quantity) : null;
    const parsedUnitPrice = unitPrice ? parseFloat(unitPrice) : null;

    if (parsedQty !== null && parsedUnitPrice !== null && parsedQty > 0 && parsedUnitPrice > 0) {
      parsedAmount = Math.round(parsedQty * parsedUnitPrice * 100) / 100;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Please enter a valid amount greater than zero.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmId: transaction.farmId,
          transactionDate: new Date(transactionDate).toISOString(),
          amount: parsedAmount,
          quantity: parsedQty,
          unit: parsedQty ? unit : null,
          unitPrice: parsedUnitPrice,
          paymentMethod,
          paymentStatus,
          buyerName: buyerName.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        router.refresh();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage(data.error || "Server failed to update transaction.");
      }
    } catch (err: any) {
      console.error("Update error:", err);
      setErrorMessage(err.message || "Network error while updating transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-farm-primaryDark/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-farm-surface rounded-2xl shadow-2xl border border-farm-border overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-farm-border bg-farm-bg/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-farm-primary flex items-center justify-center text-white">
              <Edit2 className="w-4 h-4 text-farm-lime" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-farm-primary">
                Edit {transaction.type === "SALE" ? "Sale" : "Expense"} Transaction
              </h2>
              <p className="text-[11px] text-farm-muted">
                {transaction.enterpriseName} • {transaction.categoryName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-farm-muted hover:text-farm-charcoal hover:bg-farm-border/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">
              Transaction Date
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
              required
            />
          </div>

          {/* Quantity, Unit & Unit Price */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">Quantity</label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
                placeholder="e.g. 15"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
                placeholder="Trays / Litres"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">Unit Price</label>
              <input
                type="number"
                step="any"
                value={unitPrice}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
                placeholder="KSh"
              />
            </div>
          </div>

          {/* Total Amount */}
          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">
              Total Amount (KES)
            </label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal font-bold"
              required
            />
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
              >
                <option value="MPESA">M-Pesa</option>
                <option value="CASH">Cash</option>
                <option value="BANK">Bank Transfer</option>
                <option value="CREDIT">Credit</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
              >
                <option value="PAID">Paid in Full</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="CREDIT">Credit (Unpaid)</option>
              </select>
            </div>
          </div>

          {/* Buyer / Customer Name */}
          {transaction.type === "SALE" && (
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Customer / Buyer Name
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
                placeholder="e.g. Mama Mboga / Wakulima Hotel"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal resize-none"
              placeholder="Operational details / references"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-farm-border text-farm-slate rounded-xl text-xs font-bold hover:bg-farm-bg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-farm-primary hover:bg-farm-secondary text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? "Saving..." : "Update Transaction"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
