import { Suspense } from 'react';
import PortalHomeClient from './PortalHomeClient';

export const metadata = {
  title: 'Dashboard - Customer Portal',
  description: 'Your service dashboard and account overview',
};

export default function PortalHome() {
  return (
    <>
      <Suspense
        fallback={
          <div className="space-y-6">
            {/* Loading skeleton */}
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-96"></div>
                </div>
                <div className="text-right">
                  <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <PortalHomeClient />
      </Suspense>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Service */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-primary text-xl">📅</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Next Service</h3>
              <p className="text-sm text-muted-foreground">HVAC Maintenance</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium text-foreground">Dec 15, 2025</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium text-foreground">9:00 AM</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Technician:</span>
              <span className="font-medium text-foreground">Mike Johnson</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">
                Last service completed
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium text-foreground">Dec 1, 2025</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium text-foreground">
                Plumbing Repair
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium text-green-600">Completed</span>
            </div>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">$</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Outstanding Balance
              </h3>
              <p className="text-sm text-muted-foreground">Amount due</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-foreground">$125.00</div>
            <div className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
              Paid
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
