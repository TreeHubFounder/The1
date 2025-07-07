
import { db } from '@/lib/db';
import type { 
  CashFlowEntry,
  CashFlowForecast,
  CashFlowForecastItem,
  WorkingCapitalMetrics,
  PaymentDelay,
  CashFlowType,
  CashFlowCategory
} from '@prisma/client';

export interface CreateCashFlowEntryData {
  amount: number;
  type: CashFlowType;
  category: CashFlowCategory;
  description: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  status?: string;
  transactionId?: string;
  jobId?: string;
  plannedDate: Date;
  actualDate?: Date;
  bankAccount?: string;
  paymentMethod?: string;
}

export interface CashFlowSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  currentBalance: number;
  projectedBalance: number;
  burnRate: number;
  runwayMonths: number;
  cashFlowHealth: 'healthy' | 'warning' | 'critical';
}

export interface ForecastData {
  period: string;
  projectedInflows: number;
  projectedOutflows: number;
  netCashFlow: number;
  confidence: number;
  scenarios: {
    optimistic: number;
    expected: number;
    pessimistic: number;
  };
}

export interface WorkingCapitalSummary {
  currentAssets: number;
  currentLiabilities: number;
  workingCapital: number;
  workingCapitalRatio: number;
  quickRatio: number;
  daysInReceivables: number;
  daysInPayables: number;
  cashConversionCycle: number;
  efficiency: 'excellent' | 'good' | 'fair' | 'poor';
}

export class CashFlowManagementService {
  // Cash Flow Entry Management
  async createCashFlowEntry(data: CreateCashFlowEntryData): Promise<CashFlowEntry> {
    return await db.cashFlowEntry.create({
      data: {
        ...data,
        status: data.status || 'Planned',
        isConfirmed: data.actualDate ? true : false,
      },
      include: {
        transaction: true,
        job: true,
      },
    });
  }

  async confirmCashFlowEntry(
    entryId: string,
    actualDate: Date,
    actualAmount?: number
  ): Promise<CashFlowEntry> {
    const updateData: any = {
      actualDate,
      isConfirmed: true,
      status: 'Actual',
    };

    if (actualAmount !== undefined) {
      updateData.amount = actualAmount;
    }

    return await db.cashFlowEntry.update({
      where: { id: entryId },
      data: updateData,
      include: {
        transaction: true,
        job: true,
      },
    });
  }

  async createRecurringEntries(
    baseEntryId: string,
    numberOfPeriods: number
  ): Promise<CashFlowEntry[]> {
    const baseEntry = await db.cashFlowEntry.findUnique({
      where: { id: baseEntryId },
    });

    if (!baseEntry || !baseEntry.isRecurring || !baseEntry.recurringFrequency) {
      throw new Error('Invalid recurring entry');
    }

    const entries: CashFlowEntry[] = [];
    
    for (let i = 1; i <= numberOfPeriods; i++) {
      const plannedDate = this.calculateNextDate(
        baseEntry.plannedDate,
        baseEntry.recurringFrequency,
        i
      );

      const entry = await db.cashFlowEntry.create({
        data: {
          amount: baseEntry.amount,
          type: baseEntry.type,
          category: baseEntry.category,
          description: `${baseEntry.description} (Period ${i})`,
          isRecurring: true,
          recurringFrequency: baseEntry.recurringFrequency,
          status: 'Planned',
          plannedDate,
          bankAccount: baseEntry.bankAccount,
          paymentMethod: baseEntry.paymentMethod,
        },
      });

      entries.push(entry);
    }

    return entries;
  }

  // Cash Flow Forecasting
  async createForecast(data: {
    forecastName: string;
    forecastPeriod: string;
    startDate: Date;
    endDate: Date;
    scenario?: string;
    assumptions?: any;
  }): Promise<CashFlowForecast> {
    const forecast = await db.cashFlowForecast.create({
      data: {
        ...data,
        scenario: data.scenario || 'Expected',
        projectedInflows: 0,
        projectedOutflows: 0,
        netCashFlow: 0,
      },
    });

    // Generate forecast items based on historical data and trends
    await this.generateForecastItems(forecast.id, data.startDate, data.endDate);

    return await db.cashFlowForecast.findUnique({
      where: { id: forecast.id },
      include: { forecastItems: true },
    })!;
  }

