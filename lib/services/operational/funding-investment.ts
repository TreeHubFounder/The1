
import { db } from '@/lib/db';
import type { 
  FundingRound,
  Investment,
  Investor,
  InvestorInteraction,
  RunwayCalculation,
  ValuationModel,
  FundingStage,
  FundingType,
  InvestorType
} from '@prisma/client';

export interface CreateFundingRoundData {
  roundName: string;
  stage: FundingStage;
  type: FundingType;
  targetAmount: number;
  valuation?: number;
  postMoneyValuation?: number;
  launchDate?: Date;
  targetCloseDate?: Date;
  useOfFunds: any;
}

export interface CreateInvestorData {
  name: string;
  type: InvestorType;
  email?: string;
  phone?: string;
  website?: string;
  minInvestment?: number;
  maxInvestment?: number;
  preferredStages?: string[];
  sectors?: string[];
  investmentThesis?: string;
  referredBy?: string;
}

export interface InvestmentData {
  amount: number;
  sharePrice?: number;
  sharesIssued?: number;
  equityPercentage?: number;
  liquidationPreference?: string;
  dividendRate?: number;
  votingRights?: boolean;
  boardSeat?: boolean;
  termSheet?: string;
  signedDocuments?: string[];
}

export interface FundraisingMetrics {
  totalRoundsActive: number;
  totalTargetAmount: number;
  totalRaisedAmount: number;
  averageRoundSize: number;
  fundraisingEfficiency: number;
  investorEngagement: number;
  timeToClose: number;
  conversionRate: number;
  currentValuation: number;
}

export interface InvestorPipeline {
  totalInvestors: number;
  prospectInvestors: number;
  engagedInvestors: number;
  committedInvestors: number;
  averageInvestmentSize: number;
  topInvestorTypes: Array<{
    type: string;
    count: number;
    totalInvestment: number;
  }>;
}

export interface RunwayProjection {
  currentCash: number;
  monthlyBurnRate: number;
  runwayMonths: number;
  runwayEndDate: Date;
  breakEvenMonth?: number;
  fundingMilestones: Array<{
    month: number;
    fundingRequired: number;
    purpose: string;
  }>;
}

export class FundingInvestmentService {
  // Funding Round Management
  async createFundingRound(data: CreateFundingRoundData): Promise<FundingRound> {
    return await db.fundingRound.create({
      data: {
        ...data,
        status: 'Planning',
        raisedAmount: 0,
      },
    });
  }

  async updateFundingRoundStatus(
    roundId: string,
    status: string,
    actualCloseDate?: Date
  ): Promise<FundingRound> {
    const updateData: any = { status };
    
    if (status === 'Closed' && actualCloseDate) {
      updateData.actualCloseDate = actualCloseDate;
    }

    return await db.fundingRound.update({
      where: { id: roundId },
      data: updateData,
      include: {
        investments: {
          include: { investor: true },
        },
      },
    });
  }

  async launchFundingRound(
    roundId: string,
    launchDate: Date = new Date()
  ): Promise<FundingRound> {
    return await db.fundingRound.update({
      where: { id: roundId },
      data: {
        status: 'Active',
        launchDate,
      },
    });
  }

  // Investment Management
  async recordInvestmentCommitment(
    roundId: string,
    investorId: string,
    investmentData: InvestmentData
  ): Promise<Investment> {
    const investment = await db.investment.create({
      data: {
        fundingRoundId: roundId,
        investorId,
        ...investmentData,
        status: 'Committed',
        votingRights: investmentData.votingRights ?? true,
        boardSeat: investmentData.boardSeat ?? false,
        signedDocuments: investmentData.signedDocuments || [],
      },
      include: {
        fundingRound: true,
        investor: true,
      },
    });

    // Update funding round raised amount
    await this.updateRoundRaisedAmount(roundId);

    return investment;
  }

  async updateInvestmentStatus(
    investmentId: string,
    status: string,
    fundingDate?: Date
  ): Promise<Investment> {
    const updateData: any = { status };
    
    if (status === 'Funded' && fundingDate) {
      updateData.fundingDate = fundingDate;
    }

    return await db.investment.update({
      where: { id: investmentId },
      data: updateData,
      include: {
        fundingRound: true,
        investor: true,
      },
    });
  }

