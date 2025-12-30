import { createBrowserClient } from '@/lib/supabase/client';

type JwtClaims = Record<string, unknown> & {
  account_id?: string;
  role?: string;
  sub?: string;
};

export type AuthContext = {
  userId: string | null;
  accountId: string | null;
  role: string | null;
};

function decodeJwtPayload(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = raw.padEnd(Math.ceil(raw.length / 4) * 4, '=');

  try {
    const json = atob(padded);
    return JSON.parse(json) as JwtClaims;
  } catch (_error) {
    return null;
  }
}

export async function getSession() {
  const supabase = createBrowserClient();
  return supabase.auth.getSession();
}

export async function getUser() {
  const supabase = createBrowserClient();
  return supabase.auth.getUser();
}

export async function getAuthContext(): Promise<AuthContext> {
  const { data } = await getSession();
  const session = data?.session;

  if (!session) {
    return { userId: null, accountId: null, role: null };
  }

  const claims = session.access_token
    ? decodeJwtPayload(session.access_token)
    : null;

  return {
    userId: session.user?.id ?? (claims?.sub as string | undefined) ?? null,
    accountId: (claims?.account_id as string | undefined) ?? null,
    role: (claims?.role as string | undefined) ?? null,
  };
}
