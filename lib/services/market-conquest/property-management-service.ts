
import { PrismaClient } from '@prisma/client';
import { PropertyManagerType, ContractStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface PropertyManagerData {
  companyName: string;
  contactName?: string;
  contactTitle?: string;
  phone?: string;
  email?: string;
  website?: string;
  type: PropertyManagerType;
  propertiesManaged?: number;
  totalUnits?: number;
  portfolioValue?: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  serviceAreas?: string[];
  currentVendors?: string[];
  painPoints?: string[];
  budgetCycle?: string;
}

export interface ContractData {
  propertyManagerId: string;
  contractNumber: string;
  contractType: string;
  baseRate?: number;
  volumeDiscount?: number;
  emergencyRate?: number;
  minimumMonthly?: number;
  paymentTerms?: string;
  standardResponseTime?: number;
  emergencyResponseTime?: number;
  serviceTypes?: string[];
  startDate: Date;
  endDate: Date;
  autoRenewal?: boolean;
}

export class PropertyManagementService {
  // Target property management companies in Bucks County
  static readonly TARGET_COMPANIES = [
    {
      name: 'Keyrenter BuxMont',
      type: 'RESIDENTIAL',
      estimatedProperties: 250,
      serviceAreas: ['Doylestown', 'Newtown', 'Warrington'],
    },
    {
      name: 'Bay Property Management Group',
      type: 'MIXED_USE',
      estimatedProperties: 180,
      serviceAreas: ['Levittown', 'Bristol', 'Morrisville'],
    },
    {
      name: 'Innovate Realty',
      type: 'RESIDENTIAL',
      estimatedProperties: 120,
      serviceAreas: ['Yardley', 'Newtown', 'Richboro'],
    },
  ];

  // Create property manager profile
  static async createPropertyManager(data: PropertyManagerData) {
    try {
      const propertyManager = await prisma.propertyManager.create({
        data: {
          ...data,
          contractStatus: ContractStatus.PROSPECT,
          relationshipScore: 50, // Starting score
        },
      });

      return { success: true, propertyManager };
    } catch (error) {
      console.error('Error creating property manager:', error);
      return { success: false, error: 'Failed to create property manager' };
    }
  }

  // Get property managers with filtering
  static async getPropertyManagers(filters?: {
    type?: PropertyManagerType;
    contractStatus?: ContractStatus;
    city?: string;
    state?: string;
  }) {
    try {
      const propertyManagers = await prisma.propertyManager.findMany({
        where: filters,
        include: {
          contracts: {
            orderBy: { createdAt: 'desc' },
          },
          territories: {
            include: {
              territory: true,
            },
          },
          _count: {
            select: {
              contracts: true,
              territories: true,
            },
          },
        },
        orderBy: [
          { contractStatus: 'asc' },
          { portfolioValue: 'desc' },
        ],
      });

      return { success: true, propertyManagers };
    } catch (error) {
      console.error('Error fetching property managers:', error);
      return { success: false, error: 'Failed to fetch property managers' };
    }
  }

  // Create property management contract
  static async createContract(data: ContractData) {
    try {
      const contract = await prisma.propertyManagerContract.create({
        data: {
          ...data,
          status: ContractStatus.ACTIVE,
        },
        include: {
          propertyManager: true,
        },
      });

      // Update property manager contract status
      await prisma.propertyManager.update({
        where: { id: data.propertyManagerId },
        data: {
          contractStatus: ContractStatus.ACTIVE,
          contractValue: data.minimumMonthly ? data.minimumMonthly * 12 : undefined,
          lastContactDate: new Date(),
        },
      });

      return { success: true, contract };
    } catch (error) {
      console.error('Error creating contract:', error);
      return { success: false, error: 'Failed to create contract' };
    }
  }

  // Calculate bulk pricing for property managers
  static calculateBulkPricing(
    serviceType: string,
    volume: number,
    baseRate: number
  ): { rate: number; discount: number; savings: number } {
    let discountPercentage = 0;

    // Volume-based discount tiers
    if (volume >= 50) {
      discountPercentage = 25; // 25% discount for 50+ properties
    } else if (volume >= 25) {
      discountPercentage = 20; // 20% discount for 25+ properties
    } else if (volume >= 10) {
      discountPercentage = 15; // 15% discount for 10+ properties
    } else if (volume >= 5) {
      discountPercentage = 10; // 10% discount for 5+ properties
    }

    const discountedRate = baseRate * (1 - discountPercentage / 100);
    const savings = (baseRate - discountedRate) * volume;

    return {
      rate: discountedRate,
      discount: discountPercentage,
      savings,
    };
  }

  // Generate property management proposal
  static async generateProposal(
    propertyManagerId: string,
    serviceTypes: string[],
    estimatedVolume: number
  ) {
    try {
      const propertyManager = await prisma.propertyManager.findUnique({
        where: { id: propertyManagerId },
      });

      if (!propertyManager) {
        return { success: false, error: 'Property manager not found' };
      }

      // Standard rates for different services
      const baseRates = {
        'Tree Removal': 800,
        'Tree Pruning': 300,
        'Storm Cleanup': 500,
        'Emergency Response': 1200,
        'Preventive Maintenance': 200,
        'Stump Grinding': 250,
      };

      const proposal = {
        propertyManager: propertyManager.companyName,
        proposalDate: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        
        services: serviceTypes.map(serviceType => {
          const baseRate = baseRates[serviceType as keyof typeof baseRates] || 400;
          const pricing = this.calculateBulkPricing(serviceType, estimatedVolume, baseRate);
          
          return {
            serviceType,
            baseRate,
            discountedRate: pricing.rate,
            discount: pricing.discount,
            estimatedAnnualSavings: pricing.savings,
          };
        }),

        terms: {
          responseTime: {
            standard: '4 hours',
            emergency: '1 hour',
          },
          coverage: {
            hours: '24/7 for emergencies',
            days: 'Monday-Saturday for routine work',
          },
          payment: 'Net 30 days',
          minimumMonthly: estimatedVolume * 100, // $100 per property minimum
        },

        benefits: [
          `${this.calculateTotalDiscount(serviceTypes, estimatedVolume)}% volume discount`,
          'Priority scheduling for all properties',
          'Dedicated account manager',
          '24/7 emergency response',
          'Monthly performance reporting',
          'Insurance certificate provided',
          'Digital work order management',
        ],

        totalEstimatedAnnualSavings: serviceTypes.reduce((total, serviceType) => {
          const baseRate = baseRates[serviceType as keyof typeof baseRates] || 400;
          const pricing = this.calculateBulkPricing(serviceType, estimatedVolume, baseRate);
          return total + pricing.savings;
        }, 0),
      };

      return { success: true, proposal };
    } catch (error) {
      console.error('Error generating proposal:', error);
      return { success: false, error: 'Failed to generate proposal' };
    }
  }

  // Track ROI for property management clients
  static async trackROI(propertyManagerId: string, timeframeMonths: number = 12) {
    try {
      const propertyManager = await prisma.propertyManager.findUnique({
        where: { id: propertyManagerId },
        include: {
          contracts: true,
        },
      });

      if (!propertyManager) {
        return { success: false, error: 'Property manager not found' };
      }

      // Calculate ROI metrics
      const totalRevenue = Number(propertyManager.totalRevenue);
      const averageJobValue = Number(propertyManager.averageJobValue) || 0;
      const jobsGenerated = propertyManager.jobsGenerated;

      // Estimate costs (simplified)
      const acquisitionCost = 500; // Cost to acquire the PM client
      const serviceCost = totalRevenue * 0.7; // Assume 30% margin
      const totalCosts = acquisitionCost + serviceCost;

      const roi = totalCosts > 0 ? ((totalRevenue - totalCosts) / totalCosts) * 100 : 0;

      // Calculate client value metrics
      const monthlyRevenue = totalRevenue / timeframeMonths;
      const jobsPerMonth = jobsGenerated / timeframeMonths;
      const clientLifetimeValue = monthlyRevenue * 24; // Assume 2-year retention

      const roiAnalysis = {
        propertyManager: propertyManager.companyName,
        timeframe: `${timeframeMonths} months`,
        
        financialMetrics: {
          totalRevenue,
          totalCosts,
          netProfit: totalRevenue - totalCosts,
          roi: Math.round(roi),
          monthlyRevenue,
          clientLifetimeValue,
        },

        operationalMetrics: {
          totalJobs: jobsGenerated,
          jobsPerMonth,
          averageJobValue,
          responseTimeCompliance: 95, // Assumed metric
          clientSatisfaction: Number(propertyManager.relationshipScore) || 0,
        },

        growthOpportunities: {
          additionalProperties: (propertyManager.propertiesManaged || 0) * 0.2, // 20% growth potential
          serviceExpansion: ['Preventive Maintenance', 'Landscape Services'],
          referralPotential: 3, // Other PM companies they could refer
        },

        recommendations: this.generateROIRecommendations(roi, monthlyRevenue, jobsPerMonth),
      };

      return { success: true, roiAnalysis };
    } catch (error) {
      console.error('Error tracking ROI:', error);
      return { success: false, error: 'Failed to track ROI' };
    }
  }

  // Property management dashboard
  static async getPropertyManagementDashboard() {
    try {
      const propertyManagers = await prisma.propertyManager.findMany({
        include: {
          contracts: true,
          territories: true,
        },
      });

      const contracts = await prisma.propertyManagerContract.findMany({
        include: {
          propertyManager: true,
        },
      });

      const dashboard = {
        overview: {
          totalPropertyManagers: propertyManagers.length,
          activeContracts: contracts.filter(c => c.status === 'ACTIVE').length,
          prospectClients: propertyManagers.filter(pm => pm.contractStatus === 'PROSPECT').length,
          totalProperties: propertyManagers.reduce((sum, pm) => sum + (pm.propertiesManaged || 0), 0),
          totalRevenue: propertyManagers.reduce((sum, pm) => sum + Number(pm.totalRevenue), 0),
        },

        contractMetrics: {
          averageContractValue: contracts.reduce((sum, c) => sum + Number(c.contractValue), 0) / contracts.length,
          averageMonthlyMinimum: contracts.reduce((sum, c) => sum + (c.minimumMonthly || 0), 0) / contracts.length,
          autoRenewalRate: (contracts.filter(c => c.autoRenewal).length / contracts.length) * 100,
          onTimePaymentRate: 92, // Assumed metric
        },

        typeDistribution: propertyManagers.reduce((acc, pm) => {
          acc[pm.type] = (acc[pm.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),

        revenueByType: propertyManagers.reduce((acc, pm) => {
          const revenue = Number(pm.totalRevenue);
          acc[pm.type] = (acc[pm.type] || 0) + revenue;
          return acc;
        }, {} as Record<string, number>),

        topClients: propertyManagers
          .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue))
          .slice(0, 10)
          .map(pm => ({
            name: pm.companyName,
            revenue: Number(pm.totalRevenue),
            properties: pm.propertiesManaged,
            contractStatus: pm.contractStatus,
            relationshipScore: pm.relationshipScore,
          })),

        renewalsUpcoming: contracts.filter(c => {
          const renewalDate = new Date(c.endDate);
          const threeMonthsFromNow = new Date();
          threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
          return renewalDate <= threeMonthsFromNow && c.status === 'ACTIVE';
        }).length,

        performanceMetrics: {
          averageJobValue: propertyManagers.reduce((sum, pm) => sum + (pm.averageJobValue || 0), 0) / propertyManagers.length,
          totalJobsGenerated: propertyManagers.reduce((sum, pm) => sum + pm.jobsGenerated, 0),
          averageResponseTime: 3.2, // Assumed metric in hours
          clientRetentionRate: 88, // Assumed metric
        },
      };

      return { success: true, dashboard };
    } catch (error) {
      console.error('Error fetching property management dashboard:', error);
      return { success: false, error: 'Failed to fetch dashboard' };
    }
  }

  // Initialize target property management companies
  static async initializeTargetCompanies() {
    try {
      const results = {
        created: 0,
        errors: [] as string[],
      };

      for (const company of this.TARGET_COMPANIES) {
        try {
          const existing = await prisma.propertyManager.findFirst({
            where: { companyName: company.name },
          });

          if (!existing) {
            await this.createPropertyManager({
              companyName: company.name,
              type: company.type as PropertyManagerType,
              propertiesManaged: company.estimatedProperties,
              serviceAreas: company.serviceAreas,
              city: 'Bucks County',
              state: 'PA',
              painPoints: [
                'High tree maintenance costs',
                'Slow vendor response times',
                'Inconsistent service quality',
                'Emergency response delays',
              ],
              budgetCycle: 'Calendar_Year',
              currentVendors: ['Local contractors', 'Handyman services'],
            });
            results.created++;
          }
        } catch (error) {
          console.error(`Error creating property manager ${company.name}:`, error);
          results.errors.push(`Failed to create ${company.name}`);
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error initializing target companies:', error);
      return { success: false, error: 'Failed to initialize target companies' };
    }
  }

  // Helper methods
  private static calculateTotalDiscount(serviceTypes: string[], volume: number): number {
    if (volume >= 50) return 25;
    if (volume >= 25) return 20;
    if (volume >= 10) return 15;
    if (volume >= 5) return 10;
    return 0;
  }

  private static generateROIRecommendations(roi: number, monthlyRevenue: number, jobsPerMonth: number): string[] {
    const recommendations = [];

    if (roi < 50) {
      recommendations.push('Consider renegotiating pricing or service scope');
    }
    if (monthlyRevenue < 2000) {
      recommendations.push('Explore additional service offerings to increase monthly value');
    }
    if (jobsPerMonth < 5) {
      recommendations.push('Increase marketing to property management company tenants');
    }
    
    recommendations.push('Implement preventive maintenance programs');
    recommendations.push('Explore multi-year contract opportunities');
    
    return recommendations;
  }
}
