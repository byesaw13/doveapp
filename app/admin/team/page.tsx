import { CreateUserForm } from '@/components/admin/CreateUserForm';

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage team members and their access permissions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New User */}
        <div className="lg:col-span-1">
          <CreateUserForm />
        </div>

        {/* Current Team Members */}
        <div className="lg:col-span-2">
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Current Team Members
            </h2>

            <div className="space-y-4">
              {/* This would be populated with actual team member data */}
              <div className="text-center py-8 text-muted-foreground">
                <p>Team member list will be implemented here</p>
                <p className="text-sm mt-2">
                  Use the form to add new team members
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Permissions Info */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Role Permissions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">Technician</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• View assigned jobs</li>
              <li>• Update job status</li>
              <li>• Access customer info</li>
              <li>• Limited write access</li>
            </ul>
          </div>

          <div className="p-4 bg-accent/10 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">
              Administrator
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All technician permissions</li>
              <li>• Manage clients & jobs</li>
              <li>• Create estimates & invoices</li>
              <li>• View all reports</li>
            </ul>
          </div>

          <div className="p-4 bg-primary/10 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">Owner</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All admin permissions</li>
              <li>• Manage team members</li>
              <li>• Account settings</li>
              <li>• Full system access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
