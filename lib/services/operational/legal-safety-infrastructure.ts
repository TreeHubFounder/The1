
import { prisma } from '@/lib/db';
import type { 
  LegalContract,
  SafetyIncident,
  SafetyProtocol,
  ProtocolTraining,
  LegalCompliance,
  InsuranceVerification,
  ImplementationTimeline,
  ImplementationTask,
  TimelineMilestone,
  ContractType,
  LegalContractStatus,
  IncidentType,
  IncidentSeverity,
  TaskStatus,
  TaskPriority
} from '@prisma/client';

export interface CreateContractData {
  title: string;
  contractType: ContractType;
  ourParty: string;
  counterPartyName: string;
  counterPartyType?: string;
  counterPartyContact?: string;
  contractValue?: number;
  paymentTerms?: string;
  currency?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  renewalDate?: Date;
  noticePeriod?: number;
  documents?: string[];
  governingLaw?: string;
  disputeResolution?: string;
  complianceRequirements?: string[];
  relatedJobId?: string;
  managedById?: string;
}

export interface CreateSafetyIncidentData {
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  incidentDate: Date;
  incidentTime?: string;
  location: string;
  address?: string;
  zipCode?: string;
  weatherConditions?: string;
  temperature?: number;
  windSpeed?: number;
  precipitation?: string;
  injuredPartyId?: string;
  injuredPartyName?: string;
  witnessNames?: string[];
  emergencyContacts?: string[];
  injuryType?: string;
  bodyPartsAffected?: string[];
  medicalAttention?: boolean;
  hospitalName?: string;
  treatingPhysician?: string;
  equipmentInvolved?: string[];
  equipmentFailure?: boolean;
  equipmentCondition?: string;
  photos?: string[];
  documents?: string[];
  witnessStatements?: string[];
  jobId?: string;
  reportedById: string;
}

export interface SafetyMetrics {
  totalIncidents: number;
  incidentRate: number;
  severityDistribution: Record<string, number>;
  incidentsByType: Record<string, number>;
  recordableIncidents: number;
  lostTimeIncidents: number;
  daysAwayFromWork: number;
  nearMisses: number;
  safetyScore: number;
  complianceRate: number;
  trainingCompliance: number;
}

export interface ComplianceSummary {
  totalRequirements: number;
  compliantCount: number;
  nonCompliantCount: number;
  pendingCount: number;
  compliancePercentage: number;
  criticalViolations: number;
  upcomingDeadlines: Array<{
    requirement: string;
    deadline: Date;
    riskLevel: string;
  }>;
  complianceBudget: number;
  complianceCosts: number;
}

export interface ContractPortfolio {
  totalContracts: number;
  activeContracts: number;
  expiredContracts: number;
  pendingRenewals: number;
  totalValue: number;
  contractsByType: Record<string, number>;
  expiringContracts: Array<{
    title: string;
    expirationDate: Date;
    value: number;
    priority: string;
  }>;
  averageContractValue: number;
}

export class LegalSafetyInfrastructureService {
  // Legal Contract Management
  async createContract(data: CreateContractData): Promise<LegalContract> {
    const contractNumber = await this.generateContractNumber(data.contractType);

    return await prisma.legalContract.create({
      data: {
        ...data,
        contractNumber,
        status: 'DRAFT',
        currency: data.currency || 'USD',
        documents: data.documents || [],
        complianceRequirements: data.complianceRequirements || [],
        renewalReminder: true,
        expirationAlert: true,
        autoRenewal: false,
      },
      include: {
        relatedJob: true,
        managedBy: true,
      },
    });
  }

  async updateContractStatus(
    contractId: string,
    status: LegalContractStatus,
    signedAt?: Date
  ): Promise<LegalContract> {
    const updateData: any = { status };
    
    if (status === 'ACTIVE' && signedAt) {
      updateData.signedAt = signedAt;
    }

    return await prisma.legalContract.update({
      where: { id: contractId },
      data: updateData,
      include: {
        relatedJob: true,
        managedBy: true,
      },
    });
  }

  async submitContractForReview(
    contractId: string,
    reviewedBy: string,
    riskLevel: string = 'Medium'
  ): Promise<LegalContract> {
    return await prisma.legalContract.update({
      where: { id: contractId },
      data: {
        status: 'UNDER_REVIEW',
        legalReviewStatus: 'Pending',
        reviewedBy,
        riskLevel,
      },
    });
  }

