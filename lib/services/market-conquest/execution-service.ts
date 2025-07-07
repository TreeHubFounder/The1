
import { PrismaClient } from '@prisma/client';
import { MilestoneStatus, MilestoneType } from '@prisma/client';

const prisma = new PrismaClient();

export interface MilestoneData {
  title: string;
  description: string;
  type: MilestoneType;
  status?: MilestoneStatus;
  priority: string;
  plannedStartDate: Date;
  plannedEndDate: Date;
  successMetrics: any;
  targetValue?: number;
  dependencies?: string[];
  assignedTo?: string;
  assignedTeam?: string[];
}

export interface WeeklyProgress {
  week: number;
  progressPercentage: number;
  completedTasks: string[];
  blockers: string[];
  notes: string;
}

export class ExecutionService {
  // Bucks County conquest timeline based on the strategy
  static readonly CONQUEST_TIMELINE = {
    week1to4: [
      {
        title: 'Platform Enhancement for Market Conquest',
        type: 'SYSTEM_DEVELOPMENT',
        targetValue: 100,
        priority: 'Critical',
      },
      {
        title: 'Initialize Territory Protection System',
        type: 'TERRITORY_EXPANSION',
        targetValue: 25,
        priority: 'High',
      },
    ],
    week5to8: [
      {
        title: 'Recruit First 25 Elite Professionals',
        type: 'RECRUITMENT',
        targetValue: 25,
        priority: 'Critical',
      },
      {
        title: 'Secure Property Management Partnerships',
        type: 'PARTNERSHIP',
        targetValue: 5,
        priority: 'High',
      },
    ],
    week9to16: [
      {
        title: 'Achieve 50% Bucks County Penetration',
        type: 'MARKET_PENETRATION',
        targetValue: 50,
        priority: 'Critical',
      },
      {
        title: 'Launch Insurance Partnership Program',
        type: 'PARTNERSHIP',
        targetValue: 3,
        priority: 'High',
      },
    ],
    week17to26: [
      {
        title: 'Scale to 75-100 Active Professionals',
        type: 'RECRUITMENT',
        targetValue: 100,
        priority: 'Critical',
      },
      {
        title: 'Achieve $940K Annual Revenue Run Rate',
        type: 'REVENUE_TARGET',
        targetValue: 940000,
        priority: 'Critical',
      },
    ],
    week27to52: [
      {
        title: 'Prepare Multi-Market Expansion',
        type: 'MARKET_PENETRATION',
        targetValue: 3,
        priority: 'High',
      },
      {
        title: 'Develop Franchise Model',
        type: 'SYSTEM_DEVELOPMENT',
        targetValue: 1,
        priority: 'Medium',
      },
    ],
  };

  // Create milestone
  static async createMilestone(data: MilestoneData) {
    try {
      const milestone = await prisma.conquestMilestone.create({
        data: {
          ...data,
          status: data.status || MilestoneStatus.NOT_STARTED,
          progressPercentage: 0,
          blockers: [],
          prerequisites: [],
          progressNotes: [],
          weeklyProgress: {},
        },
      });

      return { success: true, milestone };
    } catch (error) {
      console.error('Error creating milestone:', error);
      return { success: false, error: 'Failed to create milestone' };
    }
  }

  // Get milestones with filtering
  static async getMilestones(filters?: {
    type?: MilestoneType;
    status?: MilestoneStatus;
    priority?: string;
    assignedTo?: string;
  }) {
    try {
      const milestones = await prisma.conquestMilestone.findMany({
        where: filters,
        include: {
          subMilestones: true,
          parentMilestone: true,
        },
        orderBy: [
          { priority: 'desc' },
          { plannedStartDate: 'asc' },
        ],
      });

      return { success: true, milestones };
    } catch (error) {
      console.error('Error fetching milestones:', error);
      return { success: false, error: 'Failed to fetch milestones' };
    }
  }

