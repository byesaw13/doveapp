#!/usr/bin/env node

/**
 * Create Demo Users for Testing
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDemoUsers() {
  console.log('🎭 Creating demo users...');

  const demoUsers = [
    {
      email: 'admin@demo.com',
      password: 'demo123',
      role: 'OWNER',
      name: 'Demo Admin',
    },
    {
      email: 'tech@demo.com',
      password: 'demo123',
      role: 'TECH',
      name: 'Demo Technician',
    },
    {
      email: 'customer@demo.com',
      password: 'demo123',
      role: 'CUSTOMER',
      name: 'Demo Customer',
    },
  ];

  // Get the account ID
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('name', 'Dovetails Services LLC')
    .single();

  if (!account) {
    console.error('❌ Account not found');
    return;
  }

  console.log(`📊 Using account: ${account.id}`);

  for (const user of demoUsers) {
    try {
      console.log(`👤 Creating ${user.email}...`);

      // Create auth user
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.name,
            demo: true,
          },
        });

      if (authError) {
        console.log(`⚠️  ${user.email} may already exist, skipping...`);
        continue;
      }

      // Create user profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authUser.user.id,
        email: user.email,
        full_name: user.name,
      });

      if (profileError) {
        console.error(
          `❌ Profile error for ${user.email}:`,
          profileError.message
        );
        continue;
      }

      // Create account membership (skip for customer - they just need user profile)
      if (user.role !== 'CUSTOMER') {
        const { error: membershipError } = await supabase
          .from('account_memberships')
          .insert({
            account_id: account.id,
            user_id: authUser.user.id,
            role: user.role,
            is_active: true,
          });

        if (membershipError) {
          console.error(
            `❌ Membership error for ${user.email}:`,
            membershipError.message
          );
        }
      } else {
        // For customers, create a customer record
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            account_id: account.id,
            user_id: authUser.user.id,
            name: user.name,
            email: user.email,
          });

        if (customerError) {
          console.error(
            `❌ Customer record error for ${user.email}:`,
            customerError.message
          );
        }
      }

      console.log(`✅ Created ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error.message);
    }
  }

  console.log('\n🎉 Demo users setup complete!');
  console.log('\nLogin credentials:');
  console.log('Admin: admin@demo.com / demo123');
  console.log('Tech: tech@demo.com / demo123');
  console.log('Customer: customer@demo.com / demo123');
}

createDemoUsers();
