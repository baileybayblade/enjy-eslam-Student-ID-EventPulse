const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const { errorHandler } = require('./middleware/errorMiddleware');
const AppError = require('./utils/appError');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// socket.io connection stuff
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // users join a specific event room
  socket.on('joinEventRoom', (eventId) => {
    socket.join(`event_${eventId}`);
    console.log(`Socket ${socket.id} joined room event_${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.set('io', io);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// routes
app.use('/api/events', require('./routes/eventRoutes'));
// app.use('/api/messages', require('./routes/messageRoutes'));

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(errorHandler);
module.exports = app;