
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ConquestMetricsData {
  period: string;
  periodStart: Date;
  periodEnd: Date;
  region: string;
  zipCodesActive?: string[];
  professionalsRecruited?: number;
  totalRevenue?: number;
  subscriptionRevenue?: number;
  commissionRevenue?: number;
  partnershipRevenue?: number;
  stormSurgeRevenue?: number;
}

export interface RevenueProjection {
  timeframe: string;
  baseRevenue: number;
  stormSurgeMultiplier: number;
  projectedRevenue: number;
  confidenceLevel: number;
  assumptions: string[];
}

export class AnalyticsService {
  // Revenue projection constants based on the $940K-$1.12M strategy
  static readonly REVENUE_TARGETS = {
    monthly: {
      conservative: 78333, // $940K / 12
      aggressive: 93333,   // $1.12M / 12
    },
    annual: {
      conservative: 940000,
      aggressive: 1120000,
    },
    stormSurgeMultipliers: {
      minor: 1.5,
      moderate: 2.5,
      major: 4.0,
      extreme: 6.0,
    },
  };

  // Create or update conquest metrics
  static async updateConquestMetrics(data: ConquestMetricsData) {
    try {
      // Check if metrics exist for this period and region
      const existing = await prisma.marketConquestMetrics.findFirst({
        where: {
          period: data.period,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          region: data.region,
        },
      });

      const metrics = existing
        ? await prisma.marketConquestMetrics.update({
            where: { id: existing.id },
            data,
          })
        : await prisma.marketConquestMetrics.create({
            data,
          });

      return { success: true, metrics };
    } catch (error) {
      console.error('Error updating conquest metrics:', error);
      return { success: false, error: 'Failed to update conquest metrics' };
    }
  }

