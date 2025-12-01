'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobTable } from './components/JobTable';
import { JobTemplates } from './components/JobTemplates';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { getJobs, deleteJob, updateJob } from '@/lib/db/jobs';
import type { JobWithClient } from '@/types/job';
import { Briefcase, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');

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

  const handleStatusChange = async (
    jobId: string,
    newStatus: JobWithClient['status']
  ) => {
    try {
      await updateJob(jobId, { status: newStatus });
      await loadJobs(); // Refresh the list
    } catch (error) {
      console.error('Failed to update job status:', error);
      alert('Failed to update job status. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">
            Manage jobs and use templates for quick creation
          </p>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            All Jobs
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Jobs</CardTitle>
              <CardDescription>
                View and manage all service jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobTable
                jobs={jobs}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
                onStatusChange={handleStatusChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <JobTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
}
