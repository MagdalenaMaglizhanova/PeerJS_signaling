const express = require('express');
const { ExpressPeerServer } = require('peer');
const cors = require('cors');

const app = express();

// CORS настройки - позволи на всички origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// За опции заявките
app.options('*', cors());

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'PeerJS Signaling Server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      peerjs: '/peerjs',
      stats: '/stats'
    }
  });
});

// Статистика
app.get('/stats', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: peerServer?.connections?.size || 0,
    timestamp: new Date().toISOString()
  });
});

// Порт от Render или 3001 като fallback
const PORT = process.env.PORT || 3001;

// Създаване на HTTP сървър
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PeerJS signaling server is running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: /peerjs`);
  console.log(`🌐 CORS enabled for all origins`);
});

// PeerJS сървър конфигурация - ОПРОСТЕНА ВЕРСИЯ
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/',
  allow_discovery: true,
  proxied: true
});

// Използване на PeerJS middleware
app.use('/peerjs', peerServer);

// Запазване на активните връзки
peerServer.connections = new Map();

// Събития на PeerJS сървъра
peerServer.on('connection', (client) => {
  console.log(`🔌 Нов клиент свързан: ${client.getId()}`);
  if (peerServer.connections) {
    console.log(`📊 Общо клиенти: ${peerServer.connections.size}`);
  }
});

peerServer.on('disconnect', (client) => {
  console.log(`🔌 Клиент прекъсна връзка: ${client.getId()}`);
  if (peerServer.connections) {
    console.log(`📊 Оставащи клиенти: ${peerServer.connections.size}`);
  }
});

peerServer.on('error', (error) => {
  console.error('❌ PeerJS грешка:', error);
});

// За дебъг - принтирай всички заявки
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

console.log('✅ Server configuration complete');
