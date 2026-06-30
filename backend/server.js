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

// Start Server & Connect Database
async function startServer() {
  await db.initDB();
  await initMail();
  
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 DB Mode: ${db.isMongoConnected() ? 'MongoDB Cluster' : 'Local File Fallback'}`);
    console.log(`=========================================`);
  });
}

startServer().catch(err => {
  console.error("Failed to start backend server:", err);
});
