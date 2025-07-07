
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PropertyManagementDashboard } from '@/components/market-conquest';
import { Building, DollarSign, FileText, Target, Plus } from 'lucide-react';

interface PropertyManager {
  id: string;
  companyName: string;
  type: string;
  contractStatus: string;
  propertiesManaged?: number;
  totalRevenue: number;
  averageJobValue?: number;
  relationshipScore?: number;
  contracts: Array<{
    contractType: string;
    status: string;
    contractValue: number;
    startDate: string;
    endDate: string;
  }>;
}

interface PropertyManagementDashboardType {
  overview: {
    totalPropertyManagers: number;
    activeContracts: number;
    prospectClients: number;
    totalProperties: number;
    totalRevenue: number;
  };
  contractMetrics: {
    averageContractValue: number;
    averageMonthlyMinimum: number;
    autoRenewalRate: number;
    onTimePaymentRate: number;
  };
  typeDistribution: Record<string, number>;
  revenueByType: Record<string, number>;
  topClients: Array<{
    name: string;
    revenue: number;
    properties?: number;
    contractStatus: string;
    relationshipScore?: number;
  }>;
  renewalsUpcoming: number;
  performanceMetrics: {
    averageJobValue: number;
    totalJobsGenerated: number;
    averageResponseTime: number;
    clientRetentionRate: number;
  };
}

export default function PropertyManagementHub() {
  const [dashboard, setDashboard] = useState<PropertyManagementDashboardType | null>(null);
  const [propertyManagers, setPropertyManagers] = useState<PropertyManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboard();
    fetchPropertyManagers();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/market-conquest/property-management/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching property management dashboard:', error);
    }
  };

  const fetchPropertyManagers = async () => {
    try {
      const response = await fetch('/api/market-conquest/property-management');
      if (response.ok) {
        const data = await response.json();
        setPropertyManagers(data.propertyManagers || []);
      }
    } catch (error) {
      console.error('Error fetching property managers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProposal = async (propertyManagerId: string) => {
    try {
      const response = await fetch('/api/market-conquest/property-management/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyManagerId,
          serviceTypes: ['Tree Removal', 'Tree Pruning', 'Storm Cleanup'],
          estimatedVolume: 25,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Proposal Generated',
          description: `Proposal created with ${data.proposal.totalEstimatedAnnualSavings.toLocaleString()} in estimated savings`,
        });
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create proposal',
        variant: 'destructive',
      });
    }
  };

  const handleViewROI = async (propertyManagerId: string) => {
    try {
      const response = await fetch(`/api/market-conquest/property-management/roi?propertyManagerId=${propertyManagerId}&timeframeMonths=12`);
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'ROI Analysis',
          description: `ROI: ${data.roiAnalysis.financialMetrics.roi}% over 12 months`,
        });
      }
    } catch (error) {
      console.error('Error fetching ROI:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch ROI analysis',
        variant: 'destructive',
      });
    }
  };

  const handleCreateContract = (propertyManagerId: string) => {
    toast({
      title: 'Contract Creation',
      description: 'Contract creation form will be available soon',
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
      {/* Strategic Overview */}
      <Card className="border-l-4 border-l-green-500 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Property Management Strategy</h3>
              <p className="text-muted-foreground mb-4">
                Target high-volume property management companies in Bucks County for bulk service contracts.
                Offer 20-30% cost savings through volume pricing and priority service guarantees.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-700">Primary Targets:</span>
                  <p className="text-muted-foreground">Keyrenter BuxMont, Bay Property Management</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Service Types:</span>
                  <p className="text-muted-foreground">Emergency response, preventive maintenance</p>
                </div>
                <div>
                  <span className="font-medium text-purple-700">Volume Benefits:</span>
                  <p className="text-muted-foreground">25% discount, 1-hour emergency response</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Companies Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            name: 'Keyrenter BuxMont',
            type: 'Residential',
            properties: 250,
            potential: '$180K annually',
            status: 'PROSPECT',
          },
          {
            name: 'Bay Property Management',
            type: 'Mixed Use',
            properties: 180,
            potential: '$135K annually',
            status: 'NEGOTIATING',
          },
          {
            name: 'Innovate Realty',
            type: 'Residential',
            properties: 120,
            potential: '$90K annually',
            status: 'PROSPECT',
          },
        ].map((company, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{company.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    company.status === 'NEGOTIATING' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {company.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Type:</span> {company.type}</p>
                  <p><span className="text-muted-foreground">Properties:</span> {company.properties}</p>
                  <p><span className="text-muted-foreground">Potential:</span> {company.potential}</p>
                </div>
                <Button size="sm" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Proposal
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Property Management Dashboard */}
      <PropertyManagementDashboard
        dashboard={dashboard}
        propertyManagers={propertyManagers}
        isLoading={isLoading}
        onCreateProposal={handleCreateProposal}
        onViewROI={handleViewROI}
        onCreateContract={handleCreateContract}
      />

      {/* Value Proposition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Property Management Value Proposition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Cost Savings Benefits</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded border">
                  <span className="text-sm">Volume Discount (25+ properties)</span>
                  <span className="font-medium text-green-600">25% savings</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded border">
                  <span className="text-sm">Emergency Response (1 hour)</span>
                  <span className="font-medium text-blue-600">Priority access</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded border">
                  <span className="text-sm">Preventive Maintenance Plans</span>
                  <span className="font-medium text-purple-600">30% reduction in emergencies</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Service Guarantees</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">24/7 emergency response availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Dedicated account manager</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm">Monthly performance reporting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-sm">Digital work order management</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
