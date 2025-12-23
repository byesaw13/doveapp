export type Role = 'OWNER' | 'ADMIN' | 'TECH' | 'CUSTOMER';

export function isRoleAllowed(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}
