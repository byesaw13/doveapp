import { NextRequest, NextResponse } from 'next/server';
import { getClients, createClient, searchClients } from '@/lib/db/clients';

// GET /api/clients - Get all clients or search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (query) {
      const clients = await searchClients(query);
      return NextResponse.json(clients);
    }

    const clients = await getClients();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await createClient(body);
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
