"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-farm-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-farm-surface p-6 sm:p-8 rounded-3xl border border-farm-border text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-xl font-black text-farm-primary tracking-tight">
            Application Error
          </h1>
          <p className="text-xs sm:text-sm text-farm-muted mt-1 leading-relaxed">
            {error?.message ||
              "An unexpected error occurred while processing your request."}
          </p>
          {error?.digest && (
            <div className="mt-2 inline-block px-2.5 py-1 bg-gray-100 rounded-md text-[11px] font-mono text-gray-600">
              Digest: {error.digest}
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-farm-primary text-white rounded-xl text-xs font-bold hover:bg-farm-primary/90 transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-farm-mint text-farm-primary border border-farm-border rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
          >
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
