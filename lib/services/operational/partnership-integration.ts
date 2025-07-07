
import { prisma } from '@/lib/db';
import type { 
  SystemIntegration,
  IntegrationLog,
  EquipmentPartnership,
  EquipmentOrder,
  InsuranceIntegration,
  InsuranceClaim,
  IntegrationType,
  IntegrationStatus
} from '@prisma/client';

export interface CreateIntegrationData {
  name: string;
  description: string;
  type: IntegrationType;
  apiEndpoint?: string;
  apiKey?: string;
  webhookUrl?: string;
  authMethod?: string;
  configuration?: any;
  mappingRules?: any;
  syncFrequency?: string;
}

export interface IntegrationHealth {
  totalIntegrations: number;
  activeIntegrations: number;
  errorIntegrations: number;
  avgSuccessRate: number;
  recentFailures: IntegrationLog[];
  syncStatus: Record<string, string>;
}

export interface PartnershipMetrics {
  totalPartnerships: number;
  activePartnerships: number;
  totalSavings: number;
  totalPurchases: number;
  averageDeliveryTime: number;
  defectRate: number;
  partnerPerformance: Array<{
    partner: string;
    score: number;
    savings: number;
    reliability: number;
  }>;
}

export interface InsuranceMetrics {
  totalClaims: number;
  approvedClaims: number;
  deniedClaims: number;
  averageProcessingTime: number;
  approvalRate: number;
  totalClaimValue: number;
  totalPaidOut: number;
  savingsGenerated: number;
}

export class PartnershipIntegrationService {
  // System Integration Management
  async createIntegration(data: CreateIntegrationData): Promise<SystemIntegration> {
    return await prisma.systemIntegration.create({
      data: {
        ...data,
        status: 'ACTIVE',
        isMonitored: true,
        alertOnFailure: true,
        errorCount: 0,
      },
    });
  }

  async updateIntegrationStatus(
    integrationId: string,
    status: IntegrationStatus,
    errorMessage?: string
  ): Promise<SystemIntegration> {
    const updateData: any = { status };
    
    if (status === 'ERROR' && errorMessage) {
      updateData.errorCount = {
        increment: 1,
      };
    }

    return await prisma.systemIntegration.update({
      where: { id: integrationId },
      data: updateData,
    });
  }

