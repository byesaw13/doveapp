'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export default function EstimateChangesRequestedPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/estimates');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <MessageSquare className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Changes Requested
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your feedback. We'll review your requested changes and
            get back to you soon.
          </p>
          <Button onClick={() => router.push('/estimates')}>
            Back to Estimates
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Redirecting in 5 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
