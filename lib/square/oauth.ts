// @ts-nocheck - Square SDK has incomplete types
import { SquareClient, SquareEnvironment } from 'square';
import crypto from 'crypto';

const environment =
  process.env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;

const baseUrl =
  process.env.SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';

/**
 * Generate Square OAuth authorization URL
 */
export function getSquareAuthUrl(): string {
  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/square/oauth/callback`;
  
  // Generate a random state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  
  // Store state in session/cookie for verification (you'll need to implement this)
  
  const scopes = [
    'CUSTOMERS_READ',
    'CUSTOMERS_WRITE',
    'INVOICES_READ',
    'PAYMENTS_READ',
  ];

  const params = new URLSearchParams({
    client_id: applicationId || '',
    scope: scopes.join(' '),
    session: 'false',
    state: state,
  });

  return `${baseUrl}/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  merchantId: string;
}> {
  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const applicationSecret = process.env.SQUARE_APPLICATION_SECRET;

  const client = new SquareClient({
    bearerAuthCredentials: {
      accessToken: '', // Not needed for OAuth endpoint
    },
    environment,
  });

  const response = await client.oAuth().obtainToken({
    clientId: applicationId,
    clientSecret: applicationSecret,
    code: code,
    grantType: 'authorization_code',
  });

  if (!response.result.accessToken) {
    throw new Error('Failed to obtain access token');
  }

  return {
    accessToken: response.result.accessToken,
    refreshToken: response.result.refreshToken,
    expiresAt: response.result.expiresAt,
    merchantId: response.result.merchantId || '',
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt?: string;
}> {
  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const applicationSecret = process.env.SQUARE_APPLICATION_SECRET;

  const client = new SquareClient({
    bearerAuthCredentials: {
      accessToken: '',
    },
    environment,
  });

  const response = await client.oAuth().obtainToken({
    clientId: applicationId,
    clientSecret: applicationSecret,
    refreshToken: refreshToken,
    grantType: 'refresh_token',
  });

  if (!response.result.accessToken) {
    throw new Error('Failed to refresh access token');
  }

  return {
    accessToken: response.result.accessToken,
    expiresAt: response.result.expiresAt,
  };
}

/**
 * Create Square client with OAuth token
 */
export function createSquareClientWithToken(accessToken: string): any {
  return new SquareClient({
    bearerAuthCredentials: {
      accessToken,
    },
    environment,
  });
}