  // Calculate Bucks County market penetration
  static async calculateBucksCountyPenetration() {
    try {
      // Get Bucks County territories
      const territories = await prisma.territory.findMany({
        where: {
          county: 'Bucks',
          state: 'PA',
        },
        include: {
          territoryAssignments: {
            include: {
              professional: {
                include: {
                  tierStatus: true,
                },
              },
            },
          },
        },
      });

      // Calculate metrics
      const totalTerritories = territories.length;
      const protectedTerritories = territories.filter(t => t.isProtected).length;
      const assignedTerritories = territories.filter(t => t.territoryAssignments.length > 0).length;
      
      const penetrationRate = totalTerritories > 0 ? (assignedTerritories / totalTerritories) * 100 : 0;
      const protectionRate = totalTerritories > 0 ? (protectedTerritories / totalTerritories) * 100 : 0;

      // Professional tier distribution
      const allProfessionals = territories.flatMap(t => t.territoryAssignments.map(ta => ta.professional));
      const tierDistribution = allProfessionals.reduce((acc, pro) => {
        const tier = pro.tierStatus?.currentTier || 'BRONZE';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Revenue calculation
      const totalRevenue = territories.reduce((sum, t) => sum + Number(t.totalRevenue), 0);
      const averageRevenuePerTerritory = totalTerritories > 0 ? totalRevenue / totalTerritories : 0;

      // Market opportunity score
      const averageOpportunityScore = territories.reduce((sum, t) => 
        sum + (t.opportunityScore || 0), 0
      ) / territories.length;

      const penetrationAnalysis = {
        totalTerritories,
        assignedTerritories,
        protectedTerritories,
        penetrationRate,
        protectionRate,
        tierDistribution,
        totalRevenue,
        averageRevenuePerTerritory,
        averageOpportunityScore,
        marketValue: territories.reduce((sum, t) => 
          sum + (t.medianIncome || 0) * (t.households || 0), 0
        ),
      };

      return { success: true, analysis: penetrationAnalysis };
    } catch (error) {
      console.error('Error calculating Bucks County penetration:', error);
      return { success: false, error: 'Failed to calculate market penetration' };
    }
  }

  // Generate revenue projections with storm surge scenarios
  static async generateRevenueProjections(months: number = 12): Promise<{ success: boolean; projections?: RevenueProjection[]; error?: string }> {
    try {
      const projections: RevenueProjection[] = [];

      // Base scenario - normal operations
      const baseMonthlyRevenue = this.REVENUE_TARGETS.monthly.conservative;
      const aggressiveMonthlyRevenue = this.REVENUE_TARGETS.monthly.aggressive;

      // Conservative projection
      projections.push({
        timeframe: `${months} months (Conservative)`,
        baseRevenue: baseMonthlyRevenue * months,
        stormSurgeMultiplier: 1.0,
        projectedRevenue: baseMonthlyRevenue * months,
        confidenceLevel: 85,
        assumptions: [
          '75 active professionals by month 6',
          '25% market penetration in Bucks County',
          'No major storm events',
          'Steady property management growth',
        ],
      });

      // Aggressive projection
      projections.push({
        timeframe: `${months} months (Aggressive)`,
        baseRevenue: aggressiveMonthlyRevenue * months,
        stormSurgeMultiplier: 1.0,
        projectedRevenue: aggressiveMonthlyRevenue * months,
        confidenceLevel: 65,
        assumptions: [
          '100 active professionals by month 8',
          '40% market penetration in Bucks County',
          'Premium pricing strategy success',
          'Strong franchise inquiries',
        ],
      });

      // Storm surge scenarios
      const stormScenarios = [
        { name: 'Minor Storm Season', multiplier: this.REVENUE_TARGETS.stormSurgeMultipliers.minor, probability: 70 },
        { name: 'Moderate Storm Season', multiplier: this.REVENUE_TARGETS.stormSurgeMultipliers.moderate, probability: 40 },
        { name: 'Major Storm Event', multiplier: this.REVENUE_TARGETS.stormSurgeMultipliers.major, probability: 15 },
        { name: 'Extreme Weather Year', multiplier: this.REVENUE_TARGETS.stormSurgeMultipliers.extreme, probability: 5 },
      ];

      for (const scenario of stormScenarios) {
        const baseRevenue = baseMonthlyRevenue * months;
        const stormMonths = Math.ceil(months * 0.25); // 25% of months have storm impact
        const normalMonths = months - stormMonths;
        
        const projectedRevenue = (normalMonths * baseMonthlyRevenue) + 
                                (stormMonths * baseMonthlyRevenue * scenario.multiplier);

        projections.push({
          timeframe: `${months} months (${scenario.name})`,
          baseRevenue,
          stormSurgeMultiplier: scenario.multiplier,
          projectedRevenue,
          confidenceLevel: scenario.probability,
          assumptions: [
            `${scenario.name} affects ${stormMonths} months`,
            `${scenario.multiplier}x revenue during storm periods`,
            'Emergency response premium pricing',
            'Insurance partnership activation',
          ],
        });
      }

      return { success: true, projections };
    } catch (error) {
      console.error('Error generating revenue projections:', error);
      return { success: false, error: 'Failed to generate revenue projections' };
    }
  }

  // Calculate professional recruitment analytics
  static async calculateRecruitmentAnalytics() {
    try {
      // Get all professionals with tier status
      const professionals = await prisma.user.findMany({
        where: {
          role: 'PROFESSIONAL',
          status: 'ACTIVE',
        },
        include: {
          tierStatus: true,
          territoryAssignments: {
            include: {
              territory: true,
            },
          },
        },
      });

      // Time-based recruitment analysis
      const currentMonth = new Date();
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
      const threeMonthsAgo = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 3);

      const recruitmentMetrics = {
        total: professionals.length,
        thisMonth: professionals.filter(p => 
          new Date(p.createdAt) >= lastMonth
        ).length,
        lastThreeMonths: professionals.filter(p => 
          new Date(p.createdAt) >= threeMonthsAgo
        ).length,
        
        tierDistribution: professionals.reduce((acc, pro) => {
          const tier = pro.tierStatus?.currentTier || 'BRONZE';
          acc[tier] = (acc[tier] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),

        bucksCountyPros: professionals.filter(p => 
          p.territoryAssignments.some(ta => 
            ta.territory.county === 'Bucks' && ta.territory.state === 'PA'
          )
        ).length,

        averageMonthlyRevenue: professionals.reduce((sum, p) => 
          sum + Number(p.tierStatus?.monthlyRevenue || 0), 0
        ) / professionals.length,

        targetProgress: {
          target75: Math.min((professionals.length / 75) * 100, 100),
          target100: Math.min((professionals.length / 100) * 100, 100),
        },
      };

      return { success: true, metrics: recruitmentMetrics };
    } catch (error) {
      console.error('Error calculating recruitment analytics:', error);
      return { success: false, error: 'Failed to calculate recruitment analytics' };
    }
  }

  // Generate competitive analysis report
  static async generateCompetitiveAnalysis() {
    try {
      const competitors = await prisma.competitor.findMany({
        where: {
          OR: [
            { state: 'PA' },
            { serviceAreas: { hasSome: ['Bucks County', 'PA'] } },
          ],
        },
        include: {
          competitorAnalysis: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      const analysis = {
        totalCompetitors: competitors.length,
        threatLevelDistribution: competitors.reduce((acc, c) => {
          acc[c.threatLevel] = (acc[c.threatLevel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        
        marketShare: {
          totalMarketRevenue: competitors.reduce((sum, c) => sum + (c.estimatedRevenue || 0), 0),
          averageCompetitorRevenue: competitors.reduce((sum, c) => sum + (c.estimatedRevenue || 0), 0) / competitors.length,
          largestCompetitor: competitors.reduce((largest, c) => 
            (c.estimatedRevenue || 0) > (largest.estimatedRevenue || 0) ? c : largest
          , competitors[0]),
        },

        winLossRecord: {
          totalJobs: competitors.reduce((sum, c) => sum + c.jobsWonAgainst + c.jobsLostTo, 0),
          winRate: competitors.reduce((sum, c) => sum + c.jobsWonAgainst, 0) / 
                   competitors.reduce((sum, c) => sum + c.jobsWonAgainst + c.jobsLostTo, 1) * 100,
        },

        recentAnalyses: competitors
          .filter(c => c.competitorAnalysis.length > 0)
          .map(c => ({
            competitor: c.name,
            lastAnalysis: c.competitorAnalysis[0],
            threatLevel: c.threatLevel,
          }))
          .slice(0, 10),
      };

      return { success: true, analysis };
    } catch (error) {
      console.error('Error generating competitive analysis:', error);
      return { success: false, error: 'Failed to generate competitive analysis' };
    }
  }

  // Partnership performance analytics
  static async calculatePartnershipPerformance() {
    try {
      const partnerships = await prisma.strategicPartnership.findMany({
        include: {
          partnershipActivities: true,
        },
      });

      const propertyManagers = await prisma.propertyManager.findMany({
        include: {
          contracts: true,
        },
      });

      const performanceMetrics = {
        strategicPartnerships: {
          total: partnerships.length,
          active: partnerships.filter(p => p.status === 'ACTIVE').length,
          totalRevenue: partnerships.reduce((sum, p) => sum + Number(p.revenueGenerated), 0),
          totalLeads: partnerships.reduce((sum, p) => sum + p.leadsGenerated, 0),
          
          byType: {
            insurance: partnerships.filter(p => p.partnerType === 'INSURANCE_COMPANY').length,
            municipal: partnerships.filter(p => p.partnerType === 'MUNICIPAL_CONTRACT').length,
            franchise: partnerships.filter(p => p.partnerType === 'FRANCHISE_PARTNER').length,
          },
        },

        propertyManagement: {
          total: propertyManagers.length,
          activeContracts: propertyManagers.filter(pm => pm.contractStatus === 'ACTIVE').length,
          totalProperties: propertyManagers.reduce((sum, pm) => sum + (pm.propertiesManaged || 0), 0),
          totalRevenue: propertyManagers.reduce((sum, pm) => sum + Number(pm.totalRevenue), 0),
          averageContractValue: propertyManagers.reduce((sum, pm) => sum + (pm.contractValue || 0), 0) / propertyManagers.length,
        },

        monthlyTrends: {
          newPartnerships: partnerships.filter(p => 
            new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length,
          recentActivities: partnerships.reduce((sum, p) => 
            sum + p.partnershipActivities.filter(a => 
              new Date(a.activityDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            ).length, 0
          ),
        },
      };

      return { success: true, metrics: performanceMetrics };
    } catch (error) {
      console.error('Error calculating partnership performance:', error);
      return { success: false, error: 'Failed to calculate partnership performance' };
    }
  }

  // Generate comprehensive conquest dashboard
  static async generateConquestDashboard() {
    try {
      const [
        penetrationResult,
        revenueProjections,
        recruitmentResult,
        competitiveResult,
        partnershipResult,
      ] = await Promise.all([
        this.calculateBucksCountyPenetration(),
        this.generateRevenueProjections(12),
        this.calculateRecruitmentAnalytics(),
        this.generateCompetitiveAnalysis(),
        this.calculatePartnershipPerformance(),
      ]);

      // Calculate IPO readiness score
      const ipoReadinessFactors = {
        revenue: Math.min((revenueProjections.projections?.[0]?.projectedRevenue || 0) / 1000000, 1) * 25, // Max 25 points for $1M revenue
        marketPenetration: (penetrationResult.analysis?.penetrationRate || 0) / 100 * 20, // Max 20 points
        professionalsCount: Math.min((recruitmentResult.metrics?.total || 0) / 100, 1) * 20, // Max 20 points for 100 pros
        partnerships: Math.min((partnershipResult.metrics?.strategicPartnerships.active || 0) / 10, 1) * 15, // Max 15 points
        competitive: Math.min((competitiveResult.analysis?.winLossRecord.winRate || 0) / 100, 1) * 20, // Max 20 points
      };

      const ipoReadinessScore = Object.values(ipoReadinessFactors).reduce((sum, score) => sum + score, 0);

      const dashboard = {
        overview: {
          currentPhase: 'Bucks County Domination',
          targetRevenue: '$940K - $1.12M annually',
          ipoReadinessScore: Math.round(ipoReadinessScore),
          nextMilestone: 'Reach 75 active professionals',
        },
        
        marketPenetration: penetrationResult.success ? penetrationResult.analysis : null,
        revenueProjections: revenueProjections.success ? revenueProjections.projections : null,
        recruitment: recruitmentResult.success ? recruitmentResult.metrics : null,
        competitive: competitiveResult.success ? competitiveResult.analysis : null,
        partnerships: partnershipResult.success ? partnershipResult.metrics : null,
        
        keyMetrics: {
          monthlyRevenue: revenueProjections.projections?.[0]?.projectedRevenue ? 
                         revenueProjections.projections[0].projectedRevenue / 12 : 0,
          activeProfessionals: recruitmentResult.metrics?.total || 0,
          protectedTerritories: penetrationResult.analysis?.protectedTerritories || 0,
          activePartnerships: partnershipResult.metrics?.strategicPartnerships.active || 0,
          competitiveWinRate: competitiveResult.analysis?.winLossRecord.winRate || 0,
        },

        expansionReadiness: {
          score: Math.round(ipoReadinessScore * 0.8), // Expansion readiness is 80% of IPO readiness
          nextMarkets: ['Philadelphia', 'South Jersey', 'Delaware'],
          franchiseInquiries: 0, // TODO: Track franchise inquiries
          systemsReadiness: 75, // Platform and processes maturity
        },
      };

      return { success: true, dashboard };
    } catch (error) {
      console.error('Error generating conquest dashboard:', error);
      return { success: false, error: 'Failed to generate conquest dashboard' };
    }
  }

  // Monthly metrics update (automated process)
  static async updateMonthlyMetrics() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Collect all monthly data
      const [penetration, recruitment, partnerships] = await Promise.all([
        this.calculateBucksCountyPenetration(),
        this.calculateRecruitmentAnalytics(),
        this.calculatePartnershipPerformance(),
      ]);

      // Create monthly conquest metrics record
      const metricsData: ConquestMetricsData = {
        period: 'Monthly',
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        region: 'Bucks_County',
        zipCodesActive: [], // TODO: Get from territory data
        professionalsRecruited: recruitment.metrics?.thisMonth || 0,
        totalRevenue: penetration.analysis?.totalRevenue || 0,
        subscriptionRevenue: 0, // TODO: Calculate from AI subscriptions
        commissionRevenue: 0, // TODO: Calculate from job commissions
        partnershipRevenue: partnerships.metrics?.strategicPartnerships.totalRevenue || 0,
        stormSurgeRevenue: 0, // TODO: Calculate from storm response jobs
      };

      const updateResult = await this.updateConquestMetrics(metricsData);

      return { 
        success: updateResult.success, 
        metrics: updateResult.metrics,
        summary: {
          professionalsThisMonth: recruitment.metrics?.thisMonth,
          totalRevenue: penetration.analysis?.totalRevenue,
          activePartnerships: partnerships.metrics?.strategicPartnerships.active,
        }
      };
    } catch (error) {
      console.error('Error updating monthly metrics:', error);
      return { success: false, error: 'Failed to update monthly metrics' };
    }
  }
}
