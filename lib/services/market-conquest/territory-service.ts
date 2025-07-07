
import { PrismaClient } from '@prisma/client';
import { TerritoryStatus, TerritoryType } from '@prisma/client';

const prisma = new PrismaClient();

export interface TerritoryData {
  name: string;
  type: TerritoryType;
  zipCode?: string;
  city?: string;
  county?: string;
  state?: string;
  population?: number;
  households?: number;
  medianIncome?: number;
  treeCanopyCoverage?: number;
}

export interface TerritoryAssignmentData {
  territoryId: string;
  professionalId: string;
  assignmentType: string;
  priority?: number;
  minResponseTime?: number;
  minJobsPerMonth?: number;
  minRevenuePerMonth?: number;
}

export class TerritoryService {
  // Create new territory
  static async createTerritory(data: TerritoryData) {
    try {
      const territory = await prisma.territory.create({
        data: {
          ...data,
          status: TerritoryStatus.AVAILABLE,
          opportunityScore: await this.calculateOpportunityScore(data),
        },
      });

      return { success: true, territory };
    } catch (error) {
      console.error('Error creating territory:', error);
      return { success: false, error: 'Failed to create territory' };
    }
  }

  // Get territories by region/county
  static async getTerritories(filters?: {
    county?: string;
    state?: string;
    status?: TerritoryStatus;
    type?: TerritoryType;
  }) {
    try {
      const territories = await prisma.territory.findMany({
        where: filters,
        include: {
          protectedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
          territoryAssignments: {
            include: {
              professional: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  companyName: true,
                },
              },
            },
          },
          competitors: true,
          _count: {
            select: {
              territoryAssignments: true,
              competitors: true,
            },
          },
        },
        orderBy: [
          { opportunityScore: 'desc' },
          { medianIncome: 'desc' },
        ],
      });

