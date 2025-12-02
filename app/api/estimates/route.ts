import { NextRequest, NextResponse } from 'next/server';
import {
  getEstimates,
  createEstimate,
  getEstimateStats,
  searchEstimates,
  getExpiredEstimates,
  createEstimateFromTemplate,
} from '@/lib/db/estimates';

// GET /api/estimates - Get all estimates or search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = await getEstimateStats();
      return NextResponse.json(stats);
    }

    if (action === 'expired') {
      const estimates = await getExpiredEstimates();
      return NextResponse.json(estimates);
    }

    if (query) {
      const estimates = await searchEstimates(query);
      return NextResponse.json(estimates);
    }

    const estimates = await getEstimates();
    return NextResponse.json(estimates);
  } catch (error) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimates' },
      { status: 500 }
    );
  }
}

// POST /api/estimates - Create a new estimate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from_template, template_id, ...estimateData } = body;

    if (from_template && template_id) {
      const estimate = await createEstimateFromTemplate(
        template_id,
        estimateData
      );
      return NextResponse.json(estimate, { status: 201 });
    }

    const estimate = await createEstimate(estimateData);
    return NextResponse.json(estimate, { status: 201 });
  } catch (error) {
    console.error('Error creating estimate:', error);
    return NextResponse.json(
      { error: 'Failed to create estimate' },
      { status: 500 }
    );
  }
}
