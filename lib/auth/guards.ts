import { redirect } from 'next/navigation';
import { requireUser } from './session';
import { isRoleAllowed, type Role } from './roles';

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireUser();
  if (!isRoleAllowed(session.role, allowedRoles)) {
    redirect('/auth/login');
  }
  return session;
}

export async function requirePortalAccess(
  portal: 'admin' | 'tech' | 'customer'
) {
  const allowedRoles: Role[] =
    portal === 'admin'
      ? ['OWNER', 'ADMIN']
      : portal === 'tech'
        ? ['TECH']
        : ['CUSTOMER'];
  return requireRole(allowedRoles);
}
