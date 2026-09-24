import { prisma } from "../prisma";
import { WeeklyFarmDigestData } from "../types";
import { subDays, startOfWeek, endOfWeek, getWeek, getYear } from "date-fns";

export class ReportService {
  /**
   * Aggregate all weekly farm performance data for a given farm and reference date.
   */
  static async compileWeeklyDigest(
    farmId: string,
    referenceDate: Date = new Date()
  ): Promise<WeeklyFarmDigestData> {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      throw new Error(`Farm with ID ${farmId} not found`);
    }

    // Default week window: Monday 00:00 to Sunday 23:59:59
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });

    // Prior week window for WoW comparisons
    const prevWeekStart = subDays(weekStart, 7);
    const prevWeekEnd = subDays(weekEnd, 7);

    // Fetch transactions
    const [currentTx, prevTx, debtors, enterprises] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          farmId,
          isDeleted: false,
          transactionDate: { gte: weekStart, lte: weekEnd },
        },
        include: { enterprise: true, category: true },
      }),
      prisma.transaction.findMany({
        where: {
          farmId,
          isDeleted: false,
          transactionDate: { gte: prevWeekStart, lte: prevWeekEnd },
        },
      }),
      prisma.receivable.findMany({
        where: { farmId, status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] } },
        orderBy: { balanceAmount: "desc" },
      }),
      prisma.enterprise.findMany({
        where: { farmId, status: "ACTIVE" },
        include: { enterpriseType: true },
      }),
    ]);

    // Financial KPIs
    let totalRevenue = 0;
    let totalExpenses = 0;
    let cashReceived = 0;
    let cashSpent = 0;
    let salesCount = 0;
    let expenseCount = 0;
    let largestSale: WeeklyFarmDigestData["activitySummary"]["largestSale"] = null;
    let largestExpense: WeeklyFarmDigestData["activitySummary"]["largestExpense"] = null;

    const enterpriseMap: Record<
      string,
      { revenue: number; expenses: number; costBreakdown: Record<string, number> }
    > = {};
    for (const ent of enterprises) {
      enterpriseMap[ent.id] = { revenue: 0, expenses: 0, costBreakdown: {} };
    }

    const categorySpend: Record<string, number> = {};

    for (const tx of currentTx) {
      const amt = Number(tx.amount);
      if (tx.type === "SALE") {
        salesCount++;
        totalRevenue += amt;
        if (tx.paymentStatus === "PAID") cashReceived += amt;

        if (enterpriseMap[tx.enterpriseId]) {
          enterpriseMap[tx.enterpriseId].revenue += amt;
        }

        if (!largestSale || amt > largestSale.amount) {
          largestSale = {
            enterprise: tx.enterprise.name,
            amount: amt,
            buyer: tx.buyerName || undefined,
          };
        }
      } else {
        expenseCount++;
        totalExpenses += amt;
        if (tx.paymentStatus === "PAID") cashSpent += amt;

        categorySpend[tx.category.name] = (categorySpend[tx.category.name] || 0) + amt;

        if (enterpriseMap[tx.enterpriseId]) {
          enterpriseMap[tx.enterpriseId].expenses += amt;
          const currentCat = enterpriseMap[tx.enterpriseId].costBreakdown;
          currentCat[tx.category.name] = (currentCat[tx.category.name] || 0) + amt;
        }

        if (!largestExpense || amt > largestExpense.amount) {
          largestExpense = {
            category: tx.category.name,
            amount: amt,
            notes: tx.notes || undefined,
          };
        }
      }
    }

    const netProfit = totalRevenue - totalExpenses;

    // Previous week totals for WoW
    let prevRevenue = 0;
    let prevExpenses = 0;
    for (const tx of prevTx) {
      const amt = Number(tx.amount);
      if (tx.type === "SALE") prevRevenue += amt;
      else prevExpenses += amt;
    }
    const prevNetProfit = prevRevenue - prevExpenses;

    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / Math.abs(prev)) * 100);
    };

    // Outstanding debtors
    let outstandingReceivables = 0;
    let overdueReceivables = 0;
    const now = new Date();
    const debtorList = debtors.map((d) => {
      const bal = Number(d.balanceAmount);
      outstandingReceivables += bal;
      if (d.dueDate && new Date(d.dueDate) < now) {
        overdueReceivables += bal;
      }
      return {
        customerName: d.customerName,
        balance: bal,
        dueDate: d.dueDate ? d.dueDate.toISOString().split("T")[0] : undefined,
      };
    });

    // Top Expenses
    const topExpenses = Object.entries(categorySpend)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    // Enterprise Performance Table
    const enterpriseMetrics = enterprises.map((ent) => {
      const data = enterpriseMap[ent.id] || { revenue: 0, expenses: 0, costBreakdown: {} };
      const net = data.revenue - data.expenses;
      const margin = data.revenue > 0 ? Math.round((net / data.revenue) * 100) : 0;

      const breakdown = Object.entries(data.costBreakdown).map(([category, amount]) => ({
        category,
        amount,
        percentage: data.expenses > 0 ? Math.round((amount / data.expenses) * 100) : 0,
      }));

      return {
        enterpriseId: ent.id,
        enterpriseName: ent.name,
        enterpriseCode: ent.enterpriseType.code,
        revenue: data.revenue,
        expenses: data.expenses,
        netProfit: net,
        marginPercent: margin,
        topCostDriver: breakdown.length > 0 ? breakdown[0].category : undefined,
        costBreakdown: breakdown,
      };
    });

    // Smart Actionable Insights
    const keyInsights: string[] = [];
    if (netProfit > 0) {
      keyInsights.push(`Farm operates at a surplus of ${farm.currency} ${netProfit.toLocaleString()} this week.`);
    } else if (netProfit < 0) {
      keyInsights.push(`Operating deficit of ${farm.currency} ${Math.abs(netProfit).toLocaleString()} observed; review top cost drivers.`);
    }

    if (topExpenses.length > 0) {
      keyInsights.push(`${topExpenses[0].category} represents ${topExpenses[0].percentage}% of total farm expenses.`);
    }

    if (debtorList.length > 0) {
      keyInsights.push(`${farm.currency} ${outstandingReceivables.toLocaleString()} in customer receivables pending collection.`);
    }

    return {
      farm: {
        id: farm.id,
        name: farm.name,
        locationCounty: farm.locationCounty,
        currency: farm.currency,
      },
      period: {
        startDate: weekStart.toISOString().split("T")[0],
        endDate: weekEnd.toISOString().split("T")[0],
        weekNumber: getWeek(weekStart),
        year: getYear(weekStart),
      },
      kpi: {
        totalRevenue,
        totalExpenses,
        netProfit,
        cashReceived,
        cashSpent,
        outstandingReceivables,
        overdueReceivables,
        dateRange: { start: weekStart.toISOString(), end: weekEnd.toISOString() },
        comparison: {
          prevRevenue,
          prevExpenses,
          prevNetProfit,
          revenueChangePercent: calcChange(totalRevenue, prevRevenue),
          expensesChangePercent: calcChange(totalExpenses, prevExpenses),
          netProfitChangePercent: calcChange(netProfit, prevNetProfit),
        },
      },
      enterprises: enterpriseMetrics,
      topExpenses,
      outstandingDebtors: debtorList.slice(0, 5),
      activitySummary: {
        salesCount,
        expenseCount,
        largestSale,
        largestExpense,
      },
      keyInsights,
    };
  }

  /**
   * Render Responsive HTML Email for Weekly Farm Digest.
   */
  static generateEmailHTML(data: WeeklyFarmDigestData): string {
    const { farm, period, kpi, topExpenses, enterprises, outstandingDebtors, keyInsights } = data;
    const currency = farm.currency;

    const formatMoney = (n: number) => `${currency} ${n.toLocaleString()}`;
    const signProfit = kpi.netProfit >= 0 ? "+" : "";

    const enterpriseRows = enterprises
      .map(
        (e) => `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 12px 8px; font-weight: 600; color: #1F2937;">${e.enterpriseName}</td>
        <td style="padding: 12px 8px; text-align: right; color: #15803D;">${formatMoney(e.revenue)}</td>
        <td style="padding: 12px 8px; text-align: right; color: #DC2626;">${formatMoney(e.expenses)}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: ${
          e.netProfit >= 0 ? "#15803D" : "#DC2626"
        };">${e.netProfit >= 0 ? "+" : ""}${formatMoney(e.netProfit)}</td>
      </tr>`
      )
      .join("");

    const topExpenseList = topExpenses
      .map(
        (t) => `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="color: #4B5563; font-size: 14px;">${t.category} (${t.percentage}%)</span>
        <span style="font-weight: 600; color: #1F2937; font-size: 14px;">${formatMoney(t.amount)}</span>
      </div>`
      )
      .join("");

    const debtorRows = outstandingDebtors
      .map(
        (d) => `
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #E5E7EB; font-size: 13px;">
        <span style="color: #1F2937; font-weight: 500;">${d.customerName}</span>
        <span style="color: #D97706; font-weight: 600;">${formatMoney(d.balance)}</span>
      </div>`
      )
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${farm.name} — Weekly Farm Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
  <div style="max-width: 640px; margin: 20px auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #E5E7EB;">
    
    <!-- Header -->
    <div style="background-color: #1B4332; padding: 28px 24px; color: #FFFFFF;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">🌾 FARMPULSE</h1>
        <span style="font-size: 13px; color: #95D5B2; font-weight: 500;">Week ${period.weekNumber}, ${period.year}</span>
      </div>
      <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 600;">${farm.name} <span style="font-weight: 400; opacity: 0.85; font-size: 13px;">(${farm.locationCounty})</span></p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #D8F3DC;">Period: ${period.startDate} to ${period.endDate}</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 24px;">

      <!-- KPI Grid -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 24px;">
        <tr>
          <td style="width: 33%; background-color: #F4F6F0; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 12px; color: #6B7280; font-weight: 600; text-transform: uppercase;">Revenue</div>
            <div style="font-size: 18px; font-weight: 800; color: #15803D; margin-top: 4px;">${formatMoney(kpi.totalRevenue)}</div>
            <div style="font-size: 11px; color: ${kpi.comparison && kpi.comparison.revenueChangePercent >= 0 ? "#15803D" : "#DC2626"}; font-weight: 600; margin-top: 2px;">
              ${kpi.comparison && kpi.comparison.revenueChangePercent >= 0 ? "▲" : "▼"} ${Math.abs(kpi.comparison?.revenueChangePercent || 0)}% WoW
            </div>
          </td>
          <td style="width: 33%; background-color: #F4F6F0; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #E5E7EB;">
            <div style="font-size: 12px; color: #6B7280; font-weight: 600; text-transform: uppercase;">Expenses</div>
            <div style="font-size: 18px; font-weight: 800; color: #DC2626; margin-top: 4px;">${formatMoney(kpi.totalExpenses)}</div>
            <div style="font-size: 11px; color: #6B7280; font-weight: 500; margin-top: 2px;">
              ${kpi.comparison && kpi.comparison.expensesChangePercent >= 0 ? "▲" : "▼"} ${Math.abs(kpi.comparison?.expensesChangePercent || 0)}% WoW
            </div>
          </td>
          <td style="width: 33%; background-color: ${kpi.netProfit >= 0 ? "#D8F3DC" : "#FEE2E2"}; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid ${kpi.netProfit >= 0 ? "#74C69D" : "#FCA5A5"};">
            <div style="font-size: 12px; color: #1F2937; font-weight: 700; text-transform: uppercase;">Net Result</div>
            <div style="font-size: 18px; font-weight: 800; color: ${kpi.netProfit >= 0 ? "#1B4332" : "#B91C1C"}; margin-top: 4px;">
              ${signProfit}${formatMoney(kpi.netProfit)}
            </div>
            <div style="font-size: 11px; font-weight: 700; color: ${kpi.netProfit >= 0 ? "#15803D" : "#DC2626"}; margin-top: 2px;">
              ${kpi.netProfit >= 0 ? "PROFIT" : "DEFICIT"}
            </div>
          </td>
        </tr>
      </table>

      <!-- Key Insights Alert -->
      <div style="background-color: #F8F9FA; border-left: 4px solid #2D6A4F; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
        <strong style="color: #1B4332; font-size: 14px;">Key Observations:</strong>
        <ul style="margin: 6px 0 0 0; padding-left: 20px; font-size: 13px; color: #374151;">
          ${keyInsights.map((k) => `<li>${k}</li>`).join("")}
        </ul>
      </div>

      <!-- Enterprise Performance Matrix -->
      <h3 style="font-size: 15px; color: #1B4332; margin: 0 0 12px 0; border-bottom: 2px solid #D8F3DC; padding-bottom: 6px;">Enterprise Performance</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #F8F9FA; border-bottom: 2px solid #E5E7EB; text-align: left; color: #4B5563;">
            <th style="padding: 8px;">Enterprise</th>
            <th style="padding: 8px; text-align: right;">Revenue</th>
            <th style="padding: 8px; text-align: right;">Expenses</th>
            <th style="padding: 8px; text-align: right;">Net</th>
          </tr>
        </thead>
        <tbody>
          ${enterpriseRows}
        </tbody>
      </table>

      <!-- Two column breakdown: Top Expenses & Outstanding Receivables -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-bottom: 24px;">
        <tr>
          <td style="width: 50%; vertical-align: top; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px;">
            <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #1B4332; text-transform: uppercase;">Top 3 Cost Drivers</h4>
            ${topExpenseList || '<p style="font-size: 12px; color: #9CA3AF; margin: 0;">No expenses recorded.</p>'}
          </td>
          <td style="width: 50%; vertical-align: top; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px;">
            <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #1B4332; text-transform: uppercase;">Unpaid Debtors (${formatMoney(kpi.outstandingReceivables)})</h4>
            ${debtorRows || '<p style="font-size: 12px; color: #9CA3AF; margin: 0;">All accounts current!</p>'}
          </td>
        </tr>
      </table>

      <!-- Action CTAs -->
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="http://localhost:3000/dashboard" style="display: inline-block; background-color: #1B4332; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 700; font-size: 14px; margin-right: 10px;">
          View Full Dashboard
        </a>
        <a href="http://localhost:3000/reports" style="display: inline-block; background-color: #F4F6F0; color: #1B4332; border: 1px solid #2D6A4F; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;">
          Download Weekly PDF
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #F8F9FA; padding: 16px 24px; border-top: 1px solid #E5E7EB; text-align: center; font-size: 12px; color: #6B7280;">
      <p style="margin: 0;">FarmPulse Farm Management Platform — Built for Sustainable African Agriculture.</p>
      <p style="margin: 4px 0 0 0;">Report delivered according to schedule: Mondays at 07:00 AM (Africa/Nairobi).</p>
    </div>

  </div>
</body>
</html>`;
  }

  /**
   * Save generated weekly report record in database.
   */
  static async persistReport(data: WeeklyFarmDigestData) {
    return await prisma.weeklyReport.create({
      data: {
        farmId: data.farm.id,
        weekStartDate: new Date(data.period.startDate),
        weekEndDate: new Date(data.period.endDate),
        totalRevenue: data.kpi.totalRevenue,
        totalExpenses: data.kpi.totalExpenses,
        netProfit: data.kpi.netProfit,
        cashReceived: data.kpi.cashReceived,
        cashSpent: data.kpi.cashSpent,
        outstandingReceivables: data.kpi.outstandingReceivables,
        reportDataJson: JSON.stringify(data),
        status: "GENERATED",
      },
    });
  }
}
