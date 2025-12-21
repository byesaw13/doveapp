import { Suspense } from 'react';
import EstimatesClient from './EstimatesClient';

export const metadata = {
  title: 'Estimates - Customer Portal',
  description: 'View and manage your service estimates',
};

export default function EstimatesPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <EstimatesClient />
      </Suspense>
    </div>
  );
}