  // Investor Management
  async createInvestor(data: CreateInvestorData): Promise<Investor> {
    return await db.investor.create({
      data: {
        ...data,
        relationshipStage: 'Prospect',
        totalInvestments: 0,
        successfulExits: 0,
        preferredStages: data.preferredStages || [],
        sectors: data.sectors || [],
      },
    });
  }

  async updateInvestorRelationshipStage(
    investorId: string,
    stage: string,
    notes?: string
  ): Promise<Investor> {
    const updateData: any = { relationshipStage: stage };
    
    if (notes) {
      updateData.notes = notes;
    }

    return await db.investor.update({
      where: { id: investorId },
      data: updateData,
    });
  }

  async recordInvestorInteraction(data: {
    investorId: string;
    interactionType: string;
    subject: string;
    description: string;
    outcome?: string;
    actionItems?: string[];
    nextSteps?: string[];
    followUpDate?: Date;
    internalParticipants?: string[];
    externalParticipants?: string[];
    documents?: string[];
    recordedById?: string;
    interactionDate?: Date;
  }): Promise<InvestorInteraction> {
    return await db.investorInteraction.create({
      data: {
        ...data,
        interactionDate: data.interactionDate || new Date(),
        actionItems: data.actionItems || [],
        nextSteps: data.nextSteps || [],
        internalParticipants: data.internalParticipants || [],
        externalParticipants: data.externalParticipants || [],
        documents: data.documents || [],
      },
      include: {
        investor: true,
        recordedBy: true,
      },
    });
  }

  async scheduleInvestorFollowUp(
    investorId: string,
    followUpDate: Date,
    primaryContact?: string
  ): Promise<Investor> {
    return await db.investor.update({
      where: { id: investorId },
      data: {
        nextFollowUp: followUpDate,
        primaryContact,
        lastContactDate: new Date(),
      },
    });
  }

  // Runway & Burn Rate Analysis
  async calculateRunway(data: {
    currentCash: number;
    monthlyBurnRate: number;
    monthlyRevenue?: number;
    revenueGrowthRate?: number;
    optimisticBurn?: number;
    pessimisticBurn?: number;
    nextFundingAmount?: number;
    nextFundingDate?: Date;
    minimumRunway?: number;
    scenario?: string;
    assumptions?: any;
  }): Promise<RunwayCalculation> {
    const runwayMonths = data.currentCash / data.monthlyBurnRate;
    const runwayEndDate = new Date();
    runwayEndDate.setMonth(runwayEndDate.getMonth() + Math.floor(runwayMonths));

    let optimisticRunway: number | undefined;
    let pessimisticRunway: number | undefined;
    let breakEvenMonth: number | undefined;

    if (data.optimisticBurn) {
      optimisticRunway = data.currentCash / data.optimisticBurn;
    }

    if (data.pessimisticBurn) {
      pessimisticRunway = data.currentCash / data.pessimisticBurn;
    }

    if (data.monthlyRevenue && data.revenueGrowthRate) {
      breakEvenMonth = this.calculateBreakEvenMonth(
        data.monthlyRevenue,
        data.revenueGrowthRate,
        data.monthlyBurnRate
      );
    }

    return await db.runwayCalculation.create({
      data: {
        currentCash: data.currentCash,
        monthlyBurnRate: data.monthlyBurnRate,
        runwayMonths,
        runwayEndDate,
        optimisticBurn: data.optimisticBurn,
        pessimisticBurn: data.pessimisticBurn,
        optimisticRunway,
        pessimisticRunway,
        monthlyRevenue: data.monthlyRevenue,
        revenueGrowthRate: data.revenueGrowthRate,
        breakEvenMonth,
        nextFundingAmount: data.nextFundingAmount,
        nextFundingDate: data.nextFundingDate,
        minimumRunway: data.minimumRunway,
        scenario: data.scenario || 'Current',
        assumptions: data.assumptions,
      },
    });
  }

