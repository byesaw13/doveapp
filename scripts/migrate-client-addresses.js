#!/usr/bin/env node

/**
 * Migration script to create properties from existing client addresses
 * Run this after the properties table has been created
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateClientAddresses() {
  console.log('Starting client address migration to properties...');

  try {
    // Get all clients with address data
    const { data: clients, error: fetchError } = await supabase
      .from('clients')
      .select(
        'id, first_name, last_name, address_line1, address_line2, city, state, zip_code'
      )
      .not('address_line1', 'is', null)
      .neq('address_line1', '')
      .not('city', 'is', null)
      .neq('city', '');

    if (fetchError) {
      console.error('Error fetching clients:', fetchError);
      return;
    }

    if (!clients || clients.length === 0) {
      console.log('No clients with address data found.');
      return;
    }

    console.log(`Found ${clients.length} clients with address data.`);

    // Create properties for each client
    const propertiesToCreate = clients.map((client) => ({
      client_id: client.id,
      name: 'Primary Residence',
      address_line1: client.address_line1,
      address_line2: client.address_line2,
      city: client.city,
      state: client.state,
      zip_code: client.zip_code,
      property_type: 'Residential',
      notes: 'Migrated from client address data',
    }));

    const { data: createdProperties, error: insertError } = await supabase
      .from('properties')
      .insert(propertiesToCreate)
      .select();

    if (insertError) {
      console.error('Error creating properties:', insertError);
      return;
    }

    console.log(
      `Successfully created ${createdProperties?.length || 0} properties from client addresses.`
    );

    // Show summary
    console.log('\nMigration Summary:');
    console.log('==================');
    createdProperties?.forEach((property, index) => {
      const client = clients.find((c) => c.id === property.client_id);
      console.log(
        `${index + 1}. ${client?.first_name} ${client?.last_name} - ${property.name}`
      );
    });
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateClientAddresses()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
