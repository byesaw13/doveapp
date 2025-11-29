import { NextRequest, NextResponse } from 'next/server';
import {
  getMaterials,
  createMaterial,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  getMaterialCategories,
} from '@/lib/db/materials';
import {
  materialSchema,
  materialUpdateSchema,
  materialQuerySchema,
} from '@/lib/validations/materials';

// GET /api/materials - List materials with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const queryParams = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      low_stock_only: searchParams.get('low_stock_only') === 'true',
      out_of_stock_only: searchParams.get('out_of_stock_only') === 'true',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 20,
      sort_by: (searchParams.get('sort_by') as any) || 'name',
      sort_order: (searchParams.get('sort_order') as any) || 'asc',
    };

    // Validate query parameters
    const validatedParams = materialQuerySchema.parse(queryParams);

    // Apply client-side filtering for low_stock_only since we can't do column comparison in Supabase
    let { materials, total } = await getMaterials(validatedParams);

    if (validatedParams.low_stock_only) {
      materials = materials.filter((m) => m.current_stock <= m.min_stock);
      total = materials.length;
    }

    if (validatedParams.out_of_stock_only) {
      materials = materials.filter((m) => m.current_stock === 0);
      total = materials.length;
    }

    return NextResponse.json({
      materials,
      total,
      page: validatedParams.page,
      limit: validatedParams.limit,
      totalPages: Math.ceil(total / validatedParams.limit),
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

// POST /api/materials - Create a new material
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = materialSchema.parse(body);

    // Create material
    const material = await createMaterial(validatedData);

    return NextResponse.json(material, { status: 201 });
  } catch (error: any) {
    console.error('Error creating material:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create material' },
      { status: 500 }
    );
  }
}
