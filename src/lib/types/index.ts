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

