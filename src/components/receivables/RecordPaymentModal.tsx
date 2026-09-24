"use client";

import React, { useState } from "react";
import { ReceivableDTO, PaymentMethod } from "@/lib/types";
import { X, CheckCircle2, DollarSign, CreditCard, Loader2 } from "lucide-react";

interface RecordPaymentModalProps {
  receivable: ReceivableDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currency?: string;
}

export function RecordPaymentModal({
  receivable,
  isOpen,
  onClose,
  onSuccess,
  currency = "KES",
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MPESA");
  const [referenceCode, setReferenceCode] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !receivable) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    if (payAmount > receivable.balanceAmount) {
      setError(`Payment cannot exceed outstanding balance of ${currency} ${receivable.balanceAmount.toLocaleString()}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/receivables/${receivable.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payAmount,
          paymentMethod,
          referenceCode: referenceCode.trim() || undefined,
          recordedById: "farmer-john",
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Payment recording failed.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-farm-primaryDark/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-farm-surface rounded-2xl shadow-2xl border border-farm-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-farm-border bg-farm-bg/70">
          <div>
            <h3 className="text-sm font-bold text-farm-primary">Record Debt Payment</h3>
            <p className="text-xs text-farm-muted">{receivable.customerName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-farm-muted hover:text-farm-charcoal rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Outstanding Balance Banner */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Outstanding Balance
              </span>
              <p className="text-lg font-black text-amber-950">
                {currency} {receivable.balanceAmount.toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAmount(receivable.balanceAmount.toString())}
              className="px-2.5 py-1 text-xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg transition-colors"
            >
              Pay Full
            </button>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">
              Amount Received ({currency})
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-base font-bold bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
            >
              <option value="MPESA">M-Pesa</option>
              <option value="CASH">Cash</option>
              <option value="BANK">Bank Transfer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Reference Code */}
          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">
              Reference Code <span className="text-farm-muted font-normal">(e.g. M-Pesa Code)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. QKL89TY71Z"
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal uppercase focus:outline-hidden"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Part payment for milk delivery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:outline-hidden"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-farm-slate hover:bg-farm-bg rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white bg-farm-primary hover:bg-farm-secondary transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