  async approveContract(
    contractId: string,
    approvedBy: string,
    reviewNotes?: string
  ): Promise<LegalContract> {
    return await prisma.legalContract.update({
      where: { id: contractId },
      data: {
        legalReviewStatus: 'Approved',
        reviewedBy: approvedBy,
        reviewNotes,
        status: 'PENDING_SIGNATURE',
      },
    });
  }

  async renewContract(
    contractId: string,
    newExpirationDate: Date,
    newContractValue?: number
  ): Promise<LegalContract> {
    const updateData: any = {
      expirationDate: newExpirationDate,
      renewalDate: newExpirationDate,
      status: 'ACTIVE',
    };

    if (newContractValue !== undefined) {
      updateData.contractValue = newContractValue;
    }

    return await prisma.legalContract.update({
      where: { id: contractId },
      data: updateData,
    });
  }

  // Safety Incident Management
  async reportSafetyIncident(data: CreateSafetyIncidentData): Promise<SafetyIncident> {
    const incidentNumber = await this.generateIncidentNumber();

    const incident = await prisma.safetyIncident.create({
      data: {
        ...data,
        incidentNumber,
        status: 'Open',
        investigationStatus: 'Pending',
        witnessNames: data.witnessNames || [],
        emergencyContacts: data.emergencyContacts || [],
        bodyPartsAffected: data.bodyPartsAffected || [],
        equipmentInvolved: data.equipmentInvolved || [],
        photos: data.photos || [],
        documents: data.documents || [],
        witnessStatements: data.witnessStatements || [],
        medicalAttention: data.medicalAttention || false,
        equipmentFailure: data.equipmentFailure || false,
        oshaReportable: this.isOSHAReportable(data.severity, data.medicalAttention),
        insuranceClaim: false,
        reportedToOsha: false,
        insuranceNotified: false,
        immediateActions: [],
        correctiveActions: [],
        preventiveActions: [],
        followUpRequired: true,
        trainingRequired: false,
        lessonsLearned: [],
        trainingTopics: [],
      },
      include: {
        injuredParty: true,
        investigator: true,
        reportedBy: true,
        job: true,
      },
    });

    // Auto-assign investigator based on severity
    if (data.severity === 'SERIOUS' || data.severity === 'CRITICAL') {
      await this.assignIncidentInvestigator(incident.id);
    }

    // Create immediate safety actions
    await this.createImmediateSafetyActions(incident.id, data.severity);

    return incident;
  }

  async updateIncidentInvestigation(
    incidentId: string,
    data: {
      investigatedBy?: string;
      investigationNotes?: string;
      immediateCause?: string;
      underlyingCauses?: string[];
      contributingFactors?: string[];
      humanFactors?: string[];
      environmentalFactors?: string[];
      correctiveActions?: string[];
      preventiveActions?: string[];
      responsibleParty?: string;
      targetCompletionDate?: Date;
    }
  ): Promise<SafetyIncident> {
    return await prisma.safetyIncident.update({
      where: { id: incidentId },
      data: {
        ...data,
        investigationStatus: 'In_Progress',
        investigatedBy: data.investigatedBy,
        underlyingCauses: data.underlyingCauses || [],
        contributingFactors: data.contributingFactors || [],
        humanFactors: data.humanFactors || [],
        environmentalFactors: data.environmentalFactors || [],
        correctiveActions: data.correctiveActions || [],
        preventiveActions: data.preventiveActions || [],
      },
      include: {
        investigator: true,
      },
    });
  }

  async closeIncident(
    incidentId: string,
    lessonsLearned: string[],
    trainingRequired: boolean = false,
    trainingTopics: string[] = []
  ): Promise<SafetyIncident> {
    return await prisma.safetyIncident.update({
      where: { id: incidentId },
      data: {
        status: 'Closed',
        investigationStatus: 'Completed',
        lessonsLearned,
        trainingRequired,
        trainingTopics,
        closedAt: new Date(),
        followUpRequired: false,
      },
    });
  }

  async reportToOSHA(
    incidentId: string,
    oshaReportNumber: string
  ): Promise<SafetyIncident> {
    return await prisma.safetyIncident.update({
      where: { id: incidentId },
      data: {
        reportedToOsha: true,
        oshaReportNumber,
        reportDate: new Date(),
      },
    });
  }

