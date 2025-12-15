import { Suspense } from 'react';
import type { Metadata } from 'next';
import AdminCustomersClient from './AdminCustomersClient';

export const metadata: Metadata = {
  title: 'Customers - Admin Portal',
  description: 'Manage all customers in your account',
};

export default function AdminCustomersPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <AdminCustomersClient />
      </Suspense>
    </div>
  );
}
