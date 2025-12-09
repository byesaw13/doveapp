import { supabase } from './supabase';

export interface BackupData {
  timestamp: string;
  tables: Record<string, unknown[]>;
}

/**
 * Export all data from specified tables to JSON format for local backup
 */
export async function exportDataToJSON(
  tableNames: string[]
): Promise<BackupData> {
  const backup: BackupData = {
    timestamp: new Date().toISOString(),
    tables: {},
  };

  for (const tableName of tableNames) {
    const { data, error } = await supabase.from(tableName).select('*');

    if (error) {
      console.error(`Error backing up table ${tableName}:`, error);
      continue;
    }

    backup.tables[tableName] = data || [];
  }

  return backup;
}

/**
 * Download backup data as JSON file
 */
export function downloadBackup(backup: BackupData, filename?: string): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download =
    filename || `backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import data from backup JSON to restore tables
 */
export async function importDataFromJSON(
  backup: BackupData
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const [tableName, records] of Object.entries(backup.tables)) {
    if (!Array.isArray(records) || records.length === 0) continue;

    const { error } = await supabase.from(tableName).upsert(records);

    if (error) {
      errors.push(`Error restoring table ${tableName}: ${error.message}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Backup all current tables in the database
 */
export async function backupAllData(): Promise<BackupData> {
  // List of all tables to backup (update as new tables are added)
  const tables = [
    'clients',
    'jobs',
    'job_line_items',
    'payments',
    'properties',
    'materials',
    'leads',
    'estimates',
    'invoices',
    'invoice_line_items',
    'client_activities',
    'business_settings',
    'square_connections',
  ];
  return exportDataToJSON(tables);
}

/**
 * Create and download a backup file for all data
 */
export async function createAndDownloadBackup(): Promise<void> {
  const backup = await backupAllData();
  downloadBackup(backup);
}
