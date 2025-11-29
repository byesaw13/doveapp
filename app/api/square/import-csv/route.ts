import { NextRequest, NextResponse } from 'next/server';
import { parseSquareCSV } from '@/lib/square/csv-import';
import { bulkInsertClients } from '@/lib/db/clients';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded', imported: 0, errors: ['No file provided'] },
        { status: 400 }
      );
    }

    // Read file content
    const csvContent = await file.text();

    // Parse CSV
    const clients = parseSquareCSV(csvContent);

    if (clients.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No valid customers found in CSV',
        imported: 0,
        errors: [],
      });
    }

    // Import to database
    const result = await bulkInsertClients(clients);

    return NextResponse.json({
      success: result.errors.length === 0,
      message: `Imported ${result.success} of ${clients.length} customers`,
      imported: result.success,
      total: clients.length,
      errors: result.errors,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      },
      { status: 500 }
    );
  }
}
