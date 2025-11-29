import Papa from 'papaparse';
import type { ClientInsert } from '@/types/client';

interface SquareCSVRow {
  'First Name': string;
  'Last Name': string;
  'Email Address': string;
  'Phone Number': string;
  'Company Name': string;
  'Street Address 1': string;
  'Street Address 2': string;
  'City': string;
  'State': string;
  'Postal Code': string;
  'Memo': string;
  'Square Customer ID': string;
}

/**
 * Parse Square CSV export and convert to client records
 */
export function parseSquareCSV(csvContent: string): ClientInsert[] {
  const clients: ClientInsert[] = [];

  const result = Papa.parse<SquareCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  for (const row of result.data) {
    // Skip rows without names
    const firstName = row['First Name']?.trim();
    const lastName = row['Last Name']?.trim();
    
    if (!firstName || !lastName) {
      continue;
    }

    // Clean phone number (remove quotes and +)
    let phone = row['Phone Number']?.replace(/['"]/g, '').trim();
    if (phone?.startsWith('+')) {
      phone = phone.substring(1);
    }

    clients.push({
      square_customer_id: row['Square Customer ID']?.trim() || null,
      first_name: firstName,
      last_name: lastName,
      company_name: row['Company Name']?.trim() || null,
      email: row['Email Address']?.trim() || null,
      phone: phone || null,
      address_line1: row['Street Address 1']?.trim() || null,
      address_line2: row['Street Address 2']?.trim() || null,
      city: row['City']?.trim() || null,
      state: row['State']?.trim() || null,
      zip_code: row['Postal Code']?.trim() || null,
      notes: row['Memo']?.trim() || null,
    });
  }

  return clients;
}
