"use client";

import React, { useEffect, useState } from "react";
import { syncEngine } from "@/lib/offline/syncEngine";
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from "lucide-react";

export function SyncStatusPill() {
  const [status, setStatus] = useState({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
  });

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state) => {
      setStatus(state);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = () => {
    if (status.isOnline && !status.isSyncing) {
      syncEngine.flushSyncQueue();
    }
  };

  if (!status.isOnline) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
        <CloudOff className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
        <span>Offline</span>
        {status.pendingCount > 0 && (
          <span className="bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded-full text-[10px]">
            {status.pendingCount} queued
          </span>
        )}
      </div>
    );
  }

  if (status.isSyncing) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
        <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (status.pendingCount > 0) {
    return (
      <button
        onClick={handleManualSync}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200 transition-colors"
        title="Click to sync now"
      >
        <RefreshCw className="w-3.5 h-3.5 text-blue-700" />
        <span>{status.pendingCount} pending</span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-farm-mint/50 text-farm-primary border border-farm-accent/30">
      <CheckCircle2 className="w-3.5 h-3.5 text-farm-secondary" />
      <span className="hidden sm:inline">Synced</span>
    </div>
  );
}
