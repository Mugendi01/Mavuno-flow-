"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EditEnterpriseModal } from "./EditEnterpriseModal";
import { Edit2 } from "lucide-react";

interface EnterpriseCardActionsProps {
  enterpriseId: string;
  enterpriseName: string;
  status: string;
}

export function EnterpriseCardActions({
  enterpriseId,
  enterpriseName,
  status,
}: EnterpriseCardActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1 text-farm-muted hover:text-farm-primary hover:bg-farm-bg rounded-md transition-colors"
        title="Edit enterprise name and status"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <EditEnterpriseModal
          enterpriseId={enterpriseId}
          initialName={enterpriseName}
          initialStatus={status}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
