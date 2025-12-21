'use client';

import { JobWorkflowsManager } from '@/components/admin/job-workflows-manager';

export default function JobWorkflowsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <JobWorkflowsManager />
      </div>
    </div>
  );
}
