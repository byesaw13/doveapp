#!/bin/bash
# Interactive Square OAuth setup script

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          SQUARE OAUTH SETUP WIZARD                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found! Please create it first."
    exit 1
fi

echo "This wizard will help you set up Square OAuth."
echo ""
echo "Before continuing, please:"
echo "1. Go to https://developer.squareup.com/apps"
echo "2. Select or create your application"
echo "3. Go to OAuth → Add redirect URL:"
echo "   http://localhost:3000/api/square/oauth/callback"
echo "4. Go to Credentials to get your Application ID and Secret"
echo ""
read -p "Have you completed these steps? (y/n): " ready

if [ "$ready" != "y" ]; then
    echo "Please complete the steps above and run this script again."
    exit 0
fi

echo ""
echo "Choose environment:"
echo "1) Sandbox (recommended for testing)"
echo "2) Production (requires approved app)"
echo ""
read -p "Enter choice (1 or 2): " env_choice

if [ "$env_choice" = "1" ]; then
    ENVIRONMENT="sandbox"
    echo ""
    echo "📝 From Square Developer Dashboard → Credentials:"
    echo ""
    read -p "Paste Sandbox Application ID: " app_id
    read -p "Paste Sandbox Application Secret: " app_secret
elif [ "$env_choice" = "2" ]; then
    ENVIRONMENT="production"
    echo ""
    echo "📝 From Square Developer Dashboard → Credentials:"
    echo ""
    read -p "Paste Production Application ID: " app_id
    read -p "Paste Production Application Secret: " app_secret
else
    echo "❌ Invalid choice"
    exit 1
fi

# Update .env.local
echo ""
echo "Updating .env.local..."

# Add or update NEXT_PUBLIC_APP_URL
if grep -q "NEXT_PUBLIC_APP_URL=" .env.local; then
    sed -i 's|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=http://localhost:3000|' .env.local
else
    echo "" >> .env.local
    echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local
fi

# Add or update NEXT_PUBLIC_SQUARE_APPLICATION_ID
if grep -q "NEXT_PUBLIC_SQUARE_APPLICATION_ID=" .env.local; then
    sed -i "s/NEXT_PUBLIC_SQUARE_APPLICATION_ID=.*/NEXT_PUBLIC_SQUARE_APPLICATION_ID=$app_id/" .env.local
else
    echo "NEXT_PUBLIC_SQUARE_APPLICATION_ID=$app_id" >> .env.local
fi

# Add or update SQUARE_APPLICATION_SECRET
if grep -q "SQUARE_APPLICATION_SECRET=" .env.local; then
    sed -i "s/SQUARE_APPLICATION_SECRET=.*/SQUARE_APPLICATION_SECRET=$app_secret/" .env.local
else
    echo "SQUARE_APPLICATION_SECRET=$app_secret" >> .env.local
fi

# Update SQUARE_ENVIRONMENT
sed -i "s/SQUARE_ENVIRONMENT=.*/SQUARE_ENVIRONMENT=$ENVIRONMENT/" .env.local

# Remove old SQUARE_ACCESS_TOKEN if it exists
sed -i '/SQUARE_ACCESS_TOKEN=/d' .env.local

echo "✅ .env.local updated!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Run the database migration in Supabase:"
echo "   → Go to your Supabase project"
echo "   → SQL Editor → New query"
echo "   → Copy contents of: supabase/migrations/002_create_square_connections_table.sql"
echo "   → Run the query"
echo ""
echo "2. Restart your dev server:"
echo "   pkill -f 'next dev' && npm run dev"
echo ""
echo "3. Test the OAuth flow:"
echo "   → http://localhost:3000/clients"
echo "   → Click 'Connect to Square'"
echo "   → Authorize the app"
echo "   → Click 'Import from Square'"
echo ""
echo "✅ Setup complete! See SQUARE_OAUTH_SETUP.md for more details."
