
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  MapPin,
  AlertTriangle,
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-treehub-industrial-gray">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-treehub-safety-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  const stats = [
    {
      title: 'Active Jobs',
      value: '12',
      change: '+2 this week',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Earnings',
      value: '$15,450',
      change: '+$2,300 this month',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Profile Views',
      value: '342',
      change: '+15% this week',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Rating',
      value: '4.8',
      change: 'Based on 127 reviews',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  const recentJobs = [
    {
      title: 'Emergency Tree Removal - Hurricane Damage',
      location: 'Houston, TX',
      budget: '$2,500',
      priority: 'Emergency',
      postedTime: '2 hours ago',
      status: 'pending',
    },
    {
      title: 'Residential Tree Pruning Service',
      location: 'Austin, TX',
      budget: '$800',
      priority: 'Normal',
      postedTime: '1 day ago',
      status: 'bidding',
    },
    {
      title: 'Commercial Lot Clearing Project',
      location: 'Dallas, TX',
      budget: '$5,200',
      priority: 'High',
      postedTime: '3 days ago',
      status: 'in_progress',
    },
  ];

  const recentActivity = [
    {
      type: 'bid_submitted',
      title: 'Bid submitted for Oak Tree Removal',
      time: '1 hour ago',
      icon: CheckCircle,
    },
    {
      type: 'job_completed',
      title: 'Completed: Residential Pruning Service',
      time: '2 days ago',
      icon: CheckCircle,
    },
    {
      type: 'payment_received',
      title: 'Payment received: $1,200',
      time: '3 days ago',
      icon: DollarSign,
    },
  ];

  return (
    <div className="min-h-screen bg-treehub-industrial-gray">
      <div className="flex">
        <Sidebar userRole={session.user?.role} />
        
        <div className="flex-1 ml-64">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-heading font-bold text-treehub-forest-green mb-2">
                Welcome back, {session.user?.firstName || 'Professional'}!
              </h1>
              <p className="text-gray-600">
                Here's what's happening with your TreeHub account today.
              </p>
            </div>

            {/* Emergency Alert */}
            <Alert variant="emergency" className="mb-8">
              <AlertTriangle className="h-4 w-4" />
              <div>
                <h3 className="font-medium">Storm Alert - High Priority Jobs Available</h3>
                <p className="text-sm mt-1">
                  Severe weather is forecasted for your area. Emergency tree removal jobs are now available.
                </p>
              </div>
            </Alert>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                          <IconComponent className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold text-treehub-forest-green">{stat.value}</p>
                          <p className="text-xs text-gray-500">{stat.change}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Recent Job Opportunities
                    <Button variant="ghost" size="sm">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Latest jobs matching your skills and location
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentJobs.map((job, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-treehub-forest-green">{job.title}</h4>
                          <Badge variant={job.priority === 'Emergency' ? 'emergency' : 'verified'}>
                            {job.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 space-x-4 mb-2">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {job.budget}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {job.postedTime}
                          </div>
                        </div>
                        <Button size="sm" className="w-full">
                          View Details & Bid
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest actions and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => {
                      const IconComponent = activity.icon;
                      return (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="p-2 bg-treehub-safety-orange-100 rounded-full">
                            <IconComponent className="h-4 w-4 text-treehub-safety-orange" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View All Activity
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-16 flex-col">
                    <Users className="h-5 w-5 mb-1" />
                    Update Profile
                  </Button>
                  <Button variant="outline" className="h-16 flex-col">
                    <Briefcase className="h-5 w-5 mb-1" />
                    Browse Jobs
                  </Button>
                  <Button variant="outline" className="h-16 flex-col">
                    <TrendingUp className="h-5 w-5 mb-1" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
