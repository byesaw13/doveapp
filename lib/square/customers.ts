// @ts-nocheck - Square SDK has incomplete types
import { squareClient } from './client';
import { createSquareClientWithToken } from './oauth';
import type { ClientInsert } from '@/types/client';

export interface SquareCustomerImport {
  customer: ClientInsert;
  squareId: string;
}

/**
 * Fetch all customers from Square API using static token (legacy)
 */
export async function fetchSquareCustomers(): Promise<
  SquareCustomerImport[]
> {
  return fetchSquareCustomersWithClient(squareClient);
}

/**
 * Fetch all customers from Square API using OAuth token
 */
export async function fetchSquareCustomersWithToken(
  accessToken: string
): Promise<SquareCustomerImport[]> {
  const client = createSquareClientWithToken(accessToken);
  return fetchSquareCustomersWithClient(client);
}

/**
 * Internal function to fetch customers with a given client
 */
async function fetchSquareCustomersWithClient(
  client: any
): Promise<SquareCustomerImport[]> {
  const customers: SquareCustomerImport[] = [];
  let cursor: string | undefined;

  try {
    console.log('Fetching customers from Square API...');
    
    do {
      console.log('Making Square API request with cursor:', cursor);
      
      // Note: Square SDK v43+ uses .list() method, not .listCustomers()
      const response = await client.customers.list({
        cursor: cursor,
      });
      
      console.log('Square API response status:', response.statusCode);
      console.log('Customers in response:', response.result.customers?.length || 0);

      if (response.result.customers) {
        for (const squareCustomer of response.result.customers) {
          const address = squareCustomer.address;

          customers.push({
            squareId: squareCustomer.id || '',
            customer: {
              square_customer_id: squareCustomer.id,
              first_name: squareCustomer.givenName || '',
              last_name: squareCustomer.familyName || '',
              company_name: squareCustomer.companyName || null,
              email: squareCustomer.emailAddress || null,
              phone: squareCustomer.phoneNumber || null,
              address_line1: address?.addressLine1 || null,
              address_line2: address?.addressLine2 || null,
              city: address?.locality || null,
              state: address?.administrativeDistrictLevel1 || null,
              zip_code: address?.postalCode || null,
              notes: squareCustomer.note || null,
            },
          });
        }
      }

      cursor = response.result.cursor;
    } while (cursor);

    console.log(`Successfully fetched ${customers.length} customers from Square`);
    return customers;
  } catch (error) {
    console.error('Error fetching Square customers:', error);
    
    // More detailed error for debugging
    if (error && typeof error === 'object') {
      console.error('Error details:', {
        message: (error as any).message,
        errors: (error as any).errors,
        statusCode: (error as any).statusCode,
        body: (error as any).body,
      });
    }
    
    const message = error instanceof Error ? error.message : 'Failed to fetch customers from Square';
    throw new Error(message);
  }
}
