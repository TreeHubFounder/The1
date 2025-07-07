
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Shield, Users, DollarSign, TrendingUp } from 'lucide-react';

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

interface TerritoryMapProps {
  territories?: Territory[];
  onSelectTerritory?: (territory: Territory) => void;
  onProtectTerritory?: (territoryId: string) => void;
  showControls?: boolean;
}

export default function TerritoryMap({ 
  territories = [], 
  onSelectTerritory,
  onProtectTerritory,
  showControls = true 
}: TerritoryMapProps) {
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const getStatusColor = (status: string, isProtected: boolean) => {
    if (isProtected) return 'bg-green-500';
    switch (status) {
      case 'AVAILABLE': return 'bg-blue-500';
      case 'PROTECTED': return 'bg-green-500';
      case 'EXCLUSIVE': return 'bg-purple-500';
      case 'COMPETITIVE': return 'bg-orange-500';
      case 'SATURATED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getOpportunityColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredTerritories = territories.filter(territory => {
    if (filter === 'all') return true;
    if (filter === 'protected') return territory.isProtected;
    if (filter === 'available') return territory.status === 'AVAILABLE';
    if (filter === 'high-opportunity') return (territory.opportunityScore || 0) >= 70;
    return true;
  });

  const handleTerritoryClick = (territory: Territory) => {
    setSelectedTerritory(territory);
    onSelectTerritory?.(territory);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      {showControls && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Territories
          </Button>
          <Button
            variant={filter === 'protected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('protected')}
          >
            <Shield className="w-4 h-4 mr-1" />
            Protected
          </Button>
          <Button
            variant={filter === 'available' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('available')}
          >
            Available
          </Button>
          <Button
            variant={filter === 'high-opportunity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('high-opportunity')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            High Opportunity
          </Button>
        </div>
      )}

      {/* Territory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTerritories.map((territory) => (
          <Card
            key={territory.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTerritory?.id === territory.id 
                ? 'ring-2 ring-primary' 
                : ''
            }`}
            onClick={() => handleTerritoryClick(territory)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {territory.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {territory.isProtected && (
                    <Shield className="w-4 h-4 text-green-600" />
                  )}
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(
                      territory.status,
                      territory.isProtected
                    )}`}
                  />
                </div>
              </div>
              {territory.zipCode && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1" />
                  {territory.zipCode}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Opportunity Score */}
              {territory.opportunityScore && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Opportunity</span>
                  <span className={`text-sm font-medium ${getOpportunityColor(territory.opportunityScore)}`}>
                    {territory.opportunityScore}/100
                  </span>
                </div>
              )}

              {/* Market Data */}
              <div className="space-y-1">
                {territory.medianIncome && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Median Income</span>
                    <span>${(territory.medianIncome / 1000).toFixed(0)}K</span>
                  </div>
                )}
                {territory.households && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Households</span>
                    <span>{territory.households.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Revenue */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Revenue</span>
                <span className="text-sm font-medium text-green-600">
                  ${territory.totalRevenue.toLocaleString()}
                </span>
              </div>

              {/* Assignments */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Professionals</span>
                  <span>{territory.territoryAssignments.length}</span>
                </div>
                {territory.territoryAssignments.slice(0, 2).map((assignment, index) => (
                  <div key={index} className="text-xs text-muted-foreground truncate">
                    {assignment.professional.firstName} {assignment.professional.lastName}
                    {assignment.professional.companyName && (
                      <span className="ml-1">({assignment.professional.companyName})</span>
                    )}
                  </div>
                ))}
                {territory.territoryAssignments.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{territory.territoryAssignments.length - 2} more
                  </div>
                )}
              </div>

              {/* Actions */}
              {!territory.isProtected && territory.status === 'AVAILABLE' && onProtectTerritory && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProtectTerritory(territory.id);
                  }}
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Protect Territory
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Territory Details */}
      {selectedTerritory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {selectedTerritory.name} Details
              {selectedTerritory.isProtected && (
                <Badge variant="secondary" className="ml-2">
                  <Shield className="w-3 h-3 mr-1" />
                  Protected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Market Data */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Market Data</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Opportunity Score</span>
                    <span className={`font-medium ${getOpportunityColor(selectedTerritory.opportunityScore)}`}>
                      {selectedTerritory.opportunityScore || 'N/A'}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Median Income</span>
                    <span>${((selectedTerritory.medianIncome || 0) / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Households</span>
                    <span>{(selectedTerritory.households || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Performance</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="font-medium text-green-600">
                      ${selectedTerritory.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="outline">{selectedTerritory.status}</Badge>
                  </div>
                </div>
              </div>

              {/* Team */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Assigned Professionals</h4>
                <div className="space-y-2">
                  {selectedTerritory.territoryAssignments.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No assignments</span>
                  ) : (
                    selectedTerritory.territoryAssignments.map((assignment, index) => (
                      <div key={index} className="text-sm">
                        {assignment.professional.firstName} {assignment.professional.lastName}
                        {assignment.professional.companyName && (
                          <div className="text-xs text-muted-foreground">
                            {assignment.professional.companyName}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredTerritories.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No territories found</h3>
            <p className="text-muted-foreground">
              No territories match the current filter criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
