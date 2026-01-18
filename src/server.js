const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Custom request logger
app.use((req, res, next) => {
  console.log('\n🔵 [BACKEND] ========== INCOMING REQUEST ==========');
  console.log('🔵 [BACKEND] Time:', new Date().toISOString());
  console.log('🔵 [BACKEND] Method:', req.method);
  console.log('🔵 [BACKEND] Path:', req.path);
  console.log('🔵 [BACKEND] Query:', JSON.stringify(req.query, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyCopy = { ...req.body };
    if (bodyCopy.password) bodyCopy.password = '***';
    console.log('🔵 [BACKEND] Body:', JSON.stringify(bodyCopy, null, 2));
  }
  console.log('🔵 [BACKEND] ========================================\n');
  next();
});

app.use(morgan('dev'));

// Routes
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const matchRoutes = require('./routes/matchRoutes');
const locationRoutes = require('./routes/locationRoutes');
const playerRoutes = require('./routes/playerRoutes');
const umpireRoutes = require('./routes/umpireRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/umpire', umpireRoutes);
app.use('/api/user', userRoutes);

// Health check for Docker
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'cricapp-backend-docker' });
});

// Basic root route
app.get('/', (req, res) => {
  res.json({ message: 'Cricapp backend API is running' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('\n❌ [BACKEND] ========== ERROR HANDLER ==========');
  console.error('❌ [BACKEND] Path:', req.path);
  console.error('❌ [BACKEND] Method:', req.method);
  console.error('❌ [BACKEND] Error:', err.message);
  console.error('❌ [BACKEND] Error details:', JSON.stringify(err, null, 2));
  console.error('❌ [BACKEND] Stack:', err.stack);
  console.error('❌ [BACKEND] ========================================\n');

  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Cricapp backend listening on port ${config.port} (${config.env})`);
  console.log(`🔵 [BACKEND] Server accessible at http://0.0.0.0:${config.port}`);
  console.log(`🔵 [BACKEND] Local access: http://localhost:${config.port}`);
  console.log(`🔵 [BACKEND] Network access: http://192.168.1.4:${config.port}`);
});


