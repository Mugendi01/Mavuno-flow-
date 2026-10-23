"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TransactionDTO } from "@/lib/types";
import { EditTransactionModal } from "./EditTransactionModal";
import { Edit2, Trash2, Loader2 } from "lucide-react";

interface TransactionRowActionsProps {
  transaction: TransactionDTO;
}

export function TransactionRowActions({ transaction }: TransactionRowActionsProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to void this ${transaction.type === "SALE" ? "sale" : "expense"} of KES ${transaction.amount.toLocaleString()}? This will mark it as voided in the audit log.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}?farmId=${transaction.farmId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to void transaction");
      }
    } catch (e: any) {
      console.error("Void error:", e);
      alert(e.message || "Network error while voiding transaction");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={() => setIsEditOpen(true)}
          className="p-1.5 text-farm-slate hover:text-farm-primary hover:bg-farm-bg rounded-lg border border-transparent hover:border-farm-border transition-colors"
          title="Edit transaction"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 text-farm-muted hover:text-red-700 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors disabled:opacity-50"
          title="Void transaction"
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {isEditOpen && (
        <EditTransactionModal
          transaction={transaction}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
