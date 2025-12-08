// Render Database Setup Script
console.log('🚀 Setting up Dorce.ai Backend for Render...');

// Check if DATABASE_URL exists and has a valid value
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'undefined' || process.env.DATABASE_URL.includes('placeholder')) {
  console.log('⚠️  DATABASE_URL not found or invalid, checking Render environment...');
  
  // Render provides DATABASE_URL automatically when PostgreSQL is attached
  // Also check for RENDER_DATABASE_URL as fallback
  const renderDbUrl = process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!renderDbUrl || renderDbUrl === 'undefined' || renderDbUrl.includes('placeholder')) {
    console.log('❌ DATABASE_URL not available from Render');
    console.log('💡 Make sure PostgreSQL database is attached in Render dashboard');
    console.log('📋 Render should automatically provide DATABASE_URL when PostgreSQL is attached');
    
    // For initial deployment, create a temporary fallback
    // This allows the app to start and Render can inject the real DATABASE_URL
    console.log('🔄 Using temporary fallback for initial startup');
    process.env.DATABASE_URL = 'postgresql://render:temp_password@localhost:5432/render_temp';
  } else {
    process.env.DATABASE_URL = renderDbUrl;
    console.log('✅ DATABASE_URL found:', process.env.DATABASE_URL.substring(0, 50) + '...');
  }
} else {
  console.log('✅ DATABASE_URL found:', process.env.DATABASE_URL.substring(0, 50) + '...');
}

// Set other required environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || process.env.RENDER_JWT_SECRET || 'development-secret-key-change-in-production';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.RENDER_JWT_ACCESS_SECRET || 'access-secret-key';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.RENDER_JWT_REFRESH_SECRET || 'refresh-secret-key';

// If Supabase free plan blocks direct connections or requires pooler, rewrite DATABASE_URL to use PgBouncer
try {
  const url = new URL(process.env.DATABASE_URL)
  if (url.hostname.endsWith('.supabase.co') && url.port === '5432') {
    // Supabase pooled port is 6543; Prisma needs pgbouncer=true and connection_limit=1
    url.port = '6543'
    const params = url.searchParams
    if (!params.has('pgbouncer')) params.append('pgbouncer', 'true')
    if (!params.has('connection_limit')) params.append('connection_limit', '1')
    process.env.DATABASE_URL = url.toString()
    console.log('🔁 Adjusted Supabase DATABASE_URL for pooler (6543, pgbouncer)')
  }
} catch {}

console.log('✅ Render environment setup complete');
console.log('🔧 Applying Prisma migrations (deploy) or push as fallback...');
try {
  const { execSync } = require('child_process');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (e) {
  console.log('⚠️  migrate deploy failed, attempting db push...');
  try {
    const { execSync } = require('child_process');
    execSync('npx prisma db push', { stdio: 'inherit' });
  } catch (err) {
    console.log('❌ Prisma db push failed:', err?.message);
  }
}
console.log('🎯 Starting NestJS application with Render PostgreSQL...');
