
import { prisma } from '@/lib/db';

export class RevenueService {
  // Track lead conversion and revenue
  static async trackLeadConversion(leadId: string, jobValue: number): Promise<any> {
    try {
      const lead = await prisma.leadGeneration.findUnique({
        where: { id: leadId },
        include: { assignedContractor: true },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Update lead status
      await prisma.leadGeneration.update({
        where: { id: leadId },
        data: {
          status: 'Converted',
          conversionValue: jobValue,
          convertedAt: new Date(),
        },
      });

      // Calculate commission based on lead source
      const commissionRate = this.getCommissionRate(lead.source);
      const commission = jobValue * commissionRate;

      // Track revenue
      await prisma.revenueTracking.create({
        data: {
          source: 'Lead_Generation',
          sourceId: leadId,
          amount: commission,
          revenueType: 'Commission',
          category: 'Lead_Conversion',
          subcategory: lead.source,
          customerId: lead.assignedContractorId,
          profitMargin: 95, // High margin for lead generation
        },
      });

      // Update lead generation record
      await prisma.leadGeneration.update({
        where: { id: leadId },
        data: {
          commissionEarned: commission,
        },
      });

      return {
        leadId,
        jobValue,
        commission,
        commissionRate,
      };
    } catch (error) {
      console.error('Failed to track lead conversion:', error);
      throw new Error('Failed to track lead conversion');
    }
  }

  // Track job completion commission
  static async trackJobCommission(jobId: string): Promise<any> {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          transactions: {
            where: { status: 'COMPLETED' },
          },
        },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      const jobValue = job.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const platformCommission = jobValue * 0.05; // 5% platform fee

      await prisma.revenueTracking.create({
        data: {
          source: 'Job_Completion',
          sourceId: jobId,
          amount: platformCommission,
          revenueType: 'Commission',
          category: 'Job_Matching',
          subcategory: job.jobType,
          profitMargin: 90,
        },
      });

      return {
        jobId,
        jobValue,
        commission: platformCommission,
      };
    } catch (error) {
      console.error('Failed to track job commission:', error);
      throw new Error('Failed to track job commission');
    }
  }

