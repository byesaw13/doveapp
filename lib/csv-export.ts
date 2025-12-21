// CSV Export Utility
// Converts data to CSV and triggers download

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // If columns not specified, use all keys from first object
  const columnsToExport =
    columns ||
    Object.keys(data[0]).map((key) => ({ key: key as keyof T, label: key }));

  // Create CSV header row
  const headers = columnsToExport.map((col) => col.label).join(',');

  // Create CSV data rows
  const rows = data.map((row) => {
    return columnsToExport
      .map((col) => {
        const value = row[col.key];
        // Handle different data types
        if (value === null || value === undefined) {
          return '';
        }
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringValue = String(value);
        if (
          stringValue.includes(',') ||
          stringValue.includes('"') ||
          stringValue.includes('\n')
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [headers, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

// Export leads to CSV
export function exportLeadsToCSV(leads: any[]): void {
  exportToCSV(leads, 'leads', [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'company_name', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'service_type', label: 'Service Type' },
    { key: 'estimated_value', label: 'Estimated Value' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip_code', label: 'Zip Code' },
    { key: 'created_at', label: 'Created Date' },
  ]);
}

// Export clients to CSV
export function exportClientsToCSV(clients: any[]): void {
  exportToCSV(clients, 'clients', [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'company_name', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address_line1', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip_code', label: 'Zip Code' },
    { key: 'created_at', label: 'Created Date' },
  ]);
}

// Export jobs to CSV
export function exportJobsToCSV(jobs: any[]): void {
  exportToCSV(jobs, 'jobs', [
    { key: 'id', label: 'Job ID' },
    { key: 'client_name', label: 'Client' },
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
    { key: 'total_amount', label: 'Total Amount' },
    { key: 'amount_paid', label: 'Amount Paid' },
    { key: 'scheduled_for', label: 'Scheduled Date' },
    { key: 'created_at', label: 'Created Date' },
  ]);
}

// Export estimates to CSV
export function exportEstimatesToCSV(estimates: any[]): void {
  exportToCSV(estimates, 'estimates', [
    { key: 'id', label: 'Estimate ID' },
    { key: 'client_name', label: 'Client' },
    { key: 'status', label: 'Status' },
    { key: 'total_amount', label: 'Total Amount' },
    { key: 'created_at', label: 'Created Date' },
    { key: 'sent_at', label: 'Sent Date' },
    { key: 'valid_until', label: 'Valid Until' },
  ]);
}

// ============================================================================
// CSV IMPORT UTILITIES
// ============================================================================

export interface CSVImportResult<T> {
  success: boolean;
  data: T[];
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value: any;
  }>;
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
  };
}

/**
 * Parse CSV content into array of objects
 */
export function parseCSV<T = Record<string, string>>(
  csvContent: string,
  options: {
    hasHeaders?: boolean;
    delimiter?: string;
    skipEmptyLines?: boolean;
  } = {}
): T[] {
  const { hasHeaders = true, delimiter = ',', skipEmptyLines = true } = options;

  const lines = csvContent
    .split('\n')
    .filter((line) => !skipEmptyLines || line.trim().length > 0);

  if (lines.length === 0) return [];

  let headers: string[] = [];
  let dataStartIndex = 0;

  if (hasHeaders) {
    headers = parseCSVLine(lines[0], delimiter);
    dataStartIndex = 1;
  } else {
    // Generate numeric headers
    const firstLine = parseCSVLine(lines[0], delimiter);
    headers = firstLine.map((_, index) => `col_${index}`);
  }

  const result: T[] = [];

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line, delimiter);
    const obj: Record<string, string> = {};

    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });

    result.push(obj as T);
  }

  return result;
}

/**
 * Parse a single CSV line handling quotes and commas
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar) {
      if (nextChar === quoteChar) {
        // Escaped quote
        current += char;
        i++; // Skip next quote
      } else {
        inQuotes = false;
        quoteChar = '';
      }
    } else if (!inQuotes && char === delimiter) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Import clients from CSV with validation
 */
export function importClientsFromCSV(csvContent: string): CSVImportResult<{
  first_name: string;
  last_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}> {
  const rawData = parseCSV(csvContent);
  const errors: Array<{
    row: number;
    field: string;
    message: string;
    value: any;
  }> = [];
  const validData: Array<{
    first_name: string;
    last_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    address_line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  }> = [];

  rawData.forEach((row, index) => {
    const rowNumber = index + 1;
    let isValid = true;

    // Validate required fields
    if (!row.first_name || row.first_name.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'first_name',
        message: 'First name is required',
        value: row.first_name,
      });
      isValid = false;
    }

    if (!row.last_name || row.last_name.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'last_name',
        message: 'Last name is required',
        value: row.last_name,
      });
      isValid = false;
    }

    // Validate email format if provided
    if (row.email && row.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email.trim())) {
        errors.push({
          row: rowNumber,
          field: 'email',
          message: 'Invalid email format',
          value: row.email,
        });
        isValid = false;
      }
    }

    // Validate phone format if provided
    if (row.phone && row.phone.trim() !== '') {
      const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
      if (!phoneRegex.test(row.phone.trim())) {
        errors.push({
          row: rowNumber,
          field: 'phone',
          message: 'Invalid phone number format',
          value: row.phone,
        });
        isValid = false;
      }
    }

    // Validate name lengths
    if (row.first_name && row.first_name.length > 100) {
      errors.push({
        row: rowNumber,
        field: 'first_name',
        message: 'First name must be less than 100 characters',
        value: row.first_name,
      });
      isValid = false;
    }

    if (row.last_name && row.last_name.length > 100) {
      errors.push({
        row: rowNumber,
        field: 'last_name',
        message: 'Last name must be less than 100 characters',
        value: row.last_name,
      });
      isValid = false;
    }

    if (row.company_name && row.company_name.length > 200) {
      errors.push({
        row: rowNumber,
        field: 'company_name',
        message: 'Company name must be less than 200 characters',
        value: row.company_name,
      });
      isValid = false;
    }

    if (isValid) {
      validData.push({
        first_name: row.first_name.trim(),
        last_name: row.last_name.trim(),
        company_name: row.company_name?.trim() || undefined,
        email: row.email?.trim() || undefined,
        phone: row.phone?.trim() || undefined,
        address_line1: row.address_line1?.trim() || undefined,
        city: row.city?.trim() || undefined,
        state: row.state?.trim() || undefined,
        postal_code: row.postal_code?.trim() || undefined,
      });
    }
  });

  return {
    success: errors.length === 0,
    data: validData,
    errors,
    summary: {
      totalRows: rawData.length,
      validRows: validData.length,
      errorRows: errors.length,
    },
  };
}
