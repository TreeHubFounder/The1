
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Handshake, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Shield,
  Building,
  FileText,
  Calendar,
  Target,
  Plus
} from 'lucide-react';

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

interface PartnershipTrackerProps {
  dashboard?: PartnershipDashboard;
  partnerships?: Partnership[];
  isLoading?: boolean;
  onCreatePartnership?: () => void;
  onViewPartnership?: (partnershipId: string) => void;
}

const PARTNERSHIP_TYPES = {
  INSURANCE_COMPANY: { label: 'Insurance', icon: Shield, color: 'bg-blue-500' },
  MUNICIPAL_CONTRACT: { label: 'Municipal', icon: Building, color: 'bg-green-500' },
  FRANCHISE_PARTNER: { label: 'Franchise', icon: Users, color: 'bg-purple-500' },
  EQUIPMENT_SUPPLIER: { label: 'Equipment', icon: FileText, color: 'bg-orange-500' },
  TECHNOLOGY_VENDOR: { label: 'Technology', icon: Target, color: 'bg-red-500' },
};

const STATUS_COLORS = {
  PROSPECT: 'bg-gray-500',
  NEGOTIATING: 'bg-yellow-500',
  ACTIVE: 'bg-green-500',
  PAUSED: 'bg-orange-500',
  TERMINATED: 'bg-red-500',
  EXPIRED: 'bg-gray-400',
};

export default function PartnershipTracker({
  dashboard,
  partnerships = [],
  isLoading = false,
  onCreatePartnership,
  onViewPartnership,
}: PartnershipTrackerProps) {
  const [selectedType, setSelectedType] = useState<string>('all');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
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

  const filteredPartnerships = partnerships.filter(partnership => 
    selectedType === 'all' || partnership.partnerType === selectedType
  );

  const getRelationshipScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
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
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Partnership Management</h2>
        {onCreatePartnership && (
          <Button onClick={onCreatePartnership}>
            <Plus className="w-4 h-4 mr-2" />
            New Partnership
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Partnerships</p>
                  <p className="text-2xl font-bold">{dashboard.totalPartnerships}</p>
                </div>
                <Handshake className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Partners</p>
                  <p className="text-2xl font-bold text-green-600">{dashboard.activePartnerships}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboard.totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads Generated</p>
                  <p className="text-2xl font-bold">{dashboard.totalLeads}</p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Relationship Score</p>
                  <p className="text-2xl font-bold">{dashboard.averageRelationshipScore.toFixed(0)}</p>
                </div>
                <Handshake className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="partnerships">All Partnerships</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Partnership Types Distribution */}
          {dashboard && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Partnership Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(dashboard.byType).map(([type, count]) => {
                    const typeInfo = PARTNERSHIP_TYPES[type as keyof typeof PARTNERSHIP_TYPES];
                    const Icon = typeInfo?.icon || FileText;
                    
                    return (
                      <div key={type} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${typeInfo?.color || 'bg-gray-500'}`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">{typeInfo?.label || type}</h4>
                            <p className="text-sm text-muted-foreground">{count} partnerships</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedType(type)}
                        >
                          View
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Performers */}
          {dashboard?.topPerformers && dashboard.topPerformers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top Performing Partnerships
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.topPerformers.slice(0, 5).map((partnership, index) => (
                    <div key={partnership.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{partnership.partnerName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {PARTNERSHIP_TYPES[partnership.partnerType as keyof typeof PARTNERSHIP_TYPES]?.label || partnership.partnerType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(partnership.revenueGenerated)}</p>
                          <p className="text-sm text-muted-foreground">{partnership.leadsGenerated} leads</p>
                        </div>
                        <Badge variant="outline">
                          Score: {partnership.relationshipScore || 0}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="partnerships" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
            >
              All Types
            </Button>
            {Object.entries(PARTNERSHIP_TYPES).map(([type, info]) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type)}
              >
                <info.icon className="w-4 h-4 mr-1" />
                {info.label}
              </Button>
            ))}
          </div>

          {/* Partnership List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPartnerships.map((partnership) => (
              <Card 
                key={partnership.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onViewPartnership?.(partnership.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{partnership.partnerName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[partnership.status as keyof typeof STATUS_COLORS]}`} />
                      <Badge variant="outline">{partnership.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm font-medium">
                      {PARTNERSHIP_TYPES[partnership.partnerType as keyof typeof PARTNERSHIP_TYPES]?.label || partnership.partnerType}
                    </span>
                  </div>

                  {partnership.relationshipScore && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Relationship Score</span>
                        <span className={`text-sm font-medium ${getRelationshipScoreColor(partnership.relationshipScore)}`}>
                          {partnership.relationshipScore}/100
                        </span>
                      </div>
                      <Progress value={partnership.relationshipScore} className="h-2" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(partnership.revenueGenerated)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Leads</p>
                      <p className="font-medium">{partnership.leadsGenerated}</p>
                    </div>
                  </div>

                  {partnership.contractEndDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Contract ends: {new Date(partnership.contractEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {partnership.partnershipLevel && (
                    <Badge variant="secondary">{partnership.partnershipLevel} Partner</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPartnerships.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Handshake className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No partnerships found</h3>
                <p className="text-muted-foreground mb-4">
                  No partnerships match the current filter criteria.
                </p>
                {onCreatePartnership && (
                  <Button onClick={onCreatePartnership}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Partnership
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Partnership Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Revenue by Type</h4>
                  {partnerships
                    .reduce((acc, partnership) => {
                      const type = partnership.partnerType;
                      acc[type] = (acc[type] || 0) + partnership.revenueGenerated;
                      return acc;
                    }, {} as Record<string, number>)
                    && Object.entries(partnerships.reduce((acc, partnership) => {
                      const type = partnership.partnerType;
                      acc[type] = (acc[type] || 0) + partnership.revenueGenerated;
                      return acc;
                    }, {} as Record<string, number>))
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([type, revenue]) => {
                      const typeInfo = PARTNERSHIP_TYPES[type as keyof typeof PARTNERSHIP_TYPES];
                      const totalRevenue = partnerships.reduce((sum, p) => sum + p.revenueGenerated, 0);
                      const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
                      
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{typeInfo?.label || type}</span>
                            <span className="text-sm font-medium">{formatCurrency(revenue)}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Lead Generation by Type</h4>
                  {partnerships
                    .reduce((acc, partnership) => {
                      const type = partnership.partnerType;
                      acc[type] = (acc[type] || 0) + partnership.leadsGenerated;
                      return acc;
                    }, {} as Record<string, number>)
                    && Object.entries(partnerships.reduce((acc, partnership) => {
                      const type = partnership.partnerType;
                      acc[type] = (acc[type] || 0) + partnership.leadsGenerated;
                      return acc;
                    }, {} as Record<string, number>))
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([type, leads]) => {
                      const typeInfo = PARTNERSHIP_TYPES[type as keyof typeof PARTNERSHIP_TYPES];
                      const totalLeads = partnerships.reduce((sum, p) => sum + p.leadsGenerated, 0);
                      const percentage = totalLeads > 0 ? (leads / totalLeads) * 100 : 0;
                      
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{typeInfo?.label || type}</span>
                            <span className="text-sm font-medium">{leads} leads</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Partnership Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded border">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {activity.partnerName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{activity.partnerName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {activity.activityType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.activityDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No recent activity</h3>
                <p className="text-muted-foreground">
                  Partnership activities will appear here as they happen.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
