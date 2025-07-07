
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  AlertTriangle,
  Eye,
  BarChart3,
  Zap
} from 'lucide-react';

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

interface CompetitorAnalysisWidgetProps {
  dashboard?: CompetitiveDashboard;
  competitors?: Competitor[];
  isLoading?: boolean;
  onAnalyzeCompetitor?: (competitorId: string) => void;
  onTrackOutcome?: (competitorId: string, outcome: 'won' | 'lost') => void;
}

const THREAT_COLORS = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

const THREAT_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export default function CompetitorAnalysisWidget({
  dashboard,
  competitors = [],
  isLoading = false,
  onAnalyzeCompetitor,
  onTrackOutcome,
}: CompetitorAnalysisWidgetProps) {
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);

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

  const getWinRate = (competitor: Competitor) => {
    const totalJobs = competitor.jobsWonAgainst + competitor.jobsLostTo;
    return totalJobs > 0 ? (competitor.jobsWonAgainst / totalJobs) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Competitors</p>
                  <p className="text-2xl font-bold">{dashboard.totalCompetitors}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboard.overallWinRate.toFixed(1)}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jobs Competed</p>
                  <p className="text-2xl font-bold">{dashboard.totalJobsCompeted}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Major Threats</p>
                  <p className="text-2xl font-bold text-red-600">
                    {dashboard.majorThreats.length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Major Threats</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Threat Distribution */}
          {dashboard && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Threat Level Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(dashboard.threatDistribution).map(([level, count]) => {
                    const percentage = (count / dashboard.totalCompetitors) * 100;
                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${THREAT_COLORS[level as keyof typeof THREAT_COLORS]}`} />
                            <span className="text-sm font-medium">
                              {THREAT_LABELS[level as keyof typeof THREAT_LABELS]}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitor List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                All Competitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {competitors.map((competitor) => (
                  <div
                    key={competitor.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedCompetitor?.id === competitor.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedCompetitor(competitor)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${THREAT_COLORS[competitor.threatLevel as keyof typeof THREAT_COLORS]}`} />
                        <div>
                          <h4 className="font-medium">{competitor.name}</h4>
                          <p className="text-sm text-muted-foreground">{competitor.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Win Rate: {getWinRate(competitor).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {competitor.jobsWonAgainst}W / {competitor.jobsLostTo}L
                          </p>
                        </div>
                        <Badge variant="outline">
                          {THREAT_LABELS[competitor.threatLevel as keyof typeof THREAT_LABELS]}
                        </Badge>
                      </div>
                    </div>
                    
                    {competitor.serviceAreas.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          Service Areas: {competitor.serviceAreas.slice(0, 3).join(', ')}
                          {competitor.serviceAreas.length > 3 && ' +more'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          {dashboard?.majorThreats.map((threat) => (
            <Card key={threat.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    {threat.name}
                  </CardTitle>
                  <Badge variant="destructive">
                    {THREAT_LABELS[threat.threatLevel as keyof typeof THREAT_LABELS]} Threat
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Company Details</h4>
                    <div className="space-y-1">
                      <p className="text-sm">Type: {threat.type}</p>
                      {threat.estimatedRevenue && (
                        <p className="text-sm">
                          Revenue: ${(threat.estimatedRevenue / 1000000).toFixed(1)}M
                        </p>
                      )}
                      {threat.employeeCount && (
                        <p className="text-sm">Employees: {threat.employeeCount}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Performance</h4>
                    <div className="space-y-1">
                      <p className="text-sm">Win Rate: {getWinRate(threat).toFixed(1)}%</p>
                      <p className="text-sm">Jobs Won: {threat.jobsWonAgainst}</p>
                      <p className="text-sm">Jobs Lost: {threat.jobsLostTo}</p>
                      {threat.averageBidGap && (
                        <p className="text-sm">
                          Avg Bid Gap: ${Math.abs(threat.averageBidGap).toLocaleString()}
                          {threat.averageBidGap > 0 ? ' (Higher)' : ' (Lower)'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Actions</h4>
                    <div className="space-y-2">
                      {onAnalyzeCompetitor && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => onAnalyzeCompetitor(threat.id)}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analyze
                        </Button>
                      )}
                      {onTrackOutcome && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onTrackOutcome(threat.id, 'won')}
                          >
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Won
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onTrackOutcome(threat.id, 'lost')}
                          >
                            <TrendingDown className="w-4 h-4 mr-1" />
                            Lost
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Competitive Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Win/Loss Analysis</h4>
                  {competitors.slice(0, 5).map((competitor) => {
                    const winRate = getWinRate(competitor);
                    return (
                      <div key={competitor.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{competitor.name}</span>
                          <span className="text-sm font-medium">{winRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={winRate} className="h-2" />
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Recent Insights</h4>
                  {competitors
                    .flatMap(c => c.competitorAnalysis.map(a => ({ ...a, competitorName: c.name })))
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                    .map((analysis, index) => (
                      <div key={index} className="p-3 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{analysis.competitorName}</span>
                          <Badge variant="outline">{analysis.analysisType}</Badge>
                        </div>
                        {analysis.recommendations.slice(0, 2).map((rec, recIndex) => (
                          <p key={recIndex} className="text-xs text-muted-foreground">
                            • {rec}
                          </p>
                        ))}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Competitor Details */}
      {selectedCompetitor && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedCompetitor.name} - Detailed Analysis</CardTitle>
              <Button variant="outline" onClick={() => setSelectedCompetitor(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Company Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Type:</span> {selectedCompetitor.type}</p>
                  <p><span className="font-medium">Threat Level:</span> 
                    <Badge className="ml-2" variant={selectedCompetitor.threatLevel === 'CRITICAL' ? 'destructive' : 'secondary'}>
                      {THREAT_LABELS[selectedCompetitor.threatLevel as keyof typeof THREAT_LABELS]}
                    </Badge>
                  </p>
                  {selectedCompetitor.estimatedRevenue && (
                    <p><span className="font-medium">Est. Revenue:</span> ${(selectedCompetitor.estimatedRevenue / 1000000).toFixed(1)}M</p>
                  )}
                  {selectedCompetitor.employeeCount && (
                    <p><span className="font-medium">Employees:</span> {selectedCompetitor.employeeCount}</p>
                  )}
                  <p><span className="font-medium">Service Areas:</span> {selectedCompetitor.serviceAreas.join(', ')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Performance Against Us</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Win Rate:</span> {getWinRate(selectedCompetitor).toFixed(1)}%</p>
                  <p><span className="font-medium">Jobs Won Against Them:</span> {selectedCompetitor.jobsWonAgainst}</p>
                  <p><span className="font-medium">Jobs Lost To Them:</span> {selectedCompetitor.jobsLostTo}</p>
                  {selectedCompetitor.averageBidGap && (
                    <p><span className="font-medium">Average Bid Gap:</span> 
                      <span className={selectedCompetitor.averageBidGap > 0 ? 'text-red-600' : 'text-green-600'}>
                        {selectedCompetitor.averageBidGap > 0 ? '+' : ''}${selectedCompetitor.averageBidGap.toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {selectedCompetitor.competitorAnalysis.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-4">Recent Analyses</h4>
                <div className="space-y-3">
                  {selectedCompetitor.competitorAnalysis.slice(0, 3).map((analysis, index) => (
                    <div key={index} className="p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{analysis.analysisType}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {analysis.recommendations.map((rec, recIndex) => (
                          <p key={recIndex} className="text-sm">• {rec}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
