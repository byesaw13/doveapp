#!/usr/bin/env node

/**
 * Migration Verification Script
 *
 * This script checks if critical database migrations have been applied
 *
 * Usage:
 *   node scripts/verify-migrations.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkColumnExists(supabase, tableName, columnName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);

    if (error && error.message.includes('column')) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

async function checkIndexExists(supabase, indexName) {
  try {
    // Query pg_indexes view directly
    const { data, error } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('schemaname', 'public')
      .eq('indexname', indexName)
      .limit(1);

    if (error) {
      // Fallback: just return null to indicate we can't verify
      return null;
    }

    return data && data.length > 0;
  } catch (err) {
    console.log(
      `  ⚠️  Could not verify index ${indexName} - manual check needed`
    );
    return null;
  }
}

async function verifyMigrations() {
  console.log('═══════════════════════════════════════');
  console.log('  Migration Verification');
  console.log('═══════════════════════════════════════\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('Checking Migration 062: Rename customer_id to client_id\n');

  // Check if client_id column exists
  const hasClientId = await checkColumnExists(
    supabase,
    'invoices',
    'client_id'
  );
  const hasCustomerId = await checkColumnExists(
    supabase,
    'invoices',
    'customer_id'
  );

  if (hasClientId && !hasCustomerId) {
    console.log('  ✅ Migration 062: APPLIED');
    console.log('     - invoices.client_id column exists');
    console.log('     - invoices.customer_id column removed\n');
  } else if (!hasClientId && hasCustomerId) {
    console.log('  ❌ Migration 062: NOT APPLIED');
    console.log('     - invoices.customer_id still exists');
    console.log(
      '     - Need to run: supabase/migrations/062_rename_invoices_customer_id_to_client_id.sql\n'
    );
  } else if (hasClientId && hasCustomerId) {
    console.log('  ⚠️  Migration 062: PARTIAL');
    console.log('     - Both columns exist (migration in progress or failed)');
    console.log('     - Manual intervention needed\n');
  } else {
    console.log('  ❓ Migration 062: UNKNOWN');
    console.log('     - Could not verify column existence\n');
  }

  console.log('Checking Migration 063: Composite Indexes\n');

  const indexesToCheck = [
    'idx_jobs_client_status',
    'idx_jobs_status_service_date',
    'idx_invoices_status_due_date',
    'idx_invoices_client_status',
    'idx_estimates_client_status',
    'idx_clients_email',
    'idx_clients_phone',
  ];

  let appliedCount = 0;
  let unknownCount = 0;

  for (const indexName of indexesToCheck) {
    const exists = await checkIndexExists(supabase, indexName);
    if (exists === true) {
      console.log(`  ✅ ${indexName}`);
      appliedCount++;
    } else if (exists === false) {
      console.log(`  ❌ ${indexName}`);
    } else {
      unknownCount++;
    }
  }

  console.log('');

  if (appliedCount === indexesToCheck.length) {
    console.log('  ✅ Migration 063: FULLY APPLIED');
    console.log(
      `     - All ${indexesToCheck.length} composite indexes exist\n`
    );
  } else if (appliedCount > 0) {
    console.log('  ⚠️  Migration 063: PARTIALLY APPLIED');
    console.log(
      `     - ${appliedCount}/${indexesToCheck.length} indexes exist`
    );
    console.log(
      '     - Run: supabase/migrations/063_add_composite_indexes.sql\n'
    );
  } else if (unknownCount === indexesToCheck.length) {
    console.log('  ⚠️  Migration 063: CANNOT VERIFY');
    console.log(
      '     - Need to manually check indexes in Supabase SQL editor\n'
    );
  } else {
    console.log('  ❌ Migration 063: NOT APPLIED');
    console.log(
      '     - Run: supabase/migrations/063_add_composite_indexes.sql\n'
    );
  }

  console.log('═══════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════');
  console.log('\nTo apply migrations manually:');
  console.log('1. Go to Supabase Dashboard > SQL Editor');
  console.log('2. Copy contents of migration file');
  console.log('3. Run the SQL script\n');

  console.log('Migration files location:');
  console.log(
    '  - supabase/migrations/062_rename_invoices_customer_id_to_client_id.sql'
  );
  console.log('  - supabase/migrations/063_add_composite_indexes.sql\n');
}

verifyMigrations().catch((err) => {
  console.error('\n❌ Error during verification:', err.message);
  process.exit(1);
});
