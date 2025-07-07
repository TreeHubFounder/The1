
import { db } from '@/lib/db';
import type { 
  SupportTicket, 
  TicketPriority, 
  TicketStatus, 
  TicketType,
  TicketSource,
  SupportDepartment,
  LiveChatSession,
  SupportStaff
} from '@prisma/client';

export interface CreateTicketData {
  title: string;
  description: string;
  type: TicketType;
  priority?: TicketPriority;
  source: TicketSource;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  jobId?: string;
  equipmentId?: string;
  transactionId?: string;
  departmentId?: string;
}

export interface TicketMetrics {
  totalTickets: number;
  openTickets: number;
  avgFirstResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  slaBreaches: number;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByStatus: Record<TicketStatus, number>;
}

export interface LiveChatMetrics {
  activeSessions: number;
  avgWaitTime: number;
  avgChatDuration: number;
  customerSatisfaction: number;
  agentUtilization: number;
}

export class CustomerServiceService {
  // Ticket Management
  async createTicket(data: CreateTicketData): Promise<SupportTicket> {
    const ticketNumber = await this.generateTicketNumber();
    
    const ticket = await db.supportTicket.create({
      data: {
        ...data,
        ticketNumber,
        priority: data.priority || 'NORMAL',
        status: 'OPEN',
      },
      include: {
        customer: true,
        department: true,
        assignedTo: true,
      },
    });

    // Auto-assign if department has auto-assignment enabled
    if (data.departmentId) {
      await this.autoAssignTicket(ticket.id);
    }

    // Send notifications
    await this.sendTicketNotifications(ticket.id, 'created');

    return ticket;
  }

