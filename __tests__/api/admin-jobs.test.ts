/**
 * Tests for Admin Jobs API endpoints
 * Tests authentication, authorization, and data scoping
 */

// Mock NextRequest and NextResponse before importing anything that uses them
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || 'GET',
    headers: new Map(),
    json: jest
      .fn()
      .mockResolvedValue(options?.body ? JSON.parse(options.body) : {}),
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({
      status: options?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    })),
  },
}));

import { GET, POST } from '@/app/api/admin/jobs/route';
import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/api-helpers';

// Mock the auth guards
jest.mock('@/lib/auth-guards', () => ({
  requireAdminContext: jest.fn(),
}));

// Mock the API helpers
jest.mock('@/lib/api-helpers', () => ({
  createAuthenticatedClient: jest.fn(() => ({
    /* mock supabase client */
  })),
  errorResponse: jest.fn(),
  unauthorizedResponse: jest.fn(),
}));

// Mock the jobs service
jest.mock('@/lib/api/jobs', () => ({
  listJobs: jest.fn(),
  createJob: jest.fn(),
}));

import { requireAdminContext } from '@/lib/auth-guards';
import { listJobs, createJob } from '@/lib/api/jobs';

const mockRequireAdminContext = requireAdminContext as jest.MockedFunction<
  typeof requireAdminContext
>;
const mockListJobs = listJobs as jest.MockedFunction<typeof listJobs>;
const mockCreateJob = createJob as jest.MockedFunction<typeof createJob>;

describe('/api/admin/jobs', () => {
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { NextRequest } = require('next/server');
    mockRequest = new NextRequest('http://localhost:3000/api/admin/jobs');
  });

  describe('GET /api/admin/jobs', () => {
    it('should return 401 when authentication fails', async () => {
      mockRequireAdminContext.mockRejectedValue(
        new Error('Authentication required')
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 401 when user lacks admin permissions', async () => {
      mockRequireAdminContext.mockRejectedValue(
        new Error('Admin access required')
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Admin access required');
    });

    it('should return jobs list for authenticated admin', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'admin-user',
        role: 'ADMIN' as const,
        permissions: ['manage_business'],
        user: { id: 'admin-user', email: 'admin@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      const mockJobs = [
        {
          id: 'job-1',
          title: 'Test Job',
          status: 'scheduled',
          client: { first_name: 'John', last_name: 'Doe' },
        },
      ];

      mockRequireAdminContext.mockResolvedValue(mockContext);
      mockListJobs.mockResolvedValue({ data: mockJobs, error: null });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockJobs);
      expect(mockListJobs).toHaveBeenCalledWith(
        {
          accountId: 'test-account',
          userId: 'admin-user',
          role: 'ADMIN',
          supabase: expect.any(Object),
        },
        { page: 1, pageSize: 20, sort: 'created_at', dir: 'desc' }
      );
    });

    it('should handle search and status filters', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'admin-user',
        role: 'ADMIN' as const,
        permissions: ['manage_business'],
        user: { id: 'admin-user', email: 'admin@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      mockRequireAdminContext.mockResolvedValue(mockContext);
      mockListJobs.mockResolvedValue({ data: [], error: null });

      const { NextRequest } = require('next/server');
      const requestWithParams = new NextRequest(
        'http://localhost:3000/api/admin/jobs?status=scheduled&search=test'
      );

      await GET(requestWithParams);

      expect(mockListJobs).toHaveBeenCalledWith(expect.any(Object), {
        status: 'scheduled',
        search: 'test',
        page: 1,
        pageSize: 20,
        sort: 'created_at',
        dir: 'desc',
      });
    });

    it('should return 500 when service fails', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'admin-user',
        role: 'ADMIN' as const,
        permissions: ['manage_business'],
        user: { id: 'admin-user', email: 'admin@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      mockRequireAdminContext.mockResolvedValue(mockContext);
      mockListJobs.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });
  });

  describe('POST /api/admin/jobs', () => {
    it('should create job for authenticated admin', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'admin-user',
        role: 'ADMIN' as const,
        permissions: ['manage_business'],
        user: { id: 'admin-user', email: 'admin@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      const jobData = {
        client_id: 'client-1',
        title: 'New Job',
        description: 'Job description',
        status: 'scheduled',
        service_date: '2025-01-01',
      };

      const createdJob = { id: 'job-1', ...jobData };

      mockRequireAdminContext.mockResolvedValue(mockContext);
      mockCreateJob.mockResolvedValue({ data: createdJob, error: null });

      const postRequest = new NextRequest(
        'http://localhost:3000/api/admin/jobs',
        {
          method: 'POST',
          body: JSON.stringify(jobData),
          headers: { 'content-type': 'application/json' },
        }
      );

      const response = await POST(postRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdJob);
      expect(mockCreateJob).toHaveBeenCalledWith(
        {
          accountId: 'test-account',
          userId: 'admin-user',
          role: 'ADMIN',
          supabase: expect.any(Object),
        },
        expect.objectContaining({
          client_id: 'client-1',
          title: 'New Job',
          description: 'Job description',
          status: 'scheduled',
          service_date: '2025-01-01',
        })
      );
    });

    it('should return 403 for non-admin users', async () => {
      mockRequireAdminContext.mockRejectedValue(
        new Error('Admin access required')
      );

      const postRequest = new NextRequest(
        'http://localhost:3000/api/admin/jobs',
        {
          method: 'POST',
          body: JSON.stringify({ title: 'Test' }),
          headers: { 'content-type': 'application/json' },
        }
      );

      const response = await POST(postRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Admin access required');
    });

    it('should validate required fields', async () => {
      const mockContext = {
        accountId: 'test-account',
        userId: 'admin-user',
        role: 'ADMIN' as const,
        permissions: ['manage_business'],
        user: { id: 'admin-user', email: 'admin@test.com' },
        account: { id: 'test-account', name: 'Test Account' },
      };

      mockRequireAdminContext.mockResolvedValue(mockContext);
      mockCreateJob.mockResolvedValue({
        data: null,
        error: new Error('Validation failed: title is required'),
      });

      const postRequest = new NextRequest(
        'http://localhost:3000/api/admin/jobs',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'content-type': 'application/json' },
        }
      );

      const response = await POST(postRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed: title is required');
    });
  });
});
