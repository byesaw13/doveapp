'use client';

import { useState, useEffect } from 'react';
import { JobTable } from './components/JobTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getJobs, deleteJob } from '@/lib/db/jobs';
import type { JobWithClient } from '@/types/job';
import Link from 'next/link';

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await getJobs();
      setJobs(data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      alert('Failed to load jobs. Please check your database configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (job: JobWithClient) => {
    // Navigate to job details page (to be built)
    window.location.href = `/jobs/${job.id}`;
  };

  const handleEdit = (job: JobWithClient) => {
    // Navigate to edit page (to be built)
    window.location.href = `/jobs/${job.id}/edit`;
  };

  const handleDelete = async (job: JobWithClient) => {
    if (!confirm(`Are you sure you want to delete job ${job.job_number}?`)) {
      return;
    }

    try {
      await deleteJob(job.id);
      await loadJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Jobs</CardTitle>
          <div className="flex gap-2">
            <Link href="/clients">
              <Button variant="outline">View Clients</Button>
            </Link>
            <Link href="/jobs/new">
              <Button>Create Job</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <JobTable
            jobs={jobs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
          />
        </CardContent>
      </Card>
    </div>
  );
}
