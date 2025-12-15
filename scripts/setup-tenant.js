#!/usr/bin/env node

/**
 * Automated Tenant Setup Script
 * Usage: npm run setup:tenant -- --email admin@example.com --company "My Company"
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { randomBytes } = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTenant(options) {
  console.log(`🚀 Setting up tenant: ${options.company}`);

  try {
    // 1. Create account
    console.log('📝 Creating account...');
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: options.company,
        subdomain:
          options.subdomain ||
          options.company.toLowerCase().replace(/\s+/g, '-'),
      })
      .select()
      .single();

    if (accountError) throw accountError;
    console.log(`✅ Account created: ${account.id}`);

    // 2. Generate secure password
    const password = generateSecurePassword();
    console.log(`🔐 Generated password: ${password}`);

    // 3. Create auth user
    console.log('👤 Creating auth user...');
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: options.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin User',
          company: options.company,
        },
      });

    if (authError) throw authError;
    console.log(`✅ Auth user created: ${authUser.user.id}`);

    // 4. Create user profile
    console.log('📋 Creating user profile...');
    const { error: profileError } = await supabase.from('users').insert({
      id: authUser.user.id,
      email: options.email,
      full_name: 'Admin User',
    });

    if (profileError) throw profileError;

    // 5. Create account membership
    console.log('🔗 Creating account membership...');
    const { error: membershipError } = await supabase
      .from('account_memberships')
      .insert({
        account_id: account.id,
        user_id: authUser.user.id,
        role: options.role || 'OWNER',
        is_active: true,
      });

    if (membershipError) throw membershipError;

    // 6. Send welcome email (placeholder)
    console.log('📧 Sending welcome email...');
    await sendWelcomeEmail(options.email, options.company, password);

    console.log('\n🎉 Tenant setup complete!');
    console.log(`📊 Account ID: ${account.id}`);
    console.log(`👤 User ID: ${authUser.user.id}`);
    console.log(`📧 Email: ${options.email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🏢 Company: ${options.company}`);
    console.log(`🔒 Role: ${options.role || 'OWNER'}`);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

function generateSecurePassword() {
  return randomBytes(12)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 12);
}

async function sendWelcomeEmail(email, company, password) {
  // Placeholder - integrate with your email service
  console.log(`Welcome email would be sent to ${email} for ${company}`);
  console.log(`Temporary password: ${password}`);
}

// CLI interface
const args = process.argv.slice(2);
const options = {
  email: '',
  company: '',
  subdomain: undefined,
  role: 'OWNER',
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--email':
      options.email = args[++i];
      break;
    case '--company':
      options.company = args[++i];
      break;
    case '--subdomain':
      options.subdomain = args[++i];
      break;
    case '--role':
      options.role = args[++i];
      break;
  }
}

if (!options.email || !options.company) {
  console.log(
    'Usage: npm run setup:tenant -- --email admin@example.com --company "My Company"'
  );
  process.exit(1);
}

setupTenant(options);
