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
