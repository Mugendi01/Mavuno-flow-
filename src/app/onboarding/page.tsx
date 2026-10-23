"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sprout,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Building2,
  MapPin,
  Layers,
  Sliders,
  Bell,
  Sparkles,
} from "lucide-react";

const KENYAN_COUNTIES = [
  "Nakuru",
  "Kiambu",
  "Uasin Gishu",
  "Machakos",
  "Meru",
  "Nyeri",
  "Kisumu",
  "Kakamega",
  "Kilifi",
  "Murang'a",
  "Kirinyaga",
  "Trans Nzoia",
  "Bomet",
  "Kericho",
  "Bungoma",
  "Nandi",
  "Nyandarua",
  "Embu",
  "Laikipia",
  "Kajiado",
  "Nairobi",
  "Mombasa",
  "Narok",
  "Homa Bay",
  "Migori",
  "Siaya",
  "Busia",
  "Kitui",
  "Makueni",
  "Taita Taveta",
  "Baringo",
  "Elgeyo Marakwet",
  "Vihiga",
  "Tharaka Nithi",
  "Isiolo",
  "Marsabit",
  "Garissa",
  "Wajir",
  "Mandera",
  "Turkana",
  "West Pokot",
  "Samburu",
  "Kwale",
  "Lamu",
  "Tana River",
];

