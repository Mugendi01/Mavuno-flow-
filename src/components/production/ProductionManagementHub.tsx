"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Layers,
  Sparkles,
  Egg,
  Milk,
  AlertCircle,
  Activity,
  PlusCircle,
  Calendar,
  Filter,
  Info,
  CheckCircle2,
  Scale,
  Award,
} from "lucide-react";
import {
  LivestockAnalyticsDTO,
  LivestockGroupDTO,
  ProductionRecordDTO,
} from "@/lib/types";
import { ProductionModal } from "../livestock/ProductionModal";
import { GroupModal } from "../livestock/GroupModal";
import { ProductionTable } from "../livestock/ProductionTable";
import { GroupList } from "../livestock/GroupList";
import { LivestockCharts } from "../livestock/LivestockCharts";

interface ProductionManagementHubProps {
  initialEnterprises: Array<{ id: string; name: string; code: string }>;
  currency?: string;
}

export function ProductionManagementHub({
  initialEnterprises,
  currency = "KES",
}: ProductionManagementHubProps) {
  const [enterprises, setEnterprises] = useState(initialEnterprises);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [dateRange, setDateRange] = useState("30"); // 7, 30, month, all

  const [activeTab, setActiveTab] = useState<
    "HARVEST" | "GROUPS" | "INSIGHTS"
  >("HARVEST");

  // Data states
  const [groups, setGroups] = useState<LivestockGroupDTO[]>([]);
  const [productionRecords, setProductionRecords] = useState<
    ProductionRecordDTO[]
  >([]);
  const [analytics, setAnalytics] = useState<LivestockAnalyticsDTO | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Modals state
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [editingProdRecord, setEditingProdRecord] =
    useState<ProductionRecordDTO | null>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LivestockGroupDTO | null>(
    null
  );

  const getDateParams = () => {
    const now = new Date();
    if (dateRange === "7") {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `dateFrom=${d.toISOString().slice(0, 10)}&dateTo=${now
        .toISOString()
        .slice(0, 10)}`;
    }
    if (dateRange === "30") {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `dateFrom=${d.toISOString().slice(0, 10)}&dateTo=${now
        .toISOString()
        .slice(0, 10)}`;
    }
    if (dateRange === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return `dateFrom=${firstDay
        .toISOString()
        .slice(0, 10)}&dateTo=${now.toISOString().slice(0, 10)}`;
    }
    return "";
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setErrorNotice(null);

      const dateParams = getDateParams();
      const entQuery = selectedEnterpriseId
        ? `&enterpriseId=${selectedEnterpriseId}`
        : "";
      const grpQuery = selectedGroupId
        ? `&livestockGroupId=${selectedGroupId}`
        : "";

      const [groupsRes, prodRes, analyticsRes] = await Promise.all([
        fetch(`/api/livestock/groups?${entQuery}`),
        fetch(
          `/api/livestock/production?${dateParams}${entQuery}${grpQuery}&limit=100`
        ),
        fetch(`/api/livestock/analytics?${dateParams}${entQuery}${grpQuery}`),
      ]);

      if (groupsRes.ok) {
        const gData = await groupsRes.json();
        setGroups(gData.groups || []);
      }
      if (prodRes.ok) {
        const pData = await prodRes.json();
        setProductionRecords(pData.records || []);
      }
      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setAnalytics(aData.analytics || null);
      }
    } catch (err: any) {
      console.error("Load production data error:", err);
      setErrorNotice("Failed to load production and livestock harvest data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedEnterpriseId, selectedGroupId, dateRange]);

  const handleDeleteProduction = async (recordId: string) => {
    try {
      const res = await fetch(`/api/livestock/production/${recordId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (e) {
      console.error("Delete production error:", e);
    }
  };

  const handleArchiveGroup = async (groupId: string) => {
    try {
      const res = await fetch(`/api/livestock/groups/${groupId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (e) {
      console.error("Archive group error:", e);
    }
  };

  const primarySpecies =
    analytics?.summary.primarySpecies?.toUpperCase() || "POULTRY";
  const indicators = analytics?.productivityIndicators;

  // Quality calculation: Grade A vs Rejects
  const totalProduced = productionRecords.reduce(
    (acc, r) => acc + (r.quantity || 0),
    0
  );
  const totalRejects = productionRecords.reduce(
    (acc, r) => acc + (r.secondaryQuantity || 0),
    0
  );
  const gradeARate =
    totalProduced > 0
      ? Math.round(((totalProduced - totalRejects) / totalProduced) * 100)
      : 100;

  const totalAnimals = groups
    .filter((g) => g.status === "ACTIVE")
    .reduce((acc, g) => acc + (g.currentCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-farm-surface p-4 sm:p-5 rounded-3xl border border-farm-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-700" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-farm-primary tracking-tight">
              Livestock Production Tracking
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
              Harvests & Yields
            </span>
          </div>
          <p className="text-xs sm:text-sm text-farm-muted mt-1">
            Record daily egg collections, milk harvests, weight gains, and track flock & herd productivity over time.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => {
              setEditingProdRecord(null);
              setIsProductionModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <TrendingUp className="w-3.5 h-3.5 text-farm-lime" />
            <span>+ Record Harvest</span>
          </button>

          <button
            onClick={() => {
              setEditingGroup(null);
              setIsGroupModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-farm-bg hover:bg-farm-mint border border-farm-border text-farm-primary rounded-xl text-xs font-bold transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ New Animal Batch</span>
          </button>
        </div>
      </div>

      {errorNotice && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-farm-surface border border-farm-border rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Enterprise Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-farm-slate text-[11px] uppercase">
              Enterprise:
            </span>
            <select
              value={selectedEnterpriseId}
              onChange={(e) => {
                setSelectedEnterpriseId(e.target.value);
                setSelectedGroupId("");
              }}
              className="px-2.5 py-1.5 bg-farm-bg border border-farm-border rounded-xl font-bold text-farm-charcoal text-xs focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
            >
              <option value="">All Livestock Enterprises</option>
              {enterprises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-farm-slate text-[11px] uppercase">
              Group/Batch:
            </span>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-2.5 py-1.5 bg-farm-bg border border-farm-border rounded-xl font-medium text-farm-charcoal text-xs focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
            >
              <option value="">All Batches & Flocks</option>
              {groups
                .filter(
                  (g) =>
                    !selectedEnterpriseId ||
                    g.enterpriseId === selectedEnterpriseId
                )
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1 bg-farm-bg p-1 rounded-xl border border-farm-border text-xs font-semibold">
          <button
            onClick={() => setDateRange("7")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              dateRange === "7"
                ? "bg-farm-primary text-white shadow-xs"
                : "text-farm-slate hover:text-farm-charcoal"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange("30")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              dateRange === "30"
                ? "bg-farm-primary text-white shadow-xs"
                : "text-farm-slate hover:text-farm-charcoal"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange("month")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              dateRange === "month"
                ? "bg-farm-primary text-white shadow-xs"
                : "text-farm-slate hover:text-farm-charcoal"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Output Yield */}
        <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
              Total Production Output
            </span>
            <p className="text-xl sm:text-2xl font-black text-farm-charcoal mt-1">
              {(analytics?.productionSummary.totalQuantity || 0).toLocaleString()}{" "}
              <span className="text-sm font-semibold text-farm-slate">
                {analytics?.productionSummary.unit || "units"}
              </span>
            </p>
            <p className="text-[11px] text-farm-muted mt-0.5">
              Daily avg:{" "}
              {(
                analytics?.productionSummary.averagePerDay || 0
              ).toLocaleString()}{" "}
              {analytics?.productionSummary.unit}/day
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-100 text-purple-800">
            {primarySpecies === "POULTRY" ? (
              <Egg className="w-6 h-6" />
            ) : primarySpecies === "CATTLE" ||
              primarySpecies === "DAIRY_CATTLE" ? (
              <Milk className="w-6 h-6" />
            ) : (
              <TrendingUp className="w-6 h-6" />
            )}
          </div>
        </div>

        {/* Card 2: Contextual Productivity KPI */}
        <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
              {primarySpecies === "POULTRY"
                ? "Egg Laying Rate"
                : primarySpecies === "CATTLE" ||
                  primarySpecies === "DAIRY_CATTLE"
                ? "Avg Milk per Cow"
                : "Flock Performance"}
            </span>

            <p className="text-xl sm:text-2xl font-black text-farm-primary mt-1">
              {primarySpecies === "POULTRY" &&
              indicators?.eggProductionRatePercent !== null &&
              indicators?.eggProductionRatePercent !== undefined
                ? `${indicators.eggProductionRatePercent}%`
                : primarySpecies.includes("CATTLE") &&
                  indicators?.avgMilkYieldPerCowLitres !== null &&
                  indicators?.avgMilkYieldPerCowLitres !== undefined
                ? `${indicators.avgMilkYieldPerCowLitres} L/cow`
                : "—"}
            </p>

            <p className="text-[11px] text-farm-slate mt-0.5">
              {primarySpecies === "POULTRY"
                ? "Flock laying percentage"
                : primarySpecies.includes("CATTLE")
                ? "Litres per milking cow"
                : "Monitored yield"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-farm-mint text-farm-primary">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Active Animals Tracked */}
        <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
              Active Animals
            </span>
            <p className="text-xl sm:text-2xl font-black text-blue-950 mt-1">
              {totalAnimals.toLocaleString()} Heads / Birds
            </p>
            <p className="text-[11px] text-blue-700 mt-0.5">
              Across {groups.filter((g) => g.status === "ACTIVE").length} active
              batches
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-100 text-blue-800">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Commercial Quality Rate */}
        <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
              Commercial Grade Rate
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
              {gradeARate}% Grade A
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              {totalRejects > 0
                ? `${totalRejects.toLocaleString()} damaged / rejects logged`
                : "Zero damaged harvests recorded"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold border-b border-farm-border">
        <button
          onClick={() => setActiveTab("HARVEST")}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "HARVEST"
              ? "border-farm-primary text-farm-primary bg-farm-surface font-extrabold"
              : "border-transparent text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Production Harvest Ledger ({productionRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("GROUPS")}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "GROUPS"
              ? "border-farm-primary text-farm-primary bg-farm-surface font-extrabold"
              : "border-transparent text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Animal Batches & Flocks ({groups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("INSIGHTS")}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "INSIGHTS"
              ? "border-farm-primary text-farm-primary bg-farm-surface font-extrabold"
              : "border-transparent text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Harvest Trends & Yield Insights</span>
        </button>
      </div>

      {/* Tab 1: Harvest Ledger */}
      {activeTab === "HARVEST" && (
        <ProductionTable
          records={productionRecords}
          onEdit={(r) => {
            setEditingProdRecord(r);
            setIsProductionModalOpen(true);
          }}
          onDelete={handleDeleteProduction}
          onRecordProduction={() => {
            setEditingProdRecord(null);
            setIsProductionModalOpen(true);
          }}
        />
      )}

      {/* Tab 2: Animal Batches */}
      {activeTab === "GROUPS" && (
        <GroupList
          groups={groups}
          onNewGroup={() => {
            setEditingGroup(null);
            setIsGroupModalOpen(true);
          }}
          onEditGroup={(g) => {
            setEditingGroup(g);
            setIsGroupModalOpen(true);
          }}
          onArchiveGroup={handleArchiveGroup}
        />
      )}

      {/* Tab 3: Harvest Insights & Charts */}
      {activeTab === "INSIGHTS" && (
        <div className="space-y-6">
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-800 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-purple-950">
                Evaluating Livestock Harvest Performance
              </p>
              <p className="text-purple-800 leading-relaxed">
                {primarySpecies === "POULTRY"
                  ? "Standard commercial layers achieve peak laying of 85%–92% around week 28–32. Consistent daily egg collection tracking detects early signs of stress, water shortage, or feed issues."
                  : primarySpecies.includes("CATTLE")
                  ? "Daily morning and evening milk logs track lactation curves. Any sudden dip in yield indicates mastitis, heat stress, or feed ration imbalances."
                  : "Continuous measurement of livestock harvests guarantees clear operational visibility and high market value."}
              </p>
            </div>
          </div>

          <LivestockCharts
            feedData={analytics?.feedTimeSeries || []}
            productionData={analytics?.productionTimeSeries || []}
            conversionData={analytics?.conversionTimeSeries || []}
            primaryUnit={analytics?.productionSummary.unit}
            species={primarySpecies}
          />
        </div>
      )}

      {/* Modals */}
      <ProductionModal
        isOpen={isProductionModalOpen}
        onClose={() => setIsProductionModalOpen(false)}
        onSuccess={loadAllData}
        enterprises={enterprises}
        groups={groups}
        initialRecord={editingProdRecord}
      />

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSuccess={loadAllData}
        enterprises={enterprises}
        initialGroup={editingGroup}
      />
    </div>
  );
}
