import { NextRequest, NextResponse } from 'next/server';
import {
  calculateEstimate,
  getAllServiceItems,
  getAllServiceCategories,
  getServiceItem,
  getPricingRules,
  type LineItemInput,
} from '@/lib/pricingEngine';

/**
 * POST /api/estimate/pricebook
 *
 * Calculate an estimate based on price book service items.
 *
 * Request body:
 * {
 *   "lineItems": [
 *     { "id": 3001, "quantity": 1, "materialCost": 0, "tier": "standard" }
 *   ]
 * }
 *
 * Response:
 * {
 *   "lineItems": [...],
 *   "subtotal": 175,
 *   "adjustedTotal": 175,
 *   "appliedMinimum": false
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { lineItems } = body;

    if (!lineItems || !Array.isArray(lineItems)) {
      return NextResponse.json(
        {
          error: 'Invalid request body. Expected { lineItems: Array }',
        },
        { status: 400 }
      );
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        {
          error: 'At least one line item is required',
        },
        { status: 400 }
      );
    }

    // Validate line items
    for (const item of lineItems) {
      if (!item.id) {
        return NextResponse.json(
          {
            error: 'Each line item must have an "id" field',
          },
          { status: 400 }
        );
      }
    }

    // Calculate estimate
    const estimate = calculateEstimate(lineItems as LineItemInput[]);

    return NextResponse.json(estimate, { status: 200 });
  } catch (error) {
    console.error('Error calculating estimate:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to calculate estimate',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/estimate/pricebook
 *
 * Get price book data.
 *
 * Query parameters:
 * - ?action=items - Get all service items
 * - ?action=categories - Get all service categories
 * - ?action=rules - Get pricing rules
 * - ?id=3001 - Get specific service item by ID or code
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    // Get specific item by ID or code
    if (id) {
      const numericId = parseInt(id, 10);
      const serviceId = isNaN(numericId) ? id : numericId;
      const item = getServiceItem(serviceId);

      if (!item) {
        return NextResponse.json(
          {
            error: `Service item not found: ${id}`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(item, { status: 200 });
    }

    // Get data based on action
    switch (action) {
      case 'items':
        return NextResponse.json(getAllServiceItems(), { status: 200 });

      case 'categories':
        return NextResponse.json(getAllServiceCategories(), { status: 200 });

      case 'rules':
        return NextResponse.json(getPricingRules(), { status: 200 });

      default:
        return NextResponse.json(
          {
            items: getAllServiceItems(),
            categories: getAllServiceCategories(),
            rules: getPricingRules(),
          },
          { status: 200 }
        );
    }
  } catch (error) {
    console.error('Error fetching price book data:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch price book data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
