import { NextRequest } from 'next/server';
import { GET as getPortalJobs } from '@/app/api/portal/jobs/route';
import { GET as getPortalEstimates } from '@/app/api/portal/estimates/route';
import { GET as getPortalInvoices } from '@/app/api/portal/invoices/route';

jest.mock('@/lib/auth-guards-api', () => ({
  requireCustomerContext: jest.fn(),
}));

jest.mock('@/lib/supabase/route-handler', () => ({
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('@/lib/api/jobs', () => ({
  listJobs: jest.fn(),
}));

jest.mock('@/lib/api/estimates', () => ({
  listEstimates: jest.fn(),
  getEstimateById: jest.fn(),
  updateEstimate: jest.fn(),
}));

jest.mock('@/lib/api/invoices', () => ({
  listInvoices: jest.fn(),
}));

import { requireCustomerContext } from '@/lib/auth-guards-api';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { listJobs } from '@/lib/api/jobs';
import { listEstimates } from '@/lib/api/estimates';
import { listInvoices } from '@/lib/api/invoices';

const mockRequireCustomerContext =
  requireCustomerContext as jest.MockedFunction<typeof requireCustomerContext>;
const mockCreateRouteHandlerClient =
  createRouteHandlerClient as jest.MockedFunction<
    typeof createRouteHandlerClient
  >;
const mockListJobs = listJobs as jest.MockedFunction<typeof listJobs>;
const mockListEstimates = listEstimates as jest.MockedFunction<
  typeof listEstimates
>;
const mockListInvoices = listInvoices as jest.MockedFunction<
  typeof listInvoices
>;

describe('Customer portal tenant isolation', () => {
  const customerContext = {
    accountId: 'account-a',
    userId: 'customer-1',
    role: 'CUSTOMER' as const,
    permissions: [],
    user: { id: 'customer-1', email: 'customer@example.com' },
    account: { id: 'account-a', name: 'Account A' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireCustomerContext.mockResolvedValue(customerContext);
    mockCreateRouteHandlerClient.mockResolvedValue({} as any);
  });

  it('prevents customers from querying jobs outside their own identity', async () => {
    const response = await getPortalJobs(
      new NextRequest(
        'http://localhost:3000/api/portal/jobs?customer_id=customer-2'
      )
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Customer access required');
  });

  it('scopes portal jobs to the authenticated customer', async () => {
    mockListJobs.mockResolvedValue({
      data: [],
      page: 1,
      pageSize: 20,
      total: 0,
      error: null,
    });

    await getPortalJobs(
      new NextRequest(
        'http://localhost:3000/api/portal/jobs?customer_id=customer-1'
      )
    );

    expect(mockListJobs).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-a',
        userId: 'customer-1',
        role: 'CUSTOMER',
      }),
      expect.objectContaining({ customerId: 'customer-1' })
    );
  });

  it('scopes portal estimates to the authenticated customer', async () => {
    mockListEstimates.mockResolvedValue({
      data: [],
      page: 1,
      pageSize: 10,
      total: 0,
      error: null,
    });

    await getPortalEstimates(
      new NextRequest('http://localhost:3000/api/portal/estimates')
    );

    expect(mockListEstimates).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-a',
        userId: 'customer-1',
        role: 'CUSTOMER',
      }),
      { customerId: 'customer-1' }
    );
  });

  it('scopes portal invoices to the authenticated customer', async () => {
    mockListInvoices.mockResolvedValue({
      data: [],
      page: 1,
      pageSize: 10,
      total: 0,
      error: null,
    });

    await getPortalInvoices(
      new NextRequest('http://localhost:3000/api/portal/invoices')
    );

    expect(mockListInvoices).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-a',
        userId: 'customer-1',
        role: 'CUSTOMER',
      }),
      { customerId: 'customer-1' }
    );
  });
});
