'use client';

import { JobTemplatesManager } from '@/components/admin/job-templates-manager';

export default function JobTemplatesPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <JobTemplatesManager />
      </div>
    </div>
  );
}
