"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Users, Bell, Shield, CheckCircle2, Save, AlertCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [farmName, setFarmName] = useState("");
  const [locationCounty, setLocationCounty] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [farmSize, setFarmSize] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [reportDay, setReportDay] = useState("1"); // 1=Monday
  const [reportTime, setReportTime] = useState("07:00");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load authoritative settings from database
  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.farm) {
            setFarmName(data.farm.name || "");
            setLocationCounty(data.farm.locationCounty || "");
            setCurrency(data.farm.currency || "KES");
            setFarmSize(data.farm.farmSizeAcres ? data.farm.farmSizeAcres.toString() : "");
          }
          if (data.preferences) {
            setReportEmail(data.preferences.reportEmail || "");
            setReportDay(data.preferences.reportDay ? data.preferences.reportDay.toString() : "1");
            setReportTime(data.preferences.reportTime || "07:00");
            setEmailEnabled(data.preferences.emailEnabled ?? true);
          }
          if (data.teamMembers) {
            setTeamMembers(data.teamMembers);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          setErrorMessage(errData.error || "Failed to load farm settings from database.");
        }
      } catch (err: any) {
        console.error("Settings load error:", err);
        setErrorMessage("Network error while connecting to farm settings.");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(null);
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmName,
          locationCounty,
          currency,
          farmSizeAcres: farmSize ? parseFloat(farmSize) : null,
          reportEmail,
          reportDay: parseInt(reportDay, 10),
          reportTime,
          emailEnabled,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSavedNotice("Farm profile and settings saved successfully to database!");
        // Refresh server components across the application
        router.refresh();
        setTimeout(() => setSavedNotice(null), 4000);
      } else {
        setErrorMessage(data.error || "Server rejected settings update.");
      }
    } catch (err: any) {
      console.error("Save settings error:", err);
      setErrorMessage(err.message || "Failed to persist settings to database.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-farm-muted gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-farm-primary" />
        <span className="text-xs font-semibold">Loading farm settings from database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-farm-surface p-4 sm:p-5 rounded-2xl border border-farm-border shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-farm-primary tracking-tight">
          Farm & System Settings
        </h1>
        <p className="text-xs sm:text-sm text-farm-muted mt-0.5">
          Manage farm profile, team roles & automated weekly report schedules.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Farm Profile Card */}
        <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-farm-border pb-3">
            <Settings className="w-5 h-5 text-farm-primary" />
            <h2 className="text-sm font-bold text-farm-primary">Farm Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">Farm Name</label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Location / County
              </label>
              <input
                type="text"
                value={locationCounty}
                onChange={(e) => setLocationCounty(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Primary Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
              >
                <option value="KES">KES — Kenyan Shilling (KSh)</option>
                <option value="UGX">UGX — Ugandan Shilling</option>
                <option value="TZS">TZS — Tanzanian Shilling</option>
                <option value="USD">USD — US Dollar ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Farm Size (Acres)
              </label>
              <input
                type="number"
                step="0.1"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Weekly Digest Preferences */}
        <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-farm-border pb-3">
            <Bell className="w-5 h-5 text-farm-primary" />
            <h2 className="text-sm font-bold text-farm-primary">
              Automated Weekly Farm Digest Schedule
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">Delivery Day</label>
              <select
                value={reportDay}
                onChange={(e) => setReportDay(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
              >
                <option value="1">Every Monday (Recommended)</option>
                <option value="5">Every Friday</option>
                <option value="7">Every Sunday</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">
                Delivery Time (EAT)
              </label>
              <input
                type="time"
                value={reportTime}
                onChange={(e) => setReportTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">Recipient Email</label>
              <input
                type="email"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal focus:ring-2 focus:ring-farm-accent focus:outline-hidden"
                required
              />
            </div>
          </div>
        </div>

        {/* Team Members & RBAC */}
        <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-farm-border pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-farm-primary" />
              <h2 className="text-sm font-bold text-farm-primary">
                Team Access & Role-Based Control (RBAC)
              </h2>
            </div>
          </div>

          <div className="divide-y divide-farm-border text-xs">
            {teamMembers.map((m) => (
              <div key={m.id || m.email} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-farm-charcoal">{m.name}</p>
                  <p className="text-farm-muted">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      m.role === "OWNER"
                        ? "bg-emerald-100 text-emerald-800"
                        : m.role === "MANAGER"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {m.role}
                  </span>
                  <span className="text-[11px] text-farm-muted">{m.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-farm-primary hover:bg-farm-secondary text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? "Saving to Database..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