  // Safety Protocol Management
  async createSafetyProtocol(data: {
    title: string;
    description: string;
    protocolType: string;
    applicableWork: string[];
    requiredTraining: string[];
    requiredEquipment: string[];
    requiredCertifications: string[];
    procedureSteps: any;
    safetyChecks: any;
    emergencyProcedures: any;
    hazardsAddressed: string[];
    riskLevel: string;
    riskMitigation: string[];
    regulatoryBasis: string[];
    reviewFrequency?: string;
    approvedBy?: string;
    trainingRequired?: boolean;
    trainingMaterials?: string[];
    testRequired?: boolean;
    passingScore?: number;
  }): Promise<SafetyProtocol> {
    return await prisma.safetyProtocol.create({
      data: {
        ...data,
        version: '1.0',
        isActive: true,
        effectiveDate: new Date(),
        trainingRequired: data.trainingRequired ?? true,
        testRequired: data.testRequired ?? false,
        trainingMaterials: data.trainingMaterials || [],
      },
    });
  }

  async updateSafetyProtocol(
    protocolId: string,
    updates: any,
    changeReason: string
  ): Promise<SafetyProtocol> {
    const protocol = await prisma.safetyProtocol.findUnique({
      where: { id: protocolId },
    });

    if (!protocol) {
      throw new Error('Safety protocol not found');
    }

    const newVersion = this.incrementVersion(protocol.version);
    const changeLog = {
      ...(protocol.changeLog as any) || {},
      [newVersion]: {
        date: new Date(),
        changes: updates,
        reason: changeReason,
      },
    };

    return await prisma.safetyProtocol.update({
      where: { id: protocolId },
      data: {
        ...updates,
        version: newVersion,
        changeLog,
        lastReviewed: new Date(),
      },
    });
  }

  async assignProtocolTraining(
    protocolId: string,
    traineeId: string
  ): Promise<ProtocolTraining> {
    return await prisma.protocolTraining.create({
      data: {
        protocolId,
        traineeId,
        status: 'Enrolled',
        attemptsCount: 0,
        passed: false,
        certificateIssued: false,
      },
      include: {
        trainee: true,
        protocol: true,
      },
    });
  }

  async completeProtocolTraining(
    trainingId: string,
    testScore?: number,
    certificateUrl?: string
  ): Promise<ProtocolTraining> {
    const training = await prisma.protocolTraining.findUnique({
      where: { id: trainingId },
      include: { protocol: true },
    });

    if (!training) {
      throw new Error('Training record not found');
    }

    const passed = !testScore || !training.protocol.passingScore || 
                   testScore >= training.protocol.passingScore;

    const status = passed ? 'Completed' : 'Failed';
    const expirationDate = passed && training.protocol.reviewFrequency
      ? this.calculateTrainingExpiration(new Date(), training.protocol.reviewFrequency)
      : undefined;

    return await prisma.protocolTraining.update({
      where: { id: trainingId },
      data: {
        status,
        completionDate: new Date(),
        expirationDate,
        testScore,
        passed,
        certificateIssued: passed && Boolean(certificateUrl),
        certificateUrl: passed ? certificateUrl : undefined,
        attemptsCount: { increment: 1 },
      },
    });
  }

  // Legal Compliance Management
  async createComplianceRequirement(data: {
    requirementName: string;
    regulatoryBody: string;
    regulationType: string;
    description: string;
    applicability: string;
    jurisdiction: string;
    specificRequirements: string[];
    documentation: string[];
    recordKeeping?: string;
    assignedToId?: string;
    effectiveDate: Date;
    nextAuditDate?: Date;
    auditFrequency?: string;
    complianceCost?: number;
    penaltyRisk?: number;
  }): Promise<LegalCompliance> {
    return await prisma.legalCompliance.create({
      data: {
        ...data,
        status: 'Pending',
        complianceEvidence: [],
        certifications: [],
        permits: [],
        alertsEnabled: true,
        specificRequirements: data.specificRequirements || [],
        documentation: data.documentation || [],
      },
      include: {
        assignedTo: true,
      },
    });
  }

