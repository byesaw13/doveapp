import 'server-only';
import { getServerSessionOrNull } from './session';

export type ServerAuthContext = {
  userId: string | null;
  role: string | null;
  accountId: string | null;
};

export async function getServerAuthContext(): Promise<ServerAuthContext | null> {
  const session = await getServerSessionOrNull();
  if (!session) {
    return null;
  }
  return {
    userId: session.userId,
    role: session.role,
    accountId: session.accountId,
  };
}
