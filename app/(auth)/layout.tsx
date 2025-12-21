import { ToastProvider } from '@/components/ui/toast';

export const dynamic = 'force-dynamic';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">{children}</div>
    </ToastProvider>
  );
}
