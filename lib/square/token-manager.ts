import { supabase } from '@/lib/supabase';
import { refreshAccessToken } from './oauth';

export interface SquareConnection {
  id: string;
  merchant_id: string;
  access_token: string;
  refresh_token?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current Square connection
 */
export async function getSquareConnection(): Promise<SquareConnection | null> {
  const { data, error } = await supabase
    .from('square_connections')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as SquareConnection;
}

/**
 * Get a valid access token (refreshing if needed)
 */
export async function getValidAccessToken(): Promise<string | null> {
  const connection = await getSquareConnection();

  if (!connection) {
    return null;
  }

  // Check if token is expired
  if (connection.expires_at) {
    const expiresAt = new Date(connection.expires_at);
    const now = new Date();

    // If token expires in less than 5 minutes, refresh it
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      if (!connection.refresh_token) {
        console.warn('Token expired but no refresh token available');
        return null;
      }

      try {
        const refreshed = await refreshAccessToken(connection.refresh_token);

        // Update the stored token
        await supabase
          .from('square_connections')
          .update({
            access_token: refreshed.accessToken,
            expires_at: refreshed.expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id);

        return refreshed.accessToken;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
      }
    }
  }

  return connection.access_token;
}

/**
 * Check if Square is connected
 */
export async function isSquareConnected(): Promise<boolean> {
  const connection = await getSquareConnection();
  return connection !== null;
}

/**
 * Disconnect Square (delete stored tokens)
 */
export async function disconnectSquare(): Promise<void> {
  await supabase.from('square_connections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}
