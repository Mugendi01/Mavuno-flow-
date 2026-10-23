import React from "react";
import { ReceiptService } from "@/lib/services/receiptService";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Sprout,
  Calendar,
  Layers,
  Tag,
  DollarSign,
  CreditCard,
  Building,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReceiptVerificationPage({
  params,
}: {
  params: { receiptNumber: string };
}) {
  const verification = await ReceiptService.getPublicVerification(params.receiptNumber);

  const isValid = verification.status === "VALID";
  const isVoided = verification.status === "VOIDED";
  const isNotFound = verification.status === "NOT_FOUND";
  const currency = verification.currency || "KES";

  return (
    <div className="min-h-screen bg-farm-bg flex flex-col items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-farm-surface rounded-3xl border border-farm-border shadow-xl overflow-hidden text-farm-charcoal">
        {/* Brand Banner */}
        <div className="bg-farm-primary px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-farm-secondary flex items-center justify-center">
              <Sprout className="w-4 h-4 text-farm-lime" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight">MAVUNOFLOW</span>
              <p className="text-[10px] text-farm-mint">Digital Receipt Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold bg-farm-secondary/80 px-2.5 py-1 rounded-full text-farm-mint">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Verification</span>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="p-6 text-center border-b border-farm-border">
          {isValid && (
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-xl font-black text-emerald-950">Authentic MavunoFlow Receipt</h1>
              <p className="text-xs text-emerald-700 font-medium">
                ✓ Cryptographically confirmed authentic transaction in MavunoFlow registry.
              </p>
            </div>
          )}

          {isVoided && (
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-800 flex items-center justify-center mx-auto shadow-inner">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-xl font-black text-red-950">Receipt Voided</h1>
              <p className="text-xs text-red-700 font-medium">
                ✕ This receipt has been voided or cancelled and is no longer valid.
              </p>
            </div>
          )}

          {isNotFound && (
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-10 h-10 text-amber-600" />
              </div>
              <h1 className="text-xl font-black text-amber-950">Receipt Not Found</h1>
              <p className="text-xs text-amber-700 font-medium">
                ⚠ Could not find record for <span className="font-mono">{params.receiptNumber}</span>. Please verify the code or contact the issuing farm.
              </p>
            </div>
          )}
        </div>

        {/* Receipt Verification Details */}
        {!isNotFound && (
          <div className="p-6 space-y-4">
            <div className="bg-farm-bg/60 p-3.5 rounded-2xl border border-farm-border space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-farm-muted font-medium">Receipt Number:</span>
                <span className="font-mono font-bold text-farm-primary text-sm">
                  {verification.receiptNumber}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-farm-muted font-medium">Issuing Farm:</span>
                <span className="font-bold text-farm-charcoal">
                  {verification.farmName} ({verification.locationCounty || "Kenya"})
                </span>
              </div>

              {verification.issuedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-farm-muted font-medium">Date & Time:</span>
                  <span className="font-medium text-farm-slate">
                    {format(new Date(verification.issuedAt), "dd MMMM yyyy, HH:mm")}
                  </span>
                </div>
              )}

              {isVoided && verification.voidedAt && (
                <div className="flex justify-between items-center text-red-700 font-semibold">
                  <span>Voided On:</span>
                  <span>{format(new Date(verification.voidedAt), "dd MMMM yyyy, HH:mm")}</span>
                </div>
              )}
            </div>

            {/* Transaction Specifics */}
            <div className="divide-y divide-farm-border text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-farm-muted">Transaction Type:</span>
                <span className="font-bold text-farm-charcoal uppercase">
                  {verification.transactionType === "SALE" ? "Sales / Produce Income" : "Farm Expense"}
                </span>
              </div>

              {verification.enterpriseName && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-farm-muted">Enterprise:</span>
                  <span className="font-bold text-farm-charcoal">{verification.enterpriseName}</span>
                </div>
              )}

              {verification.categoryName && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-farm-muted">Item / Category:</span>
                  <span className="font-semibold text-farm-charcoal">{verification.categoryName}</span>
                </div>
              )}

              {verification.quantity && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-farm-muted">Quantity:</span>
                  <span className="font-semibold text-farm-charcoal">
                    {verification.quantity} {verification.unit || ""}
                  </span>
                </div>
              )}

              {verification.amount !== undefined && (
                <div className="py-3 flex justify-between items-baseline">
                  <span className="text-farm-muted font-bold uppercase text-[11px]">Total Amount:</span>
                  <span
                    className={`text-xl font-black ${
                      isVoided ? "text-gray-400 line-through" : "text-farm-primary"
                    }`}
                  >
                    {currency} {verification.amount.toLocaleString()}
                  </span>
                </div>
              )}

              {verification.paymentStatus && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-farm-muted">Payment Status:</span>
                  <span
                    className={`font-bold ${
                      verification.paymentStatus === "PAID"
                        ? "text-emerald-700"
                        : verification.paymentStatus === "PARTIALLY_PAID"
                        ? "text-blue-700"
                        : "text-amber-700"
                    }`}
                  >
                    {verification.paymentStatus === "PAID"
                      ? "Paid in Full"
                      : verification.paymentStatus === "PARTIALLY_PAID"
                      ? "Partially Paid"
                      : "Credit"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security & Privacy Notice Footer */}
        <div className="p-4 bg-farm-bg border-t border-farm-border text-center text-[11px] text-farm-muted space-y-1">
          <div className="flex items-center justify-center gap-1 font-semibold text-farm-slate">
            <ShieldCheck className="w-3.5 h-3.5 text-farm-secondary" />
            <span>MavunoFlow Public Verification Protocol</span>
          </div>
          <p className="text-[10px] leading-relaxed">
            This verification service confirms authentic recording in MavunoFlow. No sensitive farmer data, login credentials, or private farm financials are exposed.
          </p>
        </div>
      </div>
    </div>
  );
}
