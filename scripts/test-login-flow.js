#!/usr/bin/env node

/**
 * Test Login Flow
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin(email, password) {
  console.log(`\n🔐 Testing login for: ${email}`);
  console.log('━'.repeat(50));

  try {
    // Step 1: Try to sign in
    console.log('\n1️⃣ Attempting sign in...');
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.log('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Authentication successful');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);

    // Step 2: Check user profile
    console.log('\n2️⃣ Checking user profile...');
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.log('❌ User profile error:', userError.message);
      console.log('   → User exists in auth but not in users table!');
    } else {
      console.log('✅ User profile found');
      console.log('   Name:', userProfile.full_name);
      console.log('   Email:', userProfile.email);
    }

    // Step 3: Check account memberships
    console.log('\n3️⃣ Checking account memberships...');
    const { data: memberships, error: membershipError } = await supabase
      .from('account_memberships')
      .select(
        `
        *,
        accounts(name, subdomain),
        users(email, full_name)
      `
      )
      .eq('user_id', authData.user.id)
      .eq('is_active', true);

    if (membershipError) {
      console.log('❌ Membership query error:', membershipError.message);
    } else if (!memberships || memberships.length === 0) {
      console.log('⚠️  No active memberships found');
      console.log('   → User authenticated but has no account access');

      // Check if they're a customer
      const { data: customerRecord } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (customerRecord) {
        console.log('   ℹ️  User is a customer (portal access only)');
      } else {
        console.log('   ❌ User is neither a team member nor a customer');
      }
    } else {
      console.log(`✅ Found ${memberships.length} membership(s):`);
      memberships.forEach((m, i) => {
        console.log(`   ${i + 1}. Account: ${m.accounts?.name}`);
        console.log(`      Role: ${m.role}`);
        console.log(`      Active: ${m.is_active}`);
      });
    }

    // Step 4: Determine redirect
    console.log('\n4️⃣ Determining redirect...');
    if (memberships && memberships.length > 0) {
      const primaryMembership = memberships[0];
      if (
        primaryMembership.role === 'OWNER' ||
        primaryMembership.role === 'ADMIN'
      ) {
        console.log('✅ Should redirect to: /admin/dashboard');
      } else if (primaryMembership.role === 'TECH') {
        console.log('✅ Should redirect to: /tech/today');
      }
    } else {
      console.log(
        '⚠️  Should redirect to: /portal/home (customer) or show error'
      );
    }

    // Clean up
    await supabase.auth.signOut();
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Login Flow');
  console.log('═'.repeat(50));

  const testUsers = [
    { email: 'admin@demo.com', password: 'demo123' },
    { email: 'tech@demo.com', password: 'demo123' },
    { email: 'customer@demo.com', password: 'demo123' },
    { email: 'nicolasgaron@mydovetails.com', password: 'your-actual-password' },
  ];

  for (const user of testUsers.slice(0, 3)) {
    // Test first 3 demo users
    await testLogin(user.email, user.password);
  }

  console.log('\n' + '═'.repeat(50));
  console.log('✅ Login flow tests complete!\n');
}

runTests();