      return { success: true, territories };
    } catch (error) {
      console.error('Error fetching territories:', error);
      return { success: false, error: 'Failed to fetch territories' };
    }
  }

  // Protect territory for professional (first 25 pros get exclusive rights)
  static async protectTerritory(territoryId: string, professionalId: string, exclusivityFee?: number) {
    try {
      // Check if professional is eligible for protection (Gold tier or higher)
      const professional = await prisma.user.findUnique({
        where: { id: professionalId },
        include: { tierStatus: true },
      });

      if (!professional?.tierStatus || 
          !['GOLD', 'PLATINUM', 'ELITE'].includes(professional.tierStatus.currentTier)) {
        return { success: false, error: 'Professional not eligible for territory protection' };
      }

      // Check if territory is available for protection
      const territory = await prisma.territory.findUnique({
        where: { id: territoryId },
      });

      if (!territory || territory.status !== TerritoryStatus.AVAILABLE) {
        return { success: false, error: 'Territory not available for protection' };
      }

      // Protect the territory
      const updatedTerritory = await prisma.territory.update({
        where: { id: territoryId },
        data: {
          status: TerritoryStatus.PROTECTED,
          isProtected: true,
          protectedById: professionalId,
          protectionStartDate: new Date(),
          exclusiveUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          exclusivityFee: exclusivityFee || 299, // Monthly fee
        },
      });

      return { success: true, territory: updatedTerritory };
    } catch (error) {
      console.error('Error protecting territory:', error);
      return { success: false, error: 'Failed to protect territory' };
    }
  }

  // Assign professional to territory
  static async assignProfessional(data: TerritoryAssignmentData) {
    try {
      // Check if assignment already exists
      const existingAssignment = await prisma.territoryAssignment.findUnique({
        where: {
          territoryId_professionalId: {
            territoryId: data.territoryId,
            professionalId: data.professionalId,
          },
        },
      });

      if (existingAssignment) {
        return { success: false, error: 'Professional already assigned to this territory' };
      }

      const assignment = await prisma.territoryAssignment.create({
        data,
        include: {
          territory: true,
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
        },
      });

      return { success: true, assignment };
    } catch (error) {
      console.error('Error assigning professional:', error);
      return { success: false, error: 'Failed to assign professional' };
    }
  }

  // Get Bucks County specific territories
  static async getBucksCountyTerritories() {
    try {
      const territories = await this.getTerritories({
        county: 'Bucks',
        state: 'PA',
      });

      if (territories.success) {
        // Calculate penetration metrics
        const bucksCountyMetrics = {
          totalTerritories: territories.territories?.length || 0,
          protectedTerritories: territories.territories?.filter(t => t.isProtected).length || 0,
          availableTerritories: territories.territories?.filter(t => t.status === 'AVAILABLE').length || 0,
          averageOpportunityScore: territories.territories?.reduce((sum, t) => sum + (t.opportunityScore || 0), 0) / (territories.territories?.length || 1),
          totalMarketValue: territories.territories?.reduce((sum, t) => sum + (t.medianIncome || 0) * (t.households || 0), 0),
        };

        return { success: true, territories: territories.territories, metrics: bucksCountyMetrics };
      }

      return territories;
    } catch (error) {
      console.error('Error fetching Bucks County territories:', error);
      return { success: false, error: 'Failed to fetch Bucks County territories' };
    }
  }

  // Calculate territory opportunity score
  static async calculateOpportunityScore(data: TerritoryData): Promise<number> {
    try {
      let score = 0;

      // Income factor (30% weight)
      if (data.medianIncome) {
        const incomeScore = Math.min((data.medianIncome / 100000) * 30, 30);
        score += incomeScore;
      }

      // Population density factor (20% weight)
      if (data.population && data.households) {
        const densityScore = Math.min((data.households / 1000) * 20, 20);
        score += densityScore;
      }

      // Tree canopy coverage factor (25% weight)
      if (data.treeCanopyCoverage) {
        const canopyScore = (data.treeCanopyCoverage / 100) * 25;
        score += canopyScore;
      }

      // Location factor (25% weight) - Bucks County premium
      if (data.county === 'Bucks' && data.state === 'PA') {
        score += 25;
      } else if (data.state === 'PA') {
        score += 15;
      }

      return Math.min(Math.round(score), 100);
    } catch (error) {
      console.error('Error calculating opportunity score:', error);
      return 50; // Default score
    }
  }

  // Update territory performance metrics
  static async updateTerritoryMetrics(territoryId: string) {
    try {
      // Calculate performance metrics from jobs and revenue
      const jobs = await prisma.job.findMany({
        where: {
          zipCode: {
            in: await prisma.territory.findUnique({
              where: { id: territoryId },
              select: { zipCode: true },
            }).then(t => t?.zipCode ? [t.zipCode] : []),
          },
        },
        include: {
          transactions: true,
        },
      });

      const totalJobs = jobs.length;
      const totalRevenue = jobs.reduce((sum, job) => 
        sum + job.transactions.reduce((tSum, t) => tSum + Number(t.amount || 0), 0), 0
      );

      // Calculate market penetration (simplified)
      const marketPenetration = Math.min((totalJobs / 100) * 100, 100); // Assuming 100 jobs = 100% penetration

      await prisma.territory.update({
        where: { id: territoryId },
        data: {
          totalJobs,
          totalRevenue,
          marketPenetration,
        },
      });

      return { success: true, totalJobs, totalRevenue, marketPenetration };
    } catch (error) {
      console.error('Error updating territory metrics:', error);
      return { success: false, error: 'Failed to update territory metrics' };
    }
  }

  // Get territory analytics dashboard data
  static async getTerritoryAnalytics(territoryId?: string) {
    try {
      const whereClause = territoryId ? { id: territoryId } : {};

      const territories = await prisma.territory.findMany({
        where: whereClause,
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
          competitors: true,
          propertyManagers: true,
        },
      });

      const analytics = {
        totalTerritories: territories.length,
        protectedTerritories: territories.filter(t => t.isProtected).length,
        totalRevenue: territories.reduce((sum, t) => sum + Number(t.totalRevenue), 0),
        averageOpportunityScore: territories.reduce((sum, t) => sum + (t.opportunityScore || 0), 0) / territories.length,
        topPerformingTerritories: territories
          .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue))
          .slice(0, 10),
        tierDistribution: {
          gold: territories.filter(t => 
            t.territoryAssignments.some(ta => ta.professional.tierStatus?.currentTier === 'GOLD')
          ).length,
          platinum: territories.filter(t => 
            t.territoryAssignments.some(ta => ta.professional.tierStatus?.currentTier === 'PLATINUM')
          ).length,
          elite: territories.filter(t => 
            t.territoryAssignments.some(ta => ta.professional.tierStatus?.currentTier === 'ELITE')
          ).length,
        },
      };

      return { success: true, analytics };
    } catch (error) {
      console.error('Error fetching territory analytics:', error);
      return { success: false, error: 'Failed to fetch territory analytics' };
    }
  }
}
