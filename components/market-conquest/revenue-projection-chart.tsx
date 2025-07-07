
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Zap,
  CloudRain,
  BarChart3
} from 'lucide-react';

// Dynamic import for recharts
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });

interface RevenueProjection {
  timeframe: string;
  baseRevenue: number;
  stormSurgeMultiplier: number;
  projectedRevenue: number;
  confidenceLevel: number;
  assumptions: string[];
}

interface RevenueProjectionChartProps {
  projections?: RevenueProjection[];
  isLoading?: boolean;
  onUpdateProjection?: (months: number) => void;
}

export default function RevenueProjectionChart({
  projections = [],
  isLoading = false,
  onUpdateProjection,
}: RevenueProjectionChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(12);
  const [viewMode, setViewMode] = useState<'monthly' | 'cumulative'>('monthly');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projections.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No revenue projections available</h3>
          <p className="text-muted-foreground">
            Revenue projections will appear here once generated.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const prepareMonthlyData = () => {
    const months = Array.from({ length: selectedTimeframe }, (_, i) => i + 1);
    
    return months.map(month => {
      const monthlyData: any = { month: `Month ${month}` };
      
      projections.forEach(projection => {
        const monthlyRevenue = projection.projectedRevenue / selectedTimeframe;
        const scenarioName = projection.timeframe.includes('Conservative') ? 'Conservative' :
                           projection.timeframe.includes('Aggressive') ? 'Aggressive' :
                           projection.timeframe.includes('Minor Storm') ? 'Minor Storm' :
                           projection.timeframe.includes('Moderate Storm') ? 'Moderate Storm' :
                           projection.timeframe.includes('Major Storm') ? 'Major Storm' :
                           projection.timeframe.includes('Extreme Weather') ? 'Extreme Weather' :
                           'Other';
        
        monthlyData[scenarioName] = monthlyRevenue;
      });
      
      return monthlyData;
    });
  };

  const prepareCumulativeData = () => {
    const months = Array.from({ length: selectedTimeframe }, (_, i) => i + 1);
    
    return months.map(month => {
      const cumulativeData: any = { month: `Month ${month}` };
      
      projections.forEach(projection => {
        const monthlyRevenue = projection.projectedRevenue / selectedTimeframe;
        const cumulativeRevenue = monthlyRevenue * month;
        const scenarioName = projection.timeframe.includes('Conservative') ? 'Conservative' :
                           projection.timeframe.includes('Aggressive') ? 'Aggressive' :
                           projection.timeframe.includes('Minor Storm') ? 'Minor Storm' :
                           projection.timeframe.includes('Moderate Storm') ? 'Moderate Storm' :
                           projection.timeframe.includes('Major Storm') ? 'Major Storm' :
                           projection.timeframe.includes('Extreme Weather') ? 'Extreme Weather' :
                           'Other';
        
        cumulativeData[scenarioName] = cumulativeRevenue;
      });
      
      return cumulativeData;
    });
  };

  const chartData = viewMode === 'monthly' ? prepareMonthlyData() : prepareCumulativeData();

  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'Conservative': return '#60B5FF';
      case 'Aggressive': return '#FF9149';
      case 'Minor Storm': return '#80D8C3';
      case 'Moderate Storm': return '#FF9898';
      case 'Major Storm': return '#FF6363';
      case 'Extreme Weather': return '#A19AD3';
      default: return '#72BF78';
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
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={selectedTimeframe === 6 ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedTimeframe(6);
              onUpdateProjection?.(6);
            }}
          >
            6 Months
          </Button>
          <Button
            variant={selectedTimeframe === 12 ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedTimeframe(12);
              onUpdateProjection?.(12);
            }}
          >
            12 Months
          </Button>
          <Button
            variant={selectedTimeframe === 24 ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedTimeframe(24);
              onUpdateProjection?.(24);
            }}
          >
            24 Months
          </Button>
        </div>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'monthly' | 'cumulative')}>
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="cumulative">Cumulative</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {projections.slice(0, 4).map((projection, index) => {
          const isStormScenario = projection.stormSurgeMultiplier > 1;
          const monthlyRevenue = projection.projectedRevenue / selectedTimeframe;
          
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isStormScenario ? (
                        <CloudRain className="w-4 h-4 text-blue-600" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-xs font-medium">
                        {projection.timeframe.split(' (')[1]?.replace(')', '') || 'Scenario'}
                      </span>
                    </div>
                    <Badge variant={projection.confidenceLevel >= 70 ? 'default' : 'secondary'}>
                      {projection.confidenceLevel}%
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-lg font-bold">
                      {formatCurrency(projection.projectedRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(monthlyRevenue)}/month
                    </p>
                  </div>
                  
                  {isStormScenario && (
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-600" />
                      <span className="text-xs text-yellow-600">
                        {projection.stormSurgeMultiplier}x multiplier
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Revenue Projections - {viewMode === 'monthly' ? 'Monthly' : 'Cumulative'} View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'monthly' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  
                  {['Conservative', 'Aggressive', 'Minor Storm', 'Moderate Storm', 'Major Storm', 'Extreme Weather'].map(scenario => (
                    chartData.some(data => data[scenario]) && (
                      <Line
                        key={scenario}
                        type="monotone"
                        dataKey={scenario}
                        stroke={getScenarioColor(scenario)}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    )
                  ))}
                </LineChart>
              ) : (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  
                  {['Conservative', 'Aggressive', 'Minor Storm', 'Moderate Storm', 'Major Storm', 'Extreme Weather'].map(scenario => (
                    chartData.some(data => data[scenario]) && (
                      <Area
                        key={scenario}
                        type="monotone"
                        dataKey={scenario}
                        stroke={getScenarioColor(scenario)}
                        fill={getScenarioColor(scenario)}
                        fillOpacity={0.3}
                      />
                    )
                  ))}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projections.map((projection, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {projection.timeframe.split(' (')[1]?.replace(')', '') || `Scenario ${index + 1}`}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={projection.confidenceLevel >= 70 ? 'default' : 'secondary'}>
                    {projection.confidenceLevel}% confidence
                  </Badge>
                  {projection.stormSurgeMultiplier > 1 && (
                    <Badge variant="outline">
                      <Zap className="w-3 h-3 mr-1" />
                      {projection.stormSurgeMultiplier}x
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(projection.projectedRevenue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Average</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(projection.projectedRevenue / selectedTimeframe)}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Key Assumptions</h4>
                <ul className="space-y-1">
                  {projection.assumptions.slice(0, 3).map((assumption, assumptionIndex) => (
                    <li key={assumptionIndex} className="text-sm text-muted-foreground">
                      • {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