  // Update milestone progress
  static async updateMilestoneProgress(
    milestoneId: string, 
    progressPercentage: number, 
    notes?: string,
    actualValue?: number
  ) {
    try {
      const milestone = await prisma.conquestMilestone.findUnique({
        where: { id: milestoneId },
      });

      if (!milestone) {
        return { success: false, error: 'Milestone not found' };
      }

      // Determine new status based on progress
      let newStatus = milestone.status;
      if (progressPercentage > 0 && milestone.status === MilestoneStatus.NOT_STARTED) {
        newStatus = MilestoneStatus.IN_PROGRESS;
      } else if (progressPercentage >= 100) {
        newStatus = MilestoneStatus.COMPLETED;
      }

      // Update weekly progress
      const currentWeek = this.getCurrentWeek();
      const weeklyProgress = milestone.weeklyProgress as any || {};
      weeklyProgress[`week_${currentWeek}`] = {
        week: currentWeek,
        progressPercentage,
        notes: notes || '',
        updatedAt: new Date(),
      };

      const updatedMilestone = await prisma.conquestMilestone.update({
        where: { id: milestoneId },
        data: {
          progressPercentage,
          status: newStatus,
          actualValue,
          lastUpdateDate: new Date(),
          weeklyProgress,
          actualEndDate: progressPercentage >= 100 ? new Date() : undefined,
          progressNotes: notes ? [...milestone.progressNotes, notes] : milestone.progressNotes,
        },
      });

      return { success: true, milestone: updatedMilestone };
    } catch (error) {
      console.error('Error updating milestone progress:', error);
      return { success: false, error: 'Failed to update milestone progress' };
    }
  }

