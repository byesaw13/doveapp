'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Search, Star, MessageSquare } from 'lucide-react';
import type { JobWithClient } from '@/types/job';

interface CompletedJob extends JobWithClient {
  // Customer-specific view - internal fields removed
}

export default function JobHistoryClient() {
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  useEffect(() => {
    loadJobHistory();
  }, [searchQuery, sortBy]);

  const loadJobHistory = async () => {
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

      // Build query parameters
      const params = new URLSearchParams({
        customer_id: user.id,
        status: 'completed',
      });

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      // Fetch completed jobs for this customer
      const jobsResponse = await fetch(`/api/portal/jobs?${params.toString()}`);
      if (!jobsResponse.ok) {
        throw new Error('Failed to load job history');
      }

      let data = await jobsResponse.json();

      // Sort the data
      if (sortBy === 'date') {
        data.sort(
          (a: any, b: any) =>
            new Date(b.service_date || b.created_at).getTime() -
            new Date(a.service_date || a.created_at).getTime()
        );
      } else if (sortBy === 'amount') {
        data.sort((a: any, b: any) => (b.total || 0) - (a.total || 0));
      }

      setJobs(data);
    } catch (err) {
      console.error('Error loading job history:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load job history'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
            <Button onClick={loadJobHistory} variant="outline">
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
        <h1 className="text-3xl font-bold">Job History</h1>
        <p className="text-gray-500 mt-1">Your completed service history</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
              <Input
                placeholder="Search completed jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={(value: 'date' | 'amount') => setSortBy(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="amount">Sort by Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Services ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No completed jobs</p>
              <p className="text-sm">
                You haven't had any completed services yet.
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
                            <Badge className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                          </div>
                          <p className="text-gray-600">{job.title}</p>
                        </div>
                        {job.total && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              ${job.total.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Job Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        {job.service_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              <span className="font-medium">Completed:</span>{' '}
                              {formatDate(job.service_date)}
                            </span>
                          </div>
                        )}

                        {job.client && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Technician:</span>{' '}
                            {job.client.first_name} {job.client.last_name}
                          </div>
                        )}
                      </div>

                      {/* Job Description */}
                      {job.description && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">Service Summary</h4>
                          <p className="text-sm text-gray-600">
                            {job.description}
                          </p>
                        </div>
                      )}

                      {/* Line Items */}
                      {job.line_items && job.line_items.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">
                            Services Performed
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
                        <Star className="h-4 w-4 mr-2" />
                        Rate Service
                      </Button>
                      <Button className="w-full" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Leave Review
                      </Button>
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
