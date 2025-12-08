import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Dorce.ai Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: process.env.DATABASE_URL ? 'configured' : 'not_configured',
      uptime: process.uptime()
    };
  }

  @Get('ready')
  readinessCheck() {
    // Simple readiness check - can be extended with database connectivity
    const isDatabaseConfigured = process.env.DATABASE_URL && 
                                 !process.env.DATABASE_URL.includes('placeholder') && 
                                 process.env.DATABASE_URL !== 'undefined';
    
    return {
      status: isDatabaseConfigured ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      database: isDatabaseConfigured ? 'connected' : 'waiting_for_connection',
      message: isDatabaseConfigured ? 'All systems operational' : 'Waiting for database configuration'
    };
  }
}