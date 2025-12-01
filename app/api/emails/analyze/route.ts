// AI Email Analysis API
// POST /api/emails/analyze - Analyze specific emails with AI

import { NextRequest, NextResponse } from 'next/server';
import { getEmailMessageById, processEmailWithAI } from '@/lib/db/email';

export async function POST(request: NextRequest) {
  try {
    const { emailIds } = await request.json();

    if (!emailIds || !Array.isArray(emailIds)) {
      return NextResponse.json(
        { error: 'emailIds array is required' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const emailId of emailIds) {
      try {
        const email = await getEmailMessageById(emailId);
        if (!email) {
          errors.push({ emailId, error: 'Email not found' });
          continue;
        }

        await processEmailWithAI(email);
        results.push({ emailId, status: 'analyzed' });
      } catch (error) {
        console.error(`Failed to analyze email ${emailId}:`, error);
        errors.push({
          emailId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
      total: emailIds.length,
      successful: results.length,
      failed: errors.length,
    });
  } catch (error) {
    console.error('Error in AI analysis:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to analyze emails';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
