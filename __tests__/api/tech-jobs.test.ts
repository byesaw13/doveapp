/**
 * Tests for Tech Jobs API endpoints
 * Tests authentication, authorization, and data scoping for technicians
 */

import { NextRequest } from 'next/server';
import { GET as getJobs } from '@/app/api/tech/jobs/route';
import {
  GET as getJobByIdHandler,
  PATCH,
} from '@/app/api/tech/jobs/[id]/route';

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
import type { Permission } from '@/lib/auth-guards';
import type { JobStatus } from '@/types/job';

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

      const response = await getJobs(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 401 when user lacks tech permissions', async () => {
      mockRequireTechContext.mockRejectedValue(
        new Error('Technician access required')
      );

      const response = await getJobs(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Technician access required');
    });

    it('should return only assigned jobs for authenticated tech', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'tech-user',
        role: 'TECH' as const,
        permissions: ['manage_business'] as Permission[],
        user: { id: 'tech-user', email: 'tech@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      const mockJobs = [
        {
          id: 'job-1',
          title: 'Test Job',
          status: 'scheduled' as JobStatus,
          assigned_tech_id: 'tech-user',
          client: { first_name: 'John', last_name: 'Doe' },
        },
      ];

      mockRequireTechContext.mockResolvedValue(mockContext);
      mockListJobs.mockResolvedValue({
        data: mockJobs,
        page: 1,
        pageSize: 20,
        total: mockJobs.length,
        error: null,
      });

      const response = await getJobs(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockJobs);
      expect(mockListJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'test-account',
          userId: 'tech-user',
          role: 'TECH',
        }),
        expect.objectContaining({
          assignedTechId: 'tech-user',
          page: 1,
          pageSize: 20,
          sort: 'created_at',
          dir: 'desc',
        })
      );
    });

    it('should apply additional filters while maintaining tech scoping', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'tech-user',
        role: 'TECH' as const,
        permissions: ['manage_business'] as Permission[],
        user: { id: 'tech-user', email: 'tech@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      mockRequireTechContext.mockResolvedValue(mockContext);
      mockListJobs.mockResolvedValue({
        data: [],
        page: 1,
        pageSize: 20,
        total: 0,
        error: null,
      });

      const requestWithParams = new NextRequest(
        'http://localhost:3000/api/tech/jobs?status=in_progress&search=plumbing'
      );

      await getJobs(requestWithParams);

      expect(mockListJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'test-account',
          userId: 'tech-user',
          role: 'TECH',
        }),
        expect.objectContaining({
          status: 'in_progress',
          search: 'plumbing',
          assignedTechId: 'tech-user',
          page: 1,
          pageSize: 20,
          sort: 'created_at',
          dir: 'desc',
        })
      );
    });
  });

  describe('GET /api/tech/jobs/[id]', () => {
    it('should return job details for assigned job', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'tech-user',
        role: 'TECH' as const,
        permissions: ['manage_business'] as Permission[],
        user: { id: 'tech-user', email: 'tech@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      const mockJob = {
        id: 'job-1',
        title: 'Test Job',
        status: 'scheduled' as JobStatus,
        assigned_tech_id: 'tech-user',
        client: { first_name: 'John', last_name: 'Doe' },
      };

      mockRequireTechContext.mockResolvedValue(mockContext);
      mockGetJobById.mockResolvedValue({
        data: mockJob,
        error: null,
      });

      const response = await getJobByIdHandler(
        new NextRequest('http://localhost:3000/api/tech/jobs/job-1'),
        { params: Promise.resolve({ id: 'job-1' }) }
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
        permissions: ['manage_business'] as Permission[],
        user: { id: 'tech-user', email: 'tech@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      mockRequireTechContext.mockResolvedValue(mockContext);
      mockGetJobById.mockResolvedValue({
        data: null,
        error: new Error('Access denied: Job not assigned to you'),
      });

      const response = await getJobByIdHandler(
        new NextRequest('http://localhost:3000/api/tech/jobs/job-1'),
        { params: Promise.resolve({ id: 'job-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Access denied: Job not assigned to you');
    });
  });

  describe('PATCH /api/tech/jobs/[id]', () => {
    it('should allow tech to update status on assigned job', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'tech-user',
        role: 'TECH' as const,
        permissions: ['manage_business'] as Permission[],
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

      const response = await PATCH(patchRequest, {
        params: Promise.resolve({ id: 'job-1' }),
      });
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
        permissions: ['manage_business'] as Permission[],
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

      await PATCH(patchRequest, { params: Promise.resolve({ id: 'job-1' }) });

      expect(mockUpdateJob).toHaveBeenCalledWith(expect.any(Object), 'job-1', {
        notes: 'Updated notes',
      });
    });

    it('should reject attempts to update restricted fields', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'tech-user',
        role: 'TECH' as const,
        permissions: ['manage_business'] as Permission[],
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

      await PATCH(patchRequest, { params: Promise.resolve({ id: 'job-1' }) });

      // Only allowed fields should be passed through
      expect(mockUpdateJob).toHaveBeenCalledWith(
        expect.any(Object),
        'job-1',
        { status: 'completed' } // title should be filtered out
      );
    });
  });
});