  async updateComplianceStatus(
    complianceId: string,
    status: string,
    evidence?: string[],
    actionPlan?: string,
    deadline?: Date
  ): Promise<LegalCompliance> {
    return await prisma.legalCompliance.update({
      where: { id: complianceId },
      data: {
        status,
        complianceEvidence: evidence || [],
        actionPlan,
        deadline,
        lastAuditDate: status === 'Compliant' ? new Date() : undefined,
      },
    });
  }

  async scheduleComplianceAudit(
    complianceId: string,
    auditDate: Date,
    budgetAllocated?: number
  ): Promise<LegalCompliance> {
    return await prisma.legalCompliance.update({
      where: { id: complianceId },
      data: {
        nextAuditDate: auditDate,
        budgetAllocated,
      },
    });
  }

  // Insurance Verification
  async createInsuranceVerification(data: {
    contractorId: string;
    verificationType: string;
    policyNumber: string;
    insuranceCompany: string;
    policyType: string;
    coverageAmount: number;
    effectiveDate: Date;
    expirationDate: Date;
    verificationMethod?: string;
    certificateUrl?: string;
    policyDocumentUrl?: string;
    alertDays?: number;
  }): Promise<InsuranceVerification> {
    return await prisma.insuranceVerification.create({
      data: {
        ...data,
        verificationStatus: 'Pending',
        isActive: true,
        expirationAlert: true,
        alertDays: data.alertDays || 30,
      },
      include: {
        contractor: true,
      },
    });
  }

  async verifyInsurance(
    verificationId: string,
    verifiedBy: string,
    verificationMethod: string
  ): Promise<InsuranceVerification> {
    return await prisma.insuranceVerification.update({
      where: { id: verificationId },
      data: {
        verificationStatus: 'Verified',
        verifiedBy,
        verificationMethod,
        verificationDate: new Date(),
      },
    });
  }

  async flagExpiringInsurance(alertDays: number = 30): Promise<InsuranceVerification[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + alertDays);

    const expiringPolicies = await prisma.insuranceVerification.findMany({
      where: {
        expirationDate: { lte: cutoffDate },
        isActive: true,
        verificationStatus: 'Verified',
      },
      include: {
        contractor: true,
      },
    });

    // Send alerts for expiring policies
    for (const policy of expiringPolicies) {
      await this.sendInsuranceExpirationAlert(policy.id);
    }

