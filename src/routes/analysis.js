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
const xml2js = require('xml2js');

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

// Geocode address -> lat/lon (proxy). Uses Nominatim by default; override with GEOCODE_API_URL env var.
router.get('/geocode', async (req, res) => {
  try {
    const address = req.query.address;
    if (!address) return res.status(400).json({ success: false, error: 'address query required' });
    const provider = (process.env.GEOCODE_PROVIDER || 'nominatim').toLowerCase();

    if (provider === 'zillow' || req.query.provider === 'zillow') {
      // Use Zillow Deep Search (XML) — requires ZWSID in env var ZILLOW_ZWSID
      const zwsid = process.env.ZILLOW_ZWSID || req.query.zwsid;
      if (!zwsid) return res.status(400).json({ success: false, error: 'Zillow ZWSID required (set ZILLOW_ZWSID env var)' });
      const base = process.env.ZILLOW_API_URL || 'http://www.zillow.com/webservice/GetDeepSearchResults.htm';
      const url = `${base}?zws-id=${encodeURIComponent(zwsid)}&address=${encodeURIComponent(address)}&citystatezip=`;
      const resp = await fetch(url);
      const text = await resp.text();

      // Parse XML with xml2js for reliable extraction
      let parsed = null;
      try {
        parsed = await xml2js.parseStringPromise(text, { explicitArray: false, mergeAttrs: true });
      } catch (e) {
        // fallback: return raw text info
        console.warn('Zillow XML parse failed', e && e.message ? e.message : e);
        return res.json({ success: true, result: { display_name: address, raw: text } });
      }

      // Navigate to result object if present
      const result = parsed && parsed['searchresults'] && parsed['searchresults'].response && parsed['searchresults'].response.results && parsed['searchresults'].response.results.result
        ? parsed['searchresults'].response.results.result
        : (parsed && parsed['searchresults'] && parsed['searchresults'].response && parsed['searchresults'].response.results) || null;

      // helper to find nested keys
      function deepFind(obj, keyNames) {
        if (!obj) return null;
        if (typeof keyNames === 'string') keyNames = [keyNames];
        for (const k of keyNames) {
          if (obj[k]) return obj[k];
        }
        // recurse
        for (const v of Object.values(obj)) {
          if (v && typeof v === 'object') {
            const found = deepFind(v, keyNames);
            if (found) return found;
          }
        }
        return null;
      }

      const lotCandidates = ['lotSizeSqFt', 'lotSize', 'lotSizeSquareFeet', 'lot_size_sqft'];
      const lotVal = deepFind(result, lotCandidates);
      const lotSqFt = lotVal ? parseInt(('' + lotVal).replace(/[^0-9]/g, '')) : null;

      const latVal = deepFind(result, ['latitude', 'lat']);
      const lonVal = deepFind(result, ['longitude', 'lng', 'lon']);
      const lat = latVal ? parseFloat(latVal) : null;
      const lon = lonVal ? parseFloat(lonVal) : null;

      let display_name = address;
      const addrObj = deepFind(result, ['address', 'formattedAddress', 'homedetails']);
      if (addrObj) {
        if (typeof addrObj === 'string') display_name = addrObj;
        else if (addrObj.street) display_name = `${addrObj.street} ${addrObj.city || ''} ${addrObj.state || ''}`.trim();
      }

      return res.json({ success: true, result: { display_name, lat, lon, approx_area_sqft: lotSqFt, provider: 'zillow' } });
    }

    // Google Geocoding
    if (provider === 'google' || req.query.provider === 'google') {
      const key = process.env.GOOGLE_API_KEY || req.query.key;
      if (!key) return res.status(400).json({ success: false, error: 'Google API key required (set GOOGLE_API_KEY env var)' });
      const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(key)}`;
      const resp = await fetch(apiUrl);
      if (!resp.ok) return res.status(502).json({ success: false, error: 'Google geocode error' });
      const body = await resp.json();
      if (!body || !body.results || !body.results.length) return res.json({ success: true, results: [] });
      const best = body.results[0];
      const lat = best.geometry.location.lat;
      const lon = best.geometry.location.lng;
      let approx_area_sqft = null;
      if (best.geometry.viewport) {
        const ne = best.geometry.viewport.northeast;
        const sw = best.geometry.viewport.southwest;
        const R = 6371000; const toRad = v=>v*Math.PI/180;
        const latDist = R * Math.abs(Math.sin(toRad(ne.lat)) - Math.sin(toRad(sw.lat)));
        const lonDist = R * Math.cos(toRad((ne.lat+sw.lat)/2)) * toRad(Math.abs(ne.lng - sw.lng));
        approx_area_sqft = Math.round(Math.abs(latDist*lonDist)*10.7639);
      }
      return res.json({ success: true, result: { display_name: best.formatted_address, lat, lon, approx_area_sqft, provider: 'google' } });
    }

    // Mapbox
    if (provider === 'mapbox' || req.query.provider === 'mapbox') {
      const key = process.env.MAPBOX_API_KEY || req.query.key;
      if (!key) return res.status(400).json({ success: false, error: 'Mapbox API key required (set MAPBOX_API_KEY env var)' });
      const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${encodeURIComponent(key)}&limit=1`;
      const resp = await fetch(apiUrl);
      if (!resp.ok) return res.status(502).json({ success: false, error: 'Mapbox geocode error' });
      const body = await resp.json();
      if (!body || !body.features || !body.features.length) return res.json({ success: true, results: [] });
      const f = body.features[0];
      const lon = f.center && f.center[0];
      const lat = f.center && f.center[1];
      let approx_area_sqft = null;
      if (f.bbox && f.bbox.length === 4) {
        const west = f.bbox[0], south = f.bbox[1], east = f.bbox[2], north = f.bbox[3];
        const R = 6371000; const toRad = v=>v*Math.PI/180;
        const latDist = R * Math.abs(Math.sin(toRad(north)) - Math.sin(toRad(south)));
        const lonDist = R * Math.cos(toRad((north+south)/2)) * toRad(Math.abs(east - west));
        approx_area_sqft = Math.round(Math.abs(latDist*lonDist)*10.7639);
      }
      return res.json({ success: true, result: { display_name: f.place_name, lat, lon, approx_area_sqft, provider: 'mapbox' } });
    }

    const apiTemplate = process.env.GEOCODE_API_URL || 'https://nominatim.openstreetmap.org/search?q={q}&format=json&addressdetails=1&limit=1';
    const apiUrl = apiTemplate.replace('{q}', encodeURIComponent(address));

    const resp = await fetch(apiUrl, { headers: { 'User-Agent': 'DrainagePlanner/1.0 (+https://github.com/mitchellray-gh/DrainagePlanner)' } });
    if (!resp.ok) return res.status(502).json({ success: false, error: 'Geocode service error' });
    const body = await resp.json();
    if (!body || !body.length) return res.json({ success: true, results: [] });

    const best = body[0];
    // boundingbox is [south, north, west, east] in many responses (Nominatim gives [south, north, west, east] as strings)
    const bbox = best.boundingbox ? best.boundingbox.map(parseFloat) : null;
    let approx_area_sqft = null;
    if (bbox && bbox.length === 4) {
      // bbox: [south, north, west, east]
      const south = bbox[0], north = bbox[1], west = bbox[2], east = bbox[3];
      // approximate distances in meters
      const R = 6371000; // earth radius m
      const toRad = v => v * Math.PI / 180;
      const latDist = R * Math.abs(Math.sin(toRad(north)) - Math.sin(toRad(south))); // rough north-south
      const lonDist = R * Math.cos(toRad((north + south) / 2)) * toRad(Math.abs(east - west));
      const area_m2 = Math.abs(latDist * lonDist);
      approx_area_sqft = +(area_m2 * 10.7639).toFixed(0);
    }

    res.json({ success: true, result: {
      display_name: best.display_name,
      lat: parseFloat(best.lat),
      lon: parseFloat(best.lon),
      boundingbox: bbox,
      approx_area_sqft
    }});
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
