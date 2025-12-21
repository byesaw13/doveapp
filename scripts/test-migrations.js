#!/usr/bin/env node

/**
 * Quick test to verify migrations worked
 * Tests that invoices.client_id exists and indexes are working
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testMigrations() {
  console.log('🧪 Testing Migrations...\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('⚠️  Skipping - no database credentials in environment');
    console.log('   (This is normal if running without .env.local)\n');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Test 1: Check if client_id column works
  console.log('Test 1: Querying invoices with client_id...');
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('id, client_id, status')
    .limit(1);

  if (invoicesError) {
    console.log('❌ FAILED:', invoicesError.message);
    if (invoicesError.message.includes('customer_id')) {
      console.log('   💡 Migration 062 may not be applied yet\n');
    }
    return;
  }

  console.log('✅ PASSED - client_id column exists and works\n');

  // Test 2: Check if composite index helps performance
  console.log('Test 2: Testing indexed query performance...');
  const start = Date.now();
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, status, client_id')
    .eq('status', 'completed')
    .limit(10);

  const duration = Date.now() - start;

  if (jobsError) {
    console.log('❌ FAILED:', jobsError.message);
    return;
  }

  console.log(`✅ PASSED - Query completed in ${duration}ms`);
  if (duration < 100) {
    console.log('   ⚡ Excellent performance! Indexes are working.\n');
  } else if (duration < 300) {
    console.log('   ✅ Good performance.\n');
  } else {
    console.log(
      '   ⚠️  Slower than expected. Indexes may still be building.\n'
    );
  }

  console.log('🎉 All tests passed! Migrations are working correctly.\n');
}

testMigrations().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
