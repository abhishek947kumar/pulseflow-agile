import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import boardsRouter from './routes/boards.js';
import tasksRouter from './routes/tasks.js';
import timerRouter from './routes/timer.js';
import analyticsRouter from './routes/analytics.js';
import aiRouter from './routes/ai.js';
import { socketManager } from './websocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-user-id']
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/boards', boardsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/timer', timerRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'PulseFlow Enterprise Project Management Engine',
    timestamp: new Date().toISOString(),
    version: '2.4.0'
  });
});

// Serve frontend static build in production
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// WebSocket Server initialization
socketManager.init(server);

// Start server
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 PulseFlow Server is running on http://localhost:${PORT}`);
  console.log(`⚡ WebSocket live sync available at ws://localhost:${PORT}/ws`);
  console.log(`📊 REST API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`=======================================================`);
});

export default app;
