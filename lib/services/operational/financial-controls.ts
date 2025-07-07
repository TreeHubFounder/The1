
import { db } from '@/lib/db';
import type { 
  TaxDocument,
  ComplianceRecord,
  FraudDetection,
  PaymentDispute,
  AccountingIntegration,
  AccountingSyncLog,
  TaxDocumentType,
  ComplianceType
} from '@prisma/client';

export interface CreateTaxDocumentData {
  documentType: TaxDocumentType;
  taxYear: number;
  documentNumber?: string;
  recipientId?: string;
  recipientName?: string;
  recipientTin?: string;
  recipientAddress?: string;
  totalAmount?: number;
  federalTaxWithheld?: number;
  stateTaxWithheld?: number;
  nonEmployeeCompensation?: number;
  transactionIds?: string[];
}

export interface TaxSummary {
  totalDocuments: number;
  totalAmount: number;
  totalWithheld: number;
  documentsByType: Record<string, number>;
  complianceScore: number;
  upcomingDeadlines: Array<{
    type: string;
    dueDate: Date;
    amount?: number;
  }>;
}

export interface ComplianceStatus {
  totalRequirements: number;
  compliantRequirements: number;
  nonCompliantRequirements: number;
  complianceRate: number;
  criticalIssues: number;
  upcomingAudits: Array<{
    requirement: string;
    auditDate: Date;
    riskLevel: string;
  }>;
}

export interface FraudMetrics {
  totalAlerts: number;
  falsePositives: number;
  legitimateAlerts: number;
  accuracyRate: number;
  averageRiskScore: number;
  alertsByType: Record<string, number>;
  preventedLosses: number;
}

export interface DisputeAnalysis {
  totalDisputes: number;
  resolvedDisputes: number;
  resolutionRate: number;
  averageResolutionTime: number;
  totalChargebacks: number;
  chargebackRate: number;
  disputesByType: Record<string, number>;
  financialImpact: number;
}

export class FinancialControlsService {
  // Tax Document Management
  async generateTaxDocument(data: CreateTaxDocumentData): Promise<TaxDocument> {
    const document = await db.taxDocument.create({
      data: {
        ...data,
        status: 'Draft',
        isElectronicFiling: true,
        transactionIds: data.transactionIds || [],
      },
      include: {
        recipient: true,
      },
    });

    // Auto-populate data if recipient is provided
    if (data.recipientId && !data.totalAmount) {
      await this.calculateDocumentAmounts(document.id);
    }

    return document;
  }

  async finalizeTaxDocument(
    documentId: string,
    filingMethod: string = 'Electronic'
  ): Promise<TaxDocument> {
    const document = await db.taxDocument.update({
      where: { id: documentId },
      data: {
        status: 'Generated',
        filingMethod,
        generatedDate: new Date(),
      },
    });

    // Create document URL (would integrate with actual document generation service)
    await this.generateDocumentFile(documentId);

    return document;
  }

  async fileTaxDocument(
    documentId: string,
    confirmationNumber?: string
  ): Promise<TaxDocument> {
    return await db.taxDocument.update({
      where: { id: documentId },
      data: {
        status: 'Filed',
        filedDate: new Date(),
        confirmationNumber,
      },
    });
  }

  async bulk1099Generation(
    taxYear: number,
    minimumAmount: number = 600
  ): Promise<TaxDocument[]> {
    // Get all contractors who received payments above the minimum threshold
    const contractors = await db.transaction.groupBy({
      by: ['payerId'],
      where: {
        transactionType: 'JOB_PAYMENT',
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(taxYear, 0, 1),
          lte: new Date(taxYear, 11, 31),
        },
      },
      _sum: { amount: true },
      having: {
        amount: {
          _sum: {
            gte: minimumAmount,
          },
        },
      },
    });

    const documents: TaxDocument[] = [];

    for (const contractor of contractors) {
      const user = await db.user.findUnique({
        where: { id: contractor.payerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
          address: true,
          taxId: true,
        },
      });

      if (user) {
        const totalAmount = contractor._sum.amount?.toNumber() || 0;
        
        const document = await this.generateTaxDocument({
          documentType: 'FORM_1099_NEC',
          taxYear,
          recipientId: user.id,
          recipientName: user.companyName || `${user.firstName} ${user.lastName}`,
          recipientTin: user.taxId,
          recipientAddress: user.address,
          nonEmployeeCompensation: totalAmount,
          totalAmount,
        });

        documents.push(document);
      }
    }

