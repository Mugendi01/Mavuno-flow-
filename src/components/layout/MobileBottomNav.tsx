"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Plus, Users2, Menu } from "lucide-react";

interface MobileBottomNavProps {
  onOpenQuickLog?: () => void;
}

export function MobileBottomNav({ onOpenQuickLog }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-farm-surface border-t border-farm-border flex items-center justify-around px-2 py-1.5 shadow-lg">
      <Link
        href="/dashboard"
        className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
          pathname === "/dashboard" ? "text-farm-primary font-bold" : "text-farm-muted"
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </Link>

      <Link
        href="/transactions"
        className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
          pathname.startsWith("/transactions") && pathname !== "/transactions/new"
            ? "text-farm-primary font-bold"
            : "text-farm-muted"
        }`}
      >
        <Receipt className="w-5 h-5" />
        <span>History</span>
      </Link>

      {/* Floating Center (+) Quick Log */}
      <div className="-mt-6 flex flex-col items-center">
        <button
          onClick={onOpenQuickLog}
          className="w-13 h-13 rounded-full bg-farm-primary hover:bg-farm-secondary text-white flex items-center justify-center shadow-lg border-4 border-farm-bg transition-transform active:scale-95"
          aria-label="Quick Log Transaction"
        >
          <Plus className="w-7 h-7 text-farm-lime" />
        </button>
        <span className="text-[10px] font-bold text-farm-primary mt-0.5">LOG</span>
      </div>

      <Link
        href="/receivables"
        className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
          pathname.startsWith("/receivables") ? "text-farm-primary font-bold" : "text-farm-muted"
        }`}
      >
        <Users2 className="w-5 h-5" />
        <span>Debtors</span>
      </Link>

      <Link
        href="/reports"
        className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
          pathname.startsWith("/reports") || pathname.startsWith("/settings")
            ? "text-farm-primary font-bold"
            : "text-farm-muted"
        }`}
      >
        <Menu className="w-5 h-5" />
        <span>Reports</span>
      </Link>
    </nav>
  );
}
