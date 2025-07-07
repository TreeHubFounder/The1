
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Building,
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Target,
  Percent,
  Clock,
  CheckCircle
} from 'lucide-react';

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

interface PropertyManagementDashboard {
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

interface PropertyManagementDashboardProps {
  dashboard?: PropertyManagementDashboard;
  propertyManagers?: PropertyManager[];
  isLoading?: boolean;
  onCreateProposal?: (propertyManagerId: string) => void;
  onViewROI?: (propertyManagerId: string) => void;
  onCreateContract?: (propertyManagerId: string) => void;
}

const TYPE_LABELS = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  MIXED_USE: 'Mixed Use',
  HOA: 'HOA',
  GOVERNMENT: 'Government',
  INSTITUTIONAL: 'Institutional',
};

const STATUS_COLORS = {
  PROSPECT: 'bg-blue-500',
  NEGOTIATING: 'bg-yellow-500',
  ACTIVE: 'bg-green-500',
  RENEWAL_DUE: 'bg-orange-500',
  EXPIRED: 'bg-gray-500',
  CANCELLED: 'bg-red-500',
  TERMINATED: 'bg-red-600',
};

export default function PropertyManagementDashboard({
  dashboard,
  propertyManagers = [],
  isLoading = false,
  onCreateProposal,
  onViewROI,
  onCreateContract,
}: PropertyManagementDashboardProps) {
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

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const getRelationshipScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredPropertyManagers = propertyManagers.filter(pm =>
    selectedType === 'all' || pm.type === selectedType
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total PM Companies</p>
                  <p className="text-2xl font-bold">{dashboard.overview.totalPropertyManagers}</p>
                </div>
                <Building className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Contracts</p>
                  <p className="text-2xl font-bold text-green-600">{dashboard.overview.activeContracts}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Properties</p>
                  <p className="text-2xl font-bold">{dashboard.overview.totalProperties.toLocaleString()}</p>
                </div>
                <Building className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboard.overview.totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prospects</p>
                  <p className="text-2xl font-bold text-orange-600">{dashboard.overview.prospectClients}</p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Property Managers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {dashboard && (
            <>
              {/* Contract Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">Avg Contract Value</span>
                      </div>
                      <p className="text-xl font-bold">{formatCurrency(dashboard.contractMetrics.averageContractValue)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-muted-foreground">Avg Monthly Minimum</span>
                      </div>
                      <p className="text-xl font-bold">{formatCurrency(dashboard.contractMetrics.averageMonthlyMinimum)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-muted-foreground">Auto Renewal Rate</span>
                      </div>
                      <p className="text-xl font-bold">{dashboard.contractMetrics.autoRenewalRate.toFixed(1)}%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">On-Time Payment</span>
                      </div>
                      <p className="text-xl font-bold">{dashboard.contractMetrics.onTimePaymentRate.toFixed(1)}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Property Manager Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(dashboard.typeDistribution).map(([type, count]) => {
                      const revenue = dashboard.revenueByType[type] || 0;
                      const percentage = dashboard.overview.totalPropertyManagers > 0 
                        ? (count / dashboard.overview.totalPropertyManagers) * 100 
                        : 0;
                      
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type}
                              </span>
                              <Badge variant="outline">{count} companies</Badge>
                            </div>
                            <span className="font-medium">{formatCurrency(revenue)}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Clients */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Top Performing Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboard.topClients.map((client, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{client.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {client.properties ? `${client.properties} properties` : 'Properties TBD'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(client.revenue)}</p>
                            {client.relationshipScore && (
                              <p className={`text-sm ${getRelationshipScoreColor(client.relationshipScore)}`}>
                                Score: {client.relationshipScore}/100
                              </p>
                            )}
                          </div>
                          <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[client.contractStatus as keyof typeof STATUS_COLORS]}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
            >
              All Types
            </Button>
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Property Manager List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPropertyManagers.map((pm) => (
              <Card key={pm.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pm.companyName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[pm.contractStatus as keyof typeof STATUS_COLORS]}`} />
                      <Badge variant="outline">{pm.contractStatus}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm font-medium">
                      {TYPE_LABELS[pm.type as keyof typeof TYPE_LABELS] || pm.type}
                    </span>
                  </div>

                  {pm.propertiesManaged && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Properties</span>
                      <span className="text-sm font-medium">{pm.propertiesManaged.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(pm.totalRevenue)}
                    </span>
                  </div>

                  {pm.averageJobValue && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg Job Value</span>
                      <span className="text-sm font-medium">{formatCurrency(pm.averageJobValue)}</span>
                    </div>
                  )}

                  {pm.relationshipScore && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Relationship Score</span>
                        <span className={`text-sm font-medium ${getRelationshipScoreColor(pm.relationshipScore)}`}>
                          {pm.relationshipScore}/100
                        </span>
                      </div>
                      <Progress value={pm.relationshipScore} className="h-2" />
                    </div>
                  )}

                  {/* Contracts Summary */}
                  {pm.contracts.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Contracts: </span>
                      {pm.contracts.length} active
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {onCreateProposal && pm.contractStatus === 'PROSPECT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCreateProposal(pm.id)}
                      >
                        Create Proposal
                      </Button>
                    )}
                    {onCreateContract && pm.contractStatus === 'NEGOTIATING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCreateContract(pm.id)}
                      >
                        Create Contract
                      </Button>
                    )}
                    {onViewROI && pm.contractStatus === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewROI(pm.id)}
                      >
                        View ROI
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPropertyManagers.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No property managers found</h3>
                <p className="text-muted-foreground">
                  No property managers match the current filter criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {dashboard && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">Avg Job Value</span>
                      </div>
                      <p className="text-xl font-bold">{formatCurrency(dashboard.performanceMetrics.averageJobValue)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-muted-foreground">Jobs Generated</span>
                      </div>
                      <p className="text-xl font-bold">{dashboard.performanceMetrics.totalJobsGenerated}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-muted-foreground">Avg Response Time</span>
                      </div>
                      <p className="text-xl font-bold">{dashboard.performanceMetrics.averageResponseTime.toFixed(1)}h</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">Retention Rate</span>
                      </div>
                      <p className="text-xl font-bold">{dashboard.performanceMetrics.clientRetentionRate}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Revenue Performance</h4>
                        {Object.entries(dashboard.revenueByType)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 5)
                          .map(([type, revenue]) => {
                            const totalRevenue = Object.values(dashboard.revenueByType).reduce((sum, r) => sum + r, 0);
                            const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
                            
                            return (
                              <div key={type} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">
                                    {TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type}
                                  </span>
                                  <span className="text-sm font-medium">{formatCurrency(revenue)}</span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            );
                          })}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Key Metrics</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded border">
                            <span className="text-sm">Revenue per Property</span>
                            <span className="font-medium">
                              {formatCurrency(dashboard.overview.totalRevenue / dashboard.overview.totalProperties)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded border">
                            <span className="text-sm">Active Contract Rate</span>
                            <span className="font-medium">
                              {((dashboard.overview.activeContracts / dashboard.overview.totalPropertyManagers) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded border">
                            <span className="text-sm">Renewals Due</span>
                            <span className="font-medium text-orange-600">{dashboard.renewalsUpcoming}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contract Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyManagers
                  .filter(pm => pm.contracts.length > 0)
                  .map((pm) => (
                    <div key={pm.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{pm.companyName}</h4>
                        <Badge variant="outline">{pm.contracts.length} contracts</Badge>
                      </div>
                      <div className="space-y-2">
                        {pm.contracts.map((contract, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[contract.status as keyof typeof STATUS_COLORS]}`} />
                              <span className="text-sm">{contract.contractType}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm">{formatCurrency(contract.contractValue)}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(contract.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
