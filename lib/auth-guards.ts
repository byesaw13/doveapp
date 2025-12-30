export type UserRole = 'OWNER' | 'ADMIN' | 'TECH' | 'CUSTOMER';

export type Permission =
  | 'manage_users' // Create/edit/delete users
  | 'manage_account' // Account settings, billing, deletion
  | 'manage_business' // All business operations (clients, jobs, estimates, invoices)
  | 'view_reports' // Access to analytics and reports
  | 'manage_team' // Team management and scheduling
  | 'manage_inventory' // Inventory and materials management
  | 'manage_automations' // Workflow automations and settings
  | 'view_financial' // Access to financial data and pricing
  | 'manage_leads' // Lead management and sales pipeline
  | 'export_data'; // Data export capabilities

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    'manage_users',
    'manage_account',
    'manage_business',
    'view_reports',
    'manage_team',
    'manage_inventory',
    'manage_automations',
    'view_financial',
    'manage_leads',
    'export_data',
  ],
  ADMIN: [
    'manage_business',
    'view_reports',
    'manage_team',
    'manage_inventory',
    'manage_automations',
    'view_financial',
    'manage_leads',
  ],
  TECH: [
    'manage_business', // Limited to their assigned jobs
  ],
  CUSTOMER: [],
};

export interface AccountContext {
  accountId: string;
  userId: string;
  role: UserRole;
  permissions: Permission[];
  user: {
    id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
  };
  account: {
    id: string;
    name: string;
    subdomain?: string | null;
    custom_domain?: string | null;
    logo_url?: string | null;
  };
}

/**
 * Check if user can manage admin functions
 */
export function canManageAdmin(role: string): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Check if user can access technician functions
 */
export function canAccessTech(role: string): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'TECH';
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  permissions: Permission[],
  requiredPermission: Permission
): boolean {
  return permissions.includes(requiredPermission);
}

/**
 * Check if user can manage users (OWNER only)
 */
export function canManageUsers(permissions: Permission[]): boolean {
  return hasPermission(permissions, 'manage_users');
}

/**
 * Check if user can manage account settings (OWNER only)
 */
export function canManageAccount(permissions: Permission[]): boolean {
  return hasPermission(permissions, 'manage_account');
}

/**
 * Check if user can manage business operations
 */
export function canManageBusiness(permissions: Permission[]): boolean {
  return hasPermission(permissions, 'manage_business');
}

/**
 * Check if user can view reports
 */
export function canViewReports(permissions: Permission[]): boolean {
  return hasPermission(permissions, 'view_reports');
}

/**
 * Check if user can manage team
 */
export function canManageTeam(permissions: Permission[]): boolean {
  return hasPermission(permissions, 'manage_team');
}

/**
 * Check if user can access customer data
 */
export function canAccessCustomer(
  userId: string,
  customerUserId?: string
): boolean {
  // If customer has a linked user account, only they can access their data
  if (customerUserId) {
    return userId === customerUserId;
  }
  // Otherwise, allow access (for admin-created customers)
  return true;
}