  async addForecastItem(
    forecastId: string,
    data: {
      description: string;
      amount: number;
      type: CashFlowType;
      category: CashFlowCategory;
      expectedDate: Date;
      probability?: number;
    }
  ): Promise<CashFlowForecastItem> {
    const item = await db.cashFlowForecastItem.create({
      data: {
        forecastId,
        ...data,
        probability: data.probability || 100,
      },
    });

    // Update forecast totals
    await this.updateForecastTotals(forecastId);

    return item;
  }

  async generateCashFlowForecast(
    startDate: Date,
    endDate: Date,
    scenario: string = 'Expected'
  ): Promise<ForecastData[]> {
    const periods = this.generateDatePeriods(startDate, endDate, 'monthly');
    const forecastData: ForecastData[] = [];

    for (const period of periods) {
      const historicalData = await this.getHistoricalCashFlow(
        period.start,
        period.end,
        12 // months of historical data
      );

      const seasonalityFactor = this.calculateSeasonality(period.start);
      const trendFactor = this.calculateTrend(historicalData);

      const baseInflows = historicalData.avgInflows * seasonalityFactor * trendFactor;
      const baseOutflows = historicalData.avgOutflows * seasonalityFactor;

      const scenarios = {
        optimistic: (baseInflows * 1.2) - (baseOutflows * 0.9),
        expected: baseInflows - baseOutflows,
        pessimistic: (baseInflows * 0.8) - (baseOutflows * 1.1),
      };

      const projectedInflows = scenario === 'optimistic' ? baseInflows * 1.2 :
                              scenario === 'pessimistic' ? baseInflows * 0.8 :
                              baseInflows;

      const projectedOutflows = scenario === 'optimistic' ? baseOutflows * 0.9 :
                               scenario === 'pessimistic' ? baseOutflows * 1.1 :
                               baseOutflows;

      forecastData.push({
        period: period.label,
        projectedInflows,
        projectedOutflows,
        netCashFlow: projectedInflows - projectedOutflows,
        confidence: this.calculateConfidence(historicalData),
        scenarios,
      });
    }

    return forecastData;
  }

  // Working Capital Management
  async calculateWorkingCapitalMetrics(
    reportDate: Date,
    period: string = 'Monthly'
  ): Promise<WorkingCapitalMetrics> {
    // Get financial data for the period
    const financialData = await this.getFinancialData(reportDate);

    const metrics = {
      reportDate,
      period,
      cash: financialData.cash,
      accountsReceivable: financialData.accountsReceivable,
      inventory: financialData.inventory,
      otherCurrentAssets: financialData.otherCurrentAssets,
      totalCurrentAssets: financialData.cash + financialData.accountsReceivable + 
                         financialData.inventory + financialData.otherCurrentAssets,
      accountsPayable: financialData.accountsPayable,
      shortTermDebt: financialData.shortTermDebt,
      accruedExpenses: financialData.accruedExpenses,
      otherCurrentLiabilities: financialData.otherCurrentLiabilities,
      totalCurrentLiabilities: financialData.accountsPayable + financialData.shortTermDebt + 
                              financialData.accruedExpenses + financialData.otherCurrentLiabilities,
      workingCapital: 0,
      workingCapitalRatio: undefined,
      quickRatio: undefined,
      receivablesTurnover: undefined,
      inventoryTurnover: undefined,
      payablesTurnover: undefined,
      daysInReceivables: undefined,
      daysInInventory: undefined,
      daysInPayables: undefined,
      cashConversionCycle: undefined,
    };

    // Calculate derived metrics
    const totalCurrentAssets = metrics.totalCurrentAssets;
    const totalCurrentLiabilities = metrics.totalCurrentLiabilities;

    metrics.workingCapital = totalCurrentAssets - totalCurrentLiabilities;
    
    if (totalCurrentLiabilities > 0) {
      metrics.workingCapitalRatio = totalCurrentAssets / totalCurrentLiabilities;
      metrics.quickRatio = (totalCurrentAssets - metrics.inventory) / totalCurrentLiabilities;
    }

    // Calculate turnover ratios (simplified)
    const annualRevenue = await this.getAnnualRevenue(reportDate);
    const annualCOGS = annualRevenue * 0.7; // Simplified assumption

    if (metrics.accountsReceivable > 0) {
      metrics.receivablesTurnover = annualRevenue / metrics.accountsReceivable;
      metrics.daysInReceivables = Math.round(365 / metrics.receivablesTurnover);
    }

    if (metrics.inventory > 0) {
      metrics.inventoryTurnover = annualCOGS / metrics.inventory;
      metrics.daysInInventory = Math.round(365 / metrics.inventoryTurnover);
    }

    if (metrics.accountsPayable > 0) {
      metrics.payablesTurnover = annualCOGS / metrics.accountsPayable;
      metrics.daysInPayables = Math.round(365 / metrics.payablesTurnover);
    }

    if (metrics.daysInReceivables && metrics.daysInInventory && metrics.daysInPayables) {
      metrics.cashConversionCycle = metrics.daysInReceivables + 
                                   metrics.daysInInventory - 
                                   metrics.daysInPayables;
    }

    return await db.workingCapitalMetrics.create({
      data: metrics,
    });
  }

