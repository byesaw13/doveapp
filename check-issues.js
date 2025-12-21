const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchemaIssues() {
  console.log('🔍 Checking specific schema issues...\n');

  // Check if customers table has account_id by trying a select
  console.log('1️⃣ Checking customers table account_id...');
  const { data: custData, error: custErr } = await supabase
    .from('customers')
    .select('account_id')
    .limit(1);

  if (custErr) {
    console.log('❌ Error querying customers.account_id:', custErr.message);
    if (custErr.message.includes('column "account_id" does not exist')) {
      console.log('   → Customers table missing account_id column');
    }
  } else {
    console.log('✅ Customers table has account_id column');
  }

  // Check clients table
  console.log('\n2️⃣ Checking clients table account_id...');
  const { data: clientData, error: clientErr } = await supabase
    .from('clients')
    .select('account_id')
    .limit(1);

  if (clientErr) {
    console.log('❌ Error querying clients.account_id:', clientErr.message);
    if (clientErr.message.includes('column "account_id" does not exist')) {
      console.log('   → Clients table missing account_id column');
    }
  } else {
    console.log('✅ Clients table has account_id column');
  }

  // Check NULL account_ids
  console.log('\n3️⃣ Checking for NULL account_ids...');
  const tables = ['jobs', 'clients', 'customers', 'estimates', 'invoices'];
  for (const table of tables) {
    try {
      const { count, error: countErr } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .is('account_id', null);

      if (countErr) {
        console.log(`❌ Error counting NULL in ${table}:`, countErr.message);
      } else {
        console.log(`${table}: ${count} NULL account_id(s)`);
      }
    } catch (e) {
      console.log(`❌ Exception checking ${table}:`, e.message);
    }
  }
}

checkSchemaIssues();
