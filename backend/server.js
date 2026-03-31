require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST']
  }
}); // Fix Socket CORS

// Middleware
app.use(cors({
  origin: true,
  credentials: true
})); // Fix CORS frontend static
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Assurance Leads Backend v2.0 - Ready!' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Dashboard connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Dashboard disconnected:', socket.id);
  });
});

const leadsRouter = require('./routes/leads.js');
const chatRouter = require('./routes/chat.js');
app.use('/api/leads', (req, res, next) => {
  req.io = io;
  next();
}, leadsRouter);
app.use('/api/chat', chatRouter);

const connectDB = require('./config/db.js');
connectDB().catch(console.error); // Non-bloquant

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Test: curl http://localhost:3000/');
});