  async updateBurnRate(
    calculationId: string,
    newBurnRate: number,
    reason?: string
  ): Promise<RunwayCalculation> {
    const calculation = await db.runwayCalculation.findUnique({
      where: { id: calculationId },
    });

    if (!calculation) {
      throw new Error('Runway calculation not found');
    }

    const newRunwayMonths = calculation.currentCash.toNumber() / newBurnRate;
    const newRunwayEndDate = new Date();
    newRunwayEndDate.setMonth(newRunwayEndDate.getMonth() + Math.floor(newRunwayMonths));

    return await db.runwayCalculation.update({
      where: { id: calculationId },
      data: {
        monthlyBurnRate: newBurnRate,
        runwayMonths: newRunwayMonths,
        runwayEndDate: newRunwayEndDate,
        assumptions: {
          ...calculation.assumptions as any,
          burnRateUpdate: {
            date: new Date(),
            oldRate: calculation.monthlyBurnRate.toNumber(),
            newRate: newBurnRate,
            reason,
          },
        },
      },
    });
  }

  // Valuation Models
  async createValuationModel(data: {
    modelName: string;
    valuationMethod: string;
    currentRevenue?: number;
    projectedRevenue?: any;
    growthRate?: number;
    profitMargins?: any;
    marketSize?: number;
    marketGrowthRate?: number;
    marketShare?: number;
    discountRate?: number;
    terminalGrowthRate?: number;
    assumptions?: any;
    purpose?: string;
  }): Promise<ValuationModel> {
    const model = await db.valuationModel.create({
      data: {
        ...data,
        valuationDate: new Date(),
      },
    });

    // Calculate valuation based on method
    await this.calculateValuation(model.id);

    return await db.valuationModel.findUnique({
      where: { id: model.id },
    })!;
  }

  async calculateValuation(modelId: string): Promise<ValuationModel> {
    const model = await db.valuationModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      throw new Error('Valuation model not found');
    }

    let baselineValuation: number | undefined;
    let optimisticValuation: number | undefined;
    let conservativeValuation: number | undefined;
    let revenueMultiple: number | undefined;
    let ebitdaMultiple: number | undefined;

    switch (model.valuationMethod) {
      case 'DCF':
        const dcfResults = this.calculateDCFValuation(model);
        baselineValuation = dcfResults.baseline;
        optimisticValuation = dcfResults.optimistic;
        conservativeValuation = dcfResults.conservative;
        break;

      case 'Comparable_Companies':
        const compResults = this.calculateComparableValuation(model);
        baselineValuation = compResults.valuation;
        revenueMultiple = compResults.revenueMultiple;
        ebitdaMultiple = compResults.ebitdaMultiple;
        optimisticValuation = baselineValuation * 1.25;
        conservativeValuation = baselineValuation * 0.75;
        break;

      case 'Revenue_Multiple':
        const revenue = model.currentRevenue?.toNumber() || 0;
        const multiple = this.getRevenueMultipleForIndustry('tree_services');
        baselineValuation = revenue * multiple;
        revenueMultiple = multiple;
        optimisticValuation = baselineValuation * 1.3;
        conservativeValuation = baselineValuation * 0.7;
        break;
    }

