
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PartnershipTracker } from '@/components/market-conquest';
import { Handshake, Building, Shield, DollarSign, Users } from 'lucide-react';

interface Partnership {
  id: string;
  partnerName: string;
  partnerType: string;
  status: string;
  partnershipLevel?: string;
  relationshipScore?: number;
  leadsGenerated: number;
  revenueGenerated: number;
  contractStartDate?: string;
  contractEndDate?: string;
  partnershipActivities: Array<{
    activityType: string;
    description: string;
    activityDate: string;
    leadsGenerated: number;
    revenueImpact: number;
  }>;
}

interface PartnershipDashboard {
  totalPartnerships: number;
  activePartnerships: number;
  totalRevenue: number;
  totalLeads: number;
  averageRelationshipScore: number;
  byType: Record<string, number>;
  topPerformers: Partnership[];
  recentActivity: Array<{
    partnerName: string;
    activityType: string;
    description: string;
    activityDate: string;
  }>;
  monthlyMetrics: {
    newPartnerships: number;
    activeContracts: number;
    renewalsDue: number;
  };
}

export default function PartnershipManagement() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [dashboard, setDashboard] = useState<PartnershipDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPartnerships();
    fetchDashboard();
  }, []);

  const fetchPartnerships = async () => {
    try {
      const response = await fetch('/api/market-conquest/partnerships');
      if (response.ok) {
        const data = await response.json();
        setPartnerships(data.partnerships || []);
      }
    } catch (error) {
      console.error('Error fetching partnerships:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/market-conquest/partnerships/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching partnership dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePartnership = () => {
    toast({
      title: 'Feature Coming Soon',
      description: 'Partnership creation form will be available soon',
    });
  };

  const handleViewPartnership = (partnershipId: string) => {
    toast({
      title: 'Partnership Details',
      description: `Viewing details for partnership ${partnershipId}`,
    });
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
      {/* Strategic Partnership Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Insurance Partnerships</h3>
                <p className="text-sm text-muted-foreground">
                  Emergency referrals from major insurance companies
                </p>
                <Button variant="link" className="p-0 mt-2 h-auto">
                  View Insurance Partners →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Building className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Property Management</h3>
                <p className="text-sm text-muted-foreground">
                  Bulk contracts with property management companies
                </p>
                <Button variant="link" className="p-0 mt-2 h-auto">
                  View PM Partners →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Municipal Contracts</h3>
                <p className="text-sm text-muted-foreground">
                  Government contracts for public tree maintenance
                </p>
                <Button variant="link" className="p-0 mt-2 h-auto">
                  View Municipal Contracts →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Partnership Tracker */}
      <PartnershipTracker
        dashboard={dashboard}
        partnerships={partnerships}
        isLoading={isLoading}
        onCreatePartnership={handleCreatePartnership}
        onViewPartnership={handleViewPartnership}
      />

      {/* Strategic Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="w-5 h-5" />
            Strategic Partnership Objectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Bucks County Targets</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded border">
                  <span className="text-sm">Insurance Companies</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">3/6</span>
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div className="w-1/2 bg-blue-500 h-2 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded border">
                  <span className="text-sm">Property Managers</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">2/5</span>
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div className="w-2/5 bg-green-500 h-2 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded border">
                  <span className="text-sm">Municipal Contracts</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">1/3</span>
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div className="w-1/3 bg-purple-500 h-2 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Key Benefits</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">20-30% cost savings for property managers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Emergency response within 1 hour</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm">Municipal contract exclusive bidding</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-sm">Insurance claim fast-track processing</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
