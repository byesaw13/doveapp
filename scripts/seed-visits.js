const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedVisits() {
  console.log('🌱 Seeding mock visits data...');

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Get some existing clients and jobs, or create mock ones
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name')
    .limit(3);

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title')
    .limit(3);

  if (!clients || clients.length === 0) {
    console.log('⚠️ No clients found. Creating mock clients...');
    const accountId = '6785bba1-553c-4886-9638-460033ad6b01'; // Default account
    const mockClients = [
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-0101',
        account_id: accountId,
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '555-0102',
        account_id: accountId,
      },
      {
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com',
        phone: '555-0103',
        account_id: accountId,
      },
    ];

    for (const client of mockClients) {
      await supabase.from('clients').insert(client);
    }
    // Re-fetch
    const { data: newClients } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .limit(3);
    clients = newClients;
  }

  if (!jobs || jobs.length === 0) {
    console.log('⚠️ No jobs found. Creating mock jobs...');
    const accountId = '6785bba1-553c-4886-9638-460033ad6b01'; // Default account
    const mockJobs = [
      {
        title: 'HVAC Maintenance',
        client_id: clients[0]?.id,
        status: 'scheduled',
        service_date: today,
        account_id: accountId,
      },
      {
        title: 'Plumbing Repair',
        client_id: clients[1]?.id,
        status: 'scheduled',
        service_date: today,
        account_id: accountId,
      },
      {
        title: 'Electrical Inspection',
        client_id: clients[2]?.id,
        status: 'scheduled',
        service_date: tomorrow,
        account_id: accountId,
      },
    ];

    for (const job of mockJobs) {
      await supabase.from('jobs').insert(job);
    }
    // Re-fetch
    const { data: newJobs } = await supabase
      .from('jobs')
      .select('id, title')
      .limit(3);
    jobs = newJobs;
  }

  // Get tech user (assuming there's a tech user)
  const { data: techUser } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .single();

  if (!techUser) {
    console.log(
      '⚠️ No tech user found. Please create a user with TECH role first.'
    );
    return;
  }

  // Create mock visits
  const accountId = '6785bba1-553c-4886-9638-460033ad6b01'; // Default account
  const mockVisits = [
    {
      job_id: jobs[0]?.id,
      technician_id: techUser.id,
      account_id: accountId,
      start_at: `${today}T09:00:00Z`,
      end_at: `${today}T10:00:00Z`,
      status: 'scheduled',
      notes: 'Regular maintenance check',
    },
    {
      job_id: jobs[1]?.id,
      technician_id: techUser.id,
      account_id: accountId,
      start_at: `${today}T11:30:00Z`,
      end_at: `${today}T12:30:00Z`,
      status: 'in_progress',
      notes: 'Pipe replacement needed',
    },
    {
      job_id: jobs[2]?.id,
      technician_id: techUser.id,
      account_id: accountId,
      start_at: `${tomorrow}T14:00:00Z`,
      end_at: `${tomorrow}T15:00:00Z`,
      status: 'scheduled',
      notes: 'Annual inspection',
    },
  ];

  console.log('📝 Inserting visits...');
  for (const visit of mockVisits) {
    const { error } = await supabase.from('visits').insert(visit);
    if (error) {
      console.error('Error inserting visit:', error);
    } else {
      console.log('✅ Inserted visit:', visit.job_id);
    }
  }

  console.log('🎉 Mock visits seeded successfully!');
  console.log('Visit /tech/today to see the visits.');
}

seedVisits().catch(console.error);
