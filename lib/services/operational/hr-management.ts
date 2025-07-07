
import { db } from '@/lib/db';
import type { 
  Employee, 
  EmployeeStatus,
  EmployeeType,
  HRRecord,
  PerformanceReview,
  TrainingRecord,
  TimeEntry,
  Department 
} from '@prisma/client';

export interface CreateEmployeeData {
  userId: string;
  employeeId: string;
  employeeType: EmployeeType;
  jobTitle: string;
  department: string;
  reportingTo?: string;
  baseSalary?: number;
  hourlyRate?: number;
  commissionRate?: number;
  bonusEligible?: boolean;
  startDate: Date;
  workLocation?: string;
  timeZone?: string;
  skills?: string[];
  ptoBalance?: number;
  sickBalance?: number;
}

export interface PerformanceMetrics {
  employeeCount: number;
  averageRating: number;
  topPerformers: number;
  reviewsCompleted: number;
  reviewsOverdue: number;
  trainingCompliance: number;
  turnoverRate: number;
  retentionRate: number;
}

export interface PayrollData {
  employeeId: string;
  basePay: number;
  overtime: number;
  commission: number;
  bonus: number;
  deductions: number;
  netPay: number;
  hoursWorked: number;
  billableHours: number;
}

export class HRManagementService {
  // Employee Management
  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    return await db.employee.create({
      data: {
        ...data,
        status: 'ACTIVE',
        ptoBalance: data.ptoBalance || 80, // Default 80 hours PTO
        sickBalance: data.sickBalance || 40, // Default 40 hours sick leave
      },
      include: {
        user: true,
        manager: true,
      },
    });
  }

  async updateEmployeeStatus(
    employeeId: string, 
    status: EmployeeStatus,
    endDate?: Date
  ): Promise<Employee> {
    const updateData: any = { status };
    
    if (status === 'TERMINATED' && endDate) {
      updateData.endDate = endDate;
    }

    return await db.employee.update({
      where: { id: employeeId },
      data: updateData,
      include: {
        user: true,
        manager: true,
      },
    });
  }

  async promoteEmployee(
    employeeId: string,
    newJobTitle: string,
    newSalary?: number,
    newDepartment?: string,
    newManager?: string
  ): Promise<Employee> {
    await db.$transaction(async (tx) => {
      const updateData: any = { jobTitle: newJobTitle };
      
      if (newSalary) updateData.baseSalary = newSalary;
      if (newDepartment) updateData.department = newDepartment;
      if (newManager) updateData.reportingTo = newManager;

      // Update employee record
      await tx.employee.update({
        where: { id: employeeId },
        data: updateData,
      });

      // Create HR record for promotion
      await tx.hRRecord.create({
        data: {
          employeeId,
          recordType: 'Promotion',
          title: 'Employee Promotion',
          description: `Promoted to ${newJobTitle}${newSalary ? ` with salary increase to $${newSalary}` : ''}`,
          recordDate: new Date(),
        },
      });
    });

    return await db.employee.findUnique({
      where: { id: employeeId },
      include: { user: true, manager: true },
    })!;
  }

  async adjustCompensation(
    employeeId: string,
    baseSalary?: number,
    hourlyRate?: number,
    commissionRate?: number,
    reason?: string
  ): Promise<Employee> {
    const updateData: any = {};
    if (baseSalary !== undefined) updateData.baseSalary = baseSalary;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;

    await db.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employeeId },
        data: updateData,
      });

      // Create HR record for compensation change
      await tx.hRRecord.create({
        data: {
          employeeId,
          recordType: 'Performance',
          title: 'Compensation Adjustment',
          description: reason || 'Compensation adjusted',
          recordDate: new Date(),
        },
      });
    });

    return await db.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    })!;
  }

  // Performance Management
  async createPerformanceReview(data: {
    employeeId: string;
    reviewPeriod: string;
    reviewType: string;
    reviewDate: Date;
    reviewerId?: string;
    overallRating?: number;
    technicalSkills?: number;
    communicationSkills?: number;
    teamwork?: number;
    leadership?: number;
    goalsAchieved?: any;
    newGoals?: any;
    developmentPlan?: string;
    managerFeedback?: string;
    employeeFeedback?: string;
    salaryAdjustment?: number;
    bonusAwarded?: number;
    promotionRecommended?: boolean;
  }): Promise<PerformanceReview> {
    const review = await db.performanceReview.create({
      data: {
        ...data,
        status: 'Scheduled',
      },
      include: {
        employee: { include: { user: true } },
        reviewer: true,
      },
    });

    // Update employee's performance rating
    if (data.overallRating) {
      await db.employee.update({
        where: { id: data.employeeId },
        data: {
          performanceRating: data.overallRating,
          lastReviewDate: data.reviewDate,
          nextReviewDate: this.calculateNextReviewDate(data.reviewDate, data.reviewType),
        },
      });
    }

    return review;
  }

  async completePerformanceReview(
    reviewId: string,
    completionData: {
      overallRating: number;
      technicalSkills?: number;
      communicationSkills?: number;
      teamwork?: number;
      leadership?: number;
      managerFeedback?: string;
      developmentPlan?: string;
      salaryAdjustment?: number;
      bonusAwarded?: number;
      promotionRecommended?: boolean;
      actionItems?: string[];
    }
  ): Promise<PerformanceReview> {
    return await db.performanceReview.update({
      where: { id: reviewId },
      data: {
        ...completionData,
        status: 'Completed',
        completedAt: new Date(),
      },
      include: {
        employee: { include: { user: true } },
        reviewer: true,
      },
    });
  }

  // Training Management
  async enrollEmployeeInTraining(
    employeeId: string,
    trainingName: string,
    trainingType: string,
    provider?: string,
    duration?: number,
    isRequired: boolean = false,
    requiredBy?: Date,
    costPerEmployee?: number
  ): Promise<TrainingRecord> {
    return await db.trainingRecord.create({
      data: {
        employeeId,
        trainingName,
        trainingType,
        provider,
        duration,
        isRequired,
        requiredBy,
        costPerEmployee,
        status: 'Enrolled',
      },
      include: {
        employee: { include: { user: true } },
      },
    });
  }

  async completeTraining(
    trainingRecordId: string,
    score?: number,
    certificateUrl?: string
  ): Promise<TrainingRecord> {
    const training = await db.trainingRecord.update({
      where: { id: trainingRecordId },
      data: {
        status: score && score >= 70 ? 'Completed' : 'Failed',
        completionDate: new Date(),
        score,
        certificateUrl,
      },
      include: {
        employee: true,
      },
    });

    // Update employee's training completed list
    if (training.status === 'Completed') {
      await db.employee.update({
        where: { id: training.employeeId },
        data: {
          trainingCompleted: {
            push: training.trainingName,
          },
        },
      });
    }

    return training;
  }

  // Time Tracking
  async clockIn(
    employeeId: string,
    workLocation?: string,
    projectId?: string
  ): Promise<TimeEntry> {
    // Check if already clocked in
    const existingEntry = await db.timeEntry.findFirst({
      where: {
        employeeId,
        clockOut: null,
        status: 'Active',
      },
    });

    if (existingEntry) {
      throw new Error('Employee is already clocked in');
    }

    return await db.timeEntry.create({
      data: {
        employeeId,
        clockIn: new Date(),
        workLocation,
        projectId,
        status: 'Active',
        workDate: new Date(),
      },
      include: {
        employee: { include: { user: true } },
      },
    });
  }

  async clockOut(
    employeeId: string,
    taskDescription?: string
  ): Promise<TimeEntry> {
    const activeEntry = await db.timeEntry.findFirst({
      where: {
        employeeId,
        clockOut: null,
        status: 'Active',
      },
    });

    if (!activeEntry) {
      throw new Error('No active time entry found');
    }

    const clockOut = new Date();
    const totalHours = (clockOut.getTime() - activeEntry.clockIn.getTime()) / (1000 * 60 * 60);
    const overtimeHours = Math.max(0, totalHours - 8); // Overtime after 8 hours

    return await db.timeEntry.update({
      where: { id: activeEntry.id },
      data: {
        clockOut,
        totalHours,
        overtimeHours,
        taskDescription,
        status: 'Completed',
      },
      include: {
        employee: { include: { user: true } },
      },
    });
  }

  async approveTimeEntry(timeEntryId: string, approvedBy: string): Promise<TimeEntry> {
    return await db.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        status: 'Approved',
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        employee: { include: { user: true } },
      },
    });
  }

  // Payroll Calculation
  async calculatePayroll(
    employeeId: string,
    payPeriodStart: Date,
    payPeriodEnd: Date
  ): Promise<PayrollData> {
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const timeEntries = await db.timeEntry.findMany({
      where: {
        employeeId,
        workDate: {
          gte: payPeriodStart,
          lte: payPeriodEnd,
        },
        status: 'Approved',
      },
    });

    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.totalHours?.toNumber() || 0), 0);
    const overtimeHours = timeEntries.reduce((sum, entry) => sum + (entry.overtimeHours?.toNumber() || 0), 0);
    const billableHours = timeEntries.reduce((sum, entry) => sum + (entry.billableHours?.toNumber() || 0), 0);

    let basePay = 0;
    let overtime = 0;

    if (employee.hourlyRate) {
      const regularHours = totalHours - overtimeHours;
      basePay = regularHours * employee.hourlyRate.toNumber();
      overtime = overtimeHours * employee.hourlyRate.toNumber() * 1.5; // 1.5x for overtime
    } else if (employee.baseSalary) {
      // Bi-weekly salary calculation
      basePay = employee.baseSalary.toNumber() / 26; // Assuming 26 pay periods per year
    }

    const commission = employee.commissionRate?.toNumber() || 0;
    const bonus = 0; // Would be calculated based on performance bonuses
    const deductions = basePay * 0.25; // Simplified tax/benefit deductions (25%)
    const netPay = basePay + overtime + commission + bonus - deductions;

    return {
      employeeId: employee.id,
      basePay,
      overtime,
      commission,
      bonus,
      deductions,
      netPay,
      hoursWorked: totalHours,
      billableHours,
    };
  }

  // Department Management
  async createDepartment(data: {
    name: string;
    type: string;
    description?: string;
    headOfDepartment?: string;
    budget?: number;
    maxHeadcount?: number;
  }): Promise<Department> {
    return await db.department.create({
      data: {
        ...data,
        headcount: 0,
      },
    });
  }

  async updateDepartmentHeadcount(departmentName: string): Promise<void> {
    const headcount = await db.employee.count({
      where: {
        department: departmentName,
        status: 'ACTIVE',
      },
    });

    await db.department.update({
      where: { name: departmentName },
      data: { headcount },
    });
  }

  // Analytics & Reporting
  async getPerformanceMetrics(
    dateFrom?: Date,
    dateTo?: Date,
    departmentName?: string
  ): Promise<PerformanceMetrics> {
    const whereClause: any = { status: 'ACTIVE' };
    
    if (departmentName) {
      whereClause.department = departmentName;
    }

    const reviewWhereClause: any = {};
    if (dateFrom || dateTo) {
      reviewWhereClause.reviewDate = {};
      if (dateFrom) reviewWhereClause.reviewDate.gte = dateFrom;
      if (dateTo) reviewWhereClause.reviewDate.lte = dateTo;
    }

    const [
      employeeCount,
      averageRating,
      topPerformers,
      reviewsCompleted,
      reviewsOverdue,
      trainingCompliance,
      totalEmployees,
      terminatedEmployees,
    ] = await Promise.all([
      db.employee.count({ where: whereClause }),
      db.employee.aggregate({
        where: { ...whereClause, performanceRating: { not: null } },
        _avg: { performanceRating: true },
      }),
      db.employee.count({
        where: { ...whereClause, performanceRating: { gte: 4.5 } },
      }),
      db.performanceReview.count({
        where: { ...reviewWhereClause, status: 'Completed' },
      }),
      db.performanceReview.count({
        where: { ...reviewWhereClause, status: 'Overdue' },
      }),
      db.trainingRecord.count({
        where: { status: 'Completed', isRequired: true },
      }),
      db.employee.count(),
      db.employee.count({
        where: { 
          status: 'TERMINATED',
          endDate: dateFrom ? { gte: dateFrom } : undefined,
        },
      }),
    ]);

    const turnoverRate = totalEmployees > 0 ? (terminatedEmployees / totalEmployees) * 100 : 0;
    const retentionRate = 100 - turnoverRate;

    return {
      employeeCount,
      averageRating: averageRating._avg.performanceRating?.toNumber() || 0,
      topPerformers,
      reviewsCompleted,
      reviewsOverdue,
      trainingCompliance,
      turnoverRate,
      retentionRate,
    };
  }

  async getEmployeesByDepartment(): Promise<Record<string, number>> {
    const departmentCounts = await db.employee.groupBy({
      by: ['department'],
      where: { status: 'ACTIVE' },
      _count: true,
    });

    return departmentCounts.reduce((acc, item) => {
      acc[item.department] = item._count;
      return acc;
    }, {} as Record<string, number>);
  }

  // Private Helper Methods
  private calculateNextReviewDate(currentReviewDate: Date, reviewType: string): Date {
    const nextReview = new Date(currentReviewDate);
    
    switch (reviewType) {
      case 'Quarterly':
        nextReview.setMonth(nextReview.getMonth() + 3);
        break;
      case 'Annual':
        nextReview.setFullYear(nextReview.getFullYear() + 1);
        break;
      case 'Probationary':
        nextReview.setMonth(nextReview.getMonth() + 6);
        break;
      default:
        nextReview.setFullYear(nextReview.getFullYear() + 1);
    }

    return nextReview;
  }
}

export const hrManagementService = new HRManagementService();
