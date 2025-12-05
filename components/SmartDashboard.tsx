'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Briefcase,
  Target,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { getSmartNotifications, getPendingTasks } from '@/lib/db/activities';

interface SmartInsight {
  type: 'revenue' | 'clients' | 'jobs' | 'efficiency';
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  description: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  link?: string;
}

export function SmartDashboard() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSmartData();
  }, []);

  const loadSmartData = async () => {
    try {
      setLoading(true);

      // Load notifications and tasks
      const [notificationsData, tasksData] = await Promise.all([
        getSmartNotifications(),
        getPendingTasks(),
      ]);

      setNotifications(notificationsData);
      setPendingTasks(tasksData);

      // Generate insights (simplified for now - in real app, this would analyze historical data)
      const mockInsights: SmartInsight[] = [
        {
          type: 'revenue',
          title: 'Revenue Forecast',
          value: '$12,450',
          change: 8.5,
          trend: 'up',
          description: 'Projected for next month based on current pipeline',
        },
        {
          type: 'clients',
          title: 'Client Retention',
          value: '94%',
          change: 2.1,
          trend: 'up',
          description: 'Based on repeat business and satisfaction surveys',
        },
        {
          type: 'jobs',
          title: 'Job Completion Rate',
          value: '87%',
          change: -1.2,
          trend: 'down',
          description: 'On-time completion rate this month',
        },
        {
          type: 'efficiency',
          title: 'Team Productivity',
          value: '112%',
          change: 5.3,
          trend: 'up',
          description: 'Revenue per technician hour',
        },
      ];

      setInsights(mockInsights);

      // Generate recommendations
      const mockRecommendations: Recommendation[] = [
        {
          id: '1',
          title: 'Schedule maintenance for 3 clients',
          description: 'Clients due for seasonal maintenance services',
          priority: 'high',
          action: 'View Clients',
          link: '/clients',
        },
        {
          id: '2',
          title: 'Follow up on 5 pending estimates',
          description: 'Estimates sent over 7 days ago need follow-up',
          priority: 'high',
          action: 'View Estimates',
          link: '/estimates',
        },
        {
          id: '3',
          title: 'Consider raising landscaping prices',
          description: 'Demand is high and competition is low',
          priority: 'medium',
          action: 'Review Pricing',
          link: '/estimates',
        },
        {
          id: '4',
          title: 'Hire additional technician',
          description: 'Current workload suggests need for more staff',
          priority: 'medium',
          action: 'View Jobs',
          link: '/jobs',
        },
      ];

      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error('Failed to load smart dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount.replace('$', '').replace(',', ''));
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Smart Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {insights.map((insight, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                {getTrendIcon(insight.trend)}
                {insight.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {insight.type === 'revenue'
                    ? formatCurrency(insight.value)
                    : insight.value}
                </span>
                <span
                  className={`text-sm font-medium ${
                    insight.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {insight.change > 0 ? '+' : ''}
                  {insight.change}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {insight.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notifications & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Smart Notifications
            </CardTitle>
            <CardDescription>Important updates and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>All caught up! No notifications at this time.</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    notification.type === 'urgent'
                      ? 'bg-red-50 border-red-200'
                      : notification.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {notification.message}
                      </p>
                      {notification.action && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-7 text-xs"
                          onClick={() => {
                            if (notification.link) {
                              window.location.href = notification.link;
                            }
                          }}
                        >
                          {notification.action}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Pending Tasks
            </CardTitle>
            <CardDescription>
              Automated workflow tasks to complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No pending tasks! All workflows are up to date.</p>
              </div>
            ) : (
              pendingTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {pendingTasks.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  View All Tasks ({pendingTasks.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Recommendations
          </CardTitle>
          <CardDescription>
            Smart suggestions to improve your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getPriorityColor(rec.priority)}`}
                  >
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {
                    if (rec.link) {
                      window.location.href = rec.link;
                    }
                  }}
                >
                  {rec.action}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
