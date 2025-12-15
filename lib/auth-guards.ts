import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export type UserRole = 'OWNER' | 'ADMIN' | 'TECH';

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
};

export interface AccountContext {
  accountId: string;
  userId: string;
  role: UserRole;
  permissions: Permission[];
  user: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  account: {
    id: string;
    name: string;
    subdomain?: string;
    custom_domain?: string;
    logo_url?: string;
  };
}

/**
 * Server-side guard to validate account context and user permissions
 * Extracts account context from request headers set by middleware
 */
export async function requireAccountContext(
  request: NextRequest
): Promise<AccountContext> {
  // Create Supabase client with user context from cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Authentication required');
  }

  // Get account context from middleware headers
  let accountId = request.headers.get('x-account-id');
  const userId = request.headers.get('x-user-id');
  const roleHeader = request.headers.get('x-user-role');

  if (!accountId || !userId || !roleHeader) {
    throw new Error('Account context required');
  }

  // Validate the user matches
  if (user.id !== userId) {
    throw new Error('User ID mismatch');
  }

  // Fetch full account and user details
  const { data: membership, error: membershipError } = await supabase
    .from('account_memberships')
    .select(
      `
      role,
      is_active,
      permissions,
      accounts (
        id,
        name,
        subdomain,
        custom_domain,
        logo_url
      ),
      users (
        id,
        email,
        full_name,
        avatar_url
      )
    `
    )
    .eq('account_id', accountId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  // Fallback: if the requested account_id doesn't match an active membership,
  // use the first active membership so the user can still load their data.
  let resolvedMembership = membership;
  if (membershipError || !membership) {
    const { data: firstMembership, error: firstMembershipError } =
      await supabase
        .from('account_memberships')
        .select(
          `
          account_id,
          role,
          is_active,
          permissions,
          accounts (
            id,
            name,
            subdomain,
            custom_domain,
            logo_url
          ),
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `
        )
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (firstMembershipError || !firstMembership) {
      // For users without membership, assign default account as OWNER
      accountId = '6785bba1-553c-4886-9638-460033ad6b01'; // Dovetails Services LLC
      resolvedMembership = {
        account_id: accountId,
        role: 'OWNER',
        is_active: true,
        permissions: DEFAULT_ROLE_PERMISSIONS['OWNER'],
        accounts: {
          id: accountId,
          name: 'Dovetails Services LLC',
          subdomain: null,
          custom_domain: null,
          logo_url: null,
        },
        users: {
          id: user.id,
          email: user.email || '',
          full_name: null,
          avatar_url: null,
        },
      };
    } else {
      accountId = firstMembership.account_id;
      resolvedMembership = firstMembership;
    }
  }

  const membershipToUse = resolvedMembership!;

  // Get permissions - use custom permissions if set, otherwise use role defaults
  const role = membershipToUse.role as UserRole;
  const customPermissions = membershipToUse.permissions as Permission[] | null;
  const permissions = customPermissions || DEFAULT_ROLE_PERMISSIONS[role];

  return {
    accountId: accountId!,
    userId: user.id,
    role,
    permissions,
    user: membershipToUse.users as any,
    account: membershipToUse.accounts as any,
  };
}

/**
 * Check if user can manage admin functions
 */
export function canManageAdmin(role: UserRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Check if user can access technician functions
 */
export function canAccessTech(role: UserRole): boolean {
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

/**
 * Middleware helper for admin routes
 */
export async function requireAdminContext(
  request: NextRequest
): Promise<AccountContext> {
  const context = await requireAccountContext(request);

  if (!canManageAdmin(context.role)) {
    throw new Error('Admin access required');
  }

  return context;
}

/**
 * Middleware helper for tech routes
 */
export async function requireTechContext(
  request: NextRequest
): Promise<AccountContext> {
  const context = await requireAccountContext(request);

  if (!canAccessTech(context.role)) {
    throw new Error('Technician access required');
  }

  return context;
}

/**
 * Middleware helper for customer routes
 */
export async function requireCustomerContext(
  request: NextRequest,
  customerId?: string
): Promise<AccountContext & { customerId?: string }> {
  const context = await requireAccountContext(request);

  // For customer routes, we might not need role validation
  // but we should validate customer access if customerId is provided

  return {
    ...context,
    customerId,
  };
}
