const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTables() {
  // Check if leads table exists
  const { data: leadsCheck, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .limit(1);
  
  console.log('Leads table exists:', !leadsError);
  if (leadsError) console.log('Leads error:', leadsError.message);
  
  // Check if estimates table exists
  const { data: estimatesCheck, error: estimatesError } = await supabase
    .from('estimates')
    .select('*')
    .limit(1);
  
  console.log('Estimates table exists:', !estimatesError);
  if (estimatesError) console.log('Estimates error:', estimatesError.message);
}

checkTables();
