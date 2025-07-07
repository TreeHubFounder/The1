
import { prisma } from '@/lib/db';
import { AIAgentType, AIAgentStatus } from '@prisma/client';

// AI Agent execution context
export interface AIAgentContext {
  agentId: string;
  executionId: string;
  triggeredBy: string;
  inputData: any;
  timestamp: Date;
}

// AI Agent execution result
export interface AIAgentResult {
  success: boolean;
  outputData?: any;
  errorMessage?: string;
  metrics?: {
    processingTime: number;
    revenueGenerated?: number;
    leadsGenerated?: number;
    jobsMatched?: number;
  };
}

// Base AI Agent class
export abstract class BaseAIAgent {
  protected agentId: string;
  protected name: string;
  protected type: AIAgentType;
  protected config: any;

  constructor(agentId: string, name: string, type: AIAgentType, config: any = {}) {
    this.agentId = agentId;
    this.name = name;
    this.type = type;
    this.config = config;
  }

  // Abstract method to be implemented by specific agents
  abstract execute(context: AIAgentContext): Promise<AIAgentResult>;

  // Log agent execution
  protected async logExecution(context: AIAgentContext, result: AIAgentResult): Promise<void> {
    try {
      await prisma.aIAgentLog.create({
        data: {
          executionId: context.executionId,
          status: result.success ? 'success' : 'error',
          inputData: context.inputData,
          outputData: result.outputData,
          errorMessage: result.errorMessage,
          processingTime: result.metrics?.processingTime,
          triggeredBy: context.triggeredBy,
          executionContext: {
            timestamp: context.timestamp.toISOString(),
            agentType: this.type,
          },
          agentId: this.agentId,
        },
      });

      // Update agent metrics
      await this.updateAgentMetrics(result);
    } catch (error) {
      console.error('Failed to log agent execution:', error);
    }
  }

  // Update agent performance metrics
  private async updateAgentMetrics(result: AIAgentResult): Promise<void> {
    try {
      const updateData: any = {
        totalExecutions: { increment: 1 },
        lastExecutionAt: new Date(),
      };

      if (result.success) {
        updateData.successfulExecutions = { increment: 1 };
        
        if (result.metrics?.revenueGenerated) {
          updateData.revenueGenerated = { increment: result.metrics.revenueGenerated };
        }
        
        if (result.metrics?.leadsGenerated) {
          updateData.leadsGenerated = { increment: result.metrics.leadsGenerated };
        }
        
        if (result.metrics?.jobsMatched) {
          updateData.jobsMatched = { increment: result.metrics.jobsMatched };
        }
      } else {
        updateData.errorCount = { increment: 1 };
      }

      // Update average response time
      if (result.metrics?.processingTime) {
        const agent = await prisma.aIAgent.findUnique({
          where: { id: this.agentId },
          select: { averageResponseTime: true, totalExecutions: true },
        });

        if (agent) {
          const currentAvg = agent.averageResponseTime || 0;
          const newAvg = ((currentAvg * agent.totalExecutions) + result.metrics.processingTime) / (agent.totalExecutions + 1);
          updateData.averageResponseTime = Math.round(newAvg);
        }
      }

      await prisma.aIAgent.update({
        where: { id: this.agentId },
        data: updateData,
      });
    } catch (error) {
      console.error('Failed to update agent metrics:', error);
    }
  }

  // Execute agent with full logging and error handling
  async executeWithLogging(context: AIAgentContext): Promise<AIAgentResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 Executing AI Agent: ${this.name} (${this.type})`);
      
      const result = await this.execute(context);
      
      // Add processing time to metrics
      result.metrics = {
        ...result.metrics,
        processingTime: Date.now() - startTime,
      };
      
      await this.logExecution(context, result);
      
      console.log(`✅ AI Agent ${this.name} executed successfully in ${result.metrics.processingTime}ms`);
      
      return result;
    } catch (error) {
      const result: AIAgentResult = {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          processingTime: Date.now() - startTime,
        },
      };
      
      await this.logExecution(context, result);
      
      console.error(`❌ AI Agent ${this.name} failed:`, error);
      
      return result;
    }
  }
}

// AI Agent Manager
export class AIAgentManager {
  private static agents: Map<string, BaseAIAgent> = new Map();

  // Register an AI agent
  static registerAgent(agent: BaseAIAgent): void {
    this.agents.set(agent['agentId'], agent);
    console.log(`🤖 Registered AI Agent: ${agent['name']} (${agent['type']})`);
  }

  // Execute a specific agent
  static async executeAgent(agentId: string, inputData: any, triggeredBy: string): Promise<AIAgentResult> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`AI Agent not found: ${agentId}`);
    }

    const context: AIAgentContext = {
      agentId,
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggeredBy,
      inputData,
      timestamp: new Date(),
    };

    return await agent.executeWithLogging(context);
  }

  // Execute all agents of a specific type
  static async executeAgentsByType(type: AIAgentType, inputData: any, triggeredBy: string): Promise<AIAgentResult[]> {
    const typeAgents = Array.from(this.agents.values()).filter(agent => agent['type'] === type);
    
    const results = await Promise.all(
      typeAgents.map(agent => 
        this.executeAgent(agent['agentId'], inputData, triggeredBy)
      )
    );
    
    return results;
  }

  // Get all registered agents
  static getRegisteredAgents(): BaseAIAgent[] {
    return Array.from(this.agents.values());
  }

  // Initialize all AI agents from database
  static async initializeAgents(): Promise<void> {
    try {
      const dbAgents = await prisma.aIAgent.findMany({
        where: { status: 'ACTIVE' },
      });

      console.log(`🤖 Initializing ${dbAgents.length} AI agents...`);

      // Import and register agent implementations
      const { StormResponseAgent } = await import('./agents/storm-response-agent');
      const { JobMatchingAgent } = await import('./agents/job-matching-agent');
      const { EquipmentIntelligenceAgent } = await import('./agents/equipment-intelligence-agent');

      for (const dbAgent of dbAgents) {
        let agentInstance: BaseAIAgent | null = null;

        switch (dbAgent.type) {
          case 'STORM_RESPONSE':
            agentInstance = new StormResponseAgent(dbAgent.id, dbAgent.name, dbAgent.config);
            break;
          case 'JOB_MATCHING':
            agentInstance = new JobMatchingAgent(dbAgent.id, dbAgent.name, dbAgent.config);
            break;
          case 'EQUIPMENT_INTELLIGENCE':
            agentInstance = new EquipmentIntelligenceAgent(dbAgent.id, dbAgent.name, dbAgent.config);
            break;
        }

        if (agentInstance) {
          this.registerAgent(agentInstance);
        }
      }

      console.log(`✅ Successfully initialized ${this.agents.size} AI agents`);
    } catch (error) {
      console.error('Failed to initialize AI agents:', error);
    }
  }
}

// Utility function to generate execution ID
export function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Utility function to calculate revenue from lead value
export function calculateLeadCommission(leadValue: number, commissionRate: number = 0.25): number {
  return leadValue * commissionRate;
}

// Utility function to calculate job matching score
export function calculateJobMatchScore(
  locationScore: number,
  skillScore: number,
  availabilityScore: number,
  priceScore: number,
  weights: { location: number; skill: number; availability: number; price: number } = {
    location: 0.3,
    skill: 0.4,
    availability: 0.2,
    price: 0.1,
  }
): number {
  return (
    locationScore * weights.location +
    skillScore * weights.skill +
    availabilityScore * weights.availability +
    priceScore * weights.price
  );
}
