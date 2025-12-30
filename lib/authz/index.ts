/**
 * Canonical authorization module
 * Provides standardized auth guards and permission checks
 */

import { NextRequest } from 'next/server';
import { requireAccountContext as baseRequireAccountContext } from '@/lib/auth-guards-api';
import { AccountContext } from '@/lib/auth-guards';
import { Permission } from './permissions';

/**
 * Require account context with permissions
 */
export async function requireAccountContext(
  request: NextRequest
): Promise<AccountContext> {
  return baseRequireAccountContext(request);
}

/**
 * Require specific permission
 */
export function requirePermission(
  context: AccountContext,
  permission: string
): void {
  if (!context.permissions.includes(permission as any)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(
  context: AccountContext,
  permissions: string[]
): void {
  const hasPermission = permissions.some((permission) =>
    context.permissions.includes(permission as any)
  );
  if (!hasPermission) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}

/**
 * Require portal access based on role/permission bundles
 */
export function requirePortal(
  context: AccountContext,
  portal: 'admin' | 'tech' | 'customer'
): void {
  switch (portal) {
    case 'admin':
      requirePermission(context, 'admin:access');
      break;
    case 'tech':
      requireAnyPermission(context, ['jobs:read']);
      break;
    case 'customer':
      requireAnyPermission(context, ['jobs:read']);
      break;
  }
}
