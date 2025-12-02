// Test Gmail API connection
// Run with: node scripts/test-gmail-connection.js

require('dotenv').config({ path: '.env.local' });

async function testGmailConnection() {
  const accessToken = process.env.GMAIL_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ GMAIL_ACCESS_TOKEN not found in environment variables');
    console.log(
      'Please complete the Gmail OAuth flow and set the tokens in your .env.local file'
    );
    console.log(
      'Look for the tokens in your server logs after completing OAuth'
    );
    return;
  }

  try {
    console.log('🔍 Testing Gmail API connection...');

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=-is:chat',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Gmail API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('✅ Gmail API connection successful!');
    console.log(`📧 Found ${data.messages?.length || 0} recent messages`);

    if (data.messages && data.messages.length > 0) {
      console.log(
        '📨 Sample message IDs:',
        data.messages.slice(0, 3).map((m) => m.id)
      );
    }
  } catch (error) {
    console.error('❌ Gmail API connection failed:', error.message);
    console.log('💡 Make sure:');
    console.log('   1. You completed the Gmail OAuth flow');
    console.log('   2. The GMAIL_ACCESS_TOKEN is set correctly in .env.local');
    console.log(
      "   3. The token hasn't expired (check GMAIL_TOKEN_EXPIRES_AT)"
    );
    console.log(
      '   4. Your Google Cloud Console OAuth redirect URI matches: http://localhost:3000/api/auth/google/callback'
    );
  }
}

testGmailConnection();
