const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 4000;

// Railway-compatible CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

// Simple router with Railway health checks
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Railway health check endpoint (critical for deployment)
  if (path === '/health' && method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'dorce-backend',
      version: '1.0.0'
    }));
    return;
  }

  // API status endpoint
  if (path === '/api/status' && method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ 
      status: 'running', 
      version: '1.0.0',
      railway: true,
      services: {
        backend: true,
        database: process.env.SUPABASE_URL ? true : false,
        ai: process.env.OPENAI_API_KEY ? true : false
      }
    }));
    return;
  }

  // Chat endpoint (simple echo for Railway)
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
          response: `Railway Echo: ${data.message || 'Hello from Railway'}`,
          timestamp: new Date().toISOString(),
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
      message: 'Dorce.ai Railway Backend API',
      version: '1.0.0',
      railway: true,
      endpoints: [
        'GET /health - Railway health check',
        'GET /api/status - API status',
        'POST /api/chat - Chat endpoint'
      ]
    }));
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: 'Route not found' }));
});

// Railway-compatible server startup
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚂 Dorce.ai Railway Backend running on port ${PORT}`);
  console.log(`💓 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔧 API status: http://0.0.0.0:${PORT}/api/status`);
});