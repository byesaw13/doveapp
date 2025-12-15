/**
 * Tests for Tech Jobs API endpoints
 * Tests authentication, authorization, and data scoping for technicians
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tech/jobs/route';
import { PATCH } from '@/app/api/tech/jobs/[id]/route';

// Mock the auth guards
jest.mock('@/lib/auth-guards', () => ({
  requireTechContext: jest.fn(),
}));

// Mock the API helpers
jest.mock('@/lib/api-helpers', () => ({
  createAuthenticatedClient: jest.fn(),
}));

// Mock the jobs service
jest.mock('@/lib/api/jobs', () => ({
  listJobs: jest.fn(),
  getJobById: jest.fn(),
  updateJob: jest.fn(),
}));

import { requireTechContext } from '@/lib/auth-guards';
import { listJobs, getJobById, updateJob } from '@/lib/api/jobs';

const mockRequireTechContext = requireTechContext as jest.MockedFunction<
  typeof requireTechContext
>;
const mockListJobs = listJobs as jest.MockedFunction<typeof listJobs>;
const mockGetJobById = getJobById as jest.MockedFunction<typeof getJobById>;
const mockUpdateJob = updateJob as jest.MockedFunction<typeof updateJob>;

describe('/api/tech/jobs', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new NextRequest('http://localhost:3000/api/tech/jobs');
  });

  describe('GET /api/tech/jobs', () => {
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

    it('should return only assigned jobs for authenticated tech', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'tech-user',
        role: 'TECH' as const,
        permissions: ['manage_business'],
        user: { id: 'tech-user', email: 'tech@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      const mockJobs = [
        {
          id: 'job-1',
          title: 'Assigned Job',
          status: 'scheduled',
          assigned_tech_id: 'tech-user',
          client: { first_name: 'John', last_name: 'Doe' },
        },
      ];

      mockRequireTechContext.mockResolvedValue(mockContext);
      mockListJobs.mockResolvedValue({ data: mockJobs, error: null });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockJobs);
      expect(mockListJobs).toHaveBeenCalledWith(
        {
          accountId: 'test-account',
          userId: 'tech-user',
          role: 'TECH',
          supabase: expect.any(Object),
        },
        {
          assignedTechId: 'tech-user', // Auto-filtered by tech's user ID
        }
      );
    });

    it('should apply additional filters while maintaining tech scoping', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'tech-user',
        role: 'TECH' as const,
        permissions: ['manage_business'],
        user: { id: 'tech-user', email: 'tech@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      mockRequireTechContext.mockResolvedValue(mockContext);
      mockListJobs.mockResolvedValue({ data: [], error: null });

      const requestWithParams = new NextRequest(
        'http://localhost:3000/api/tech/jobs?status=in_progress&search=plumbing'
      );

      await GET(requestWithParams);

      expect(mockListJobs).toHaveBeenCalledWith(expect.any(Object), {
        status: 'in_progress',
        search: 'plumbing',
        assignedTechId: 'tech-user', // Always included
      });
    });
  });

  describe('GET /api/tech/jobs/[id]', () => {
    it('should return job details for assigned job', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'tech-user',
        role: 'TECH' as const,
        permissions: ['manage_business'],
        user: { id: 'tech-user', email: 'tech@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      const mockJob = {
        id: 'job-1',
        title: 'Assigned Job',
        status: 'scheduled',
        assigned_tech_id: 'tech-user',
        client: { first_name: 'John', last_name: 'Doe' },
      };

      mockRequireTechContext.mockResolvedValue(mockContext);
      mockGetJobById.mockResolvedValue({ data: mockJob, error: null });

      const response = await GET(
        new NextRequest('http://localhost:3000/api/tech/jobs/job-1'),
        { params: { id: 'job-1' } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockJob);
    });

    it('should return 403 for unassigned job', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'tech-user',
        role: 'TECH' as const,
        permissions: ['manage_business'],
        user: { id: 'tech-user', email: 'tech@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      mockRequireTechContext.mockResolvedValue(mockContext);
      mockGetJobById.mockResolvedValue({
        data: null,
        error: new Error('Access denied: Job not assigned to you'),
      });

      const response = await GET(
        new NextRequest('http://localhost:3000/api/tech/jobs/job-1'),
        { params: { id: 'job-1' } }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Access denied: Job not assigned to you');
    });
  });

  describe('PATCH /api/tech/jobs/[id]', () => {
    it('should allow tech to update status on assigned job', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'tech-user',
        role: 'TECH' as const,
        permissions: ['manage_business'],
        user: { id: 'tech-user', email: 'tech@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      const updatedJob = {
        id: 'job-1',
        title: 'Assigned Job',
        status: 'in_progress',
        assigned_tech_id: 'tech-user',
      };

      mockRequireTechContext.mockResolvedValue(mockContext);
      mockUpdateJob.mockResolvedValue({ data: updatedJob, error: null });

      const patchRequest = new NextRequest(
        'http://localhost:3000/api/tech/jobs/job-1',
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_progress' }),
          headers: { 'content-type': 'application/json' },
        }
      );

      const response = await PATCH(patchRequest, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedJob);
      expect(mockUpdateJob).toHaveBeenCalledWith(expect.any(Object), 'job-1', {
        status: 'in_progress',
      });
    });

    it('should allow tech to update notes on assigned job', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'tech-user',
        role: 'TECH' as const,
        permissions: ['manage_business'],
        user: { id: 'tech-user', email: 'tech@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      mockRequireTechContext.mockResolvedValue(mockContext);
      mockUpdateJob.mockResolvedValue({ data: {}, error: null });

      const patchRequest = new NextRequest(
        'http://localhost:3000/api/tech/jobs/job-1',
        {
          method: 'PATCH',
          body: JSON.stringify({ notes: 'Updated notes' }),
          headers: { 'content-type': 'application/json' },
        }
      );

      await PATCH(patchRequest, { params: { id: 'job-1' } });

      expect(mockUpdateJob).toHaveBeenCalledWith(expect.any(Object), 'job-1', {
        notes: 'Updated notes',
      });
    });

    it('should reject attempts to update restricted fields', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'tech-user',
        role: 'TECH' as const,
        permissions: ['manage_business'],
        user: { id: 'tech-user', email: 'tech@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      mockRequireTechContext.mockResolvedValue(mockContext);
      mockUpdateJob.mockResolvedValue({ data: {}, error: null });

      const patchRequest = new NextRequest(
        'http://localhost:3000/api/tech/jobs/job-1',
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: 'Hacked Title', // Should be filtered out
            status: 'completed', // Should be allowed
          }),
          headers: { 'content-type': 'application/json' },
        }
      );

      await PATCH(patchRequest, { params: { id: 'job-1' } });

      // Only allowed fields should be passed through
      expect(mockUpdateJob).toHaveBeenCalledWith(
        expect.any(Object),
        'job-1',
        { status: 'completed' } // title should be filtered out
      );
    });
  });
});
