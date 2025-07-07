
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Target, 
  Users, 
  Building,
  Shield,
  DollarSign,
  MapPin,
  BarChart3,
  Calendar,
  Crown,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import {
  TerritoryMap,
  TierPerformanceChart,
  CompetitorAnalysisWidget,
  RevenueProjectionChart,
  PartnershipTracker,
  ExecutionTimeline,
  PropertyManagementDashboard
} from '@/components/market-conquest';

interface ConquestOverview {
  overview: {
    currentPhase: string;
    targetRevenue: string;
    ipoReadinessScore: number;
    nextMilestone: string;
  };
  keyMetrics: {
    monthlyRevenue: number;
    activeProfessionals: number;
    protectedTerritories: number;
    activePartnerships: number;
    competitiveWinRate: number;
  };
  expansionReadiness: {
    score: number;
    nextMarkets: string[];
    franchiseInquiries: number;
    systemsReadiness: number;
  };
}

export default function MarketConquestDashboard() {
  const [overview, setOverview] = useState<ConquestOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/market-conquest/overview');
      if (response.ok) {
        const data = await response.json();
        setOverview(data.overview?.conquest);
      }
    } catch (error) {
      console.error('Error fetching conquest overview:', error);
    } finally {
      setIsLoading(false);
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Strategic Overview */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Current Phase</p>
                  <p className="text-2xl font-bold">{overview.overview.currentPhase}</p>
                </div>
                <Target className="w-12 h-12 text-blue-200" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-blue-100">Target: {overview.overview.targetRevenue}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">IPO Readiness</p>
                  <p className="text-2xl font-bold">{overview.overview.ipoReadinessScore}/100</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-200" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-green-400 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${overview.overview.ipoReadinessScore}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Monthly Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(overview.keyMetrics.monthlyRevenue)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-purple-200" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-purple-100">Target: $78K - $93K</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Expansion Score</p>
                  <p className="text-2xl font-bold">{overview.expansionReadiness.score}/100</p>
                </div>
                <Crown className="w-12 h-12 text-orange-200" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-orange-100">Next: {overview.expansionReadiness.nextMarkets[0]}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key Metrics Overview */}
      {overview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Conquest Metrics Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{overview.keyMetrics.activeProfessionals}</p>
                <p className="text-sm text-muted-foreground">Active Professionals</p>
                <p className="text-xs text-blue-600 mt-1">Target: 75-100</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-green-100">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{overview.keyMetrics.protectedTerritories}</p>
                <p className="text-sm text-muted-foreground">Protected Territories</p>
                <p className="text-xs text-green-600 mt-1">First 25 Elite</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-purple-100">
                  <Building className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{overview.keyMetrics.activePartnerships}</p>
                <p className="text-sm text-muted-foreground">Active Partnerships</p>
                <p className="text-xs text-purple-600 mt-1">Insurance + PM</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-orange-100">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold">{overview.keyMetrics.competitiveWinRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Competitive Win Rate</p>
                <p className="text-xs text-orange-600 mt-1">vs Major Players</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-red-100">
                  <Zap className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-2xl font-bold">{overview.expansionReadiness.franchiseInquiries}</p>
                <p className="text-sm text-muted-foreground">Franchise Inquiries</p>
                <p className="text-xs text-red-600 mt-1">Scaling Prep</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/market-conquest/territories">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <MapPin className="w-6 h-6" />
                <span>Territory Management</span>
              </Button>
            </Link>
            
            <Link href="/market-conquest/tiers">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Crown className="w-6 h-6" />
                <span>Professional Tiers</span>
              </Button>
            </Link>
            
            <Link href="/market-conquest/partnerships">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Building className="w-6 h-6" />
                <span>Partnerships</span>
              </Button>
            </Link>
            
            <Link href="/market-conquest/analytics">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <BarChart3 className="w-6 h-6" />
                <span>Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Next Milestone */}
      {overview && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Next Critical Milestone</h3>
                <p className="text-muted-foreground">{overview.overview.nextMilestone}</p>
                <Link href="/market-conquest/execution">
                  <Button variant="link" className="p-0 mt-2">
                    View Execution Timeline →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="territories">Territories</TabsTrigger>
          <TabsTrigger value="competition">Competition</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bucks County Penetration</CardTitle>
              </CardHeader>
              <CardContent>
                <TerritoryMap showControls={false} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <TierPerformanceChart />
              </CardContent>
            </Card>
          </div>

          <ExecutionTimeline />
        </TabsContent>

        <TabsContent value="territories" className="space-y-6">
          <TerritoryMap />
        </TabsContent>

        <TabsContent value="competition" className="space-y-6">
          <CompetitorAnalysisWidget />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueProjectionChart />
        </TabsContent>
      </Tabs>

      {/* Expansion Readiness */}
      {overview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-600" />
              Expansion Readiness Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Overall Readiness</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Expansion Score</span>
                    <span className={`font-medium ${getScoreColor(overview.expansionReadiness.score)}`}>
                      {overview.expansionReadiness.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${overview.expansionReadiness.score}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Systems Readiness</span>
                    <span className={`font-medium ${getScoreColor(overview.expansionReadiness.systemsReadiness)}`}>
                      {overview.expansionReadiness.systemsReadiness}/100
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${overview.expansionReadiness.systemsReadiness}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Next Markets</h4>
                <div className="space-y-2">
                  {overview.expansionReadiness.nextMarkets.map((market, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">{market}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Franchise Development</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Franchise Inquiries</span>
                    <Badge variant="outline">{overview.expansionReadiness.franchiseInquiries}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Preparation phase for national franchise model
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
