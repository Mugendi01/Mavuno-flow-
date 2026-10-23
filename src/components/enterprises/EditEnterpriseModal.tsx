"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Save, AlertCircle, Loader2, Edit2 } from "lucide-react";

interface EditEnterpriseModalProps {
  enterpriseId: string;
  initialName: string;
  initialStatus: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditEnterpriseModal({
  enterpriseId,
  initialName,
  initialStatus,
  isOpen,
  onClose,
  onSuccess,
}: EditEnterpriseModalProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState(initialStatus || "ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/enterprises/${enterpriseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          status,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        router.refresh();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage(data.error || "Failed to update enterprise in database.");
      }
    } catch (err: any) {
      console.error("Enterprise update error:", err);
      setErrorMessage(err.message || "Network error while saving enterprise.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-farm-primaryDark/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-farm-surface rounded-2xl shadow-2xl border border-farm-border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-farm-border bg-farm-bg/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-farm-primary flex items-center justify-center text-white">
              <Edit2 className="w-4 h-4 text-farm-lime" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-farm-primary">Edit Farm Enterprise</h2>
              <p className="text-[11px] text-farm-muted">Update enterprise name and active status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-farm-muted hover:text-farm-charcoal hover:bg-farm-border/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">
              Enterprise Unit Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-farm-slate mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
            >
              <option value="ACTIVE">Active (Operational)</option>
              <option value="INACTIVE">Inactive (Paused)</option>
              <option value="ARCHIVED">Archived</option>
            </select>
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
              <span>{isSubmitting ? "Saving..." : "Save Enterprise"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
