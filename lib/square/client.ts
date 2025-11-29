// @ts-nocheck - Square SDK has incomplete types
import { SquareClient, SquareEnvironment } from 'square';

const accessToken = process.env.SQUARE_ACCESS_TOKEN || '';
const environment =
  process.env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;

console.log('Initializing Square client with environment:', process.env.SQUARE_ENVIRONMENT);
console.log('Access token present:', !!accessToken);

if (!accessToken) {
  console.warn(
    'SQUARE_ACCESS_TOKEN is not set. Using placeholder - OAuth or CSV import recommended.'
  );
}

export const squareClient = new SquareClient({
  bearerAuthCredentials: {
    accessToken: accessToken || 'placeholder',
  },
  environment,
});
