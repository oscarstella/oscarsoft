const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { PORT } = require('./config/constants');
const setupSockets = require('./sockets/socketHandler');

// Rutas
const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Configuración de WebSockets con Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Guardar instancia de io en app para uso en controladores
app.set('io', io);

// Middlewares
app.use(cors());
app.use(express.json());

// Logging simple
app.use((req, res, next) => {
  console.log(`[BariGo API] ${req.method} ${req.url}`);
  next();
});

// Registrar Rutas
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'BariGo Backend',
    service: 'Transporte Urbano Bariloche',
    time: new Date().toISOString()
  });
});

// Inicializar sockets
setupSockets(io);

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚗 Servidor BariGo corriendo en puerto ${PORT}`);
  console.log(`⚡ WebSockets Socket.io listos para GPS`);
  console.log(`=========================================`);
});

module.exports = { app, server, io };
