'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Visit {
  id: string;
  start_at: string;
  end_at: string | null;
  status: string;
  job: {
    title: string;
    client: {
      first_name: string;
      last_name: string;
    };
  };
}

interface ScheduleData {
  [date: string]: Visit[];
}

export default function ScheduleClient() {
  const [schedule, setSchedule] = useState<ScheduleData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/tech/schedule');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const grouped = groupVisitsByDate(data.data || []);
      setSchedule(grouped);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  };

  const groupVisitsByDate = (visits: Visit[]): ScheduleData => {
    const grouped: ScheduleData = {};
    visits.forEach((visit) => {
      const date = new Date(visit.start_at).toDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(visit);
    });
    return grouped;
  };

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Schedule</h1>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">
              Error Loading Schedule
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchSchedule}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dates = Object.keys(schedule).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <Button onClick={fetchSchedule} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {dates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold mb-2">No upcoming visits</h3>
            <p className="text-muted-foreground">
              Your schedule is currently empty. Check back later for new
              assignments.
            </p>
          </CardContent>
        </Card>
      ) : (
        dates.map((date) => {
          const visits = schedule[date];
          const isExpanded = expandedDays.has(date);
          const dayName = new Date(date).toLocaleDateString([], {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          });

          return (
            <Card key={date}>
              <CardHeader
                className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleDay(date)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{dayName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {visits.length} visit{visits.length !== 1 ? 's' : ''}
                    </Badge>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="pt-0 space-y-3">
                  {visits.map((visit) => (
                    <div
                      key={visit.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <Badge className={getStatusColor(visit.status)}>
                          {visit.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1">
                          {visit.job.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {visit.job.client.first_name}{' '}
                          {visit.job.client.last_name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(visit.start_at)}
                            {visit.end_at && ` - ${formatTime(visit.end_at)}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
