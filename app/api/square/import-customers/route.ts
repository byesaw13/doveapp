import { NextResponse } from 'next/server';
import { fetchSquareCustomersWithToken } from '@/lib/square/customers';
import { bulkInsertClients } from '@/lib/db/clients';
import { getValidAccessToken } from '@/lib/square/token-manager';

export async function POST() {
  try {
    console.log('Starting Square import...');
    
    // Get OAuth access token
    const accessToken = await getValidAccessToken();
    
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Not connected to Square. Please connect your Square account first.',
          imported: 0,
          errors: ['Square account not connected'],
        },
        { status: 401 }
      );
    }
    
    // Fetch customers from Square using OAuth token
    const squareCustomers = await fetchSquareCustomersWithToken(accessToken);
    console.log(`Fetched ${squareCustomers.length} customers from Square`);

    if (squareCustomers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No customers found in Square',
        imported: 0,
        errors: [],
      });
    }

    // Import to database
    const result = await bulkInsertClients(
      squareCustomers.map((sc) => sc.customer)
    );

    return NextResponse.json({
      success: result.errors.length === 0,
      message: `Imported ${result.success} of ${squareCustomers.length} customers`,
      imported: result.success,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Square import error:', error);
    
    // Get detailed error info
    const errorMessage = error instanceof Error ? error.message : 'Import failed';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      error: JSON.stringify(error, null, 2)
    });
    
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        imported: 0,
        errors: [errorMessage, errorStack].filter(Boolean),
      },
      { status: 500 }
    );
  }
}
