
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIAgentManager } from '@/lib/services/ai-agent-core';

export const dynamic = 'force-dynamic';

// Get all AI agents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const agents = await prisma.aIAgent.findMany({
      where,
      include: {
        agentLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        revenueTracking: {
          where: {
            revenueDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate performance metrics
    const agentsWithMetrics = agents.map(agent => {
      const recentRevenue = agent.revenueTracking.reduce(
        (sum, revenue) => sum + Number(revenue.amount), 0
      );
      
      const successRate = agent.totalExecutions > 0 
        ? (agent.successfulExecutions / agent.totalExecutions) * 100 
        : 0;

      return {
        ...agent,
        metrics: {
          successRate: Math.round(successRate),
          recentRevenue,
          avgResponseTime: agent.averageResponseTime,
          lastExecution: agent.lastExecutionAt,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: agentsWithMetrics,
      count: agents.length,
    });
  } catch (error) {
    console.error('Failed to get AI agents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch AI agents',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Create new AI agent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, config = {}, status = 'ACTIVE' } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const agent = await prisma.aIAgent.create({
      data: {
        name,
        type,
        status,
        config,
        version: '1.0',
      },
    });

    return NextResponse.json({
      success: true,
      data: agent,
      message: 'AI agent created successfully',
    });
  } catch (error) {
    console.error('Failed to create AI agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create AI agent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
