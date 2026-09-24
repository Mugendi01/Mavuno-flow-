import { prisma } from "../prisma";
import { FinancialSummaryKPI, EnterprisePerformanceMetric } from "../types";
import { subDays, differenceInDays } from "date-fns";

export class AnalyticsService {
  /**
   * Calculate high-level financial health KPIs, distinguishing Revenue from Cash Flow,
   * plus period-over-period delta comparisons.
   */
  static async getFinancialKPIs(
    farmId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<FinancialSummaryKPI> {
    const now = new Date();
    const startDate = dateFrom ? new Date(dateFrom) : subDays(now, 30);
    const endDate = dateTo ? new Date(dateTo) : now;
    endDate.setHours(23, 59, 59, 999);

    const periodDays = Math.max(1, differenceInDays(endDate, startDate));
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = subDays(prevEndDate, periodDays);

    // Current period transactions
    const currentTx = await prisma.transaction.findMany({
      where: {
        farmId,
        isDeleted: false,
        transactionDate: { gte: startDate, lte: endDate },
      },
    });

    // Previous period transactions for comparison
    const prevTx = await prisma.transaction.findMany({
      where: {
        farmId,
        isDeleted: false,
        transactionDate: { gte: prevStartDate, lte: prevEndDate },
      },
    });

    // Payments collected during this period
    const paymentsReceived = await prisma.payment.findMany({
      where: {
        receivable: { farmId },
        paymentDate: { gte: startDate, lte: endDate },
      },
    });

    // Receivables outstanding snapshot
    const receivables = await prisma.receivable.findMany({
      where: { farmId, status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] } },
    });

    let totalRevenue = 0;
    let totalExpenses = 0;
    let cashReceived = 0;
    let cashSpent = 0;

    for (const tx of currentTx) {
      const amt = Number(tx.amount);
      if (tx.type === "SALE") {
        totalRevenue += amt;
        // Immediate cash collected
        if (tx.paymentStatus === "PAID") {
          cashReceived += amt;
        }
      } else {
        totalExpenses += amt;
        if (tx.paymentStatus === "PAID") {
          cashSpent += amt;
        }
      }
    }

    // Add debtor payments received during this window to Cash Received
    for (const p of paymentsReceived) {
      cashReceived += Number(p.amount);
    }

    const netProfit = totalRevenue - totalExpenses;

    // Previous period totals
    let prevRevenue = 0;
    let prevExpenses = 0;
    for (const ptx of prevTx) {
      const amt = Number(ptx.amount);
      if (ptx.type === "SALE") prevRevenue += amt;
      else prevExpenses += amt;
    }
    const prevNetProfit = prevRevenue - prevExpenses;

    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / Math.abs(prev)) * 100);
    };

    let outstandingReceivables = 0;
    let overdueReceivables = 0;
    for (const r of receivables) {
      const bal = Number(r.balanceAmount);
      outstandingReceivables += bal;
      if (r.dueDate && new Date(r.dueDate) < now) {
        overdueReceivables += bal;
      }
    }

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      cashReceived,
      cashSpent,
      outstandingReceivables,
      overdueReceivables,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      comparison: {
        prevRevenue,
        prevExpenses,
        prevNetProfit,
        revenueChangePercent: calcChange(totalRevenue, prevRevenue),
        expensesChangePercent: calcChange(totalExpenses, prevExpenses),
        netProfitChangePercent: calcChange(netProfit, prevNetProfit),
      },
    };
  }

  /**
   * Enterprise-by-enterprise profitability breakdown with cost driver percentages
   * and cost-per-unit metrics.
   */
  static async getEnterprisePerformance(
    farmId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<EnterprisePerformanceMetric[]> {
    const now = new Date();
    const startDate = dateFrom ? new Date(dateFrom) : subDays(now, 30);
    const endDate = dateTo ? new Date(dateTo) : now;
    endDate.setHours(23, 59, 59, 999);

    const enterprises = await prisma.enterprise.findMany({
      where: { farmId, status: "ACTIVE" },
      include: {
        enterpriseType: true,
        transactions: {
          where: {
            isDeleted: false,
            transactionDate: { gte: startDate, lte: endDate },
          },
          include: { category: true },
        },
      },
    });

    const metrics: EnterprisePerformanceMetric[] = [];

    for (const ent of enterprises) {
      let revenue = 0;
      let expenses = 0;
      const categoryExpenses: Record<string, number> = {};
      let totalUnitsSold = 0;
      let totalFeedCost = 0;

      for (const tx of ent.transactions) {
        const amt = Number(tx.amount);
        if (tx.type === "SALE") {
          revenue += amt;
          if (tx.quantity) totalUnitsSold += Number(tx.quantity);
        } else {
          expenses += amt;
          const catName = tx.category.name;
          categoryExpenses[catName] = (categoryExpenses[catName] || 0) + amt;

          if (catName.toLowerCase().includes("feed")) {
            totalFeedCost += amt;
          }
        }
      }

      const netProfit = revenue - expenses;
      const marginPercent =
        revenue > 0 ? Math.round((netProfit / revenue) * 100) : expenses > 0 ? -100 : 0;

      // Cost breakdowns
      const costBreakdown = Object.entries(categoryExpenses)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: expenses > 0 ? Math.round((amount / expenses) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      const topCostDriver = costBreakdown.length > 0 ? costBreakdown[0].category : undefined;

      // Cost per unit calculation where data exists
      let costPerUnit: EnterprisePerformanceMetric["costPerUnit"] = undefined;
      const code = ent.enterpriseType.code;

      if (code === "POULTRY") {
        if (totalUnitsSold > 0) {
          costPerUnit = {
            metricName: "Feed Cost per Unit Sold",
            value: totalFeedCost > 0 ? Math.round(totalFeedCost / totalUnitsSold) : 0,
            unit: "KES/tray or bird",
            isEstimated: totalFeedCost === 0,
          };
        }
      } else if (code === "CATTLE") {
        if (totalUnitsSold > 0) {
          costPerUnit = {
            metricName: "Operating Cost per Litre Produced",
            value: Math.round(expenses / totalUnitsSold),
            unit: "KES/Litre",
            isEstimated: false,
          };
        }
      } else if (code === "AQUACULTURE") {
        if (totalUnitsSold > 0) {
          costPerUnit = {
            metricName: "Cost per Kg Harvested",
            value: Math.round(expenses / totalUnitsSold),
            unit: "KES/Kg",
            isEstimated: false,
          };
        }
      }

      metrics.push({
        enterpriseId: ent.id,
        enterpriseName: ent.name,
        enterpriseCode: ent.enterpriseType.code,
        revenue,
        expenses,
        netProfit,
        marginPercent,
        topCostDriver,
        costBreakdown,
        costPerUnit,
      });
    }

    return metrics;
  }
}
