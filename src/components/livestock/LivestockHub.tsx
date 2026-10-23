"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  TrendingUp,
  Layers,
  PlusCircle,
  Calendar,
  Filter,
  Sparkles,
  Egg,
  Milk,
  AlertCircle,
  Activity,
  ArrowRight,
  Info,
  ShoppingCart,
  Package,
  History,
  Sliders,
  AlertTriangle,
  Warehouse,
  CheckCircle2,
  Wheat,
} from "lucide-react";
import {
  LivestockAnalyticsDTO,
  LivestockGroupDTO,
  FeedRecordDTO,
  ProductionRecordDTO,
  FeedProductDTO,
  FeedPurchaseDTO,
  FeedStockMovementDTO,
  FeedAlertDTO,
  FeedInventorySummaryDTO,
} from "@/lib/types";
import { FeedModal } from "./FeedModal";
import { ProductionModal } from "./ProductionModal";
import { GroupModal } from "./GroupModal";
import { FeedTable } from "./FeedTable";
import { ProductionTable } from "./ProductionTable";
import { GroupList } from "./GroupList";
import { LivestockCharts } from "./LivestockCharts";
import { InventoryTable } from "./InventoryTable";
import { PurchaseTable } from "./PurchaseTable";
import { StockMovementTable } from "./StockMovementTable";
import { AlertsBanner } from "./AlertsBanner";
import { PurchaseModal } from "./PurchaseModal";
import { InventoryModal } from "./InventoryModal";
import { AdjustmentModal } from "./AdjustmentModal";

interface LivestockHubProps {
  initialEnterprises: Array<{ id: string; name: string; code: string }>;
  currency?: string;
}

