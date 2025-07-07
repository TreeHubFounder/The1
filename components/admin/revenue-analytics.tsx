
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Users,
  Target
} from 'lucide-react';

interface RevenueAnalyticsProps {
  data: any;
}

export default function RevenueAnalytics({ data }: RevenueAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [projections, setProjections] = useState<any>(null);
  const [roiData, setRoiData] = useState<any>(null);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadAnalyticsData();
  }, [period]);

  const loadAnalyticsData = async () => {
    try {
      const [analyticsRes, projectionsRes, roiRes] = await Promise.all([
        fetch(`/api/revenue/analytics?period=${period}`),
        fetch('/api/revenue/projections'),
        fetch('/api/revenue/roi'),
      ]);

      const [analytics, projections, roi] = await Promise.all([
        analyticsRes.json(),
        projectionsRes.json(),
        roiRes.json(),
      ]);

      setAnalyticsData(analytics.data);
      setProjections(projections.data);
      setRoiData(roi.data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Time Period:</span>
        <div className="flex space-x-2">
          {['monthly', 'yearly'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p as 'monthly' | 'yearly')}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analyticsData?.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  +{projections?.growthRate || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI ROI</p>
                <p className="text-2xl font-bold text-gray-900">
                  {roiData?.overallROI || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Annual Projection</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(projections?.annualProjection || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData?.revenueByCategory?.map((category: any) => (
              <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div>
                    <h4 className="font-medium">{category.category.replace('_', ' ')}</h4>
                    <p className="text-sm text-gray-600">{category.transactions} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(category.revenue)}</p>
                  <p className="text-sm text-gray-600">
                    {((category.revenue / (analyticsData?.totalRevenue || 1)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>AI Agent Revenue Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData?.revenueByAgent?.map((agent: any) => (
              <div key={agent.agentId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge className="px-3 py-1">{agent.agentType}</Badge>
                  <div>
                    <h4 className="font-medium">{agent.agentName}</h4>
                    <p className="text-sm text-gray-600">AI Agent Performance</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(agent.revenue)}</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (agent.revenue / (analyticsData?.totalRevenue || 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {((agent.revenue / (analyticsData?.totalRevenue || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Projections */}
      <Card>
        <CardHeader>
          <CardTitle>12-Month Revenue Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Current Month</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(projections?.currentMonthRevenue || 0)}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">Annual Projection</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(projections?.annualProjection || 0)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-800">Growth Rate</p>
                <p className="text-2xl font-bold text-purple-900">
                  +{projections?.growthRate || 0}%
                </p>
              </div>
            </div>

            {projections?.projections && (
              <div className="mt-6">
                <h4 className="font-medium mb-4">Monthly Projections</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {projections.projections.slice(0, 6).map((projection: any) => (
                    <div key={projection.month} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{projection.month}</span>
                        <Badge variant="outline">
                          {Math.round(projection.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="font-bold text-lg">
                        {formatCurrency(projection.projectedRevenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {analyticsData?.performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {analyticsData.performanceMetrics.leadConversionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Lead Conversion Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {analyticsData.performanceMetrics.jobCompletionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Job Completion Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {analyticsData.performanceMetrics.totalLeads}
                </p>
                <p className="text-sm text-gray-600">Total Leads</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {analyticsData.performanceMetrics.convertedLeads}
                </p>
                <p className="text-sm text-gray-600">Converted Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
