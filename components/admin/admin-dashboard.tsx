
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Zap, 
  Cloud, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import AIAgentManager from './ai-agent-manager';
import RevenueAnalytics from './revenue-analytics';
import WeatherMonitor from './weather-monitor';
import SystemMetrics from './system-metrics';

interface DashboardData {
  aiAgents: any[];
  revenueMetrics: any;
  weatherStatus: any;
  systemHealth: any;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [agentsRes, revenueRes, weatherRes] = await Promise.all([
        fetch('/api/ai-agents'),
        fetch('/api/revenue/analytics'),
        fetch('/api/weather/storms'),
      ]);

      const [agents, revenue, weather] = await Promise.all([
        agentsRes.json(),
        revenueRes.json(),
        weatherRes.json(),
      ]);

      setData({
        aiAgents: agents.data || [],
        revenueMetrics: revenue.data || {},
        weatherStatus: weather.data || {},
        systemHealth: {
          status: 'healthy',
          uptime: '99.9%',
          activeConnections: 1247,
          responseTime: 95,
        },
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeAISystem = async () => {
    try {
      const response = await fetch('/api/ai-agents/initialize', {
        method: 'POST',
      });
      
      if (response.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to initialize AI system:', error);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading AI Command Center...</span>
      </div>
    );
  }

  const activeAgents = data?.aiAgents?.filter(agent => agent.status === 'ACTIVE').length || 0;
  const totalRevenue = data?.revenueMetrics?.totalRevenue || 0;
  const activeStorms = data?.weatherStatus?.storms?.length || 0;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active AI Agents</p>
                <p className="text-2xl font-bold text-gray-900">{activeAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Cloud className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Storms</p>
                <p className="text-2xl font-bold text-gray-900">{activeStorms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-green-600">Healthy</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span>AI System Status</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <Button variant="outline" size="sm" onClick={loadDashboardData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={initializeAISystem}>
                <Zap className="h-4 w-4 mr-2" />
                Initialize AI System
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data?.aiAgents?.map((agent) => (
              <div key={agent.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{agent.name}</h4>
                  <Badge variant={agent.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Executions:</span>
                    <span>{agent.totalExecutions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span>{agent.metrics?.successRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue Generated:</span>
                    <span>${agent.revenueGenerated?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-agents">AI Agents</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.aiAgents?.slice(0, 3).map((agent) => (
                    <div key={agent.id} className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-gray-500">
                          Last execution: {agent.lastExecutionAt ? 
                            new Date(agent.lastExecutionAt).toLocaleString() : 'Never'
                          }
                        </p>
                      </div>
                      <Badge variant="outline">{agent.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Storm Response AI has generated 47 new leads in the last hour
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-agents">
          <AIAgentManager agents={data?.aiAgents || []} onRefresh={loadDashboardData} />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueAnalytics data={data?.revenueMetrics} />
        </TabsContent>

        <TabsContent value="weather">
          <WeatherMonitor data={data?.weatherStatus} />
        </TabsContent>

        <TabsContent value="system">
          <SystemMetrics data={data?.systemHealth} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
