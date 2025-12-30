import type { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import type { AccountContext } from './auth-guards';
import {
  getAccountContextFromHeaders,
  hydrateAccountContext,
} from './auth/account-context';

export async function requireAccountContext(
  request: NextRequest
): Promise<AccountContext> {
  const baseContext = await getAccountContextFromHeaders(request);
  const supabase = await createRouteHandlerClient();
  return hydrateAccountContext(baseContext, supabase);
}

export async function requireAdminContext(
  request: NextRequest
): Promise<AccountContext> {
  const context = await requireAccountContext(request);
  if (!['OWNER', 'ADMIN'].includes(context.role)) {
    throw new Error('Admin access required');
  }
  return context;
}

export async function requireTechContext(
  request: NextRequest
): Promise<AccountContext> {
  const context = await requireAccountContext(request);
  if (!['OWNER', 'ADMIN', 'TECH'].includes(context.role)) {
    throw new Error('Tech access required');
  }
  return context;
}

export async function requireCustomerContext(
  request: NextRequest,
  customerId?: string
): Promise<AccountContext & { customerId?: string }> {
  const context = await requireAccountContext(request);
  if (context.role !== 'CUSTOMER') {
    throw new Error('Customer access required');
  }
  return {
    ...context,
    customerId,
  };
}
