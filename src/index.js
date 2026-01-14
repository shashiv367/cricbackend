const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: accessLogStream }));

// Health check endpoint
app.get('/health', async (req, res) => {
  let supabaseStatus = 'disconnected';
  try {
    const { data, error } = await supabase.from('_health').select('*').limit(1);
    // Even if _health table doesn't exist, if we get an error response from Supabase, the API is reachable
    if (!error || error.code === 'PGRST116' || error.status !== 0) {
      supabaseStatus = 'connected';
    }
  } catch (err) {
    supabaseStatus = 'error';
  }

  const healthStatus = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'supabase',
    supabase: supabaseStatus
  };

  res.status(200).json(healthStatus);
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Cricket Backend API (Supabase Version)',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: { message: 'Route not found' }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 Supabase URL: ${process.env.SUPABASE_URL}`);
});
