'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.98-5.625-2.508M12 7v8m0 0l-3-3m3 3l3-3"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Page not found
            </h2>
            <p className="text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="inline-block w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors text-center"
            >
              Go home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Go back
            </button>
          </div>

          <div className="mt-8 text-sm text-muted-foreground">
            <p>If you believe this is an error, please contact support.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
