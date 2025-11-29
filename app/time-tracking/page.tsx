'use client';

import { TimeTrackingDashboard } from './components/TimeTrackingDashboard';

export default function TimeTrackingPage() {
  return (
    <div className="container mx-auto p-6">
      <TimeTrackingDashboard technicianName="Demo Technician" />
    </div>
  );
}
