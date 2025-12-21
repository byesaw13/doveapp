import { Suspense } from 'react';
import InvoicesClient from './InvoicesClient';

export const metadata = {
  title: 'Invoices - Customer Portal',
  description: 'View and pay your service invoices',
};

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <InvoicesClient />
      </Suspense>
    </div>
  );
}
