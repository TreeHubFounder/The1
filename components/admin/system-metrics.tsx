
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Database, 
  Wifi, 
  Clock, 
  Users, 
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface SystemMetricsProps {
  data: any;
}

export default function SystemMetrics({ data }: SystemMetricsProps) {
  const [systemStats, setSystemStats] = useState<any>(null);

  useEffect(() => {
    loadSystemStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSystemStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemStats = async () => {
    // In a real implementation, this would fetch actual system metrics
    // For now, we'll simulate some data
    setSystemStats({
      server: {
        status: 'healthy',
        uptime: '99.9%',
        cpuUsage: 23,
        memoryUsage: 67,
        diskUsage: 45,
      },
      database: {
        status: 'healthy',
        connections: 47,
        maxConnections: 100,
        queryTime: 12, // ms
        cacheHitRate: 94,
      },
      api: {
        status: 'healthy',
        requestsPerMinute: 156,
        averageResponseTime: 89, // ms
        errorRate: 0.2, // %
      },
      ai: {
        status: 'active',
        activeAgents: 4,
        totalExecutions: 1247,
        successRate: 97.8,
      },
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'healthy': 'bg-green-100 text-green-800',
      'active': 'bg-blue-100 text-blue-800',
      'warning': 'bg-yellow-100 text-yellow-800',
      'error': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'text-green-600';
    if (usage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Server className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Server Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-green-600">Healthy</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Database</p>
                <div className="flex items-center space-x-2 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-green-600">Online</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wifi className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">API Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-green-600">Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Agents</p>
                <div className="flex items-center space-x-2 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-green-600">Running</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      {systemStats && (
        <>
          {/* Server Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Server Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CPU Usage</span>
                    <span className={`text-sm font-medium ${getUsageColor(systemStats.server.cpuUsage)}`}>
                      {systemStats.server.cpuUsage}%
                    </span>
                  </div>
                  <Progress value={systemStats.server.cpuUsage} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className={`text-sm font-medium ${getUsageColor(systemStats.server.memoryUsage)}`}>
                      {systemStats.server.memoryUsage}%
                    </span>
                  </div>
                  <Progress value={systemStats.server.memoryUsage} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Disk Usage</span>
                    <span className={`text-sm font-medium ${getUsageColor(systemStats.server.diskUsage)}`}>
                      {systemStats.server.diskUsage}%
                    </span>
                  </div>
                  <Progress value={systemStats.server.diskUsage} className="h-2" />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Uptime</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {systemStats.server.uptime}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(systemStats.server.status)}>
                      {systemStats.server.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    All systems operational
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Database Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Active Connections</p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {systemStats.database.connections}/{systemStats.database.maxConnections}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Query Time</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {systemStats.database.queryTime}ms
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    {systemStats.database.cacheHitRate}%
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(systemStats.database.status)}>
                      {systemStats.database.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Database online
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="h-5 w-5" />
                <span>API Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Requests/Min</p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {systemStats.api.requestsPerMinute}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Response Time</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {systemStats.api.averageResponseTime}ms
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Error Rate</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-2">
                    {systemStats.api.errorRate}%
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(systemStats.api.status)}>
                      {systemStats.api.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    All endpoints active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI System Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>AI System Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Active Agents</p>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    {systemStats.ai.activeAgents}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Total Executions</p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {systemStats.ai.totalExecutions}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Success Rate</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {systemStats.ai.successRate}%
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(systemStats.ai.status)}>
                      {systemStats.ai.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    All agents operational
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
