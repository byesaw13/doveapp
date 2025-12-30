import { NextRequest, NextResponse } from 'next/server';
import type { LeadStatus, LeadStats } from '@/types/lead';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canManageAdmin } from '@/lib/auth-guards';
import { errorResponse, unauthorizedResponse } from '@/lib/api-helpers';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// GET /api/leads - Get all leads or search
export async function GET(request: NextRequest) {
  try {
    // Try to get account context, but allow demo access if no account
    let context;
    let supabase;
    try {
      context = await requireAccountContext(request);
      supabase = await createRouteHandlerClient();
    } catch (error) {
      // For demo purposes, allow access without account context
      // In production, this should require proper authentication
      // Create a basic supabase client for demo
      supabase = await createRouteHandlerClient();
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const action = searchParams.get('action');
    const status = searchParams.get('status');

    let queryBuilder = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by account for multi-tenancy if context exists
    if (context?.accountId) {
      queryBuilder = queryBuilder.eq('account_id', context.accountId);
    }

    if (action === 'follow-up') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      queryBuilder = queryBuilder
        .lt('last_contact_date', weekAgo.toISOString())
        .in('status', ['new', 'contacted', 'qualified']);
    }

    if (
      status &&
      [
        'new',
        'contacted',
        'qualified',
        'proposal_sent',
        'negotiating',
        'converted',
        'lost',
        'unqualified',
      ].includes(status)
    ) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`
      );
    }

    const { data: leads, error } = await queryBuilder;

    if (error) {
      console.error('Error fetching leads:', error);
      return errorResponse(error, 'Failed to fetch leads');
    }

    // Calculate stats if requested
    if (action === 'stats') {
      const totalLeads = leads?.length || 0;
      const newLeads =
        leads?.filter((l: any) => l.status === 'new').length || 0;
      const qualifiedLeads =
        leads?.filter((l: any) => l.status === 'qualified').length || 0;
      const convertedLeads =
        leads?.filter((l: any) => l.status === 'converted').length || 0;
      const lostLeads =
        leads?.filter((l: any) => l.status === 'lost').length || 0;

      // Calculate conversion rate
      const conversionRate =
        totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Calculate average time to conversion (simplified - would need actual conversion dates)
      const averageTimeToConversion = 14; // Placeholder in days

      // Calculate total estimated value
      const totalEstimatedValue =
        leads?.reduce(
          (sum: number, lead: any) => sum + (lead.estimated_value || 0),
          0
        ) || 0;

      // Group by source
      const bySource: Record<string, number> = {};
      const validSources = [
        'website',
        'referral',
        'social_media',
        'email',
        'phone',
        'walk_in',
        'advertisement',
        'other',
      ];
      validSources.forEach((source) => {
        bySource[source] = 0;
      });
      leads?.forEach((lead: any) => {
        if (lead.source && validSources.includes(lead.source)) {
          bySource[lead.source] = (bySource[lead.source] || 0) + 1;
        }
      });

      // Group by status
      const byStatus: Record<string, number> = {};
      const validStatuses = [
        'new',
        'contacted',
        'qualified',
        'proposal_sent',
        'negotiating',
        'converted',
        'lost',
        'unqualified',
      ];
      validStatuses.forEach((status) => {
        byStatus[status] = 0;
      });
      leads?.forEach((lead: any) => {
        if (lead.status && validStatuses.includes(lead.status)) {
          byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
        }
      });

      // Group by priority
      const byPriority: Record<string, number> = {};
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      validPriorities.forEach((priority) => {
        byPriority[priority] = 0;
      });
      leads?.forEach((lead: any) => {
        if (lead.priority && validPriorities.includes(lead.priority)) {
          byPriority[lead.priority] = (byPriority[lead.priority] || 0) + 1;
        }
      });

      const stats = {
        total_leads: totalLeads,
        new_leads: newLeads,
        qualified_leads: qualifiedLeads,
        converted_leads: convertedLeads,
        lost_leads: lostLeads,
        conversion_rate: conversionRate,
        average_time_to_conversion: averageTimeToConversion,
        total_estimated_value: totalEstimatedValue,
        by_source: bySource,
        by_status: byStatus,
        by_priority: byPriority,
      };
      return NextResponse.json(stats);
    }

    return NextResponse.json(leads || []);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return unauthorizedResponse();
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    // Try to get account context, but allow demo access if no account
    let context;
    let supabase;
    try {
      context = await requireAccountContext(request);
      if (!canManageAdmin(context.role)) {
        return Response.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
      supabase = await createRouteHandlerClient();
    } catch (error) {
      // For demo purposes, allow access without account context
      supabase = await createRouteHandlerClient();
    }
    const body = await request.json();

    // Add account_id to lead data if context exists
    const leadData = {
      ...body,
      ...(context?.accountId && { account_id: context.accountId }),
    };

    const { data: lead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return errorResponse(error, 'Failed to create lead');
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return unauthorizedResponse();
  }
}
