#!/bin/bash
# Alternative build script for Render - handles Puppeteer issues

echo "🚀 Starting Dorce.ai Backend Build (Render Optimized)"

 # running from backend directory in Render build step

# Install dependencies without Puppeteer postinstall scripts
echo "📦 Installing dependencies (skipping Puppeteer scripts)..."
pnpm install --ignore-scripts

# Build the application
echo "🔨 Building application..."
pnpm build

# Note: Puppeteer functionality will be disabled in production
# To enable it later, you'd need to:
# 1. Install Chrome/Chromium on Render
# 2. Set PUPPETEER_EXECUTABLE_PATH
# 3. Remove --ignore-scripts flag

echo "✅ Build completed successfully!"
echo "📝 Note: Puppeteer functionality disabled for production stability"