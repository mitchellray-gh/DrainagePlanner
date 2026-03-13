/**
 * ReportGenerator — Generates professional HTML drainage plan reports
 * Printable/PDF-ready with complete materials lists, cost breakdowns, and installation guides
 */

class ReportGenerator {

  static generateHTMLReport({ project, plan, elements }) {
    const planData = plan.plan_data || {};
    const materials = plan.materials_list || [];
    const costs = plan.cost_estimate || {};
    const steps = plan.installation_steps || {};
    const drainage = planData.drainage || {};
    const landscaping = planData.landscaping || {};
    const siteAnalysis = planData.siteAnalysis || {};

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Drainage Plan Report — ${project.name || 'Project'}</title>
<style>
  @page { size: letter; margin: 0.75in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.6; padding: 2rem; max-width: 1000px; margin: 0 auto; }
  h1 { font-size: 1.8rem; color: #0f172a; border-bottom: 3px solid #2563eb; padding-bottom: 0.5rem; margin-bottom: 1rem; }
  h2 { font-size: 1.3rem; color: #1e40af; margin: 2rem 0 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.3rem; }
  h3 { font-size: 1.1rem; color: #334155; margin: 1rem 0 0.5rem; }
  p { margin-bottom: 0.5rem; }
  table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.9rem; }
  th, td { border: 1px solid #cbd5e1; padding: 0.4rem 0.6rem; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; color: #334155; }
  tr:nth-child(even) { background: #f8fafc; }
  .header { text-align: center; margin-bottom: 2rem; }
  .header h1 { border: none; font-size: 2rem; }
  .header .subtitle { color: #64748b; font-size: 1.1rem; }
  .badge { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 4px; font-weight: 600; font-size: 0.85rem; }
  .badge-critical { background: #fee2e2; color: #dc2626; }
  .badge-high { background: #ffedd5; color: #ea580c; }
  .badge-moderate { background: #fef9c3; color: #ca8a04; }
  .badge-low { background: #dcfce7; color: #16a34a; }
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
  .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
  .summary-card .label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .summary-card .value { font-size: 1.4rem; font-weight: 700; color: #0f172a; }
  .step { margin: 0.75rem 0; padding: 0.75rem; border-left: 3px solid #2563eb; background: #f8fafc; }
  .step.critical { border-left-color: #dc2626; }
  .step-num { font-weight: 700; color: #2563eb; }
  .cost-total { font-size: 1.2rem; font-weight: 700; color: #0f172a; background: #dbeafe; padding: 0.75rem; border-radius: 6px; text-align: right; }
  .plant-card { display: inline-block; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 0.4rem 0.7rem; margin: 0.2rem; font-size: 0.85rem; }
  .warning { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 0.75rem; margin: 0.75rem 0; }
  .footer { margin-top: 3rem; padding-top: 1rem; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 0.85rem; }
  ul { margin: 0.3rem 0 0.75rem 1.5rem; }
  li { margin-bottom: 0.2rem; }
  @media print {
    body { padding: 0; font-size: 11pt; }
    .page-break { page-break-before: always; }
  }
</style>
</head>
<body>

<div class="header">
  <h1>🌧️ Drainage Plan Report</h1>
  <div class="subtitle">${project.name || 'Unnamed Project'}</div>
  <div style="color:#94a3b8; margin-top:0.3rem;">${project.address || ''} &bull; Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
</div>

<!-- SECTION 1: Site Summary -->
<h2>1. Site Summary</h2>
<div class="summary-grid">
  <div class="summary-card">
    <div class="label">Property Area</div>
    <div class="value">${(project.property_area_sqft || 0).toLocaleString()} sq ft</div>
    <div style="color:#64748b">${((project.property_area_sqft || 0) / 43560).toFixed(2)} acres</div>
  </div>
  <div class="summary-card">
    <div class="label">Soil Type</div>
    <div class="value">${siteAnalysis.soil?.usda_class || project.soil_type || 'Unknown'}</div>
    <div style="color:#64748b">Hydrologic Group ${siteAnalysis.soil?.hydrologic_group || '?'}</div>
  </div>
  <div class="summary-card">
    <div class="label">Annual Rainfall</div>
    <div class="value">${project.avg_annual_rainfall_in || '?'}" / year</div>
    <div style="color:#64748b">${project.climate_zone ? 'Zone ' + project.climate_zone : ''}</div>
  </div>
  <div class="summary-card">
    <div class="label">Risk Assessment</div>
    <div class="value"><span class="badge badge-${(drainage.analysis?.overall_risk?.level || 'moderate').toLowerCase()}">${drainage.analysis?.overall_risk?.level || 'N/A'}</span></div>
    <div style="color:#64748b">Score: ${drainage.analysis?.overall_risk?.score || '?'}/100</div>
  </div>
</div>

${siteAnalysis.topography?.status === 'complete' ? `
<h3>Topography</h3>
<table>
  <tr><th>Metric</th><th>Value</th></tr>
  <tr><td>Elevation Range</td><td>${siteAnalysis.topography.min_elevation_ft}' — ${siteAnalysis.topography.max_elevation_ft}' (${siteAnalysis.topography.total_relief_ft}' relief)</td></tr>
  <tr><td>Average Slope</td><td>${siteAnalysis.topography.avg_slope_percent}%</td></tr>
  <tr><td>Primary Drainage Direction</td><td>${siteAnalysis.topography.drainage_direction} (${siteAnalysis.topography.drainage_bearing || '?'}°)</td></tr>
  <tr><td>Flat Areas (ponding risk)</td><td>${siteAnalysis.topography.flat_areas}</td></tr>
  <tr><td>Steep Areas (erosion risk)</td><td>${siteAnalysis.topography.steep_areas}</td></tr>
</table>
` : '<p><em>No topographic survey data available. Add survey points for detailed analysis.</em></p>'}

<h3>Soil Analysis</h3>
<table>
  <tr><th>Property</th><th>Value</th></tr>
  <tr><td>Infiltration Rate</td><td>${siteAnalysis.soil?.infiltration_rate_in_hr || '?'} in/hr (${siteAnalysis.soil?.permeability || '?'})</td></tr>
  <tr><td>Runoff Potential</td><td>${siteAnalysis.soil?.runoff_potential || '?'}</td></tr>
  <tr><td>Drainage Class</td><td>${siteAnalysis.soil?.drainage_class || '?'}</td></tr>
  <tr><td>Shrink/Swell</td><td>${siteAnalysis.soil?.shrink_swell || '?'}</td></tr>
</table>

${siteAnalysis.soil?.drainage_implications ? `
<h3>Key Soil Implications</h3>
<ul>${siteAnalysis.soil.drainage_implications.map(d => `<li>${d}</li>`).join('')}</ul>
` : ''}

<!-- SECTION 2: Storm Analysis -->
<h2>2. Design Storm Analysis</h2>
<p>Drainage system designed to handle the <strong>10-Year Storm Event</strong> per IRC/IBC standards.</p>
${drainage.analysis?.storm_analysis ? `
<table>
  <tr><th>Storm Event</th><th>Rainfall</th><th>Peak Flow</th><th>Total Volume</th><th>Risk</th></tr>
  ${drainage.analysis.storm_analysis.map(s => `
    <tr>
      <td>${s.scenario}</td>
      <td>${s.input?.rainfall_inches?.toFixed(1) || '?'}"</td>
      <td>${s.peak_flow_gpm?.toFixed(1) || '?'} GPM</td>
      <td>${s.total_volume_gallons?.toLocaleString() || '?'} gal</td>
      <td><span class="badge badge-${s.risk_level?.level?.toLowerCase() || 'moderate'}">${s.risk_level?.level || '?'}</span></td>
    </tr>
  `).join('')}
</table>
` : ''}

<!-- SECTION 3: Drainage Plan Elements -->
<h2 class="page-break">3. Drainage Plan Elements</h2>
${(drainage.elements || []).map((el, i) => `
<h3>${i + 1}. ${el.label} <span style="color:#64748b; font-weight:normal; font-size:0.9rem;">(${el.type.replace(/_/g, ' ')})</span></h3>
<table>
  ${el.slope_percent != null ? `<tr><td><strong>Slope</strong></td><td>${el.slope_percent}%</td></tr>` : ''}
  ${el.depth_in != null ? `<tr><td><strong>Depth</strong></td><td>${el.depth_in}"</td></tr>` : ''}
  ${el.width_in != null ? `<tr><td><strong>Width</strong></td><td>${el.width_in}"</td></tr>` : ''}
  ${el.material ? `<tr><td><strong>Material</strong></td><td>${el.material}</td></tr>` : ''}
  ${el.notes ? `<tr><td><strong>Notes</strong></td><td>${el.notes}</td></tr>` : ''}
</table>
${el.specifications?.installation_notes ? `<ul>${el.specifications.installation_notes.map(n => `<li>${n}</li>`).join('')}</ul>` : ''}
`).join('')}

<!-- SECTION 4: Materials List -->
<h2 class="page-break">4. Materials List</h2>
${materials.map(group => `
<h3>${group.category} — ${group.element}</h3>
<table>
  <tr><th>Item</th><th>Quantity</th><th>Unit</th></tr>
  ${group.items.map(item => `
    <tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.unit}</td></tr>
  `).join('')}
</table>
`).join('')}

<!-- SECTION 5: Cost Estimate -->
<h2>5. Cost Estimate</h2>
${costs.cost_breakdown ? `
<table>
  <tr><th>Category</th><th>Subtotal</th></tr>
  ${costs.cost_breakdown.map(c => `<tr><td>${c.category} — ${c.element}</td><td>$${c.subtotal?.toFixed(2)}</td></tr>`).join('')}
  <tr><th>Materials Subtotal</th><th>$${costs.material_cost?.toFixed(2)}</th></tr>
  <tr><td>Labor (professional install)</td><td>$${costs.labor_cost?.toFixed(2)}</td></tr>
  <tr><td>Equipment Rental</td><td>$${costs.equipment_cost?.toFixed(2)}</td></tr>
  <tr><td>Contingency (${costs.contingency_percent}%)</td><td>$${costs.contingency_amount?.toFixed(2)}</td></tr>
</table>
<div class="cost-total">Professional Install Total: $${costs.grand_total?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
<div class="cost-total" style="background:#d1fae5; margin-top:0.5rem;">DIY Estimate: $${costs.diy_estimate?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
` : '<p>Cost data not available</p>'}
${costs.notes ? `<ul style="margin-top:0.75rem;">${costs.notes.map(n => `<li style="color:#64748b; font-size:0.9rem;">${n}</li>`).join('')}</ul>` : ''}

<!-- SECTION 6: Installation Steps -->
<h2 class="page-break">6. Installation Guide</h2>
${steps.steps ? `
<p><strong>Estimated Duration:</strong> ${steps.estimated_total_duration}</p>
${steps.steps.map(s => `
  <div class="step ${s.critical ? 'critical' : ''}">
    <span class="step-num">Step ${s.step}</span> — <strong>${s.title}</strong> ${s.critical ? '<span class="badge badge-critical">CRITICAL</span>' : ''}
    <div style="color:#475569; margin-top:0.25rem;">${s.description}</div>
    <div style="color:#94a3b8; font-size:0.85rem;">Phase: ${s.phase} &bull; Duration: ${s.duration}</div>
  </div>
`).join('')}
` : '<p>Installation steps not available</p>'}

<!-- SECTION 7: Landscaping -->
${landscaping.elements ? `
<h2 class="page-break">7. Landscaping Integration</h2>
${landscaping.design_philosophy ? `<p><strong>Approach:</strong> ${landscaping.design_philosophy.approach}</p>` : ''}
${landscaping.elements.map(el => `
  <h3>${el.label}</h3>
  <p>${el.description}</p>
  ${el.plants ? `<div style="margin:0.5rem 0;">${el.plants.map(p => `<span class="plant-card">🌱 ${p.name || p}</span>`).join(' ')}</div>` : ''}
  ${el.installation_summary ? `<p><strong>Installation:</strong> ${el.installation_summary}</p>` : ''}
`).join('')}

${landscaping.plant_list ? `
<h3>Complete Plant List</h3>
<table>
  <tr><th>Plant</th><th>Botanical Name</th><th>Type</th><th>Height</th><th>Notes</th></tr>
  ${landscaping.plant_list.map(p => `<tr><td>${p.name}</td><td><em>${p.botanical || ''}</em></td><td>${p.type}</td><td>${p.height || ''}</td><td>${p.notes || ''}</td></tr>`).join('')}
</table>
` : ''}

${landscaping.maintenance_schedule ? `
<h3>Maintenance Schedule</h3>
<table>
  <tr><th>Frequency</th><th>Tasks</th></tr>
  <tr><td>Monthly</td><td><ul>${landscaping.maintenance_schedule.monthly.map(t => `<li>${t}</li>`).join('')}</ul></td></tr>
  <tr><td>Quarterly</td><td><ul>${landscaping.maintenance_schedule.quarterly.map(t => `<li>${t}</li>`).join('')}</ul></td></tr>
  <tr><td>Annually</td><td><ul>${landscaping.maintenance_schedule.annually.map(t => `<li>${t}</li>`).join('')}</ul></td></tr>
  <tr><td>After Major Storms</td><td><ul>${landscaping.maintenance_schedule.after_major_storms.map(t => `<li>${t}</li>`).join('')}</ul></td></tr>
</table>
` : ''}
` : ''}

<!-- SECTION 8: Disclaimers -->
<h2>8. Important Notes & Disclaimers</h2>
<div class="warning">
  <strong>⚠️ Before Starting Any Work:</strong>
  <ul style="margin-top:0.5rem;">
    <li><strong>Call 811</strong> to locate underground utilities — this is required by law</li>
    <li>Check with your local building department for required <strong>permits</strong></li>
    <li>Verify this plan complies with local <strong>stormwater ordinances</strong></li>
    <li>Ensure drainage does NOT direct water onto <strong>neighboring properties</strong></li>
    <li>For commercial properties or complex sites, have this plan reviewed by a <strong>licensed engineer</strong></li>
  </ul>
</div>
<p style="font-size:0.85rem; color:#64748b; margin-top:1rem;">
  This drainage plan is generated as a planning tool and professional guidance resource. While based on 
  established engineering principles (Rational Method, Manning's Equation, IRC/IBC standards), site-specific 
  conditions may vary. For critical applications, consult a licensed civil engineer or landscape architect. 
  Cost estimates are based on national averages and may vary by region.
</p>

<div class="footer">
  <div>🌧️ DrainagePlanner Pro — Expert Yard Drainage Planning System</div>
  <div>Construction Manager &bull; Land Surveyor &bull; Landscaping Specialist</div>
  <div style="margin-top:0.3rem;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
</div>

</body>
</html>`;
  }

  static generateSummary({ project, plan, elements }) {
    return {
      project_name: project.name,
      address: project.address,
      plan_name: plan.plan_name,
      plan_type: plan.plan_type,
      status: plan.status,
      element_count: elements.length,
      element_types: [...new Set(elements.map(e => e.element_type))],
      created: plan.created_at,
      updated: plan.updated_at
    };
  }
}

module.exports = ReportGenerator;
