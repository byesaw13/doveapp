'use client';

import { BusinessIntelligenceDashboard } from '@/components/admin/business-intelligence-dashboard';

export default function BusinessIntelligencePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <BusinessIntelligenceDashboard />
      </div>
    </div>
  );
}
