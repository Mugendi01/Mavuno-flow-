"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sprout, PlusCircle, Bell, User, LogOut, Settings } from "lucide-react";
import { SyncStatusPill } from "../offline/SyncStatusPill";

interface NavbarProps {
  onOpenQuickLog?: () => void;
  farmName?: string;
  userName?: string;
}

export function Navbar({
  onOpenQuickLog,
  farmName = "Baraka Agri-Ventures",
  userName = "Farmer",
}: NavbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "MF";
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    // Hard navigate to public landing page
    window.location.href = "/";
  };

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
                MavunoFlow
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

        {/* User Avatar with Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 rounded-full bg-farm-primary text-white flex items-center justify-center text-xs font-bold hover:opacity-90 transition-opacity"
            title={`${userName} (Click for menu)`}
          >
            {getInitials(userName)}
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-farm-border py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-farm-border">
                  <p className="font-bold text-farm-charcoal truncate">{userName}</p>
                  <p className="text-[11px] text-farm-muted truncate">{farmName}</p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-farm-charcoal hover:bg-farm-bg transition-colors font-medium"
                >
                  <Settings className="w-4 h-4 text-farm-muted" />
                  <span>Farm Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors font-semibold text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
