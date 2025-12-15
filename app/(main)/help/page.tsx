export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Help & Documentation
          </h1>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Getting Started
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 mb-4">
                  Welcome to DoveApp! This field service management system helps
                  you manage clients, jobs, estimates, and invoices.
                </p>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Quick Start Guide
                </h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-2">
                  <li>Create your first client in the Clients section</li>
                  <li>Add a job for that client</li>
                  <li>Generate an estimate using our AI-powered tools</li>
                  <li>Track payments and generate invoices</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Keyboard Shortcuts
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Navigation
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          Alt
                        </kbd>{' '}
                        +{' '}
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          D
                        </kbd>{' '}
                        - Dashboard
                      </li>
                      <li>
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          Alt
                        </kbd>{' '}
                        +{' '}
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          J
                        </kbd>{' '}
                        - Jobs
                      </li>
                      <li>
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          Alt
                        </kbd>{' '}
                        +{' '}
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          C
                        </kbd>{' '}
                        - Clients
                      </li>
                      <li>
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          Alt
                        </kbd>{' '}
                        +{' '}
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          E
                        </kbd>{' '}
                        - Estimates
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          Ctrl
                        </kbd>{' '}
                        +{' '}
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          N
                        </kbd>{' '}
                        - New item
                      </li>
                      <li>
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          Ctrl
                        </kbd>{' '}
                        +{' '}
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          /
                        </kbd>{' '}
                        - Focus search
                      </li>
                      <li>
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                          Esc
                        </kbd>{' '}
                        - Close dialogs
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    AI-Powered Estimates
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Use our AI tools to generate accurate estimates from photos
                    and descriptions.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">
                    Advanced Filtering
                  </h3>
                  <p className="text-green-700 text-sm">
                    Filter jobs, estimates, and invoices by date, amount,
                    status, and client.
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">
                    Bulk Operations
                  </h3>
                  <p className="text-purple-700 text-sm">
                    Select multiple items to perform batch actions like status
                    updates or deletion.
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-medium text-orange-900 mb-2">
                    Real-time Sync
                  </h3>
                  <p className="text-orange-700 text-sm">
                    Changes sync across devices with offline support for field
                    work.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Troubleshooting
              </h2>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Images not loading?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Check your internet connection. Images are optimized and
                    cached for better performance.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Filters not working?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Try clearing all filters using the "Clear All" button in the
                    advanced filters dialog.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
