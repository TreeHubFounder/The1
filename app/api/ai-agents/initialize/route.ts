
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIAgentManager } from '@/lib/services/ai-agent-core';

export const dynamic = 'force-dynamic';

// Initialize AI agents system
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 Initializing AI agents system...');

    // Create default AI agents if they don't exist
    const defaultAgents = [
      {
        name: 'Storm Response AI',
        type: 'STORM_RESPONSE',
        config: {
          leadGenerationEnabled: true,
          crewAlertRadius: 50,
          maxLeadsPerStorm: 200,
          commissionRate: 0.25,
        },
      },
      {
        name: 'Job Matching AI',
        type: 'JOB_MATCHING',
        config: {
          maxMatchesPerJob: 10,
          autoNotifyContractors: true,
          matchThreshold: 0.6,
          commissionRate: 0.07,
        },
      },
      {
        name: 'Equipment Intelligence AI',
        type: 'EQUIPMENT_INTELLIGENCE',
        config: {
          maintenanceThreshold: 60,
          priceOptimizationEnabled: true,
          utilizationTarget: 70,
        },
      },
      {
        name: 'Weather Monitor AI',
        type: 'WEATHER_MONITOR',
        config: {
          monitoringInterval: 30, // minutes
          stormDetectionThreshold: 25, // mph wind speed
          alertRadius: 100, // miles
        },
      },
    ];

    const createdAgents = [];

    for (const agentConfig of defaultAgents) {
      // Check if agent already exists
      const existingAgent = await prisma.aIAgent.findFirst({
        where: {
          name: agentConfig.name,
          type: agentConfig.type as any,
        },
      });

      if (!existingAgent) {
        const agent = await prisma.aIAgent.create({
          data: {
            name: agentConfig.name,
            type: agentConfig.type as any,
            status: 'ACTIVE',
            config: agentConfig.config,
            version: '1.0',
          },
        });
        createdAgents.push(agent);
        console.log(`✅ Created AI agent: ${agent.name}`);
      } else {
        console.log(`⚠️  AI agent already exists: ${agentConfig.name}`);
      }
    }

    // Initialize the AI agent manager
    await AIAgentManager.initializeAgents();

    return NextResponse.json({
      success: true,
      message: 'AI agents system initialized successfully',
      data: {
        createdAgents: createdAgents.length,
        totalAgents: defaultAgents.length,
        registeredAgents: AIAgentManager.getRegisteredAgents().length,
      },
    });
  } catch (error) {
    console.error('Failed to initialize AI agents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize AI agents system',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Get initialization status
export async function GET() {
  try {
    const agentCount = await prisma.aIAgent.count();
    const registeredCount = AIAgentManager.getRegisteredAgents().length;

    return NextResponse.json({
      success: true,
      data: {
        databaseAgents: agentCount,
        registeredAgents: registeredCount,
        isInitialized: agentCount > 0 && registeredCount > 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get initialization status',
      },
      { status: 500 }
    );
  }
}
