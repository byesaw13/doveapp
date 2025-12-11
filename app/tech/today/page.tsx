export default function TechToday() {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Today's Header */}
      <div className="bg-card p-4 lg:p-6 rounded-lg border border-border lg:shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Today's Jobs
            </h1>
            <p className="text-muted-foreground mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">4</div>
            <div className="text-sm text-muted-foreground">jobs scheduled</div>
          </div>
        </div>
      </div>

      {/* Today's Jobs List - Mobile-first design */}
      <div className="space-y-3">
        {/* Job 1 - Completed */}
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <span className="text-accent text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  HVAC Maintenance
                </h3>
                <p className="text-sm text-muted-foreground">Smith Residence</p>
                <p className="text-xs text-muted-foreground">
                  123 Main St, Springfield
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full font-medium mb-2">
                Completed
              </div>
              <div className="text-sm font-medium text-foreground">9:00 AM</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>📞 (555) 123-4567</span>
              <span>💰 $185.00</span>
            </div>
            <button className="text-primary hover:text-primary/80 text-sm font-medium">
              View Details →
            </button>
          </div>
        </div>

        {/* Job 2 - In Progress */}
        <div className="bg-card p-4 rounded-lg border border-primary shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary text-lg">🔧</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Plumbing Repair
                </h3>
                <p className="text-sm text-muted-foreground">
                  Johnson Office Building
                </p>
                <p className="text-xs text-muted-foreground">
                  456 Oak Ave, Springfield
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium mb-2">
                On Site
              </div>
              <div className="text-sm font-medium text-foreground">
                11:30 AM
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>📞 (555) 234-5678</span>
              <span>💰 $245.00</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded-lg hover:bg-accent/90 transition-colors">
                Complete Job
              </button>
              <button className="text-primary hover:text-primary/80 text-sm font-medium">
                View Details →
              </button>
            </div>
          </div>
        </div>

        {/* Job 3 - Scheduled */}
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground text-lg">⏰</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Electrical Inspection
                </h3>
                <p className="text-sm text-muted-foreground">Davis Home</p>
                <p className="text-xs text-muted-foreground">
                  789 Pine St, Springfield
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium mb-2">
                Scheduled
              </div>
              <div className="text-sm font-medium text-foreground">2:00 PM</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>📞 (555) 345-6789</span>
              <span>💰 $125.00</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors">
                Start Route
              </button>
              <button className="text-primary hover:text-primary/80 text-sm font-medium">
                View Details →
              </button>
            </div>
          </div>
        </div>

        {/* Job 4 - Scheduled */}
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground text-lg">⏰</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  General Maintenance
                </h3>
                <p className="text-sm text-muted-foreground">Wilson Building</p>
                <p className="text-xs text-muted-foreground">
                  321 Elm St, Springfield
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium mb-2">
                Scheduled
              </div>
              <div className="text-sm font-medium text-foreground">4:30 PM</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>📞 (555) 456-7890</span>
              <span>💰 $95.00</span>
            </div>
            <button className="text-primary hover:text-primary/80 text-sm font-medium">
              View Details →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-card p-4 rounded-lg border border-border shadow-sm lg:hidden">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Today's Summary
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-accent">1</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">1</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-muted-foreground">2</div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
        </div>
      </div>

      {/* Mobile-specific actions */}
      <div className="fixed bottom-20 left-4 right-4 lg:hidden">
        <div className="bg-card p-4 rounded-lg border border-border shadow-lg">
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
              <span className="text-xl mb-1">🚗</span>
              <span className="text-xs font-medium text-foreground">
                Start Route
              </span>
            </button>
            <button className="flex flex-col items-center p-3 bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors">
              <span className="text-xl mb-1">📍</span>
              <span className="text-xs font-medium text-foreground">
                GPS Check-in
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
