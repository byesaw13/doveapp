#!/usr/bin/env node

/**
 * Check RLS Status and Policies
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRLSStatus() {
  console.log('🔍 Checking RLS Policies Status\n');

  try {
    // Check if the helper function exists
    console.log('1️⃣ Checking for user_is_account_admin function...');
    const { data: functions, error: funcError } = await supabase.rpc(
      'user_is_account_admin',
      {
        account_uuid: '00000000-0000-0000-0000-000000000000',
      }
    );

    if (funcError && funcError.message.includes('does not exist')) {
      console.log('❌ Function user_is_account_admin does NOT exist');
      console.log('   → Migration 039 has NOT been applied\n');
      console.log('📋 TO FIX:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log(
        '   2. Copy the SQL from: supabase/migrations/039_fix_rls_infinite_recursion.sql'
      );
      console.log('   3. Paste and run it\n');
      return false;
    } else {
      console.log('✅ Function user_is_account_admin EXISTS\n');
    }

    // Try a simple query to test RLS
    console.log('2️⃣ Testing RLS with a simple query...');

    // First sign in
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: 'admin@demo.com',
        password: 'demo123',
      });

    if (authError) {
      console.log('❌ Could not sign in for test:', authError.message);
      return false;
    }

    console.log('✅ Signed in as:', authData.user.email);

    // Try the problematic query
    const { data: memberships, error: membershipError } = await supabase
      .from('account_memberships')
      .select('role, account_id, is_active')
      .eq('user_id', authData.user.id)
      .eq('is_active', true);

    if (membershipError) {
      if (membershipError.message.includes('infinite recursion')) {
        console.log('❌ INFINITE RECURSION ERROR DETECTED');
        console.log('   → Migration 039 has NOT been applied properly\n');
        console.log('📋 TO FIX:');
        console.log('   1. Go to Supabase Dashboard → SQL Editor');
        console.log(
          '   2. Run: DROP POLICY IF EXISTS "Users can view account memberships" ON account_memberships;'
        );
        console.log(
          '   3. Run: DROP POLICY IF EXISTS "Admins can manage memberships" ON account_memberships;'
        );
        console.log('   4. Then run the full migration 039\n');
        return false;
      } else {
        console.log('❌ Query error:', membershipError.message);
        return false;
      }
    }

    console.log('✅ RLS Query SUCCESSFUL');
    console.log('   Found', memberships.length, 'membership(s)');
    memberships.forEach((m) => {
      console.log(
        '   -',
        m.role,
        'for account',
        m.account_id.substring(0, 8) + '...'
      );
    });

    console.log('\n✅ ALL CHECKS PASSED - RLS is working correctly!\n');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

checkRLSStatus().then((success) => {
  if (!success) {
    console.log('\n💡 Quick fix command:');
    console.log(
      '   cat supabase/migrations/039_fix_rls_infinite_recursion.sql\n'
    );
    process.exit(1);
  }
});
