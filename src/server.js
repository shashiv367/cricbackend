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

// Public profile landing page for QR scans.
app.get('/profile/:profileId', (req, res) => {
  const { profileId } = req.params;
  const deepLink = `innings://profile/${profileId}`;
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.example.sportbet';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Open Innings Profile</title>
    <style>
      body{font-family:Arial,sans-serif;background:#f6f4ff;margin:0;padding:24px;color:#1f2937}
      .card{max-width:520px;margin:24px auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 8px 24px rgba(0,0,0,.08)}
      h1{margin:0 0 8px;font-size:22px}
      p{color:#6b7280;line-height:1.4}
      .btn{display:inline-block;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:700}
      .primary{background:#6d28d9;color:#fff}
      .secondary{background:#0ea5a4;color:#fff;margin-left:10px}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>View Cricket Profile</h1>
      <p>Open this profile in the Innings app. If the app is not installed, download it from Play Store.</p>
      <a class="btn primary" href="${deepLink}">Open in App</a>
      <a class="btn secondary" href="${playStoreUrl}">Download App</a>
      <p style="margin-top:14px;font-size:12px">Profile id: ${profileId}</p>
    </div>
  </body>
</html>`);
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


