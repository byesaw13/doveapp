import { NextRequest, NextResponse } from 'next/server';
import {
  getEmailMessages,
  getEmailMessageById,
  updateEmailMessage,
  extractSpendingFromEmail,
  extractBillingFromEmail,
  extractLeadFromEmail,
  createSpendingEntry,
  createBillingEntry,
  createLead,
  getEmailAccounts,
} from '@/lib/db/email';
import { categorizeEmailWithAI } from '@/lib/ai/email-categorization';
import { supabase } from '@/lib/supabase';

// GET /api/email - Get email messages with filtering or email accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle email accounts listing
    if (action === 'accounts') {
      const accounts = await getEmailAccounts();
      return NextResponse.json({ accounts });
    }

    // Simple test endpoint
    if (action === 'test') {
      console.log('🧪 TEST ENDPOINT CALLED');
      try {
        // Test database connection
        const { data, error } = await supabase
          .from('email_messages')
          .select('count', { count: 'exact', head: true });

        if (error) {
          console.error('Database test failed:', error);
          return NextResponse.json(
            {
              status: 'error',
              timestamp: new Date().toISOString(),
              message: 'Database connection failed',
              error: error.message,
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          message: 'Server and database working',
          emailCount: data,
        });
      } catch (err) {
        console.error('Test endpoint error:', err);
        return NextResponse.json(
          {
            status: 'error',
            timestamp: new Date().toISOString(),
            message: 'Server error',
            error: err instanceof Error ? err.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // Handle AI categorization
    if (action === 'categorize' && searchParams.get('id')) {
      const emailId = searchParams.get('id')!;
      console.log('🚀 🚀 🚀 AI CATEGORIZATION REQUEST STARTED 🚀 🚀 🚀');
      console.log('📧 Email ID:', emailId);
      console.log('🔗 Full URL:', request.url);
      console.log('⏰ Timestamp:', new Date().toISOString());

      // Force immediate output
      console.error(
        '🔴 SERVER DEBUG: AI categorization started for email',
        emailId
      );

      // Test database connection
      try {
        const { data: testData, error: testError } = await supabase
          .from('email_messages')
          .select('id')
          .limit(1);

        if (testError) {
          console.error('Database connection test failed:', testError);
          return NextResponse.json(
            { error: 'Database connection failed', details: testError.message },
            { status: 500 }
          );
        }
        console.log('Database connection OK');
      } catch (dbTestError) {
        console.error('Database test error:', dbTestError);
      }

      const email = await getEmailMessageById(emailId);
      console.log('Email found:', !!email);
      console.log('Email ID from DB:', email?.id);
      console.log('Email ID from request:', emailId);
      console.log('IDs match:', email?.id === emailId);

      if (!email) {
        console.log('Email not found with ID:', emailId);
        return NextResponse.json({ error: 'Email not found' }, { status: 404 });
      }

      console.log('Running AI categorization...');
      const aiResult = await categorizeEmailWithAI(email);
      console.log('AI result:', aiResult);

      // Test basic update first
      console.log('Testing basic email update...');
      try {
        await updateEmailMessage(emailId, {
          category: 'unreviewed' as const,
          reviewed_by: null,
          reviewed_at: new Date().toISOString(),
        });
        console.log('Basic update works!');

        // Now revert the test update
        await updateEmailMessage(emailId, {
          category: (email.category as any) || 'unreviewed',
          reviewed_by: undefined,
          reviewed_at: undefined,
        });
        console.log('Test update reverted');
      } catch (testError) {
        console.error('Basic update failed:', testError);
        return NextResponse.json(
          {
            error: 'Basic email update failed',
            details:
              testError instanceof Error ? testError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }

      // Update the email with AI categorization
      console.log('Updating email in database...');
      console.log('Update data:', {
        category: aiResult.category,
        extracted_data: aiResult.extractedData,
        reviewed_by: 'ai',
        reviewed_at: new Date().toISOString(),
      });

      try {
        // Simplify extracted_data to avoid potential issues
        const simplifiedData = aiResult.extractedData
          ? {
              ...aiResult.extractedData,
              // Ensure amounts are numbers, not strings
              spending: aiResult.extractedData.spending
                ? {
                    ...aiResult.extractedData.spending,
                    amount:
                      typeof aiResult.extractedData.spending.amount === 'string'
                        ? parseFloat(aiResult.extractedData.spending.amount) ||
                          0
                        : aiResult.extractedData.spending.amount || 0,
                  }
                : undefined,
              billing: aiResult.extractedData.billing
                ? {
                    ...aiResult.extractedData.billing,
                    amount:
                      typeof aiResult.extractedData.billing.amount === 'string'
                        ? parseFloat(aiResult.extractedData.billing.amount) || 0
                        : aiResult.extractedData.billing.amount || 0,
                  }
                : undefined,
            }
          : null;

        console.log('Simplified extracted data:', simplifiedData);

        // Re-enable extracted_data now that AI logic is improved
        await updateEmailMessage(emailId, {
          category: aiResult.category,
          extracted_data: simplifiedData,
          reviewed_by: null, // No user auth yet, so null
          reviewed_at: new Date().toISOString(),
        });
        console.log('Email updated successfully');
      } catch (updateError) {
        console.error('Email update failed:', updateError);
        // Try updating without extracted_data to see if that's the issue
        console.log('Trying update without extracted_data...');
        try {
          await updateEmailMessage(emailId, {
            category: aiResult.category,
            reviewed_by: 'ai',
            reviewed_at: new Date().toISOString(),
          });
          console.log(
            'Email updated without extracted_data - the data format might be the issue'
          );
        } catch (simpleUpdateError) {
          console.error('Even simple update failed:', simpleUpdateError);
          throw simpleUpdateError;
        }
        throw updateError; // Re-throw to be caught by outer try-catch
      }

      // Create corresponding database entries
      try {
        if (
          aiResult.category === 'spending' &&
          aiResult.extractedData?.spending
        ) {
          console.log('Creating spending entry...');
          await createSpendingEntry({
            email_message_id: emailId,
            amount: aiResult.extractedData.spending.amount,
            currency: 'USD',
            vendor: aiResult.extractedData.spending.vendor,
            category: aiResult.extractedData.spending.category,
            description: aiResult.extractedData.spending.description,
            transaction_date: aiResult.extractedData.spending.transaction_date,
          });
          console.log('Spending entry created');
        } else if (
          aiResult.category === 'billing' &&
          aiResult.extractedData?.billing
        ) {
          console.log('Creating billing entry...');
          await createBillingEntry({
            email_message_id: emailId,
            invoice_number: aiResult.extractedData.billing.invoice_number,
            amount: aiResult.extractedData.billing.amount,
            due_date: aiResult.extractedData.billing.due_date,
            description: `Invoice ${aiResult.extractedData.billing.invoice_number || 'Unknown'}`,
          });
          console.log('Billing entry created');
        } else if (
          aiResult.category === 'leads' &&
          aiResult.extractedData?.leads
        ) {
          console.log('Creating lead...');
          await createLead(aiResult.extractedData.leads);
          console.log('Lead created');
        }
      } catch (dbError) {
        console.error('Database entry creation failed:', dbError);
        // Continue with the response even if database entry creation fails
      }

      console.log('AI categorization completed successfully');
      console.log('Returning result:', {
        category: aiResult.category,
        confidence: aiResult.confidence,
        hasExtractedData: !!aiResult.extractedData,
      });
      console.log('=== API END DEBUG ===');
      return NextResponse.json({
        success: true,
        category: aiResult.category,
        confidence: aiResult.confidence,
        extractedData: aiResult.extractedData,
        reasoning: aiResult.reasoning,
      });
    }

    // Handle mass AI categorization
    if (action === 'categorize_all') {
      console.log('🚀 🚀 🚀 MASS AI CATEGORIZATION REQUEST STARTED 🚀 🚀 🚀');

      // Get all unreviewed emails
      const { data: emails, error: fetchError } = await supabase
        .from('email_messages')
        .select('*')
        .eq('category', 'unreviewed')
        .order('received_at', { ascending: false })
        .limit(50); // Process in batches

      if (fetchError) {
        console.error(
          'Error fetching emails for mass categorization:',
          fetchError
        );
        return NextResponse.json(
          { error: 'Failed to fetch emails for categorization' },
          { status: 500 }
        );
      }

      console.log(
        `📧 Processing ${emails.length} emails for mass categorization`
      );

      const results = [];
      let processed = 0;
      let errors = 0;

      for (const email of emails) {
        try {
          console.log(
            `Processing email ${processed + 1}/${emails.length}: ${email.subject}`
          );

          const aiResult = await categorizeEmailWithAI(email);

          // Update the email
          await updateEmailMessage(email.id, {
            category: aiResult.category,
            extracted_data: aiResult.extractedData
              ? {
                  ...aiResult.extractedData,
                  spending: aiResult.extractedData.spending
                    ? {
                        ...aiResult.extractedData.spending,
                        amount:
                          typeof aiResult.extractedData.spending.amount ===
                          'string'
                            ? parseFloat(
                                aiResult.extractedData.spending.amount
                              ) || 0
                            : aiResult.extractedData.spending.amount || 0,
                      }
                    : undefined,
                  billing: aiResult.extractedData.billing
                    ? {
                        ...aiResult.extractedData.billing,
                        amount:
                          typeof aiResult.extractedData.billing.amount ===
                          'string'
                            ? parseFloat(
                                aiResult.extractedData.billing.amount
                              ) || 0
                            : aiResult.extractedData.billing.amount || 0,
                      }
                    : undefined,
                }
              : null,
            reviewed_by: null,
            reviewed_at: new Date().toISOString(),
          });

          results.push({
            id: email.id,
            subject: email.subject,
            category: aiResult.category,
            confidence: aiResult.confidence,
            success: true,
          });

          processed++;
        } catch (emailError) {
          console.error(`Failed to categorize email ${email.id}:`, emailError);
          results.push({
            id: email.id,
            subject: email.subject,
            error:
              emailError instanceof Error
                ? emailError.message
                : 'Unknown error',
            success: false,
          });
          errors++;
        }
      }

      console.log(
        `✅ Mass categorization complete: ${processed} processed, ${errors} errors`
      );

      return NextResponse.json({
        success: true,
        processed,
        errors,
        results,
        message: `Categorized ${processed} emails with ${errors} errors`,
      });
    }

    const accountId = searchParams.get('account_id');
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const messages = await getEmailMessages(
      accountId || undefined,
      category,
      limit,
      offset
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching email messages:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch email messages';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/email - Process and categorize email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, message_id } = body;

    if (action === 'categorize' && message_id) {
      const message = await getEmailMessageById(message_id);
      if (!message) {
        return NextResponse.json(
          { error: 'Email message not found' },
          { status: 404 }
        );
      }

      // Auto-categorize based on content analysis
      let category: 'spending' | 'billing' | 'leads' | 'other' = 'other';
      const extractedData: {
        spending?: {
          amount: number;
          vendor?: string;
          category?: string;
          description?: string;
          transaction_date?: string;
        };
        billing?: {
          invoice_number?: string;
          amount: number;
          due_date?: string;
          client_name?: string;
        };
        leads?: {
          contact_name?: string;
          company_name?: string;
          contact_email?: string;
          contact_phone?: string;
          service_type?: string;
        };
      } = {};

      // Try to extract spending information
      const spendingData = extractSpendingFromEmail(message);
      if (spendingData) {
        category = 'spending';
        extractedData.spending = spendingData;

        // Create spending entry
        await createSpendingEntry(spendingData);
      }

      // Try to extract billing information
      const billingData = extractBillingFromEmail(message);
      if (billingData && !spendingData) {
        category = 'billing';
        extractedData.billing = billingData;

        // Create billing entry
        await createBillingEntry(billingData);
      }

      // Try to extract lead information
      const leadData = extractLeadFromEmail(message);
      if (leadData && !spendingData && !billingData) {
        category = 'leads';
        extractedData.leads = leadData;

        // Create lead entry
        await createLead(leadData);
      }

      // Update the email message with categorization
      await updateEmailMessage(message_id, {
        category,
        extracted_data: extractedData,
        reviewed_by: 'system', // TODO: Use actual user ID
        reviewed_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        category,
        extracted_data: extractedData,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in email API:', error);
    console.log(
      'Error details:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
