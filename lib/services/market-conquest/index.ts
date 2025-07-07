
// Market Conquest Services Index
// Centralized exports for all market conquest services

import { TerritoryService } from './territory-service';
import { TierService } from './tier-service';
import { CompetitorService } from './competitor-service';
import { PartnershipService } from './partnership-service';
import { AnalyticsService } from './analytics-service';
import { ExecutionService } from './execution-service';
import { PropertyManagementService } from './property-management-service';

export { TerritoryService } from './territory-service';
export { TierService } from './tier-service';
export { CompetitorService } from './competitor-service';
export { PartnershipService } from './partnership-service';
export { AnalyticsService } from './analytics-service';
export { ExecutionService } from './execution-service';
export { PropertyManagementService } from './property-management-service';

// Type exports
export type { TerritoryData, TerritoryAssignmentData } from './territory-service';
export type { TierAdvancementCriteria } from './tier-service';
export type { CompetitorData, CompetitorAnalysisData } from './competitor-service';
export type { PartnershipData, PartnershipActivityData } from './partnership-service';
export type { ConquestMetricsData, RevenueProjection } from './analytics-service';
export type { MilestoneData, WeeklyProgress } from './execution-service';
export type { PropertyManagerData, ContractData } from './property-management-service';

// Service initialization helper
export class MarketConquestService {
  static async initializeAll() {
    try {
      const results = await Promise.allSettled([
        TerritoryService.getBucksCountyTerritories(),
        TierService.getTierAnalytics(),
        CompetitorService.initializeBucksCountyCompetitors(),
        PartnershipService.initializeTargetPartnerships(),
        PropertyManagementService.initializeTargetCompanies(),
        ExecutionService.initializeConquestTimeline(),
      ]);

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.filter(r => r.status === 'rejected').length;

      return {
        success: errorCount === 0,
        initialized: successCount,
        errors: errorCount,
        message: `Market conquest services initialized: ${successCount} successful, ${errorCount} errors`,
      };
    } catch (error) {
      console.error('Error initializing market conquest services:', error);
      return {
        success: false,
        error: 'Failed to initialize market conquest services',
      };
    }
  }

  static async getConquestOverview() {
    try {
      const [
        territoryAnalytics,
        tierAnalytics,
        competitiveDashboard,
        partnershipDashboard,
        propertyManagementDashboard,
        executionDashboard,
        conquestDashboard,
      ] = await Promise.all([
        TerritoryService.getTerritoryAnalytics(),
        TierService.getTierAnalytics(),
        CompetitorService.getCompetitiveDashboard(),
        PartnershipService.getPartnershipDashboard(),
        PropertyManagementService.getPropertyManagementDashboard(),
        ExecutionService.getExecutionDashboard(),
        AnalyticsService.generateConquestDashboard(),
      ]);

      return {
        success: true,
        overview: {
          territory: territoryAnalytics.success ? territoryAnalytics.analytics : null,
          tiers: tierAnalytics.success ? tierAnalytics.analytics : null,
          competitive: competitiveDashboard.success ? competitiveDashboard.dashboard : null,
          partnerships: partnershipDashboard.success ? partnershipDashboard.dashboard : null,
          propertyManagement: propertyManagementDashboard.success ? propertyManagementDashboard.dashboard : null,
          execution: executionDashboard.success ? executionDashboard.dashboard : null,
          conquest: conquestDashboard.success ? conquestDashboard.dashboard : null,
        },
      };
    } catch (error) {
      console.error('Error getting conquest overview:', error);
      return { success: false, error: 'Failed to get conquest overview' };
    }
  }
}
