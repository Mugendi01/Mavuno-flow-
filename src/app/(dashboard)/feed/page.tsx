import React from "react";
import { AuthContextService } from "@/lib/services/authContext";
import prisma from "@/lib/prisma";
import { FeedManagementHub } from "@/components/feed/FeedManagementHub";
import { AlertTriangle } from "lucide-react";

export const revalidate = 0;

export default async function FeedPage() {
  let enterprises: Array<{ id: string; name: string; code: string }> = [];
  let currency = "KES";
  let dbErrorNotice: string | null = null;

  try {
    const authContext = await AuthContextService.getActiveContext();
    const farmId = authContext.farm.id;
    currency = authContext.farm.currency || "KES";

    const entRecords = await prisma.enterprise.findMany({
      where: { farmId, status: "ACTIVE" },
      include: { enterpriseType: true },
      orderBy: { createdAt: "asc" },
    });

    enterprises = entRecords.map((e) => ({
      id: e.id,
      name: e.name,
      code: e.enterpriseType.code,
    }));
  } catch (error: any) {
    console.error("FeedPage server-side fetch error:", error);
    dbErrorNotice = error?.message || "Failed to load farm livestock enterprises.";
  }

  return (
    <div className="space-y-6">
      {dbErrorNotice && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-950">Database Connection Notice</p>
            <p className="text-amber-800 font-mono text-[11px]">{dbErrorNotice}</p>
          </div>
        </div>
      )}

      <FeedManagementHub initialEnterprises={enterprises} currency={currency} />
    </div>
  );
}