    return documents;
  }

  // Compliance Management
  async createComplianceRecord(data: {
    complianceType: ComplianceType;
    title: string;
    description: string;
    regulatoryBody?: string;
    regulation?: string;
    requirement: string;
    assignedTo?: string;
    lastAuditDate?: Date;
    nextAuditDate?: Date;
    evidence?: string[];
    certificates?: string[];
    nonComplianceRisk?: string;
    actionPlan?: string;
    deadline?: Date;
    complianceCost?: number;
    penaltyRisk?: number;
  }): Promise<ComplianceRecord> {
    return await db.complianceRecord.create({
      data: {
        ...data,
        status: 'Pending_Review',
        evidence: data.evidence || [],
        certificates: data.certificates || [],
      },
      include: {
        assignedUser: true,
      },
    });
  }

  async updateComplianceStatus(
    recordId: string,
    status: string,
    lastAuditDate?: Date,
    nextAuditDate?: Date
  ): Promise<ComplianceRecord> {
    return await db.complianceRecord.update({
      where: { id: recordId },
      data: {
        status,
        lastAuditDate,
        nextAuditDate,
      },
      include: {
        assignedUser: true,
      },
    });
  }

  async scheduleComplianceAudit(
    recordId: string,
    auditDate: Date,
    auditFrequency?: string
  ): Promise<ComplianceRecord> {
    return await db.complianceRecord.update({
      where: { id: recordId },
      data: {
        nextAuditDate: auditDate,
      },
    });
  }

  // Fraud Detection
  async createFraudAlert(data: {
    alertType: string;
    riskScore: number;
    severity: string;
    description: string;
    detectionRules: string[];
    userId?: string;
    transactionId?: string;
    actionsTaken?: string[];
  }): Promise<FraudDetection> {
    const alert = await db.fraudDetection.create({
      data: {
        ...data,
        status: 'Open',
        detectionRules: data.detectionRules || [],
        actionsTaken: data.actionsTaken || [],
        accountSuspended: false,
        transactionBlocked: false,
        preventionMeasures: [],
      },
      include: {
        user: true,
        transaction: true,
      },
    });

    // Auto-take actions for high-risk alerts
    if (data.riskScore >= 80) {
      await this.takeAutomatedFraudActions(alert.id);
    }

    return alert;
  }

  async investigateFraudAlert(
    alertId: string,
    investigatorId: string,
    notes?: string
  ): Promise<FraudDetection> {
    return await db.fraudDetection.update({
      where: { id: alertId },
      data: {
        status: 'Investigating',
        investigatedBy: investigatorId,
        investigatedAt: new Date(),
        notes,
      },
      include: {
        investigator: true,
        user: true,
      },
    });
  }

  async resolveFraudAlert(
    alertId: string,
    isLegitimate: boolean,
    notes?: string,
    preventionMeasures: string[] = []
  ): Promise<FraudDetection> {
    const status = isLegitimate ? 'False_Positive' : 'Resolved';
    
    return await db.fraudDetection.update({
      where: { id: alertId },
      data: {
        status,
        isLegitimate,
        notes,
        preventionMeasures,
        resolvedAt: new Date(),
      },
    });
  }

  async suspendAccount(
    userId: string,
    reason: string,
    duration?: number
  ): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: {
        status: 'SUSPENDED',
      },
    });

    // Update all related fraud alerts
    await db.fraudDetection.updateMany({
      where: { userId, status: { in: ['Open', 'Investigating'] } },
      data: {
        accountSuspended: true,
        actionsTaken: { push: `Account suspended: ${reason}` },
      },
    });
  }

  // Payment Dispute Management
  async createPaymentDispute(data: {
    disputeType: string;
    amount: number;
    reason: string;
    description: string;
    customerId: string;
    transactionId?: string;
    jobId?: string;
    priority?: string;
    evidence?: string[];
    customerEvidence?: string[];
  }): Promise<PaymentDispute> {
    return await db.paymentDispute.create({
      data: {
        ...data,
        status: 'Open',
        priority: data.priority || 'Medium',
        evidence: data.evidence || [],
        customerEvidence: data.customerEvidence || [],
        preventionActions: [],
        policyChanges: [],
      },
      include: {
        customer: true,
        transaction: true,
        job: true,
      },
    });
  }

  async respondToDispute(
    disputeId: string,
    companyResponse: string,
    evidence: string[] = []
  ): Promise<PaymentDispute> {
    return await db.paymentDispute.update({
      where: { id: disputeId },
      data: {
        companyResponse,
        evidence: { push: evidence },
        status: 'Under_Review',
      },
    });
  }

  async resolveDispute(
    disputeId: string,
    resolutionType: string,
    resolutionAmount?: number,
    resolutionNotes?: string,
    preventionActions: string[] = []
  ): Promise<PaymentDispute> {
    return await db.paymentDispute.update({
      where: { id: disputeId },
      data: {
        status: 'Resolved',
        resolutionType,
        resolutionAmount,
        resolutionNotes,
        preventionActions,
        resolvedAt: new Date(),
      },
    });
  }

  // Accounting Integration
  async createAccountingIntegration(data: {
    platform: string;
    accountId?: string;
    apiCredentials?: string;
    autoSync?: boolean;
    syncFrequency?: string;
    accountMapping?: any;
    categoryMapping?: any;
  }): Promise<AccountingIntegration> {
    return await db.accountingIntegration.create({
      data: {
        ...data,
        status: 'Active',
        autoSync: data.autoSync ?? true,
        syncFrequency: data.syncFrequency || 'Daily',
        recordsSynced: 0,
        syncErrors: 0,
        connectedAt: new Date(),
      },
    });
  }

  async syncWithAccounting(
    integrationId: string,
    syncType: string = 'Incremental',
    recordType: string = 'Transactions'
  ): Promise<AccountingSyncLog> {
    const integration = await db.accountingIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error('Accounting integration not found');
    }

    const startTime = new Date();
    let status = 'Success';
    let errorMessage: string | undefined;
    let recordsProcessed = 0;
    let recordsSucceeded = 0;
    let recordsFailed = 0;

    try {
      // Simulate accounting sync
      const syncResult = await this.performAccountingSync(
        integration,
        syncType,
        recordType
      );
      
      recordsProcessed = syncResult.processed;
      recordsSucceeded = syncResult.succeeded;
      recordsFailed = syncResult.failed;

      if (recordsFailed > 0) {
        status = recordsFailed === recordsProcessed ? 'Failed' : 'Partial';
      }
    } catch (error) {
      status = 'Failed';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      recordsFailed = recordsProcessed;
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const log = await db.accountingSyncLog.create({
      data: {
        integrationId,
        syncType,
        recordType,
        recordsProcessed,
        recordsSucceeded,
        recordsFailed,
        startTime,
        endTime,
        duration,
        status,
        errorMessage,
      },
    });

    // Update integration status
    await db.accountingIntegration.update({
      where: { id: integrationId },
      data: {
        lastSyncAt: endTime,
        lastSyncStatus: status,
        recordsSynced: { increment: recordsSucceeded },
        syncErrors: { increment: recordsFailed },
        errorMessage: status === 'Failed' ? errorMessage : null,
      },
    });

    return log;
  }

  // Analytics & Reporting
  async getTaxSummary(taxYear: number): Promise<TaxSummary> {
    const [
      totalDocuments,
      amountData,
      withheldData,
      documentsByType,
    ] = await Promise.all([
      db.taxDocument.count({ where: { taxYear } }),
      db.taxDocument.aggregate({
        where: { taxYear, totalAmount: { not: null } },
        _sum: { totalAmount: true },
      }),
      db.taxDocument.aggregate({
        where: { taxYear },
        _sum: { federalTaxWithheld: true, stateTaxWithheld: true },
      }),
      db.taxDocument.groupBy({
        by: ['documentType'],
        where: { taxYear },
        _count: true,
      }),
    ]);

    const totalAmount = amountData._sum.totalAmount?.toNumber() || 0;
    const totalWithheld = 
      (withheldData._sum.federalTaxWithheld?.toNumber() || 0) +
      (withheldData._sum.stateTaxWithheld?.toNumber() || 0);

    const documentTypes = documentsByType.reduce((acc, item) => {
      acc[item.documentType] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Calculate compliance score
    const filedDocuments = await db.taxDocument.count({
      where: { taxYear, status: 'Filed' },
    });
    const complianceScore = totalDocuments > 0 
      ? (filedDocuments / totalDocuments) * 100 
      : 100;

    // Get upcoming deadlines (simplified)
    const upcomingDeadlines = [
      {
        type: 'Quarterly Tax Return',
        dueDate: this.getNextQuarterlyDeadline(),
      },
      {
        type: 'Annual Tax Return',
        dueDate: new Date(taxYear + 1, 2, 15), // March 15th
      },
    ];

    return {
      totalDocuments,
      totalAmount,
      totalWithheld,
      documentsByType: documentTypes,
      complianceScore,
      upcomingDeadlines,
    };
  }

  async getComplianceStatus(): Promise<ComplianceStatus> {
    const [
      totalRequirements,
      compliantRequirements,
      nonCompliantRequirements,
      criticalIssues,
      upcomingAudits,
    ] = await Promise.all([
      db.complianceRecord.count(),
      db.complianceRecord.count({ where: { status: 'Compliant' } }),
      db.complianceRecord.count({ where: { status: 'Non_Compliant' } }),
      db.complianceRecord.count({
        where: {
          status: 'Non_Compliant',
          nonComplianceRisk: 'Critical',
        },
      }),
      db.complianceRecord.findMany({
        where: {
          nextAuditDate: { gte: new Date() },
        },
        orderBy: { nextAuditDate: 'asc' },
        take: 10,
        select: {
          title: true,
          nextAuditDate: true,
          nonComplianceRisk: true,
        },
      }),
    ]);

    const complianceRate = totalRequirements > 0 
      ? (compliantRequirements / totalRequirements) * 100 
      : 100;

    return {
      totalRequirements,
      compliantRequirements,
      nonCompliantRequirements,
      complianceRate,
      criticalIssues,
      upcomingAudits: upcomingAudits.map(audit => ({
        requirement: audit.title,
        auditDate: audit.nextAuditDate!,
        riskLevel: audit.nonComplianceRisk || 'Medium',
      })),
    };
  }

  async getFraudMetrics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<FraudMetrics> {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.detectedAt = {};
      if (dateFrom) whereClause.detectedAt.gte = dateFrom;
      if (dateTo) whereClause.detectedAt.lte = dateTo;
    }

    const [
      totalAlerts,
      falsePositives,
      legitimateAlerts,
      avgRiskScore,
      alertsByType,
      preventedLossesData,
    ] = await Promise.all([
      db.fraudDetection.count({ where: whereClause }),
      db.fraudDetection.count({
        where: { ...whereClause, isLegitimate: true },
      }),
      db.fraudDetection.count({
        where: { ...whereClause, isLegitimate: false },
      }),
      db.fraudDetection.aggregate({
        where: whereClause,
        _avg: { riskScore: true },
      }),
      db.fraudDetection.groupBy({
        by: ['alertType'],
        where: whereClause,
        _count: true,
      }),
      db.fraudDetection.findMany({
        where: {
          ...whereClause,
          isLegitimate: false,
          transaction: { amount: { not: null } },
        },
        include: { transaction: { select: { amount: true } } },
      }),
    ]);

    const resolvedAlerts = falsePositives + legitimateAlerts;
    const accuracyRate = resolvedAlerts > 0 
      ? ((resolvedAlerts - falsePositives) / resolvedAlerts) * 100 
      : 0;

    const alertTypes = alertsByType.reduce((acc, item) => {
      acc[item.alertType] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const preventedLosses = preventedLossesData.reduce(
      (total, alert) => total + (alert.transaction?.amount?.toNumber() || 0),
      0
    );

    return {
      totalAlerts,
      falsePositives,
      legitimateAlerts,
      accuracyRate,
      averageRiskScore: avgRiskScore._avg.riskScore?.toNumber() || 0,
      alertsByType: alertTypes,
      preventedLosses,
    };
  }

  async getDisputeAnalysis(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<DisputeAnalysis> {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.disputeDate = {};
      if (dateFrom) whereClause.disputeDate.gte = dateFrom;
      if (dateTo) whereClause.disputeDate.lte = dateTo;
    }

    const [
      totalDisputes,
      resolvedDisputes,
      resolutionTimeData,
      chargebacks,
      disputesByType,
      financialImpactData,
    ] = await Promise.all([
      db.paymentDispute.count({ where: whereClause }),
      db.paymentDispute.count({
        where: { ...whereClause, status: 'Resolved' },
      }),
      db.paymentDispute.findMany({
        where: {
          ...whereClause,
          status: 'Resolved',
          resolvedAt: { not: null },
        },
        select: { disputeDate: true, resolvedAt: true },
      }),
      db.paymentDispute.count({
        where: { ...whereClause, disputeType: 'Chargeback' },
      }),
      db.paymentDispute.groupBy({
        by: ['disputeType'],
        where: whereClause,
        _count: true,
      }),
      db.paymentDispute.aggregate({
        where: whereClause,
        _sum: { amount: true, resolutionAmount: true },
      }),
    ]);

    const resolutionRate = totalDisputes > 0 
      ? (resolvedDisputes / totalDisputes) * 100 
      : 0;

    const averageResolutionTime = resolutionTimeData.length > 0
      ? resolutionTimeData.reduce((total, dispute) => {
          if (dispute.resolvedAt) {
            const days = Math.ceil(
              (dispute.resolvedAt.getTime() - dispute.disputeDate.getTime()) / 
              (1000 * 60 * 60 * 24)
            );
            return total + days;
          }
          return total;
        }, 0) / resolutionTimeData.length
      : 0;

    const chargebackRate = totalDisputes > 0 ? (chargebacks / totalDisputes) * 100 : 0;

    const disputeTypes = disputesByType.reduce((acc, item) => {
      acc[item.disputeType] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const totalAmount = financialImpactData._sum.amount?.toNumber() || 0;
    const totalResolutions = financialImpactData._sum.resolutionAmount?.toNumber() || 0;
    const financialImpact = totalAmount - totalResolutions;

    return {
      totalDisputes,
      resolvedDisputes,
      resolutionRate,
      averageResolutionTime,
      totalChargebacks: chargebacks,
      chargebackRate,
      disputesByType: disputeTypes,
      financialImpact,
    };
  }

  // Private Helper Methods
  private async calculateDocumentAmounts(documentId: string): Promise<void> {
    const document = await db.taxDocument.findUnique({
      where: { id: documentId },
      include: { recipient: true },
    });

    if (!document?.recipientId) return;

    const payments = await db.transaction.aggregate({
      where: {
        payerId: document.recipientId,
        transactionType: 'JOB_PAYMENT',
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(document.taxYear, 0, 1),
          lte: new Date(document.taxYear, 11, 31),
        },
      },
      _sum: { amount: true },
    });

    const totalAmount = payments._sum.amount?.toNumber() || 0;

    await db.taxDocument.update({
      where: { id: documentId },
      data: {
        totalAmount,
        nonEmployeeCompensation: totalAmount,
      },
    });
  }

  private async generateDocumentFile(documentId: string): Promise<void> {
    // Simulate document generation - would integrate with actual PDF generation service
    const documentUrl = `https://documents.treehub.com/tax/${documentId}.pdf`;
    
    await db.taxDocument.update({
      where: { id: documentId },
      data: { documentUrl },
    });
  }

  private async takeAutomatedFraudActions(alertId: string): Promise<void> {
    const alert = await db.fraudDetection.findUnique({
      where: { id: alertId },
      include: { transaction: true },
    });

    if (!alert) return;

    const actions: string[] = [];

    // Block transaction if risk score > 90
    if (alert.riskScore.toNumber() > 90 && alert.transactionId) {
      actions.push('Transaction automatically blocked due to high risk score');
      
      await db.fraudDetection.update({
        where: { id: alertId },
        data: { transactionBlocked: true },
      });
    }

    // Suspend account if risk score > 95
    if (alert.riskScore.toNumber() > 95 && alert.userId) {
      actions.push('Account automatically suspended due to critical risk score');
      
      await db.fraudDetection.update({
        where: { id: alertId },
        data: { accountSuspended: true },
      });
    }

    if (actions.length > 0) {
      await db.fraudDetection.update({
        where: { id: alertId },
        data: { actionsTaken: actions },
      });
    }
  }

  private async performAccountingSync(
    integration: AccountingIntegration,
    syncType: string,
    recordType: string
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    // Simulate accounting sync - would integrate with actual accounting APIs
    await new Promise(resolve => setTimeout(resolve, 2000));

    const processed = Math.floor(Math.random() * 100) + 50;
    const failureRate = Math.random() * 0.05; // 0-5% failure rate
    const failed = Math.floor(processed * failureRate);
    const succeeded = processed - failed;

    return { processed, succeeded, failed };
  }

  private getNextQuarterlyDeadline(): Date {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const quarterEndMonths = [2, 5, 8, 11]; // March, June, September, December
    
    let deadlineMonth = quarterEndMonths[currentQuarter];
    let deadlineYear = now.getFullYear();
    
    // If we're past this quarter's deadline, move to next quarter
    if (now.getMonth() > deadlineMonth || 
        (now.getMonth() === deadlineMonth && now.getDate() > 15)) {
      deadlineMonth = quarterEndMonths[(currentQuarter + 1) % 4];
      if (currentQuarter === 3) deadlineYear++; // Wrap to next year
    }
    
    return new Date(deadlineYear, deadlineMonth, 15); // 15th of deadline month
  }
}

export const financialControlsService = new FinancialControlsService();
