
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { TierPerformanceChart } from '@/components/market-conquest';
import { Award, TrendingUp, Users, Target, Crown } from 'lucide-react';

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

interface DashboardData {
  currentTier: string;
  tierStatus: string;
  monthsInTier: number;
  tierPoints: number;
  benefits: {
    territoryProtection: boolean;
    exclusiveZipCodes: string[];
    commissionBonus: number;
    priorityAlerts: boolean;
    advancedAnalytics: boolean;
  };
  performance: {
    monthlyJobs: number;
    monthlyRevenue: number;
    averageRating: number;
    customerComplaints: number;
  };
  advancement: {
    eligible: boolean;
    nextTier?: string;
    requirements?: any;
  } | null;
  achievements: string[];
}

export default function TierManagement() {
  const [analytics, setAnalytics] = useState<TierAnalytics | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
    fetchDashboard();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/market-conquest/tiers');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching tier analytics:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/market-conquest/tiers/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching tier dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMetrics = async () => {
    try {
      const response = await fetch('/api/market-conquest/tiers/update-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Performance metrics updated successfully',
        });
        fetchAnalytics();
        fetchDashboard();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update metrics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to update metrics',
        variant: 'destructive',
      });
    }
  };

  const handlePromote = async () => {
    try {
      const response = await fetch('/api/market-conquest/tiers/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Congratulations!',
          description: `Successfully promoted to ${data.newTier} tier!`,
        });
        fetchAnalytics();
        fetchDashboard();
      } else {
        const error = await response.json();
        toast({
          title: 'Promotion Failed',
          description: error.error || 'Not eligible for promotion',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error promoting professional:', error);
      toast({
        title: 'Error',
        description: 'Failed to process promotion',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return 'text-orange-600 bg-orange-100';
      case 'SILVER': return 'text-gray-600 bg-gray-100';
      case 'GOLD': return 'text-yellow-600 bg-yellow-100';
      case 'PLATINUM': return 'text-blue-600 bg-blue-100';
      case 'ELITE': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Dashboard (for professionals) */}
      {dashboard && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-6 h-6" />
                My Tier Status
              </CardTitle>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(dashboard.currentTier)}`}>
                {dashboard.currentTier} TIER
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Performance */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{dashboard.performance.monthlyJobs}</p>
                <p className="text-sm text-muted-foreground">Monthly Jobs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{formatCurrency(dashboard.performance.monthlyRevenue)}</p>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{dashboard.performance.averageRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{dashboard.tierPoints}</p>
                <p className="text-sm text-muted-foreground">Tier Points</p>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h4 className="font-medium mb-3">Current Benefits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${dashboard.benefits.territoryProtection ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">Territory Protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${dashboard.benefits.priorityAlerts ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">Priority Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${dashboard.benefits.advancedAnalytics ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">Advanced Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${dashboard.benefits.commissionBonus > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">Commission Bonus: {dashboard.benefits.commissionBonus}%</span>
                </div>
              </div>
            </div>

            {/* Advancement */}
            {dashboard.advancement && (
              <div className="p-4 rounded-lg border bg-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Tier Advancement</h4>
                    {dashboard.advancement.eligible ? (
                      <p className="text-sm text-green-600">Eligible for promotion to {dashboard.advancement.nextTier}!</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Keep up the great work to advance</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleUpdateMetrics}>
                      Update Metrics
                    </Button>
                    {dashboard.advancement.eligible && (
                      <Button onClick={handlePromote}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Request Promotion
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Achievements */}
            {dashboard.achievements.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Achievements</h4>
                <div className="flex flex-wrap gap-2">
                  {dashboard.achievements.map((achievement, index) => (
                    <div key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      {achievement.replace('_', ' ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analytics Overview */}
      {analytics && (
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
                  <p className="text-sm text-muted-foreground">Promotion Eligible</p>
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
                  <p className="text-2xl font-bold">{formatCurrency(analytics.averageMetrics.averageMonthlyRevenue)}</p>
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
      )}

      {/* Tier Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Tier Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TierPerformanceChart analytics={analytics} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Tier Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Advancement Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { tier: 'BRONZE', jobs: 1, revenue: 500, rating: 3.0, complaints: 0.3 },
                { tier: 'SILVER', jobs: 3, revenue: 1500, rating: 3.5, complaints: 0.2 },
                { tier: 'GOLD', jobs: 8, revenue: 5000, rating: 4.0, complaints: 0.15 },
                { tier: 'PLATINUM', jobs: 15, revenue: 12000, rating: 4.3, complaints: 0.1 },
                { tier: 'ELITE', jobs: 25, revenue: 25000, rating: 4.7, complaints: 0.05 },
              ].map((req) => (
                <div key={req.tier} className={`p-4 rounded-lg border ${getTierColor(req.tier)}`}>
                  <h4 className="font-medium mb-2">{req.tier}</h4>
                  <div className="space-y-1 text-xs">
                    <p>Min Jobs: {req.jobs}/month</p>
                    <p>Min Revenue: ${req.revenue.toLocaleString()}/month</p>
                    <p>Min Rating: {req.rating}</p>
                    <p>Max Complaints: {(req.complaints * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading tier data...</p>
        </div>
      )}
    </div>
  );
}