export function LivestockHub({
  initialEnterprises,
  currency = "KES",
}: LivestockHubProps) {
  const [enterprises, setEnterprises] = useState(initialEnterprises);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [dateRange, setDateRange] = useState("30"); // 7, 30, month, all

  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "FEED" | "PRODUCTION" | "GROUPS" | "INVENTORY"
  >("OVERVIEW");
  const [inventorySubTab, setInventorySubTab] = useState<
    "BALANCES" | "PURCHASES" | "MOVEMENTS"
  >("BALANCES");

  // Data states
  const [groups, setGroups] = useState<LivestockGroupDTO[]>([]);
  const [feedRecords, setFeedRecords] = useState<FeedRecordDTO[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecordDTO[]>([]);
  const [analytics, setAnalytics] = useState<LivestockAnalyticsDTO | null>(null);

  // Feed Inventory Data states
  const [feedProducts, setFeedProducts] = useState<FeedProductDTO[]>([]);
  const [inventorySummary, setInventorySummary] = useState<FeedInventorySummaryDTO | null>(null);
  const [alerts, setAlerts] = useState<FeedAlertDTO[]>([]);
  const [purchases, setPurchases] = useState<FeedPurchaseDTO[]>([]);
  const [movements, setMovements] = useState<FeedStockMovementDTO[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Modals state
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [editingFeedRecord, setEditingFeedRecord] = useState<FeedRecordDTO | null>(null);

  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [editingProdRecord, setEditingProdRecord] = useState<ProductionRecordDTO | null>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LivestockGroupDTO | null>(null);

  // Feed Inventory Modals state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedProductIdForPurchase, setSelectedProductIdForPurchase] = useState<string | undefined>(undefined);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FeedProductDTO | null>(null);

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedProductIdForAdjustment, setSelectedProductIdForAdjustment] = useState<string | undefined>(undefined);

  // Compute date range query params
  const getDateParams = () => {
    const now = new Date();
    if (dateRange === "7") {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `dateFrom=${d.toISOString().slice(0, 10)}&dateTo=${now.toISOString().slice(0, 10)}`;
    }
    if (dateRange === "30") {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `dateFrom=${d.toISOString().slice(0, 10)}&dateTo=${now.toISOString().slice(0, 10)}`;
    }
    if (dateRange === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return `dateFrom=${firstDay.toISOString().slice(0, 10)}&dateTo=${now.toISOString().slice(0, 10)}`;
    }
    return "";
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setErrorNotice(null);

      const dateParams = getDateParams();
      const entQuery = selectedEnterpriseId ? `&enterpriseId=${selectedEnterpriseId}` : "";
      const grpQuery = selectedGroupId ? `&livestockGroupId=${selectedGroupId}` : "";

      const [groupsRes, feedRes, prodRes, analyticsRes, invRes, purchasesRes, movementsRes] =
        await Promise.all([
          fetch(`/api/livestock/groups?${entQuery}`),
          fetch(`/api/livestock/feed?${dateParams}${entQuery}${grpQuery}&limit=100`),
          fetch(`/api/livestock/production?${dateParams}${entQuery}${grpQuery}&limit=100`),
          fetch(`/api/livestock/analytics?${dateParams}${entQuery}${grpQuery}`),
          fetch(`/api/livestock/inventory?${entQuery}`),
          fetch(`/api/livestock/purchases?${entQuery}`),
          fetch(`/api/livestock/inventory/movements?limit=100`),
        ]);

      if (groupsRes.ok) {
        const gData = await groupsRes.json();
        setGroups(gData.groups || []);
      }
      if (feedRes.ok) {
        const fData = await feedRes.json();
        setFeedRecords(fData.records || []);
      }
      if (prodRes.ok) {
        const pData = await prodRes.json();
        setProductionRecords(pData.records || []);
      }
      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setAnalytics(aData.analytics || null);
      }
      if (invRes.ok) {
        const invData = await invRes.json();
        setFeedProducts(invData.products || []);
        setInventorySummary(invData.summary || null);
        setAlerts(invData.alerts || []);
      }
      if (purchasesRes.ok) {
        const purData = await purchasesRes.json();
        setPurchases(purData.purchases || []);
      }
      if (movementsRes.ok) {
        const movData = await movementsRes.json();
        setMovements(movData.movements || []);
      }
    } catch (err: any) {
      console.error("Load livestock data error:", err);
      setErrorNotice("Failed to load livestock feed and production data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedEnterpriseId, selectedGroupId, dateRange]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch("/api/livestock/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, action: "ACKNOWLEDGE" }),
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (e) {
      console.error("Acknowledge alert error:", e);
    }
  };

  const handleDeleteFeed = async (recordId: string) => {
    try {
      const res = await fetch(`/api/livestock/feed/${recordId}`, { method: "DELETE" });
      if (res.ok) {
        loadAllData();
      }
    } catch (e) {
      console.error("Delete feed error:", e);
    }
  };

  const handleDeleteProduction = async (recordId: string) => {
    try {
      const res = await fetch(`/api/livestock/production/${recordId}`, { method: "DELETE" });
      if (res.ok) {
        loadAllData();
      }
    } catch (e) {
      console.error("Delete production error:", e);
    }
  };

  const handleArchiveGroup = async (groupId: string) => {
    try {
      const res = await fetch(`/api/livestock/groups/${groupId}`, { method: "DELETE" });
      if (res.ok) {
        loadAllData();
      }
    } catch (e) {
      console.error("Archive group error:", e);
    }
  };

  const hasRecords = feedRecords.length > 0 || productionRecords.length > 0 || groups.length > 0;
  const primarySpecies = analytics?.summary.primarySpecies?.toUpperCase() || "POULTRY";
  const indicators = analytics?.productivityIndicators;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-farm-surface p-4 sm:p-5 rounded-3xl border border-farm-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-farm-primary tracking-tight">
              Livestock Feed & Production
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-farm-mint text-farm-primary">
              Multi-Enterprise
            </span>
          </div>
          <p className="text-xs sm:text-sm text-farm-muted mt-0.5">
            Measure daily feed rations, track egg & milk harvests, and evaluate conversion efficiency.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedProductIdForPurchase(undefined);
              setIsPurchaseModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>+ Buy Feed</span>
          </button>

          <button
            onClick={() => {
              setEditingFeedRecord(null);
              setIsFeedModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>+ Record Feed</span>
          </button>

          <button
            onClick={() => {
              setEditingProdRecord(null);
              setIsProductionModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <TrendingUp className="w-3.5 h-3.5 text-farm-lime" />
            <span>+ Record Output</span>
          </button>

          <button
            onClick={() => {
              setEditingGroup(null);
              setIsGroupModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-farm-bg hover:bg-farm-mint border border-farm-border text-farm-primary rounded-xl text-xs font-bold transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ New Group</span>
          </button>
        </div>
      </div>

      {/* Quick Navigation to Distinct Workspaces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/feed"
          className="p-3.5 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 rounded-2xl flex items-center justify-between transition-colors shadow-xs group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Wheat className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">
                Animal Feed & Central Store
              </p>
              <p className="text-[11px] text-amber-700">
                Purchases, inventory balances, low-stock alerts & rations
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/production"
          className="p-3.5 bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 rounded-2xl flex items-center justify-between transition-colors shadow-xs group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-950">
                Livestock Production Tracking
              </p>
              <p className="text-[11px] text-purple-700">
                Daily harvest logs, egg/milk yields, animal batches & laying rates
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-700 group-hover:translate-x-0.5 transition-transform" />
        </Link>
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
            <span className="font-bold text-farm-slate text-[11px] uppercase">Enterprise:</span>
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
            <span className="font-bold text-farm-slate text-[11px] uppercase">Group/Batch:</span>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-2.5 py-1.5 bg-farm-bg border border-farm-border rounded-xl font-medium text-farm-charcoal text-xs focus:ring-2 focus:ring-farm-primary focus:outline-hidden"
            >
              <option value="">All Batches & Flocks</option>
              {groups
                .filter((g) => !selectedEnterpriseId || g.enterpriseId === selectedEnterpriseId)
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
              dateRange === "7" ? "bg-farm-primary text-white shadow-xs" : "text-farm-slate hover:text-farm-charcoal"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange("30")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              dateRange === "30" ? "bg-farm-primary text-white shadow-xs" : "text-farm-slate hover:text-farm-charcoal"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange("month")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              dateRange === "month" ? "bg-farm-primary text-white shadow-xs" : "text-farm-slate hover:text-farm-charcoal"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold border-b border-farm-border">
        <button
          onClick={() => setActiveTab("OVERVIEW")}
          className={`px-4 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "OVERVIEW"
              ? "border-farm-primary text-farm-primary bg-farm-surface"
              : "border-transparent text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Overview & KPIs</span>
        </button>

        <button
          onClick={() => setActiveTab("INVENTORY")}
          className={`px-4 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "INVENTORY"
              ? "border-farm-primary text-farm-primary bg-farm-surface"
              : "border-transparent text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Central Store ({feedProducts.length})</span>
          {alerts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
              {alerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("FEED")}
          className={`px-4 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "FEED"
              ? "border-farm-primary text-farm-primary bg-farm-surface"
              : "border-transparent text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Feed Ledger ({feedRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PRODUCTION")}
          className={`px-4 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "PRODUCTION"
              ? "border-farm-primary text-farm-primary bg-farm-surface"
              : "border-transparent text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Production Ledger ({productionRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("GROUPS")}
          className={`px-4 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "GROUPS"
              ? "border-farm-primary text-farm-primary bg-farm-surface"
              : "border-transparent text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Animal Groups ({groups.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & KPIS
      ========================================================================= */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Active Inventory Alerts */}
          <AlertsBanner
            alerts={alerts}
            onAcknowledge={handleAcknowledgeAlert}
            onOpenPurchase={(pId) => {
              setSelectedProductIdForPurchase(pId);
              setIsPurchaseModalOpen(true);
            }}
          />

          {/* Central Feed Inventory Quick Snapshot Bar */}
          {feedProducts.length > 0 && (
            <div className="bg-farm-surface border border-farm-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-farm-charcoal uppercase tracking-wider">
                      Central Feed Store Status
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {feedProducts.length} Products Tracked
                    </span>
                  </div>
                  <p className="text-xs text-farm-muted mt-0.5">
                    Available Stock:{" "}
                    <strong className="text-farm-charcoal font-bold">
                      {(inventorySummary?.totalAvailableStockKg || 0).toLocaleString()} kg
                    </strong>{" "}
                    · Valuation:{" "}
                    <strong className="text-farm-primary font-bold">
                      {currency} {(inventorySummary?.totalStockValueKes || 0).toLocaleString()}
                    </strong>
                    {alerts.length > 0 && (
                      <span className="text-rose-600 font-bold ml-2">
                        · {alerts.length} item(s) below reserve
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedProductIdForPurchase(undefined);
                    setIsPurchaseModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Buy Feed</span>
                </button>
                <button
                  onClick={() => setActiveTab("INVENTORY")}
                  className="px-3 py-1.5 bg-farm-bg hover:bg-farm-mint border border-farm-border text-farm-primary rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <span>Open Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Feed Issued */}
            <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
                  Total Feed Issued
                </span>
                <p className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
                  {(analytics?.summary.totalFeedIssuedKg || 0).toLocaleString()} kg
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {analytics?.summary.totalFeedCost
                    ? `${currency} ${analytics.summary.totalFeedCost.toLocaleString()} spent`
                    : "Rations logged"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100 text-amber-800">
                <Scale className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Feed Consumed */}
            <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
                  Actual Feed Consumed
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
                  {analytics?.summary.hasKnownConsumption
                    ? `${(analytics?.summary.totalFeedConsumedKg || 0).toLocaleString()} kg`
                    : "Not Measured"}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {analytics?.summary.hasKnownConsumption
                    ? "Based on measured feed intake"
                    : "Weigh leftovers to track exact intake"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Total Output Yield */}
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
                  Daily avg: {(analytics?.productionSummary.averagePerDay || 0).toLocaleString()} {analytics?.productionSummary.unit}/day
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 text-purple-800">
                {primarySpecies === "POULTRY" ? (
                  <Egg className="w-6 h-6" />
                ) : primarySpecies === "CATTLE" || primarySpecies === "DAIRY_CATTLE" ? (
                  <Milk className="w-6 h-6" />
                ) : (
                  <TrendingUp className="w-6 h-6" />
                )}
              </div>
            </div>

            {/* Card 4: Contextual Productivity KPI */}
            <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
                  {primarySpecies === "POULTRY"
                    ? "Egg Laying Rate"
                    : primarySpecies === "CATTLE" || primarySpecies === "DAIRY_CATTLE"
                    ? "Avg Yield per Cow"
                    : "Feed Conversion (FCR)"}
                </span>

                <p className="text-xl sm:text-2xl font-black text-farm-primary mt-1">
                  {primarySpecies === "POULTRY" && indicators?.eggProductionRatePercent !== null && indicators?.eggProductionRatePercent !== undefined
                    ? `${indicators.eggProductionRatePercent}%`
                    : primarySpecies.includes("CATTLE") && indicators?.avgMilkYieldPerCowLitres !== null && indicators?.avgMilkYieldPerCowLitres !== undefined
                    ? `${indicators.avgMilkYieldPerCowLitres} L/cow`
                    : indicators?.feedConversionRatio !== null && indicators?.feedConversionRatio !== undefined
                    ? `${indicators.feedConversionRatio} : 1`
                    : "—"}
                </p>

                <p className="text-[11px] text-farm-slate mt-0.5">
                  {primarySpecies === "POULTRY"
                    ? indicators?.feedPerEggGrams
                      ? `${indicators.feedPerEggGrams}g feed/egg ${indicators.isFeedPerEggEstimated ? "(est.)" : ""}`
                      : "Flock laying percentage"
                    : primarySpecies.includes("CATTLE")
                    ? indicators?.feedPerLitreKg
                      ? `${indicators.feedPerLitreKg} kg feed/litre`
                      : "Litres per milking cow"
                    : indicators?.averageDailyGainKg
                    ? `${indicators.averageDailyGainKg} kg/day gain`
                    : "Feed to weight conversion"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-farm-mint text-farm-primary">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Educational Productivity Callout Banner */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-emerald-950">
                Understanding Your Livestock Conversion Metrics
              </p>
              <p className="text-emerald-800 leading-relaxed">
                {primarySpecies === "POULTRY"
                  ? "Standard Kenyan commercial layers consume roughly 120g–140g feed per egg laid. A laying rate above 75% indicates optimal flock performance."
                  : primarySpecies.includes("CATTLE")
                  ? "A commercial dairy cow typically consumes 0.4kg–0.6kg dairy meal per litre of milk produced above baseline roughage."
                  : "Feed Conversion Ratio (FCR) measures kilograms of feed required to produce one kilogram of weight gain. Lower ratios indicate higher profitability."}
              </p>
            </div>
          </div>

          {/* Charts Component */}
          <LivestockCharts
            feedData={analytics?.feedTimeSeries || []}
            productionData={analytics?.productionTimeSeries || []}
            conversionData={analytics?.conversionTimeSeries || []}
            primaryUnit={analytics?.productionSummary.unit}
            species={primarySpecies}
          />

          {/* Recent Feed & Production previews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FeedTable
              records={feedRecords.slice(0, 5)}
              onEdit={(r) => {
                setEditingFeedRecord(r);
                setIsFeedModalOpen(true);
              }}
              onDelete={handleDeleteFeed}
              currency={currency}
              onRecordFeed={() => setIsFeedModalOpen(true)}
            />

            <ProductionTable
              records={productionRecords.slice(0, 5)}
              onEdit={(r) => {
                setEditingProdRecord(r);
                setIsProductionModalOpen(true);
              }}
              onDelete={handleDeleteProduction}
              onRecordProduction={() => setIsProductionModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: FEED LEDGER
      ========================================================================= */}
      {activeTab === "FEED" && (
        <FeedTable
          records={feedRecords}
          onEdit={(r) => {
            setEditingFeedRecord(r);
            setIsFeedModalOpen(true);
          }}
          onDelete={handleDeleteFeed}
          currency={currency}
          onRecordFeed={() => setIsFeedModalOpen(true)}
        />
      )}

      {/* =========================================================================
          TAB 3: PRODUCTION LEDGER
      ========================================================================= */}
      {activeTab === "PRODUCTION" && (
        <ProductionTable
          records={productionRecords}
          onEdit={(r) => {
            setEditingProdRecord(r);
            setIsProductionModalOpen(true);
          }}
          onDelete={handleDeleteProduction}
          onRecordProduction={() => setIsProductionModalOpen(true)}
        />
      )}

      {/* =========================================================================
          TAB 4: ANIMAL GROUPS & BATCHES
      ========================================================================= */}
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

      {/* =========================================================================
          TAB 5: CENTRAL FEED STORE (INVENTORY)
      ========================================================================= */}
      {activeTab === "INVENTORY" && (
        <div className="space-y-6">
          {/* Active Inventory Alerts */}
          <AlertsBanner
            alerts={alerts}
            onAcknowledge={handleAcknowledgeAlert}
            onOpenPurchase={(pId) => {
              setSelectedProductIdForPurchase(pId);
              setIsPurchaseModalOpen(true);
            }}
          />

          {/* Feed Inventory Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Stock on Hand */}
            <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
                  Total Stock on Hand
                </span>
                <p className="text-xl sm:text-2xl font-black text-farm-charcoal mt-1">
                  {(inventorySummary?.totalAvailableStockKg || 0).toLocaleString()} kg
                </p>
                <p className="text-[11px] text-farm-slate mt-0.5">
                  Across {inventorySummary?.totalProductsTracked || feedProducts.length} feed products
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100 text-blue-800">
                <Warehouse className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Total Store Value */}
            <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
                  Store Inventory Value
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
                  {currency} {(inventorySummary?.totalStockValueKes || 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Based on weighted purchase costs
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800">
                <Package className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Reserve & Reorder Health */}
            <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
                  Reserve Stock Status
                </span>
                <p className="text-xl sm:text-2xl font-black text-farm-charcoal mt-1">
                  {alerts.length === 0 ? (
                    <span className="text-emerald-700 font-extrabold text-base sm:text-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      All Reserves Healthy
                    </span>
                  ) : (
                    <span className="text-rose-600 font-extrabold text-base sm:text-lg flex items-center gap-1.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      {alerts.length} Action Needed
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-farm-slate mt-0.5">
                  {alerts.filter((a) => a.severity === "CRITICAL").length} critical ·{" "}
                  {alerts.filter((a) => a.severity === "WARNING").length} low stock
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  alerts.length > 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Total Purchases Recorded */}
            <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
                  Recorded Inflows
                </span>
                <p className="text-xl sm:text-2xl font-black text-blue-950 mt-1">
                  {purchases.length} Purchases
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  {currency}{" "}
                  {purchases
                    .filter((p) => p.status !== "CANCELLED")
                    .reduce((acc, p) => acc + (p.totalCost || 0), 0)
                    .toLocaleString()}{" "}
                  total spend
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 text-purple-800">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Subtabs and Inventory Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-farm-border pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInventorySubTab("BALANCES")}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  inventorySubTab === "BALANCES"
                    ? "bg-farm-primary text-white shadow-xs"
                    : "bg-farm-bg text-farm-slate hover:text-farm-charcoal border border-farm-border"
                }`}
              >
                Stock Balances ({feedProducts.length})
              </button>
              <button
                onClick={() => setInventorySubTab("PURCHASES")}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  inventorySubTab === "PURCHASES"
                    ? "bg-farm-primary text-white shadow-xs"
                    : "bg-farm-bg text-farm-slate hover:text-farm-charcoal border border-farm-border"
                }`}
              >
                Purchase Inflows ({purchases.length})
              </button>
              <button
                onClick={() => setInventorySubTab("MOVEMENTS")}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  inventorySubTab === "MOVEMENTS"
                    ? "bg-farm-primary text-white shadow-xs"
                    : "bg-farm-bg text-farm-slate hover:text-farm-charcoal border border-farm-border"
                }`}
              >
                Audit Movements ({movements.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedProductIdForPurchase(undefined);
                  setIsPurchaseModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>+ Buy Feed</span>
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsInventoryModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-farm-bg hover:bg-farm-mint border border-farm-border text-farm-primary rounded-xl text-xs font-bold transition-colors"
              >
                <Package className="w-3.5 h-3.5" />
                <span>+ New Product</span>
              </button>
              <button
                onClick={() => {
                  setSelectedProductIdForAdjustment(undefined);
                  setIsAdjustmentModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-farm-bg hover:bg-gray-100 dark:hover:bg-gray-800 border border-farm-border text-farm-slate rounded-xl text-xs font-bold transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjustment</span>
              </button>
            </div>
          </div>

          {/* Subtab Views */}
          {inventorySubTab === "BALANCES" && (
            <InventoryTable
              products={feedProducts}
              currency={currency}
              onOpenPurchase={(pId) => {
                setSelectedProductIdForPurchase(pId);
                setIsPurchaseModalOpen(true);
              }}
              onOpenAdjustment={(pId) => {
                setSelectedProductIdForAdjustment(pId);
                setIsAdjustmentModalOpen(true);
              }}
              onOpenEditSettings={(prod) => {
                setEditingProduct(prod);
                setIsInventoryModalOpen(true);
              }}
              onOpenIssueFeed={(pId) => {
                setEditingFeedRecord(null);
                setIsFeedModalOpen(true);
              }}
            />
          )}

          {inventorySubTab === "PURCHASES" && (
            <PurchaseTable
              purchases={purchases}
              currency={currency}
              onRefresh={loadAllData}
            />
          )}

          {inventorySubTab === "MOVEMENTS" && (
            <StockMovementTable
              movements={movements}
              currency={currency}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <FeedModal
        isOpen={isFeedModalOpen}
        onClose={() => setIsFeedModalOpen(false)}
        onSuccess={loadAllData}
        enterprises={enterprises}
        groups={groups}
        initialRecord={editingFeedRecord}
      />

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

      {/* Feed Inventory Modals */}
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setSelectedProductIdForPurchase(undefined);
        }}
        onSuccess={loadAllData}
        feedProducts={feedProducts}
        enterprises={enterprises}
        initialProductId={selectedProductIdForPurchase}
      />

      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => {
          setIsInventoryModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={loadAllData}
        enterprises={enterprises}
        initialProduct={editingProduct}
      />

      <AdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setSelectedProductIdForAdjustment(undefined);
        }}
        onSuccess={loadAllData}
        feedProducts={feedProducts}
        initialProductId={selectedProductIdForAdjustment}
      />
    </div>
  );
}
