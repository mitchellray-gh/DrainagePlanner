/**
 * Report Routes — Generate printable HTML drainage plan reports
 */
const express = require('express');
const router = express.Router();
const db = require('../models/database');
const ReportGenerator = require('../engine/reportGenerator');

// GET generate HTML report for a plan
router.get('/html/:planId', (req, res) => {
  try {
    const plan = db.findById('drainage_plans', req.params.planId);
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });

    const project = db.findById('projects', plan.project_id);
    const elements = db.findAll('drainage_elements', { plan_id: req.params.planId });

    const reportHtml = ReportGenerator.generateHTMLReport({ project, plan, elements });
    res.type('html').send(reportHtml);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET summary
router.get('/summary/:planId', (req, res) => {
  try {
    const plan = db.findById('drainage_plans', req.params.planId);
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });

    const project = db.findById('projects', plan.project_id);
    const elements = db.findAll('drainage_elements', { plan_id: req.params.planId });

    const summary = ReportGenerator.generateSummary({ project, plan, elements });
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
