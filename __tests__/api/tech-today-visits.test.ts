import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tech/today-visits/route';

// Mock the auth guards
jest.mock('@/lib/auth-guards', () => ({
  requireTechContext: jest.fn(),
}));

// Mock the API helpers
jest.mock('@/lib/api-helpers', () => ({
  createAuthenticatedClient: jest.fn(),
}));

import { requireTechContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';

const mockRequireTechContext = requireTechContext as jest.MockedFunction<
  typeof requireTechContext
>;
const mockCreateAuthenticatedClient = createAuthenticatedClient as jest.Mock;

describe('/api/tech/today-visits', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.resetAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockCreateAuthenticatedClient.mockReturnValue(mockSupabase);

    mockRequireTechContext.mockResolvedValue({
      accountId: '6785bba1-553c-4886-9638-460033ad6b01',
      userId: 'demo-tech-user',
      role: 'TECH',
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
              phone: '555-1234',
            },
          },
        },
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockVisits,
        error: null,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockVisits);
      expect(mockSupabase.from).toHaveBeenCalledWith('visits');
      expect(mockSupabase.eq).toHaveBeenCalledWith(
        'technician_id',
        'demo-tech-user'
      );
    });

    it('should return empty list when no visits', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
    });

    it('should only return visits assigned to the tech', async () => {
      const mockVisits = [
        {
          accountId: '6785bba1-553c-4886-9638-460033ad6b01',
          userId: 'demo-tech-user',
          role: 'TECH',
          supabase: expect.any(Object),
        },
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockVisits,
        error: null,
      });

      const response = await GET(mockRequest);

      expect(mockSupabase.eq).toHaveBeenCalledWith(
        'technician_id',
        'demo-tech-user'
      );
    });
  });
});
