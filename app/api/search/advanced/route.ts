import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { PerformanceLogger } from '@/lib/api/performance';

interface SearchResult {
  id: string;
  type: 'client' | 'job' | 'estimate' | 'property';
  title: string;
  subtitle: string;
  description: string;
  status?: string;
  amount?: number;
  date?: string;
  metadata: Record<string, any>;
}

/**
 * GET /api/search/advanced - Advanced search across all business data
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication and get account context
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);

    const searchParams = url.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, clients, jobs, estimates, properties
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate search query
    if (!query.trim() || query.length < 2) {
      perfLogger.complete(400);
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase().trim();

    // Search clients
    if (type === 'all' || type === 'clients') {
      perfLogger.incrementQueryCount();
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        )
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (!clientsError && clients) {
        results.push(
          ...clients.map((client) => ({
            id: client.id,
            type: 'client' as const,
            title: `${client.first_name} ${client.last_name}`,
            subtitle: client.company_name || 'Individual',
            description: `Email: ${client.email || 'N/A'} | Phone: ${client.phone || 'N/A'}`,
            status: 'active',
            metadata: {
              email: client.email,
              phone: client.phone,
              address:
                `${client.address_line1 || ''} ${client.city || ''} ${client.state || ''}`.trim(),
            },
          }))
        );
      }
    }

    // Search jobs
    if (type === 'all' || type === 'jobs') {
      perfLogger.incrementQueryCount();
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(
          `
          *,
          clients!jobs_client_id_fkey (
            first_name,
            last_name,
            company_name,
            email
          )
        `
        )
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (!jobsError && jobs) {
        results.push(
          ...jobs.map((job) => ({
            id: job.id,
            type: 'job' as const,
            title: job.title,
            subtitle: job.clients
              ? `${job.clients.first_name} ${job.clients.last_name}`
              : 'Unknown Client',
            description: job.description || 'No description',
            status: job.status,
            amount: job.total,
            date: job.service_date || job.created_at,
            metadata: {
              job_number: job.job_number,
              priority: 'medium', // Could be added to schema
            },
          }))
        );
      }
    }

    // Search estimates
    if (type === 'all' || type === 'estimates') {
      perfLogger.incrementQueryCount();
      const { data: estimates, error: estimatesError } = await supabase
        .from('estimates')
        .select(
          `
          *,
          clients (
            first_name,
            last_name,
            company_name
          )
        `
        )
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (!estimatesError && estimates) {
        results.push(
          ...estimates.map((estimate) => ({
            id: estimate.id,
            type: 'estimate' as const,
            title: estimate.title,
            subtitle: estimate.clients
              ? `${estimate.clients.first_name} ${estimate.clients.last_name}`
              : 'Unknown Client',
            description: estimate.description || 'No description',
            status: estimate.status,
            date: estimate.created_at,
            metadata: {
              valid_until: estimate.valid_until,
              sent_at: estimate.sent_at,
            },
          }))
        );
      }
    }

    // Search properties (if they have searchable fields)
    if (type === 'all' || type === 'properties') {
      // Assuming properties table exists with searchable fields
      try {
        perfLogger.incrementQueryCount();
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .or(
            `name.ilike.%${searchTerm}%,address_line1.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`
          )
          .limit(limit)
          .range(offset, offset + limit - 1);

        if (!propertiesError && properties) {
          results.push(
            ...properties.map((property) => ({
              id: property.id,
              type: 'property' as const,
              title: property.name || `Property ${property.id}`,
              subtitle:
                `${property.address_line1 || ''} ${property.city || ''}`.trim(),
              description: property.notes || 'No notes',
              status: 'active',
              metadata: {
                type: property.property_type,
                square_footage: property.square_footage,
              },
            }))
          );
        }
      } catch (error) {
        // Properties table might not exist yet, skip silently
      }
    }

    // Sort results by relevance (title matches first, then description matches)
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(searchTerm);
      const bTitle = b.title.toLowerCase().includes(searchTerm);

      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;

      // If both have title matches or neither do, sort by type priority
      const typePriority = { client: 1, job: 2, estimate: 3, property: 4 };
      return typePriority[a.type] - typePriority[b.type];
    });

    // Limit total results
    const limitedResults = results.slice(0, limit);

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      {
        results: limitedResults,
        summary: {
          total: limitedResults.length,
          query,
          type,
          limit,
          offset,
        },
        performance: {
          duration: metrics.duration,
          queryCount: metrics.queryCount,
        },
      },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in advanced search:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error during search' },
      { status: 500 }
    );
  }
}
