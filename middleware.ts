import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For now, we'll add a simple account header for demo purposes
  // In production, this would come from JWT tokens or session cookies

  const response = NextResponse.next();

  // Add account context header (placeholder)
  // This would normally come from authentication/session
  response.headers.set('x-account-id', 'demo-account-id');

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/tech/:path*',
    '/portal/:path*',
    '/api/admin/:path*',
    '/api/tech/:path*',
    '/api/portal/:path*',
  ],
};
