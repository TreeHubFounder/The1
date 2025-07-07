
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { RevenueProjectionChart } from '@/components/market-conquest';
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  BarChart3,
  Crown,
  Users,
  MapPin,
  Zap
} from 'lucide-react';

interface RevenueProjection {
  timeframe: string;
  baseRevenue: number;
  stormSurgeMultiplier: number;
  projectedRevenue: number;
  confidenceLevel: number;
  assumptions: string[];
}

interface MarketPenetration {
  totalTerritories: number;
  assignedTerritories: number;
  protectedTerritories: number;
  penetrationRate: number;
  protectionRate: number;
  tierDistribution: Record<string, number>;
  totalRevenue: number;
  averageRevenuePerTerritory: number;
  averageOpportunityScore: number;
  marketValue: number;
}

interface RecruitmentAnalytics {
  total: number;
  thisMonth: number;
  lastThreeMonths: number;
  tierDistribution: Record<string, number>;
  bucksCountyPros: number;
  averageMonthlyRevenue: number;
  targetProgress: {
    target75: number;
    target100: number;
  };
}

export default function ConquestAnalytics() {
  const [projections, setProjections] = useState<RevenueProjection[]>([]);
  const [penetration, setPenetration] = useState<MarketPenetration | null>(null);
  const [recruitment, setRecruitment] = useState<RecruitmentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      const [projectionsRes, penetrationRes, recruitmentRes] = await Promise.all([
        fetch('/api/market-conquest/analytics/revenue-projections'),
        fetch('/api/market-conquest/analytics/penetration'),
        fetch('/api/market-conquest/analytics/recruitment'),
      ]);

      if (projectionsRes.ok) {
        const data = await projectionsRes.json();
        setProjections(data.projections || []);
      }

      if (penetrationRes.ok) {
        const data = await penetrationRes.json();
        setPenetration(data.analysis);
      }

      if (recruitmentRes.ok) {
        const data = await recruitmentRes.json();
        setRecruitment(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMonthlyMetrics = async () => {
    try {
      const response = await fetch('/api/market-conquest/analytics/update-monthly', {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Monthly metrics updated successfully',
        });
        fetchAllAnalytics();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update metrics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating monthly metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to update metrics',
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

  const getIpoReadinessScore = () => {
    if (!projections.length || !penetration || !recruitment) return 0;

    const revenueScore = Math.min((projections[0]?.projectedRevenue || 0) / 1000000, 1) * 25;
    const penetrationScore = (penetration.penetrationRate || 0) / 100 * 20;
    const professionalsScore = Math.min((recruitment.total || 0) / 100, 1) * 20;
    const marketScore = Math.min((penetration.averageOpportunityScore || 0) / 100, 1) * 15;
    const revenuePerTerritoryScore = Math.min((penetration.averageRevenuePerTerritory || 0) / 10000, 1) * 20;

    return Math.round(revenueScore + penetrationScore + professionalsScore + marketScore + revenuePerTerritoryScore);
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">IPO Readiness Score</p>
                <p className="text-2xl font-bold">{getIpoReadinessScore()}/100</p>
              </div>
              <Crown className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Projected Annual Revenue</p>
                <p className="text-2xl font-bold">
                  {projections.length > 0 ? formatCurrency(projections[0].projectedRevenue) : '$0'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Market Penetration</p>
                <p className="text-2xl font-bold">
                  {penetration ? `${penetration.penetrationRate.toFixed(1)}%` : '0%'}
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
                <p className="text-sm text-muted-foreground">Active Professionals</p>
                <p className="text-2xl font-bold">{recruitment?.total || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Detailed Analytics</h2>
        <Button onClick={handleUpdateMonthlyMetrics}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Update Monthly Metrics
        </Button>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Projections</TabsTrigger>
          <TabsTrigger value="penetration">Market Penetration</TabsTrigger>
          <TabsTrigger value="recruitment">Professional Growth</TabsTrigger>
          <TabsTrigger value="readiness">IPO Readiness</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueProjectionChart projections={projections} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="penetration" className="space-y-6">
          {penetration && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Territory Coverage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Territories</span>
                        <span className="font-medium">{penetration.totalTerritories}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Assigned</span>
                        <span className="font-medium">{penetration.assignedTerritories}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Protected</span>
                        <span className="font-medium text-green-600">{penetration.protectedTerritories}</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Penetration Rate</span>
                        <span className="font-medium">{penetration.penetrationRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${penetration.penetrationRate}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Revenue Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Revenue</span>
                        <span className="font-medium">{formatCurrency(penetration.totalRevenue)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Avg per Territory</span>
                        <span className="font-medium">{formatCurrency(penetration.averageRevenuePerTerritory)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Market Value</span>
                        <span className="font-medium">{formatCurrency(penetration.marketValue)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Opportunity Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {penetration.averageOpportunityScore.toFixed(0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${penetration.averageOpportunityScore}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tier Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional Tier Distribution by Territory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(penetration.tierDistribution).map(([tier, count]) => (
                      <div key={tier} className="text-center p-4 rounded-lg border">
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-sm text-muted-foreground capitalize">{tier} Tier</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="recruitment" className="space-y-6">
          {recruitment && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{recruitment.total}</p>
                      <p className="text-sm text-muted-foreground">Total Professionals</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{recruitment.thisMonth}</p>
                      <p className="text-sm text-muted-foreground">Recruited This Month</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{recruitment.bucksCountyPros}</p>
                      <p className="text-sm text-muted-foreground">Bucks County Pros</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{formatCurrency(recruitment.averageMonthlyRevenue)}</p>
                      <p className="text-sm text-muted-foreground">Avg Monthly Revenue</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Target Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Progress to 75 Professionals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Current: {recruitment.total}</span>
                        <span>{recruitment.targetProgress.target75.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(recruitment.targetProgress.target75, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {75 - recruitment.total} more needed for target
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Progress to 100 Professionals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Current: {recruitment.total}</span>
                        <span>{recruitment.targetProgress.target100.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(recruitment.targetProgress.target100, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {100 - recruitment.total} more needed for scale target
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tier Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional Tier Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(recruitment.tierDistribution).map(([tier, count]) => (
                      <div key={tier} className="text-center p-4 rounded-lg border">
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-sm text-muted-foreground capitalize">{tier}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="readiness" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-600" />
                IPO Readiness Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-green-200 mb-4">
                    <span className="text-4xl font-bold text-green-600">{getIpoReadinessScore()}</span>
                  </div>
                  <h3 className="text-xl font-semibold">IPO Readiness Score</h3>
                  <p className="text-muted-foreground">Out of 100</p>
                </div>

                {/* Component Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Revenue Metrics (25 points)</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Annual Revenue Target</span>
                        <span className="font-medium">
                          {projections.length > 0 ? formatCurrency(projections[0].projectedRevenue) : '$0'}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ 
                            width: `${Math.min(((projections[0]?.projectedRevenue || 0) / 1000000) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Target: $1M+ annually</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Market Penetration (20 points)</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bucks County Coverage</span>
                        <span className="font-medium">
                          {penetration ? `${penetration.penetrationRate.toFixed(1)}%` : '0%'}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${penetration?.penetrationRate || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Target: 50%+ penetration</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Professional Network (20 points)</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Professionals</span>
                        <span className="font-medium">{recruitment?.total || 0}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${Math.min(((recruitment?.total || 0) / 100) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Target: 100 professionals</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">System Maturity (35 points)</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Platform Features</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full w-[85%]" />
                      </div>
                      <p className="text-xs text-muted-foreground">AI agents, partnerships, analytics complete</p>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Next Steps for IPO Readiness</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Scale to 100+ active professionals</li>
                    <li>• Achieve $1M+ annual revenue run rate</li>
                    <li>• Expand to Philadelphia and South Jersey markets</li>
                    <li>• Develop franchise model for national scaling</li>
                    <li>• Complete financial auditing and compliance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

