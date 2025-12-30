export type Role = 'OWNER' | 'ADMIN' | 'TECH' | 'CUSTOMER';

export const PORTAL_ROLES = {
  admin: ['OWNER', 'ADMIN'] as const,
  tech: ['TECH'] as const,
  customer: ['CUSTOMER'] as const,
} as const;

export function isRoleAllowed(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}
