"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { QuickLogModal } from "@/components/transactions/QuickLogModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-farm-bg">
      <OfflineBanner />
      <Navbar onOpenQuickLog={() => setIsQuickLogOpen(true)} farmName="Baraka Agri-Ventures" />

      <div className="flex-1 flex">
        <Sidebar onOpenQuickLog={() => setIsQuickLogOpen(true)} />
        <main className="flex-1 p-3 sm:p-6 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      <MobileBottomNav onOpenQuickLog={() => setIsQuickLogOpen(true)} />

      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onSuccess={() => {
          // Trigger refresh if needed
          window.location.reload();
        }}
      />
    </div>
  );
}
