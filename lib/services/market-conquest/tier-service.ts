
import { PrismaClient } from '@prisma/client';
import { ProfessionalTier, TierStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface TierAdvancementCriteria {
  tier: ProfessionalTier;
  minMonthlyJobs: number;
  minMonthlyRevenue: number;
  minRating: number;
  maxComplaintRatio: number;
  specialRequirements?: string[];
}

export class TierService {
  // Tier advancement criteria
  static readonly TIER_CRITERIA: Record<ProfessionalTier, TierAdvancementCriteria> = {
    BRONZE: {
      tier: 'BRONZE',
      minMonthlyJobs: 1,
      minMonthlyRevenue: 500,
      minRating: 3.0,
      maxComplaintRatio: 0.3,
    },
    SILVER: {
      tier: 'SILVER',
      minMonthlyJobs: 3,
      minMonthlyRevenue: 1500,
      minRating: 3.5,
      maxComplaintRatio: 0.2,
    },
    GOLD: {
      tier: 'GOLD',
      minMonthlyJobs: 8,
      minMonthlyRevenue: 5000,
      minRating: 4.0,
      maxComplaintRatio: 0.15,
      specialRequirements: ['Territory protection eligibility', 'Priority alerts'],
    },
    PLATINUM: {
      tier: 'PLATINUM',
      minMonthlyJobs: 15,
      minMonthlyRevenue: 12000,
      minRating: 4.3,
      maxComplaintRatio: 0.1,
      specialRequirements: ['Exclusive zip codes', 'Advanced analytics'],
    },
    ELITE: {
      tier: 'ELITE',
      minMonthlyJobs: 25,
      minMonthlyRevenue: 25000,
      minRating: 4.7,
      maxComplaintRatio: 0.05,
      specialRequirements: ['Market leader status', 'Franchise eligibility'],
    },
  };

  // Initialize professional tier status
  static async initializeProfessionalTier(professionalId: string) {
    try {
      const existingTier = await prisma.professionalTierStatus.findUnique({
        where: { professionalId },
      });

      if (existingTier) {
        return { success: true, tierStatus: existingTier };
      }

      const tierStatus = await prisma.professionalTierStatus.create({
        data: {
          professionalId,
          currentTier: ProfessionalTier.BRONZE,
          status: TierStatus.ACTIVE,
          tierPoints: 0,
          monthsInTier: 0,
        },
      });

      return { success: true, tierStatus };
    } catch (error) {
      console.error('Error initializing professional tier:', error);
      return { success: false, error: 'Failed to initialize professional tier' };
    }
  }

  // Update professional performance metrics
  static async updatePerformanceMetrics(professionalId: string) {
    try {
      // Get jobs completed this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      // Get jobs and revenue for current month
      const jobs = await prisma.job.findMany({
        where: {
          assignedToId: professionalId,
          status: 'COMPLETED',
          completedAt: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
        include: {
          transactions: true,
          reviews: true,
        },
      });

      const monthlyJobsCompleted = jobs.length;
      const monthlyRevenue = jobs.reduce((sum, job) =>
        sum + job.transactions.reduce((tSum, t) => tSum + Number(t.amount), 0), 0
      );

      // Calculate average rating
      const reviews = jobs.flatMap(job => job.reviews);
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      // Calculate complaint ratio (simplified - assuming negative reviews are complaints)
      const complaints = reviews.filter(review => review.rating <= 2).length;
      const customerComplaints = complaints;
      const complaintRatio = reviews.length > 0 ? complaints / reviews.length : 0;

      // Update tier status
      const updatedTierStatus = await prisma.professionalTierStatus.update({
        where: { professionalId },
        data: {
          monthlyJobsCompleted,
          monthlyRevenue,
          averageRating,
          customerComplaints,
        },
      });

      return { 
        success: true, 
        metrics: { 
          monthlyJobsCompleted, 
          monthlyRevenue, 
          averageRating, 
          complaintRatio 
        },
        tierStatus: updatedTierStatus 
      };
    } catch (error) {
      console.error('Error updating performance metrics:', error);
      return { success: false, error: 'Failed to update performance metrics' };
    }
  }

  // Check tier advancement eligibility
  static async checkTierAdvancement(professionalId: string) {
    try {
      const tierStatus = await prisma.professionalTierStatus.findUnique({
        where: { professionalId },
      });

      if (!tierStatus) {
        return { success: false, error: 'Tier status not found' };
      }

      const currentTierIndex = Object.keys(this.TIER_CRITERIA).indexOf(tierStatus.currentTier);
      const nextTierKeys = Object.keys(this.TIER_CRITERIA);
      
      if (currentTierIndex >= nextTierKeys.length - 1) {
        return { success: true, eligible: false, reason: 'Already at highest tier' };
      }

      const nextTier = nextTierKeys[currentTierIndex + 1] as ProfessionalTier;
      const criteria = this.TIER_CRITERIA[nextTier];

      const eligible = 
        tierStatus.monthlyJobsCompleted >= criteria.minMonthlyJobs &&
        Number(tierStatus.monthlyRevenue) >= criteria.minMonthlyRevenue &&
        Number(tierStatus.averageRating) >= criteria.minRating &&
        (tierStatus.customerComplaints / Math.max(tierStatus.monthlyJobsCompleted, 1)) <= criteria.maxComplaintRatio;

      const eligibilityDetails = {
        jobsRequirement: `${tierStatus.monthlyJobsCompleted}/${criteria.minMonthlyJobs}`,
        revenueRequirement: `$${tierStatus.monthlyRevenue}/$${criteria.minMonthlyRevenue}`,
        ratingRequirement: `${tierStatus.averageRating}/${criteria.minRating}`,
        complaintRequirement: `${(tierStatus.customerComplaints / Math.max(tierStatus.monthlyJobsCompleted, 1)).toFixed(2)}/${criteria.maxComplaintRatio}`,
      };

      if (eligible) {
        // Update eligibility status
        await prisma.professionalTierStatus.update({
          where: { professionalId },
          data: {
            eligibleForPromotion: true,
            promotionEligibleDate: new Date(),
            nextTierRequirements: criteria,
          },
        });
      }

      return { 
        success: true, 
        eligible, 
        nextTier, 
        criteria, 
        eligibilityDetails,
        currentPerformance: {
          monthlyJobs: tierStatus.monthlyJobsCompleted,
          monthlyRevenue: Number(tierStatus.monthlyRevenue),
          averageRating: Number(tierStatus.averageRating),
          complaintRatio: tierStatus.customerComplaints / Math.max(tierStatus.monthlyJobsCompleted, 1),
        }
      };
    } catch (error) {
      console.error('Error checking tier advancement:', error);
      return { success: false, error: 'Failed to check tier advancement' };
    }
  }

  // Promote professional to next tier
  static async promoteProfessional(professionalId: string) {
    try {
      const advancementCheck = await this.checkTierAdvancement(professionalId);
      
      if (!advancementCheck.success || !advancementCheck.eligible) {
        return { success: false, error: 'Professional not eligible for promotion' };
      }

      const currentTierStatus = await prisma.professionalTierStatus.findUnique({
        where: { professionalId },
      });

      if (!currentTierStatus) {
        return { success: false, error: 'Tier status not found' };
      }

      const nextTier = advancementCheck.nextTier!;
      const tierBenefits = this.getTierBenefits(nextTier);

      const updatedTierStatus = await prisma.professionalTierStatus.update({
        where: { professionalId },
        data: {
          previousTier: currentTierStatus.currentTier,
          currentTier: nextTier,
          status: TierStatus.PROMOTED,
          monthsInTier: 0,
          tierPoints: currentTierStatus.tierPoints + 100, // Bonus points for promotion
          tierAchievedAt: new Date(),
          eligibleForPromotion: false,
          achievementBadges: [
            ...currentTierStatus.achievementBadges,
            `${nextTier}_TIER_ACHIEVED`,
          ],
          ...tierBenefits,
        },
      });

      return { success: true, newTier: nextTier, tierStatus: updatedTierStatus };
    } catch (error) {
      console.error('Error promoting professional:', error);
      return { success: false, error: 'Failed to promote professional' };
    }
  }

  // Get tier benefits based on tier level
  static getTierBenefits(tier: ProfessionalTier) {
    const baseBenefits = {
      territoryProtection: false,
      exclusiveZipCodes: [] as string[],
      commissionBonus: 0,
      priorityAlerts: false,
      advancedAnalytics: false,
    };

    switch (tier) {
      case 'GOLD':
        return {
          ...baseBenefits,
          territoryProtection: true,
          commissionBonus: 5, // 5% bonus
          priorityAlerts: true,
        };
      case 'PLATINUM':
        return {
          ...baseBenefits,
          territoryProtection: true,
          commissionBonus: 10, // 10% bonus
          priorityAlerts: true,
          advancedAnalytics: true,
        };
      case 'ELITE':
        return {
          ...baseBenefits,
          territoryProtection: true,
          commissionBonus: 15, // 15% bonus
          priorityAlerts: true,
          advancedAnalytics: true,
        };
      default:
        return baseBenefits;
    }
  }

  // Get tier analytics and distribution
  static async getTierAnalytics() {
    try {
      const tierStatuses = await prisma.professionalTierStatus.findMany({
        include: {
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              city: true,
              state: true,
            },
          },
        },
      });

      const tierDistribution = tierStatuses.reduce((acc, status) => {
        acc[status.currentTier] = (acc[status.currentTier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const averageMetrics = {
        averageMonthlyJobs: tierStatuses.reduce((sum, s) => sum + s.monthlyJobsCompleted, 0) / tierStatuses.length,
        averageMonthlyRevenue: tierStatuses.reduce((sum, s) => sum + Number(s.monthlyRevenue), 0) / tierStatuses.length,
        averageRating: tierStatuses.reduce((sum, s) => sum + Number(s.averageRating), 0) / tierStatuses.length,
      };

      const topPerformers = tierStatuses
        .filter(s => ['PLATINUM', 'ELITE'].includes(s.currentTier))
        .sort((a, b) => Number(b.monthlyRevenue) - Number(a.monthlyRevenue))
        .slice(0, 10);

      const promotionEligible = tierStatuses.filter(s => s.eligibleForPromotion).length;

      return {
        success: true,
        analytics: {
          totalProfessionals: tierStatuses.length,
          tierDistribution,
          averageMetrics,
          topPerformers,
          promotionEligible,
        },
      };
    } catch (error) {
      console.error('Error fetching tier analytics:', error);
      return { success: false, error: 'Failed to fetch tier analytics' };
    }
  }

  // Get professional tier dashboard
  static async getProfessionalTierDashboard(professionalId: string) {
    try {
      const tierStatus = await prisma.professionalTierStatus.findUnique({
        where: { professionalId },
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
      });

      if (!tierStatus) {
        return { success: false, error: 'Tier status not found' };
      }

      const advancementCheck = await this.checkTierAdvancement(professionalId);
      const currentTierCriteria = this.TIER_CRITERIA[tierStatus.currentTier];

      return {
        success: true,
        dashboard: {
          currentTier: tierStatus.currentTier,
          tierStatus: tierStatus.status,
          monthsInTier: tierStatus.monthsInTier,
          tierPoints: tierStatus.tierPoints,
          benefits: {
            territoryProtection: tierStatus.territoryProtection,
            exclusiveZipCodes: tierStatus.exclusiveZipCodes,
            commissionBonus: tierStatus.commissionBonus,
            priorityAlerts: tierStatus.priorityAlerts,
            advancedAnalytics: tierStatus.advancedAnalytics,
          },
          performance: {
            monthlyJobs: tierStatus.monthlyJobsCompleted,
            monthlyRevenue: Number(tierStatus.monthlyRevenue),
            averageRating: Number(tierStatus.averageRating),
            customerComplaints: tierStatus.customerComplaints,
          },
          advancement: advancementCheck.success ? {
            eligible: advancementCheck.eligible,
            nextTier: advancementCheck.nextTier,
            requirements: advancementCheck.eligibilityDetails,
          } : null,
          achievements: tierStatus.achievementBadges,
        },
      };
    } catch (error) {
      console.error('Error fetching professional tier dashboard:', error);
      return { success: false, error: 'Failed to fetch tier dashboard' };
    }
  }

  // Monthly tier review process
  static async monthlyTierReview() {
    try {
      const professionals = await prisma.user.findMany({
        where: {
          role: 'PROFESSIONAL',
          tierStatus: {
            isNot: null,
          },
        },
        include: {
          tierStatus: true,
        },
      });

      const results = {
        reviewed: 0,
        promoted: 0,
        demoted: 0,
        errors: [] as string[],
      };

      for (const professional of professionals) {
        try {
          // Update performance metrics
          await this.updatePerformanceMetrics(professional.id);
          
          // Check advancement
          await this.checkTierAdvancement(professional.id);
          
          // Update months in tier
          if (professional.tierStatus) {
            await prisma.professionalTierStatus.update({
              where: { professionalId: professional.id },
              data: {
                monthsInTier: professional.tierStatus.monthsInTier + 1,
                lastReviewedAt: new Date(),
              },
            });
          }
          
          results.reviewed++;
        } catch (error) {
          console.error(`Error reviewing professional ${professional.id}:`, error);
          results.errors.push(`Failed to review professional ${professional.id}`);
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error in monthly tier review:', error);
      return { success: false, error: 'Failed to complete monthly tier review' };
    }
  }
}
