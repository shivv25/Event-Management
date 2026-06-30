const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');
const routes = require('./routes');
const { initMail } = require('./mail');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for local testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize database and mail transport before routing if on serverless (so it connects on the first request)
let isInitialized = false;
async function initializeIfNeeded() {
  if (!isInitialized) {
    await db.initDB();
    await initMail();
    isInitialized = true;
  }
}

// Middleware to ensure connection in serverless environment
app.use(async (req, res, next) => {
  try {
    await initializeIfNeeded();
    next();
  } catch (err) {
    console.error("Initialization error:", err);
    next(err);
  }
});

// Main Router API endpoint prefix
app.use('/api', routes);

// Add default fallback for status
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    databaseMode: db.isMongoConnected() ? 'MongoDB' : 'Local JSON File fallback'
  });
});

// Start Server locally if not running on Vercel serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  initializeIfNeeded().then(() => {
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📦 DB Mode: ${db.isMongoConnected() ? 'MongoDB Cluster' : 'Local File Fallback'}`);
      console.log(`=========================================`);
    });
  }).catch(err => {
    console.error("Failed to start backend server:", err);
  });
}

module.exports = app;
