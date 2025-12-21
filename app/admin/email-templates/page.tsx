'use client';

import { EmailTemplatesManager } from '@/components/admin/email-templates-manager';

export default function EmailTemplatesPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <EmailTemplatesManager />
      </div>
    </div>
  );
}
