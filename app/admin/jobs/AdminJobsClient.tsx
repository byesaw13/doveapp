'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { JobWithClient, JobStatus } from '@/types/job';
import {
  Search,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { CachedAPI, CACHE_KEYS, CACHE_TAGS } from '@/lib/cache';

const statusColors: Record<JobStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  quote: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  invoiced: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<JobStatus, string> = {
  draft: 'Draft',
  quote: 'Quote',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  invoiced: 'Invoiced',
  cancelled: 'Cancelled',
};

export default function AdminJobsClient() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');

  useEffect(() => {
    loadJobs();
  }, [statusFilter, searchQuery]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const filters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      };

      // Use cached API with automatic cache key generation
      const data = await CachedAPI.get(
        CACHE_KEYS.JOBS_LIST('admin-account', filters),
        async () => {
          const response = await fetch(`/api/admin/jobs?${params.toString()}`);
          if (!response.ok) {
            throw new Error('Failed to load jobs');
          }
          return response.json();
        },
        {
          ttl: 2 * 60 * 1000, // 2 minutes cache
          tags: [CACHE_TAGS.JOBS],
        }
      );

      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      // Invalidate jobs cache since data changed
      CachedAPI.invalidateByTag(CACHE_TAGS.JOBS);

      // Reload jobs to reflect changes
      loadJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const filteredJobs = jobs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-gray-500 mt-1">Manage all jobs in your account</p>
        </div>
        <Link href="/jobs/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <label htmlFor="job-search" className="sr-only">
                  Search jobs
                </label>
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
                <Input
                  id="job-search"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-describedby="job-search-help"
                />
                <span id="job-search-help" className="sr-only">
                  Search by job title, number, or client name
                </span>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as JobStatus | 'all')
                }
              >
                <SelectTrigger
                  className="w-full sm:w-[200px]"
                  aria-label="Filter jobs by status"
                >
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="quote">Quote</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>All Jobs ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No jobs found.</p>
              <Link href="/jobs/new">
                <Button className="mt-4">Create your first job</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 touch-manipulation min-h-[120px]"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/jobs/${job.id}`);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for job ${job.job_number || job.title}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">
                          {job.job_number || job.title}
                        </h3>
                        <Badge
                          className={`${statusColors[job.status]} self-start`}
                        >
                          {statusLabels[job.status]}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {job.title}
                      </p>
                      <div className="flex flex-wrap gap-3 sm:gap-4 text-sm text-gray-500">
                        {job.client && (
                          <div className="flex items-center gap-1 min-w-0">
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {job.client.first_name} {job.client.last_name}
                            </span>
                          </div>
                        )}
                        {job.service_date && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Calendar className="h-4 w-4" />
                            <span className="whitespace-nowrap">
                              {new Date(job.service_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {job.total && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="font-semibold">
                              ${job.total.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Select
                        value={job.status}
                        onValueChange={(value) =>
                          handleStatusChange(job.id, value as JobStatus)
                        }
                      >
                        <SelectTrigger
                          className="w-full sm:w-[140px] min-h-[44px]"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Change status for job ${job.job_number || job.title}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="quote">Quote</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="invoiced">Invoiced</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
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
