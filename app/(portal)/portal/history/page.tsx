import { Suspense } from 'react';
import JobHistoryClient from './JobHistoryClient';

export const metadata = {
  title: 'Job History - Customer Portal',
  description: 'View your completed service history',
};

export default function JobHistoryPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <JobHistoryClient />
      </Suspense>
    </div>
  );
}
