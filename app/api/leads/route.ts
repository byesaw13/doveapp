import { NextRequest, NextResponse } from 'next/server';
import {
  getLeads,
  createLead,
  getLeadStats,
  searchLeads,
  getLeadsForFollowUp,
} from '@/lib/db/leads';

// GET /api/leads - Get all leads or search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = await getLeadStats();
      return NextResponse.json(stats);
    }

    if (action === 'follow-up') {
      const leads = await getLeadsForFollowUp();
      return NextResponse.json(leads);
    }

    if (query) {
      const leads = await searchLeads(query);
      return NextResponse.json(leads);
    }

    const leads = await getLeads();
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lead = await createLead(body);
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}
