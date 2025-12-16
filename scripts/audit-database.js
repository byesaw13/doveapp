#!/usr/bin/env node

/**
 * Comprehensive Supabase Database Audit Script
 *
 * Checks for:
 * - Orphaned records (foreign key violations)
 * - Missing required fields
 * - Data inconsistencies
 * - Duplicate records
 * - Business logic violations
 * - Account/tenant data isolation issues
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error(
    'Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Audit results storage
const issues = {
  critical: [],
  warning: [],
  info: [],
};

function addIssue(severity, category, message, details = {}) {
  issues[severity].push({
    category,
    message,
    details,
    timestamp: new Date().toISOString(),
  });
}

async function runQuery(query, params = []) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: query });
    if (error) throw error;
    return data;
  } catch (error) {
    // If RPC doesn't exist, try direct query
    const { data, error: queryError } = await supabase
      .from('_query')
      .select(query);
    if (queryError) {
      console.error('Query error:', queryError);
      return null;
    }
    return data;
  }
}

async function checkOrphanedRecords() {
  console.log('\n🔍 Checking for orphaned records...');

  // Check jobs with invalid client_id
  const { data: orphanedJobs } = await supabase
    .from('jobs')
    .select('id, job_number, client_id')
    .not('client_id', 'is', null);

  if (orphanedJobs) {
    for (const job of orphanedJobs) {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('id', job.client_id)
        .single();

      if (!client) {
        addIssue(
          'critical',
          'orphaned_records',
          `Job ${job.job_number} references non-existent client ${job.client_id}`,
          { job_id: job.id, client_id: job.client_id }
        );
      }
    }
  }

  // Check invoices with invalid job_id
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, job_id');

  if (invoices) {
    for (const invoice of invoices) {
      const { data: job } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', invoice.job_id)
        .single();

      if (!job) {
        addIssue(
          'critical',
          'orphaned_records',
          `Invoice ${invoice.invoice_number} references non-existent job ${invoice.job_id}`,
          { invoice_id: invoice.id, job_id: invoice.job_id }
        );
      }
    }
  }

  // Check estimates with invalid lead_id
  const { data: estimates } = await supabase
    .from('estimates')
    .select('id, estimate_number, lead_id')
    .not('lead_id', 'is', null);

  if (estimates) {
    for (const estimate of estimates) {
      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .eq('id', estimate.lead_id)
        .single();

      if (!lead) {
        addIssue(
          'warning',
          'orphaned_records',
          `Estimate ${estimate.estimate_number} references non-existent lead ${estimate.lead_id}`,
          { estimate_id: estimate.id, lead_id: estimate.lead_id }
        );
      }
    }
  }

  // Check properties with invalid client_id
  const { data: properties } = await supabase
    .from('properties')
    .select('id, address_line1, client_id');

  if (properties) {
    for (const property of properties) {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('id', property.client_id)
        .single();

      if (!client) {
        addIssue(
          'critical',
          'orphaned_records',
          `Property ${property.address_line1} references non-existent client ${property.client_id}`,
          { property_id: property.id, client_id: property.client_id }
        );
      }
    }
  }

  // Check job_line_items with invalid job_id
  const { data: lineItems } = await supabase
    .from('job_line_items')
    .select('id, job_id, description');

  if (lineItems) {
    for (const item of lineItems) {
      const { data: job } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', item.job_id)
        .single();

      if (!job) {
        addIssue(
          'critical',
          'orphaned_records',
          `Line item "${item.description}" references non-existent job ${item.job_id}`,
          { line_item_id: item.id, job_id: item.job_id }
        );
      }
    }
  }
}

async function checkRequiredFields() {
  console.log('\n🔍 Checking required fields...');

  // Check clients
  const { data: clientsMissingNames } = await supabase
    .from('clients')
    .select('id')
    .or('first_name.is.null,last_name.is.null');

  if (clientsMissingNames?.length > 0) {
    addIssue(
      'critical',
      'missing_required_fields',
      `${clientsMissingNames.length} clients missing first_name or last_name`,
      {
        count: clientsMissingNames.length,
        ids: clientsMissingNames.map((c) => c.id),
      }
    );
  }

  // Check jobs without titles
  const { data: jobsWithoutTitles } = await supabase
    .from('jobs')
    .select('id, job_number')
    .or('title.is.null,title.eq.');

  if (jobsWithoutTitles?.length > 0) {
    addIssue(
      'warning',
      'missing_required_fields',
      `${jobsWithoutTitles.length} jobs missing titles`,
      {
        count: jobsWithoutTitles.length,
        job_numbers: jobsWithoutTitles.map((j) => j.job_number),
      }
    );
  }

  // Check jobs without job_number
  const { data: jobsWithoutNumbers } = await supabase
    .from('jobs')
    .select('id')
    .or('job_number.is.null,job_number.eq.');

  if (jobsWithoutNumbers?.length > 0) {
    addIssue(
      'critical',
      'missing_required_fields',
      `${jobsWithoutNumbers.length} jobs missing job_number`,
      { count: jobsWithoutNumbers.length }
    );
  }
}

async function checkAccountIsolation() {
  console.log('\n🔍 Checking account/tenant isolation...');

  // Check if accounts table exists
  const { data: accountsExist } = await supabase
    .from('accounts')
    .select('id')
    .limit(1);

  if (!accountsExist) {
    addIssue(
      'info',
      'account_isolation',
      'Accounts table exists but may be empty - multi-tenant setup may be incomplete'
    );
    return;
  }

  // Check clients without account_id
  const { data: clientsWithoutAccount } = await supabase
    .from('clients')
    .select('id, first_name, last_name')
    .is('account_id', null)
    .limit(10);

  if (clientsWithoutAccount?.length > 0) {
    const { count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .is('account_id', null);

    addIssue(
      'warning',
      'account_isolation',
      `${count} clients missing account_id (showing first 10)`,
      { total_count: count, sample: clientsWithoutAccount }
    );
  }

  // Check jobs without account_id
  const { data: jobsWithoutAccount } = await supabase
    .from('jobs')
    .select('id, job_number')
    .is('account_id', null)
    .limit(10);

  if (jobsWithoutAccount?.length > 0) {
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .is('account_id', null);

    addIssue(
      'warning',
      'account_isolation',
      `${count} jobs missing account_id (showing first 10)`,
      { total_count: count, sample: jobsWithoutAccount }
    );
  }

  // Check estimates without account_id
  const { data: estimatesWithoutAccount } = await supabase
    .from('estimates')
    .select('id, estimate_number')
    .is('account_id', null)
    .limit(10);

  if (estimatesWithoutAccount?.length > 0) {
    const { count } = await supabase
      .from('estimates')
      .select('*', { count: 'exact', head: true })
      .is('account_id', null);

    addIssue(
      'warning',
      'account_isolation',
      `${count} estimates missing account_id (showing first 10)`,
      { total_count: count, sample: estimatesWithoutAccount }
    );
  }
}

async function checkDataConsistency() {
  console.log('\n🔍 Checking data consistency...');

  // Check jobs with mismatched totals
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, job_number, subtotal, tax, total');

  if (jobs) {
    for (const job of jobs) {
      const calculatedTotal = (
        parseFloat(job.subtotal || 0) + parseFloat(job.tax || 0)
      ).toFixed(2);
      const actualTotal = parseFloat(job.total || 0).toFixed(2);

      if (calculatedTotal !== actualTotal) {
        addIssue(
          'warning',
          'data_consistency',
          `Job ${job.job_number} has incorrect total (subtotal: ${job.subtotal}, tax: ${job.tax}, total: ${job.total}, expected: ${calculatedTotal})`,
          {
            job_id: job.id,
            job_number: job.job_number,
            expected_total: calculatedTotal,
            actual_total: actualTotal,
          }
        );
      }
    }
  }

  // Check invoices with mismatched balance_due
  const { data: invoices } = await supabase.from('invoices').select(`
      id, 
      invoice_number, 
      total, 
      balance_due,
      invoice_payments(amount)
    `);

  if (invoices) {
    for (const invoice of invoices) {
      const totalPaid = (invoice.invoice_payments || []).reduce(
        (sum, payment) => sum + parseFloat(payment.amount || 0),
        0
      );
      const expectedBalance = parseFloat(invoice.total || 0) - totalPaid;
      const actualBalance = parseFloat(invoice.balance_due || 0);

      if (Math.abs(expectedBalance - actualBalance) > 0.01) {
        addIssue(
          'warning',
          'data_consistency',
          `Invoice ${invoice.invoice_number} has incorrect balance_due (total: ${invoice.total}, paid: ${totalPaid}, balance: ${invoice.balance_due}, expected: ${expectedBalance.toFixed(2)})`,
          {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            expected_balance: expectedBalance.toFixed(2),
            actual_balance: actualBalance.toFixed(2),
          }
        );
      }
    }
  }

  // Check for negative amounts
  const { data: negativeJobs } = await supabase
    .from('jobs')
    .select('id, job_number, total')
    .lt('total', 0);

  if (negativeJobs?.length > 0) {
    addIssue(
      'warning',
      'data_consistency',
      `${negativeJobs.length} jobs with negative totals`,
      { jobs: negativeJobs }
    );
  }

  const { data: negativeInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total')
    .lt('total', 0);

  if (negativeInvoices?.length > 0) {
    addIssue(
      'warning',
      'data_consistency',
      `${negativeInvoices.length} invoices with negative totals`,
      { invoices: negativeInvoices }
    );
  }
}

async function checkDuplicates() {
  console.log('\n🔍 Checking for duplicates...');

  // Check for duplicate job numbers
  const { data: duplicateJobNumbers } = await supabase
    .from('jobs')
    .select('job_number')
    .not('job_number', 'is', null);

  if (duplicateJobNumbers) {
    const jobNumberCounts = {};
    duplicateJobNumbers.forEach((job) => {
      jobNumberCounts[job.job_number] =
        (jobNumberCounts[job.job_number] || 0) + 1;
    });

    const duplicates = Object.entries(jobNumberCounts)
      .filter(([_, count]) => count > 1)
      .map(([number, count]) => ({ job_number: number, count }));

    if (duplicates.length > 0) {
      addIssue(
        'critical',
        'duplicates',
        `${duplicates.length} duplicate job numbers found`,
        { duplicates }
      );
    }
  }

  // Check for duplicate invoice numbers
  const { data: duplicateInvoiceNumbers } = await supabase
    .from('invoices')
    .select('invoice_number')
    .not('invoice_number', 'is', null);

  if (duplicateInvoiceNumbers) {
    const invoiceNumberCounts = {};
    duplicateInvoiceNumbers.forEach((invoice) => {
      invoiceNumberCounts[invoice.invoice_number] =
        (invoiceNumberCounts[invoice.invoice_number] || 0) + 1;
    });

    const duplicates = Object.entries(invoiceNumberCounts)
      .filter(([_, count]) => count > 1)
      .map(([number, count]) => ({ invoice_number: number, count }));

    if (duplicates.length > 0) {
      addIssue(
        'critical',
        'duplicates',
        `${duplicates.length} duplicate invoice numbers found`,
        { duplicates }
      );
    }
  }

  // Check for duplicate Square customer IDs
  const { data: duplicateSquareIds } = await supabase
    .from('clients')
    .select('square_customer_id')
    .not('square_customer_id', 'is', null);

  if (duplicateSquareIds) {
    const squareIdCounts = {};
    duplicateSquareIds.forEach((client) => {
      squareIdCounts[client.square_customer_id] =
        (squareIdCounts[client.square_customer_id] || 0) + 1;
    });

    const duplicates = Object.entries(squareIdCounts)
      .filter(([_, count]) => count > 1)
      .map(([id, count]) => ({ square_customer_id: id, count }));

    if (duplicates.length > 0) {
      addIssue(
        'critical',
        'duplicates',
        `${duplicates.length} duplicate Square customer IDs found`,
        { duplicates }
      );
    }
  }
}

async function checkBusinessLogic() {
  console.log('\n🔍 Checking business logic violations...');

  // Check for completed jobs without invoices
  const { data: completedJobsNoInvoice } = await supabase
    .from('jobs')
    .select('id, job_number, status')
    .eq('status', 'completed')
    .limit(100);

  if (completedJobsNoInvoice) {
    const jobsWithoutInvoices = [];
    for (const job of completedJobsNoInvoice) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('job_id', job.id)
        .single();

      if (!invoice) {
        jobsWithoutInvoices.push(job.job_number);
      }
    }

    if (jobsWithoutInvoices.length > 0) {
      addIssue(
        'info',
        'business_logic',
        `${jobsWithoutInvoices.length} completed jobs without invoices (this may be intentional)`,
        { job_numbers: jobsWithoutInvoices }
      );
    }
  }

  // Check for invoices marked as paid but with balance_due > 0
  const { data: paidInvoicesWithBalance } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, balance_due')
    .eq('status', 'paid')
    .gt('balance_due', 0);

  if (paidInvoicesWithBalance?.length > 0) {
    addIssue(
      'warning',
      'business_logic',
      `${paidInvoicesWithBalance.length} invoices marked as 'paid' but have outstanding balance`,
      { invoices: paidInvoicesWithBalance }
    );
  }

  // Check for invoices with balance_due = 0 but not marked as paid
  const { data: unpaidInvoicesNoBalance } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, balance_due')
    .neq('status', 'paid')
    .eq('balance_due', 0);

  if (unpaidInvoicesNoBalance?.length > 0) {
    addIssue(
      'warning',
      'business_logic',
      `${unpaidInvoicesNoBalance.length} invoices with zero balance but not marked as 'paid'`,
      { invoices: unpaidInvoicesNoBalance }
    );
  }

  // Check for estimates that were accepted but no job created
  const { data: acceptedEstimates } = await supabase
    .from('estimates')
    .select('id, estimate_number, status')
    .eq('status', 'accepted')
    .limit(100);

  if (acceptedEstimates) {
    const estimatesWithoutJobs = [];
    for (const estimate of acceptedEstimates) {
      const { data: job } = await supabase
        .from('jobs')
        .select('id')
        .eq('estimate_id', estimate.id)
        .single();

      if (!job) {
        estimatesWithoutJobs.push(estimate.estimate_number);
      }
    }

    if (estimatesWithoutJobs.length > 0) {
      addIssue(
        'info',
        'business_logic',
        `${estimatesWithoutJobs.length} accepted estimates without associated jobs (may need follow-up)`,
        { estimate_numbers: estimatesWithoutJobs }
      );
    }
  }
}

async function checkEmailAndPhone() {
  console.log('\n🔍 Checking email and phone data quality...');

  // Check for invalid email formats
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name, email, phone')
    .not('email', 'is', null);

  if (clients) {
    const invalidEmails = clients.filter((c) => {
      const email = c.email?.trim();
      if (!email) return false;
      // Basic email validation
      return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    });

    if (invalidEmails.length > 0) {
      addIssue(
        'warning',
        'data_quality',
        `${invalidEmails.length} clients with invalid email formats`,
        {
          count: invalidEmails.length,
          sample: invalidEmails.slice(0, 5).map((c) => ({
            name: `${c.first_name} ${c.last_name}`,
            email: c.email,
          })),
        }
      );
    }
  }

  // Check clients without email or phone
  const { data: clientsNoContact } = await supabase
    .from('clients')
    .select('id, first_name, last_name')
    .or('and(email.is.null,phone.is.null),and(email.eq.,phone.eq.)');

  if (clientsNoContact?.length > 0) {
    addIssue(
      'info',
      'data_quality',
      `${clientsNoContact.length} clients without email or phone contact`,
      { count: clientsNoContact.length }
    );
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 DATABASE AUDIT REPORT');
  console.log('='.repeat(80));
  console.log(`Generated: ${new Date().toLocaleString()}`);

  const totalIssues =
    issues.critical.length + issues.warning.length + issues.info.length;

  console.log('\n📈 SUMMARY:');
  console.log(`  🔴 Critical Issues: ${issues.critical.length}`);
  console.log(`  🟡 Warnings: ${issues.warning.length}`);
  console.log(`  🔵 Info: ${issues.info.length}`);
  console.log(`  📊 Total: ${totalIssues}`);

  if (issues.critical.length > 0) {
    console.log('\n🔴 CRITICAL ISSUES (require immediate attention):');
    issues.critical.forEach((issue, idx) => {
      console.log(
        `\n  ${idx + 1}. [${issue.category.toUpperCase()}] ${issue.message}`
      );
      if (Object.keys(issue.details).length > 0) {
        console.log(
          `     Details: ${JSON.stringify(issue.details, null, 2).split('\n').join('\n     ')}`
        );
      }
    });
  }

  if (issues.warning.length > 0) {
    console.log('\n🟡 WARNINGS (should be addressed):');
    issues.warning.forEach((issue, idx) => {
      console.log(
        `\n  ${idx + 1}. [${issue.category.toUpperCase()}] ${issue.message}`
      );
      if (Object.keys(issue.details).length > 0) {
        console.log(
          `     Details: ${JSON.stringify(issue.details, null, 2).split('\n').join('\n     ')}`
        );
      }
    });
  }

  if (issues.info.length > 0) {
    console.log('\n🔵 INFORMATIONAL (for review):');
    issues.info.forEach((issue, idx) => {
      console.log(
        `\n  ${idx + 1}. [${issue.category.toUpperCase()}] ${issue.message}`
      );
      if (Object.keys(issue.details).length > 0) {
        console.log(
          `     Details: ${JSON.stringify(issue.details, null, 2).split('\n').join('\n     ')}`
        );
      }
    });
  }

  console.log('\n' + '='.repeat(80));

  if (totalIssues === 0) {
    console.log('✅ No issues found! Database is in good shape.');
  } else {
    console.log(`\n💡 RECOMMENDATIONS:`);
    console.log(
      `  1. Fix critical issues immediately to prevent data loss or corruption`
    );
    console.log(`  2. Address warnings to maintain data integrity`);
    console.log(`  3. Review informational items for potential improvements`);
    console.log(`  4. Consider running this audit regularly (weekly/monthly)`);
  }

  console.log('\n' + '='.repeat(80));

  // Return exit code based on severity
  if (issues.critical.length > 0) {
    process.exit(1);
  } else if (issues.warning.length > 0) {
    process.exit(0); // Warnings don't fail the script
  } else {
    process.exit(0);
  }
}

async function main() {
  console.log('🚀 Starting database audit...\n');

  try {
    await checkOrphanedRecords();
    await checkRequiredFields();
    await checkAccountIsolation();
    await checkDataConsistency();
    await checkDuplicates();
    await checkBusinessLogic();
    await checkEmailAndPhone();

    await generateReport();
  } catch (error) {
    console.error('\n❌ Audit failed with error:', error);
    process.exit(1);
  }
}

main();