  async getWorkingCapitalSummary(
    reportDate?: Date
  ): Promise<WorkingCapitalSummary> {
    const date = reportDate || new Date();
    
    const latestMetrics = await db.workingCapitalMetrics.findFirst({
      where: {
        reportDate: { lte: date },
      },
      orderBy: { reportDate: 'desc' },
    });

    if (!latestMetrics) {
      throw new Error('No working capital metrics found');
    }

    const currentAssets = latestMetrics.totalCurrentAssets.toNumber();
    const currentLiabilities = latestMetrics.totalCurrentLiabilities.toNumber();
    const workingCapital = latestMetrics.workingCapital.toNumber();
    const workingCapitalRatio = latestMetrics.workingCapitalRatio?.toNumber() || 0;
    const quickRatio = latestMetrics.quickRatio?.toNumber() || 0;
    const daysInReceivables = latestMetrics.daysInReceivables || 0;
    const daysInPayables = latestMetrics.daysInPayables || 0;
    const cashConversionCycle = latestMetrics.cashConversionCycle || 0;

    // Determine efficiency rating
    let efficiency: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    
    if (workingCapitalRatio >= 2.0 && quickRatio >= 1.0 && cashConversionCycle <= 30) {
      efficiency = 'excellent';
    } else if (workingCapitalRatio >= 1.5 && quickRatio >= 0.8 && cashConversionCycle <= 45) {
      efficiency = 'good';
    } else if (workingCapitalRatio >= 1.2 && quickRatio >= 0.6 && cashConversionCycle <= 60) {
      efficiency = 'fair';
    }

    return {
      currentAssets,
      currentLiabilities,
      workingCapital,
      workingCapitalRatio,
      quickRatio,
      daysInReceivables,
      daysInPayables,
      cashConversionCycle,
      efficiency,
    };
  }

