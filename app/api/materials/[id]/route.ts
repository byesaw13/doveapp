import { NextRequest, NextResponse } from 'next/server';
import {
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  getMaterialTransactions,
} from '@/lib/db/materials';
import { materialUpdateSchema } from '@/lib/validations/materials';

// GET /api/materials/[id] - Get a specific material
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const material = await getMaterialById(id);

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Get recent transactions
    const transactions = await getMaterialTransactions(id, 10);

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
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = materialUpdateSchema.parse({
      ...body,
      id,
    });

    // Update material
    const material = await updateMaterial(id, validatedData);

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error updating material:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).errors },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update material';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/materials/[id] - Delete a material
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if material exists
    const material = await getMaterialById(id);
    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Soft delete
    await deleteMaterial(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting material:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete material';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
