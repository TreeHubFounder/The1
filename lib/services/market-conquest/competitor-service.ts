
import { PrismaClient } from '@prisma/client';
import { CompetitorType, CompetitorThreatLevel } from '@prisma/client';

const prisma = new PrismaClient();

export interface CompetitorData {
  name: string;
  type: CompetitorType;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  serviceRadius?: number;
  serviceAreas?: string[];
  estimatedRevenue?: number;
  employeeCount?: number;
  yearsInBusiness?: number;
  serviceTypes?: string[];
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
}

export interface CompetitorAnalysisData {
  competitorId: string;
  analysisType: string;
  findings: any;
  recommendations?: string[];
  ourAdvantages?: string[];
  theirAdvantages?: string[];
  actionItems?: string[];
  priority?: string;
  analyzedById?: string;
}

export class CompetitorService {
  // Major Bucks County competitors based on the strategy
  static readonly BUCKS_COUNTY_COMPETITORS = [
    'Rick\'s Expert Tree Service',
    'Advanced Tree Care',
    'ATS Tree Services',
    'Monster Tree Service',
    'Bartlett Tree Experts',
    'SavATree',
    'The Davey Tree Expert Company',
    'Asplundh Tree Expert Co',
    'Trees "R" Us',
    'Jenkintown Tree Care',
  ];

  // Add competitor to intelligence database
  static async addCompetitor(data: CompetitorData, territoryId?: string) {
    try {
      const competitor = await prisma.competitor.create({
        data: {
          ...data,
          threatLevel: this.calculateThreatLevel(data),
          territoryId,
          lastUpdated: new Date(),
          dataSource: 'Manual',
        },
      });

      return { success: true, competitor };
    } catch (error) {
      console.error('Error adding competitor:', error);
      return { success: false, error: 'Failed to add competitor' };
    }
  }

  // Get competitors by region/territory
  static async getCompetitors(filters?: {
    territoryId?: string;
    city?: string;
    state?: string;
    type?: CompetitorType;
    threatLevel?: CompetitorThreatLevel;
  }) {
    try {
      const competitors = await prisma.competitor.findMany({
        where: filters,
        include: {
          territory: true,
          competitorAnalysis: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          _count: {
            select: {
              competitorAnalysis: true,
            },
          },
        },
        orderBy: [
          { threatLevel: 'desc' },
          { estimatedRevenue: 'desc' },
        ],
      });

      return { success: true, competitors };
    } catch (error) {
      console.error('Error fetching competitors:', error);
      return { success: false, error: 'Failed to fetch competitors' };
    }
  }

