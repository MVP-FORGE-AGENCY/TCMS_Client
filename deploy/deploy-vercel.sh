#!/bin/bash

# Stop on any error
set -e

# Ensure we are in the project root (one level up from this script)
cd "$(dirname "$0")/.."

echo "🚀 Starting Vercel Deployment..."

# Check if logged in (optional, but good for UX)
# npx vercel whoami > /dev/null 2>&1 || { echo "❌ Not logged in. Run 'npx vercel login' first."; exit 1; }

echo "📦 Deploying to production..."
npx vercel --prod

echo "✅ Deployment command sent!"
