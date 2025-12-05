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
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Jobs</h1>
            <p className="mt-2 text-emerald-100">
              Manage jobs and use templates for quick creation
            </p>
          </div>
          <Link href="/jobs/new">
            <button className="px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold rounded-lg shadow-md transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
              <Plus className="w-4 h-4 mr-2 inline" />
              New Job
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Total Jobs
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {jobs.length}
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Scheduled
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {jobs.filter((j) => j.status === 'scheduled').length}
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <svg
                className="h-7 w-7 text-white"
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

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                In Progress
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {jobs.filter((j) => j.status === 'in_progress').length}
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
              <svg
                className="h-7 w-7 text-white"
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

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Completed
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {jobs.filter((j) => j.status === 'completed').length}
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <svg
                className="h-7 w-7 text-white"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-3 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'jobs'
                  ? 'text-emerald-700 border-b-2 border-emerald-500 bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              All Jobs
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-3 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'templates'
                  ? 'text-emerald-700 border-b-2 border-emerald-500 bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-5 h-5" />
              Templates
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'jobs' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">All Jobs</h2>
                <p className="text-sm text-slate-600 mt-1">
                  View and manage all service jobs
                </p>
              </div>
              <JobTable
                jobs={jobs}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}

          {activeTab === 'templates' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Job Templates
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Create and manage reusable job templates
                </p>
              </div>
              <JobTemplates />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
