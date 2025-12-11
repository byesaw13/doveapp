export default function PortalHome() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, John
            </h1>
            <p className="text-muted-foreground mt-2">
              Here's what's happening with your service requests
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Account Status</div>
            <div className="text-lg font-semibold text-accent">
              Active Customer
            </div>
          </div>
        </div>
      </div>

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
              <span className="font-medium text-foreground">
                Tomorrow, 2:00 PM
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Technician:</span>
              <span className="font-medium text-foreground">Mike Johnson</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Address:</span>
              <span className="font-medium text-foreground">123 Main St</span>
            </div>
          </div>
          <button className="w-full mt-4 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
            View Details
          </button>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-xl">💰</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Outstanding Balance
              </h3>
              <p className="text-sm text-muted-foreground">2 unpaid invoices</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600 mb-4">$485.00</div>
          <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
            Pay Now
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <span className="text-accent text-xl">📋</span>
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
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium text-foreground">
                Plumbing Repair
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium text-foreground">Dec 8, 2024</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium text-foreground">$245.00</span>
            </div>
          </div>
          <button className="w-full mt-4 bg-accent text-accent-foreground py-2 px-4 rounded-lg hover:bg-accent/90 transition-colors">
            View History
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Need Service?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-6 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200">
            <span className="text-3xl mb-3">🚨</span>
            <span className="font-semibold text-red-800">Emergency</span>
            <span className="text-sm text-red-600 mt-1">24/7 service</span>
          </button>

          <button className="flex flex-col items-center p-6 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors border border-primary/20">
            <span className="text-3xl mb-3">📅</span>
            <span className="font-semibold text-primary">Schedule Service</span>
            <span className="text-sm text-primary/70 mt-1">
              Book appointment
            </span>
          </button>

          <button className="flex flex-col items-center p-6 bg-accent/5 hover:bg-accent/10 rounded-lg transition-colors border border-accent/20">
            <span className="text-3xl mb-3">📋</span>
            <span className="font-semibold text-accent">Request Estimate</span>
            <span className="text-sm text-accent/70 mt-1">Get a quote</span>
          </button>

          <button className="flex flex-col items-center p-6 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
            <span className="text-3xl mb-3">💬</span>
            <span className="font-semibold text-blue-800">Contact Us</span>
            <span className="text-sm text-blue-600 mt-1">Questions?</span>
          </button>
        </div>
      </div>

      {/* Recent Estimates/Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Estimates */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Recent Estimates
            </h2>
            <a
              href="/portal/estimates"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All →
            </a>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  HVAC System Replacement
                </div>
                <div className="text-sm text-muted-foreground">
                  Estimate #EST-2024-001
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">$4,250.00</div>
                <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Pending Approval
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  Kitchen Plumbing Update
                </div>
                <div className="text-sm text-muted-foreground">
                  Estimate #EST-2024-002
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">$1,850.00</div>
                <div className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                  Approved
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Recent Invoices
            </h2>
            <a
              href="/portal/invoices"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All →
            </a>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  Plumbing Repair Service
                </div>
                <div className="text-sm text-muted-foreground">
                  Invoice #INV-2024-015
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">$245.00</div>
                <div className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                  Unpaid
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  Electrical Inspection
                </div>
                <div className="text-sm text-muted-foreground">
                  Invoice #INV-2024-014
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">$125.00</div>
                <div className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                  Paid
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