  async syncIntegration(
    integrationId: string,
    operation: string = 'Sync',
    requestData?: any
  ): Promise<IntegrationLog> {
    const integration = await prisma.systemIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    const startTime = new Date();
    let status = 'Success';
    let errorMessage: string | undefined;
    let responseData: any = {};
    let recordsProcessed = 0;
    let recordsSucceeded = 0;
    let recordsFailed = 0;

    try {
      // Simulate integration sync process
      const syncResult = await this.performSync(integration, operation, requestData);
      
      recordsProcessed = syncResult.recordsProcessed;
      recordsSucceeded = syncResult.recordsSucceeded;
      recordsFailed = syncResult.recordsFailed;
      responseData = syncResult.responseData;

      if (recordsFailed > 0) {
        status = recordsFailed === recordsProcessed ? 'Failed' : 'Warning';
      }
    } catch (error) {
      status = 'Failed';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      recordsFailed = recordsProcessed;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Create log entry
    const log = await prisma.integrationLog.create({
      data: {
        integrationId,
        operation,
        status,
        recordsProcessed,
        recordsSucceeded,
        recordsFailed,
        startTime,
        endTime,
        duration,
        errorMessage,
        requestData,
        responseData,
      },
    });

    // Update integration metrics
    await this.updateIntegrationMetrics(integrationId);

    return log;
  }

  async testIntegrationConnection(integrationId: string): Promise<boolean> {
    const integration = await prisma.systemIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    try {
      // Simulate connection test
      const testResult = await this.testConnection(integration);
      
      await prisma.systemIntegration.update({
        where: { id: integrationId },
        data: {
          status: testResult ? 'ACTIVE' : 'ERROR',
          lastSyncAt: new Date(),
        },
      });

      return testResult;
    } catch (error) {
      await prisma.systemIntegration.update({
        where: { id: integrationId },
        data: {
          status: 'ERROR',
          errorCount: { increment: 1 },
        },
      });

      return false;
    }
  }

  // Equipment Partnership Management
  async createEquipmentPartnership(data: {
    manufacturerName: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    discountPercentage?: number;
    volumeThresholds?: any;
    exclusiveProducts?: string[];
    inventoryApiUrl?: string;
    realTimeInventory?: boolean;
    autoReorder?: boolean;
    reorderThreshold?: number;
    partnershipStart: Date;
  }): Promise<EquipmentPartnership> {
    return await prisma.equipmentPartnership.create({
      data: {
        ...data,
        totalPurchases: 0,
        totalSavings: 0,
        exclusiveProducts: data.exclusiveProducts || [],
        realTimeInventory: data.realTimeInventory || false,
        autoReorder: data.autoReorder || false,
      },
    });
  }

  async createEquipmentOrder(data: {
    orderNumber: string;
    orderType: string;
    partnershipId?: string;
    orderedById: string;
    totalAmount: number;
    discountApplied?: number;
    taxAmount?: number;
    shippingCost?: number;
    items: any;
    requestedDeliveryDate?: Date;
    deliveryAddress?: string;
  }): Promise<EquipmentOrder> {
    const order = await prisma.equipmentOrder.create({
      data: {
        ...data,
        status: 'Pending',
      },
      include: {
        partnership: true,
        orderedBy: true,
      },
    });

    // Update partnership metrics
    if (data.partnershipId) {
      await this.updatePartnershipMetrics(data.partnershipId, data.totalAmount, data.discountApplied || 0);
    }

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    actualDeliveryDate?: Date
  ): Promise<EquipmentOrder> {
    const updateData: any = { status };
    
    if (status === 'Delivered' && actualDeliveryDate) {
      updateData.actualDeliveryDate = actualDeliveryDate;
    }

    const order = await prisma.equipmentOrder.update({
      where: { id: orderId },
      data: updateData,
      include: {
        partnership: true,
      },
    });

    // Calculate delivery time for metrics
    if (status === 'Delivered' && order.requestedDeliveryDate && actualDeliveryDate) {
      const deliveryTime = Math.ceil(
        (actualDeliveryDate.getTime() - order.requestedDeliveryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (order.partnershipId) {
        await this.updateDeliveryMetrics(order.partnershipId, deliveryTime);
      }
    }

    return order;
  }

  // Insurance Integration Management
  async createInsuranceIntegration(data: {
    companyName: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    apiEndpoint?: string;
    authCredentials?: string;
    claimSubmissionUrl?: string;
    preferredRates?: boolean;
    expeditedClaims?: boolean;
    directBilling?: boolean;
  }): Promise<InsuranceIntegration> {
    return await prisma.insuranceIntegration.create({
      data: {
        ...data,
        claimsSubmitted: 0,
        savingsGenerated: 0,
        preferredRates: data.preferredRates || false,
        expeditedClaims: data.expeditedClaims || false,
        directBilling: data.directBilling || false,
      },
    });
  }

  async submitInsuranceClaim(data: {
    claimNumber: string;
    claimType: string;
    description: string;
    incidentDate: Date;
    incidentLocation: string;
    damageAmount?: number;
    requestedAmount: number;
    deductible?: number;
    documents?: string[];
    photos?: string[];
    integrationId?: string;
    jobId?: string;
    claimantId: string;
  }): Promise<InsuranceClaim> {
    const claim = await prisma.insuranceClaim.create({
      data: {
        ...data,
        status: 'Submitted',
        documents: data.documents || [],
        photos: data.photos || [],
      },
      include: {
        integration: true,
        claimant: true,
        job: true,
      },
    });

    // Update integration metrics
    if (data.integrationId) {
      await prisma.insuranceIntegration.update({
        where: { id: data.integrationId },
        data: {
          claimsSubmitted: { increment: 1 },
        },
      });
    }

    return claim;
  }

  async updateClaimStatus(
    claimId: string,
    status: string,
    approvedAmount?: number,
    denialReason?: string
  ): Promise<InsuranceClaim> {
    const updateData: any = { status };
    
    if (status === 'Approved' && approvedAmount !== undefined) {
      updateData.approvedAmount = approvedAmount;
      updateData.approvedDate = new Date();
    }
    
    if (status === 'Paid') {
      updateData.paidDate = new Date();
    }

    return await prisma.insuranceClaim.update({
      where: { id: claimId },
      data: updateData,
      include: {
        integration: true,
      },
    });
  }

  // Analytics & Metrics
  async getIntegrationHealth(): Promise<IntegrationHealth> {
    const [
      totalIntegrations,
      activeIntegrations,
      errorIntegrations,
      successRateData,
      recentFailures,
      allIntegrations,
    ] = await Promise.all([
      prisma.systemIntegration.count(),
      prisma.systemIntegration.count({ where: { status: 'ACTIVE' } }),
      prisma.systemIntegration.count({ where: { status: 'ERROR' } }),
      prisma.systemIntegration.aggregate({
        where: { successRate: { not: null } },
        _avg: { successRate: true },
      }),
      prisma.integrationLog.findMany({
        where: { status: 'Failed' },
        orderBy: { startTime: 'desc' },
        take: 10,
        include: { integration: true },
      }),
      prisma.systemIntegration.findMany({
        select: { id: true, name: true, status: true, syncStatus: true },
      }),
    ]);

    const syncStatus = allIntegrations.reduce((acc, integration) => {
      acc[integration.name] = integration.syncStatus || 'Unknown';
      return acc;
    }, {} as Record<string, string>);

    return {
      totalIntegrations,
      activeIntegrations,
      errorIntegrations,
      avgSuccessRate: successRateData._avg.successRate?.toNumber() || 0,
      recentFailures,
      syncStatus,
    };
  }

  async getPartnershipMetrics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<PartnershipMetrics> {
    const orderWhereClause: any = {};
    if (dateFrom || dateTo) {
      orderWhereClause.orderDate = {};
      if (dateFrom) orderWhereClause.orderDate.gte = dateFrom;
      if (dateTo) orderWhereClause.orderDate.lte = dateTo;
    }

    const [
      totalPartnerships,
      activePartnerships,
      partnershipData,
      orderData,
    ] = await Promise.all([
      prisma.equipmentPartnership.count(),
      prisma.equipmentPartnership.count({
        where: { totalPurchases: { gt: 0 } },
      }),
      prisma.equipmentPartnership.findMany({
        include: {
          equipmentOrders: {
            where: orderWhereClause,
          },
        },
      }),
      prisma.equipmentOrder.aggregate({
        where: orderWhereClause,
        _sum: { totalAmount: true, discountApplied: true },
        _avg: { 
          totalAmount: true,
        },
      }),
    ]);

    const totalPurchases = orderData._sum.totalAmount?.toNumber() || 0;
    const totalSavings = orderData._sum.discountApplied?.toNumber() || 0;

    // Calculate partnership performance scores
    const partnerPerformance = partnershipData.map(partnership => {
      const orders = partnership.equipmentOrders;
      const partnerSavings = partnership.totalSavings.toNumber();
      const deliveryTimes = orders
        .filter(o => o.actualDeliveryDate && o.requestedDeliveryDate)
        .map(o => {
          const delivered = o.actualDeliveryDate!.getTime();
          const requested = o.requestedDeliveryDate!.getTime();
          return Math.ceil((delivered - requested) / (1000 * 60 * 60 * 24));
        });

      const avgDeliveryTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
        : 0;

      const reliabilityScore = Math.max(0, 100 - (avgDeliveryTime * 2)); // Penalty for late delivery
      const savingsScore = Math.min(100, partnerSavings / 1000); // Score based on savings

      return {
        partner: partnership.manufacturerName,
        score: (reliabilityScore + savingsScore) / 2,
        savings: partnerSavings,
        reliability: reliabilityScore,
      };
    });

    const avgDeliveryTime = partnershipData.reduce((total, partnership) => {
      return total + (partnership.averageDeliveryTime || 0);
    }, 0) / partnershipData.length;

    const defectRate = partnershipData.reduce((total, partnership) => {
      return total + (partnership.defectRate?.toNumber() || 0);
    }, 0) / partnershipData.length;

    return {
      totalPartnerships,
      activePartnerships,
      totalSavings,
      totalPurchases,
      averageDeliveryTime: avgDeliveryTime || 0,
      defectRate: defectRate || 0,
      partnerPerformance,
    };
  }

  async getInsuranceMetrics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<InsuranceMetrics> {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.submittedDate = {};
      if (dateFrom) whereClause.submittedDate.gte = dateFrom;
      if (dateTo) whereClause.submittedDate.lte = dateTo;
    }

    const [
      totalClaims,
      approvedClaims,
      deniedClaims,
      processingTimeData,
      claimValueData,
      paidOutData,
      savingsData,
    ] = await Promise.all([
      prisma.insuranceClaim.count({ where: whereClause }),
      prisma.insuranceClaim.count({
        where: { ...whereClause, status: 'Approved' },
      }),
      prisma.insuranceClaim.count({
        where: { ...whereClause, status: 'Denied' },
      }),
      prisma.insuranceClaim.findMany({
        where: {
          ...whereClause,
          approvedDate: { not: null },
          submittedDate: { not: null },
        },
        select: { submittedDate: true, approvedDate: true },
      }),
      prisma.insuranceClaim.aggregate({
        where: whereClause,
        _sum: { requestedAmount: true },
      }),
      prisma.insuranceClaim.aggregate({
        where: { ...whereClause, status: 'Paid' },
        _sum: { approvedAmount: true },
      }),
      prisma.insuranceIntegration.aggregate({
        _sum: { savingsGenerated: true },
      }),
    ]);

    const averageProcessingTime = processingTimeData.length > 0
      ? processingTimeData.reduce((total, claim) => {
          if (claim.approvedDate && claim.submittedDate) {
            const days = Math.ceil(
              (claim.approvedDate.getTime() - claim.submittedDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            return total + days;
          }
          return total;
        }, 0) / processingTimeData.length
      : 0;

    const approvalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0;

    return {
      totalClaims,
      approvedClaims,
      deniedClaims,
      averageProcessingTime,
      approvalRate,
      totalClaimValue: claimValueData._sum.requestedAmount?.toNumber() || 0,
      totalPaidOut: paidOutData._sum.approvedAmount?.toNumber() || 0,
      savingsGenerated: savingsData._sum.savingsGenerated?.toNumber() || 0,
    };
  }

  // Private Helper Methods
  private async performSync(
    integration: SystemIntegration,
    operation: string,
    requestData?: any
  ): Promise<{
    recordsProcessed: number;
    recordsSucceeded: number;
    recordsFailed: number;
    responseData: any;
  }> {
    // Simulate integration sync - would use actual API calls in production
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call delay

    const recordsProcessed = Math.floor(Math.random() * 100) + 10;
    const failureRate = Math.random() * 0.1; // 0-10% failure rate
    const recordsFailed = Math.floor(recordsProcessed * failureRate);
    const recordsSucceeded = recordsProcessed - recordsFailed;

    return {
      recordsProcessed,
      recordsSucceeded,
      recordsFailed,
      responseData: {
        operation,
        timestamp: new Date().toISOString(),
        processed: recordsProcessed,
        succeeded: recordsSucceeded,
        failed: recordsFailed,
      },
    };
  }

  private async testConnection(integration: SystemIntegration): Promise<boolean> {
    // Simulate connection test - would use actual connectivity check in production
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 95% success rate for simulation
    return Math.random() > 0.05;
  }

  private async updateIntegrationMetrics(integrationId: string): Promise<void> {
    const logs = await prisma.integrationLog.findMany({
      where: { integrationId },
      orderBy: { startTime: 'desc' },
      take: 100, // Last 100 sync operations
    });

    if (logs.length === 0) return;

    const successfulLogs = logs.filter(log => log.status === 'Success');
    const successRate = (successfulLogs.length / logs.length) * 100;

    const totalRecordsProcessed = logs.reduce(
      (sum, log) => sum + (log.recordsProcessed || 0), 0
    );
    const totalRecordsSucceeded = logs.reduce(
      (sum, log) => sum + (log.recordsSucceeded || 0), 0
    );

    const lastSync = logs[0];
    const syncStatus = lastSync.status;

    await prisma.systemIntegration.update({
      where: { id: integrationId },
      data: {
        successRate,
        lastSyncAt: lastSync.startTime,
        syncStatus,
      },
    });
  }

  private async updatePartnershipMetrics(
    partnershipId: string,
    orderAmount: number,
    discountAmount: number
  ): Promise<void> {
    await prisma.equipmentPartnership.update({
      where: { id: partnershipId },
      data: {
        totalPurchases: { increment: orderAmount },
        totalSavings: { increment: discountAmount },
      },
    });
  }

  private async updateDeliveryMetrics(
    partnershipId: string,
    deliveryTime: number
  ): Promise<void> {
    const partnership = await prisma.equipmentPartnership.findUnique({
      where: { id: partnershipId },
      include: {
        equipmentOrders: {
          where: { status: 'Delivered' },
        },
      },
    });

    if (partnership) {
      const deliveredOrders = partnership.equipmentOrders;
      const totalDeliveryTime = deliveredOrders.reduce((sum, order) => {
        if (order.actualDeliveryDate && order.requestedDeliveryDate) {
          return sum + Math.ceil(
            (order.actualDeliveryDate.getTime() - order.requestedDeliveryDate.getTime()) / 
            (1000 * 60 * 60 * 24)
          );
        }
        return sum;
      }, 0);

      const averageDeliveryTime = deliveredOrders.length > 0 
        ? totalDeliveryTime / deliveredOrders.length 
        : 0;

      await prisma.equipmentPartnership.update({
        where: { id: partnershipId },
        data: { averageDeliveryTime },
      });
    }
  }
}

export const partnershipIntegrationService = new PartnershipIntegrationService();
