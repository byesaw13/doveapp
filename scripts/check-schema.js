const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  // Try to query with source column
  const { data, error } = await supabase
    .from('leads')
    .select('id, first_name, last_name, email, phone, source, status, priority')
    .limit(1);

  if (error) {
    console.log('❌ Error querying leads table:', error.message);
    console.log('\nThe leads table exists but is missing columns.');
    console.log('\nYou need to either:');
    console.log('1. Drop the old table and recreate it');
    console.log('2. Add missing columns with ALTER TABLE');
  } else {
    console.log('✅ Leads table has all required columns!');
    console.log('Sample data:', data);
  }

  // Check estimates
  const { data: estData, error: estError } = await supabase
    .from('estimates')
    .select('id, estimate_number, title, status')
    .limit(1);

  if (estError) {
    console.log('❌ Error querying estimates table:', estError.message);
  } else {
    console.log('✅ Estimates table has required columns!');
  }
}

checkSchema();
