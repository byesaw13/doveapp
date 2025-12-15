#!/usr/bin/env node

/**
 * Test Supabase Connection
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');

    // Test basic connection
    const { data, error } = await supabase
      .from('accounts')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }

    console.log('✅ Supabase connection successful');

    // Check if our account exists
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('name', 'Dovetails Services LLC');

    if (accountError) {
      console.error('❌ Account query failed:', accountError.message);
      return;
    }

    if (accounts && accounts.length > 0) {
      console.log('✅ Account found:', accounts[0]);
    } else {
      console.log('⚠️  Account not found');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection();