const ENTERPRISE_OPTIONS = [
  {
    code: "POULTRY",
    name: "Poultry",
    subtext: "Broilers · Layers · Kienyeji · Breeding",
    icon: "🐔",
  },
  {
    code: "CATTLE",
    name: "Cattle & Dairy",
    subtext: "Milk · Beef · Feedlot · Ranching",
    icon: "🐄",
  },
  {
    code: "GOATS_SHEEP",
    name: "Goats & Sheep",
    subtext: "Dairy goats · Meat goats · Sheep · Breeding",
    icon: "🐐",
  },
  {
    code: "AQUACULTURE",
    name: "Fish Farming",
    subtext: "Tilapia · Catfish · Ponds · Cages · Hatchery",
    icon: "🐟",
  },
  {
    code: "PIGGERY",
    name: "Piggery",
    subtext: "Breeding · Piglets · Fattening · Pork",
    icon: "🐖",
  },
  {
    code: "CROPS",
    name: "Crops & Fodder",
    subtext: "Maize · Vegetables · Fruits · Silage · Hay",
    icon: "🌱",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Session user info
  const [fullName, setFullName] = useState("");
  const [farmerRole, setFarmerRole] = useState("Farm Owner");

  // Step 1: Farm Info
  const [farmName, setFarmName] = useState("");
  const [farmSizeStr, setFarmSizeStr] = useState("1–5 acres");
  const [isOnlyFarm, setIsOnlyFarm] = useState("Yes");

  // Step 2: Location
  const [country, setCountry] = useState("Kenya");
  const [county, setCounty] = useState("Nakuru");
  const [subCounty, setSubCounty] = useState("");
  const [townArea, setTownArea] = useState("");

  // Step 3: Enterprises & Primary
  const [selectedEnterprises, setSelectedEnterprises] = useState<string[]>(["POULTRY"]);
  const [primaryEnterprise, setPrimaryEnterprise] = useState("POULTRY");

  // Step 4: Scale Operations & Current Records
  const [scaleBirds, setScaleBirds] = useState("100–500");
  const [scaleCattle, setScaleCattle] = useState("6–15");
  const [scaleFish, setScaleFish] = useState("1–2");
  const [scalePigs, setScalePigs] = useState("1–10");
  const [recordMethod, setRecordMethod] = useState("Notebook");

  // Step 5: Priorities & Notifications
  const [trackedPriorities, setTrackedPriorities] = useState<string[]>([
    "expenses",
    "sales",
    "netProfit",
    "customerDebts",
    "weeklyReports",
  ]);
  const [reportEnabled, setReportEnabled] = useState(true);
  const [reportDay, setReportDay] = useState(1); // Monday
  const [reportTime, setReportTime] = useState("07:00");

  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Load user session on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          if (data.user.fullName) setFullName(data.user.fullName);
        }
      })
      .catch(() => {});
  }, []);

  const toggleEnterprise = (code: string) => {
    let next: string[];
    if (selectedEnterprises.includes(code)) {
      if (selectedEnterprises.length > 1) {
        next = selectedEnterprises.filter((c) => c !== code);
      } else {
        return; // At least one enterprise required
      }
    } else {
      next = [...selectedEnterprises, code];
    }
    setSelectedEnterprises(next);
    if (!next.includes(primaryEnterprise)) {
      setPrimaryEnterprise(next[0]);
    }
  };

  const togglePriority = (p: string) => {
    if (trackedPriorities.includes(p)) {
      setTrackedPriorities(trackedPriorities.filter((item) => item !== p));
    } else {
      setTrackedPriorities([...trackedPriorities, p]);
    }
  };

  const parseAcres = (sizeLabel: string): number | null => {
    if (sizeLabel === "Less than 1 acre") return 0.5;
    if (sizeLabel === "1–5 acres") return 3.0;
    if (sizeLabel === "6–20 acres") return 12.0;
    if (sizeLabel === "21–50 acres") return 35.0;
    if (sizeLabel === "51–100 acres") return 75.0;
    if (sizeLabel === "More than 100 acres") return 150.0;
    return null;
  };

  const handleNext = () => {
    setErrorNotice(null);

    if (step === 1) {
      if (!fullName.trim()) {
        setErrorNotice("Please enter your name.");
        return;
      }
      if (!farmName.trim()) {
        setErrorNotice("Please enter your farm name.");
        return;
      }
    }

    if (step === 2) {
      if (!county.trim()) {
        setErrorNotice("Please select your farm's county.");
        return;
      }
    }

    if (step === 3) {
      if (selectedEnterprises.length === 0) {
        setErrorNotice("Please select at least one agricultural enterprise.");
        return;
      }
    }

    setStep(step + 1);
  };

  const handleComplete = async () => {
    setErrorNotice(null);
    setIsLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        farmerRole,
        farmName: farmName.trim(),
        farmSizeAcres: parseAcres(farmSizeStr),
        isOnlyFarm: isOnlyFarm === "Yes",
        country,
        county,
        subCounty: subCounty.trim() || undefined,
        townArea: townArea.trim() || undefined,
        enterprises: selectedEnterprises,
        primaryEnterprise,
        scaleOperations: {
          birdsCount: selectedEnterprises.includes("POULTRY") ? scaleBirds : undefined,
          cattleCount: selectedEnterprises.includes("CATTLE") ? scaleCattle : undefined,
          pondsCount: selectedEnterprises.includes("AQUACULTURE") ? scaleFish : undefined,
          pigsCount: selectedEnterprises.includes("PIGGERY") ? scalePigs : undefined,
        },
        recordKeepingMethod: recordMethod,
        trackedPriorities,
        currency: "KES",
        reportEnabled,
        reportDay,
        reportTime,
        timezone: "Africa/Nairobi",
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to complete onboarding.");
      }

      // Completed -> redirect to personalized dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorNotice(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFDF9] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#CBD5E1] shadow-xl p-6 sm:p-10 space-y-6">
        {/* Header & Step Tracker */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1B4332] flex items-center justify-center text-white shadow-xs">
              <Sprout className="w-5 h-5 text-[#D8F3DC]" />
            </div>
            <div>
              <span className="font-black text-lg text-[#1B4332]">MavunoFlow</span>
              <p className="text-[11px] text-[#64748B] font-medium">Farm Onboarding Wizard</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#1B4332] bg-[#D8F3DC] px-3.5 py-1 rounded-full">
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#1B4332] h-2 transition-all duration-300 rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Error Notice */}
        {errorNotice && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* =========================================================================
            STAGE 1: ABOUT YOU & YOUR FARM
        ========================================================================= */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A]">About You & Your Farm</h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Let's set up the basic identity for your agricultural operation.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">What's your name?</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Mike Mwangi"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#1B4332] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">What best describes you?</label>
                  <select
                    value={farmerRole}
                    onChange={(e) => setFarmerRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#1B4332] outline-none font-medium"
                  >
                    <option value="Farm Owner">Farm Owner</option>
                    <option value="Farm Manager">Farm Manager</option>
                    <option value="Farmer">Farmer</option>
                    <option value="Agribusiness Owner">Agribusiness Owner</option>
                    <option value="Farm Worker">Farm Worker</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1">What is your farm called?</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Green Valley Farm"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#1B4332] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Farm size (optional)</label>
                  <select
                    value={farmSizeStr}
                    onChange={(e) => setFarmSizeStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#1B4332] outline-none font-medium"
                  >
                    <option value="Less than 1 acre">Less than 1 acre</option>
                    <option value="1–5 acres">1–5 acres</option>
                    <option value="6–20 acres">6–20 acres</option>
                    <option value="21–50 acres">21–50 acres</option>
                    <option value="51–100 acres">51–100 acres</option>
                    <option value="More than 100 acres">More than 100 acres</option>
                    <option value="Prefer not to say">Prefer not to say / Not applicable</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Is this your only farm?</label>
                  <select
                    value={isOnlyFarm}
                    onChange={(e) => setIsOnlyFarm(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#1B4332] outline-none font-medium"
                  >
                    <option value="Yes">Yes, this is my main farm</option>
                    <option value="No">No, I operate multiple farms</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 2: FARM LOCATION
        ========================================================================= */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A]">Where is your farm located?</h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Used for localized regional insights and official receipt headers. Your exact location is never exposed publicly.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-[#CBD5E1] rounded-xl outline-none text-[#64748B]"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">County (Kenya)</label>
                  <select
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#1B4332] outline-none font-semibold text-[#0F172A]"
                  >
                    {KENYAN_COUNTIES.map((c) => (
                      <option key={c} value={c}>
                        {c} County
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">
                    Sub-county <span className="text-[#64748B] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={subCounty}
                    onChange={(e) => setSubCounty(e.target.value)}
                    placeholder="e.g. Rongai, Naivasha, Kikuyu"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#1B4332] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">
                    Town / Area <span className="text-[#64748B] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={townArea}
                    onChange={(e) => setTownArea(e.target.value)}
                    placeholder="e.g. Lanet, Limuru, Ngong"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#1B4332] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 3: WHAT DO YOU FARM? (ENTERPRISES)
        ========================================================================= */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A]">What do you farm?</h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Select all agricultural enterprises active on your farm. You can select multiple.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ENTERPRISE_OPTIONS.map((ent) => {
                const isSelected = selectedEnterprises.includes(ent.code);
                return (
                  <button
                    type="button"
                    key={ent.code}
                    onClick={() => toggleEnterprise(ent.code)}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      isSelected
                        ? "border-[#1B4332] bg-[#D8F3DC]/30 shadow-xs ring-1 ring-[#1B4332]"
                        : "border-[#CBD5E1] bg-white hover:border-slate-400"
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{ent.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-[#0F172A]">{ent.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{ent.subtext}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Primary Enterprise Selector */}
            {selectedEnterprises.length > 1 && (
              <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                <label className="block text-xs font-bold text-[#0F172A]">
                  Which is your primary enterprise? <span className="font-normal text-[#64748B]">(for main dashboard focus)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedEnterprises.map((code) => {
                    const option = ENTERPRISE_OPTIONS.find((o) => o.code === code);
                    const isPrimary = primaryEnterprise === code;
                    return (
                      <button
                        type="button"
                        key={code}
                        onClick={() => setPrimaryEnterprise(code)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                          isPrimary
                            ? "bg-[#1B4332] text-white border-[#1B4332]"
                            : "bg-white text-[#475569] border-[#CBD5E1] hover:bg-slate-50"
                        }`}
                      >
                        <span>{option?.icon}</span>
                        <span>{option?.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STAGE 4: OPERATIONS SCALE & CURRENT RECORD KEEPING
        ========================================================================= */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A]">Farm Scale & Record Keeping</h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Help us calibrate your initial unit economics and default calculations.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Dynamic scale questions based on selected enterprises */}
              {selectedEnterprises.includes("POULTRY") && (
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">
                    🐔 Approximately how many birds do you currently keep?
                  </label>
                  <select
                    value={scaleBirds}
                    onChange={(e) => setScaleBirds(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl outline-none font-semibold text-[#0F172A]"
                  >
                    <option value="Under 100">Under 100 birds</option>
                    <option value="100–500">100–500 birds</option>
                    <option value="501–1,000">501–1,000 birds</option>
                    <option value="1,001–5,000">1,001–5,000 birds</option>
                    <option value="5,000+">5,000+ commercial birds</option>
                  </select>
                </div>
              )}

              {selectedEnterprises.includes("CATTLE") && (
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">
                    🐄 Approximately how many cattle do you currently keep?
                  </label>
                  <select
                    value={scaleCattle}
                    onChange={(e) => setScaleCattle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl outline-none font-semibold text-[#0F172A]"
                  >
                    <option value="1–5">1–5 head of cattle</option>
                    <option value="6–15">6–15 dairy cows / beef</option>
                    <option value="16–50">16–50 head</option>
                    <option value="50+">50+ herd size</option>
                  </select>
                </div>
              )}

              {selectedEnterprises.includes("AQUACULTURE") && (
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">
                    🐟 How many active fish ponds or cages do you operate?
                  </label>
                  <select
                    value={scaleFish}
                    onChange={(e) => setScaleFish(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl outline-none font-semibold text-[#0F172A]"
                  >
                    <option value="1–2">1–2 earthen / liner ponds</option>
                    <option value="3–5">3–5 commercial ponds</option>
                    <option value="6–10">6–10 ponds</option>
                    <option value="10+">10+ ponds / cages</option>
                  </select>
                </div>
              )}

              {selectedEnterprises.includes("PIGGERY") && (
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">
                    🐖 Approximately how many pigs do you currently keep?
                  </label>
                  <select
                    value={scalePigs}
                    onChange={(e) => setScalePigs(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl outline-none font-semibold text-[#0F172A]"
                  >
                    <option value="1–10">1–10 breeding sows / piglets</option>
                    <option value="11–30">11–30 fatteners</option>
                    <option value="31–100">31–100 pigs</option>
                    <option value="100+">100+ commercial piggery</option>
                  </select>
                </div>
              )}

              {/* Record keeping method */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <label className="block font-bold text-[#0F172A] mb-1">
                  How do you currently keep track of your farm finances?
                </label>
                <select
                  value={recordMethod}
                  onChange={(e) => setRecordMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl outline-none font-medium"
                >
                  <option value="Notebook">Physical notebook / diary</option>
                  <option value="Excel / Spreadsheet">Excel / Google Sheets spreadsheet</option>
                  <option value="Phone notes">Phone notepad / WhatsApp notes</option>
                  <option value="Accounting software">General accounting software (QuickBooks, etc.)</option>
                  <option value="I don't currently keep records">I don't currently keep structured records</option>
                  <option value="Someone else manages">Someone else manages the records for me</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 5: PRIORITIES, DIGEST & PREFERENCES
        ========================================================================= */}
        {step === 5 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A]">What would you like to track?</h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Customize the KPIs and automated summaries delivered to your dashboard.
              </p>
            </div>

            {/* Priorities checkboxes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0F172A]">Key Priorities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold">
                {[
                  { id: "expenses", label: "Farm Expenses" },
                  { id: "sales", label: "Produce Sales" },
                  { id: "netProfit", label: "Profit & Loss" },
                  { id: "customerDebts", label: "Customer Debts (Debtors)" },
                  { id: "enterpriseMargins", label: "Enterprise Margins" },
                  { id: "weeklyReports", label: "Weekly PDF Digest" },
                  { id: "digitalReceipts", label: "Digital QR Receipts" },
                  { id: "feedCosts", label: "Feed Cost Tracking" },
                  { id: "cashFlow", label: "Cash Flow vs Credit" },
                ].map((item) => {
                  const isChecked = trackedPriorities.includes(item.id);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => togglePriority(item.id)}
                      className={`p-2.5 rounded-xl border text-left transition-colors flex items-center gap-2 ${
                        isChecked
                          ? "bg-[#D8F3DC]/40 border-[#1B4332] text-[#1B4332]"
                          : "bg-white border-[#CBD5E1] text-[#64748B] hover:border-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="rounded text-[#1B4332] focus:ring-0"
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Weekly Digest Preferences */}
            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#CBD5E1] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0F172A]">Weekly Farm Summary</span>
                  <p className="text-[11px] text-[#64748B]">Automated email report delivered every week</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportEnabled}
                    onChange={(e) => setReportEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B4332]"></div>
                </label>
              </div>

              {reportEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                      Preferred Day
                    </label>
                    <select
                      value={reportDay}
                      onChange={(e) => setReportDay(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl outline-none font-medium"
                    >
                      <option value={1}>Monday (Recommended)</option>
                      <option value={5}>Friday</option>
                      <option value={0}>Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                      Preferred Time
                    </label>
                    <select
                      value={reportTime}
                      onChange={(e) => setReportTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl outline-none font-medium"
                    >
                      <option value="07:00">07:00 AM (EAT)</option>
                      <option value="08:00">08:00 AM (EAT)</option>
                      <option value="18:00">06:00 PM (EAT)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] hover:bg-slate-50 text-xs font-bold text-[#475569] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isLoading}
              className="px-7 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D8F3DC]" />
                  <span>Setting Up Your Farm...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#D8F3DC]" />
                  <span>Finish Setting Up My Farm</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
