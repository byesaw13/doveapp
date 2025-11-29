#!/bin/bash
# Helper script to update Square token in .env.local

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          UPDATE SQUARE TOKEN                             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    exit 1
fi

echo "Current environment: $(grep SQUARE_ENVIRONMENT .env.local | cut -d'=' -f2)"
echo ""
echo "Choose an option:"
echo "1) Use Sandbox (recommended for testing)"
echo "2) Use Production (requires approved Square app)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "📝 Get your SANDBOX token from:"
    echo "   https://developer.squareup.com/apps"
    echo "   → Your App → Credentials → Sandbox Access Token"
    echo ""
    read -p "Paste your Sandbox Access Token: " token
    
    # Update environment to sandbox
    sed -i 's/SQUARE_ENVIRONMENT=.*/SQUARE_ENVIRONMENT=sandbox/' .env.local
    # Update token
    sed -i "s/SQUARE_ACCESS_TOKEN=.*/SQUARE_ACCESS_TOKEN=$token/" .env.local
    
    echo ""
    echo "✅ Updated to use Sandbox environment"
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "📝 Get your PRODUCTION token from:"
    echo "   https://developer.squareup.com/apps"
    echo "   → Your App → Credentials → Production Access Token"
    echo ""
    read -p "Paste your Production Access Token: " token
    
    # Update environment to production
    sed -i 's/SQUARE_ENVIRONMENT=.*/SQUARE_ENVIRONMENT=production/' .env.local
    # Update token
    sed -i "s/SQUARE_ACCESS_TOKEN=.*/SQUARE_ACCESS_TOKEN=$token/" .env.local
    
    echo ""
    echo "✅ Updated to use Production environment"
else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "Testing connection..."
echo ""
node scripts/test-square.js

echo ""
echo "If you saw ✅ Success above, restart your dev server:"
echo "  pkill -f 'next dev' && npm run dev"
