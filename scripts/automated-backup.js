#!/usr/bin/env node

/**
 * Automated Database Backup Script
 *
 * This script creates a backup of all critical database tables
 * and uploads it to a storage location (GitHub, S3, or local filesystem).
 *
 * Usage:
 *   node scripts/automated-backup.js
 *
 * Environment Variables Required:
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key (not anon key)
 *   BACKUP_STORAGE - 'github' | 'local' (default: local)
 *   BACKUP_RETENTION_DAYS - Number of days to keep backups (default: 30)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BACKUP_RETENTION_DAYS = parseInt(
  process.env.BACKUP_RETENTION_DAYS || '30',
  10
);
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Tables to backup
const TABLES_TO_BACKUP = [
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
  'time_tracking',
  'job_photos',
  'pricebook_items',
  'pricebook_categories',
];

async function createBackup() {
  console.log('🔄 Starting database backup...');

  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    tables: {},
    metadata: {
      totalRecords: 0,
      tablesBackedUp: 0,
    },
  };

  // Backup each table
  for (const tableName of TABLES_TO_BACKUP) {
    try {
      console.log(`  📦 Backing up table: ${tableName}`);
      const { data, error } = await supabase.from(tableName).select('*');

      if (error) {
        console.error(`  ❌ Error backing up ${tableName}:`, error.message);
        backup.tables[tableName] = { error: error.message, data: [] };
        continue;
      }

      backup.tables[tableName] = { data: data || [], count: data?.length || 0 };
      backup.metadata.totalRecords += data?.length || 0;
      backup.metadata.tablesBackedUp += 1;
      console.log(
        `  ✅ Backed up ${data?.length || 0} records from ${tableName}`
      );
    } catch (err) {
      console.error(`  ❌ Exception backing up ${tableName}:`, err.message);
      backup.tables[tableName] = { error: err.message, data: [] };
    }
  }

  return backup;
}

async function saveBackupLocally(backup) {
  // Create backups directory if it doesn't exist
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  // Write backup to file
  await fs.writeFile(filepath, JSON.stringify(backup, null, 2));
  console.log(`💾 Backup saved to: ${filepath}`);

  // Get file size
  const stats = await fs.stat(filepath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Backup size: ${fileSizeMB} MB`);

  return filepath;
}

async function cleanupOldBackups() {
  console.log(
    `🧹 Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days...`
  );

  try {
    const files = await fs.readdir(BACKUP_DIR);
    const now = Date.now();
    const maxAge = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      if (!file.startsWith('backup-') || !file.endsWith('.json')) continue;

      const filepath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filepath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        await fs.unlink(filepath);
        deletedCount++;
        console.log(`  🗑️  Deleted old backup: ${file}`);
      }
    }

    console.log(`✅ Cleanup complete. Deleted ${deletedCount} old backup(s).`);
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
}

async function main() {
  try {
    console.log('═══════════════════════════════════════');
    console.log('  DoveApp Database Backup');
    console.log(`  Started: ${new Date().toLocaleString()}`);
    console.log('═══════════════════════════════════════\n');

    // Create backup
    const backup = await createBackup();

    console.log('\n📊 Backup Summary:');
    console.log(`  Total records: ${backup.metadata.totalRecords}`);
    console.log(
      `  Tables backed up: ${backup.metadata.tablesBackedUp}/${TABLES_TO_BACKUP.length}`
    );

    // Save backup
    await saveBackupLocally(backup);

    // Cleanup old backups
    await cleanupOldBackups();

    console.log('\n✅ Backup completed successfully!');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Backup failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run the script
main();
