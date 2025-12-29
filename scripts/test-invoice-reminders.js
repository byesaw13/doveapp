// Test script to check invoice reminders API
// This can help debug authentication issues

import { createClient } from '@/lib/supabase/server';

export async function testInvoiceRemindersAPI() {
  try {
    const supabase = await createClient();

    console.log('Testing invoice reminders API...');

    // Test basic query
    const { data, error } = await supabase
      .from('invoice_reminders')
      .select('count', { count: 'exact' });

    if (error) {
      console.error('Database query error:', error);
      return { success: false, error: error.message };
    }

    console.log('Database query successful, count:', data);
    return { success: true, count: data };
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