  // Payment Delay Management
  async createPaymentDelay(data: {
    amount: number;
    originalDueDate: Date;
    customerId: string;
    delayReason?: string;
    transactionId?: string;
    jobId?: string;
  }): Promise<PaymentDelay> {
    const daysOverdue = Math.ceil(
      (new Date().getTime() - data.originalDueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return await db.paymentDelay.create({
      data: {
        ...data,
        daysOverdue,
        status: 'Overdue',
        collectionEfforts: [],
      },
      include: {
        customer: true,
        transaction: true,
        job: true,
      },
    });
  }

  async recordCollectionEffort(
    delayId: string,
    effort: {
      date: Date;
      method: string;
      outcome: string;
      nextAction?: string;
      followUpDate?: Date;
    }
  ): Promise<PaymentDelay> {
    const paymentDelay = await db.paymentDelay.findUnique({
      where: { id: delayId },
    });

    if (!paymentDelay) {
      throw new Error('Payment delay not found');
    }

    const currentEfforts = paymentDelay.collectionEfforts as any[] || [];
    const updatedEfforts = [...currentEfforts, effort];

    return await db.paymentDelay.update({
      where: { id: delayId },
      data: {
        collectionEfforts: updatedEfforts,
      },
      include: {
        customer: true,
      },
    });
  }

  async resolvePaymentDelay(
    delayId: string,
    actualPaymentDate: Date,
    resolutionAction: string,
    interestCharged?: number,
    lateFees?: number
  ): Promise<PaymentDelay> {
    return await db.paymentDelay.update({
      where: { id: delayId },
      data: {
        status: 'Resolved',
        actualPaymentDate,
        resolutionAction,
        interestCharged,
        lateFees,
        resolvedAt: new Date(),
      },
      include: {
        customer: true,
      },
    });
  }

  // Analytics & Reporting
  async getCashFlowSummary(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<CashFlowSummary> {
    const endDate = dateTo || new Date();
    const startDate = dateFrom || new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days

    const [inflowData, outflowData, currentBalance] = await Promise.all([
      db.cashFlowEntry.aggregate({
        where: {
          type: 'INFLOW',
          actualDate: { gte: startDate, lte: endDate },
          isConfirmed: true,
        },
        _sum: { amount: true },
      }),
      db.cashFlowEntry.aggregate({
        where: {
          type: 'OUTFLOW',
          actualDate: { gte: startDate, lte: endDate },
          isConfirmed: true,
        },
        _sum: { amount: true },
      }),
      this.getCurrentCashBalance(),
    ]);

    const totalInflow = inflowData._sum.amount?.toNumber() || 0;
    const totalOutflow = outflowData._sum.amount?.toNumber() || 0;
    const netCashFlow = totalInflow - totalOutflow;

    // Calculate burn rate (monthly average outflow)
    const monthsInPeriod = (endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000);
    const burnRate = monthsInPeriod > 0 ? totalOutflow / monthsInPeriod : 0;

    // Calculate runway (months of operation at current burn rate)
    const runwayMonths = burnRate > 0 ? currentBalance / burnRate : 999;

    // Project balance for next 30 days
    const projectedBalance = await this.calculateProjectedBalance(30);

    // Determine cash flow health
    let cashFlowHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (runwayMonths < 3 || projectedBalance < 0) {
      cashFlowHealth = 'critical';
    } else if (runwayMonths < 6 || projectedBalance < currentBalance * 0.5) {
      cashFlowHealth = 'warning';
    }

    return {
      totalInflow,
      totalOutflow,
      netCashFlow,
      currentBalance,
      projectedBalance,
      burnRate,
      runwayMonths,
      cashFlowHealth,
    };
  }

  async getPaymentDelayAnalysis(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalDelays: number;
    totalDelayedAmount: number;
    averageDaysOverdue: number;
    recoveryRate: number;
    totalInterestAndFees: number;
    delaysByCustomer: Array<{
      customerId: string;
      customerName: string;
      delayCount: number;
      totalAmount: number;
      avgDaysOverdue: number;
    }>;
  }> {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = dateFrom;
      if (dateTo) whereClause.createdAt.lte = dateTo;
    }

    const [totalDelays, delayData, resolvedDelays, delaysByCustomer] = await Promise.all([
      db.paymentDelay.count({ where: whereClause }),
      db.paymentDelay.aggregate({
        where: whereClause,
        _sum: { amount: true, interestCharged: true, lateFees: true },
        _avg: { daysOverdue: true },
      }),
      db.paymentDelay.count({
        where: { ...whereClause, status: 'Resolved' },
      }),
      db.paymentDelay.groupBy({
        by: ['customerId'],
        where: whereClause,
        _count: true,
        _sum: { amount: true },
        _avg: { daysOverdue: true },
      }),
    ]);

    const totalDelayedAmount = delayData._sum.amount?.toNumber() || 0;
    const averageDaysOverdue = delayData._avg.daysOverdue?.toNumber() || 0;
    const recoveryRate = totalDelays > 0 ? (resolvedDelays / totalDelays) * 100 : 0;
    const totalInterestAndFees = 
      (delayData._sum.interestCharged?.toNumber() || 0) + 
      (delayData._sum.lateFees?.toNumber() || 0);

    // Get customer details for delay analysis
    const customerIds = delaysByCustomer.map(d => d.customerId);
    const customers = await db.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, firstName: true, lastName: true, companyName: true },
    });

