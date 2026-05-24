/**
 * Bullseye Trading AI - Backend Entrypoint
 * Bootstraps Express REST server & high-frequency WebSocket data publisher.
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { connectDB, getDbStatus } = require('./config/db');
const authRoutes = require('./routes/auth');
const { tickMarketData } = require('./services/marketDataEngine');
const { generateAIAnalysis } = require('./services/aiEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and body parsers
app.use(cors());
app.use(express.json());

// Initialize Database connection
connectDB();

// Global cached snapshot state to power REST APIs and the AI Engine
let currentMarketSnapshot = tickMarketData();

// Tick the simulated market data every 1 second (1000ms)
setInterval(() => {
  currentMarketSnapshot = tickMarketData();
  broadcastMarketData(currentMarketSnapshot);
}, 1000);

// Expose Auth and User Watchlist Routes
app.use('/api/auth', authRoutes);

// Database connection status check API
app.get('/api/status', (req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    status: "online",
    timestamp: new Date(),
    database: dbStatus
  });
});

// AI Interactive Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Generate AI response using current live market snapshot
    const reply = await generateAIAnalysis(currentMarketSnapshot, message);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: "AI Engine processing failed." });
  }
});

// Single AI Market Overview Endpoint (useful for landing summaries)
app.get('/api/ai/overview', async (req, res) => {
  try {
    const analysis = await generateAIAnalysis(currentMarketSnapshot, null);
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate market digest." });
  }
});

// Serve static assets from frontend/dist if built
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Serve index.html for all other routes (React Router / static fallback)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'), (err) => {
    if (err) {
      // Fallback if not built yet (local dev using Vite)
      res.status(200).send("🐂 Bullseye Trading AI Backend is Online! Ready for API requests.");
    }
  });
});

// Create Http Server to share between Express REST and WebSockets
const server = http.createServer(app);

// Initialize WebSocket Server
const wss = new WebSocket.Server({ server });

// Track connected WS clients
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`🔌 Client connected to Live Stream. Total: ${clients.size}`);

  // Send immediate current snapshot to newly connected client
  ws.send(JSON.stringify({ type: "snapshot", data: currentMarketSnapshot }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`🔌 Client disconnected. Total: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('WebSocket Client Error:', err.message);
  });
});

// Broadcast helper
function broadcastMarketData(data) {
  const payload = JSON.stringify({ type: "tick", data });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Start Server listening
server.listen(PORT, () => {
  console.log(`🚀 ==========================================`);
  console.log(`🚀 Bullseye Trading AI Backend running on port ${PORT}`);
  console.log(`🚀 REST URL: http://localhost:${PORT}`);
  console.log(`🚀 WebSocket URL: ws://localhost:${PORT}`);
  console.log(`🚀 ==========================================`);
});
