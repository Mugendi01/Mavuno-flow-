"use client";

import React, { useEffect } from "react";
import { QuickLogForm } from "./QuickLogForm";
import { X, Zap } from "lucide-react";
import { TransactionType } from "@/lib/types";

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultType?: TransactionType;
}

export function QuickLogModal({
  isOpen,
  onClose,
  onSuccess,
  defaultType = "EXPENSE",
}: QuickLogModalProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-farm-primaryDark/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-farm-surface rounded-2xl shadow-2xl border border-farm-border overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-farm-border bg-farm-bg/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-farm-primary flex items-center justify-center text-white">
              <Zap className="w-4 h-4 text-farm-lime" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-farm-primary">Quick Log Transaction</h2>
              <p className="text-[11px] text-farm-muted">Takes less than 30 seconds</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-farm-muted hover:text-farm-charcoal hover:bg-farm-border/50 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto">
          <QuickLogForm
            defaultType={defaultType}
            onCancel={onClose}
            onSuccess={() => {
              if (onSuccess) onSuccess();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