    return expiringPolicies;
  }

  // Implementation Timeline Management
  async createImplementationTimeline(data: {
    timelineName: string;
    description: string;
    totalDuration: number;
    startDate: Date;
    endDate: Date;
    budgetAllocated?: number;
    teamSize?: number;
  }): Promise<ImplementationTimeline> {
    return await prisma.implementationTimeline.create({
      data: {
        ...data,
        status: 'Planning',
        progressPercentage: 0,
        totalMilestones: 0,
        completedMilestones: 0,
        budgetSpent: 0,
        onSchedule: true,
        onBudget: true,
        riskLevel: 'Low',
      },
    });
  }

  async addImplementationTask(data: {
    timelineId: string;
    title: string;
    description: string;
    category: string;
    priority?: TaskPriority;
    assignedToId?: string;
    assignedTeam?: string[];
    plannedStartDate: Date;
    plannedEndDate: Date;
    estimatedHours?: number;
    dependencies?: string[];
    deliverables?: string[];
    completionCriteria?: string[];
    budgetAllocated?: number;
    milestoneId?: string;
  }): Promise<ImplementationTask> {
    return await prisma.implementationTask.create({
      data: {
        ...data,
        status: 'NOT_STARTED',
        priority: data.priority || 'MEDIUM',
        progressPercentage: 0,
        budgetSpent: 0,
        assignedTeam: data.assignedTeam || [],
        dependencies: data.dependencies || [],
        deliverables: data.deliverables || [],
        completionCriteria: data.completionCriteria || [],
        progressNotes: [],
        riskLevel: 'Low',
        riskFactors: [],
        mitigationActions: [],
        reviewRequired: false,
      },
      include: {
        assignedTo: true,
        timeline: true,
        milestone: true,
      },
    });
  }

  async updateTaskProgress(
    taskId: string,
    progressPercentage: number,
    progressNotes?: string,
    actualHours?: number,
    budgetSpent?: number
  ): Promise<ImplementationTask> {
    const updateData: any = {
      progressPercentage,
      lastUpdateDate: new Date(),
    };

    if (progressNotes) {
      updateData.progressNotes = { push: progressNotes };
    }

    if (actualHours !== undefined) {
      updateData.actualHours = actualHours;
    }

    if (budgetSpent !== undefined) {
      updateData.budgetSpent = budgetSpent;
    }

    // Auto-update status based on progress
    if (progressPercentage === 0) {
      updateData.status = 'NOT_STARTED';
    } else if (progressPercentage === 100) {
      updateData.status = 'COMPLETED';
      updateData.actualEndDate = new Date();
    } else {
      updateData.status = 'IN_PROGRESS';
      if (!updateData.actualStartDate) {
        updateData.actualStartDate = new Date();
      }
    }

    const task = await prisma.implementationTask.update({
      where: { id: taskId },
      data: updateData,
    });

    // Update timeline progress
    await this.updateTimelineProgress(task.timelineId);

    return task;
  }

  async createTimelineMilestone(data: {
    timelineId: string;
    name: string;
    description: string;
    type: string;
    targetDate: Date;
    successCriteria: string[];
    deliverables: string[];
    acceptanceCriteria: string[];
    criticalPath?: boolean;
    celebrationType?: string;
  }): Promise<TimelineMilestone> {
    const milestone = await prisma.timelineMilestone.create({
      data: {
        ...data,
        status: 'Pending',
        criticalPath: data.criticalPath || false,
        achievementPercentage: 0,
        celebrationPlanned: false,
      },
    });

    // Update timeline milestone count
    await prisma.implementationTimeline.update({
      where: { id: data.timelineId },
      data: {
        totalMilestones: { increment: 1 },
      },
    });

    return milestone;
  }

  async achieveMilestone(
    milestoneId: string,
    qualityScore?: number,
    celebrationType?: string
  ): Promise<TimelineMilestone> {
    const milestone = await prisma.timelineMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'Achieved',
        actualDate: new Date(),
        achievementPercentage: 100,
        qualityScore,
        celebrationType,
        celebrationPlanned: Boolean(celebrationType),
      },
    });

    // Update timeline milestone count
    await prisma.implementationTimeline.update({
      where: { id: milestone.timelineId },
      data: {
        completedMilestones: { increment: 1 },
      },
    });

    return milestone;
  }

  // Analytics & Reporting
  async getSafetyMetrics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<SafetyMetrics> {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.incidentDate = {};
      if (dateFrom) whereClause.incidentDate.gte = dateFrom;
      if (dateTo) whereClause.incidentDate.lte = dateTo;
    }

    const [
      totalIncidents,
      severityData,
      typeData,
      recordableIncidents,
      lostTimeIncidents,
      nearMisses,
      totalEmployees,
      totalTraining,
      completedTraining,
    ] = await Promise.all([
      prisma.safetyIncident.count({ where: whereClause }),
      prisma.safetyIncident.groupBy({
        by: ['severity'],
        where: whereClause,
        _count: true,
      }),
      prisma.safetyIncident.groupBy({
        by: ['type'],
        where: whereClause,
        _count: true,
      }),
      prisma.safetyIncident.count({
        where: { ...whereClause, oshaReportable: true },
      }),
      prisma.safetyIncident.count({
        where: { ...whereClause, medicalAttention: true },
      }),
      prisma.safetyIncident.count({
        where: { ...whereClause, type: 'NEAR_MISS' },
      }),
      prisma.user.count({ where: { role: 'PROFESSIONAL' } }),
      prisma.protocolTraining.count(),
      prisma.protocolTraining.count({ where: { status: 'Completed' } }),
    ]);

    // Calculate incident rate (per 100 employees)
    const incidentRate = totalEmployees > 0 ? (totalIncidents / totalEmployees) * 100 : 0;

    // Calculate safety score (100 - incident rate - severity penalty)
    const severityPenalty = severityData.reduce((penalty, item) => {
      const multiplier = item.severity === 'CRITICAL' ? 10 : 
                        item.severity === 'SERIOUS' ? 5 : 
                        item.severity === 'MODERATE' ? 2 : 1;
      return penalty + (item._count * multiplier);
    }, 0);

    const safetyScore = Math.max(0, 100 - incidentRate - severityPenalty);

    // Calculate compliance rate (simplified)
    const complianceRate = await this.calculateSafetyComplianceRate();

    // Training compliance
    const trainingCompliance = totalTraining > 0 ? (completedTraining / totalTraining) * 100 : 100;

    // Convert group by results to records
    const severityDistribution = severityData.reduce((acc, item) => {
      acc[item.severity] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const incidentsByType = typeData.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIncidents,
      incidentRate,
      severityDistribution,
      incidentsByType,
      recordableIncidents,
      lostTimeIncidents,
      daysAwayFromWork: lostTimeIncidents * 3, // Simplified calculation
      nearMisses,
      safetyScore,
      complianceRate,
      trainingCompliance,
    };
  }

  async getComplianceSummary(): Promise<ComplianceSummary> {
    const [
      totalRequirements,
      compliantCount,
      nonCompliantCount,
      pendingCount,
      criticalViolations,
      upcomingDeadlines,
      budgetData,
      costData,
    ] = await Promise.all([
      prisma.legalCompliance.count(),
      prisma.legalCompliance.count({ where: { status: 'Compliant' } }),
      prisma.legalCompliance.count({ where: { status: 'Non_Compliant' } }),
      prisma.legalCompliance.count({ where: { status: 'Pending' } }),
      prisma.legalCompliance.count({
        where: { status: 'Non_Compliant', nonComplianceRisk: 'Critical' },
      }),
      prisma.legalCompliance.findMany({
        where: {
          nextAuditDate: { gte: new Date() },
        },
        orderBy: { nextAuditDate: 'asc' },
        take: 10,
        select: {
          requirementName: true,
          nextAuditDate: true,
          nonComplianceRisk: true,
        },
      }),
      prisma.legalCompliance.aggregate({
        _sum: { budgetAllocated: true },
      }),
      prisma.legalCompliance.aggregate({
        _sum: { complianceCost: true },
      }),
    ]);

    const compliancePercentage = totalRequirements > 0 
      ? (compliantCount / totalRequirements) * 100 
      : 100;

    return {
      totalRequirements,
      compliantCount,
      nonCompliantCount,
      pendingCount,
      compliancePercentage,
      criticalViolations,
      upcomingDeadlines: upcomingDeadlines.map(item => ({
        requirement: item.requirementName,
        deadline: item.nextAuditDate!,
        riskLevel: item.nonComplianceRisk || 'Medium',
      })),
      complianceBudget: budgetData._sum.budgetAllocated?.toNumber() || 0,
      complianceCosts: costData._sum.complianceCost?.toNumber() || 0,
    };
  }

  async getContractPortfolio(): Promise<ContractPortfolio> {
    const [
      totalContracts,
      activeContracts,
      expiredContracts,
      contractData,
      contractsByType,
      expiringContracts,
    ] = await Promise.all([
      prisma.legalContract.count(),
      prisma.legalContract.count({ where: { status: 'ACTIVE' } }),
      prisma.legalContract.count({ where: { status: 'EXPIRED' } }),
      prisma.legalContract.aggregate({
        where: { contractValue: { not: null } },
        _sum: { contractValue: true },
        _avg: { contractValue: true },
      }),
      prisma.legalContract.groupBy({
        by: ['contractType'],
        _count: true,
      }),
      prisma.legalContract.findMany({
        where: {
          status: 'ACTIVE',
          expirationDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Next 90 days
          },
        },
        select: {
          title: true,
          expirationDate: true,
          contractValue: true,
          riskLevel: true,
        },
        orderBy: { expirationDate: 'asc' },
      }),
    ]);

    const pendingRenewals = await prisma.legalContract.count({
      where: {
        status: 'ACTIVE',
        renewalDate: { lte: new Date() },
      },
    });

    const totalValue = contractData._sum.contractValue?.toNumber() || 0;
    const averageContractValue = contractData._avg.contractValue?.toNumber() || 0;

    const contractTypeDistribution = contractsByType.reduce((acc, item) => {
      acc[item.contractType] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalContracts,
      activeContracts,
      expiredContracts,
      pendingRenewals,
      totalValue,
      contractsByType: contractTypeDistribution,
      expiringContracts: expiringContracts.map(contract => ({
        title: contract.title,
        expirationDate: contract.expirationDate!,
        value: contract.contractValue?.toNumber() || 0,
        priority: contract.riskLevel || 'Medium',
      })),
      averageContractValue,
    };
  }

  // Private Helper Methods
  private async generateContractNumber(contractType: ContractType): Promise<string> {
    const prefix = contractType.substring(0, 3).toUpperCase();
    const count = await prisma.legalContract.count({ where: { contractType } });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateIncidentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.safetyIncident.count({
      where: {
        incidentDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
    });
    return `INC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private isOSHAReportable(severity: IncidentSeverity, medicalAttention?: boolean): boolean {
    return severity === 'SERIOUS' || severity === 'CRITICAL' || medicalAttention === true;
  }

  private async assignIncidentInvestigator(incidentId: string): Promise<void> {
    // Find available safety manager or senior staff
    const investigator = await prisma.user.findFirst({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] },
        // Add additional criteria for safety investigators
      },
      orderBy: { createdAt: 'asc' },
    });

    if (investigator) {
      await prisma.safetyIncident.update({
        where: { id: incidentId },
        data: { investigatedBy: investigator.id },
      });
    }
  }

  private async createImmediateSafetyActions(
    incidentId: string,
    severity: IncidentSeverity
  ): Promise<void> {
    const actions: string[] = [];

    switch (severity) {
      case 'CRITICAL':
        actions.push(
          'Stop all work in affected area immediately',
          'Secure incident scene',
          'Notify emergency services if not already done',
          'Contact senior management immediately'
        );
        break;
      case 'SERIOUS':
        actions.push(
          'Secure incident area',
          'Document scene with photos',
          'Notify management within 2 hours'
        );
        break;
      default:
        actions.push(
          'Document incident details',
          'Review safety procedures with team'
        );
    }

    await prisma.safetyIncident.update({
      where: { id: incidentId },
      data: { immediateActions: actions },
    });
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const major = parseInt(parts[0] || '1');
    const minor = parseInt(parts[1] || '0');
    return `${major}.${minor + 1}`;
  }

  private calculateTrainingExpiration(
    completionDate: Date,
    reviewFrequency: string
  ): Date {
    const expiration = new Date(completionDate);
    
    switch (reviewFrequency) {
      case 'Annual':
        expiration.setFullYear(expiration.getFullYear() + 1);
        break;
      case 'Bi_Annual':
        expiration.setMonth(expiration.getMonth() + 6);
        break;
      default:
        expiration.setFullYear(expiration.getFullYear() + 1);
    }

    return expiration;
  }

  private async calculateSafetyComplianceRate(): Promise<number> {
    const [totalProtocols, activeTraining] = await Promise.all([
      prisma.safetyProtocol.count({ where: { isActive: true } }),
      prisma.protocolTraining.count({
        where: {
          status: 'Completed',
          expirationDate: { gte: new Date() },
        },
      }),
    ]);

    const totalEmployees = await prisma.user.count({ where: { role: 'PROFESSIONAL' } });
    const expectedTraining = totalProtocols * totalEmployees;

    return expectedTraining > 0 ? (activeTraining / expectedTraining) * 100 : 100;
  }

  private async updateTimelineProgress(timelineId: string): Promise<void> {
    const tasks = await prisma.implementationTask.findMany({
      where: { timelineId },
      select: { progressPercentage: true, budgetAllocated: true, budgetSpent: true },
    });

    if (tasks.length === 0) return;

    const totalProgress = tasks.reduce(
      (sum, task) => sum + task.progressPercentage.toNumber(),
      0
    );
    const progressPercentage = totalProgress / tasks.length;

    const totalBudgetAllocated = tasks.reduce(
      (sum, task) => sum + (task.budgetAllocated?.toNumber() || 0),
      0
    );
    const totalBudgetSpent = tasks.reduce(
      (sum, task) => sum + task.budgetSpent.toNumber(),
      0
    );

    const onBudget = totalBudgetAllocated === 0 || totalBudgetSpent <= totalBudgetAllocated;

    await prisma.implementationTimeline.update({
      where: { id: timelineId },
      data: {
        progressPercentage,
        budgetSpent: totalBudgetSpent,
        onBudget,
      },
    });
  }

  private async sendInsuranceExpirationAlert(verificationId: string): Promise<void> {
    await prisma.insuranceVerification.update({
      where: { id: verificationId },
      data: { lastAlertSent: new Date() },
    });

    // Placeholder for actual alert sending logic
    console.log(`Insurance expiration alert sent for verification ${verificationId}`);
  }
}

export const legalSafetyInfrastructureService = new LegalSafetyInfrastructureService();
