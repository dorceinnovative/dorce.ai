import { Injectable, type OnModuleInit, OnModuleDestroy } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  [key: string]: any
  async onModuleInit() {
    try {
      // Check if DATABASE_URL is available before connecting
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder') || process.env.DATABASE_URL === 'undefined') {
        console.log('⚠️  DATABASE_URL not properly configured, using fallback mode');
        console.log('📋 This is expected during initial Railway deployment');
        console.log('🔄 Railway should provide DATABASE_URL when PostgreSQL is attached');
        
        // Don't attempt to connect if DATABASE_URL is invalid
        // This allows the app to start and Railway can inject the real DATABASE_URL
        return;
      }
      
      console.log('🔄 Connecting to PostgreSQL database...');
      await this.$connect()
      console.log('✅ Successfully connected to PostgreSQL database');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error.message);
      console.log('📋 This might be expected during initial Railway deployment');
      console.log('🔄 Railway should provide valid DATABASE_URL when PostgreSQL is attached');
      
      // Don't throw error during initial deployment
      // This allows the app to start and Railway can fix the connection
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect()
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error.message);
    }
  }
}
