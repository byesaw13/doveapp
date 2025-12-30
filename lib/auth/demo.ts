export const DEMO_ACCOUNT_ID = '6785bba1-553c-4886-9638-460033ad6b01';

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}
