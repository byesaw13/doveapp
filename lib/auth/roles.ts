export type Role = 'owner' | 'admin' | 'tech' | 'customer';

export function isRoleAllowed(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}
