"use client";

import React, { useState, useEffect } from "react";
import {
  Wheat,
  Scale,
  ShoppingCart,
  Package,
  Sliders,
  AlertCircle,
  Warehouse,
  History,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  FeedProductDTO,
  FeedPurchaseDTO,
  FeedStockMovementDTO,
  FeedAlertDTO,
  FeedInventorySummaryDTO,
  FeedRecordDTO,
  LivestockGroupDTO,
} from "@/lib/types";
import { InventoryTable } from "../livestock/InventoryTable";
import { PurchaseTable } from "../livestock/PurchaseTable";
import { StockMovementTable } from "../livestock/StockMovementTable";
import { FeedTable } from "../livestock/FeedTable";
import { AlertsBanner } from "../livestock/AlertsBanner";
import { PurchaseModal } from "../livestock/PurchaseModal";
import { InventoryModal } from "../livestock/InventoryModal";
import { AdjustmentModal } from "../livestock/AdjustmentModal";
import { FeedModal } from "../livestock/FeedModal";

interface FeedManagementHubProps {
  initialEnterprises: Array<{ id: string; name: string; code: string }>;
  currency?: string;
}

export function FeedManagementHub({
  initialEnterprises,
  currency = "KES",
}: FeedManagementHubProps) {
  const [enterprises, setEnterprises] = useState(initialEnterprises);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [dateRange, setDateRange] = useState("30"); // 7, 30, month, all

  const [activeTab, setActiveTab] = useState<
    "BALANCES" | "ISSUES" | "PURCHASES" | "MOVEMENTS"
  >("BALANCES");

  // Data states
  const [groups, setGroups] = useState<LivestockGroupDTO[]>([]);
  const [feedRecords, setFeedRecords] = useState<FeedRecordDTO[]>([]);
  const [feedProducts, setFeedProducts] = useState<FeedProductDTO[]>([]);
  const [inventorySummary, setInventorySummary] =
    useState<FeedInventorySummaryDTO | null>(null);
  const [alerts, setAlerts] = useState<FeedAlertDTO[]>([]);
  const [purchases, setPurchases] = useState<FeedPurchaseDTO[]>([]);
  const [movements, setMovements] = useState<FeedStockMovementDTO[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Modals state
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [editingFeedRecord, setEditingFeedRecord] =
    useState<FeedRecordDTO | null>(null);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedProductIdForPurchase, setSelectedProductIdForPurchase] =
    useState<string | undefined>(undefined);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FeedProductDTO | null>(
    null
  );

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [
    selectedProductIdForAdjustment,
    setSelectedProductIdForAdjustment,
  ] = useState<string | undefined>(undefined);

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

      const [groupsRes, feedRes, invRes, purchasesRes, movementsRes] =
        await Promise.all([
          fetch(`/api/livestock/groups?${entQuery}`),
          fetch(
            `/api/livestock/feed?${dateParams}${entQuery}${grpQuery}&limit=100`
          ),
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
      console.error("Load feed data error:", err);
      setErrorNotice("Failed to load feed and inventory data.");
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
      const res = await fetch(`/api/livestock/feed/${recordId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (e) {
      console.error("Delete feed error:", e);
    }
  };

  const totalFeedIssuedKg = feedRecords.reduce(
    (acc, r) => acc + (r.quantityIssuedKg || 0),
    0
  );
  const totalFeedCost = feedRecords.reduce(
    (acc, r) => acc + (r.feedCost || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-farm-surface p-4 sm:p-5 rounded-3xl border border-farm-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Wheat className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-farm-primary tracking-tight">
              Animal Feed & Central Store
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              Inventory & Rations
            </span>
          </div>
          <p className="text-xs sm:text-sm text-farm-muted mt-1">
            Manage central stock balances, supplier purchases, daily rations issued to animals, and low-reserve alerts.
          </p>
        </div>

        {/* Quick Action Buttons */}
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
            <span>+ Issue Feed</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsInventoryModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-farm-bg hover:bg-farm-mint border border-farm-border text-farm-primary rounded-xl text-xs font-bold transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            <span>+ New Product</span>
          </button>

          <button
            onClick={() => {
              setSelectedProductIdForAdjustment(undefined);
              setIsAdjustmentModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-farm-bg hover:bg-gray-100 dark:hover:bg-gray-800 border border-farm-border text-farm-slate rounded-xl text-xs font-bold transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Stock Adjustment</span>
          </button>
        </div>
      </div>

      {errorNotice && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Active Inventory Alerts */}
      <AlertsBanner
        alerts={alerts}
        onAcknowledge={handleAcknowledgeAlert}
        onOpenPurchase={(pId) => {
          setSelectedProductIdForPurchase(pId);
          setIsPurchaseModalOpen(true);
        }}
      />

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
              Across {inventorySummary?.totalProductsTracked || feedProducts.length}{" "}
              feed products
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-100 text-blue-800">
            <Warehouse className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Store Inventory Value */}
        <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
              Store Valuation
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
              {currency}{" "}
              {(inventorySummary?.totalStockValueKes || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Weighted purchase cost value
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Feed Issued */}
        <div className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-farm-muted uppercase tracking-wider">
              Feed Issued (Period)
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
              {totalFeedIssuedKg.toLocaleString()} kg
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {totalFeedCost
                ? `${currency} ${totalFeedCost.toLocaleString()} spent`
                : `${feedRecords.length} rations logged`}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-100 text-amber-800">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Reserve Health */}
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
                  {alerts.length} Needs Attention
                </span>
              )}
            </p>
            <p className="text-[11px] text-farm-slate mt-0.5">
              {alerts.filter((a) => a.severity === "CRITICAL").length} critical ·{" "}
              {alerts.filter((a) => a.severity === "WARNING").length} low reserve
            </p>
          </div>
          <div
            className={`p-3 rounded-xl ${
              alerts.length > 0
                ? "bg-rose-100 text-rose-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold border-b border-farm-border">
        <button
          onClick={() => setActiveTab("BALANCES")}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "BALANCES"
              ? "border-farm-primary text-farm-primary bg-farm-surface font-extrabold"
              : "border-transparent text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Store Balances & Reserves ({feedProducts.length})</span>
          {alerts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
              {alerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ISSUES")}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "ISSUES"
              ? "border-farm-primary text-farm-primary bg-farm-surface font-extrabold"
              : "border-transparent text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Feed Issuing & Consumption ({feedRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PURCHASES")}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "PURCHASES"
              ? "border-farm-primary text-farm-primary bg-farm-surface font-extrabold"
              : "border-transparent text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Purchase Inflows ({purchases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("MOVEMENTS")}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "MOVEMENTS"
              ? "border-farm-primary text-farm-primary bg-farm-surface font-extrabold"
              : "border-transparent text-farm-slate hover:text-farm-charcoal"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Movement Audit ({movements.length})</span>
        </button>
      </div>

      {/* Tab 1: Store Balances */}
      {activeTab === "BALANCES" && (
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

      {/* Tab 2: Feed Issuing Ledger */}
      {activeTab === "ISSUES" && (
        <FeedTable
          records={feedRecords}
          onEdit={(r) => {
            setEditingFeedRecord(r);
            setIsFeedModalOpen(true);
          }}
          onDelete={handleDeleteFeed}
          currency={currency}
          onRecordFeed={() => {
            setEditingFeedRecord(null);
            setIsFeedModalOpen(true);
          }}
        />
      )}

      {/* Tab 3: Purchase Inflows */}
      {activeTab === "PURCHASES" && (
        <PurchaseTable
          purchases={purchases}
          currency={currency}
          onRefresh={loadAllData}
        />
      )}

      {/* Tab 4: Stock Movements */}
      {activeTab === "MOVEMENTS" && (
        <StockMovementTable movements={movements} currency={currency} />
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
