#!/usr/bin/env node

// Ultra-simple standalone backend - ZERO dependencies
// This file contains everything needed to run

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || '';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const ALLOWED_ORIGINS = Array.from(new Set([FRONTEND_URL, ...CORS_ORIGINS].filter(Boolean)));

console.log('🚀 Starting Dorce.ai Ultra-Simple Backend...');
console.log(`📊 Port: ${PORT}`);
console.log(`🔗 Frontend: ${FRONTEND_URL}`);

function makeCorsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.length === 0
    ? (origin || '')
    : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };
}

// Simple router
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  const origin = req.headers.origin || '';
  const corsHeaders = makeCorsHeaders(origin);

  if (method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  if (path === '/health' && method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'dorce-ai-backend'
    }));
    return;
  }

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
      railway: true
    }));
    return;
  }

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
          response: `Echo: ${data.message || 'Hello from Dorce.ai!'}`,
          timestamp: new Date().toISOString(),
          model: 'echo',
          railway: true
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
      message: 'Dorce.ai Ultra-Simple Backend API',
      version: '1.0.0',
      endpoints: [
        'GET /health - Health check',
        'GET /api/status - API status',
        'POST /api/chat - Chat endpoint'
      ],
      note: 'This is a minimal backend with zero dependencies',
      railway: true
    }));
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: 'Route not found', path: path }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Dorce.ai Backend running on port ${PORT}`);
  console.log(`📝 Health check path: /health`);
  console.log(`🔧 API status path: /api/status`);
  console.log(`💬 Chat endpoint path: /api/chat`);
});