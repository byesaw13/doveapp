#!/bin/bash

echo "🚀 DoveApp Deployment to Vercel"
echo "================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI already installed"
fi

echo ""
echo "📋 Pre-deployment checklist:"
echo "  1. Make sure .env.local has all required variables"
echo "  2. Test the app locally with 'npm run dev'"
echo "  3. Ensure all API endpoints work"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo "🔐 Logging into Vercel..."
vercel login

echo ""
echo "🚀 Deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Go to https://vercel.com/dashboard"
echo "  2. Select your project"
echo "  3. Add environment variables (Settings → Environment Variables):"
echo "     - Copy all variables from .env.local"
echo "  4. Redeploy with: vercel --prod"
echo "  5. Add custom domain (Settings → Domains)"
echo "  6. Update OAuth redirect URIs in Google & Square dashboards"
echo "  7. Update Cloudflare Worker WEBHOOK_URL secret"
echo ""
