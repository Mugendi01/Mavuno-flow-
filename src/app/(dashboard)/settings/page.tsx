"use client";

import React, { useState } from "react";
import { Settings, Users, Bell, Shield, CheckCircle2, Save } from "lucide-react";

export default function SettingsPage() {
  const [farmName, setFarmName] = useState("Baraka Agri-Ventures");
  const [locationCounty, setLocationCounty] = useState("Nakuru County");
  const [currency, setCurrency] = useState("KES");
  const [farmSize, setFarmSize] = useState("12.5");
  const [reportEmail, setReportEmail] = useState("farmer@farmpulse.co.ke");
  const [reportDay, setReportDay] = useState("1"); // Monday
  const [reportTime, setReportTime] = useState("07:00");
  const [savedNotice, setSavedNotice] = useState(false);

  const teamMembers = [
    { name: "John Kiprop", email: "farmer@farmpulse.co.ke", role: "OWNER", status: "Active" },
    { name: "Samuel Mwangi", email: "samuel.mgr@farmpulse.co.ke", role: "MANAGER", status: "Active" },
    { name: "Peter Otieno", email: "peter.hand@farmpulse.co.ke", role: "FARM_HAND", status: "Active" },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

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
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Farm preferences updated successfully!</span>
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
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
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
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
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
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
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
                step="any"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
              />
            </div>
          </div>
        </div>

        {/* Weekly Digest Preferences */}
        <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-farm-border pb-3">
            <Bell className="w-5 h-5 text-farm-primary" />
            <h2 className="text-sm font-bold text-farm-primary">Weekly Digest Notifications</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">Delivery Day</label>
              <select
                value={reportDay}
                onChange={(e) => setReportDay(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
              >
                <option value="1">Every Monday (Recommended)</option>
                <option value="5">Every Friday</option>
                <option value="0">Every Sunday</option>
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
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-farm-slate mb-1">Recipient Email</label>
              <input
                type="email"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-lg text-farm-charcoal"
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
            <button
              type="button"
              className="text-xs font-bold text-farm-secondary hover:underline"
            >
              + Invite Member
            </button>
          </div>

          <div className="divide-y divide-farm-border text-xs">
            {teamMembers.map((m) => (
              <div key={m.email} className="py-2.5 flex items-center justify-between">
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
            className="flex items-center gap-2 px-6 py-2.5 bg-farm-primary hover:bg-farm-secondary text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
