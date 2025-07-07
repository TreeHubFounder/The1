
import { prisma } from '@/lib/db';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

// Subscription tier pricing and features
export const SUBSCRIPTION_TIERS = {
  BASIC: {
    monthlyPrice: 99,
    annualPrice: 990, // 2 months free
    features: {
      stormResponseAgent: false,
      jobMatchingAgent: true,
      equipmentIntelligence: false,
      weatherIntegration: true,
      advancedAnalytics: false,
      apiAccess: false,
    },
    limits: {
      monthlyLeadLimit: 50,
      monthlyJobMatches: 100,
      weatherApiCalls: 1000,
    },
  },
  PREMIUM: {
    monthlyPrice: 299,
    annualPrice: 2990, // 2 months free
    features: {
      stormResponseAgent: true,
      jobMatchingAgent: true,
      equipmentIntelligence: true,
      weatherIntegration: true,
      advancedAnalytics: true,
      apiAccess: false,
    },
    limits: {
      monthlyLeadLimit: 200,
      monthlyJobMatches: 500,
      weatherApiCalls: 5000,
    },
  },
  ENTERPRISE: {
    monthlyPrice: 999,
    annualPrice: 9990, // 2 months free
    features: {
      stormResponseAgent: true,
      jobMatchingAgent: true,
      equipmentIntelligence: true,
      weatherIntegration: true,
      advancedAnalytics: true,
      apiAccess: true,
    },
    limits: {
      monthlyLeadLimit: 1000,
      monthlyJobMatches: 2000,
      weatherApiCalls: 20000,
    },
  },
};

