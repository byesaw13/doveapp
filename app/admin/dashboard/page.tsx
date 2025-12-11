export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your field operations and business metrics
        </p>
      </div>

      {/* Key Metrics - Housecall Pro Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Jobs Today
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">8</p>
              <p className="text-xs text-muted-foreground mt-1">
                4 completed, 4 pending
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-primary text-xl">🔧</span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Technicians
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">6</p>
              <p className="text-xs text-muted-foreground mt-1">
                3 on jobs, 3 available
              </p>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <span className="text-accent text-xl">👷</span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Revenue This Week
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">$12,450</p>
              <p className="text-xs text-accent mt-1">+15% from last week</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Customer Satisfaction
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">4.8</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on 24 reviews
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 text-xl">⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Jobs */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Today's Jobs
            </h2>
            <a
              href="/admin/schedule"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View Schedule →
            </a>
          </div>

          <div className="space-y-3">
            {[
              {
                time: '9:00 AM',
                customer: 'Smith Residence',
                service: 'HVAC Repair',
                status: 'completed',
                tech: 'Mike J.',
              },
              {
                time: '11:30 AM',
                customer: 'Johnson Office',
                service: 'Plumbing',
                status: 'in_progress',
                tech: 'Sarah W.',
              },
              {
                time: '2:00 PM',
                customer: 'Davis Home',
                service: 'Electrical',
                status: 'scheduled',
                tech: 'Tom R.',
              },
              {
                time: '4:30 PM',
                customer: 'Wilson Building',
                service: 'Maintenance',
                status: 'scheduled',
                tech: 'Lisa M.',
              },
            ].map((job, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-foreground w-16">
                    {job.time}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {job.customer}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {job.service} • {job.tech}
                    </div>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === 'completed'
                      ? 'bg-accent/10 text-accent'
                      : job.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {job.status.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Recent Activity
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mt-0.5">
                <span className="text-accent text-sm">✓</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Job completed by Mike Johnson
                </p>
                <p className="text-xs text-muted-foreground">
                  Smith Residence - HVAC Repair • 15 min ago
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-0.5">
                <span className="text-primary text-sm">🚗</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Sarah Wilson en route to Johnson Office
                </p>
                <p className="text-xs text-muted-foreground">
                  Plumbing service • 32 min ago
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-sm">💰</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Payment received from Davis Home
                </p>
                <p className="text-xs text-muted-foreground">
                  $285.00 • Electrical service • 1 hour ago
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
                <span className="text-blue-600 text-sm">📝</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  New job scheduled for Wilson Building
                </p>
                <p className="text-xs text-muted-foreground">
                  Maintenance service • Tomorrow 9:00 AM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/jobs/new"
            className="flex flex-col items-center p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
          >
            <span className="text-2xl mb-2">➕</span>
            <span className="text-sm font-medium text-foreground">New Job</span>
          </a>

          <a
            href="/admin/schedule"
            className="flex flex-col items-center p-4 bg-accent/5 hover:bg-accent/10 rounded-lg transition-colors border border-accent/20"
          >
            <span className="text-2xl mb-2">📅</span>
            <span className="text-sm font-medium text-foreground">
              View Schedule
            </span>
          </a>

          <a
            href="/admin/customers"
            className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            <span className="text-2xl mb-2">👥</span>
            <span className="text-sm font-medium text-foreground">
              Add Customer
            </span>
          </a>

          <a
            href="/admin/team"
            className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
          >
            <span className="text-2xl mb-2">👷</span>
            <span className="text-sm font-medium text-foreground">
              Manage Team
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
