
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CompetitorAnalysisWidget } from '@/components/market-conquest';
import { AlertTriangle, Users, Target, BarChart3, Plus, TrendingUp, TrendingDown } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  type: string;
  threatLevel: string;
  estimatedRevenue?: number;
  employeeCount?: number;
  serviceAreas: string[];
  jobsWonAgainst: number;
  jobsLostTo: number;
  averageBidGap?: number;
  competitorAnalysis: Array<{
    analysisType: string;
    findings: any;
    recommendations: string[];
    createdAt: string;
  }>;
}

interface CompetitiveDashboard {
  totalCompetitors: number;
  threatDistribution: Record<string, number>;
  overallWinRate: number;
  totalJobsCompeted: number;
  majorThreats: Competitor[];
  marketShare: {
    estimatedTotal: number;
    averageEmployees: number;
  };
}

export default function CompetitorIntelligence() {
  const [dashboard, setDashboard] = useState<CompetitiveDashboard | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboard();
    fetchCompetitors();
    initializeBucksCountyCompetitors();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/market-conquest/competitors/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching competitive dashboard:', error);
    }
  };

  const fetchCompetitors = async () => {
    try {
      const response = await fetch('/api/market-conquest/competitors/bucks-county');
      if (response.ok) {
        const data = await response.json();
        setCompetitors(data.competitors || []);
      }
    } catch (error) {
      console.error('Error fetching competitors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeBucksCountyCompetitors = async () => {
    try {
      const response = await fetch('/api/market-conquest/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Initialize Bucks County Competitors',
          type: 'SYSTEM',
        }),
      });

      if (response.ok) {
        // Refresh data after initialization
        fetchDashboard();
        fetchCompetitors();
      }
    } catch (error) {
      console.error('Error initializing competitors:', error);
    }
  };

  const handleAnalyzeCompetitor = async (competitorId: string) => {
    try {
      const response = await fetch('/api/market-conquest/competitors/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitorId,
          analysisType: 'Market_Analysis',
          findings: {
            analysisDate: new Date().toISOString(),
            marketPosition: 'Under review',
          },
          recommendations: [
            'Monitor pricing strategies',
            'Track service quality changes',
            'Analyze customer feedback',
          ],
        }),
      });

      if (response.ok) {
        toast({
          title: 'Analysis Started',
          description: 'Competitor analysis has been initiated',
        });
        fetchCompetitors();
      }
    } catch (error) {
      console.error('Error analyzing competitor:', error);
      toast({
        title: 'Error',
        description: 'Failed to start competitor analysis',
        variant: 'destructive',
      });
    }
  };

  const handleTrackOutcome = async (competitorId: string, outcome: 'won' | 'lost') => {
    try {
      const jobValue = Math.floor(Math.random() * 2000) + 500; // Simulate job value
      const ourBid = jobValue + Math.floor(Math.random() * 200) - 100; // Simulate our bid
      const theirBid = outcome === 'won' ? ourBid + 50 : ourBid - 50; // Simulate their bid

      const response = await fetch('/api/market-conquest/competitors/track-outcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitorId,
          outcome,
          jobValue,
          ourBid,
          theirBid,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Outcome Tracked',
          description: `Job ${outcome} against competitor has been recorded`,
        });
        fetchDashboard();
        fetchCompetitors();
      }
    } catch (error) {
      console.error('Error tracking outcome:', error);
      toast({
        title: 'Error',
        description: 'Failed to track job outcome',
        variant: 'destructive',
      });
    }
  };

  const handlePricingAnalysis = async (competitorId: string) => {
    try {
      const serviceType = 'Tree Removal';
      const ourPrice = 800; // Example price

      const response = await fetch('/api/market-conquest/competitors/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitorId,
          serviceType,
          ourPrice,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Pricing Analysis Complete',
          description: `Analysis findings: ${data.findings?.competitive ? 'Competitive pricing' : 'Price gap identified'}`,
        });
      }
    } catch (error) {
      console.error('Error analyzing pricing:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze pricing',
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

  return (
    <div className="space-y-6">
      {/* Major Bucks County Competitors */}
      <Card className="border-l-4 border-l-red-500 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Bucks County Competitive Landscape</h3>
              <p className="text-muted-foreground mb-4">
                Key competitors identified in our target market. Focus on displacing these players 
                through superior service, technology, and competitive pricing.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-red-700">Tier 1 Threats:</span>
                  <p className="text-muted-foreground">Rick's Expert Tree Service, Monster Tree Service</p>
                </div>
                <div>
                  <span className="font-medium text-orange-700">Tier 2 Threats:</span>
                  <p className="text-muted-foreground">Advanced Tree Care, ATS Tree Services</p>
                </div>
                <div>
                  <span className="font-medium text-yellow-700">Regional Players:</span>
                  <p className="text-muted-foreground">Bartlett, SavATree, Davey Tree</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Competitive Intelligence Dashboard</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handlePricingAnalysis(competitors[0]?.id)}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Pricing Analysis
          </Button>
          <Button onClick={initializeBucksCountyCompetitors}>
            <Plus className="w-4 h-4 mr-2" />
            Add Competitor
          </Button>
        </div>
      </div>

      {/* Main Competitor Analysis Widget */}
      <CompetitorAnalysisWidget
        dashboard={dashboard}
        competitors={competitors}
        isLoading={isLoading}
        onAnalyzeCompetitor={handleAnalyzeCompetitor}
        onTrackOutcome={handleTrackOutcome}
      />

      {/* Competitive Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Competitive Strategy Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Our Competitive Advantages</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">AI-powered platform and analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Professional tier system and territory protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm">Insurance and property management partnerships</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-sm">Technology-enabled customer experience</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Market Displacement Strategy</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Recruit top professionals from competitors</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm">Undercut pricing while maintaining quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Target their major property management clients</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Superior emergency response times</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Win/Loss Tracking */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{dashboard.overallWinRate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Overall Win Rate</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Jobs Competed</span>
                    <span className="font-medium">{dashboard.totalJobsCompeted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Major Threats</span>
                    <span className="font-medium text-red-600">{dashboard.majorThreats.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Market Share Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Estimated Total Market</span>
                    <span className="font-medium">{formatCurrency(dashboard.marketShare.estimatedTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Competitor Size</span>
                    <span className="font-medium">{dashboard.marketShare.averageEmployees.toFixed(0)} employees</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Our Target Share</span>
                    <span className="font-medium text-primary">25-30%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