    const delaysByCustomerWithNames = delaysByCustomer.map(delay => {
      const customer = customers.find(c => c.id === delay.customerId);
      return {
        customerId: delay.customerId,
        customerName: customer?.companyName || 
                     `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() ||
                     'Unknown Customer',
        delayCount: delay._count,
        totalAmount: delay._sum.amount?.toNumber() || 0,
        avgDaysOverdue: delay._avg.daysOverdue?.toNumber() || 0,
      };
    });

    return {
      totalDelays,
      totalDelayedAmount,
      averageDaysOverdue,
      recoveryRate,
      totalInterestAndFees,
      delaysByCustomer: delaysByCustomerWithNames,
    };
  }

  // Private Helper Methods
  private calculateNextDate(
    baseDate: Date,
    frequency: string,
    periods: number
  ): Date {
    const nextDate = new Date(baseDate);
    
    switch (frequency) {
      case 'Weekly':
        nextDate.setDate(nextDate.getDate() + (7 * periods));
        break;
      case 'Monthly':
        nextDate.setMonth(nextDate.getMonth() + periods);
        break;
      case 'Quarterly':
        nextDate.setMonth(nextDate.getMonth() + (3 * periods));
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + periods);
    }

    return nextDate;
  }

  private async generateForecastItems(
    forecastId: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    // Generate items based on historical patterns and recurring entries
    const recurringEntries = await db.cashFlowEntry.findMany({
      where: { isRecurring: true },
    });

    for (const entry of recurringEntries) {
      const dates = this.generateRecurringDates(
        entry.plannedDate,
        entry.recurringFrequency!,
        startDate,
        endDate
      );

      for (const date of dates) {
        await db.cashFlowForecastItem.create({
          data: {
            forecastId,
            description: entry.description,
            amount: entry.amount,
            type: entry.type,
            category: entry.category,
            expectedDate: date,
            probability: 95, // High probability for recurring items
          },
        });
      }
    }

    await this.updateForecastTotals(forecastId);
  }

  private generateRecurringDates(
    baseDate: Date,
    frequency: string,
    startDate: Date,
    endDate: Date
  ): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(Math.max(baseDate.getTime(), startDate.getTime()));

    while (currentDate <= endDate) {
      if (currentDate >= startDate) {
        dates.push(new Date(currentDate));
      }
      
      currentDate = this.calculateNextDate(currentDate, frequency, 1);
    }

    return dates;
  }

  private async updateForecastTotals(forecastId: string): Promise<void> {
    const [inflowSum, outflowSum] = await Promise.all([
      db.cashFlowForecastItem.aggregate({
        where: { forecastId, type: 'INFLOW' },
        _sum: { amount: true },
      }),
      db.cashFlowForecastItem.aggregate({
        where: { forecastId, type: 'OUTFLOW' },
        _sum: { amount: true },
      }),
    ]);

    const projectedInflows = inflowSum._sum.amount?.toNumber() || 0;
    const projectedOutflows = outflowSum._sum.amount?.toNumber() || 0;
    const netCashFlow = projectedInflows - projectedOutflows;

    await db.cashFlowForecast.update({
      where: { id: forecastId },
      data: {
        projectedInflows,
        projectedOutflows,
        netCashFlow,
      },
    });
  }

  private generateDatePeriods(
    startDate: Date,
    endDate: Date,
    frequency: string
  ): Array<{ start: Date; end: Date; label: string }> {
    const periods = [];
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      const periodEnd = new Date(currentDate);
      
      if (frequency === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else if (frequency === 'quarterly') {
        periodEnd.setMonth(periodEnd.getMonth() + 3);
      }

      if (periodEnd > endDate) {
        periodEnd.setTime(endDate.getTime());
      }

      periods.push({
        start: new Date(currentDate),
        end: periodEnd,
        label: this.formatPeriodLabel(currentDate, frequency),
      });

      currentDate = new Date(periodEnd);
    }

    return periods;
  }

  private formatPeriodLabel(date: Date, frequency: string): string {
    const options: Intl.DateTimeFormatOptions = frequency === 'monthly' 
      ? { year: 'numeric', month: 'long' }
      : { year: 'numeric', month: 'long', day: 'numeric' };
    
    return date.toLocaleDateString('en-US', options);
  }

  private async getHistoricalCashFlow(
    periodStart: Date,
    periodEnd: Date,
    monthsBack: number
  ): Promise<{
    avgInflows: number;
    avgOutflows: number;
    volatility: number;
  }> {
    const historicalStart = new Date(periodStart);
    historicalStart.setMonth(historicalStart.getMonth() - monthsBack);

    const [inflowData, outflowData] = await Promise.all([
      db.cashFlowEntry.aggregate({
        where: {
          type: 'INFLOW',
          actualDate: { gte: historicalStart, lt: periodStart },
          isConfirmed: true,
        },
        _avg: { amount: true },
        _count: true,
      }),
      db.cashFlowEntry.aggregate({
        where: {
          type: 'OUTFLOW',
          actualDate: { gte: historicalStart, lt: periodStart },
          isConfirmed: true,
        },
        _avg: { amount: true },
        _count: true,
      }),
    ]);

    const avgInflows = inflowData._avg.amount?.toNumber() || 0;
    const avgOutflows = outflowData._avg.amount?.toNumber() || 0;
    const volatility = Math.abs(avgInflows - avgOutflows) / (avgInflows + avgOutflows || 1);

    return { avgInflows, avgOutflows, volatility };
  }

  private calculateSeasonality(date: Date): number {
    // Simplified seasonality calculation - tree care is typically higher in spring/summer
    const month = date.getMonth() + 1; // 1-12
    
    if (month >= 3 && month <= 8) { // March to August
      return 1.2; // 20% higher
    } else if (month >= 9 && month <= 11) { // September to November
      return 1.0; // Normal
    } else { // December to February
      return 0.7; // 30% lower
    }
  }

  private calculateTrend(historicalData: any): number {
    // Simplified trend calculation - would use more sophisticated analysis in production
    return historicalData.volatility < 0.2 ? 1.05 : 0.95; // 5% growth if stable, 5% decline if volatile
  }

  private calculateConfidence(historicalData: any): number {
    // Higher confidence for more data and lower volatility
    const dataConfidence = Math.min(historicalData.avgInflows + historicalData.avgOutflows, 100);
    const volatilityConfidence = Math.max(0, 100 - (historicalData.volatility * 100));
    
    return (dataConfidence + volatilityConfidence) / 2;
  }

  private async getCurrentCashBalance(): Promise<number> {
    // Simplified calculation - would integrate with actual bank accounts
    const [totalInflows, totalOutflows] = await Promise.all([
      db.cashFlowEntry.aggregate({
        where: { type: 'INFLOW', isConfirmed: true },
        _sum: { amount: true },
      }),
      db.cashFlowEntry.aggregate({
        where: { type: 'OUTFLOW', isConfirmed: true },
        _sum: { amount: true },
      }),
    ]);

    const inflows = totalInflows._sum.amount?.toNumber() || 0;
    const outflows = totalOutflows._sum.amount?.toNumber() || 0;
    
    return Math.max(0, inflows - outflows);
  }

  private async calculateProjectedBalance(days: number): Promise<number> {
    const currentBalance = await this.getCurrentCashBalance();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const [plannedInflows, plannedOutflows] = await Promise.all([
      db.cashFlowEntry.aggregate({
        where: {
          type: 'INFLOW',
          plannedDate: { gte: new Date(), lte: futureDate },
          status: 'Planned',
        },
        _sum: { amount: true },
      }),
      db.cashFlowEntry.aggregate({
        where: {
          type: 'OUTFLOW',
          plannedDate: { gte: new Date(), lte: futureDate },
          status: 'Planned',
        },
        _sum: { amount: true },
      }),
    ]);

    const projectedInflows = plannedInflows._sum.amount?.toNumber() || 0;
    const projectedOutflows = plannedOutflows._sum.amount?.toNumber() || 0;

    return currentBalance + projectedInflows - projectedOutflows;
  }

  private async getFinancialData(reportDate: Date): Promise<{
    cash: number;
    accountsReceivable: number;
    inventory: number;
    otherCurrentAssets: number;
    accountsPayable: number;
    shortTermDebt: number;
    accruedExpenses: number;
    otherCurrentLiabilities: number;
  }> {
    // Simplified financial data calculation
    // In production, this would integrate with accounting systems
    
    const cash = await this.getCurrentCashBalance();
    
    // Estimate accounts receivable from pending payments
    const pendingPayments = await db.transaction.aggregate({
      where: {
        status: 'PENDING',
        createdAt: { lte: reportDate },
      },
      _sum: { amount: true },
    });

    return {
      cash,
      accountsReceivable: pendingPayments._sum.amount?.toNumber() || 0,
      inventory: 50000, // Simplified - would be calculated from equipment inventory
      otherCurrentAssets: 25000,
      accountsPayable: 30000, // Simplified - would be calculated from pending vendor payments
      shortTermDebt: 15000,
      accruedExpenses: 10000,
      otherCurrentLiabilities: 5000,
    };
  }

  private async getAnnualRevenue(reportDate: Date): Promise<number> {
    const yearStart = new Date(reportDate.getFullYear(), 0, 1);
    const yearEnd = new Date(reportDate.getFullYear(), 11, 31);

    const revenueData = await db.transaction.aggregate({
      where: {
        transactionType: 'JOB_PAYMENT',
        status: 'COMPLETED',
        completedAt: { gte: yearStart, lte: yearEnd },
      },
      _sum: { amount: true },
    });

    return revenueData._sum.amount?.toNumber() || 0;
  }
}

export const cashFlowManagementService = new CashFlowManagementService();
