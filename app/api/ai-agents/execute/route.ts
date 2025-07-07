
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIAgentManager } from '@/lib/services/ai-agent-core';

export const dynamic = 'force-dynamic';

// Execute AI agent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, inputData, agentType } = body;

    if (!agentId && !agentType) {
      return NextResponse.json(
        { error: 'Either agentId or agentType is required' },
        { status: 400 }
      );
    }

    // Initialize agents if not already done
    await AIAgentManager.initializeAgents();

    let result;

    if (agentId) {
      // Execute specific agent
      result = await AIAgentManager.executeAgent(
        agentId,
        inputData || {},
        session.user.id
      );
    } else {
      // Execute all agents of a specific type
      const results = await AIAgentManager.executeAgentsByType(
        agentType,
        inputData || {},
        session.user.id
      );
      
      result = {
        success: true,
        results,
        executedCount: results.length,
        successCount: results.filter(r => r.success).length,
      };
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'AI agent execution completed',
    });
  } catch (error) {
    console.error('Failed to execute AI agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute AI agent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
