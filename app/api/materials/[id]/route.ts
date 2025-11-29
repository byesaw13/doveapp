import { NextRequest, NextResponse } from 'next/server';
import {
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  getMaterialTransactions,
} from '@/lib/db/materials';
import { materialUpdateSchema } from '@/lib/validations/materials';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/materials/[id] - Get a specific material
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const material = await getMaterialById(params.id);

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Get recent transactions
    const transactions = await getMaterialTransactions(params.id, 10);

    return NextResponse.json({
      material,
      recent_transactions: transactions,
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material' },
      { status: 500 }
    );
  }
}

// PUT /api/materials/[id] - Update a material
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = materialUpdateSchema.parse({
      ...body,
      id: params.id,
    });

    // Update material
    const material = await updateMaterial(params.id, validatedData);

    return NextResponse.json(material);
  } catch (error: any) {
    console.error('Error updating material:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update material' },
      { status: 500 }
    );
  }
}

// DELETE /api/materials/[id] - Delete a material
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if material exists
    const material = await getMaterialById(params.id);
    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Soft delete
    await deleteMaterial(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete material' },
      { status: 500 }
    );
  }
}