  // Initialize conquest timeline
  static async initializeConquestTimeline() {
    try {
      const results = {
        created: 0,
        errors: [] as string[],
      };

      const baseDate = new Date();
      
      // Create milestones for each phase
      for (const [phase, milestones] of Object.entries(this.CONQUEST_TIMELINE)) {
        const [weekStart, weekEnd] = this.getPhaseWeeks(phase);
        
        for (const milestoneData of milestones) {
          try {
            const plannedStartDate = new Date(baseDate.getTime() + (weekStart - 1) * 7 * 24 * 60 * 60 * 1000);
            const plannedEndDate = new Date(baseDate.getTime() + weekEnd * 7 * 24 * 60 * 60 * 1000);

            const existingMilestone = await prisma.conquestMilestone.findFirst({
              where: { title: milestoneData.title },
            });

            if (!existingMilestone) {
              await this.createMilestone({
                ...milestoneData,
                description: this.generateMilestoneDescription(milestoneData.title, milestoneData.type),
                plannedStartDate,
                plannedEndDate,
                successMetrics: this.generateSuccessMetrics(milestoneData.type, milestoneData.targetValue),
              });
              results.created++;
            }
          } catch (error) {
            console.error(`Error creating milestone ${milestoneData.title}:`, error);
            results.errors.push(`Failed to create milestone: ${milestoneData.title}`);
          }
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error initializing conquest timeline:', error);
      return { success: false, error: 'Failed to initialize conquest timeline' };
    }
  }

  // Get execution dashboard
  static async getExecutionDashboard() {
    try {
      const milestones = await prisma.conquestMilestone.findMany({
        orderBy: { plannedStartDate: 'asc' },
      });

      const now = new Date();
      const dashboard = {
        overview: {
          totalMilestones: milestones.length,
          completed: milestones.filter(m => m.status === 'COMPLETED').length,
          inProgress: milestones.filter(m => m.status === 'IN_PROGRESS').length,
          notStarted: milestones.filter(m => m.status === 'NOT_STARTED').length,
          delayed: milestones.filter(m => 
            m.status !== 'COMPLETED' && new Date(m.plannedEndDate) < now
          ).length,
          blocked: milestones.filter(m => m.status === 'BLOCKED').length,
        },

        currentWeek: this.getCurrentWeek(),
        
        byType: milestones.reduce((acc, m) => {
          const type = m.type;
          if (!acc[type]) acc[type] = { total: 0, completed: 0, inProgress: 0 };
          acc[type].total++;
          if (m.status === 'COMPLETED') acc[type].completed++;
          if (m.status === 'IN_PROGRESS') acc[type].inProgress++;
          return acc;
        }, {} as Record<string, any>),

        timeline: {
          thisWeek: milestones.filter(m => 
            this.isDateInCurrentWeek(new Date(m.plannedStartDate)) ||
            this.isDateInCurrentWeek(new Date(m.plannedEndDate))
          ),
          nextWeek: milestones.filter(m => 
            this.isDateInNextWeek(new Date(m.plannedStartDate))
          ),
          upcomingMonth: milestones.filter(m => 
            this.isDateInNextMonth(new Date(m.plannedStartDate))
          ),
        },

        criticalPath: milestones
          .filter(m => m.priority === 'Critical' && m.status !== 'COMPLETED')
          .sort((a, b) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime()),

        recentProgress: milestones
          .filter(m => m.lastUpdateDate && 
            new Date(m.lastUpdateDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
          .sort((a, b) => new Date(b.lastUpdateDate!).getTime() - new Date(a.lastUpdateDate!).getTime()),
      };

      return { success: true, dashboard };
    } catch (error) {
      console.error('Error fetching execution dashboard:', error);
      return { success: false, error: 'Failed to fetch execution dashboard' };
    }
  }

  // Weekly progress report
  static async generateWeeklyReport() {
    try {
      const currentWeek = this.getCurrentWeek();
      const milestones = await prisma.conquestMilestone.findMany({
        where: {
          OR: [
            { status: 'IN_PROGRESS' },
            { 
              lastUpdateDate: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
      });

      const weeklyReport = {
        week: currentWeek,
        period: this.getWeekDateRange(currentWeek),
        
        summary: {
          milestonesActive: milestones.filter(m => m.status === 'IN_PROGRESS').length,
          milestonesCompleted: milestones.filter(m => 
            m.status === 'COMPLETED' && 
            m.actualEndDate &&
            this.isDateInCurrentWeek(new Date(m.actualEndDate))
          ).length,
          averageProgress: milestones.reduce((sum, m) => sum + Number(m.progressPercentage), 0) / milestones.length,
        },

        milestoneUpdates: milestones.map(m => {
          const weeklyProgress = m.weeklyProgress as any || {};
          const thisWeekProgress = weeklyProgress[`week_${currentWeek}`];
          
          return {
            milestone: m.title,
            type: m.type,
            status: m.status,
            progressPercentage: m.progressPercentage,
            thisWeekProgress: thisWeekProgress?.progressPercentage || 0,
            notes: thisWeekProgress?.notes || '',
            isOnTrack: this.isMilestoneOnTrack(m),
          };
        }),

        risks: milestones
          .filter(m => !this.isMilestoneOnTrack(m))
          .map(m => ({
            milestone: m.title,
            risk: 'Behind schedule',
            impact: m.priority,
            mitigation: this.suggestMitigation(m),
          })),

        nextWeekPlanned: milestones.filter(m => 
          this.isDateInNextWeek(new Date(m.plannedStartDate))
        ),
      };

      return { success: true, report: weeklyReport };
    } catch (error) {
      console.error('Error generating weekly report:', error);
      return { success: false, error: 'Failed to generate weekly report' };
    }
  }

  // Helper methods
  static getCurrentWeek(): number {
    const startDate = new Date('2024-01-01'); // Conquest start date
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  }

  static getPhaseWeeks(phase: string): [number, number] {
    const phases = {
      'week1to4': [1, 4],
      'week5to8': [5, 8],
      'week9to16': [9, 16],
      'week17to26': [17, 26],
      'week27to52': [27, 52],
    };
    return phases[phase as keyof typeof phases] || [1, 1];
  }

  static generateMilestoneDescription(title: string, type: MilestoneType): string {
    const descriptions = {
      'Platform Enhancement for Market Conquest': 'Complete development of market conquest features including territory management, tier system, competitive intelligence, and partnership tools.',
      'Initialize Territory Protection System': 'Set up exclusive territory protection for first 25 Gold+ tier professionals in Bucks County zip codes.',
      'Recruit First 25 Elite Professionals': 'Recruit and onboard 25 high-quality tree care professionals with ISA certifications and proven track records.',
      'Secure Property Management Partnerships': 'Establish partnerships with major property management companies in Bucks County for recurring contract opportunities.',
      'Achieve 50% Bucks County Penetration': 'Secure professional coverage and territory assignments for 50% of Bucks County zip codes.',
      'Launch Insurance Partnership Program': 'Activate partnerships with major insurance companies for storm damage referrals and emergency response.',
      'Scale to 75-100 Active Professionals': 'Grow professional network to target size for market domination and sustainable growth.',
      'Achieve $940K Annual Revenue Run Rate': 'Reach monthly revenue targets that project to $940K+ annually through subscriptions, commissions, and partnerships.',
      'Prepare Multi-Market Expansion': 'Develop expansion plans and infrastructure for Philadelphia, South Jersey, and Delaware markets.',
      'Develop Franchise Model': 'Create comprehensive franchise system for national expansion with licensing, training, and support programs.',
    };
    return descriptions[title as keyof typeof descriptions] || `Execute ${title} according to market conquest strategy.`;
  }

  static generateSuccessMetrics(type: MilestoneType, targetValue?: number): any {
    const baseMetrics = {
      completion: 100,
      onTime: true,
      withinBudget: true,
    };

    const typeSpecificMetrics = {
      RECRUITMENT: {
        professionalsRecruited: targetValue || 25,
        averageTierLevel: 'GOLD',
        retentionRate: 90,
      },
      TERRITORY_EXPANSION: {
        territoriesAssigned: targetValue || 25,
        penetrationRate: targetValue || 50,
        revenuePerTerritory: 5000,
      },
      PARTNERSHIP: {
        partnershipsActive: targetValue || 5,
        leadsGenerated: 50,
        revenueFromPartnerships: 10000,
      },
      REVENUE_TARGET: {
        monthlyRevenue: (targetValue || 940000) / 12,
        annualProjection: targetValue || 940000,
        profitMargin: 25,
      },
      SYSTEM_DEVELOPMENT: {
        featuresCompleted: 100,
        userAcceptanceTesting: 100,
        performanceBenchmarks: 100,
      },
      MARKET_PENETRATION: {
        marketShare: targetValue || 30,
        competitorDisplacement: 5,
        brandRecognition: 60,
      },
    };

    return {
      ...baseMetrics,
      ...(typeSpecificMetrics[type] || {}),
    };
  }

  static isMilestoneOnTrack(milestone: any): boolean {
    const now = new Date();
    const plannedStart = new Date(milestone.plannedStartDate);
    const plannedEnd = new Date(milestone.plannedEndDate);
    
    if (milestone.status === 'COMPLETED') return true;
    if (milestone.status === 'BLOCKED') return false;
    
    const totalDuration = plannedEnd.getTime() - plannedStart.getTime();
    const elapsed = now.getTime() - plannedStart.getTime();
    const expectedProgress = (elapsed / totalDuration) * 100;
    
    return milestone.progressPercentage >= expectedProgress * 0.9; // 90% of expected progress
  }

  static suggestMitigation(milestone: any): string {
    const mitigations = {
      RECRUITMENT: 'Increase recruiter outreach, offer sign-on bonuses, partner with trade schools',
      TERRITORY_EXPANSION: 'Focus on high-opportunity zip codes, offer territory protection incentives',
      PARTNERSHIP: 'Direct executive outreach, value proposition enhancement, pilot programs',
      REVENUE_TARGET: 'Storm surge activation, premium pricing, partnership acceleration',
      SYSTEM_DEVELOPMENT: 'Additional development resources, scope reduction, parallel development',
      MARKET_PENETRATION: 'Competitive pricing, enhanced marketing, professional incentives',
    };
    return mitigations[milestone.type as keyof typeof mitigations] || 'Review resource allocation and remove blockers';
  }

  static isDateInCurrentWeek(date: Date): boolean {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return date >= weekStart && date <= weekEnd;
  }

  static isDateInNextWeek(date: Date): boolean {
    const now = new Date();
    const nextWeekStart = new Date(now);
    nextWeekStart.setDate(now.getDate() - now.getDay() + 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    
    return date >= nextWeekStart && date <= nextWeekEnd;
  }

  static isDateInNextMonth(date: Date): boolean {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    
    return date >= nextMonth && date <= endOfNextMonth;
  }

  static getWeekDateRange(week: number): { start: Date; end: Date } {
    const startDate = new Date('2024-01-01');
    const weekStart = new Date(startDate.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    return { start: weekStart, end: weekEnd };
  }
}