  async updateTicketStatus(
    ticketId: string, 
    status: TicketStatus, 
    resolution?: string
  ): Promise<SupportTicket> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'RESOLVED' && resolution) {
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();
    }

    if (status === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    const ticket = await db.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        customer: true,
        assignedTo: true,
        responses: true,
      },
    });

    // Update metrics
    await this.updateTicketMetrics(ticketId);

    return ticket;
  }

  async assignTicket(ticketId: string, assigneeId: string): Promise<SupportTicket> {
    const ticket = await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId: assigneeId,
        status: 'IN_PROGRESS',
      },
      include: {
        assignedTo: true,
        customer: true,
      },
    });

    // Update staff workload
    await this.updateStaffWorkload(assigneeId);

    // Send notification
    await this.sendTicketNotifications(ticketId, 'assigned');

    return ticket;
  }

  async escalateTicket(
    ticketId: string,
    escalatedToId: string,
    reason: string,
    escalationType: string = 'Tier'
  ): Promise<void> {
    await db.$transaction(async (tx) => {
      // Update ticket status
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'ESCALATED',
          escalatedToId,
        },
      });

      // Create escalation record
      await tx.ticketEscalation.create({
        data: {
          ticketId,
          escalatedToId,
          reason,
          escalationType,
          urgencyLevel: 'Standard',
        },
      });
    });

    await this.sendTicketNotifications(ticketId, 'escalated');
  }

  async addTicketResponse(
    ticketId: string,
    authorId: string,
    message: string,
    isInternal: boolean = false,
    attachments: string[] = []
  ): Promise<void> {
    await db.$transaction(async (tx) => {
      // Create response
      await tx.ticketResponse.create({
        data: {
          ticketId,
          authorId,
          message,
          isInternal,
          attachments,
        },
      });

      // Update ticket first response time if this is the first response
      const ticket = await tx.supportTicket.findUnique({
        where: { id: ticketId },
        select: { firstResponseAt: true, createdAt: true },
      });

      if (!ticket?.firstResponseAt && !isInternal) {
        const responseTime = Math.floor(
          (new Date().getTime() - ticket!.createdAt.getTime()) / (1000 * 60)
        );

        await tx.supportTicket.update({
          where: { id: ticketId },
          data: {
            firstResponseAt: new Date(),
            firstResponseTime: responseTime,
          },
        });
      }
    });

    // Send notifications
    if (!isInternal) {
      await this.sendTicketNotifications(ticketId, 'responded');
    }
  }

  // Live Chat Management
  async startChatSession(customerId?: string): Promise<LiveChatSession> {
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session = await db.liveChatSession.create({
      data: {
        sessionId,
        customerId,
        status: 'Active',
      },
    });

    // Find available agent
    const availableAgent = await this.findAvailableAgent();
    if (availableAgent) {
      await this.assignChatAgent(session.id, availableAgent.userId);
    }

    return session;
  }

  async assignChatAgent(sessionId: string, agentId: string): Promise<void> {
    await db.liveChatSession.update({
      where: { id: sessionId },
      data: {
        agentId,
        status: 'Active',
      },
    });

    // Update agent workload
    await this.updateStaffWorkload(agentId);
  }

  async endChatSession(
    sessionId: string,
    customerRating?: number,
    feedbackComment?: string
  ): Promise<void> {
    const session = await db.liveChatSession.findUnique({
      where: { id: sessionId },
      select: { startedAt: true },
    });

    if (session) {
      const duration = Math.floor(
        (new Date().getTime() - session.startedAt.getTime()) / 1000
      );

      await db.liveChatSession.update({
        where: { id: sessionId },
        data: {
          status: 'Ended',
          endedAt: new Date(),
          chatDuration: duration,
          customerRating,
          feedbackComment,
        },
      });
    }
  }

  // Department Management
  async createDepartment(data: {
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    slaResponseTime?: number;
    slaResolutionTime?: number;
  }): Promise<SupportDepartment> {
    return await db.supportDepartment.create({
      data,
    });
  }

  async addStaffToDepartment(
    userId: string,
    departmentId: string,
    supportLevel: string,
    specializations: string[] = []
  ): Promise<SupportStaff> {
    return await db.supportStaff.create({
      data: {
        userId,
        departmentId,
        supportLevel,
        specializations,
        isActive: true,
      },
      include: {
        user: true,
        department: true,
      },
    });
  }

  // Analytics & Metrics
  async getTicketMetrics(
    dateFrom?: Date,
    dateTo?: Date,
    departmentId?: string
  ): Promise<TicketMetrics> {
    const whereClause: any = {};
    
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = dateFrom;
      if (dateTo) whereClause.createdAt.lte = dateTo;
    }
    
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    const [
      totalTickets,
      openTickets,
      avgResponseTime,
      avgResolutionTime,
      satisfactionData,
      slaBreaches,
      priorityCounts,
      statusCounts,
    ] = await Promise.all([
      db.supportTicket.count({ where: whereClause }),
      db.supportTicket.count({ 
        where: { ...whereClause, status: { in: ['OPEN', 'IN_PROGRESS'] } }
      }),
      db.supportTicket.aggregate({
        where: { ...whereClause, firstResponseTime: { not: null } },
        _avg: { firstResponseTime: true },
      }),
      db.supportTicket.aggregate({
        where: { ...whereClause, resolutionTime: { not: null } },
        _avg: { resolutionTime: true },
      }),
      db.supportTicket.aggregate({
        where: { ...whereClause, satisfactionRating: { not: null } },
        _avg: { satisfactionRating: true },
      }),
      db.supportTicket.count({ where: { ...whereClause, slaBreached: true } }),
      db.supportTicket.groupBy({
        by: ['priority'],
        where: whereClause,
        _count: true,
      }),
      db.supportTicket.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
      }),
    ]);

    const ticketsByPriority = priorityCounts.reduce((acc, item) => {
      acc[item.priority] = item._count;
      return acc;
    }, {} as Record<TicketPriority, number>);

    const ticketsByStatus = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<TicketStatus, number>);

    return {
      totalTickets,
      openTickets,
      avgFirstResponseTime: avgResponseTime._avg.firstResponseTime || 0,
      avgResolutionTime: avgResolutionTime._avg.resolutionTime || 0,
      satisfactionScore: satisfactionData._avg.satisfactionRating || 0,
      slaBreaches,
      ticketsByPriority,
      ticketsByStatus,
    };
  }

  async getLiveChatMetrics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<LiveChatMetrics> {
    const whereClause: any = {};
    
    if (dateFrom || dateTo) {
      whereClause.startedAt = {};
      if (dateFrom) whereClause.startedAt.gte = dateFrom;
      if (dateTo) whereClause.startedAt.lte = dateTo;
    }

    const [
      activeSessions,
      avgWaitTime,
      avgChatDuration,
      customerSatisfaction,
      totalSessions,
    ] = await Promise.all([
      db.liveChatSession.count({
        where: { ...whereClause, status: 'Active' },
      }),
      db.liveChatSession.aggregate({
        where: { ...whereClause, waitTime: { not: null } },
        _avg: { waitTime: true },
      }),
      db.liveChatSession.aggregate({
        where: { ...whereClause, chatDuration: { not: null } },
        _avg: { chatDuration: true },
      }),
      db.liveChatSession.aggregate({
        where: { ...whereClause, customerRating: { not: null } },
        _avg: { customerRating: true },
      }),
      db.liveChatSession.count({ where: whereClause }),
    ]);

    // Calculate agent utilization
    const activeAgents = await db.supportStaff.count({
      where: { isActive: true },
    });

    const agentUtilization = activeAgents > 0 ? (activeSessions / activeAgents) * 100 : 0;

    return {
      activeSessions,
      avgWaitTime: avgWaitTime._avg.waitTime || 0,
      avgChatDuration: avgChatDuration._avg.chatDuration || 0,
      customerSatisfaction: customerSatisfaction._avg.customerRating || 0,
      agentUtilization,
    };
  }

  // Private Helper Methods
  private async generateTicketNumber(): Promise<string> {
    const count = await db.supportTicket.count();
    return `TK-${String(count + 1).padStart(6, '0')}`;
  }

  private async autoAssignTicket(ticketId: string): Promise<void> {
    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
      include: { department: true },
    });

    if (ticket?.department?.autoAssignment) {
      const availableAgent = await this.findAvailableAgent(ticket.departmentId);
      if (availableAgent) {
        await this.assignTicket(ticketId, availableAgent.userId);
      }
    }
  }

  private async findAvailableAgent(departmentId?: string): Promise<SupportStaff | null> {
    const whereClause: any = { 
      isActive: true,
      currentWorkload: { lt: db.supportStaff.fields.maxConcurrentTickets },
    };
    
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    return await db.supportStaff.findFirst({
      where: whereClause,
      orderBy: { currentWorkload: 'asc' },
    });
  }

  private async updateStaffWorkload(staffUserId: string): Promise<void> {
    const workload = await db.supportTicket.count({
      where: {
        assignedToId: staffUserId,
        status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] },
      },
    });

    await db.supportStaff.update({
      where: { userId: staffUserId },
      data: { currentWorkload: workload },
    });
  }

  private async updateTicketMetrics(ticketId: string): Promise<void> {
    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        createdAt: true,
        resolvedAt: true,
        status: true,
        departmentId: true,
      },
    });

    if (ticket?.resolvedAt && ticket.departmentId) {
      const resolutionTime = Math.floor(
        (ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60)
      );

      await db.supportTicket.update({
        where: { id: ticketId },
        data: { resolutionTime },
      });

      // Update department metrics
      await this.updateDepartmentMetrics(ticket.departmentId);
    }
  }

  private async updateDepartmentMetrics(departmentId: string): Promise<void> {
    const [avgResponseTime, avgResolutionTime, satisfactionScore, ticketVolume] = 
      await Promise.all([
        db.supportTicket.aggregate({
          where: { 
            departmentId,
            firstResponseTime: { not: null },
          },
          _avg: { firstResponseTime: true },
        }),
        db.supportTicket.aggregate({
          where: { 
            departmentId,
            resolutionTime: { not: null },
          },
          _avg: { resolutionTime: true },
        }),
        db.supportTicket.aggregate({
          where: { 
            departmentId,
            satisfactionRating: { not: null },
          },
          _avg: { satisfactionRating: true },
        }),
        db.supportTicket.count({
          where: { departmentId },
        }),
      ]);

    await db.supportDepartment.update({
      where: { id: departmentId },
      data: {
        avgResponseTime: avgResponseTime._avg.firstResponseTime,
        avgResolutionTime: avgResolutionTime._avg.resolutionTime,
        satisfactionScore: satisfactionScore._avg.satisfactionRating,
        ticketVolume,
      },
    });
  }

  private async sendTicketNotifications(
    ticketId: string, 
    event: string
  ): Promise<void> {
    // Implementation would depend on notification service
    // This is a placeholder for notification logic
    console.log(`Sending ${event} notification for ticket ${ticketId}`);
  }
}

export const customerServiceService = new CustomerServiceService();
