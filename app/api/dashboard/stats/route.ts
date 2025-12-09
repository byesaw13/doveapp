import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get counts in parallel for better performance
    const [
      clientsResult,
      propertiesResult,
      jobsResult,
      estimatesResult,
      leadsResult,
    ] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('estimates').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
    ]);

    // Check for errors
    const errors = [];
    if (clientsResult.error)
      errors.push(`clients: ${clientsResult.error.message}`);
    if (propertiesResult.error)
      errors.push(`properties: ${propertiesResult.error.message}`);
    if (jobsResult.error) errors.push(`jobs: ${jobsResult.error.message}`);
    if (estimatesResult.error)
      errors.push(`estimates: ${estimatesResult.error.message}`);
    if (leadsResult.error) errors.push(`leads: ${leadsResult.error.message}`);

    if (errors.length > 0) {
      console.error('Errors fetching counts:', errors);
      // Return zeros on error to prevent UI breakage
      return NextResponse.json({
        totalClients: 0,
        totalProperties: 0,
        totalJobs: 0,
        totalEstimates: 0,
        totalLeads: 0,
      });
    }

    return NextResponse.json({
      totalClients: clientsResult.count || 0,
      totalProperties: propertiesResult.count || 0,
      totalJobs: jobsResult.count || 0,
      totalEstimates: estimatesResult.count || 0,
      totalLeads: leadsResult.count || 0,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      {
        totalClients: 0,
        totalProperties: 0,
        totalJobs: 0,
        totalEstimates: 0,
        totalLeads: 0,
      },
      { status: 500 }
    );
  }
}
