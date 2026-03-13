/**
 * DrainagePlanner — Expert Yard Drainage Planning System
 * Combines Construction Management, Land Surveying & Landscaping expertise
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDatabase } = require('./models/database');

// Route imports
const projectRoutes = require('./routes/projects');
const photoRoutes = require('./routes/photos');
const analysisRoutes = require('./routes/analysis');
const planRoutes = require('./routes/plans');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/reports', reportRoutes);

// Serve main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
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