export class SubscriptionService {
  // Create or upgrade subscription
  static async createSubscription(
    userId: string,
    tier: SubscriptionTier,
    isAnnual: boolean = false
  ): Promise<any> {
    try {
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      const price = isAnnual ? tierConfig.annualPrice : tierConfig.monthlyPrice;

      // Check if user already has a subscription
      const existingSubscription = await prisma.aISubscription.findUnique({
        where: { userId },
      });

      if (existingSubscription) {
        // Upgrade existing subscription
        return await this.upgradeSubscription(userId, tier, isAnnual);
      }

      // Create new subscription
      const subscription = await prisma.aISubscription.create({
        data: {
          userId,
          tier,
          status: 'TRIAL',
          monthlyPrice: tierConfig.monthlyPrice,
          annualPrice: tierConfig.annualPrice,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000),
          ...tierConfig.features,
          ...tierConfig.limits,
        },
      });

      // Track revenue for trial conversion
      await prisma.revenueTracking.create({
        data: {
          source: 'Subscription',
          sourceId: subscription.id,
          amount: 0, // Trial start - no immediate revenue
          revenueType: 'Recurring',
          category: 'AI_Subscription',
          subcategory: tier,
          customerId: userId,
        },
      });

      return subscription;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  // Upgrade subscription
  static async upgradeSubscription(
    userId: string,
    newTier: SubscriptionTier,
    isAnnual: boolean = false
  ): Promise<any> {
    try {
      const tierConfig = SUBSCRIPTION_TIERS[newTier];
      const price = isAnnual ? tierConfig.annualPrice : tierConfig.monthlyPrice;

      const subscription = await prisma.aISubscription.update({
        where: { userId },
        data: {
          tier: newTier,
          status: 'ACTIVE',
          monthlyPrice: tierConfig.monthlyPrice,
          annualPrice: tierConfig.annualPrice,
          ...tierConfig.features,
          ...tierConfig.limits,
        },
      });

      // Track upgrade revenue
      await prisma.revenueTracking.create({
        data: {
          source: 'Subscription',
          sourceId: subscription.id,
          amount: price,
          revenueType: 'Recurring',
          category: 'AI_Subscription',
          subcategory: `${newTier}_Upgrade`,
          customerId: userId,
        },
      });

      return subscription;
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      throw new Error('Failed to upgrade subscription');
    }
  }

  // Process subscription payment
  static async processSubscriptionPayment(userId: string): Promise<any> {
    try {
      const subscription = await prisma.aISubscription.findUnique({
        where: { userId },
        include: { user: true },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const isAnnual = subscription.currentPeriodEnd && subscription.currentPeriodStart
        ? (subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime()) > (35 * 24 * 60 * 60 * 1000)
        : false;

      const amount = isAnnual ? subscription.annualPrice : subscription.monthlyPrice;

      // Update subscription period
      const now = new Date();
      const nextPeriodEnd = new Date(now.getTime() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000);

      await prisma.aISubscription.update({
        where: { userId },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: nextPeriodEnd,
        },
      });

      // Track subscription revenue
      await prisma.revenueTracking.create({
        data: {
          source: 'Subscription',
          sourceId: subscription.id,
          amount: Number(amount),
          revenueType: 'Recurring',
          category: 'AI_Subscription',
          subcategory: subscription.tier,
          customerId: userId,
          profitMargin: 85, // High margin for software
        },
      });

      return {
        success: true,
        amount: Number(amount),
        nextBillingDate: nextPeriodEnd,
      };
    } catch (error) {
      console.error('Failed to process subscription payment:', error);
      throw new Error('Failed to process subscription payment');
    }
  }

  // Check subscription limits
  static async checkSubscriptionLimits(userId: string, limitType: string): Promise<boolean> {
    try {
      const subscription = await prisma.aISubscription.findUnique({
        where: { userId },
      });

      if (!subscription || subscription.status !== 'ACTIVE') {
        return false;
      }

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      switch (limitType) {
        case 'leads':
          const leadsThisMonth = await prisma.leadGeneration.count({
            where: {
              assignedContractorId: userId,
              createdAt: {
                gte: new Date(currentYear, currentMonth, 1),
                lt: new Date(currentYear, currentMonth + 1, 1),
              },
            },
          });
          return leadsThisMonth < (subscription.monthlyLeadLimit || 0);

        case 'jobMatches':
          const matchesThisMonth = await prisma.jobMatch.count({
            where: {
              contractorId: userId,
              createdAt: {
                gte: new Date(currentYear, currentMonth, 1),
                lt: new Date(currentYear, currentMonth + 1, 1),
              },
            },
          });
          return matchesThisMonth < (subscription.monthlyJobMatches || 0);

        default:
          return true;
      }
    } catch (error) {
      console.error('Failed to check subscription limits:', error);
      return false;
    }
  }

  // Cancel subscription
  static async cancelSubscription(userId: string): Promise<any> {
    try {
      const subscription = await prisma.aISubscription.update({
        where: { userId },
        data: { status: 'CANCELLED' },
      });

      return subscription;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  // Get subscription analytics
  static async getSubscriptionAnalytics(): Promise<any> {
    try {
      const totalSubscriptions = await prisma.aISubscription.count();
      const activeSubscriptions = await prisma.aISubscription.count({
        where: { status: 'ACTIVE' },
      });
      const trialSubscriptions = await prisma.aISubscription.count({
        where: { status: 'TRIAL' },
      });

      // Revenue by tier
      const revenueByTier = await prisma.revenueTracking.groupBy({
        by: ['subcategory'],
        where: {
          category: 'AI_Subscription',
          revenueDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { amount: true },
      });

      // Monthly recurring revenue (MRR)
      const monthlyRevenue = await prisma.revenueTracking.aggregate({
        where: {
          category: 'AI_Subscription',
          revenueDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { amount: true },
      });

      return {
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        conversionRate: totalSubscriptions > 0 ? (activeSubscriptions / totalSubscriptions) * 100 : 0,
        revenueByTier: revenueByTier.map(tier => ({
          tier: tier.subcategory,
          revenue: Number(tier._sum.amount || 0),
        })),
        monthlyRecurringRevenue: Number(monthlyRevenue._sum.amount || 0),
        churnRate: 0, // Would need historical data to calculate
      };
    } catch (error) {
      console.error('Failed to get subscription analytics:', error);
      return null;
    }
  }
}
