
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  PlayCircle,
  XCircle,
  TrendingUp,
  Target,
  Users,
  Building
} from 'lucide-react';

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

interface ExecutionTimelineProps {
  dashboard?: ExecutionDashboard;
  milestones?: Milestone[];
  isLoading?: boolean;
  onUpdateProgress?: (milestoneId: string, progress: number, notes?: string) => void;
  onViewMilestone?: (milestoneId: string) => void;
}

const STATUS_ICONS = {
  NOT_STARTED: Clock,
  IN_PROGRESS: PlayCircle,
  COMPLETED: CheckCircle,
  DELAYED: AlertCircle,
  BLOCKED: XCircle,
  CANCELLED: XCircle,
};

const STATUS_COLORS = {
  NOT_STARTED: 'text-gray-500',
  IN_PROGRESS: 'text-blue-600',
  COMPLETED: 'text-green-600',
  DELAYED: 'text-orange-600',
  BLOCKED: 'text-red-600',
  CANCELLED: 'text-red-500',
};

const TYPE_ICONS = {
  RECRUITMENT: Users,
  TERRITORY_EXPANSION: Target,
  PARTNERSHIP: Building,
  REVENUE_TARGET: TrendingUp,
  SYSTEM_DEVELOPMENT: Building,
  MARKET_PENETRATION: Target,
  COMPETITIVE_RESPONSE: AlertCircle,
};

const PRIORITY_COLORS = {
  Low: 'bg-gray-500',
  Medium: 'bg-blue-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-500',
};

