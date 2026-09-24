"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, CheckCircle2, ArrowRight, ArrowLeft, Zap, Layers, Bell, PlusCircle } from "lucide-react";
import { QuickLogForm } from "@/components/transactions/QuickLogForm";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Farm Info
  const [farmName, setFarmName] = useState("Green Acres Farm");
  const [county, setCounty] = useState("Kiambu County");
  const [currency, setCurrency] = useState("KES");
  const [farmSize, setFarmSize] = useState("5");

  // Step 2: Enterprises
  const [selectedEnterprises, setSelectedEnterprises] = useState<string[]>([
    "POULTRY",
    "CATTLE",
  ]);

  // Step 3: Notifications
  const [reportDay, setReportDay] = useState("1");
  const [reportTime, setReportTime] = useState("07:00");
  const [reportEmail, setReportEmail] = useState("farmer@example.com");

  const enterpriseOptions = [
    { code: "POULTRY", name: "Poultry (Layers, Broilers, Kienyeji)", icon: "🐔" },
    { code: "CATTLE", name: "Cattle (Dairy & Beef Ranching)", icon: "🐄" },
    { code: "AQUACULTURE", name: "Aquaculture (Tilapia & Catfish Ponds)", icon: "🐟" },
    { code: "GOATS_SHEEP", name: "Goats & Sheep (Dairy & Meat)", icon: "🐐" },
    { code: "PIGGERY", name: "Piggery (Breeding & Fattening)", icon: "🐖" },
    { code: "CROPS", name: "Crops, Fodder & Silage", icon: "🌱" },
  ];

  const toggleEnterprise = (code: string) => {
    if (selectedEnterprises.includes(code)) {
      if (selectedEnterprises.length > 1) {
        setSelectedEnterprises(selectedEnterprises.filter((c) => c !== code));
      }
    } else {
      setSelectedEnterprises([...selectedEnterprises, code]);
    }
  };

  const handleComplete = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-farm-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-farm-surface rounded-3xl border border-farm-border shadow-xl p-6 sm:p-8 space-y-6">
        {/* Logo & Step indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-farm-primary flex items-center justify-center text-white">
              <Sprout className="w-5 h-5 text-farm-lime" />
            </div>
            <span className="font-black text-lg text-farm-primary">FarmPulse</span>
          </div>
          <span className="text-xs font-bold text-farm-slate bg-farm-bg px-3 py-1 rounded-full border border-farm-border">
            Step {step} of 4
          </span>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-farm-bg rounded-full h-2 overflow-hidden border border-farm-border">
          <div
            className="bg-farm-primary h-2 transition-all duration-300 rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {/* Step 1: Create Farm */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-farm-primary">Welcome! Tell us about your farm</h2>
              <p className="text-xs text-farm-muted mt-1">
                FarmPulse tracks your revenue, expenses, and enterprise margins from day one.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-farm-slate mb-1">Farm Name</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-xl"
                  placeholder="e.g. Baraka Agri-Ventures"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-farm-slate mb-1">
                    Location / County
                  </label>
                  <input
                    type="text"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-xl"
                    placeholder="e.g. Nakuru County"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-farm-slate mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-xl"
                  >
                    <option value="KES">KES (KSh)</option>
                    <option value="UGX">UGX</option>
                    <option value="TZS">TZS</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-farm-slate mb-1">
                  Farm Size in Acres (Optional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-xl"
                  placeholder="e.g. 10"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-farm-primary hover:bg-farm-secondary text-white font-bold rounded-xl text-sm transition-colors mt-6 shadow-xs"
            >
              <span>Continue to Enterprises</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Select Enterprises */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-farm-primary">Select Your Farm Enterprises</h2>
              <p className="text-xs text-farm-muted mt-1">
                You can activate multiple enterprises. You can add or modify these anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {enterpriseOptions.map((opt) => {
                const isSelected = selectedEnterprises.includes(opt.code);
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => toggleEnterprise(opt.code)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? "bg-farm-mint/50 border-farm-secondary text-farm-primary font-bold shadow-xs"
                        : "bg-farm-surface border-farm-border text-farm-slate hover:bg-farm-bg"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-xs">{opt.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 border border-farm-border rounded-xl text-xs font-bold text-farm-slate hover:bg-farm-bg"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-farm-primary hover:bg-farm-secondary text-white font-bold rounded-xl text-sm transition-colors shadow-xs"
              >
                <span>Continue to Digest Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Configure Weekly Digest */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-farm-primary">Configure Automated Weekly Digest</h2>
              <p className="text-xs text-farm-muted mt-1">
                Receive an executive weekly summary of your income, spending & top cost drivers.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-farm-slate mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-farm-slate mb-1">Delivery Day</label>
                  <select
                    value={reportDay}
                    onChange={(e) => setReportDay(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-xl"
                  >
                    <option value="1">Monday (Recommended)</option>
                    <option value="5">Friday</option>
                    <option value="0">Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-farm-slate mb-1">
                    Delivery Time
                  </label>
                  <input
                    type="time"
                    value={reportTime}
                    onChange={(e) => setReportTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-farm-surface border border-farm-border rounded-xl"
                  />
                </div>
              </div>

              <p className="text-[11px] text-farm-muted">
                Default time zone: <strong>Africa/Nairobi (EAT)</strong>
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-3 border border-farm-border rounded-xl text-xs font-bold text-farm-slate hover:bg-farm-bg"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-farm-primary hover:bg-farm-secondary text-white font-bold rounded-xl text-sm transition-colors shadow-xs"
              >
                <span>Record First Entry</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: First Entry */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-farm-primary">Record Your First Farm Entry</h2>
              <p className="text-xs text-farm-muted mt-1">
                Log a quick expense or sale right now. Takes under 30 seconds!
              </p>
            </div>

            <div className="p-4 bg-farm-bg/50 rounded-2xl border border-farm-border">
              <QuickLogForm
                onSuccess={handleComplete}
                onCancel={handleComplete}
              />
            </div>

            <div className="text-center pt-2">
              <button
                onClick={handleComplete}
                className="text-xs font-bold text-farm-muted hover:text-farm-primary underline"
              >
                Skip to Dashboard →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
