"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Database } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  const isDatabaseError =
    error?.message?.toLowerCase().includes("database") ||
    error?.message?.toLowerCase().includes("prisma") ||
    error?.message?.toLowerCase().includes("file:") ||
    error?.digest;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full bg-farm-surface border border-red-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 text-center">
        <div className="w-14 h-14 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto">
          {isDatabaseError ? (
            <Database className="w-7 h-7" />
          ) : (
            <AlertTriangle className="w-7 h-7" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-black text-farm-primary tracking-tight">
            Dashboard Loading Error
          </h2>
          <p className="text-xs sm:text-sm text-farm-muted mt-1.5 leading-relaxed">
            {error?.message ||
              "A server-side exception occurred while retrieving farm data."}
          </p>
          {error?.digest && (
            <div className="mt-2 inline-block px-2.5 py-1 bg-gray-100 rounded-md text-[11px] font-mono text-gray-600">
              Error Digest: {error.digest}
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-left text-xs text-amber-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-amber-950">
            <span>💡</span> Troubleshooting on Vercel:
          </p>
          <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px] pl-1">
            <li>
              <strong>Database Connection:</strong> Ensure your production{" "}
              <code>DATABASE_URL</code> is set in Vercel Project Settings.
            </li>
            <li>
              <strong>Schema Provider:</strong> If using PostgreSQL, ensure{" "}
              <code>prisma/schema.prisma</code> has{" "}
              <code>provider = &quot;postgresql&quot;</code>.
            </li>
            <li>
              <strong>Migrations:</strong> Run{" "}
              <code>npx prisma db push</code> and seed your database.
            </li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-farm-primary text-white rounded-xl text-xs font-bold hover:bg-farm-primary/90 transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-farm-mint text-farm-primary border border-farm-border rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
          >
            <span>Reload Page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
