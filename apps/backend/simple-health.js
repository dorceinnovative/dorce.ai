const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'dorce-ai-backend',
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Dorce.ai Backend is running',
    status: 'healthy',
    endpoints: ['/health', '/api', '/status']
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dorce.ai Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});