'use client';

import { useState, useEffect, useCallback } from 'react';

interface Visit {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  job: {
    title: string;
    client: {
      first_name: string;
      last_name: string;
      address_line1: string;
      city: string;
      state: string;
      zip_code: string;
      phone: string;
    };
  };
}

export default function TodayVisitsClient() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/tech/today-visits');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setVisits(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch visits');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVisitStatus = useCallback(
    async (
      visitId: string,
      status: 'in_progress' | 'completed',
      notes?: string
    ) => {
      try {
        const response = await fetch(`/api/tech/visits/${visitId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, notes }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        // Refetch visits after successful update
        await fetchVisits();
      } catch (err: any) {
        setError(err.message || 'Failed to update visit');
      }
    },
    [fetchVisits]
  );

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '🔧';
      default:
        return '⏰';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-accent/10 text-accent';
      case 'in_progress':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="bg-card p-4 lg:p-6 rounded-lg border border-border lg:shadow-sm">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card p-4 rounded-lg border border-border shadow-sm animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="bg-card p-4 lg:p-6 rounded-lg border border-border lg:shadow-sm">
          <div className="text-center">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Error Loading Today's Visits
            </h1>
            <p className="text-muted-foreground mt-2">{error}</p>
            <button
              onClick={fetchVisits}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Today's Header */}
      <div className="bg-card p-4 lg:p-6 rounded-lg border border-border lg:shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Today's Visits
            </h1>
            <p className="text-muted-foreground mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {visits.length}
            </div>
            <div className="text-sm text-muted-foreground">
              visits scheduled
            </div>
          </div>
        </div>
      </div>

      {/* Today's Visits List */}
      <div className="space-y-3">
        {visits.length === 0 ? (
          <div className="bg-card p-8 rounded-lg border border-border shadow-sm text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No visits scheduled for today
            </h3>
            <p className="text-muted-foreground">
              Enjoy your day off or check back later for new assignments.
            </p>
          </div>
        ) : (
          visits.map((visit) => (
            <div
              key={visit.id}
              className={`bg-card p-4 rounded-lg border shadow-sm ${
                visit.status === 'in_progress'
                  ? 'border-primary'
                  : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(visit.status)}`}
                  >
                    <span className="text-lg">
                      {getStatusIcon(visit.status)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {visit.job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {visit.job.client.first_name} {visit.job.client.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {visit.job.client.address_line1}, {visit.job.client.city}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`px-2 py-1 text-xs rounded-full font-medium mb-2 ${getStatusColor(visit.status)}`}
                  >
                    {visit.status.replace('_', ' ')}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {new Date(visit.start_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {visit.end_at &&
                      ` - ${new Date(visit.end_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>📞 {visit.job.client.phone || 'No phone'}</span>
                </div>
                <div className="flex gap-2">
                  {visit.status === 'scheduled' && (
                    <button
                      className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
                      onClick={() => updateVisitStatus(visit.id, 'in_progress')}
                    >
                      Start Visit
                    </button>
                  )}
                  {visit.status === 'in_progress' && (
                    <button
                      className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded-lg hover:bg-accent/90 transition-colors"
                      onClick={() => updateVisitStatus(visit.id, 'completed')}
                    >
                      Complete Visit
                    </button>
                  )}
                  <button className="text-primary hover:text-primary/80 text-sm font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-card p-4 rounded-lg border border-border shadow-sm lg:hidden">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Today's Summary
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-accent">
              {visits.filter((v) => v.status === 'completed').length}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {visits.filter((v) => v.status === 'in_progress').length}
            </div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-muted-foreground">
              {visits.filter((v) => v.status === 'scheduled').length}
            </div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
}
