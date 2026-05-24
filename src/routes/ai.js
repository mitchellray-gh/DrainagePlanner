/**
 * AI Routes — Export normalized training data from saved projects
 * Used by the browser-based TensorFlow.js model
 */
const express = require('express');
const router = express.Router();
const db = require('../models/database');
const DrainageEngine = require('../engine/drainageEngine');

// Soil type encoding map (one-hot positions)
const SOIL_TYPES = ['clay', 'heavy_clay', 'silty_clay', 'loam', 'sandy_loam', 'sand', 'gravel', 'silt', 'unknown'];

// Drainage element types (output labels)
const ELEMENT_TYPES = ['french_drain', 'catch_basin', 'rain_garden', 'dry_well', 'swale', 'channel_drain', 'grading'];

/**
 * GET /api/ai/training-data
 * Returns normalized training samples derived from all saved projects and their plans
 */
router.get('/training-data', (req, res) => {
  try {
    const projects = db.findAll('projects').filter(p => !p.deleted);
    const plans = db.findAll('drainage_plans');
    const samples = [];

    for (const project of projects) {
      const projectPlans = plans.filter(p => p.project_id === project.id);

      if (projectPlans.length > 0) {
        // Use actual plan data as training labels
        for (const plan of projectPlans) {
          const features = extractFeatures(project);
          const labels = extractLabelsFromPlan(plan);
          if (features && labels) {
            samples.push({ features, labels });
          }
        }
      } else {
        // Generate synthetic label from rule-based engine
        const features = extractFeatures(project);
        const labels = generateSyntheticLabels(project);
        if (features && labels) {
          samples.push({ features, labels });
        }
      }
    }

    // Add augmented samples to boost training set
    const augmented = augmentData(samples);

    res.json({
      success: true,
      metadata: {
        soil_types: SOIL_TYPES,
        element_types: ELEMENT_TYPES,
        feature_count: 20,
        sample_count: augmented.length
      },
      samples: augmented
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Extract normalized feature vector from a project
 * Returns array of 20 numeric values
 */
function extractFeatures(project) {
  const area = project.property_area_sqft || 5000;
  const rainfall = project.avg_annual_rainfall_in || 40;
  const climateZoneNum = parseClimateZone(project.climate_zone);
  const soilIndex = SOIL_TYPES.indexOf(project.soil_type || 'unknown');

  // Normalize numeric features to 0-1 range
  const normalizedArea = Math.min(area / 50000, 1);
  const normalizedRainfall = Math.min(rainfall / 80, 1);
  const normalizedClimate = climateZoneNum / 13; // USDA zones 1-13

  // One-hot encode soil type (9 positions)
  const soilOneHot = new Array(SOIL_TYPES.length).fill(0);
  soilOneHot[soilIndex >= 0 ? soilIndex : SOIL_TYPES.length - 1] = 1;

  // Impervious area estimate (default 20%)
  const imperviousRatio = 0.2;

  // Slope estimate (default 2%)
  const slopePercent = 2;
  const normalizedSlope = Math.min(slopePercent / 15, 1);

  return [
    normalizedArea,
    normalizedRainfall,
    normalizedClimate,
    imperviousRatio,
    normalizedSlope,
    ...soilOneHot,
    // Additional derived features
    normalizedArea * normalizedRainfall, // interaction: area × rainfall
    normalizedArea * imperviousRatio,    // interaction: area × impervious
    normalizedRainfall * normalizedSlope, // interaction: rainfall × slope
    soilIndex >= 0 && soilIndex <= 2 ? 1 : 0, // is_clay_type
    normalizedRainfall > 0.5 ? 1 : 0,   // high_rainfall flag
    normalizedArea > 0.4 ? 1 : 0        // large_property flag
  ];
}

/**
 * Extract labels from an actual drainage plan
 * Returns array of 7 values (0 or 1) for each element type
 */
function extractLabelsFromPlan(plan) {
  const labels = new Array(ELEMENT_TYPES.length).fill(0);

  if (!plan || !plan.plan_data) return labels;

  const planData = plan.plan_data;
  const elements = planData.drainage?.elements || [];

  for (const element of elements) {
    const typeStr = (element.type || '').toLowerCase();
    for (let i = 0; i < ELEMENT_TYPES.length; i++) {
      if (typeStr.includes(ELEMENT_TYPES[i]) || typeStr.includes(ELEMENT_TYPES[i].replace('_', ' '))) {
        labels[i] = 1;
      }
    }
  }

  // Also check recommendations
  const recs = planData.drainage?.recommendations || [];
  for (const rec of recs) {
    const typeStr = (rec.type || '').toLowerCase();
    for (let i = 0; i < ELEMENT_TYPES.length; i++) {
      if (typeStr.includes(ELEMENT_TYPES[i]) || typeStr.includes(ELEMENT_TYPES[i].replace('_', ' '))) {
        labels[i] = 1;
      }
    }
  }

  return labels;
}

/**
 * Generate synthetic labels using the rule-based engine
 */
function generateSyntheticLabels(project) {
  const labels = new Array(ELEMENT_TYPES.length).fill(0);

  const area = project.property_area_sqft || 5000;
  const rainfall = project.avg_annual_rainfall_in || 40;
  const soilType = project.soil_type || 'unknown';

  try {
    const runoff = DrainageEngine.calculateRunoff({
      area_sqft: area,
      soil_type: soilType,
      rainfall_inches: rainfall / 12, // monthly approximation
      duration_hours: 1,
      return_period_years: 10,
      impervious_area_sqft: area * 0.2
    });

    const recs = runoff.recommendations || [];
    for (const rec of recs) {
      const typeStr = (rec.type || '').toLowerCase();
      for (let i = 0; i < ELEMENT_TYPES.length; i++) {
        if (typeStr.includes(ELEMENT_TYPES[i]) || typeStr.includes(ELEMENT_TYPES[i].replace('_', ' '))) {
          labels[i] = 1;
        }
      }
    }
  } catch (e) {
    // Fallback: recommend french drain + grading as baseline
    labels[0] = 1; // french_drain
    labels[6] = 1; // grading
  }

  return labels;
}

/**
 * Augment the dataset by creating variations of existing samples
 */
function augmentData(samples) {
  const augmented = [...samples];

  for (const sample of samples) {
    // Create 5 variations with slight noise
    for (let i = 0; i < 5; i++) {
      const noisyFeatures = sample.features.map((val, idx) => {
        // Only add noise to continuous features (first 5)
        if (idx < 5) {
          const noise = (Math.random() - 0.5) * 0.1;
          return Math.max(0, Math.min(1, val + noise));
        }
        return val;
      });
      augmented.push({ features: noisyFeatures, labels: [...sample.labels] });
    }
  }

  // Add synthetic scenarios for common drainage situations
  const syntheticScenarios = generateSyntheticScenarios();
  augmented.push(...syntheticScenarios);

  return augmented;
}

/**
 * Generate synthetic training scenarios covering common drainage situations
 */
function generateSyntheticScenarios() {
  const scenarios = [];

  // Scenario templates: [area, rainfall, climate, impervious, slope, soil_type_index, expected_labels]
  const templates = [
    // Small clay yard, high rain → french drain + grading + catch basin
    [0.2, 0.6, 0.5, 0.3, 0.13, 0, [1, 1, 0, 0, 0, 0, 1]],
    // Large sandy property, low rain → minimal intervention
    [0.8, 0.25, 0.4, 0.1, 0.07, 5, [0, 0, 0, 0, 0, 0, 0]],
    // Medium loam, moderate rain → rain garden + swale
    [0.4, 0.5, 0.5, 0.2, 0.1, 3, [0, 0, 1, 0, 1, 0, 0]],
    // Large clay, heavy rain → full system
    [0.7, 0.75, 0.6, 0.35, 0.07, 0, [1, 1, 1, 1, 1, 0, 1]],
    // Small property, steep slope → channel drain + grading
    [0.15, 0.4, 0.5, 0.25, 0.6, 3, [0, 0, 0, 0, 0, 1, 1]],
    // Medium silty clay, moderate → french drain + dry well
    [0.35, 0.45, 0.5, 0.2, 0.13, 2, [1, 0, 0, 1, 0, 0, 1]],
    // Large property, flat → swale + rain garden
    [0.9, 0.5, 0.5, 0.15, 0.03, 3, [0, 0, 1, 0, 1, 0, 0]],
    // Heavy clay, pooling risk → catch basin + french drain + dry well
    [0.3, 0.55, 0.5, 0.3, 0.05, 1, [1, 1, 0, 1, 0, 0, 1]],
  ];

  for (const [area, rain, climate, impervious, slope, soilIdx, labels] of templates) {
    const soilOneHot = new Array(SOIL_TYPES.length).fill(0);
    soilOneHot[soilIdx] = 1;

    const features = [
      area, rain, climate, impervious, slope,
      ...soilOneHot,
      area * rain,
      area * impervious,
      rain * slope,
      soilIdx <= 2 ? 1 : 0,
      rain > 0.5 ? 1 : 0,
      area > 0.4 ? 1 : 0
    ];

    // Add base + variations
    scenarios.push({ features, labels });
    for (let v = 0; v < 3; v++) {
      const noisy = features.map((val, idx) => {
        if (idx < 5) return Math.max(0, Math.min(1, val + (Math.random() - 0.5) * 0.08));
        return val;
      });
      scenarios.push({ features: noisy, labels: [...labels] });
    }
  }

  return scenarios;
}

function parseClimateZone(zone) {
  if (!zone) return 6;
  const num = parseInt(zone);
  if (!isNaN(num)) return Math.min(13, Math.max(1, num));
  return 6;
}

module.exports = router;
