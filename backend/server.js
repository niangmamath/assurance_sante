require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

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
const authRouter = require('./routes/auth.js');

app.use('/api/leads', (req, res, next) => {
  req.io = io;
  next();
}, leadsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/auth', authRouter);

// SPA FALLBACK ROUTES (local + prod Hostinger) - Après TOUTES les API routes
app.get('/landing', (req, res) => res.sendFile(path.join(__dirname, '../frontend/landing/index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dashboard/index.html')));

// Catch-all pour refresh SPA (dev/pro)
app.get(/^\/(landing|dashboard)/, (req, res, next) => {
  const page = req.path.split('/')[1];
  res.sendFile(path.join(__dirname, `../frontend/${page}/index.html`));
});

const connectDB = require('./config/db.js');
connectDB().catch(console.error); // Non-bloquant

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Test: curl http://localhost:3000/');
  console.log(`Landing page: http://localhost:${PORT}/landing`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
});
