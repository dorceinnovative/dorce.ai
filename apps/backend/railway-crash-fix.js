#!/usr/bin/env node

// RAILWAY-CRASH-FIX backend - ZERO dependencies
// This version forces Railway to use the correct file

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dorce-ai.netlify.app';

console.log('🚨 RAILWAY CRASH FIX: Starting backend...');
console.log(`📊 Port: ${PORT}`);
console.log(`🔗 Frontend: ${FRONTEND_URL}`);
console.log('✅ NO EXPRESS DEPENDENCIES - ZERO MODULES REQUIRED');

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': FRONTEND_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

// Simple router
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`📡 ${method} ${path}`);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Health check endpoint - Railway requires this
  if (path === '/health' && method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'dorce-ai-backend',
      railway: true,
      crash_fix: true
    }));
    return;
  }

  // API status endpoint
  if (path === '/api/status' && method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ 
      status: 'running', 
      version: '1.0.0',
      environment: 'production',
      services: {
        backend: true,
        database: process.env.SUPABASE_URL ? true : false,
        ai: process.env.OPENAI_API_KEY ? true : false,
        redis: process.env.UPSTASH_REDIS_REST_URL ? true : false
      },
      railway: true,
      crash_fix: true,
      note: 'This backend has ZERO dependencies - no Express required!'
    }));
    return;
  }

  // Chat endpoint (simple echo)
  if (path === '/api/chat' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify({ 
          response: `Railway Echo: ${data.message || 'Hello from crash-free Railway!'}`,
          timestamp: new Date().toISOString(),
          model: 'echo',
          railway: true,
          crash_fix: true
        }));
      } catch (error) {
        res.writeHead(400, corsHeaders);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Default route
  if (path === '/' && method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ 
      message: 'Dorce.ai Railway Crash-Fix Backend API',
      version: '1.0.0',
      endpoints: [
        'GET /health - Railway health check',
        'GET /api/status - API status',
        'POST /api/chat - Chat endpoint'
      ],
      note: 'This backend has ZERO dependencies - Railway crash fixed!',
      railway: true,
      crash_fix: true
    }));
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: 'Route not found', path: path }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎯 RAILWAY CRASH FIX: Backend running on port ${PORT}`);
  console.log(`📝 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔧 API status: http://0.0.0.0:${PORT}/api/status`);
  console.log(`💬 Chat endpoint: http://0.0.0.0:${PORT}/api/chat`);
  console.log('🎉 RAILWAY DEPLOYMENT CRASH FIXED - ZERO DEPENDENCIES!');
});