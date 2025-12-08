#!/bin/bash

# Dorce.ai Environment Setup Script
# This script helps you set up all required environment variables

echo "🚀 Dorce.ai Environment Setup"
echo "================================"
echo ""

# Function to generate secure random strings
generate_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
}

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local default="$2"
    local input
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        echo "${input:-$default}"
    else
        read -p "$prompt: " input
        echo "$input"
    fi
}

echo "📋 Let's set up your environment variables:"
echo ""

# Application Configuration
echo "🔧 Application Configuration:"
NODE_ENV=$(prompt_input "Node environment" "production")
PORT=$(prompt_input "Port" "4000")
FRONTEND_URL=$(prompt_input "Frontend URL" "https://dorce-ai.vercel.app")
CORS_ORIGIN=$(prompt_input "CORS Origin" "https://dorce-ai.vercel.app")

echo ""
echo "🗄️ Database Configuration (Supabase):"
echo "Get these from: https://app.supabase.com/project/[your-project]/settings/database"
DATABASE_URL=$(prompt_input "Database URL (PostgreSQL connection string)")

echo ""
echo "🔄 Redis/Upstash Configuration:"
echo "Get these from: https://console.upstash.com/"
REDIS_URL=$(prompt_input "Redis URL (optional if using Upstash)")
UPSTASH_REDIS_REST_URL=$(prompt_input "Upstash Redis REST URL")
UPSTASH_REDIS_REST_TOKEN=$(prompt_input "Upstash Redis REST Token")

echo ""
echo "🔐 JWT Secrets (Leave empty to generate automatically):"
JWT_ACCESS_SECRET=$(prompt_input "JWT Access Secret")
JWT_REFRESH_SECRET=$(prompt_input "JWT Refresh Secret")
JWT_SECRET=$(prompt_input "JWT Secret (backup)")

# Generate secrets if not provided
if [ -z "$JWT_ACCESS_SECRET" ]; then
    JWT_ACCESS_SECRET=$(generate_secret)
    echo "✅ Generated JWT Access Secret: ${JWT_ACCESS_SECRET:0:20}..."
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    JWT_REFRESH_SECRET=$(generate_secret)
    echo "✅ Generated JWT Refresh Secret: ${JWT_REFRESH_SECRET:0:20}..."
fi

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$JWT_ACCESS_SECRET
    echo "✅ Using JWT Access Secret as backup"
fi

echo ""
echo "🤖 AI API Configuration:"
echo "Get OpenAI key from: https://platform.openai.com/api-keys"
echo "Get OpenRouter key from: https://openrouter.ai/keys"
OPENAI_API_KEY=$(prompt_input "OpenAI API Key")
OPENROUTER_API_KEY=$(prompt_input "OpenRouter API Key")

echo ""
echo "💳 Payment Configuration (Optional):"
echo "Get Paystack key from: https://dashboard.paystack.com/#/settings/developer"
PAYSTACK_SECRET_KEY=$(prompt_input "Paystack Secret Key (optional)")

echo ""
echo "📡 Supabase Configuration:"
echo "Get these from: https://app.supabase.com/project/[your-project]/settings/api"
SUPABASE_URL=$(prompt_input "Supabase Project URL")
SUPABASE_ANON_KEY=$(prompt_input "Supabase Anon Key")
SUPABASE_SERVICE_ROLE_KEY=$(prompt_input "Supabase Service Role Key")

echo ""
echo "📞 Communication Services (Optional):"
echo "Get Twilio credentials from: https://console.twilio.com/"
TWILIO_ACCOUNT_SID=$(prompt_input "Twilio Account SID (optional)")
TWILIO_AUTH_TOKEN=$(prompt_input "Twilio Auth Token (optional)")
TWILIO_PHONE_NUMBER=$(prompt_input "Twilio Phone Number (optional)")

echo ""
echo "📧 Email Configuration (Optional):"
SMTP_HOST=$(prompt_input "SMTP Host" "smtp.gmail.com")
SMTP_PORT=$(prompt_input "SMTP Port" "587")
SMTP_USER=$(prompt_input "SMTP User/Email (optional)")
SMTP_PASS=$(prompt_input "SMTP Password/App Password (optional)")

# Create the .env.production file
echo ""
echo "📝 Creating .env.production file..."

cat > .env.production << EOF
# Dorce.ai Production Environment
# Generated on: $(date)

# Application Configuration
NODE_ENV=$NODE_ENV
PORT=$PORT
FRONTEND_URL=$FRONTEND_URL
CORS_ORIGIN=$CORS_ORIGIN

# Database Configuration
DATABASE_URL=$DATABASE_URL

# Redis Configuration
REDIS_URL=$REDIS_URL
UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN

# JWT Security Configuration
JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ACCESS_EXPIRES_IN=15m

# AI/ML API Configuration
OPENAI_API_KEY=$OPENAI_API_KEY
OPENROUTER_API_KEY=$OPENROUTER_API_KEY

# Payment Configuration
PAYSTACK_SECRET_KEY=$PAYSTACK_SECRET_KEY

# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Communication Services
TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER

# Email Configuration
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS

# File Storage Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Security Configuration
BCRYPT_ROUNDS=12

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Neural Core Configuration
NEURAL_CORE_ENABLED=true
CONSCIOUSNESS_PROCESSING_ENABLED=true
EVOLUTION_ALGORITHMS_ENABLED=true
QUANTUM_PROCESSING_ENABLED=true

# System Resources
MAX_CONCURRENT_USERS=10000
MAX_MEMORY_USAGE=2GB
MAX_CPU_USAGE=80%

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket Configuration
WS_PORT=4001
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_CONNECTIONS=5000
EOF

echo ""
echo "✅ Environment file created successfully!"
echo "📁 File: .env.production"
echo ""
echo "🚀 Next Steps:"
echo "1. Review the generated .env.production file"
echo "2. Run: npm install (if not already done)"
echo "3. Run: npm run build"
echo "4. Deploy to Render using: render deploy"
echo ""
echo "🎯 Your Dorce.ai next-generation operating system is ready for deployment!"
echo "📋 System includes: Quantum Neural Core, Consciousness Processing, 10 Business Apps"
echo "🔧 Features: AI Integration, Real-time Chat, Multi-window Desktop, Self-evolving Algorithms"