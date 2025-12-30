import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/clients/route';

jest.mock('@/lib/auth-guards-api', () => ({
  requireAccountContext: jest.fn(),
}));

jest.mock('@/lib/supabase/route-handler', () => ({
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('@/lib/api/validation', () => ({
  validateRequest: jest.fn(),
  createClientSchema: {},
}));

import { requireAccountContext } from '@/lib/auth-guards-api';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { validateRequest } from '@/lib/api/validation';

const mockRequireAccountContext = requireAccountContext as jest.MockedFunction<
  typeof requireAccountContext
>;
const mockCreateRouteHandlerClient =
  createRouteHandlerClient as jest.MockedFunction<
    typeof createRouteHandlerClient
  >;
const mockValidateRequest = validateRequest as jest.MockedFunction<
  typeof validateRequest
>;

describe('/api/clients tenant isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scopes client listing to the authenticated account', async () => {
    const mockContext = {
      accountId: 'account-a',
      userId: 'user-a',
      role: 'OWNER' as const,
      permissions: [],
      user: { id: 'user-a', email: 'owner@example.com' },
      account: { id: 'account-a', name: 'Account A' },
    };

    const query = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve({ data: [], error: null })),
    };

    const mockSupabase = {
      from: jest.fn().mockReturnValue(query),
    };

    mockRequireAccountContext.mockResolvedValue(mockContext);
    mockCreateRouteHandlerClient.mockResolvedValue(mockSupabase as any);

    await GET(new NextRequest('http://localhost:3000/api/clients'));

    expect(query.eq).toHaveBeenCalledWith('account_id', 'account-a');
  });

  it('writes clients only within the authenticated account', async () => {
    const mockContext = {
      accountId: 'account-a',
      userId: 'user-a',
      role: 'ADMIN' as const,
      permissions: [],
      user: { id: 'user-a', email: 'admin@example.com' },
      account: { id: 'account-a', name: 'Account A' },
    };

    const insertQuery = {
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'client-1' },
        error: null,
      }),
    };

    const baseQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnValue(insertQuery),
      then: jest.fn((resolve) => resolve({ data: [], error: null })),
    };

    const mockSupabase = {
      from: jest.fn().mockReturnValue(baseQuery),
    };

    mockRequireAccountContext.mockResolvedValue(mockContext);
    mockCreateRouteHandlerClient.mockResolvedValue(mockSupabase as any);
    mockValidateRequest.mockResolvedValue({
      data: { first_name: 'Sam', last_name: 'Client' },
      error: null,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/clients', {
      method: 'POST',
      body: JSON.stringify({ first_name: 'Sam', last_name: 'Client' }),
      headers: { 'content-type': 'application/json' },
    });

    await POST(request);

    expect(baseQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({ account_id: 'account-a' })
    );
  });
});
