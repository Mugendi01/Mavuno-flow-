"use client";

import React, { useEffect, useState } from "react";
import { syncEngine } from "@/lib/offline/syncEngine";
import { CloudOff } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsub = syncEngine.subscribe((state) => {
      setIsOnline(state.isOnline);
    });
    return () => unsub();
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-inner z-50">
      <CloudOff className="w-4 h-4 shrink-0" />
      <span>
        You’re offline — new entries will be saved locally and sync automatically when you’re connected.
      </span>
    </div>
  );
}
