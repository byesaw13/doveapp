#!/usr/bin/env node

/**
 * Check Tenant Setup Status
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTenantSetup() {
  console.log('🔍 Checking tenant setup...\n');

  try {
    // Check if accounts table exists and has data
    console.log('1️⃣ Checking accounts table...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*');

    if (accountsError) {
      console.log('❌ Accounts table error:', accountsError.message);
      console.log('   → Run migration 037_multi_portal_schema.sql');
    } else {
      console.log(
        `✅ Accounts table exists with ${accounts.length} account(s)`
      );
      accounts.forEach((acc) => {
        console.log(`   - ${acc.name} (${acc.id})`);
      });
    }

    // Check users table
    console.log('\n2️⃣ Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
      console.log('   → Run migration 037_multi_portal_schema.sql');
    } else {
      console.log(`✅ Users table exists with ${users.length} user(s)`);
      users.forEach((user) => {
        console.log(`   - ${user.email} (${user.full_name || 'No name'})`);
      });
    }

    // Check account_memberships table
    console.log('\n3️⃣ Checking account_memberships table...');
    const { data: memberships, error: membershipsError } = await supabase
      .from('account_memberships')
      .select('*, accounts(name), users(email)');

    if (membershipsError) {
      console.log(
        '❌ Account memberships table error:',
        membershipsError.message
      );
      console.log('   → Run migration 037_multi_portal_schema.sql');
    } else {
      console.log(
        `✅ Account memberships table exists with ${memberships.length} membership(s)`
      );
      memberships.forEach((m) => {
        console.log(`   - ${m.users?.email} → ${m.accounts?.name} (${m.role})`);
      });
    }

    // Check auth users
    console.log('\n4️⃣ Checking auth users...');
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.log('❌ Auth users error:', authError.message);
      console.log('   → Need SUPABASE_SERVICE_ROLE_KEY in .env.local');
    } else {
      console.log(`✅ Auth has ${authUsers.users.length} user(s)`);
      authUsers.users.forEach((user) => {
        console.log(`   - ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
      });
    }

    // Summary
    console.log('\n📊 Summary:');
    if (accountsError || usersError || membershipsError) {
      console.log('❌ INCOMPLETE - Missing tables. Run migrations.');
      console.log('\n💡 To fix:');
      console.log('   1. Go to Supabase SQL Editor');
      console.log('   2. Run supabase/migrations/037_multi_portal_schema.sql');
      console.log(
        '   3. Run supabase/migrations/038_comprehensive_rls_policies_fixed.sql'
      );
      console.log('   4. Run: node scripts/create-demo-users.js');
    } else if (accounts.length === 0) {
      console.log('⚠️  Tables exist but no accounts found');
      console.log('\n💡 To fix:');
      console.log(
        '   Run: node scripts/setup-tenant.js -- --email admin@example.com --company "Your Company"'
      );
    } else if (memberships.length === 0) {
      console.log('⚠️  Account exists but no memberships found');
      console.log('\n💡 To fix:');
      console.log('   Run: node scripts/create-demo-users.js');
    } else {
      console.log('✅ COMPLETE - Tenant setup looks good!');
      console.log('\n🎯 You can now:');
      console.log('   1. Login at http://localhost:3000/auth/login');
      console.log('   2. Use demo credentials from demo users script');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkTenantSetup();
