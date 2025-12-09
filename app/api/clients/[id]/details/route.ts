import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getClient } from '@/lib/db/clients';
import { getPropertiesByClient } from '@/lib/db/properties';
import { getJobsByClient } from '@/lib/db/jobs';
import { getJobPaymentSummary, getPaymentsByJob } from '@/lib/db/payments';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID required' },
        { status: 400 }
      );
    }

    // Get basic client info
    const client = await getClient(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Batch load all related data in parallel
    const [properties, jobs, estimates] = await Promise.all([
      getPropertiesByClient(clientId),
      getJobsByClient(clientId),
      (async () => {
        const { data, error } = await supabase
          .from('estimates')
          .select(
            `
            *,
            lead:leads(id, first_name, last_name, email, phone),
            client:clients(id, first_name, last_name, company_name, email, phone)
          `
          )
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching estimates for client:', error);
          return [];
        }
        return data || [];
      })(),
    ]);

    // For jobs, get payment summaries in parallel
    const jobsWithPayments = await Promise.all(
      jobs.map(async (job) => {
        const [paymentSummary, payments] = await Promise.all([
          getJobPaymentSummary(job.id),
          getPaymentsByJob(job.id),
        ]);

        return {
          ...job,
          paymentSummary,
          payments,
        };
      })
    );

    return NextResponse.json({
      client,
      properties,
      jobs: jobsWithPayments,
      estimates,
    });
  } catch (error) {
    console.error('Error loading client details:', error);
    return NextResponse.json(
      { error: 'Failed to load client details' },
      { status: 500 }
    );
  }
}
