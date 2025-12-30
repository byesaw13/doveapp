import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tech/today-visits/route';

// Mock the auth guards
jest.mock('@/lib/auth-guards', () => ({
  requireTechContext: jest.fn(),
}));

jest.mock('@/lib/supabase/route-handler', () => ({
  createRouteHandlerClient: jest.fn(),
}));

// Mock the visits service
jest.mock('@/lib/api/visits', () => ({
  listTodayVisits: jest.fn(),
}));

import { requireTechContext } from '@/lib/auth-guards-api';
import { listTodayVisits } from '@/lib/api/visits';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

const mockRequireTechContext = requireTechContext as jest.MockedFunction<
  typeof requireTechContext
>;
const mockCreateAuthenticatedClient = createRouteHandlerClient as jest.Mock;
const mockListTodayVisits = listTodayVisits as jest.Mock;

describe('/api/tech/today-visits', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockCreateAuthenticatedClient.mockReturnValue({});

    mockRequireTechContext.mockResolvedValue({
      accountId: '6785bba1-553c-4886-9638-460033ad6b01',
      userId: 'demo-tech-user',
      role: 'TECH',
      permissions: ['manage_business'],
      user: { id: 'demo-tech-user', email: 'tech@test.com' },
      account: {
        id: '6785bba1-553c-4886-9638-460033ad6b01',
        name: 'Test Account',
      },
    });

    mockListTodayVisits.mockResolvedValue({
      data: [],
      page: 1,
      pageSize: 20,
      total: 0,
      error: null,
    });
  });

  describe('GET /api/tech/today-visits', () => {
    const mockRequest = new NextRequest(
      'http://localhost:3000/api/tech/today-visits'
    );

    it('should return 401 when authentication fails', async () => {
      mockRequireTechContext.mockRejectedValue(
        new Error('Authentication required')
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 401 when user lacks tech permissions', async () => {
      mockRequireTechContext.mockRejectedValue(
        new Error('Technician access required')
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Technician access required');
    });

    it('should return visits for authenticated tech', async () => {
      const mockVisits = [
        {
          id: 'visit-1',
          start_at: '2024-01-01T10:00:00Z',
          end_at: '2024-01-01T11:00:00Z',
          status: 'scheduled',
          job: {
            title: 'Test Job',
            client: {
              first_name: 'John',
              last_name: 'Doe',
              address_line1: '123 Main St',
              city: 'Springfield',
              phone: '555-0101',
            },
          },
        },
      ];

      mockListTodayVisits.mockResolvedValue({
        data: mockVisits,
        page: 1,
        pageSize: 20,
        total: 1,
        error: null,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockVisits);
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(20);
      expect(data.total).toBe(1);
      expect(mockListTodayVisits).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: '6785bba1-553c-4886-9638-460033ad6b01',
          userId: 'demo-tech-user',
          supabase: expect.any(Object),
        }),
        { page: 1, pageSize: 20 }
      );
    });

    it('should return empty list when no visits', async () => {
      mockListTodayVisits.mockResolvedValue({
        data: [],
        page: 1,
        pageSize: 20,
        total: 0,
        error: null,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(20);
      expect(data.total).toBe(0);
    });

    it('should only return visits assigned to the tech', async () => {
      const response = await GET(mockRequest);

      expect(mockListTodayVisits).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: '6785bba1-553c-4886-9638-460033ad6b01',
          userId: 'demo-tech-user',
        }),
        expect.any(Object)
      );
    });

    it('should support date parameter', async () => {
      const requestWithDate = new NextRequest(
        'http://localhost:3000/api/tech/today-visits?date=2024-01-15'
      );

      const response = await GET(requestWithDate);

      expect(mockListTodayVisits).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ date: '2024-01-15' })
      );
    });
  });
});
