
import { PrismaClient } from '@prisma/client';
import { PartnershipType, PartnershipStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface PartnershipData {
  partnerName: string;
  partnerType: PartnershipType;
  contactName?: string;
  contactTitle?: string;
  phone?: string;
  email?: string;
  website?: string;
  status?: PartnershipStatus;
  partnershipLevel?: string;
  revenueShare?: number;
  referralFee?: number;
  serviceAreas?: string[];
  serviceTypes?: string[];
  strategicImportance?: string;
}

export interface PartnershipActivityData {
  partnershipId: string;
  activityType: string;
  description: string;
  outcome?: string;
  leadsGenerated?: number;
  revenueImpact?: number;
  costImpact?: number;
  actionItems?: string[];
  nextSteps?: string[];
  managedById?: string;
}

export class PartnershipService {
  // Target partnerships based on the Bucks County strategy
  static readonly TARGET_PARTNERSHIPS = {
    insurance: [
      'State Farm',
      'Allstate',
      'Liberty Mutual',
      'USAA',
      'Progressive',
      'Travelers',
    ],
    propertyManagement: [
      'Keyrenter BuxMont',
      'Bay Property Management Group',
      'Innovate Realty',
      'PMI Bucks County',
      'Bluestone & Hockley Real Estate',
    ],
    municipal: [
      'Doylestown Borough',
      'Newtown Township',
      'Warrington Township',
      'Buckingham Township',
      'New Britain Borough',
    ],
  };

  // Create strategic partnership
  static async createPartnership(data: PartnershipData) {
    try {
      const partnership = await prisma.strategicPartnership.create({
        data: {
          ...data,
          status: data.status || PartnershipStatus.PROSPECT,
          strategicImportance: data.strategicImportance || 'Medium',
          relationshipScore: 50, // Starting score
        },
      });

      return { success: true, partnership };
    } catch (error) {
      console.error('Error creating partnership:', error);
      return { success: false, error: 'Failed to create partnership' };
    }
  }

  // Get partnerships by type or status
  static async getPartnerships(filters?: {
    partnerType?: PartnershipType;
    status?: PartnershipStatus;
    strategicImportance?: string;
  }) {
    try {
      const partnerships = await prisma.strategicPartnership.findMany({
        where: filters,
        include: {
          partnershipActivities: {
            orderBy: { activityDate: 'desc' },
            take: 3,
          },
          _count: {
            select: {
              partnershipActivities: true,
            },
          },
        },
        orderBy: [
          { strategicImportance: 'desc' },
          { revenueGenerated: 'desc' },
        ],
      });

      return { success: true, partnerships };
    } catch (error) {
      console.error('Error fetching partnerships:', error);
      return { success: false, error: 'Failed to fetch partnerships' };
    }
  }

  // Get insurance partnership opportunities
  static async getInsurancePartnerships() {
    try {
      const partnerships = await this.getPartnerships({
        partnerType: PartnershipType.INSURANCE_COMPANY,
      });

      if (!partnerships.success) {
        return partnerships;
      }

      const analysis = {
        totalPartnerships: partnerships.partnerships?.length || 0,
        activePartnerships: partnerships.partnerships?.filter(p => 
          p.status === 'ACTIVE'
        ).length || 0,
        totalLeadsGenerated: partnerships.partnerships?.reduce((sum, p) => 
          sum + p.leadsGenerated, 0
        ) || 0,
        totalRevenue: partnerships.partnerships?.reduce((sum, p) => 
          sum + Number(p.revenueGenerated), 0
        ) || 0,
        averageRelationshipScore: partnerships.partnerships?.reduce((sum, p) => 
          sum + (p.relationshipScore || 0), 0
        ) / (partnerships.partnerships?.length || 1),
      };

      return { 
        success: true, 
        partnerships: partnerships.partnerships, 
        analysis 
      };
    } catch (error) {
      console.error('Error fetching insurance partnerships:', error);
      return { success: false, error: 'Failed to fetch insurance partnerships' };
    }
  }

  // Get property management partnerships
  static async getPropertyManagementPartnerships() {
    try {
      // Get property managers from the dedicated table
      const propertyManagers = await prisma.propertyManager.findMany({
        include: {
          contracts: true,
          territories: {
            include: {
              territory: true,
            },
          },
        },
        orderBy: [
          { contractStatus: 'asc' },
          { totalRevenue: 'desc' },
        ],
      });

      const analysis = {
        totalPropertyManagers: propertyManagers.length,
        activeContracts: propertyManagers.filter(pm => 
          pm.contractStatus === 'ACTIVE'
        ).length,
        totalProperties: propertyManagers.reduce((sum, pm) => 
          sum + (pm.propertiesManaged || 0), 0
        ),
        totalRevenue: propertyManagers.reduce((sum, pm) => 
          sum + Number(pm.totalRevenue), 0
        ),
        averageJobValue: propertyManagers.reduce((sum, pm) => 
          sum + (pm.averageJobValue || 0), 0
        ) / propertyManagers.length,
      };

      return { success: true, propertyManagers, analysis };
    } catch (error) {
      console.error('Error fetching property management partnerships:', error);
      return { success: false, error: 'Failed to fetch property management partnerships' };
    }
  }

  // Get municipal contracts
  static async getMunicipalContracts() {
    try {
      const partnerships = await this.getPartnerships({
        partnerType: PartnershipType.MUNICIPAL_CONTRACT,
      });

      if (!partnerships.success) {
        return partnerships;
      }

      const analysis = {
        totalMunicipalities: partnerships.partnerships?.length || 0,
        activeContracts: partnerships.partnerships?.filter(p => 
          p.status === 'ACTIVE'
        ).length || 0,
        contractValue: partnerships.partnerships?.reduce((sum, p) => 
          sum + (p.minimumCommitment || 0), 0
        ) || 0,
        coverageAreas: partnerships.partnerships?.flatMap(p => 
          p.serviceAreas || []
        ) || [],
      };

      return { 
        success: true, 
        partnerships: partnerships.partnerships, 
        analysis 
      };
    } catch (error) {
      console.error('Error fetching municipal contracts:', error);
      return { success: false, error: 'Failed to fetch municipal contracts' };
    }
  }

  // Create partnership activity
  static async createActivity(data: PartnershipActivityData) {
    try {
      const activity = await prisma.partnershipActivity.create({
        data,
        include: {
          partnership: true,
          managedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update partnership metrics
      await this.updatePartnershipMetrics(data.partnershipId);

      return { success: true, activity };
    } catch (error) {
      console.error('Error creating partnership activity:', error);
      return { success: false, error: 'Failed to create partnership activity' };
    }
  }

  // Update partnership performance metrics
  static async updatePartnershipMetrics(partnershipId: string) {
    try {
      const activities = await prisma.partnershipActivity.findMany({
        where: { partnershipId },
      });

      const totalLeadsGenerated = activities.reduce((sum, a) => 
        sum + a.leadsGenerated, 0
      );
      const totalRevenueGenerated = activities.reduce((sum, a) => 
        sum + Number(a.revenueImpact), 0
      );
      const totalCostSavings = activities.reduce((sum, a) => 
        sum + Number(a.costImpact), 0
      );

      // Calculate relationship score based on activity and performance
      const activityScore = Math.min(activities.length * 5, 30); // Max 30 points
      const revenueScore = Math.min((totalRevenueGenerated / 10000) * 40, 40); // Max 40 points
      const leadScore = Math.min(totalLeadsGenerated * 2, 30); // Max 30 points
      const relationshipScore = Math.min(activityScore + revenueScore + leadScore, 100);

      const updatedPartnership = await prisma.strategicPartnership.update({
        where: { id: partnershipId },
        data: {
          leadsGenerated: totalLeadsGenerated,
          revenueGenerated: totalRevenueGenerated,
          costSavings: totalCostSavings,
          relationshipScore,
        },
      });

      return { success: true, partnership: updatedPartnership };
    } catch (error) {
      console.error('Error updating partnership metrics:', error);
      return { success: false, error: 'Failed to update partnership metrics' };
    }
  }

  // Insurance referral pipeline
  static async processInsuranceReferral(
    insuranceCompany: string,
    claimNumber: string,
    customerInfo: any,
    damageAssessment: any
  ) {
    try {
      // Find insurance partnership
      const partnership = await prisma.strategicPartnership.findFirst({
        where: {
          partnerType: 'INSURANCE_COMPANY',
          partnerName: {
            contains: insuranceCompany,
            mode: 'insensitive',
          },
          status: 'ACTIVE',
        },
      });

      if (!partnership) {
        return { success: false, error: 'No active insurance partnership found' };
      }

      // Create lead from referral
      const lead = await prisma.leadGeneration.create({
        data: {
          source: 'Insurance_Referral',
          sourceDetails: {
            insuranceCompany,
            claimNumber,
            partnershipId: partnership.id,
          },
          homeownerName: customerInfo.name,
          homeownerEmail: customerInfo.email,
          homeownerPhone: customerInfo.phone,
          propertyAddress: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          zipCode: customerInfo.zipCode,
          serviceType: 'Emergency',
          urgency: 'Immediate',
          estimatedValue: damageAssessment.estimatedCost,
          status: 'New',
        },
      });

      // Create partnership activity
      await this.createActivity({
        partnershipId: partnership.id,
        activityType: 'Lead_Share',
        description: `Insurance referral for claim ${claimNumber}`,
        outcome: 'Lead generated',
        leadsGenerated: 1,
        revenueImpact: damageAssessment.estimatedCost * (partnership.revenueShare || 0) / 100,
        actionItems: ['Contact homeowner within 2 hours', 'Schedule assessment'],
        nextSteps: ['Emergency response dispatch', 'Damage assessment'],
      });

      return { success: true, lead, partnership };
    } catch (error) {
      console.error('Error processing insurance referral:', error);
      return { success: false, error: 'Failed to process insurance referral' };
    }
  }

  // Partnership dashboard analytics
  static async getPartnershipDashboard() {
    try {
      const partnerships = await prisma.strategicPartnership.findMany({
        include: {
          partnershipActivities: {
            where: {
              activityDate: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
      });

      const dashboard = {
        totalPartnerships: partnerships.length,
        activePartnerships: partnerships.filter(p => p.status === 'ACTIVE').length,
        totalRevenue: partnerships.reduce((sum, p) => sum + Number(p.revenueGenerated), 0),
        totalLeads: partnerships.reduce((sum, p) => sum + p.leadsGenerated, 0),
        averageRelationshipScore: partnerships.reduce((sum, p) => sum + (p.relationshipScore || 0), 0) / partnerships.length,
        
        byType: {
          insurance: partnerships.filter(p => p.partnerType === 'INSURANCE_COMPANY').length,
          municipal: partnerships.filter(p => p.partnerType === 'MUNICIPAL_CONTRACT').length,
          franchise: partnerships.filter(p => p.partnerType === 'FRANCHISE_PARTNER').length,
          equipment: partnerships.filter(p => p.partnerType === 'EQUIPMENT_SUPPLIER').length,
        },

        topPerformers: partnerships
          .sort((a, b) => Number(b.revenueGenerated) - Number(a.revenueGenerated))
          .slice(0, 5),

        recentActivity: partnerships
          .flatMap(p => p.partnershipActivities.map(a => ({ ...a, partnerName: p.partnerName })))
          .sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime())
          .slice(0, 10),

        monthlyMetrics: {
          newPartnerships: partnerships.filter(p => 
            new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length,
          activeContracts: partnerships.filter(p => 
            p.status === 'ACTIVE' && p.contractStartDate
          ).length,
          renewalsDue: partnerships.filter(p => 
            p.contractEndDate && new Date(p.contractEndDate) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          ).length,
        },
      };

      return { success: true, dashboard };
    } catch (error) {
      console.error('Error fetching partnership dashboard:', error);
      return { success: false, error: 'Failed to fetch partnership dashboard' };
    }
  }

  // Initialize target partnerships for Bucks County
  static async initializeTargetPartnerships() {
    try {
      const results = {
        created: 0,
        errors: [] as string[],
      };

      // Insurance partnerships
      for (const insuranceName of this.TARGET_PARTNERSHIPS.insurance) {
        try {
          const existing = await prisma.strategicPartnership.findFirst({
            where: { partnerName: insuranceName },
          });

          if (!existing) {
            await this.createPartnership({
              partnerName: insuranceName,
              partnerType: PartnershipType.INSURANCE_COMPANY,
              status: PartnershipStatus.PROSPECT,
              serviceAreas: ['Bucks County', 'Montgomery County', 'Philadelphia'],
              serviceTypes: ['Storm Damage', 'Emergency Response', 'Tree Removal'],
              strategicImportance: 'High',
              referralFee: 250, // Per referral
              revenueShare: 5, // 5% of job value
            });
            results.created++;
          }
        } catch (error) {
          console.error(`Error creating insurance partnership ${insuranceName}:`, error);
          results.errors.push(`Failed to create ${insuranceName} partnership`);
        }
      }

      // Municipal contracts
      for (const municipality of this.TARGET_PARTNERSHIPS.municipal) {
        try {
          const existing = await prisma.strategicPartnership.findFirst({
            where: { partnerName: municipality },
          });

          if (!existing) {
            await this.createPartnership({
              partnerName: municipality,
              partnerType: PartnershipType.MUNICIPAL_CONTRACT,
              status: PartnershipStatus.PROSPECT,
              serviceAreas: [municipality.replace(' Township', '').replace(' Borough', '')],
              serviceTypes: ['Storm Response', 'Road Clearing', 'Park Maintenance'],
              strategicImportance: 'Critical',
              minimumCommitment: 50000, // Annual contract minimum
            });
            results.created++;
          }
        } catch (error) {
          console.error(`Error creating municipal partnership ${municipality}:`, error);
          results.errors.push(`Failed to create ${municipality} partnership`);
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error initializing target partnerships:', error);
      return { success: false, error: 'Failed to initialize target partnerships' };
    }
  }

  // Franchise partnership development
  static async developFranchiseModel() {
    try {
      const franchiseModel = {
        franchiseFee: 45000,
        royaltyPercentage: 6,
        marketingFee: 2,
        territoryRights: 'Exclusive',
        supportLevel: 'Comprehensive',
        
        requirements: {
          minimumInvestment: 150000,
          liquidCapital: 75000,
          netWorth: 250000,
          experience: 'Business or tree care experience preferred',
        },

        support: {
          training: '3-week comprehensive program',
          marketing: 'National and local marketing support',
          operations: 'Ongoing operational guidance',
          technology: 'TreeHub platform license',
        },

        benefits: {
          territoryProtection: true,
          brandRecognition: 'TreeHub national brand',
          systemsAndProcesses: 'Proven business model',
          ongoingSupport: '24/7 support network',
        },
      };

      // Create franchise partnership template
      const franchisePartnership = await this.createPartnership({
        partnerName: 'TreeHub Franchise Program',
        partnerType: PartnershipType.FRANCHISE_PARTNER,
        status: PartnershipStatus.ACTIVE,
        partnershipLevel: 'Strategic',
        serviceAreas: ['National'],
        serviceTypes: ['Franchise Development', 'Territory Licensing'],
        strategicImportance: 'Critical',
        revenueShare: franchiseModel.royaltyPercentage,
      });

      return { success: true, franchiseModel, partnership: franchisePartnership };
    } catch (error) {
      console.error('Error developing franchise model:', error);
      return { success: false, error: 'Failed to develop franchise model' };
    }
  }
}
