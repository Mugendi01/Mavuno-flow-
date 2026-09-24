"use client";

import React, { useState } from "react";
import { ReceiptDTO } from "@/lib/types";
import { format } from "date-fns";
import {
  Printer,
  Share2,
  Download,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Sprout,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface ReceiptCardProps {
  receipt: ReceiptDTO;
  showBackLink?: boolean;
}

export function ReceiptCard({ receipt, showBackLink = true }: ReceiptCardProps) {
  const [copied, setCopied] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const tx = receipt.transaction;
  const isSale = tx?.type === "SALE";
  const isVoided = receipt.status === "VOIDED" || tx?.isDeleted;
  const currency = receipt.currency || "KES";

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: `Receipt ${receipt.receiptNumber} — FarmPulse`,
      text: `${isSale ? "Sales" : "Expense"} Receipt for ${receipt.farmName}: ${currency} ${(
        tx?.amount || 0
      ).toLocaleString()}`,
      url: receipt.qrPayload,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy link
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(receipt.qrPayload);
        setCopied(true);
        setShareNotice("Verification link copied to clipboard!");
        setTimeout(() => {
          setCopied(false);
          setShareNotice(null);
        }, 3000);
      }
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(receipt.qrPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print flex items-center justify-between flex-wrap gap-2">
        {showBackLink ? (
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-farm-slate hover:text-farm-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Transactions</span>
          </Link>
        ) : (
          <div></div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-farm-surface hover:bg-farm-bg border border-farm-border rounded-lg text-xs font-semibold text-farm-slate transition-colors"
            title="Share receipt"
          >
            <Share2 className="w-3.5 h-3.5 text-farm-primary" />
            <span>Share</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-farm-primary hover:bg-farm-secondary text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-farm-lime" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {shareNotice && (
        <div className="no-print p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{shareNotice}</span>
        </div>
      )}

      {/* Printable Receipt Paper Container */}
      <div className="bg-farm-surface border border-farm-border rounded-3xl p-6 sm:p-7 shadow-sm text-farm-charcoal relative overflow-hidden print:p-0 print:border-none print:shadow-none">
        {/* Void Watermark */}
        {isVoided && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="transform -rotate-45 border-4 border-red-600 text-red-600 font-black text-5xl uppercase tracking-widest px-8 py-3 opacity-20 select-none">
              VOIDED
            </div>
          </div>
        )}

        {/* Receipt Header */}
        <div className="text-center pb-5 border-b border-dashed border-farm-border relative">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-farm-primary flex items-center justify-center text-white">
              <Sprout className="w-4 h-4 text-farm-lime" />
            </div>
            <span className="font-black text-lg tracking-tight text-farm-primary">FARMPULSE</span>
          </div>

          <h1 className="text-base font-black text-farm-charcoal mt-1">
            {receipt.farmName || "Baraka Agri-Ventures"}
          </h1>
          <p className="text-xs text-farm-muted">
            {receipt.locationCounty ? `${receipt.locationCounty}, Kenya` : "Kenya"}
          </p>

          {/* Badge */}
          <div className="mt-3">
            <span
              className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                isVoided
                  ? "bg-red-100 text-red-800 border border-red-300"
                  : isSale
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : "bg-red-50 text-red-900 border border-red-200"
              }`}
            >
              {isVoided ? "VOIDED RECEIPT" : isSale ? "OFFICIAL SALES RECEIPT" : "EXPENSE RECEIPT"}
            </span>
          </div>
        </div>

        {/* Receipt Number & Date Strip */}
        <div className="py-4 border-b border-dashed border-farm-border text-xs space-y-1.5 bg-farm-bg/30 -mx-6 sm:-mx-7 px-6 sm:px-7">
          <div className="flex justify-between items-center">
            <span className="text-farm-muted font-medium">Receipt No:</span>
            <span className="font-mono font-bold text-farm-primary text-sm tracking-wide">
              {receipt.receiptNumber}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-farm-muted font-medium">Transaction ID:</span>
            <span className="font-mono text-[11px] text-farm-slate truncate max-w-[190px]">
              {receipt.transactionId}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-farm-muted font-medium">Date & Time:</span>
            <span className="font-medium text-farm-charcoal">
              {format(new Date(receipt.issuedAt), "dd MMM yyyy, HH:mm")}
            </span>
          </div>
        </div>

        {/* Itemized Transaction Summary */}
        <div className="py-4 border-b border-dashed border-farm-border space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-farm-muted font-medium">Enterprise:</span>
            <span className="font-bold text-farm-charcoal">{tx?.enterpriseName || "Farm General"}</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-farm-muted font-medium">Category / Item:</span>
            <span className="font-bold text-farm-charcoal">{tx?.categoryName || "General Entry"}</span>
          </div>

          {tx?.quantity && (
            <div className="flex justify-between text-xs">
              <span className="text-farm-muted font-medium">Quantity / Measure:</span>
              <span className="font-semibold text-farm-charcoal">
                {tx.quantity} {tx.unit || "Units"}
                {tx.unitPrice ? ` @ ${currency} ${tx.unitPrice.toLocaleString()}` : ""}
              </span>
            </div>
          )}

          {tx?.buyerName && (
            <div className="flex justify-between text-xs">
              <span className="text-farm-muted font-medium">{isSale ? "Customer:" : "Vendor:"}</span>
              <span className="font-bold text-farm-charcoal">{tx.buyerName}</span>
            </div>
          )}

          {tx?.salesChannel && (
            <div className="flex justify-between text-xs">
              <span className="text-farm-muted font-medium">Sales Channel:</span>
              <span className="font-medium text-farm-charcoal">{tx.salesChannel}</span>
            </div>
          )}

          {tx?.notes && (
            <div className="text-xs bg-farm-bg/60 p-2.5 rounded-xl border border-farm-border text-farm-slate italic">
              "{tx.notes}"
            </div>
          )}
        </div>

        {/* Financial Amount Strip */}
        <div className="py-4 border-b border-dashed border-farm-border">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-farm-muted">
              Total Amount
            </span>
            <span
              className={`text-2xl font-black ${
                isVoided ? "text-gray-400 line-through" : isSale ? "text-farm-positive" : "text-farm-negative"
              }`}
            >
              {currency} {(tx?.amount || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-xs text-farm-slate">
            <span>Payment Method:</span>
            <span className="font-bold text-farm-charcoal">{tx?.paymentMethod || "CASH"}</span>
          </div>

          <div className="flex justify-between text-xs text-farm-slate mt-1">
            <span>Payment Status:</span>
            <span
              className={`font-bold ${
                tx?.paymentStatus === "PAID"
                  ? "text-emerald-700"
                  : tx?.paymentStatus === "PARTIALLY_PAID"
                  ? "text-blue-700"
                  : "text-amber-700"
              }`}
            >
              {tx?.paymentStatus === "PAID"
                ? "Paid in Full"
                : tx?.paymentStatus === "PARTIALLY_PAID"
                ? "Partially Paid"
                : "Credit (Unpaid)"}
            </span>
          </div>
        </div>

        {/* QR Verification Section */}
        <div className="py-5 text-center space-y-2.5">
          <div className="inline-block p-2 bg-white rounded-2xl border-2 border-farm-primary/20 shadow-xs">
            {receipt.qrCodeDataURL ? (
              <img
                src={receipt.qrCodeDataURL}
                alt={`QR Verification code for ${receipt.receiptNumber}`}
                className="w-36 h-36 mx-auto object-contain"
              />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center bg-farm-bg text-farm-muted text-xs">
                <QrCode className="w-10 h-10" />
              </div>
            )}
          </div>

          <div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-farm-primary">
              <ShieldCheck className="w-4 h-4 text-farm-secondary" />
              <span>FarmPulse Verified Digital Receipt</span>
            </div>
            <p className="text-[11px] text-farm-muted mt-0.5">
              Scan QR code with any camera phone to verify authenticity
            </p>
          </div>

          {/* Verification link copy pill (hidden on print) */}
          <div className="no-print pt-1">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-farm-muted hover:text-farm-primary bg-farm-bg px-2.5 py-1 rounded-full border border-farm-border transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{receipt.qrPayload}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-dashed border-farm-border text-center text-[10px] text-farm-muted space-y-0.5">
          <p className="font-semibold text-farm-slate">Better Records. Better Decisions. Greater Yields.</p>
          <p>FarmPulse Agriculture Platform • Cryptographically Secured</p>
        </div>
      </div>
    </div>
  );
}
