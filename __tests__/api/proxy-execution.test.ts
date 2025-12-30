import { proxy } from '@/proxy';
import { NextRequest } from 'next/server';

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      }),
    },
    from: jest.fn((table) => {
      if (table === 'account_memberships') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  account_id: 'test-account',
                  role: 'ADMIN',
                  is_active: true,
                },
              ],
              error: null,
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null }),
      };
    }),
  })),
}));

describe('/api/health proxy execution test', () => {
  it('sets x-proxy-hit header to confirm proxy execution', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/health')
    );
    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-proxy-hit')).toBe('1');
  });
});
