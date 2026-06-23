/**
 * DrainagePlanner — Expert Yard Drainage Planning System
 * Combines Construction Management, Land Surveying & Landscaping expertise
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./models/database');

// Route imports
const projectRoutes = require('./routes/projects');
const photoRoutes = require('./routes/photos');
const analysisRoutes = require('./routes/analysis');
const planRoutes = require('./routes/plans');
const reportRoutes = require('./routes/reports');
const chatRoutes = require('./routes/chat');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers. CSP is disabled so external map tiles and browser-side
// geocoding fetches keep working; tighten later with an explicit policy if needed.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS — restrict to an allowlist when ALLOWED_ORIGINS is set; otherwise allow
// same-origin / non-browser requests plus the common localhost dev ports.
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // same-origin / curl / mobile apps
    const list = allowedOrigins.length ? allowedOrigins : DEV_ORIGINS;
    if (list.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rate limit the API surface to curb abuse of the proxy/chat endpoints.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// Optional API access token. When API_ACCESS_TOKEN is set, every /api request must
// supply it via `Authorization: Bearer <token>` or `x-api-token`. Off by default so
// the bundled same-origin UI keeps working; enable for headless/locked deployments.
const API_TOKEN = process.env.API_ACCESS_TOKEN;
if (API_TOKEN) {
  app.use('/api', (req, res, next) => {
    const header = req.get('authorization') || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = bearer || req.get('x-api-token');
    if (token === API_TOKEN) return next();
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  });
}

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);

// Unknown API routes return JSON 404 (so a typo doesn't return the HTML app).
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Serve React app (SPA fallback) for all non-API routes.
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  res.sendFile(indexPath);
});

// Global error handler — always return JSON instead of an HTML stack trace.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.message ? err.message : err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

// Initialize database and start
initDatabase();

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║          🌧️  DrainagePlanner Pro v1.0                    ║
║   Expert Yard Drainage Planning & Analysis System        ║
║                                                          ║
║   🏗️  Construction Manager Module    ✅                  ║
║   📐 Land Surveyor Module           ✅                   ║
║   🌿 Landscaping Specialist Module  ✅                   ║
║                                                          ║
║   Server running at http://localhost:${PORT}              ║
╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
