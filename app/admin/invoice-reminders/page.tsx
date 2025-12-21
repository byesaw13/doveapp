'use client';

import { InvoiceRemindersManager } from '@/components/admin/invoice-reminders-manager';

export default function InvoiceRemindersPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <InvoiceRemindersManager />
      </div>
    </div>
  );
}
