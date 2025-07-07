
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ExecutionTimeline } from '@/components/market-conquest';
import { Calendar, CheckCircle, Clock, AlertCircle, PlayCircle, XCircle, Plus } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progressPercentage: number;
  targetValue?: number;
  actualValue?: number;
  dependencies: string[];
  assignedTo?: string;
  assignedTeam: string[];
}

interface ExecutionDashboard {
  overview: {
    totalMilestones: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    delayed: number;
    blocked: number;
  };
  currentWeek: number;
  byType: Record<string, { total: number; completed: number; inProgress: number }>;
  timeline: {
    thisWeek: Milestone[];
    nextWeek: Milestone[];
    upcomingMonth: Milestone[];
  };
  criticalPath: Milestone[];
  recentProgress: Milestone[];
}

export default function ExecutionManagement() {
  const [dashboard, setDashboard] = useState<ExecutionDashboard | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboard();
    fetchMilestones();
    initializeTimeline();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/market-conquest/execution/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching execution dashboard:', error);
    }
  };

  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/market-conquest/execution');
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeTimeline = async () => {
    try {
      const response = await fetch('/api/market-conquest/execution/initialize', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results.created > 0) {
          toast({
            title: 'Timeline Initialized',
            description: `Created ${data.results.created} conquest milestones`,
          });
          fetchDashboard();
          fetchMilestones();
        }
      }
    } catch (error) {
      console.error('Error initializing timeline:', error);
    }
  };

  const handleUpdateProgress = async (milestoneId: string, progress: number, notes?: string) => {
    try {
      const response = await fetch('/api/market-conquest/execution/update-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          milestoneId,
          progressPercentage: progress,
          notes,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Progress Updated',
          description: `Milestone progress updated to ${progress}%`,
        });
        fetchDashboard();
        fetchMilestones();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update progress',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update progress',
        variant: 'destructive',
      });
    }
  };

  const handleViewMilestone = (milestoneId: string) => {
    toast({
      title: 'Milestone Details',
      description: `Viewing details for milestone ${milestoneId}`,
    });
  };

  const generateWeeklyReport = async () => {
    try {
      const response = await fetch('/api/market-conquest/execution/weekly-report');
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Weekly Report Generated',
          description: `Week ${data.report.week} report is ready`,
        });
      }
    } catch (error) {
      console.error('Error generating weekly report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate weekly report',
        variant: 'destructive',
      });
    }
  };

  const STATUS_COLORS = {
    NOT_STARTED: 'text-gray-500',
    IN_PROGRESS: 'text-blue-600',
    COMPLETED: 'text-green-600',
    DELAYED: 'text-orange-600',
    BLOCKED: 'text-red-600',
    CANCELLED: 'text-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Conquest Execution Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateWeeklyReport}>
            <Calendar className="w-4 h-4 mr-2" />
            Weekly Report
          </Button>
          <Button onClick={initializeTimeline}>
            <Plus className="w-4 h-4 mr-2" />
            Initialize Timeline
          </Button>
        </div>
      </div>

      {/* Strategic Context */}
      <Card className="border-l-4 border-l-primary bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Bucks County Domination Timeline</h3>
              <p className="text-muted-foreground mb-4">
                Systematic execution plan to achieve market dominance in Bucks County, 
                scale to 75-100 professionals, and reach $940K-$1.12M annual revenue target.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Phase 1 (Weeks 1-8):</span>
                  <p className="text-muted-foreground">Platform & First 25 Pros</p>
                </div>
                <div>
                  <span className="font-medium">Phase 2 (Weeks 9-16):</span>
                  <p className="text-muted-foreground">50% Penetration & Partnerships</p>
                </div>
                <div>
                  <span className="font-medium">Phase 3 (Weeks 17-26):</span>
                  <p className="text-muted-foreground">Scale to 100 Pros & $940K</p>
                </div>
                <div>
                  <span className="font-medium">Phase 4 (Weeks 27-52):</span>
                  <p className="text-muted-foreground">Expansion & Franchise Prep</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Execution Timeline */}
      <ExecutionTimeline
        dashboard={dashboard}
        milestones={milestones}
        isLoading={isLoading}
        onUpdateProgress={handleUpdateProgress}
        onViewMilestone={handleViewMilestone}
      />

      {/* Execution Insights */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">On Track</span>
                    <span className="font-medium text-green-600">
                      {dashboard.overview.completed + dashboard.overview.inProgress} / {dashboard.overview.totalMilestones}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${((dashboard.overview.completed + dashboard.overview.inProgress) / dashboard.overview.totalMilestones) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completion Rate</span>
                    <span className="font-medium">
                      {((dashboard.overview.completed / dashboard.overview.totalMilestones) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${(dashboard.overview.completed / dashboard.overview.totalMilestones) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {dashboard.overview.delayed > 0 && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{dashboard.overview.delayed} milestones delayed</span>
                  </div>
                )}

                {dashboard.overview.blocked > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">{dashboard.overview.blocked} milestones blocked</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestone Types Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(dashboard.byType).map(([type, stats]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{type.replace('_', ' ')}</span>
                      <span className="text-sm font-medium">
                        {stats.completed}/{stats.total}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ 
                          width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