  // Get Bucks County competitive landscape
  static async getBucksCountyCompetitors() {
    try {
      const competitors = await this.getCompetitors({
        state: 'PA',
      });

      if (!competitors.success) {
        return competitors;
      }

      // Filter for Bucks County area
      const bucksCountyCompetitors = competitors.competitors?.filter(c => 
        c.city?.includes('Bucks') || 
        c.serviceAreas?.some(area => area.toLowerCase().includes('bucks')) ||
        this.BUCKS_COUNTY_COMPETITORS.some(name => 
          c.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(c.name.toLowerCase())
        )
      );

      const competitiveAnalysis = {
        totalCompetitors: bucksCountyCompetitors?.length || 0,
        majorThreatCount: bucksCountyCompetitors?.filter(c => 
          ['HIGH', 'CRITICAL'].includes(c.threatLevel)
        ).length || 0,
        totalEstimatedRevenue: bucksCountyCompetitors?.reduce((sum, c) => 
          sum + (c.estimatedRevenue || 0), 0
        ) || 0,
        averageEmployeeCount: bucksCountyCompetitors?.reduce((sum, c) => 
          sum + (c.employeeCount || 0), 0
        ) / (bucksCountyCompetitors?.length || 1),
        typeDistribution: bucksCountyCompetitors?.reduce((acc, c) => {
          acc[c.type] = (acc[c.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
      };

      return { 
        success: true, 
        competitors: bucksCountyCompetitors, 
        analysis: competitiveAnalysis 
      };
    } catch (error) {
      console.error('Error fetching Bucks County competitors:', error);
      return { success: false, error: 'Failed to fetch Bucks County competitors' };
    }
  }

  // Create competitor analysis
  static async createAnalysis(data: CompetitorAnalysisData) {
    try {
      const analysis = await prisma.competitorAnalysis.create({
        data,
        include: {
          competitor: true,
          analyzedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return { success: true, analysis };
    } catch (error) {
      console.error('Error creating competitor analysis:', error);
      return { success: false, error: 'Failed to create competitor analysis' };
    }
  }

  // Pricing intelligence analysis
  static async analyzePricing(competitorId: string, serviceType: string, ourPrice: number) {
    try {
      const competitor = await prisma.competitor.findUnique({
        where: { id: competitorId },
      });

      if (!competitor) {
        return { success: false, error: 'Competitor not found' };
      }

      // Extract pricing data from competitor.pricing JSON
      const competitorPricing = competitor.pricing as any;
      const theirPrice = competitorPricing?.[serviceType] || 0;

      const bidGap = ourPrice - theirPrice;
      const bidGapPercentage = theirPrice > 0 ? (bidGap / theirPrice) * 100 : 0;

      const findings = {
        serviceType,
        ourPrice,
        theirPrice,
        bidGap,
        bidGapPercentage,
        competitive: Math.abs(bidGapPercentage) <= 15, // Within 15% is competitive
        advantage: bidGap < 0 ? 'price' : bidGap > 0 ? 'value' : 'equal',
      };

      const recommendations = [];
      if (bidGapPercentage > 20) {
        recommendations.push('Consider price reduction or value proposition enhancement');
      } else if (bidGapPercentage < -20) {
        recommendations.push('Opportunity to increase pricing while remaining competitive');
      } else {
        recommendations.push('Pricing is competitive - focus on service differentiation');
      }

      // Create analysis record
      const analysis = await this.createAnalysis({
        competitorId,
        analysisType: 'Pricing',
        findings,
        recommendations,
        priority: Math.abs(bidGapPercentage) > 20 ? 'High' : 'Medium',
      });

      // Update competitor bid gap
      await prisma.competitor.update({
        where: { id: competitorId },
        data: {
          averageBidGap: bidGap,
        },
      });

      return { success: true, analysis: analysis.analysis, findings };
    } catch (error) {
      console.error('Error analyzing pricing:', error);
      return { success: false, error: 'Failed to analyze pricing' };
    }
  }

  // Track job wins/losses against competitors
  static async trackJobOutcome(
    competitorId: string, 
    outcome: 'won' | 'lost', 
    jobValue: number,
    ourBid: number,
    theirBid?: number
  ) {
    try {
      const competitor = await prisma.competitor.findUnique({
        where: { id: competitorId },
      });

      if (!competitor) {
        return { success: false, error: 'Competitor not found' };
      }

      const updateData = outcome === 'won' 
        ? { jobsWonAgainst: competitor.jobsWonAgainst + 1 }
        : { jobsLostTo: competitor.jobsLostTo + 1 };

      // Update bid gap if we have their bid
      if (theirBid) {
        const newBidGap = ourBid - theirBid;
        updateData.averageBidGap = newBidGap;
      }

      const updatedCompetitor = await prisma.competitor.update({
        where: { id: competitorId },
        data: updateData,
      });

      // Create performance analysis
      const winRate = competitor.jobsWonAgainst / (competitor.jobsWonAgainst + competitor.jobsLostTo + 1);
      const analysis = await this.createAnalysis({
        competitorId,
        analysisType: 'Performance',
        findings: {
          jobOutcome: outcome,
          jobValue,
          ourBid,
          theirBid,
          winRate: winRate * 100,
        },
        recommendations: winRate < 0.5 
          ? ['Review pricing strategy', 'Analyze service differentiation opportunities']
          : ['Continue current competitive approach'],
        priority: winRate < 0.3 ? 'High' : 'Medium',
      });

      return { success: true, competitor: updatedCompetitor, winRate, analysis };
    } catch (error) {
      console.error('Error tracking job outcome:', error);
      return { success: false, error: 'Failed to track job outcome' };
    }
  }

  // Get competitive intelligence dashboard
  static async getCompetitiveDashboard(territoryId?: string) {
    try {
      const whereClause = territoryId ? { territoryId } : {};

      const competitors = await prisma.competitor.findMany({
        where: whereClause,
        include: {
          competitorAnalysis: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      const totalJobsAgainst = competitors.reduce((sum, c) => 
        sum + c.jobsWonAgainst + c.jobsLostTo, 0
      );
      const totalWins = competitors.reduce((sum, c) => sum + c.jobsWonAgainst, 0);
      const totalLosses = competitors.reduce((sum, c) => sum + c.jobsLostTo, 0);

      const dashboard = {
        totalCompetitors: competitors.length,
        threatDistribution: competitors.reduce((acc, c) => {
          acc[c.threatLevel] = (acc[c.threatLevel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        overallWinRate: totalJobsAgainst > 0 ? (totalWins / totalJobsAgainst) * 100 : 0,
        totalJobsCompeted: totalJobsAgainst,
        majorThreats: competitors.filter(c => 
          ['HIGH', 'CRITICAL'].includes(c.threatLevel)
        ),
        recentAnalyses: competitors
          .filter(c => c.competitorAnalysis.length > 0)
          .map(c => ({
            competitor: c.name,
            lastAnalysis: c.competitorAnalysis[0],
          }))
          .slice(0, 5),
        marketShare: {
          estimatedTotal: competitors.reduce((sum, c) => sum + (c.estimatedRevenue || 0), 0),
          averageEmployees: competitors.reduce((sum, c) => sum + (c.employeeCount || 0), 0) / competitors.length,
        },
      };

      return { success: true, dashboard };
    } catch (error) {
      console.error('Error fetching competitive dashboard:', error);
      return { success: false, error: 'Failed to fetch competitive dashboard' };
    }
  }

  // Calculate threat level based on competitor data
  static calculateThreatLevel(data: CompetitorData): CompetitorThreatLevel {
    let score = 0;

    // Revenue factor (40% weight)
    if (data.estimatedRevenue) {
      if (data.estimatedRevenue > 5000000) score += 40; // $5M+
      else if (data.estimatedRevenue > 1000000) score += 30; // $1M+
      else if (data.estimatedRevenue > 500000) score += 20; // $500K+
      else score += 10;
    }

    // Employee count factor (30% weight)
    if (data.employeeCount) {
      if (data.employeeCount > 50) score += 30;
      else if (data.employeeCount > 20) score += 25;
      else if (data.employeeCount > 10) score += 20;
      else score += 15;
    }

    // Market presence factor (20% weight)
    if (data.serviceAreas && data.serviceAreas.length > 0) {
      score += Math.min(data.serviceAreas.length * 5, 20);
    }

    // Company type factor (10% weight)
    switch (data.type) {
      case 'NATIONAL_CHAIN':
        score += 10;
        break;
      case 'FRANCHISE':
        score += 8;
        break;
      case 'LOCAL_COMPANY':
        score += 6;
        break;
      default:
        score += 4;
    }

    // Determine threat level
    if (score >= 80) return CompetitorThreatLevel.CRITICAL;
    if (score >= 60) return CompetitorThreatLevel.HIGH;
    if (score >= 40) return CompetitorThreatLevel.MEDIUM;
    return CompetitorThreatLevel.LOW;
  }

  // Automated competitor monitoring (to be called periodically)
  static async monitorCompetitors() {
    try {
      const competitors = await prisma.competitor.findMany({
        where: {
          lastUpdated: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        },
      });

      const results = {
        monitored: 0,
        updated: 0,
        errors: [] as string[],
      };

      for (const competitor of competitors) {
        try {
          // Here you would implement web scraping or API calls
          // For now, we'll just update the lastUpdated timestamp
          await prisma.competitor.update({
            where: { id: competitor.id },
            data: {
              lastUpdated: new Date(),
            },
          });

          results.monitored++;
          results.updated++;
        } catch (error) {
          console.error(`Error monitoring competitor ${competitor.id}:`, error);
          results.errors.push(`Failed to monitor competitor ${competitor.name}`);
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error in competitor monitoring:', error);
      return { success: false, error: 'Failed to monitor competitors' };
    }
  }

  // Initialize Bucks County competitors
  static async initializeBucksCountyCompetitors() {
    try {
      const results = {
        created: 0,
        errors: [] as string[],
      };

      // Sample competitor data for major Bucks County players
      const competitorData = [
        {
          name: 'Rick\'s Expert Tree Service',
          type: CompetitorType.LOCAL_COMPANY,
          city: 'Doylestown',
          state: 'PA',
          serviceAreas: ['Bucks County', 'Montgomery County'],
          estimatedRevenue: 2500000,
          employeeCount: 25,
          yearsInBusiness: 35,
          serviceTypes: ['Tree Removal', 'Pruning', 'Storm Cleanup'],
          strengths: ['Long-established reputation', 'Local knowledge'],
          weaknesses: ['Limited technology', 'Aging equipment'],
        },
        {
          name: 'Advanced Tree Care',
          type: CompetitorType.LOCAL_COMPANY,
          city: 'Newtown',
          state: 'PA',
          serviceAreas: ['Bucks County', 'Philadelphia'],
          estimatedRevenue: 1800000,
          employeeCount: 18,
          yearsInBusiness: 20,
          serviceTypes: ['Tree Care', 'Landscape Services'],
          strengths: ['Professional certifications', 'Modern equipment'],
          weaknesses: ['Higher pricing', 'Limited emergency response'],
        },
        {
          name: 'Monster Tree Service',
          type: CompetitorType.FRANCHISE,
          city: 'Warrington',
          state: 'PA',
          serviceAreas: ['Bucks County', 'Montgomery County', 'Philadelphia'],
          estimatedRevenue: 3200000,
          employeeCount: 40,
          yearsInBusiness: 8,
          serviceTypes: ['Tree Removal', 'Stump Grinding', 'Emergency Services'],
          strengths: ['National brand', 'Franchise support', 'Marketing'],
          weaknesses: ['Corporate structure', 'Less personal service'],
        },
      ];

      for (const data of competitorData) {
        try {
          // Check if competitor already exists
          const existing = await prisma.competitor.findFirst({
            where: { name: data.name },
          });

          if (!existing) {
            await this.addCompetitor(data);
            results.created++;
          }
        } catch (error) {
          console.error(`Error creating competitor ${data.name}:`, error);
          results.errors.push(`Failed to create competitor ${data.name}`);
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error initializing Bucks County competitors:', error);
      return { success: false, error: 'Failed to initialize competitors' };
    }
  }
}