  // Track equipment transaction commission
  static async trackEquipmentCommission(transactionId: string): Promise<any> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { equipment: true },
      });

      if (!transaction || !transaction.equipment) {
        throw new Error('Transaction or equipment not found');
      }

      const commissionRate = transaction.transactionType === 'EQUIPMENT_RENTAL' ? 0.08 : 0.10;
      const commission = Number(transaction.amount) * commissionRate;

      await prisma.revenueTracking.create({
        data: {
          source: 'Equipment_Transaction',
          sourceId: transactionId,
          amount: commission,
          revenueType: 'Commission',
          category: 'Equipment_Intelligence',
          subcategory: transaction.transactionType,
          transactionId,
          profitMargin: 85,
        },
      });

      return {
        transactionId,
        transactionValue: Number(transaction.amount),
        commission,
        commissionRate,
      };
    } catch (error) {
      console.error('Failed to track equipment commission:', error);
      throw new Error('Failed to track equipment commission');
    }
  }

  // Get comprehensive revenue analytics
  static async getRevenueAnalytics(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<any> {
    try {
      const periodDays = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        yearly: 365,
      };

      const startDate = new Date(Date.now() - periodDays[period] * 24 * 60 * 60 * 1000);

      // Total revenue by category
      const revenueByCategory = await prisma.revenueTracking.groupBy({
        by: ['category'],
        where: {
          revenueDate: { gte: startDate },
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      // Revenue by AI agent
      const revenueByAgent = await prisma.revenueTracking.groupBy({
        by: ['aiAgentId'],
        where: {
          revenueDate: { gte: startDate },
          aiAgentId: { not: null },
        },
        _sum: { amount: true },
      });

      // Get agent names
      const agentIds = revenueByAgent.map(r => r.aiAgentId).filter(Boolean);
      const agents = await prisma.aIAgent.findMany({
        where: { id: { in: agentIds as string[] } },
        select: { id: true, name: true, type: true },
      });

      const agentRevenueWithNames = revenueByAgent.map(revenue => {
        const agent = agents.find(a => a.id === revenue.aiAgentId);
        return {
          agentId: revenue.aiAgentId,
          agentName: agent?.name || 'Unknown',
          agentType: agent?.type || 'Unknown',
          revenue: Number(revenue._sum.amount || 0),
        };
      });

      // Total revenue
      const totalRevenue = await prisma.revenueTracking.aggregate({
        where: {
          revenueDate: { gte: startDate },
        },
        _sum: { amount: true },
      });

      // Revenue trend (daily breakdown for the period)
      const revenueTrend = await this.getRevenueTrend(startDate, period);

      // Performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(startDate);

      return {
        period,
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        revenueByCategory: revenueByCategory.map(cat => ({
          category: cat.category,
          revenue: Number(cat._sum.amount || 0),
          transactions: cat._count.id,
        })),
        revenueByAgent: agentRevenueWithNames,
        revenueTrend,
        performanceMetrics,
      };
    } catch (error) {
      console.error('Failed to get revenue analytics:', error);
      return null;
    }
  }

  // Get revenue projections
  static async getRevenueProjections(): Promise<any> {
    try {
      // Get historical data for the last 90 days
      const historicalRevenue = await prisma.revenueTracking.findMany({
        where: {
          revenueDate: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { revenueDate: 'asc' },
      });

      // Calculate growth rate
      const monthlyRevenue = this.groupRevenueByMonth(historicalRevenue);
      const growthRate = this.calculateGrowthRate(monthlyRevenue);

      // Project next 12 months
      const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;
      const projections = [];

      for (let i = 1; i <= 12; i++) {
        const projectedRevenue = currentMonthRevenue * Math.pow(1 + growthRate, i);
        projections.push({
          month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
          projectedRevenue: Math.round(projectedRevenue),
          confidence: Math.max(0.5, 1 - (i * 0.05)), // Decreasing confidence over time
        });
      }

      return {
        currentMonthRevenue,
        growthRate: Math.round(growthRate * 100),
        projections,
        annualProjection: projections.reduce((sum, p) => sum + p.projectedRevenue, 0),
      };
    } catch (error) {
      console.error('Failed to get revenue projections:', error);
      return null;
    }
  }

  // Get AI ROI analysis
  static async getAIROIAnalysis(): Promise<any> {
    try {
      const aiRevenue = await prisma.revenueTracking.findMany({
        where: {
          aiAgentId: { not: null },
          revenueDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          aiAgent: true,
        },
      });

      // Calculate ROI by agent type
      const roiByAgent = aiRevenue.reduce((acc: any, revenue) => {
        const agentType = revenue.aiAgent?.type || 'Unknown';
        if (!acc[agentType]) {
          acc[agentType] = {
            revenue: 0,
            cost: 0, // Would include infrastructure costs
            roi: 0,
          };
        }
        acc[agentType].revenue += Number(revenue.amount);
        acc[agentType].cost += 50; // Estimated monthly cost per agent
        return acc;
      }, {});

      // Calculate ROI percentages
      Object.keys(roiByAgent).forEach(agentType => {
        const agent = roiByAgent[agentType];
        agent.roi = agent.cost > 0 ? ((agent.revenue - agent.cost) / agent.cost) * 100 : 0;
      });

      const totalAIRevenue = aiRevenue.reduce((sum, r) => sum + Number(r.amount), 0);
      const totalAICost = Object.keys(roiByAgent).length * 50; // $50 per agent per month
      const overallROI = totalAICost > 0 ? ((totalAIRevenue - totalAICost) / totalAICost) * 100 : 0;

      return {
        totalAIRevenue,
        totalAICost,
        overallROI: Math.round(overallROI),
        roiByAgent,
        paybackPeriod: overallROI > 0 ? Math.ceil(totalAICost / (totalAIRevenue / 30)) : null, // Days to payback
      };
    } catch (error) {
      console.error('Failed to get AI ROI analysis:', error);
      return null;
    }
  }

  // Private helper methods
  private static getCommissionRate(source: string): number {
    const rates: { [key: string]: number } = {
      'Storm_Response': 0.25,
      'Weather_Alert': 0.20,
      'SEO': 0.15,
      'Referral': 0.10,
    };
    return rates[source] || 0.15;
  }

  private static async getRevenueTrend(startDate: Date, period: string): Promise<any[]> {
    const days = period === 'yearly' ? 365 : period === 'monthly' ? 30 : period === 'weekly' ? 7 : 1;
    const intervals = period === 'yearly' ? 12 : days; // 12 months for yearly, days for others

    const trend = [];
    
    for (let i = 0; i < intervals; i++) {
      const intervalStart = new Date(startDate.getTime() + i * (days / intervals) * 24 * 60 * 60 * 1000);
      const intervalEnd = new Date(intervalStart.getTime() + (days / intervals) * 24 * 60 * 60 * 1000);

      const revenue = await prisma.revenueTracking.aggregate({
        where: {
          revenueDate: {
            gte: intervalStart,
            lt: intervalEnd,
          },
        },
        _sum: { amount: true },
      });

      trend.push({
        date: intervalStart.toISOString().slice(0, 10),
        revenue: Number(revenue._sum.amount || 0),
      });
    }

    return trend;
  }

  private static async getPerformanceMetrics(startDate: Date): Promise<any> {
    // Lead conversion metrics
    const totalLeads = await prisma.leadGeneration.count({
      where: { createdAt: { gte: startDate } },
    });

    const convertedLeads = await prisma.leadGeneration.count({
      where: {
        createdAt: { gte: startDate },
        status: 'Converted',
      },
    });

    // Job completion metrics
    const totalJobs = await prisma.job.count({
      where: { createdAt: { gte: startDate } },
    });

    const completedJobs = await prisma.job.count({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED',
      },
    });

    return {
      leadConversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      jobCompletionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      totalLeads,
      convertedLeads,
      totalJobs,
      completedJobs,
    };
  }

  private static groupRevenueByMonth(revenueData: any[]): any[] {
    const monthlyData: { [key: string]: number } = {};

    revenueData.forEach(revenue => {
      const month = revenue.revenueDate.toISOString().slice(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + Number(revenue.amount);
    });

    return Object.entries(monthlyData)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private static calculateGrowthRate(monthlyRevenue: any[]): number {
    if (monthlyRevenue.length < 2) return 0;

    const firstMonth = monthlyRevenue[0].revenue;
    const lastMonth = monthlyRevenue[monthlyRevenue.length - 1].revenue;
    
    if (firstMonth === 0) return 0;

    const months = monthlyRevenue.length - 1;
    return Math.pow(lastMonth / firstMonth, 1 / months) - 1;
  }
}
