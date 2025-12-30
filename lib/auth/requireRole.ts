import type { Role } from '@/lib/auth/roles';
import { getAuthContext } from '@/lib/auth/context';

export type RoleGateResult = {
  ok: boolean;
  redirectTo?: string;
};

export async function requireRole(
  allowedRoles: Role[]
): Promise<RoleGateResult> {
  const { role } = await getAuthContext();

  if (role && allowedRoles.includes(role as Role)) {
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
