import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext, canManageAdmin } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { importClientsFromCSV, exportClientsToCSV } from '@/lib/csv-export';
import { validateRequest, createClientSchema } from '@/lib/api/validation';
import { PerformanceLogger } from '@/lib/api/performance';
import { z } from 'zod';

// Schema for bulk import validation
const bulkImportSchema = z.object({
  clients: z.array(createClientSchema),
});

/**
 * GET /api/admin/clients/bulk/export - Export all clients to CSV
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication and require admin access
    const context = await requireAccountContext(request);
    if (!canManageAdmin(context.role)) {
      perfLogger.complete(403);
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createAuthenticatedClient(request);

    // Get all clients (temporarily disabled account filtering)
    perfLogger.incrementQueryCount();
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients for export:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to fetch clients for export' },
        { status: 500 }
      );
    }

    // Export to CSV
    exportClientsToCSV(clients || []);

    const metrics = perfLogger.complete(200);
    return NextResponse.json({
      success: true,
      message: 'CSV export initiated',
      recordCount: clients?.length || 0,
      performance: {
        duration: metrics.duration,
        queryCount: metrics.queryCount,
      },
    });
  } catch (error) {
    console.error('Error in clients bulk export:', error);
    perfLogger.complete(401);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * POST /api/admin/clients/bulk/import - Import clients from CSV data
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'POST');

  try {
    // Validate authentication and require admin access
    const context = await requireAccountContext(request);
    if (!canManageAdmin(context.role)) {
      perfLogger.complete(403);
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createAuthenticatedClient(request);

    // Get the CSV content from request body
    const body = await request.json();
    const { csvContent } = body;

    if (!csvContent || typeof csvContent !== 'string') {
      perfLogger.complete(400);
      return NextResponse.json(
        { error: 'CSV content is required and must be a string' },
        { status: 400 }
      );
    }

    // Parse and validate CSV
    const importResult = importClientsFromCSV(csvContent);

    if (!importResult.success && importResult.errors.length > 0) {
      perfLogger.complete(400);
      return NextResponse.json(
        {
          error: 'CSV validation failed',
          details: importResult.errors.slice(0, 50), // Limit error details
          summary: importResult.summary,
        },
        { status: 400 }
      );
    }

    if (importResult.data.length === 0) {
      perfLogger.complete(400);
      return NextResponse.json(
        { error: 'No valid clients found in CSV' },
        { status: 400 }
      );
    }

    // Insert clients in batches to avoid timeout
    const BATCH_SIZE = 50;
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < importResult.data.length; i += BATCH_SIZE) {
      const batch = importResult.data.slice(i, i + BATCH_SIZE);

      try {
        perfLogger.incrementQueryCount();
        const { data, error } = await supabase
          .from('clients')
          .insert(batch)
          .select();

        if (error) {
          console.error('Error inserting client batch:', error);
          errorCount += batch.length;
          errors.push({
            batch: Math.floor(i / BATCH_SIZE) + 1,
            error: error.message,
            count: batch.length,
          });
        } else {
          successCount += data?.length || 0;
        }
      } catch (err) {
        errorCount += batch.length;
        errors.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          error: err instanceof Error ? err.message : 'Unknown error',
          count: batch.length,
        });
      }
    }

    const metrics = perfLogger.complete(201);
    return NextResponse.json(
      {
        success: errorCount === 0,
        message: `Imported ${successCount} clients${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        summary: {
          totalAttempted: importResult.data.length,
          successful: successCount,
          failed: errorCount,
          csvValidation: importResult.summary,
        },
        errors: errors.length > 0 ? errors : undefined,
        performance: {
          duration: metrics.duration,
          queryCount: metrics.queryCount,
        },
      },
      { status: errorCount === 0 ? 201 : 207 } // 207 = Multi-Status for partial success
    );
  } catch (error) {
    console.error('Error in clients bulk import:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error during import' },
      { status: 500 }
    );
  }
}
