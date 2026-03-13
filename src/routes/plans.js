/**
 * Plan Routes — Generate and manage drainage plans
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const DrainageEngine = require('../engine/drainageEngine');
const LandscapeEngine = require('../engine/landscapeEngine');
const TopographyEngine = require('../engine/topographyEngine');
const SoilEngine = require('../engine/soilEngine');

// POST generate a new drainage plan
router.post('/generate/:projectId', (req, res) => {
  try {
    const project = db.findById('projects', req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const surveyPoints = db.findAll('survey_points', { project_id: req.params.projectId });
    const boundaries = db.findAll('property_boundaries', { project_id: req.params.projectId });
    const structures = db.findAll('structures', { project_id: req.params.projectId });

    const { plan_name, plan_type, preferences } = req.body;

    const topoAnalysis = TopographyEngine.analyzeTopography(surveyPoints, boundaries);
    const soilAnalysis = SoilEngine.analyzeSoil(project.soil_type, surveyPoints);

    const siteData = {
      project, surveyPoints, boundaries, structures,
      topography: topoAnalysis, soil: soilAnalysis
    };

    const drainagePlan = DrainageEngine.generateDrainagePlan(siteData, preferences || {});
    const landscaping = LandscapeEngine.generateLandscapeIntegration(siteData, drainagePlan);
    const materials = DrainageEngine.calculateMaterials(drainagePlan);
    const costEstimate = DrainageEngine.estimateCosts(materials, project);
    const installSteps = DrainageEngine.generateInstallationSteps(drainagePlan, landscaping);

    const planId = uuidv4();
    const fullPlanData = {
      drainage: drainagePlan,
      landscaping,
      siteAnalysis: { topography: topoAnalysis, soil: soilAnalysis }
    };

    db.insert('drainage_plans', {
      id: planId,
      project_id: req.params.projectId,
      plan_name: plan_name || `Drainage Plan — ${new Date().toLocaleDateString()}`,
      plan_type: plan_type || 'comprehensive',
      status: 'draft',
      plan_data: fullPlanData,
      materials_list: materials,
      cost_estimate: costEstimate,
      installation_steps: installSteps,
      notes: null
    });

    for (const element of drainagePlan.elements) {
      db.insert('drainage_elements', {
        id: uuidv4(),
        plan_id: planId,
        element_type: element.type,
        label: element.label,
        geometry: element.geometry,
        specifications: element.specifications,
        slope_percent: element.slope_percent,
        depth_in: element.depth_in,
        width_in: element.width_in,
        material: element.material,
        notes: element.notes
      });
    }

    res.json({
      success: true,
      plan: {
        id: planId,
        plan_name: plan_name || `Drainage Plan — ${new Date().toLocaleDateString()}`,
        plan_data: fullPlanData,
        materials,
        costEstimate,
        installSteps
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all plans for project
router.get('/project/:projectId', (req, res) => {
  try {
    const plans = db.findAll('drainage_plans', { project_id: req.params.projectId });
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single plan
router.get('/:id', (req, res) => {
  try {
    const plan = db.findById('drainage_plans', req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    const elements = db.findAll('drainage_elements', { plan_id: req.params.id });
    res.json({ success: true, plan: { ...plan, elements } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE plan
router.delete('/:id', (req, res) => {
  try {
    db.remove('drainage_elements', { plan_id: req.params.id });
    db.removeById('drainage_plans', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
