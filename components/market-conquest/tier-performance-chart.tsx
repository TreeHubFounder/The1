
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Award, Target, Users } from 'lucide-react';

// Dynamic import for recharts to avoid SSR issues
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });

interface TierAnalytics {
  totalProfessionals: number;
  tierDistribution: Record<string, number>;
  averageMetrics: {
    averageMonthlyJobs: number;
    averageMonthlyRevenue: number;
    averageRating: number;
  };
  topPerformers: Array<{
    professional: {
      firstName: string;
      lastName: string;
      companyName?: string;
    };
    currentTier: string;
    monthlyRevenue: number;
    monthlyJobsCompleted: number;
    averageRating: number;
  }>;
  promotionEligible: number;
}

interface TierPerformanceChartProps {
  analytics?: TierAnalytics;
  isLoading?: boolean;
}

const TIER_COLORS = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
  ELITE: '#800080',
};

const TIER_NAMES = {
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
  ELITE: 'Elite',
};

export default function TierPerformanceChart({ analytics, isLoading = false }: TierPerformanceChartProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No tier data available</h3>
          <p className="text-muted-foreground">
            Professional tier analytics will appear here once data is available.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const tierDistributionData = Object.entries(analytics.tierDistribution).map(([tier, count]) => ({
    name: TIER_NAMES[tier as keyof typeof TIER_NAMES] || tier,
    value: count,
    tier,
  }));

  const performanceData = [
    {
      metric: 'Avg Monthly Jobs',
      value: analytics.averageMetrics.averageMonthlyJobs,
      target: 15,
    },
    {
      metric: 'Avg Monthly Revenue',
      value: analytics.averageMetrics.averageMonthlyRevenue,
      target: 8000,
    },
    {
      metric: 'Avg Rating',
      value: analytics.averageMetrics.averageRating,
      target: 4.5,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Professionals</p>
                <p className="text-2xl font-bold">{analytics.totalProfessionals}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eligible for Promotion</p>
                <p className="text-2xl font-bold text-green-600">{analytics.promotionEligible}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Monthly Revenue</p>
                <p className="text-2xl font-bold">
                  ${analytics.averageMetrics.averageMonthlyRevenue.toLocaleString()}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{analytics.averageMetrics.averageRating.toFixed(1)}</p>
              </div>
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Tier Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tierDistributionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={TIER_COLORS[entry.tier as keyof typeof TIER_COLORS] || '#8884d8'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance vs Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <XAxis 
                    dataKey="metric" 
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#60B5FF" name="Current" />
                  <Bar dataKey="target" fill="#FF9149" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {analytics.topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformers.slice(0, 5).map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {performer.professional.firstName} {performer.professional.lastName}
                      </h4>
                      {performer.professional.companyName && (
                        <p className="text-sm text-muted-foreground">
                          {performer.professional.companyName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge 
                      style={{ 
                        backgroundColor: TIER_COLORS[performer.currentTier as keyof typeof TIER_COLORS],
                        color: 'white' 
                      }}
                    >
                      {TIER_NAMES[performer.currentTier as keyof typeof TIER_NAMES]}
                    </Badge>
                    <div className="text-right">
                      <p className="font-medium">${performer.monthlyRevenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {performer.monthlyJobsCompleted} jobs | ★{performer.averageRating.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