export default function ExecutionTimeline({
  dashboard,
  milestones = [],
  isLoading = false,
  onUpdateProgress,
  onViewMilestone,
}: ExecutionTimelineProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [view, setView] = useState<'timeline' | 'status' | 'type'>('timeline');

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (milestone: Milestone) => {
    return milestone.status !== 'COMPLETED' && 
           new Date(milestone.plannedEndDate) < new Date();
  };

  const getDaysFromNow = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{dashboard.overview.totalMilestones}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{dashboard.overview.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{dashboard.overview.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{dashboard.overview.notStarted}</p>
              <p className="text-sm text-muted-foreground">Not Started</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{dashboard.overview.delayed}</p>
              <p className="text-sm text-muted-foreground">Delayed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{dashboard.overview.blocked}</p>
              <p className="text-sm text-muted-foreground">Blocked</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Controls */}
      <div className="flex gap-2">
        <Button
          variant={view === 'timeline' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('timeline')}
        >
          <Calendar className="w-4 h-4 mr-1" />
          Timeline
        </Button>
        <Button
          variant={view === 'status' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('status')}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          By Status
        </Button>
        <Button
          variant={view === 'type' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('type')}
        >
          <Target className="w-4 h-4 mr-1" />
          By Type
        </Button>
      </div>

      {view === 'timeline' && dashboard && (
        <div className="space-y-6">
          {/* Critical Path */}
          {dashboard.criticalPath.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Critical Path Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.criticalPath.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      onUpdateProgress={onUpdateProgress}
                      onViewMilestone={onViewMilestone}
                      showCritical
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* This Week */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                This Week (Week {dashboard.currentWeek})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.timeline.thisWeek.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.timeline.thisWeek.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      onUpdateProgress={onUpdateProgress}
                      onViewMilestone={onViewMilestone}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No milestones scheduled for this week
                </p>
              )}
            </CardContent>
          </Card>

          {/* Next Week */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Next Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.timeline.nextWeek.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.timeline.nextWeek.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      onUpdateProgress={onUpdateProgress}
                      onViewMilestone={onViewMilestone}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No milestones scheduled for next week
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Month */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Upcoming Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.timeline.upcomingMonth.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {dashboard.timeline.upcomingMonth.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      onUpdateProgress={onUpdateProgress}
                      onViewMilestone={onViewMilestone}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No milestones scheduled for the upcoming month
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'status' && (
        <div className="space-y-4">
          {Object.entries(['IN_PROGRESS', 'NOT_STARTED', 'DELAYED', 'BLOCKED', 'COMPLETED']).map(([, status]) => {
            const statusMilestones = milestones.filter(m => m.status === status);
            if (statusMilestones.length === 0) return null;

            const StatusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];
            
            return (
              <Card key={status}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}`}>
                    <StatusIcon className="w-5 h-5" />
                    {status.replace('_', ' ')} ({statusMilestones.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statusMilestones.map((milestone) => (
                      <MilestoneCard
                        key={milestone.id}
                        milestone={milestone}
                        onUpdateProgress={onUpdateProgress}
                        onViewMilestone={onViewMilestone}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {view === 'type' && dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(dashboard.byType).map(([type, stats]) => {
            const typeMilestones = milestones.filter(m => m.type === type);
            const TypeIcon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || Target;
            
            return (
              <Card key={type}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TypeIcon className="w-5 h-5" />
                      {type.replace('_', ' ')}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {stats.completed}/{stats.total} completed
                    </div>
                  </div>
                  <Progress 
                    value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} 
                    className="h-2" 
                  />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {typeMilestones.slice(0, 3).map((milestone) => (
                      <MilestoneCard
                        key={milestone.id}
                        milestone={milestone}
                        onUpdateProgress={onUpdateProgress}
                        onViewMilestone={onViewMilestone}
                        compact
                      />
                    ))}
                    {typeMilestones.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{typeMilestones.length - 3} more milestones
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Milestone Card Component
interface MilestoneCardProps {
  milestone: Milestone;
  onUpdateProgress?: (milestoneId: string, progress: number, notes?: string) => void;
  onViewMilestone?: (milestoneId: string) => void;
  showCritical?: boolean;
  compact?: boolean;
}

function MilestoneCard({ 
  milestone, 
  onUpdateProgress, 
  onViewMilestone, 
  showCritical = false,
  compact = false 
}: MilestoneCardProps) {
  const StatusIcon = STATUS_ICONS[milestone.status as keyof typeof STATUS_ICONS];
  const TypeIcon = TYPE_ICONS[milestone.type as keyof typeof TYPE_ICONS] || Target;
  const isOverdue = milestone.status !== 'COMPLETED' && 
                    new Date(milestone.plannedEndDate) < new Date();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`p-4 rounded-lg border ${isOverdue ? 'border-red-200 bg-red-50' : ''} ${showCritical ? 'border-red-300' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-muted-foreground" />
            <StatusIcon className={`w-4 h-4 ${STATUS_COLORS[milestone.status as keyof typeof STATUS_COLORS]}`} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{milestone.title}</h4>
            {!compact && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {milestone.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>
                {formatDate(milestone.plannedStartDate)} - {formatDate(milestone.plannedEndDate)}
              </span>
              {milestone.assignedTo && (
                <span>Assigned to: {milestone.assignedTo}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[milestone.priority as keyof typeof PRIORITY_COLORS]}`} />
          <Badge variant="outline" className="text-xs">
            {milestone.priority}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span>Progress</span>
          <span>{milestone.progressPercentage}%</span>
        </div>
        <Progress value={milestone.progressPercentage} className="h-2" />
      </div>

      {/* Target vs Actual */}
      {milestone.targetValue && (
        <div className="flex items-center justify-between text-xs mt-2">
          <span>Target: {milestone.targetValue}</span>
          {milestone.actualValue && (
            <span className={milestone.actualValue >= milestone.targetValue ? 'text-green-600' : 'text-orange-600'}>
              Actual: {milestone.actualValue}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        {onViewMilestone && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewMilestone(milestone.id)}
            className="text-xs"
          >
            View Details
          </Button>
        )}
        {onUpdateProgress && milestone.status === 'IN_PROGRESS' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const progress = prompt('Enter progress percentage (0-100):', milestone.progressPercentage.toString());
              if (progress && !isNaN(Number(progress))) {
                const progressNum = Math.max(0, Math.min(100, Number(progress)));
                onUpdateProgress(milestone.id, progressNum);
              }
            }}
            className="text-xs"
          >
            Update Progress
          </Button>
        )}
      </div>

      {isOverdue && (
        <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>Overdue</span>
        </div>
      )}
    </div>
  );
}
