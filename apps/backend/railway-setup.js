// Railway Database Setup Script
console.log('🚀 Setting up Dorce.ai Backend for Railway...');

// Check if DATABASE_URL exists and has a valid value
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'undefined' || process.env.DATABASE_URL.includes('placeholder')) {
  console.log('⚠️  DATABASE_URL not found or invalid, checking Railway environment...');
  
  // Railway provides DATABASE_URL automatically when PostgreSQL is attached
  // Also check for RAILWAY_POSTGRESQL_URL as fallback
  const railwayDbUrl = process.env.RAILWAY_POSTGRESQL_URL || process.env.DATABASE_URL;
  
  if (!railwayDbUrl || railwayDbUrl === 'undefined' || railwayDbUrl.includes('placeholder')) {
    console.log('❌ DATABASE_URL not available from Railway');
    console.log('💡 Make sure PostgreSQL database is attached in Railway dashboard');
    console.log('📋 Railway should automatically provide DATABASE_URL when PostgreSQL is attached');
    
    // For initial deployment, create a temporary fallback
    // This allows the app to start and Railway can inject the real DATABASE_URL
    console.log('🔄 Using temporary fallback for initial startup');
    process.env.DATABASE_URL = 'postgresql://railway:temp_password@localhost:5432/railway_temp';
  } else {
    process.env.DATABASE_URL = railwayDbUrl;
    console.log('✅ DATABASE_URL found:', process.env.DATABASE_URL.substring(0, 50) + '...');
  }
} else {
  console.log('✅ DATABASE_URL found:', process.env.DATABASE_URL.substring(0, 50) + '...');
}

// Set other required environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || process.env.RAILWAY_JWT_SECRET || 'development-secret-key-change-in-production';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.RAILWAY_JWT_ACCESS_SECRET || 'access-secret-key';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.RAILWAY_JWT_REFRESH_SECRET || 'refresh-secret-key';

console.log('✅ Railway environment setup complete');
console.log('🎯 Starting NestJS application with Railway PostgreSQL...');