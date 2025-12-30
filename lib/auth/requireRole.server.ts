import 'server-only';
import { redirect } from 'next/navigation';
import { getServerAuthContext } from './context.server';

export async function requireRoleServer(allowedRoles: string[]) {
  const context = await getServerAuthContext();
  if (!context?.userId) {
    redirect('/auth/login');
  }
  if (!context.role || !allowedRoles.includes(context.role)) {
    redirect('/auth/unauthorized');
  }
  return context;
}
