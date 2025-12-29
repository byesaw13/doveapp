import { redirect } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/featureFlags';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isFeatureEnabled('CUSTOMER_PORTAL')) {
    redirect('/auth/login');
  }

  return <>{children}</>;
}
