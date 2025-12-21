'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Phone } from 'lucide-react';
import type { JobWithClient, JobLineItem } from '@/types/job';

interface UpcomingJob extends JobWithClient {
  line_items?: JobLineItem[];
  // Customer-specific view - internal fields removed
}

export default function UpcomingJobsClient() {
  const [jobs, setJobs] = useState<UpcomingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUpcomingJobs();
  }, []);

  const loadUpcomingJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user to use as customer_id
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        throw new Error('Failed to get user information');
      }

      const { user } = await response.json();

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Fetch upcoming jobs for this customer
      const jobsResponse = await fetch(
        `/api/portal/jobs?customer_id=${user.id}&status=scheduled&status=in_progress`
      );
      if (!jobsResponse.ok) {
        throw new Error('Failed to load upcoming jobs');
      }

      const data = await jobsResponse.json();
      setJobs(data);
    } catch (err) {
      console.error('Error loading upcoming jobs:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load upcoming jobs'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status.replace('_', ' ');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p className="mb-4">{error}</p>
            <Button onClick={loadUpcomingJobs} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Upcoming Jobs</h1>
        <p className="text-gray-500 mt-1">
          Your scheduled and in-progress service appointments
        </p>
      </div>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Upcoming Services ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No upcoming jobs</p>
              <p className="text-sm">
                You don't have any scheduled or in-progress services at the
                moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border rounded-lg p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Job Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">
                              {job.job_number || job.title}
                            </h3>
                            <Badge className={getStatusColor(job.status)}>
                              {getStatusLabel(job.status)}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{job.title}</p>
                        </div>
                        {job.total && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              ${job.total.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Job Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {job.service_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <span className="font-medium">Service Date:</span>{' '}
                              {new Date(job.service_date).toLocaleDateString(
                                'en-US',
                                {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        )}

                        {job.scheduled_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <span className="font-medium">Time:</span>{' '}
                              {job.scheduled_time}
                            </span>
                          </div>
                        )}

                        {job.client && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <span className="font-medium">Technician:</span>{' '}
                              {job.client.first_name} {job.client.last_name}
                            </span>
                          </div>
                        )}

                        {job.client?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <span className="font-medium">Contact:</span>{' '}
                              {job.client.phone}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Job Description */}
                      {job.description && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">Service Details</h4>
                          <p className="text-sm text-gray-600">
                            {job.description}
                          </p>
                        </div>
                      )}

                      {/* Line Items */}
                      {job.line_items && job.line_items.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">
                            Services Included
                          </h4>
                          <div className="space-y-2">
                            {job.line_items.map((item: any, index: number) => (
                              <div
                                key={index}
                                className="flex justify-between text-sm"
                              >
                                <span>{item.description}</span>
                                <span className="font-medium">
                                  ${item.total?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      <Button className="w-full" variant="outline">
                        View Details
                      </Button>
                      <Button className="w-full" variant="outline">
                        Contact Tech
                      </Button>
                      {job.status === 'scheduled' && (
                        <Button className="w-full" variant="outline">
                          Reschedule
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
