
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Settings, 
  TrendingUp, 
  Activity,
  Clock,
  DollarSign
} from 'lucide-react';

interface AIAgentManagerProps {
  agents: any[];
  onRefresh: () => void;
}

export default function AIAgentManager({ agents, onRefresh }: AIAgentManagerProps) {
  const [executing, setExecuting] = useState<string | null>(null);

  const executeAgent = async (agentId: string, agentType: string) => {
    try {
      setExecuting(agentId);
      
      const response = await fetch('/api/ai-agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          inputData: getTestData(agentType),
        }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to execute agent:', error);
    } finally {
      setExecuting(null);
    }
  };

  const executeAllAgentsByType = async (agentType: string) => {
    try {
      const response = await fetch('/api/ai-agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType,
          inputData: getTestData(agentType),
        }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to execute agents:', error);
    }
  };

  const getTestData = (agentType: string) => {
    switch (agentType) {
      case 'STORM_RESPONSE':
        return { stormEventId: 'test-storm', immediateResponse: true };
      case 'JOB_MATCHING':
        return { jobId: 'test-job', maxMatches: 10 };
      case 'EQUIPMENT_INTELLIGENCE':
        return { analysisType: 'full' };
      default:
        return {};
    }
  };

  const getAgentTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'STORM_RESPONSE': 'bg-red-100 text-red-800',
      'JOB_MATCHING': 'bg-blue-100 text-blue-800',
      'EQUIPMENT_INTELLIGENCE': 'bg-green-100 text-green-800',
      'WEATHER_MONITOR': 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const agentsByType = agents.reduce((acc: any, agent) => {
    if (!acc[agent.type]) acc[agent.type] = [];
    acc[agent.type].push(agent);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>AI Agent Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => executeAllAgentsByType('STORM_RESPONSE')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <div className="p-2 bg-red-100 rounded-full">
                <Activity className="h-6 w-6 text-red-600" />
              </div>
              <span>Execute Storm Response</span>
            </Button>
            
            <Button 
              onClick={() => executeAllAgentsByType('JOB_MATCHING')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <div className="p-2 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <span>Run Job Matching</span>
            </Button>
            
            <Button 
              onClick={() => executeAllAgentsByType('EQUIPMENT_INTELLIGENCE')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <div className="p-2 bg-green-100 rounded-full">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <span>Analyze Equipment</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agent Groups */}
      {Object.entries(agentsByType).map(([type, typeAgents]: [string, any]) => (
        <Card key={type}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Badge className={getAgentTypeColor(type)}>{type.replace('_', ' ')}</Badge>
                <span>({typeAgents.length} agents)</span>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => executeAllAgentsByType(type)}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {typeAgents.map((agent: any) => (
                <div key={agent.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{agent.name}</h4>
                      <p className="text-sm text-gray-600">Version {agent.version}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={agent.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {agent.status}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => executeAgent(agent.id, agent.type)}
                        disabled={executing === agent.id}
                      >
                        {executing === agent.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Executions:</span>
                        <span className="font-medium">{agent.totalExecutions}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium">
                          {agent.totalExecutions > 0 
                            ? Math.round((agent.successfulExecutions / agent.totalExecutions) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium">
                          ${agent.revenueGenerated?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Avg Time:</span>
                        <span className="font-medium">
                          {agent.averageResponseTime || 0}ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {agent.agentLogs && agent.agentLogs.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="text-sm font-medium mb-2">Recent Activity</h5>
                      <div className="space-y-1">
                        {agent.agentLogs.slice(0, 3).map((log: any) => (
                          <div key={log.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                            <Badge 
                              variant={log.status === 'success' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {log.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {agents.length === 0 && (
        <Alert>
          <AlertDescription>
            No AI agents found. Click "Initialize AI System" to create the default agents.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
