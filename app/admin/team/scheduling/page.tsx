import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TeamScheduling } from '@/components/admin/TeamScheduling';

export const metadata: Metadata = {
  title: 'Team Scheduling - Admin Portal',
  description: 'Manage team schedules, availability, and job assignments',
};

export default function TeamSchedulingPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <TeamScheduling />
      </Suspense>
    </div>
  );
}
