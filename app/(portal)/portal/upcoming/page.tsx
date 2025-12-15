import { Suspense } from 'react';
import UpcomingJobsClient from './UpcomingJobsClient';

export const metadata = {
  title: 'Upcoming Jobs - Customer Portal',
  description: 'View your upcoming service appointments',
};

export default function UpcomingJobsPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <UpcomingJobsClient />
      </Suspense>
    </div>
  );
}
