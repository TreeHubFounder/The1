
import { db } from '@/lib/db';
import type { 
  CustomerAcquisition,
  MarketingCampaign,
  CustomerLifetimeValue,
  ViralGrowthMetrics,
  ReferralProgram,
  ReferralTracking,
  GrowthExperiment,
  ExperimentResult,
  MarketingChannel
} from '@prisma/client';

export interface CreateCustomerAcquisitionData {
  customerId: string;
  acquisitionChannel: MarketingChannel;
  acquisitionSource?: string;
  acquisitionCampaign?: string;
  acquisitionCost?: number;
  clickCost?: number;
  impressionCost?: number;
  firstTouchDate: Date;
  acquisitionDate: Date;
  firstPurchaseValue?: number;
  touchPoints?: any;
  lastTouchChannel?: MarketingChannel;
  assistingChannels?: string[];
  marketingCampaignId?: string;
}

export interface CampaignPerformance {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalRevenue: number;
  totalLeads: number;
  totalCustomers: number;
  averageCAC: number;
  averageLTV: number;
  averageROAS: number;
  bestPerformingChannel: string;
  conversionFunnel: {
    impressions: number;
    clicks: number;
    leads: number;
    customers: number;
    ctr: number;
    leadConversionRate: number;
    customerConversionRate: number;
  };
}

export interface GrowthMetrics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  monthlyGrowthRate: number;
  organicGrowthRate: number;
  viralCoefficient: number;
  customerChurnRate: number;
  netRevenueRetention: number;
  timeToPayback: number;
  ltvcacRatio: number;
}

export interface ExperimentSummary {
  totalExperiments: number;
  runningExperiments: number;
  completedExperiments: number;
  successfulExperiments: number;
  averageLift: number;
  totalImpact: number;
  experimentsWithSignificance: number;
  topWinningTests: Array<{
    name: string;
    lift: number;
    impact: number;
    confidence: number;
  }>;
}

