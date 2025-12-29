export const FEATURE_FLAGS = {
  MVP_SPINE: process.env.NEXT_PUBLIC_FEATURE_MVP_SPINE === 'true',
  INBOX: process.env.NEXT_PUBLIC_FEATURE_INBOX === 'true',
  ESTIMATES: process.env.NEXT_PUBLIC_FEATURE_ESTIMATES === 'true',
  INVOICES: process.env.NEXT_PUBLIC_FEATURE_INVOICES === 'true',
  INVENTORY: process.env.NEXT_PUBLIC_FEATURE_INVENTORY === 'true',
  CUSTOMER_PORTAL: process.env.NEXT_PUBLIC_FEATURE_CUSTOMER_PORTAL === 'true',
  ANALYTICS: process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === 'true',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