    return await db.valuationModel.update({
      where: { id: modelId },
      data: {
        baselineValuation,
        optimisticValuation,
        conservativeValuation,
        revenueMultiple,
        ebitdaMultiple,
      },
    });
  }

  // Analytics & Metrics
  async getFundraisingMetrics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<FundraisingMetrics> {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = dateFrom;
      if (dateTo) whereClause.createdAt.lte = dateTo;
    }

    const [
      totalRoundsActive,
      roundData,
      investmentData,
      roundMetrics,
    ] = await Promise.all([
      db.fundingRound.count({
        where: { ...whereClause, status: { in: ['Planning', 'Active'] } },
      }),
      db.fundingRound.aggregate({
        where: whereClause,
        _sum: { targetAmount: true, raisedAmount: true },
        _avg: { targetAmount: true },
      }),
      db.investment.findMany({
        where: {
          fundingRound: whereClause,
          status: { in: ['Committed', 'Signed', 'Funded'] },
        },
        include: { fundingRound: true },
      }),
      db.fundingRound.findMany({
        where: {
          ...whereClause,
          status: 'Closed',
          launchDate: { not: null },
          actualCloseDate: { not: null },
        },
        select: { launchDate: true, actualCloseDate: true },
      }),
    ]);

    const totalTargetAmount = roundData._sum.targetAmount?.toNumber() || 0;
    const totalRaisedAmount = roundData._sum.raisedAmount?.toNumber() || 0;
    const averageRoundSize = roundData._avg.targetAmount?.toNumber() || 0;

    const fundraisingEfficiency = totalTargetAmount > 0 
      ? (totalRaisedAmount / totalTargetAmount) * 100 
      : 0;

    const totalCommitments = investmentData.length;
    const totalFunded = investmentData.filter(i => i.status === 'Funded').length;
    const conversionRate = totalCommitments > 0 ? (totalFunded / totalCommitments) * 100 : 0;

    const timeToClose = roundMetrics.length > 0
      ? roundMetrics.reduce((total, round) => {
          if (round.launchDate && round.actualCloseDate) {
            const days = Math.ceil(
              (round.actualCloseDate.getTime() - round.launchDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            return total + days;
          }
          return total;
        }, 0) / roundMetrics.length
      : 0;

    const investorEngagement = await this.calculateInvestorEngagement(dateFrom, dateTo);
    const currentValuation = await this.getCurrentValuation();

    return {
      totalRoundsActive,
      totalTargetAmount,
      totalRaisedAmount,
      averageRoundSize,
      fundraisingEfficiency,
      investorEngagement,
      timeToClose,
      conversionRate,
      currentValuation,
    };
  }

  async getInvestorPipeline(): Promise<InvestorPipeline> {
    const [
      totalInvestors,
      prospectInvestors,
      engagedInvestors,
      committedInvestors,
      investmentData,
      investorTypeData,
    ] = await Promise.all([
      db.investor.count(),
      db.investor.count({ where: { relationshipStage: 'Prospect' } }),
      db.investor.count({
        where: { relationshipStage: { in: ['Initial_Contact', 'Due_Diligence'] } },
      }),
      db.investor.count({ where: { relationshipStage: 'Investor' } }),
      db.investment.aggregate({
        where: { status: { in: ['Committed', 'Signed', 'Funded'] } },
        _avg: { amount: true },
      }),
      db.investor.groupBy({
        by: ['type'],
        _count: true,
      }),
    ]);

    const averageInvestmentSize = investmentData._avg.amount?.toNumber() || 0;

    // Get total investment by type
    const investmentsByType = await Promise.all(
      investorTypeData.map(async (typeData) => {
        const totalInvestment = await db.investment.aggregate({
          where: {
            investor: { type: typeData.type },
            status: { in: ['Committed', 'Signed', 'Funded'] },
          },
          _sum: { amount: true },
        });

        return {
          type: typeData.type,
          count: typeData._count,
          totalInvestment: totalInvestment._sum.amount?.toNumber() || 0,
        };
      })
    );

    return {
      totalInvestors,
      prospectInvestors,
      engagedInvestors,
      committedInvestors,
      averageInvestmentSize,
      topInvestorTypes: investmentsByType.sort((a, b) => b.totalInvestment - a.totalInvestment),
    };
  }

  async getRunwayProjection(): Promise<RunwayProjection> {
    const latestCalculation = await db.runwayCalculation.findFirst({
      orderBy: { calculationDate: 'desc' },
    });

    if (!latestCalculation) {
      throw new Error('No runway calculation found');
    }

    const currentCash = latestCalculation.currentCash.toNumber();
    const monthlyBurnRate = latestCalculation.monthlyBurnRate.toNumber();
    const runwayMonths = latestCalculation.runwayMonths.toNumber();
    const runwayEndDate = latestCalculation.runwayEndDate;
    const breakEvenMonth = latestCalculation.breakEvenMonth;

    // Generate funding milestones
    const fundingMilestones = [];
    
    if (runwayMonths < 18) { // Less than 18 months runway
      fundingMilestones.push({
        month: Math.max(1, Math.floor(runwayMonths * 0.6)), // Start fundraising at 60% of runway
        fundingRequired: monthlyBurnRate * 24, // 24 months of runway
        purpose: 'Series A - Growth and market expansion',
      });
    }

    if (runwayMonths < 6) { // Less than 6 months runway - urgent
      fundingMilestones.push({
        month: 1,
        fundingRequired: monthlyBurnRate * 12, // 12 months minimum
        purpose: 'Bridge funding - Immediate operational needs',
      });
    }

    return {
      currentCash,
      monthlyBurnRate,
      runwayMonths,
      runwayEndDate,
      breakEvenMonth: breakEvenMonth || undefined,
      fundingMilestones,
    };
  }

  // Private Helper Methods
  private async updateRoundRaisedAmount(roundId: string): Promise<void> {
    const investmentSum = await db.investment.aggregate({
      where: {
        fundingRoundId: roundId,
        status: { in: ['Committed', 'Signed', 'Funded'] },
      },
      _sum: { amount: true },
    });

    await db.fundingRound.update({
      where: { id: roundId },
      data: {
        raisedAmount: investmentSum._sum.amount || 0,
      },
    });
  }

  private calculateBreakEvenMonth(
    monthlyRevenue: number,
    revenueGrowthRate: number,
    monthlyBurnRate: number
  ): number {
    let revenue = monthlyRevenue;
    let month = 0;

    while (revenue < monthlyBurnRate && month < 60) { // Max 5 years
      month++;
      revenue = revenue * (1 + revenueGrowthRate / 100);
    }

    return month < 60 ? month : 0; // Return 0 if break-even not achievable in 5 years
  }

  private calculateDCFValuation(model: ValuationModel): {
    baseline: number;
    optimistic: number;
    conservative: number;
  } {
    const currentRevenue = model.currentRevenue?.toNumber() || 0;
    const growthRate = model.growthRate?.toNumber() || 15; // 15% default
    const discountRate = model.discountRate?.toNumber() || 12; // 12% default
    const terminalGrowthRate = model.terminalGrowthRate?.toNumber() || 3; // 3% default

    // 5-year DCF projection
    let totalPV = 0;
    let revenue = currentRevenue;

    for (let year = 1; year <= 5; year++) {
      revenue = revenue * (1 + growthRate / 100);
      const ebitda = revenue * 0.25; // 25% EBITDA margin assumption
      const fcf = ebitda * 0.8; // 80% conversion to FCF
      const pv = fcf / Math.pow(1 + discountRate / 100, year);
      totalPV += pv;
    }

    // Terminal value
    const terminalFCF = revenue * 0.25 * 0.8 * (1 + terminalGrowthRate / 100);
    const terminalValue = terminalFCF / (discountRate / 100 - terminalGrowthRate / 100);
    const terminalPV = terminalValue / Math.pow(1 + discountRate / 100, 5);

    const baseline = totalPV + terminalPV;

    return {
      baseline,
      optimistic: baseline * 1.4, // 40% premium
      conservative: baseline * 0.7, // 30% discount
    };
  }

  private calculateComparableValuation(model: ValuationModel): {
    valuation: number;
    revenueMultiple: number;
    ebitdaMultiple: number;
  } {
    const currentRevenue = model.currentRevenue?.toNumber() || 0;
    
    // Industry multiples for tree services/landscaping
    const revenueMultiple = 2.5; // 2.5x revenue
    const ebitdaMultiple = 8.0; // 8x EBITDA

    const revenueValuation = currentRevenue * revenueMultiple;
    const ebitda = currentRevenue * 0.25; // 25% EBITDA margin
    const ebitdaValuation = ebitda * ebitdaMultiple;

    const valuation = (revenueValuation + ebitdaValuation) / 2; // Average of both methods

    return {
      valuation,
      revenueMultiple,
      ebitdaMultiple,
    };
  }

  private getRevenueMultipleForIndustry(industry: string): number {
    // Industry-specific revenue multiples
    const multiples: Record<string, number> = {
      'tree_services': 2.5,
      'landscaping': 2.0,
      'home_services': 3.0,
      'saas': 8.0,
      'marketplace': 5.0,
    };

    return multiples[industry] || 2.5;
  }

  private async calculateInvestorEngagement(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<number> {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.interactionDate = {};
      if (dateFrom) whereClause.interactionDate.gte = dateFrom;
      if (dateTo) whereClause.interactionDate.lte = dateTo;
    }

    const [totalInteractions, uniqueInvestors] = await Promise.all([
      db.investorInteraction.count({ where: whereClause }),
      db.investorInteraction.groupBy({
        by: ['investorId'],
        where: whereClause,
      }),
    ]);

    // Engagement score based on interactions per investor
    return uniqueInvestors.length > 0 ? totalInteractions / uniqueInvestors.length : 0;
  }

  private async getCurrentValuation(): Promise<number> {
    const latestModel = await db.valuationModel.findFirst({
      orderBy: { valuationDate: 'desc' },
    });

    return latestModel?.baselineValuation?.toNumber() || 0;
  }
}

export const fundingInvestmentService = new FundingInvestmentService();
