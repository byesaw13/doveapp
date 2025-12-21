'use client';

import { CustomerAnalyticsDashboard } from '@/components/admin/customer-analytics-dashboard';

export default function CustomerAnalyticsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <CustomerAnalyticsDashboard />
      </div>
    </div>
  );
}
