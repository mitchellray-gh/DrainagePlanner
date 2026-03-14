/**
 * Project Routes — CRUD for drainage projects
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const fs = require('fs');
const path = require('path');

// GET all projects
router.get('/', (req, res) => {
  try {
    // by default exclude soft-deleted projects
    const projects = db.findAll('projects').filter(p => !p.deleted).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    const enriched = projects.map(p => ({
      ...p,
      photo_count: db.count('photos', { project_id: p.id }),
      survey_point_count: db.count('survey_points', { project_id: p.id }),
      plan_count: db.count('drainage_plans', { project_id: p.id })
    }));
    res.json({ success: true, projects: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single project with all related data
router.get('/:id', (req, res) => {
  try {
    const project = db.findById('projects', req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const photos = db.findAll('photos', { project_id: req.params.id });
    const surveyPoints = db.findAll('survey_points', { project_id: req.params.id });
    const boundaries = db.findAll('property_boundaries', { project_id: req.params.id });
    const structures = db.findAll('structures', { project_id: req.params.id });
    const plans = db.findAll('drainage_plans', { project_id: req.params.id });

    res.json({
      success: true,
      project: { ...project, photos, surveyPoints, boundaries, structures, plans }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create new project
router.post('/', (req, res) => {
  try {
    const id = uuidv4();
    const { name, address, latitude, longitude, property_area_sqft, climate_zone, avg_annual_rainfall_in, soil_type, notes } = req.body;

    const project = db.insert('projects', {
      id, name, address,
      latitude: latitude || null,
      longitude: longitude || null,
      property_area_sqft: property_area_sqft || null,
      climate_zone: climate_zone || null,
      avg_annual_rainfall_in: avg_annual_rainfall_in || null,
      soil_type: soil_type || 'unknown',
      notes: notes || null,
      status: 'draft'
    });

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update project
router.put('/:id', (req, res) => {
  try {
    const fields = { ...req.body };
    delete fields.id;
    const project = db.update('projects', req.params.id, fields);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE project
router.delete('/:id', (req, res) => {
  try {
    // delete photo files from disk first
    const photos = db.findAll('photos', { project_id: req.params.id });
    for (const photo of photos) {
      try {
        if (photo && photo.filepath) {
          // filepath is stored as relative like 'uploads/abc.jpg'
          const fullPath = path.isAbsolute(photo.filepath) ? photo.filepath : path.join(__dirname, '..', '..', photo.filepath);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
      } catch (e) {
        // log and continue
        console.warn('Failed to remove photo file', photo && photo.filepath, e && e.message ? e.message : e);
      }
    }
    db.remove('photos', { project_id: req.params.id });
    db.remove('survey_points', { project_id: req.params.id });
    db.remove('property_boundaries', { project_id: req.params.id });
    db.remove('structures', { project_id: req.params.id });
    db.remove('drainage_plans', { project_id: req.params.id });
    db.remove('water_flow_analysis', { project_id: req.params.id });
    db.removeById('projects', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SOFT TRASH — move project to trash (undoable)
router.post('/:id/trash', (req, res) => {
  try {
    const id = req.params.id;
    const project = db.findById('projects', id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const updated = db.update('projects', id, { deleted: true, deleted_at: new Date().toISOString() });
    res.json({ success: true, project: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// RESTORE from trash
router.post('/:id/restore', (req, res) => {
  try {
    const id = req.params.id;
    const project = db.findById('projects', id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const updated = db.update('projects', id, { deleted: false, deleted_at: null });
    res.json({ success: true, project: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add survey point
router.post('/:id/survey-points', (req, res) => {
  try {
    const id = uuidv4();
    const { label, latitude, longitude, elevation_ft, point_type, soil_type, notes } = req.body;

    const point = db.insert('survey_points', {
      id, project_id: req.params.id,
      label, latitude, longitude,
      elevation_ft: elevation_ft != null ? parseFloat(elevation_ft) : null,
      point_type: point_type || 'ground',
      soil_type: soil_type || null,
      notes: notes || null
    });

    res.json({ success: true, point });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE single survey point
router.delete('/:id/survey-points/:pointId', (req, res) => {
  try {
    const project = db.findById('projects', req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const point = db.findById('survey_points', req.params.pointId);
    if (!point || point.project_id !== req.params.id) {
      return res.status(404).json({ success: false, error: 'Survey point not found' });
    }

    db.removeById('survey_points', req.params.pointId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add property boundary
router.post('/:id/boundaries', (req, res) => {
  try {
    const id = uuidv4();
    const { boundary_points, area_sqft, perimeter_ft } = req.body;

    const boundary = db.insert('property_boundaries', {
      id, project_id: req.params.id,
      boundary_points, area_sqft, perimeter_ft
    });

    res.json({ success: true, boundary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add structure
router.post('/:id/structures', (req, res) => {
  try {
    const id = uuidv4();
    const { structure_type, label, geometry, elevation_ft, foundation_type, notes } = req.body;

    const structure = db.insert('structures', {
      id, project_id: req.params.id,
      structure_type, label,
      geometry: geometry || {},
      elevation_ft, foundation_type, notes
    });

    res.json({ success: true, structure });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
