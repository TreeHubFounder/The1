
// Operational Infrastructure Services
// Complete business operating system for TreeHub

export { customerServiceService } from './customer-service';
export { hrManagementService } from './hr-management';
export { businessIntelligenceService } from './business-intelligence';
export { partnershipIntegrationService } from './partnership-integration';
export { cashFlowManagementService } from './cash-flow-management';
export { fundingInvestmentService } from './funding-investment';
export { financialControlsService } from './financial-controls';
export { brandTrustManagementService } from './brand-trust-management';
export { customerAcquisitionGrowthService } from './customer-acquisition-growth';
export { legalSafetyInfrastructureService } from './legal-safety-infrastructure';

// Export all service types for easy importing
export type {
  // Customer Service Types
  CreateTicketData,
  TicketMetrics,
  LiveChatMetrics,
} from './customer-service';

export type {
  // HR Management Types
  CreateEmployeeData,
  PerformanceMetrics,
  PayrollData,
} from './hr-management';

export type {
  // Business Intelligence Types
  CreateKPIData,
  KPIDashboard,
  PredictiveInsights,
  BusinessReport,
} from './business-intelligence';

export type {
  // Partnership Integration Types
  CreateIntegrationData,
  IntegrationHealth,
  PartnershipMetrics,
  InsuranceMetrics,
} from './partnership-integration';

export type {
  // Cash Flow Management Types
  CreateCashFlowEntryData,
  CashFlowSummary,
  ForecastData,
  WorkingCapitalSummary,
} from './cash-flow-management';

export type {
  // Funding Investment Types
  CreateFundingRoundData,
  CreateInvestorData,
  FundraisingMetrics,
  InvestorPipeline,
  RunwayProjection,
} from './funding-investment';

export type {
  // Financial Controls Types
  CreateTaxDocumentData,
  TaxSummary,
  ComplianceStatus,
  FraudMetrics,
  DisputeAnalysis,
} from './financial-controls';

export type {
  // Brand Trust Management Types
  CreateCertificationData,
  TrustScoreCalculation,
  ReputationSummary,
  CrisisResponse,
} from './brand-trust-management';

export type {
  // Customer Acquisition Growth Types
  CreateCustomerAcquisitionData,
  CampaignPerformance,
  GrowthMetrics,
  ExperimentSummary,
} from './customer-acquisition-growth';

export type {
  // Legal Safety Infrastructure Types
  CreateContractData,
  CreateSafetyIncidentData,
  SafetyMetrics,
  ComplianceSummary,
  ContractPortfolio,
} from './legal-safety-infrastructure';

/**
 * TreeHub Operational Infrastructure Services
 * 
 * This module provides a complete business operating system with 10 core operational areas:
 * 
 * 1. Customer Service & Support Management
 * 2. Team Building & HR Management
 * 3. Advanced Analytics & Business Intelligence
 * 4. Partnership & Integration Hub
 * 5. Cash Flow & Working Capital Management
 * 6. Funding & Investment Management
 * 7. Financial Controls & Compliance
 * 8. Brand Building & Trust Management
 * 9. Customer Acquisition & Growth Analytics
 * 10. Legal & Safety Infrastructure
 * 
 * Each service provides:
 * - Complete CRUD operations
 * - Business logic implementation
 * - Performance analytics
 * - Real-time monitoring
 * - Compliance tracking
 * - Strategic insights
 */

// Operational Services Registry
// TODO: Fix service registry imports for production
// export const operationalServices = {
//   customerService: customerServiceService,
//   hrManagement: hrManagementService,
//   businessIntelligence: businessIntelligenceService,
//   partnershipIntegration: partnershipIntegrationService,
//   cashFlowManagement: cashFlowManagementService,
//   fundingInvestment: fundingInvestmentService,
//   financialControls: financialControlsService,
//   brandTrustManagement: brandTrustManagementService,
//   customerAcquisitionGrowth: customerAcquisitionGrowthService,
//   legalSafetyInfrastructure: legalSafetyInfrastructureService,
// } as const;

// Service Categories for UI Organization
export const serviceCategories = {
  'Customer Operations': [
    'customerService',
    'brandTrustManagement',
    'customerAcquisitionGrowth',
  ],
  'Business Operations': [
    'hrManagement',
    'legalSafetyInfrastructure',
    'partnershipIntegration',
  ],
  'Financial Operations': [
    'cashFlowManagement',
    'fundingInvestment',
    'financialControls',
  ],
  'Strategic Operations': [
    'businessIntelligence',
  ],
} as const;

// Key Performance Indicators for Dashboard
export const operationalKPIs = [
  'Customer Satisfaction Score',
  'Employee Retention Rate', 
  'Cash Flow Health',
  'Trust Score',
  'Safety Incident Rate',
  'Compliance Rate',
  'Growth Rate',
  'Runway Months',
  'Customer Acquisition Cost',
  'Lifetime Value Ratio',
] as const;
