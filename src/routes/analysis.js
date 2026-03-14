/**
 * Analysis Routes — Run drainage, topography, and soil analysis
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const DrainageEngine = require('../engine/drainageEngine');
const TopographyEngine = require('../engine/topographyEngine');
const SoilEngine = require('../engine/soilEngine');

// elevation lookup (proxy) - supports ELEVATION_API_URL env var or falls back to Open-Elevation
router.get('/elevation', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ success: false, error: 'lat and lng required' });

    const apiUrlTemplate = process.env.ELEVATION_API_URL || 'https://api.open-elevation.com/api/v1/lookup?locations={lat},{lng}';
    const apiUrl = apiUrlTemplate.replace('{lat}', encodeURIComponent(lat)).replace('{lng}', encodeURIComponent(lng));

    // Use global fetch (Node 18+)
    const resp = await fetch(apiUrl);
    if (!resp.ok) return res.status(502).json({ success: false, error: 'Elevation service error' });
    const body = await resp.json();

    // open-elevation returns { results: [ { latitude, longitude, elevation } ] }
    let elevation_m = null;
    if (body && body.results && body.results.length) elevation_m = parseFloat(body.results[0].elevation);
    // Some APIs return different shapes; try common fallbacks
    if (elevation_m == null && body.elevation != null) elevation_m = parseFloat(body.elevation);

    if (elevation_m == null || Number.isNaN(elevation_m)) return res.status(502).json({ success: false, error: 'Unable to parse elevation' });

    const elevation_ft = +(elevation_m * 3.28084).toFixed(2);
    res.json({ success: true, elevation: { meters: elevation_m, feet: elevation_ft } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST run full site analysis
router.post('/full/:projectId', (req, res) => {
  try {
    const project = db.findById('projects', req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const surveyPoints = db.findAll('survey_points', { project_id: req.params.projectId });
    const boundaries = db.findAll('property_boundaries', { project_id: req.params.projectId });
    const structures = db.findAll('structures', { project_id: req.params.projectId });

    const topoAnalysis = TopographyEngine.analyzeTopography(surveyPoints, boundaries);
    const soilAnalysis = SoilEngine.analyzeSoil(project.soil_type, surveyPoints);
    const drainageAnalysis = DrainageEngine.fullSiteAnalysis({
      project, surveyPoints, boundaries, structures,
      topography: topoAnalysis, soil: soilAnalysis
    });

    const analysisId = uuidv4();
    db.insert('water_flow_analysis', {
      id: analysisId,
      project_id: req.params.projectId,
      analysis_type: 'full_site',
      input_data: { surveyPoints: surveyPoints.length, soil_type: project.soil_type },
      results: drainageAnalysis
    });

    res.json({
      success: true,
      analysis: { id: analysisId, topography: topoAnalysis, soil: soilAnalysis, drainage: drainageAnalysis }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST calculate runoff
router.post('/runoff/:projectId', (req, res) => {
  try {
    const project = db.findById('projects', req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { rainfall_inches, duration_hours, return_period_years } = req.body;
    const structures = db.findAll('structures', { project_id: req.params.projectId });

    const runoff = DrainageEngine.calculateRunoff({
      area_sqft: project.property_area_sqft || 10000,
      soil_type: project.soil_type,
      rainfall_inches: rainfall_inches || (project.avg_annual_rainfall_in || 40) / 12,
      duration_hours: duration_hours || 1,
      return_period_years: return_period_years || 10,
      impervious_area_sqft: structures.reduce((sum, s) => sum + ((s.geometry && s.geometry.area_sqft) || 0), 0)
    });

    res.json({ success: true, runoff });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST calculate slopes
router.post('/slope', (req, res) => {
  try {
    const { points } = req.body;
    if (!points || points.length < 2) {
      return res.status(400).json({ success: false, error: 'Need at least 2 points with elevation' });
    }
    const slopes = TopographyEngine.calculateSlopes(points);
    res.json({ success: true, slopes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST generate contours
router.post('/contours/:projectId', (req, res) => {
  try {
    const surveyPoints = db.findAll('survey_points', { project_id: req.params.projectId });
    if (surveyPoints.length < 3) {
      return res.status(400).json({ success: false, error: 'Need at least 3 survey points' });
    }
    const { interval_ft } = req.body;
    const contours = TopographyEngine.generateContours(surveyPoints, interval_ft || 1);
    res.json({ success: true, contours });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST analyze flow paths
router.post('/flow-paths/:projectId', (req, res) => {
  try {
    const surveyPoints = db.findAll('survey_points', { project_id: req.params.projectId });
    const structures = db.findAll('structures', { project_id: req.params.projectId });
    const flowPaths = TopographyEngine.calculateFlowPaths(surveyPoints, structures);
    res.json({ success: true, flowPaths });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET soil info
router.get('/soil-info/:soilType', (req, res) => {
  try {
    const info = SoilEngine.getSoilInfo(req.params.soilType);
    res.json({ success: true, soil: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
