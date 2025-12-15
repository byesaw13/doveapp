import { Suspense } from 'react';

// Import the main KPI page component
import dynamic from 'next/dynamic';

const KPIPage = dynamic(() => import('../../(main)/kpi/page'), {
  loading: () => <div>Loading KPI...</div>,
});

export default function AdminKPIPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KPIPage />
    </Suspense>
  );
}
