'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmailReviewPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main emails page since email review is now handled by the intelligence engine
    router.push('/emails');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Email Intelligence Engine
          </h1>
          <p className="text-gray-600 mb-6">
            Email review functionality has been upgraded to our AI-powered Email
            Intelligence Engine. All email processing, categorization, and
            insights are now handled automatically.
          </p>

          <div className="space-y-2 mb-6">
            <p className="text-sm text-gray-500">Features now available:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Automatic AI categorization</li>
              <li>• Structured data extraction</li>
              <li>• Smart alerts and notifications</li>
              <li>• Daily business intelligence summaries</li>
            </ul>
          </div>

          <button
            onClick={() => router.push('/emails')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Go to Emails
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