export class CustomerAcquisitionGrowthService {
  // Customer Acquisition Management
  async recordCustomerAcquisition(data: CreateCustomerAcquisitionData): Promise<CustomerAcquisition> {
    const timeTocustomer = Math.ceil(
      (data.acquisitionDate.getTime() - data.firstTouchDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return await db.customerAcquisition.create({
      data: {
        ...data,
        timeTocustomer,
        totalLifetimeValue: data.firstPurchaseValue || 0,
        touchPoints: data.touchPoints || {},
        assistingChannels: data.assistingChannels || [],
      },
      include: {
        customer: true,
        marketingCampaign: true,
      },
    });
  }

  async updateCustomerLTV(
    customerId: string,
    additionalValue: number,
    predictedLtv?: number
  ): Promise<CustomerAcquisition> {
    return await db.customerAcquisition.update({
      where: { customerId },
      data: {
        totalLifetimeValue: { increment: additionalValue },
        predictedLtv,
      },
    });
  }

  async calculateCAC(
    campaignId?: string,
    channel?: MarketingChannel,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalSpend: number;
    totalCustomers: number;
    averageCAC: number;
    cacByChannel: Record<string, number>;
  }> {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.acquisitionDate = {};
      if (dateFrom) whereClause.acquisitionDate.gte = dateFrom;
      if (dateTo) whereClause.acquisitionDate.lte = dateTo;
    }
    if (campaignId) whereClause.marketingCampaignId = campaignId;
    if (channel) whereClause.acquisitionChannel = channel;

    const [acquisitions, campaignSpend] = await Promise.all([
      db.customerAcquisition.findMany({
        where: whereClause,
        select: {
          acquisitionCost: true,
          acquisitionChannel: true,
        },
      }),
      db.marketingCampaign.aggregate({
        where: campaignId ? { id: campaignId } : {},
        _sum: { actualSpend: true },
      }),
    ]);

    const totalSpend = campaignSpend._sum.actualSpend?.toNumber() || 
      acquisitions.reduce((sum, acq) => sum + (acq.acquisitionCost?.toNumber() || 0), 0);
    
    const totalCustomers = acquisitions.length;
    const averageCAC = totalCustomers > 0 ? totalSpend / totalCustomers : 0;

    // Calculate CAC by channel
    const channelData = acquisitions.reduce((acc, acq) => {
      const channel = acq.acquisitionChannel;
      if (!acc[channel]) {
        acc[channel] = { spend: 0, customers: 0 };
      }
      acc[channel].spend += acq.acquisitionCost?.toNumber() || 0;
      acc[channel].customers += 1;
      return acc;
    }, {} as Record<string, { spend: number; customers: number }>);

    const cacByChannel = Object.entries(channelData).reduce((acc, [channel, data]) => {
      acc[channel] = data.customers > 0 ? data.spend / data.customers : 0;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSpend,
      totalCustomers,
      averageCAC,
      cacByChannel,
    };
  }

  // Marketing Campaign Management
  async createMarketingCampaign(data: {
    name: string;
    type: string;
    channel: MarketingChannel;
    budget?: number;
    startDate: Date;
    endDate?: Date;
    targetAudience?: any;
    targetGeography?: string[];
    adCreatives?: string[];
    adCopy?: string[];
    landingPages?: string[];
    isAbTest?: boolean;
    testVariations?: any;
  }): Promise<MarketingCampaign> {
    return await db.marketingCampaign.create({
      data: {
        ...data,
        status: 'Planning',
        actualSpend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        leads: 0,
        customers: 0,
        targetGeography: data.targetGeography || [],
        adCreatives: data.adCreatives || [],
        adCopy: data.adCopy || [],
        landingPages: data.landingPages || [],
        isAbTest: data.isAbTest || false,
      },
    });
  }

  async updateCampaignPerformance(
    campaignId: string,
    data: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      leads?: number;
      customers?: number;
      actualSpend?: number;
    }
  ): Promise<MarketingCampaign> {
    const campaign = await db.marketingCampaign.update({
      where: { id: campaignId },
      data,
    });

    // Calculate derived metrics
    await this.calculateCampaignMetrics(campaignId);

    return campaign;
  }

  async launchCampaign(campaignId: string): Promise<MarketingCampaign> {
    return await db.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'Active',
      },
    });
  }

  async pauseCampaign(campaignId: string): Promise<MarketingCampaign> {
    return await db.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'Paused',
      },
    });
  }

  // Customer Lifetime Value Management
  async calculateCustomerLTV(customerId: string): Promise<CustomerLifetimeValue> {
    const [customer, orders, transactions] = await Promise.all([
      db.user.findUnique({ where: { id: customerId } }),
      db.job.findMany({
        where: { posterId: customerId, status: 'COMPLETED' },
        select: { createdAt: true },
      }),
      db.transaction.findMany({
        where: { 
          payerId: customerId,
          status: 'COMPLETED',
          transactionType: 'JOB_PAYMENT',
        },
        select: { amount: true, completedAt: true },
        orderBy: { completedAt: 'asc' },
      }),
    ]);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const totalOrders = orders.length;
    const totalSpent = transactions.reduce(
      (sum, t) => sum + t.amount.toNumber(),
      0
    );
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Calculate time-based metrics
    const customerSince = customer.createdAt;
    const monthsActive = Math.ceil(
      (new Date().getTime() - customerSince.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // Calculate purchase frequency
    const purchaseFrequency = monthsActive > 0 ? totalOrders / monthsActive : 0;
    
    // Calculate days between orders
    let daysBetweenOrders: number | undefined;
    if (transactions.length > 1) {
      const intervals = [];
      for (let i = 1; i < transactions.length; i++) {
        const days = Math.ceil(
          (transactions[i].completedAt!.getTime() - transactions[i-1].completedAt!.getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        intervals.push(days);
      }
      daysBetweenOrders = intervals.reduce((sum, days) => sum + days, 0) / intervals.length;
    }

    // Calculate LTV predictions
    const currentLtv = totalSpent;
    const predictedLtv = this.predictLTV(
      averageOrderValue,
      purchaseFrequency,
      monthsActive
    );

    // Calculate 12 and 24 month LTV
    const ltv12Month = averageOrderValue * purchaseFrequency * 12;
    const ltv24Month = averageOrderValue * purchaseFrequency * 24;

    // Calculate retention and churn
    const lastPurchaseDate = transactions.length > 0 
      ? transactions[transactions.length - 1].completedAt!
      : null;

    const daysSinceLastPurchase = lastPurchaseDate
      ? Math.ceil((new Date().getTime() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const churnProbability = this.calculateChurnProbability(
      daysSinceLastPurchase,
      daysBetweenOrders || 30
    );

    const retentionRate = Math.max(0, 100 - (churnProbability * 100));

    // Customer segmentation
    let customerSegment: string;
    if (currentLtv >= 5000) customerSegment = 'High_Value';
    else if (currentLtv >= 2000) customerSegment = 'Medium_Value';
    else customerSegment = 'Low_Value';

    let riskLevel: string;
    if (churnProbability >= 0.7) riskLevel = 'High';
    else if (churnProbability >= 0.4) riskLevel = 'Medium';
    else riskLevel = 'Low';

    // Create or update LTV record
    const ltvData = {
      customerId,
      currentLtv,
      predictedLtv,
      ltv12Month,
      ltv24Month,
      totalOrders,
      totalSpent,
      averageOrderValue,
      purchaseFrequency,
      daysBetweenOrders,
      lastPurchaseDate,
      monthsActive,
      retentionRate,
      churnProbability,
      customerSegment,
      riskLevel,
      grossMargin: 25, // Simplified - 25% margin
      serviceCosts: totalSpent * 0.1, // 10% service costs
      netLtv: currentLtv * 0.15, // Net LTV after costs
      engagementScore: this.calculateEngagementScore(totalOrders, monthsActive),
      satisfactionScore: await this.getCustomerSatisfactionScore(customerId),
      referralCount: await this.getCustomerReferralCount(customerId),
      lastCalculatedAt: new Date(),
      calculationMethod: 'Historical',
      customerSince,
    };

    const existingLTV = await db.customerLifetimeValue.findUnique({
      where: { customerId },
    });

    if (existingLTV) {
      return await db.customerLifetimeValue.update({
        where: { customerId },
        data: ltvData,
      });
    } else {
      return await db.customerLifetimeValue.create({
        data: ltvData,
      });
    }
  }

  // Viral Growth & Referral Management
  async createReferralProgram(data: {
    programName: string;
    programType: string;
    referrerReward?: number;
    refereeReward?: number;
    rewardType: string;
    eligibilityCriteria?: any;
    minimumPurchase?: number;
    trackingMethod?: string;
    autoReward?: boolean;
    rewardDelay?: number;
    startDate: Date;
    endDate?: Date;
  }): Promise<ReferralProgram> {
    return await db.referralProgram.create({
      data: {
        ...data,
        status: 'Active',
        totalReferrals: 0,
        successfulReferrals: 0,
        totalRewards: 0,
        rewardsPaid: 0,
        autoReward: data.autoReward ?? true,
      },
    });
  }

  async createReferralTracking(data: {
    programId: string;
    referrerId: string;
    refereeEmail?: string;
    referralCode?: string;
    referralLink?: string;
  }): Promise<ReferralTracking> {
    const referralCode = data.referralCode || this.generateReferralCode();
    const referralLink = data.referralLink || 
      `https://treehub.com/signup?ref=${referralCode}`;

    return await db.referralTracking.create({
      data: {
        programId: data.programId,
        referrerId: data.referrerId,
        refereeEmail: data.refereeEmail,
        referralCode,
        referralLink,
        status: 'Pending',
        clickCount: 0,
      },
    });
  }

  async trackReferralClick(referralCode: string): Promise<void> {
    const referral = await db.referralTracking.findUnique({
      where: { referralCode },
    });

    if (referral) {
      await db.referralTracking.update({
        where: { referralCode },
        data: {
          clickCount: { increment: 1 },
          firstClickDate: referral.firstClickDate || new Date(),
        },
      });
    }
  }

  async convertReferral(
    referralCode: string,
    refereeId: string,
    referralValue: number
  ): Promise<ReferralTracking> {
    const referral = await db.referralTracking.update({
      where: { referralCode },
      data: {
        refereeId,
        status: 'Completed',
        conversionDate: new Date(),
        referralValue,
      },
      include: { program: true },
    });

    // Award rewards
    await this.awardReferralRewards(referral.id);

    // Update program statistics
    await this.updateReferralProgramStats(referral.programId);

    return referral;
  }

  async recordViralGrowthMetrics(data: {
    period: string;
    periodStart: Date;
    periodEnd: Date;
    invitesSent?: number;
    invitesAccepted?: number;
    referralsSent?: number;
    referralsConverted?: number;
    shareCount?: number;
    socialShares?: any;
    organicMentions?: number;
    userGeneratedContent?: number;
    organicSignups?: number;
    referredSignups?: number;
  }): Promise<ViralGrowthMetrics> {
    const viralCoefficient = this.calculateViralCoefficient(
      data.invitesSent || 0,
      data.invitesAccepted || 0
    );

    const invitationRate = data.invitesSent && data.invitesSent > 0
      ? (data.invitesSent / 100) * 100 // Percentage of users who invite
      : 0;

    const acceptanceRate = data.invitesSent && data.invitesSent > 0
      ? ((data.invitesAccepted || 0) / data.invitesSent) * 100
      : 0;

    const referralConversionRate = data.referralsSent && data.referralsSent > 0
      ? ((data.referralsConverted || 0) / data.referralsSent) * 100
      : 0;

    const totalSignups = (data.organicSignups || 0) + (data.referredSignups || 0);
    const viralityPercentage = totalSignups > 0
      ? ((data.referredSignups || 0) / totalSignups) * 100
      : 0;

    return await db.viralGrowthMetrics.create({
      data: {
        ...data,
        viralCoefficient,
        invitationRate,
        acceptanceRate,
        referralConversionRate,
        referralValue: 0, // Would be calculated from actual referral values
        socialShares: data.socialShares || {},
        activationToShare: 0, // Would be calculated from user behavior
        shareToSignup: 0,
        signupToActivation: 0,
        amplificationFactor: 1.5, // Average shares per user
        reachMultiplier: 2.0, // Reach expansion factor
        viralityPercentage,
      },
    });
  }

  // Growth Experimentation
  async createGrowthExperiment(data: {
    name: string;
    hypothesis: string;
    description: string;
    type: string;
    variants: any;
    trafficAllocation: any;
    successMetrics: string[];
    plannedStartDate: Date;
    plannedEndDate: Date;
    targetAudience?: any;
    sampleSize?: number;
    minimumRunTime?: number;
  }): Promise<GrowthExperiment> {
    return await db.growthExperiment.create({
      data: {
        ...data,
        status: 'Planning',
        statisticalSignificance: false,
        keyLearnings: [],
        recommendations: [],
        nextSteps: [],
      },
    });
  }

  async startExperiment(experimentId: string): Promise<GrowthExperiment> {
    return await db.growthExperiment.update({
      where: { id: experimentId },
      data: {
        status: 'Running',
        actualStartDate: new Date(),
      },
    });
  }

  async recordExperimentResult(
    experimentId: string,
    variant: string,
    metric: string,
    value: number,
    sampleSize: number,
    baselineValue?: number
  ): Promise<ExperimentResult> {
    const absoluteLift = baselineValue ? value - baselineValue : 0;
    const relativeLift = baselineValue && baselineValue > 0
      ? ((value - baselineValue) / baselineValue) * 100
      : 0;

    const conversionRate = sampleSize > 0 ? (value / sampleSize) * 100 : 0;

    // Simplified statistical significance calculation
    const isSignificant = Math.abs(relativeLift) >= 5 && sampleSize >= 100;
    const pValue = isSignificant ? 0.03 : 0.15; // Simplified

    const result = await db.experimentResult.create({
      data: {
        experimentId,
        variant,
        metric,
        value,
        sampleSize,
        conversionRate,
        baselineValue,
        absoluteLift,
        relativeLift,
        pValue,
        isSignificant,
        confidenceInterval: isSignificant 
          ? { lower: relativeLift - 2, upper: relativeLift + 2 }
          : null,
      },
    });

    // Update experiment with results
    await this.updateExperimentWithResults(experimentId);

    return result;
  }

  async completeExperiment(
    experimentId: string,
    winningVariant?: string,
    keyLearnings: string[] = [],
    recommendations: string[] = [],
    nextSteps: string[] = []
  ): Promise<GrowthExperiment> {
    return await db.growthExperiment.update({
      where: { id: experimentId },
      data: {
        status: 'Completed',
        actualEndDate: new Date(),
        winningVariant,
        keyLearnings,
        recommendations,
        nextSteps,
      },
    });
  }

  // Analytics & Reporting
  async getCampaignPerformance(
    dateFrom?: Date,
    dateTo?: Date,
    channel?: MarketingChannel
  ): Promise<CampaignPerformance> {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.startDate = {};
      if (dateFrom) whereClause.startDate.gte = dateFrom;
      if (dateTo) whereClause.startDate.lte = dateTo;
    }
    if (channel) whereClause.channel = channel;

    const [campaigns, channelPerformance] = await Promise.all([
      db.marketingCampaign.findMany({
        where: whereClause,
        select: {
          status: true,
          actualSpend: true,
          impressions: true,
          clicks: true,
          leads: true,
          customers: true,
          channel: true,
          clickThroughRate: true,
          conversionRate: true,
          returnOnAdSpend: true,
        },
      }),
      db.marketingCampaign.groupBy({
        by: ['channel'],
        where: whereClause,
        _sum: { actualSpend: true, customers: true },
        _avg: { returnOnAdSpend: true },
      }),
    ]);

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
    const totalSpend = campaigns.reduce((sum, c) => sum + (c.actualSpend?.toNumber() || 0), 0);
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
    const totalCustomers = campaigns.reduce((sum, c) => sum + c.customers, 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);

    const averageCAC = totalCustomers > 0 ? totalSpend / totalCustomers : 0;
    const averageROAS = campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + (c.returnOnAdSpend?.toNumber() || 0), 0) / campaigns.length
      : 0;

    // Get LTV data for ROAS calculation
    const avgLTV = await this.getAverageLTV();
    const totalRevenue = totalCustomers * avgLTV;

    // Find best performing channel
    const bestChannel = channelPerformance.reduce((best, current) => {
      const currentROAS = current._avg.returnOnAdSpend?.toNumber() || 0;
      const bestROAS = best._avg.returnOnAdSpend?.toNumber() || 0;
      return currentROAS > bestROAS ? current : best;
    }, channelPerformance[0]);

    // Conversion funnel
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const leadConversionRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
    const customerConversionRate = totalLeads > 0 ? (totalCustomers / totalLeads) * 100 : 0;

    return {
      totalCampaigns,
      activeCampaigns,
      totalSpend,
      totalRevenue,
      totalLeads,
      totalCustomers,
      averageCAC,
      averageLTV: avgLTV,
      averageROAS,
      bestPerformingChannel: bestChannel?.channel || 'Unknown',
      conversionFunnel: {
        impressions: totalImpressions,
        clicks: totalClicks,
        leads: totalLeads,
        customers: totalCustomers,
        ctr,
        leadConversionRate,
        customerConversionRate,
      },
    };
  }

  async getGrowthMetrics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<GrowthMetrics> {
    const endDate = dateTo || new Date();
    const startDate = dateFrom || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));

    const [
      totalCustomers,
      newCustomersThisMonth,
      newCustomersPreviousMonth,
      organicCustomers,
      viralMetrics,
      churnData,
      ltvData,
      cacData,
    ] = await Promise.all([
      db.user.count({ where: { role: { in: ['HOMEOWNER', 'COMPANY'] } } }),
      db.customerAcquisition.count({
        where: { acquisitionDate: { gte: startDate, lte: endDate } },
      }),
      db.customerAcquisition.count({
        where: { acquisitionDate: { gte: previousPeriodStart, lt: startDate } },
      }),
      db.customerAcquisition.count({
        where: {
          acquisitionDate: { gte: startDate, lte: endDate },
          acquisitionChannel: 'SEO_ORGANIC',
        },
      }),
      db.viralGrowthMetrics.findFirst({
        where: { periodStart: { gte: startDate } },
        orderBy: { periodStart: 'desc' },
      }),
      this.calculateChurnRate(startDate, endDate),
      this.getAverageLTV(),
      this.getAverageCAC(),
    ]);

    const monthlyGrowthRate = newCustomersPreviousMonth > 0
      ? ((newCustomersThisMonth - newCustomersPreviousMonth) / newCustomersPreviousMonth) * 100
      : 0;

    const organicGrowthRate = newCustomersThisMonth > 0
      ? (organicCustomers / newCustomersThisMonth) * 100
      : 0;

    const viralCoefficient = viralMetrics?.viralCoefficient.toNumber() || 0;
    const netRevenueRetention = await this.calculateNRR(startDate, endDate);
    const timeToPayback = cacData > 0 && ltvData > 0 ? cacData / (ltvData / 12) : 0; // Months
    const ltvcacRatio = cacData > 0 ? ltvData / cacData : 0;

    return {
      totalCustomers,
      newCustomersThisMonth,
      monthlyGrowthRate,
      organicGrowthRate,
      viralCoefficient,
      customerChurnRate: churnData,
      netRevenueRetention,
      timeToPayback,
      ltvcacRatio,
    };
  }

  async getExperimentSummary(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ExperimentSummary> {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.plannedStartDate = {};
      if (dateFrom) whereClause.plannedStartDate.gte = dateFrom;
      if (dateTo) whereClause.plannedStartDate.lte = dateTo;
    }

    const [
      totalExperiments,
      runningExperiments,
      completedExperiments,
      experiments,
    ] = await Promise.all([
      db.growthExperiment.count({ where: whereClause }),
      db.growthExperiment.count({
        where: { ...whereClause, status: 'Running' },
      }),
      db.growthExperiment.count({
        where: { ...whereClause, status: 'Completed' },
      }),
      db.growthExperiment.findMany({
        where: whereClause,
        include: {
          results: true,
        },
      }),
    ]);

    const successfulExperiments = experiments.filter(exp => 
      exp.results.some(result => result.isSignificant && result.relativeLift && result.relativeLift.toNumber() > 0)
    ).length;

    const lifts = experiments
      .flatMap(exp => exp.results)
      .filter(result => result.relativeLift !== null)
      .map(result => result.relativeLift!.toNumber());

    const averageLift = lifts.length > 0
      ? lifts.reduce((sum, lift) => sum + lift, 0) / lifts.length
      : 0;

    const totalImpact = experiments.reduce((total, exp) => {
      const significantResults = exp.results.filter(r => r.isSignificant);
      return total + significantResults.reduce((sum, r) => sum + (r.value?.toNumber() || 0), 0);
    }, 0);

    const experimentsWithSignificance = experiments.filter(exp =>
      exp.results.some(result => result.isSignificant)
    ).length;

    const topWinningTests = experiments
      .filter(exp => exp.status === 'Completed' && exp.winningVariant)
      .map(exp => {
        const winningResult = exp.results.find(r => r.variant === exp.winningVariant);
        return {
          name: exp.name,
          lift: winningResult?.relativeLift?.toNumber() || 0,
          impact: winningResult?.value?.toNumber() || 0,
          confidence: winningResult?.isSignificant ? 95 : 80,
        };
      })
      .sort((a, b) => b.lift - a.lift)
      .slice(0, 5);

    return {
      totalExperiments,
      runningExperiments,
      completedExperiments,
      successfulExperiments,
      averageLift,
      totalImpact,
      experimentsWithSignificance,
      topWinningTests,
    };
  }

  // Private Helper Methods
  private predictLTV(
    averageOrderValue: number,
    purchaseFrequency: number,
    monthsActive: number
  ): number {
    // Simplified LTV prediction using historical data
    const monthlyValue = averageOrderValue * purchaseFrequency;
    const projectedLifespan = Math.max(12, monthsActive * 1.5); // Assume 50% growth in lifespan
    return monthlyValue * projectedLifespan;
  }

  private calculateChurnProbability(
    daysSinceLastPurchase: number,
    averageDaysBetweenOrders: number
  ): number {
    if (averageDaysBetweenOrders === 0) return 0;
    
    const expectedNextPurchase = averageDaysBetweenOrders * 1.5; // Give 50% buffer
    
    if (daysSinceLastPurchase <= averageDaysBetweenOrders) {
      return 0.1; // Low churn probability
    } else if (daysSinceLastPurchase <= expectedNextPurchase) {
      return 0.3; // Medium churn probability
    } else {
      return Math.min(0.9, 0.3 + (daysSinceLastPurchase - expectedNextPurchase) / 365);
    }
  }

  private calculateEngagementScore(totalOrders: number, monthsActive: number): number {
    if (monthsActive === 0) return 0;
    
    const ordersPerMonth = totalOrders / monthsActive;
    return Math.min(100, ordersPerMonth * 50); // Scale to 0-100
  }

  private async getCustomerSatisfactionScore(customerId: string): Promise<number> {
    const reviews = await db.review.findMany({
      where: { targetId: customerId },
      select: { rating: true },
    });

    if (reviews.length === 0) return 3.5; // Default neutral rating

    return reviews.reduce((sum, review) => sum + review.rating.toNumber(), 0) / reviews.length;
  }

  private async getCustomerReferralCount(customerId: string): Promise<number> {
    return await db.referralTracking.count({
      where: { 
        referrerId: customerId,
        status: 'Completed',
      },
    });
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private calculateViralCoefficient(invitesSent: number, invitesAccepted: number): number {
    if (invitesSent === 0) return 0;
    return invitesAccepted / invitesSent;
  }

  private async awardReferralRewards(referralId: string): Promise<void> {
    const referral = await db.referralTracking.findUnique({
      where: { id: referralId },
      include: { program: true },
    });

    if (!referral) return;

    const referrerReward = referral.program.referrerReward?.toNumber();
    const refereeReward = referral.program.refereeReward?.toNumber();

    await db.referralTracking.update({
      where: { id: referralId },
      data: {
        status: 'Rewarded',
        referrerReward,
        refereeReward,
      },
    });

    // Update program totals
    const rewardTotal = (referrerReward || 0) + (refereeReward || 0);
    await db.referralProgram.update({
      where: { id: referral.programId },
      data: {
        totalRewards: { increment: rewardTotal },
        rewardsPaid: { increment: rewardTotal },
      },
    });
  }

  private async updateReferralProgramStats(programId: string): Promise<void> {
    const [totalReferrals, successfulReferrals] = await Promise.all([
      db.referralTracking.count({ where: { programId } }),
      db.referralTracking.count({
        where: { programId, status: { in: ['Completed', 'Rewarded'] } },
      }),
    ]);

    const conversionRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;

    await db.referralProgram.update({
      where: { id: programId },
      data: {
        totalReferrals,
        successfulReferrals,
        conversionRate,
      },
    });
  }

  private async calculateCampaignMetrics(campaignId: string): Promise<void> {
    const campaign = await db.marketingCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) return;

    const impressions = campaign.impressions;
    const clicks = campaign.clicks;
    const conversions = campaign.conversions;
    const customers = campaign.customers;
    const actualSpend = campaign.actualSpend?.toNumber() || 0;

    // Calculate derived metrics
    const clickThroughRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const costPerClick = clicks > 0 ? actualSpend / clicks : 0;
    const costPerLead = conversions > 0 ? actualSpend / conversions : 0;
    const costPerAcquisition = customers > 0 ? actualSpend / customers : 0;

    // Get average LTV for ROAS calculation
    const avgLTV = await this.getAverageLTV();
    const totalRevenue = customers * avgLTV;
    const returnOnAdSpend = actualSpend > 0 ? (totalRevenue / actualSpend) * 100 : 0;

    await db.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        clickThroughRate,
        conversionRate,
        costPerClick,
        costPerLead,
        costPerAcquisition,
        returnOnAdSpend,
      },
    });
  }

  private async updateExperimentWithResults(experimentId: string): Promise<void> {
    const results = await db.experimentResult.findMany({
      where: { experimentId },
    });

    if (results.length === 0) return;

    const significantResults = results.filter(r => r.isSignificant);
    const statisticalSignificance = significantResults.length > 0;

    let winningVariant: string | undefined;
    let liftPercent: number | undefined;

    if (statisticalSignificance) {
      const bestResult = significantResults.reduce((best, current) => {
        const currentLift = current.relativeLift?.toNumber() || 0;
        const bestLift = best.relativeLift?.toNumber() || 0;
        return currentLift > bestLift ? current : best;
      });

      winningVariant = bestResult.variant;
      liftPercent = bestResult.relativeLift?.toNumber();
    }

    const confidenceLevel = statisticalSignificance ? 95 : 80;

    await db.growthExperiment.update({
      where: { id: experimentId },
      data: {
        statisticalSignificance,
        winningVariant,
        liftPercent,
        confidenceLevel,
      },
    });
  }

  private async getAverageLTV(): Promise<number> {
    const ltvData = await db.customerLifetimeValue.aggregate({
      _avg: { currentLtv: true },
    });

    return ltvData._avg.currentLtv?.toNumber() || 2000; // Default $2000 LTV
  }

  private async getAverageCAC(): Promise<number> {
    const cacData = await db.customerAcquisition.aggregate({
      _avg: { acquisitionCost: true },
    });

    return cacData._avg.acquisitionCost?.toNumber() || 100; // Default $100 CAC
  }

  private async calculateChurnRate(startDate: Date, endDate: Date): Promise<number> {
    const customersAtStart = await db.customerLifetimeValue.count({
      where: { customerSince: { lt: startDate } },
    });

    const churnedCustomers = await db.customerLifetimeValue.count({
      where: {
        customerSince: { lt: startDate },
        churnProbability: { gte: 0.7 },
      },
    });

    return customersAtStart > 0 ? (churnedCustomers / customersAtStart) * 100 : 0;
  }

  private async calculateNRR(startDate: Date, endDate: Date): Promise<number> {
    // Simplified Net Revenue Retention calculation
    const revenueAtStart = await this.getRevenueForPeriod(
      new Date(startDate.getTime() - 365 * 24 * 60 * 60 * 1000),
      startDate
    );

    const currentRevenue = await this.getRevenueForPeriod(startDate, endDate);

    return revenueAtStart > 0 ? (currentRevenue / revenueAtStart) * 100 : 100;
  }

  private async getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const revenueData = await db.transaction.aggregate({
      where: {
        transactionType: 'JOB_PAYMENT',
        status: 'COMPLETED',
        completedAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    return revenueData._sum.amount?.toNumber() || 0;
  }
}

export const customerAcquisitionGrowthService = new CustomerAcquisitionGrowthService();
