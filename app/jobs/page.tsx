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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Jobs</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage jobs and use templates for quick creation
          </p>
        </div>
        <Link href="/jobs/new">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Jobs</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {jobs.length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Scheduled</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {jobs.filter((j) => j.status === 'scheduled').length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {jobs.filter((j) => j.status === 'in_progress').length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Completed</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {jobs.filter((j) => j.status === 'completed').length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger
            value="jobs"
            className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
          >
            <Briefcase className="w-4 h-4" />
            All Jobs
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
          >
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">All Jobs</h2>
              <p className="text-sm text-slate-600 mt-1">
                View and manage all service jobs
              </p>
            </div>
            <div className="p-6">
              <JobTable
                jobs={jobs}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <JobTemplates />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
