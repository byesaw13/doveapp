import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export type UserRole = 'OWNER' | 'ADMIN' | 'TECH';

export interface AccountContext {
  accountId: string;
  userId: string;
  role: UserRole;
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
 * Extracts account context from request headers or session
 */
export async function requireAccountContext(
  request: NextRequest
): Promise<AccountContext> {
  const supabase = createClient();

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Authentication required');
  }

  // For now, we'll get the account from a header or default to first account
  // In production, this would come from JWT claims or session
  const accountId = request.headers.get('x-account-id');

  if (!accountId) {
    throw new Error('Account context required');
  }

  // Validate account membership
  const { data: membership, error: membershipError } = await supabase
    .from('account_memberships')
    .select(
      `
      role,
      is_active,
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

  if (membershipError || !membership) {
    throw new Error('Invalid account access');
  }

  return {
    accountId,
    userId: user.id,
    role: membership.role as UserRole,
    user: membership.users as any,
    account: membership.accounts as any,
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
