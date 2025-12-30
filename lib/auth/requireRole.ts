import 'server-only';

import type { Role } from '@/lib/auth/roles';
import { getServerSessionOrNull } from '@/lib/auth/session';

export type RoleGateResult = {
  ok: boolean;
  redirectTo?: string;
};

export async function requireRole(
  allowedRoles: Role[]
): Promise<RoleGateResult> {
  const session = await getServerSessionOrNull();

  if (session?.role && allowedRoles.includes(session.role)) {
    return { ok: true };
  }

  return { ok: false, redirectTo: '/auth/login' };
}

export function hasRole(
  role: Role | null | undefined,
  allowedRoles: Role[] = []
): boolean {
  if (!role) {
    return false;
  }

  if (allowedRoles.length === 0) {
    return true;
  }

  return allowedRoles.includes(role);
}
