"use client";

import React from "react";
import Link from "next/link";
import { Sprout, PlusCircle, Bell, User } from "lucide-react";
import { SyncStatusPill } from "../offline/SyncStatusPill";

interface NavbarProps {
  onOpenQuickLog?: () => void;
  farmName?: string;
}

export function Navbar({ onOpenQuickLog, farmName = "Baraka Agri-Ventures" }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-farm-surface border-b border-farm-border px-4 py-3 sm:px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-farm-primary flex items-center justify-center text-white shadow-xs">
            <Sprout className="w-5 h-5 text-farm-lime" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-farm-primary">
                FarmPulse
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-farm-mint text-farm-primary">
                KE
              </span>
            </div>
            <p className="text-xs text-farm-slate truncate max-w-[140px] sm:max-w-[220px]">
              {farmName}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <SyncStatusPill />

        {onOpenQuickLog && (
          <button
            onClick={onOpenQuickLog}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-farm-secondary hover:bg-farm-primary text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-farm-lime" />
            <span>Quick Log</span>
          </button>
        )}

        <Link
          href="/reports"
          className="p-2 text-farm-slate hover:text-farm-primary hover:bg-farm-bg rounded-lg transition-colors"
          title="Weekly Reports"
        >
          <Bell className="w-5 h-5" />
        </Link>

        <Link
          href="/settings"
          className="w-8 h-8 rounded-full bg-farm-primary text-white flex items-center justify-center text-xs font-bold"
          title="Account Settings"
        >
          JK
        </Link>
      </div>
    </header>
  );
}
