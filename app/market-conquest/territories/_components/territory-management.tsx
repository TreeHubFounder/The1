
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { TerritoryMap } from '@/components/market-conquest';
import { Shield, MapPin, Users, DollarSign, Plus } from 'lucide-react';

interface Territory {
  id: string;
  name: string;
  zipCode?: string;
  status: string;
  isProtected: boolean;
  opportunityScore?: number;
  medianIncome?: number;
  households?: number;
  totalRevenue: number;
  territoryAssignments: Array<{
    professional: {
      firstName: string;
      lastName: string;
      companyName?: string;
    };
  }>;
}

interface TerritoryAnalytics {
  totalTerritories: number;
  protectedTerritories: number;
  totalRevenue: number;
  averageOpportunityScore: number;
  topPerformingTerritories: Territory[];
  tierDistribution: {
    gold: number;
    platinum: number;
    elite: number;
  };
}

export default function TerritoryManagement() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [analytics, setAnalytics] = useState<TerritoryAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTerritories();
    fetchAnalytics();
  }, []);

  const fetchTerritories = async () => {
    try {
      const response = await fetch('/api/market-conquest/territories/bucks-county');
      if (response.ok) {
        const data = await response.json();
        setTerritories(data.territories || []);
      }
    } catch (error) {
      console.error('Error fetching territories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load territories',
        variant: 'destructive',
      });
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/market-conquest/territories/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProtectTerritory = async (territoryId: string) => {
    try {
      const response = await fetch('/api/market-conquest/territories/protect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ territoryId }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Territory protection activated',
        });
        fetchTerritories();
        fetchAnalytics();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to protect territory',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error protecting territory:', error);
      toast({
        title: 'Error',
        description: 'Failed to protect territory',
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
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Territories</p>
                  <p className="text-2xl font-bold">{analytics.totalTerritories}</p>
                </div>
                <MapPin className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Protected</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.protectedTerritories}</p>
                </div>
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Opportunity</p>
                  <p className="text-2xl font-bold">{analytics.averageOpportunityScore.toFixed(0)}/100</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Professional Tier Distribution */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Professional Tier Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-2xl font-bold text-yellow-600">{analytics.tierDistribution.gold}</p>
                <p className="text-sm text-yellow-700">Gold Tier</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-2xl font-bold text-gray-600">{analytics.tierDistribution.platinum}</p>
                <p className="text-sm text-gray-700">Platinum Tier</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                <p className="text-2xl font-bold text-purple-600">{analytics.tierDistribution.elite}</p>
                <p className="text-sm text-purple-700">Elite Tier</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Territory Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Bucks County Territory Map
            </CardTitle>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Territory
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TerritoryMap
            territories={territories}
            onProtectTerritory={handleProtectTerritory}
            showControls={true}
          />
        </CardContent>
      </Card>

      {/* Top Performing Territories */}
      {analytics?.topPerformingTerritories && analytics.topPerformingTerritories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Top Performing Territories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformingTerritories.slice(0, 5).map((territory, index) => (
                <div key={territory.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{territory.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {territory.zipCode && `ZIP: ${territory.zipCode}`}
                        {territory.opportunityScore && ` • Score: ${territory.opportunityScore}/100`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(territory.totalRevenue)}</p>
                      <p className="text-sm text-muted-foreground">
                        {territory.territoryAssignments.length} professionals
                      </p>
                    </div>
                    {territory.isProtected && (
                      <Shield className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading territory data...</p>
        </div>
      )}
    </div>
  );
}
