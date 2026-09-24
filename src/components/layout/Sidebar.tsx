"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  TrendingDown,
  Users2,
  PieChart,
  FileSpreadsheet,
  Settings,
  Plus,
} from "lucide-react";

interface SidebarProps {
  onOpenQuickLog?: () => void;
}

export function Sidebar({ onOpenQuickLog }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Sales / Income", href: "/sales", icon: TrendingUp },
    { name: "Expenses", href: "/expenses", icon: TrendingDown },
    { name: "Receivables (Debtors)", href: "/receivables", icon: Users2 },
    { name: "Enterprises", href: "/enterprises", icon: PieChart },
    { name: "Weekly Reports", href: "/reports", icon: FileSpreadsheet },
    { name: "Farm Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-farm-surface border-r border-farm-border shrink-0 min-h-[calc(100vh-61px)]">
      {/* Action Button */}
      <div className="p-4">
        <button
          onClick={onOpenQuickLog}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-farm-primary hover:bg-farm-primaryDark text-white font-semibold rounded-xl shadow-sm transition-colors text-sm"
        >
          <Plus className="w-5 h-5 text-farm-lime" />
          <span>Quick Log Transaction</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-farm-mint text-farm-primary font-bold shadow-xs"
                  : "text-farm-slate hover:bg-farm-bg hover:text-farm-charcoal"
              }`}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-farm-primary" : "text-farm-muted"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role & Farm Info */}
      <div className="p-4 border-t border-farm-border bg-farm-bg/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-farm-charcoal">Nakuru County</p>
            <p className="text-[11px] text-farm-muted">Currency: KES (KSh)</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
            OWNER
          </span>
        </div>
      </div>
    </aside>
  );
}
