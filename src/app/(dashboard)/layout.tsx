"use client";

import React, { useState, useEffect } from "react";
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
  const [farmInfo, setFarmInfo] = useState({
    farmName: "My Farm",
    county: "Kenya",
    role: "OWNER",
    userName: "Farmer",
    userEmail: "",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setFarmInfo({
            farmName: data.farm?.name || "My Farm",
            county: data.farm?.locationCounty ? `${data.farm.locationCounty} County` : "Kenya",
            role: data.role || "OWNER",
            userName: data.user?.fullName || "Farmer",
            userEmail: data.user?.email || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-farm-bg">
      <OfflineBanner />
      <Navbar
        onOpenQuickLog={() => setIsQuickLogOpen(true)}
        farmName={farmInfo.farmName}
        userName={farmInfo.userName}
      />

      <div className="flex-1 flex">
        <Sidebar
          onOpenQuickLog={() => setIsQuickLogOpen(true)}
          farmName={farmInfo.farmName}
          county={farmInfo.county}
          role={farmInfo.role}
        />
        <main className="flex-1 p-3 sm:p-6 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      <MobileBottomNav onOpenQuickLog={() => setIsQuickLogOpen(true)} />

      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
