// Quick test script to verify Square API connection
// Run with: node scripts/test-square.js

require('dotenv').config({ path: '.env.local' });
const { SquareClient, SquareEnvironment } = require('square');

async function testSquareConnection() {
  console.log('Testing Square API connection...\n');
  
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const environment = process.env.SQUARE_ENVIRONMENT === 'production' 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox;
  
  console.log('Configuration:');
  console.log('- Environment:', process.env.SQUARE_ENVIRONMENT);
  console.log('- Access token present:', !!accessToken);
  console.log('- Access token length:', accessToken?.length || 0);
  console.log('- Token starts with:', accessToken?.substring(0, 10) + '...');
  console.log();
  
  if (!accessToken) {
    console.error('❌ SQUARE_ACCESS_TOKEN is not set in .env.local');
    process.exit(1);
  }
  
  try {
    const client = new SquareClient({
      bearerAuthCredentials: {
        accessToken,
      },
      environment,
    });
    
    console.log('Fetching customers from Square...');
    const response = await client.customers.list();
    
    console.log('\n✅ Success!');
    console.log('- Status code:', response.statusCode);
    console.log('- Customers found:', response.result.customers?.length || 0);
    
    if (response.result.customers && response.result.customers.length > 0) {
      console.log('\nFirst customer:');
      const first = response.result.customers[0];
      console.log('- ID:', first.id);
      console.log('- Name:', first.givenName, first.familyName);
      console.log('- Email:', first.emailAddress);
    }
    
  } catch (error) {
    console.error('\n❌ Error connecting to Square:');
    console.error('Message:', error.message);
    
    if (error.errors) {
      console.error('API Errors:', JSON.stringify(error.errors, null, 2));
    }
    
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
    }
    
    console.error('\nFull error:', error);
  }
}

testSquareConnection();
