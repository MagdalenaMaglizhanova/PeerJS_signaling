const express = require('express');
const { ExpressPeerServer } = require('peer');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://smart-classroom-nn26.vercel.app', // твоят Vercel URL
    // добави всички URL-и, от които ще се свързваш
  ],
  credentials: true
}));
app.use(compression());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'PeerJS Signaling Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      peerjs: '/peerjs',
      stats: '/stats',
      connections: '/connections'
    }
  });
});

// Статистика за сървъра
app.get('/stats', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: peerServer?.connections?.size || 0,
    timestamp: new Date().toISOString()
  });
});

// Създаване на HTTP сървър
const server = app.listen(process.env.PORT || 3001, () => {
  console.log(`🚀 PeerJS signaling server is running on port ${process.env.PORT || 3001}`);
  console.log(`📡 WebSocket endpoint: /peerjs`);
  console.log(`🌐 CORS enabled for all origins`);
});

// PeerJS сървър конфигурация
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/',
  allow_discovery: true,
  proxied: true,
  expire_timeout: 5000,
  alive_timeout: 60000,
  key: 'peerjs',
  concurrent_limit: 5000,
  ssl: {
    key: '',
    cert: ''
  }
});

// Използване на PeerJS middleware
app.use('/peerjs', peerServer);

// Събития на PeerJS сървъра
peerServer.on('connection', (client) => {
  console.log(`🔌 Нов клиент свързан: ${client.getId()}`);
  console.log(`📊 Общо клиенти: ${peerServer.connections.size}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`🔌 Клиент прекъсна връзка: ${client.getId()}`);
  console.log(`📊 Оставащи клиенти: ${peerServer.connections.size}`);
});

peerServer.on('error', (error) => {
  console.error('❌ PeerJS грешка:', error);
});

// Запазване на активните връзки
peerServer.connections = new Map();

// API endpoint за активни връзки
app.get('/connections', (req, res) => {
  const connections = [];
  peerServer.connections.forEach((client, id) => {
    connections.push({
      id: id,
      connectedAt: client.connectedAt,
      userAgent: client.userAgent
    });
  });
  
  res.json({
    total: connections.length,
    connections: connections
  });
});

// Глобална обработка на грешки
app.use((err, req, res, next) => {
  console.error('❌ Грешка:', err.stack);
  res.status(500).json({
    error: 'Нещо се обърка!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Не е намерено',
    message: `Маршрутът ${req.url} не съществува`
  });
});

// Правилно затваряне на сървъра
process.on('SIGTERM', () => {
  console.log('📡 Получен SIGTERM, затваряне на сървъра...');
  server.close(() => {
    console.log('👋 Сървърът затворен');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📡 Получен SIGINT, затваряне на сървъра...');
  server.close(() => {
    console.log('👋 Сървърът затворен');
    process.exit(0);
  });
});

module.exports = server;
