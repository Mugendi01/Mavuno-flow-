export type Role = "OWNER" | "MANAGER" | "FARM_HAND";

export type TransactionType = "EXPENSE" | "SALE";

export type PaymentMethod = "CASH" | "MPESA" | "BANK" | "CREDIT" | "OTHER";

export type PaymentStatus = "PAID" | "PARTIALLY_PAID" | "CREDIT";

export type ReceivableStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";

export type EnterpriseStatusCode = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  farmId: string;
  farmName: string;
  currency: string;
}

export interface EnterpriseDTO {
  id: string;
  farmId: string;
  name: string;
  enterpriseTypeCode: string;
  status: EnterpriseStatusCode;
  icon?: string;
}

export interface CategoryDTO {
  id: string;
  farmId?: string | null;
  name: string;
  type: TransactionType;
  isSystem: boolean;
  enterpriseTypeCode?: string;
}

export interface TransactionCreateInput {
  localId?: string;
  farmId: string;
  enterpriseId: string;
  categoryId: string;
  createdById: string;
  type: TransactionType;
  transactionDate: string; // ISO date string
  amount: number;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  salesChannel?: string;
  buyerName?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface TransactionDTO {
  id: string;
  localId: string;
  farmId: string;
  enterpriseId: string;
  enterpriseName?: string;
  enterpriseIcon?: string;
  categoryId: string;
  categoryName?: string;
  createdById: string;
  createdByName?: string;
  type: TransactionType;
  transactionDate: string;
  amount: number;
  quantity?: number | null;
  unit?: string | null;
  unitPrice?: number | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  salesChannel?: string | null;
  buyerName?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  isDeleted: boolean;
  receivableId?: string | null;
  receivableStatus?: ReceivableStatus | null;
  receivableBalance?: number | null;
  receiptId?: string | null;
  receiptNumber?: string | null;
  receiptStatus?: "VALID" | "VOIDED" | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReceivableDTO {
  id: string;
  farmId: string;
  transactionId: string;
  customerName: string;
  customerPhone?: string | null;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate?: string | null;
  status: ReceivableStatus;
  createdAt: string;
  transaction?: {
    transactionDate: string;
    enterpriseName?: string;
    notes?: string | null;
  };
  payments?: PaymentDTO[];
}

export interface PaymentDTO {
  id: string;
  receivableId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceCode?: string | null;
  recordedById: string;
  notes?: string | null;
  createdAt: string;
}

export interface EnterprisePerformanceMetric {
  enterpriseId: string;
  enterpriseName: string;
  enterpriseCode: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  marginPercent: number;
  topCostDriver?: string;
  costBreakdown: { category: string; amount: number; percentage: number }[];
  costPerUnit?: { metricName: string; value: number; unit: string; isEstimated: boolean };
}

export interface FinancialSummaryKPI {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashReceived: number;
  cashSpent: number;
  outstandingReceivables: number;
  overdueReceivables: number;
  dateRange: { start: string; end: string };
  comparison?: {
    prevRevenue: number;
    prevExpenses: number;
    prevNetProfit: number;
    revenueChangePercent: number;
    expensesChangePercent: number;
    netProfitChangePercent: number;
  };
}

export interface WeeklyFarmDigestData {
  farm: {
    id: string;
    name: string;
    locationCounty: string;
    currency: string;
  };
  period: {
    startDate: string;
    endDate: string;
    weekNumber: number;
    year: number;
  };
  kpi: FinancialSummaryKPI;
  enterprises: EnterprisePerformanceMetric[];
  topExpenses: { category: string; amount: number; percentage: number }[];
  outstandingDebtors: { customerName: string; balance: number; dueDate?: string }[];
  activitySummary: {
    salesCount: number;
    expenseCount: number;
    largestSale: { enterprise: string; amount: number; buyer?: string } | null;
    largestExpense: { category: string; amount: number; notes?: string } | null;
  };
  keyInsights: string[];
}

export interface OfflineSyncItem {
  localId: string;
  farmId: string;
  payload: TransactionCreateInput;
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  retryCount: number;
  lastError?: string;
  createdAt: number;
}

export interface ReceiptDTO {
  id: string;
  transactionId: string;
  farmId: string;
  farmName?: string;
  locationCounty?: string;
  currency?: string;
  receiptNumber: string;
  verificationToken: string;
  qrPayload: string;
  qrCodeDataURL?: string;
  status: "VALID" | "VOIDED";
  issuedAt: string;
  voidedAt?: string | null;
  version: number;
  transaction?: TransactionDTO;
}

export interface PublicReceiptVerificationDTO {
  isValid: boolean;
  status: "VALID" | "VOIDED" | "NOT_FOUND";
  receiptNumber: string;
  verificationMessage: string;
  farmName?: string;
  locationCounty?: string;
  transactionType?: TransactionType;
  enterpriseName?: string;
  categoryName?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  issuedAt?: string;
  voidedAt?: string | null;
  quantity?: number | null;
  unit?: string | null;
}

// ==========================================
// LIVESTOCK FEED & PRODUCTION DOMAIN TYPES
// ==========================================

export type LivestockSpecies =
  | "POULTRY"
  | "DAIRY_CATTLE"
  | "BEEF_CATTLE"
  | "GOATS"
  | "SHEEP"
  | "PIGS"
  | "RABBITS"
  | "OTHER";

export type LivestockProductionMetric =
  | "EGGS"
  | "MILK"
  | "WEIGHT"
  | "BIRTHS"
  | "WEANED"
  | "MORTALITY"
  | "OTHER";

export interface LivestockGroupDTO {
  id: string;
  farmId: string;
  enterpriseId: string;
  enterpriseName?: string;
  name: string;
  species: LivestockSpecies | string;
  breed?: string | null;
  productionStage?: string | null;
  initialCount: number;
  currentCount: number;
  startDate: string;
  status: "ACTIVE" | "SOLD" | "ARCHIVED" | "COMPLETED";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    feedRecords?: number;
    productionRecords?: number;
  };
}

export interface FeedRecordDTO {
  id: string;
  farmId: string;
  enterpriseId: string;
  enterpriseName?: string;
  livestockGroupId?: string | null;
  livestockGroupName?: string | null;
  feedProductId?: string | null;
  feedProductName?: string | null;
  recordedById: string;
  recordedByName?: string;
  date: string;
  feedType: string;
  quantityIssued: number;
  unit: string;
  bagWeightKg?: number | null;
  quantityIssuedKg: number;
  quantityConsumed?: number | null;
  quantityConsumedKg?: number | null;
  quantityWasted?: number | null;
  feedCost?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface ProductionRecordDTO {
  id: string;
  farmId: string;
  enterpriseId: string;
  enterpriseName?: string;
  livestockGroupId?: string | null;
  livestockGroupName?: string | null;
  recordedById: string;
  recordedByName?: string;
  date: string;
  metric: string;
  quantity: number;
  unit: string;
  secondaryQuantity?: number | null;
  qualityGrade?: string | null;
  quantitySold?: number | null;
  quantityFarmUse?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface LivestockAnalyticsDTO {
  period: {
    dateFrom: string;
    dateTo: string;
  };
  summary: {
    totalFeedIssuedKg: number;
    totalFeedConsumedKg: number;
    hasKnownConsumption: boolean;
    totalFeedCost: number;
    totalActiveAnimals: number;
    primarySpecies: string;
  };
  productionSummary: {
    metric: string;
    totalQuantity: number;
    unit: string;
    secondaryQuantity?: number;
    averagePerDay: number;
    averagePerAnimal?: number | null;
  };
  productivityIndicators: {
    // Poultry
    eggProductionRatePercent?: number | null;
    feedPerEggGrams?: number | null;
    feedPerTrayKg?: number | null;
    isFeedPerEggEstimated?: boolean;
    eggDamagedRatePercent?: number | null;
    // Dairy
    avgMilkYieldPerCowLitres?: number | null;
    feedPerLitreKg?: number | null;
    isFeedPerLitreEstimated?: boolean;
    // Meat & Growing (Broilers, Beef, Pigs, Rabbits, Goats)
    weightGainKg?: number | null;
    averageDailyGainKg?: number | null;
    feedConversionRatio?: number | null;
    isFcrEstimated?: boolean;
    // Mortality
    mortalityCount: number;
    mortalityRatePercent?: number | null;
  };
  feedTimeSeries: Array<{
    date: string;
    issuedKg: number;
    consumedKg: number;
    cost: number;
  }>;
  productionTimeSeries: Array<{
    date: string;
    quantity: number;
    secondaryQuantity: number;
    unit: string;
  }>;
  conversionTimeSeries: Array<{
    date: string;
    feedKg: number;
    productionQty: number;
    ratio: number | null;
  }>;
}

export type FeedStockStatus = "IN_STOCK" | "LOW_STOCK" | "CRITICAL_STOCK" | "OUT_OF_STOCK";

export interface FeedProductDTO {
  id: string;
  farmId: string;
  enterpriseId?: string | null;
  enterpriseName?: string | null;
  name: string;
  feedType: string;
  intendedUse?: string | null;
  storageLocation?: string | null;
  defaultUnit: string;
  defaultBagWeightKg?: number | null;
  currentStockKg: number;
  unitCost?: number | null;
  minReserveKg: number;
  criticalReserveKg: number;
  reorderQuantityKg?: number | null;
  leadTimeDays?: number | null;
  reminderPeriodDays?: number | null;
  expectedDailyUsageKg?: number | null;
  status: "ACTIVE" | "ARCHIVED";
  daysRemaining?: number | null;
  stockStatus: FeedStockStatus;
  totalPurchasedKg?: number;
  totalIssuedKg?: number;
  totalStockValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedPurchaseDTO {
  id: string;
  farmId: string;
  feedProductId: string;
  feedProductName: string;
  enterpriseId?: string | null;
  enterpriseName?: string | null;
  purchaseDate: string;
  supplierName: string;
  quantity: number;
  unit: string;
  bagWeightKg?: number | null;
  quantityKg: number;
  unitPrice: number;
  totalCost: number;
  paymentMethod: string;
  paymentStatus: string;
  invoiceRef?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  storageLocation?: string | null;
  status: "DRAFT" | "RECEIVED" | "CANCELLED";
  receivedAt?: string | null;
  receivedQuantityKg?: number | null;
  transactionId?: string | null;
  createdById: string;
  createdByName?: string;
  notes?: string | null;
  createdAt: string;
}

export type FeedMovementType =
  | "PURCHASE_RECEIPT"
  | "FEED_ISSUE"
  | "RETURN_TO_STOCK"
  | "WASTAGE_LOSS"
  | "MANUAL_ADJUSTMENT"
  | "PURCHASE_REVERSAL";

export interface FeedStockMovementDTO {
  id: string;
  farmId: string;
  feedProductId: string;
  feedProductName: string;
  movementType: FeedMovementType;
  quantityKg: number;
  previousStockKg: number;
  resultingStockKg: number;
  feedPurchaseId?: string | null;
  feedRecordId?: string | null;
  unitCost?: number | null;
  totalValue?: number | null;
  storageLocation?: string | null;
  createdById: string;
  createdByName?: string;
  reason?: string | null;
  createdAt: string;
}

export type FeedAlertType = "LOW_STOCK" | "CRITICAL_STOCK" | "OUT_OF_STOCK" | "REPLENISHMENT_REMINDER";

export interface FeedAlertDTO {
  id: string;
  farmId: string;
  feedProductId: string;
  feedProductName: string;
  alertType: FeedAlertType;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  currentStockKg: number;
  thresholdKg?: number | null;
  daysRemaining?: number | null;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedInventorySummaryDTO {
  totalProductsTracked: number;
  totalAvailableStockKg: number;
  totalStockValueKes: number;
  productsBelowReserve: number;
  productsCriticallyLowOrOut: number;
  activeAlertsCount: number;
  recentPurchasesCount: number;
}

