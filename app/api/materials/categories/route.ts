import { NextResponse } from 'next/server';
import {
  getMaterialCategories,
  getInventorySummary,
  getStockAlerts,
} from '@/lib/db/materials';

// GET /api/materials/categories - Get all material categories
export async function GET() {
  try {
    const categories = await getMaterialCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
