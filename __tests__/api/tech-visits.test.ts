import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/tech/visits/[id]/route';

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

describe('/api/tech/visits/[id]', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.resetAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
    };

    mockCreateAuthenticatedClient.mockReturnValue(mockSupabase);

    mockRequireTechContext.mockResolvedValue({
      accountId: '6785bba1-553c-4886-9638-460033ad6b01',
      userId: 'demo-tech-user',
      role: 'TECH',
    });
  });

  describe('PATCH /api/tech/visits/[id]', () => {
    it('should return 401 when authentication fails', async () => {
      mockRequireTechContext.mockRejectedValue(
        new Error('Authentication required')
      );

      const response = await PATCH(
        new NextRequest('http://localhost:3000/api/tech/visits/visit-1', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_progress' }),
        }),
        { params: Promise.resolve({ id: 'visit-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 401 when user lacks tech permissions', async () => {
      mockRequireTechContext.mockRejectedValue(
        new Error('Technician access required')
      );

      const response = await PATCH(
        new NextRequest('http://localhost:3000/api/tech/visits/visit-1', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_progress' }),
        }),
        { params: Promise.resolve({ id: 'visit-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Technician access required');
    });

    it('should return 404 for non-existent visit', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const response = await PATCH(
        new NextRequest('http://localhost:3000/api/tech/visits/visit-1', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_progress' }),
        }),
        { params: Promise.resolve({ id: 'visit-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Visit not found');
    });

    it('should return 403 for unassigned visit', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'visit-1',
          status: 'scheduled',
          technician_id: 'other-tech',
        },
        error: null,
      });

      const response = await PATCH(
        new NextRequest('http://localhost:3000/api/tech/visits/visit-1', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_progress' }),
        }),
        { params: Promise.resolve({ id: 'visit-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Access denied: Not assigned to this visit');
    });

    it('should return 400 for invalid status transition', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'visit-1',
          status: 'scheduled',
          technician_id: 'demo-tech-user',
        },
        error: null,
      });

      const response = await PATCH(
        new NextRequest('http://localhost:3000/api/tech/visits/visit-1', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'completed' }),
        }),
        { params: Promise.resolve({ id: 'visit-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Invalid status transition from scheduled to completed'
      );
    });

    it('should return 400 for invalid request body', async () => {
      const response = await PATCH(
        new NextRequest('http://localhost:3000/api/tech/visits/visit-1', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'invalid' }),
        }),
        { params: Promise.resolve({ id: 'visit-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should successfully update visit status', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'visit-1',
          status: 'scheduled',
          technician_id: 'demo-tech-user',
        },
        error: null,
      });

      const response = await PATCH(
        new NextRequest('http://localhost:3000/api/tech/visits/visit-1', {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'in_progress',
            notes: 'Started work',
          }),
        }),
        { params: Promise.resolve({ id: 'visit-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'in_progress',
        notes: 'Started work',
      });
    });
  });
});
