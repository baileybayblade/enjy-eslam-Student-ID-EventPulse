require('dotenv').config();

const express = require('express');
const http = require('http');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const { Server } = require('socket.io');
const { errorHandler } = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const authRoutes = require('./routes/authRoutes');
const connectDB = require('./config/db');

const app = express();

// middleware 4 express
app.use(morgan('dev'));
app.use(express.json());
app.use(mongoSanitize());

// http & socket.io server setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('joinEventRoom', (eventId) => {
    socket.join(`event_${eventId}`);
    console.log(`Socket ${socket.id} joined room event_${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// swagger doc
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// api routes
app.use('/api/auth', authRoutes);
app.use('/api/events', require('./routes/eventRoutes'));
// app.use('/api/messages', require('./routes/messageRoutes'));

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ status: 'fail', message: 'Route not found' });
});

// global error handler
app.use(errorHandler);

// async start function thing
async function start() {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

module.exports = app;