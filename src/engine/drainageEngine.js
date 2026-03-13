/**
 * DrainageEngine — Core drainage analysis and plan generation
 * 
 * Combines construction management best practices with hydrology engineering:
 * - Rational Method runoff calculations (Q = CiA)
 * - Manning's equation for pipe/channel sizing
 * - SCS Curve Number method for complex sites
 * - Pipe sizing per IPC/UPC standards
 * - Grading recommendations per OSHA/IRC
 * - French drain, catch basin, channel drain, and swale design
 */

class DrainageEngine {

  // ─── RAINFALL & RUNOFF ──────────────────────────────────────────────

  /**
   * Rational Method: Q = C × i × A
   * Q = peak runoff (cubic feet per second)
   * C = runoff coefficient
   * i = rainfall intensity (in/hr)
   * A = drainage area (acres)
   */
  static calculateRunoff({ area_sqft, soil_type, rainfall_inches, duration_hours, return_period_years, impervious_area_sqft }) {
    const area_acres = area_sqft / 43560;
    const impervious_acres = (impervious_area_sqft || 0) / 43560;
    const pervious_acres = area_acres - impervious_acres;

    // Runoff coefficients by soil type and surface
    const soilCoefficients = this.getRunoffCoefficient(soil_type);
    const imperviousC = 0.95;

    // Weighted runoff coefficient
    const weightedC = area_acres > 0
      ? ((pervious_acres * soilCoefficients.lawn) + (impervious_acres * imperviousC)) / area_acres
      : soilCoefficients.lawn;

    // Rainfall intensity (in/hr) — simplified IDF curve
    const intensity = this.rainfallIntensity(rainfall_inches, duration_hours, return_period_years);

    // Peak runoff rate (cfs)
    const Q_cfs = weightedC * intensity * area_acres;
    const Q_gpm = Q_cfs * 448.831; // Convert to gallons per minute

    // Total volume
    const total_volume_cf = rainfall_inches / 12 * area_sqft * weightedC;
    const total_volume_gallons = total_volume_cf * 7.48052;

    // Time of concentration (Kirpich formula simplified)
    const avg_slope = 0.02; // Default 2% slope
    const flow_length_ft = Math.sqrt(area_sqft);
    const tc_minutes = 0.0078 * Math.pow(flow_length_ft, 0.77) * Math.pow(avg_slope, -0.385);

    return {
      input: { area_sqft, area_acres, soil_type, rainfall_inches, duration_hours, return_period_years, impervious_area_sqft },
      runoff_coefficient: Math.round(weightedC * 1000) / 1000,
      rainfall_intensity_in_hr: Math.round(intensity * 100) / 100,
      peak_flow_cfs: Math.round(Q_cfs * 1000) / 1000,
      peak_flow_gpm: Math.round(Q_gpm * 10) / 10,
      total_volume_cf: Math.round(total_volume_cf * 10) / 10,
      total_volume_gallons: Math.round(total_volume_gallons),
      time_of_concentration_min: Math.round(tc_minutes * 10) / 10,
      risk_level: this.assessFloodRisk(Q_gpm, area_sqft),
      recommendations: this.getRunoffRecommendations(Q_gpm, total_volume_gallons, area_sqft, soil_type)
    };
  }

  static rainfallIntensity(rainfall_in, duration_hr, return_period) {
    // Simplified IDF: i = a / (tc + b) with adjustments for return period
    const base_intensity = rainfall_in / duration_hr;
    const return_factor = Math.log(return_period) / Math.log(10) * 0.5 + 0.5;
    return base_intensity * return_factor;
  }

  static getRunoffCoefficient(soilType) {
    const coefficients = {
      'clay': { lawn: 0.35, garden: 0.30, forest: 0.25, bare: 0.50 },
      'heavy_clay': { lawn: 0.40, garden: 0.35, forest: 0.30, bare: 0.60 },
      'silty_clay': { lawn: 0.35, garden: 0.30, forest: 0.25, bare: 0.50 },
      'loam': { lawn: 0.22, garden: 0.18, forest: 0.15, bare: 0.40 },
      'sandy_loam': { lawn: 0.15, garden: 0.12, forest: 0.10, bare: 0.30 },
      'sand': { lawn: 0.10, garden: 0.08, forest: 0.05, bare: 0.20 },
      'gravel': { lawn: 0.08, garden: 0.06, forest: 0.04, bare: 0.15 },
      'silt': { lawn: 0.25, garden: 0.20, forest: 0.18, bare: 0.45 },
      'unknown': { lawn: 0.30, garden: 0.25, forest: 0.20, bare: 0.45 }
    };
    return coefficients[soilType] || coefficients['unknown'];
  }

  static assessFloodRisk(Q_gpm, area_sqft) {
    const intensity = Q_gpm / (area_sqft / 1000);
    if (intensity > 5) return { level: 'CRITICAL', score: 95, color: '#dc2626' };
    if (intensity > 3) return { level: 'HIGH', score: 75, color: '#ea580c' };
    if (intensity > 1.5) return { level: 'MODERATE', score: 50, color: '#ca8a04' };
    if (intensity > 0.5) return { level: 'LOW', score: 25, color: '#16a34a' };
    return { level: 'MINIMAL', score: 10, color: '#059669' };
  }

  static getRunoffRecommendations(Q_gpm, volume_gal, area_sqft, soilType) {
    const recs = [];
    if (Q_gpm > 50) {
      recs.push({
        priority: 'HIGH',
        type: 'catch_basin',
        description: 'Install catch basins at low points to capture high-volume runoff',
        reason: `Peak flow of ${Q_gpm.toFixed(1)} GPM requires active collection`
      });
    }
    if (Q_gpm > 20) {
      recs.push({
        priority: 'HIGH',
        type: 'french_drain',
        description: 'Install French drain system along foundation and low areas',
        reason: 'Significant runoff volume needs subsurface management'
      });
    }
    if (volume_gal > 500) {
      recs.push({
        priority: 'MEDIUM',
        type: 'rain_garden',
        description: 'Install rain garden(s) to absorb and filter large volumes',
        reason: `${volume_gal.toLocaleString()} gallons per event needs infiltration capacity`
      });
    }
    if (['clay', 'heavy_clay', 'silty_clay'].includes(soilType)) {
      recs.push({
        priority: 'HIGH',
        type: 'grading',
        description: 'Re-grade to ensure minimum 2% slope away from structures',
        reason: 'Clay soil has very low infiltration — surface drainage is critical'
      });
      recs.push({
        priority: 'MEDIUM',
        type: 'dry_well',
        description: 'Install dry wells with gravel fill to provide subsurface storage',
        reason: 'Clay soil needs supplemental infiltration capacity'
      });
    }
    if (area_sqft > 20000) {
      recs.push({
        priority: 'MEDIUM',
        type: 'swale',
        description: 'Create grassed swales to channel water across large property',
        reason: 'Large property benefits from surface conveyance channels'
      });
    }
    recs.push({
      priority: 'STANDARD',
      type: 'downspout_extension',
      description: 'Extend all downspouts minimum 6 feet from foundation',
      reason: 'Basic best practice for all properties'
    });
    recs.push({
      priority: 'STANDARD',
      type: 'grading_check',
      description: 'Verify all grades slope away from structures at minimum 6 inches in 10 feet (5%)',
      reason: 'IRC requirement for foundation protection'
    });
    return recs;
  }

  // ─── PIPE & CHANNEL SIZING ─────────────────────────────────────────

  /**
   * Manning's Equation: V = (1.49/n) × R^(2/3) × S^(1/2)
   * Q = V × A
   */
  static sizePipe(flow_cfs, slope_percent, material = 'corrugated_plastic') {
    const n = this.getManningsN(material);
    const slope = slope_percent / 100;

    // Try standard pipe diameters
    const standardDiameters = [4, 6, 8, 10, 12, 15, 18, 24]; // inches

    for (const diameter_in of standardDiameters) {
      const radius_ft = (diameter_in / 2) / 12;
      const area_ft2 = Math.PI * radius_ft * radius_ft;
      const wetted_perimeter = Math.PI * 2 * radius_ft;
      const hydraulic_radius = area_ft2 / wetted_perimeter;

      const velocity = (1.49 / n) * Math.pow(hydraulic_radius, 2 / 3) * Math.pow(slope, 0.5);
      const capacity_cfs = velocity * area_ft2;

      if (capacity_cfs >= flow_cfs) {
        return {
          diameter_in,
          material,
          velocity_fps: Math.round(velocity * 100) / 100,
          capacity_cfs: Math.round(capacity_cfs * 1000) / 1000,
          capacity_gpm: Math.round(capacity_cfs * 448.831 * 10) / 10,
          required_flow_cfs: flow_cfs,
          utilization_percent: Math.round((flow_cfs / capacity_cfs) * 100),
          slope_percent,
          mannings_n: n,
          adequate: true
        };
      }
    }

    // If no standard size works, return largest with warning
    const largest = standardDiameters[standardDiameters.length - 1];
    return {
      diameter_in: largest,
      material,
      warning: 'Largest standard pipe may be insufficient — consider parallel pipes or open channel',
      required_flow_cfs: flow_cfs,
      adequate: false
    };
  }

  static getManningsN(material) {
    const values = {
      'corrugated_plastic': 0.015,
      'smooth_plastic_pvc': 0.010,
      'smooth_plastic_hdpe': 0.011,
      'concrete': 0.013,
      'corrugated_metal': 0.024,
      'clay': 0.013,
      'cast_iron': 0.012,
      'natural_channel': 0.035,
      'grassed_swale': 0.030,
      'riprap': 0.040
    };
    return values[material] || 0.015;
  }

  static sizeSwale(flow_cfs, slope_percent, soil_type = 'loam') {
    const n = 0.030; // Grassed waterway
    const slope = slope_percent / 100;
    const sideSlopeRatio = 3; // 3:1 side slopes (standard)

    // Try different depths
    for (let depth_ft = 0.5; depth_ft <= 3; depth_ft += 0.25) {
      const bottom_width_ft = 2;
      const top_width_ft = bottom_width_ft + 2 * sideSlopeRatio * depth_ft;
      const area_ft2 = (bottom_width_ft + top_width_ft) / 2 * depth_ft;
      const wetted_perimeter = bottom_width_ft + 2 * depth_ft * Math.sqrt(1 + sideSlopeRatio * sideSlopeRatio);
      const hydraulic_radius = area_ft2 / wetted_perimeter;

      const velocity = (1.49 / n) * Math.pow(hydraulic_radius, 2 / 3) * Math.pow(slope, 0.5);
      const capacity = velocity * area_ft2;

      if (capacity >= flow_cfs && velocity < 5) { // Keep velocity under 5 fps to prevent erosion
        return {
          depth_ft: Math.round(depth_ft * 100) / 100,
          depth_in: Math.round(depth_ft * 12),
          bottom_width_ft,
          top_width_ft: Math.round(top_width_ft * 10) / 10,
          side_slope: `${sideSlopeRatio}:1`,
          velocity_fps: Math.round(velocity * 100) / 100,
          capacity_cfs: Math.round(capacity * 1000) / 1000,
          erosion_risk: velocity > 3 ? 'HIGH' : velocity > 2 ? 'MODERATE' : 'LOW',
          lining_needed: velocity > 3,
          adequate: true
        };
      }
    }

    return { adequate: false, warning: 'Consider engineered channel or pipe system' };
  }

  // ─── FRENCH DRAIN DESIGN ───────────────────────────────────────────

  static designFrenchDrain({ length_ft, flow_cfs, slope_percent, soil_type, depth_ft }) {
    const trenchDepth = depth_ft || 2;
    const trenchWidth_in = flow_cfs > 0.1 ? 18 : 12;
    const pipeDiameter = flow_cfs > 0.5 ? 6 : 4;
    const gravelType = 'washed #57 stone';
    const gravelDepth_in = trenchWidth_in - pipeDiameter - 2; // Leave room for pipe + fabric

    // Storage capacity of gravel trench (40% void ratio)
    const trench_volume_cf = (trenchWidth_in / 12) * trenchDepth * length_ft;
    const storage_cf = trench_volume_cf * 0.40;
    const storage_gallons = storage_cf * 7.48052;

    // Pipe capacity via Manning's
    const pipeSpec = this.sizePipe(flow_cfs, slope_percent, 'corrugated_plastic');

    return {
      type: 'french_drain',
      length_ft,
      trench_depth_ft: trenchDepth,
      trench_depth_in: trenchDepth * 12,
      trench_width_in: trenchWidth_in,
      pipe_diameter_in: pipeDiameter,
      pipe_type: 'Perforated corrugated HDPE',
      gravel_type: gravelType,
      slope_percent,
      storage_capacity_cf: Math.round(storage_cf * 10) / 10,
      storage_capacity_gallons: Math.round(storage_gallons),
      pipe_capacity: pipeSpec,
      filter_fabric: 'Non-woven geotextile, minimum 4 oz/yd²',
      materials: {
        pipe_ft: Math.ceil(length_ft * 1.05), // 5% waste
        gravel_cubic_yards: Math.round((trench_volume_cf - (Math.PI * Math.pow(pipeDiameter / 24, 2) * length_ft)) / 27 * 10) / 10,
        filter_fabric_sqft: Math.ceil(length_ft * (2 * trenchDepth + trenchWidth_in / 12) * 1.1),
        fittings: this.estimateFrenchDrainFittings(length_ft)
      },
      installation_notes: [
        `Dig trench ${trenchWidth_in}" wide × ${trenchDepth * 12}" deep`,
        `Maintain minimum ${slope_percent}% grade toward outlet`,
        'Line trench with non-woven geotextile fabric, overlapping edges 12"',
        `Add 2" bed of ${gravelType} at bottom of trench`,
        `Place ${pipeDiameter}" perforated pipe with holes DOWN`,
        `Backfill with ${gravelType} to within 4" of surface`,
        'Fold fabric over top of gravel, overlap 12"',
        'Backfill remaining 4" with topsoil and seed/sod'
      ]
    };
  }

  static estimateFrenchDrainFittings(length_ft) {
    return {
      couplings: Math.ceil(length_ft / 10),
      end_caps: 1,
      outlet_adapters: 1,
      pop_up_emitters: length_ft > 50 ? 2 : 1,
      cleanout_ports: Math.max(1, Math.ceil(length_ft / 50))
    };
  }

  // ─── CATCH BASIN DESIGN ────────────────────────────────────────────

  static designCatchBasin({ drainage_area_sqft, flow_cfs, location_type }) {
    let basin_size, grate_type;

    if (flow_cfs > 1.0) {
      basin_size = { width_in: 24, depth_in: 36, type: 'large' };
      grate_type = 'Heavy-duty cast iron, ADA compliant';
    } else if (flow_cfs > 0.3) {
      basin_size = { width_in: 18, depth_in: 24, type: 'medium' };
      grate_type = 'Standard cast iron or plastic';
    } else {
      basin_size = { width_in: 12, depth_in: 18, type: 'small' };
      grate_type = 'Standard plastic atrium grate';
    }

    return {
      type: 'catch_basin',
      basin_size,
      grate_type,
      sump_depth_in: 6,
      outlet_pipe_in: flow_cfs > 0.5 ? 6 : 4,
      drainage_area_sqft,
      flow_capacity_cfs: flow_cfs,
      installation_notes: [
        `Excavate hole ${basin_size.width_in + 12}" × ${basin_size.width_in + 12}" × ${basin_size.depth_in + 6}" deep`,
        'Place 4" gravel base, compact',
        `Set ${basin_size.type} catch basin, level with grade`,
        'Connect outlet pipe with proper slope',
        'Backfill around basin with gravel, then soil',
        `Install ${grate_type} grate flush with final grade`
      ]
    };
  }

  // ─── FULL SITE ANALYSIS ────────────────────────────────────────────

  static fullSiteAnalysis({ project, surveyPoints, boundaries, structures, topography, soil }) {
    const area_sqft = project.property_area_sqft || this.estimateAreaFromBoundary(boundaries);

    // Calculate impervious area from structures
    const impervious_sqft = structures.reduce((sum, s) => {
      if (['house', 'garage', 'shed', 'driveway', 'patio', 'sidewalk'].includes(s.structure_type)) {
        return sum + (s.geometry.area_sqft || 0);
      }
      return sum;
    }, 0);

    const impervious_ratio = area_sqft > 0 ? impervious_sqft / area_sqft : 0;

    // Run multiple storm scenarios
    const scenarios = [
      { name: '1-Year Storm (Minor)', rainfall_inches: (project.avg_annual_rainfall_in || 40) / 52, duration_hours: 1, return_period_years: 1 },
      { name: '10-Year Storm (Design)', rainfall_inches: (project.avg_annual_rainfall_in || 40) / 12 * 1.5, duration_hours: 1, return_period_years: 10 },
      { name: '25-Year Storm (Major)', rainfall_inches: (project.avg_annual_rainfall_in || 40) / 12 * 2.5, duration_hours: 2, return_period_years: 25 },
      { name: '100-Year Storm (Extreme)', rainfall_inches: (project.avg_annual_rainfall_in || 40) / 12 * 4, duration_hours: 6, return_period_years: 100 }
    ];

    const stormAnalysis = scenarios.map(s => ({
      scenario: s.name,
      ...this.calculateRunoff({
        area_sqft,
        soil_type: project.soil_type,
        rainfall_inches: s.rainfall_inches,
        duration_hours: s.duration_hours,
        return_period_years: s.return_period_years,
        impervious_area_sqft: impervious_sqft
      })
    }));

    // Problem area identification
    const problemAreas = this.identifyProblemAreas(surveyPoints, structures, topography, soil);

    // Overall risk assessment
    const designStorm = stormAnalysis[1]; // 10-year storm
    const overallRisk = this.calculateOverallRisk({
      peak_flow_gpm: designStorm.peak_flow_gpm,
      area_sqft,
      impervious_ratio,
      soil_type: project.soil_type,
      min_slope: topography?.min_slope_percent || 0,
      problem_count: problemAreas.length
    });

    return {
      site_summary: {
        total_area_sqft: area_sqft,
        total_area_acres: Math.round(area_sqft / 43560 * 100) / 100,
        impervious_area_sqft: impervious_sqft,
        impervious_ratio: Math.round(impervious_ratio * 100),
        pervious_area_sqft: area_sqft - impervious_sqft,
        soil_type: project.soil_type,
        climate_zone: project.climate_zone,
        avg_rainfall_in: project.avg_annual_rainfall_in
      },
      storm_analysis: stormAnalysis,
      problem_areas: problemAreas,
      overall_risk: overallRisk,
      design_standard: '10-Year Storm Event (IRC/IBC Standard)'
    };
  }

  static identifyProblemAreas(surveyPoints, structures, topography, soil) {
    const problems = [];

    // Check for low spots (potential ponding)
    if (surveyPoints.length >= 3) {
      const elevations = surveyPoints.filter(p => p.elevation_ft != null).sort((a, b) => a.elevation_ft - b.elevation_ft);
      if (elevations.length >= 3) {
        const lowest = elevations[0];
        const median = elevations[Math.floor(elevations.length / 2)];
        if (median.elevation_ft - lowest.elevation_ft < 0.5) {
          problems.push({
            type: 'ponding_risk',
            severity: 'HIGH',
            location: { lat: lowest.latitude, lng: lowest.longitude, elevation: lowest.elevation_ft },
            description: 'Low area with minimal grade differential — high ponding risk',
            recommendation: 'Install catch basin or re-grade to create positive drainage'
          });
        }
      }
    }

    // Check structure proximity to low points
    for (const structure of structures) {
      if (['house', 'garage'].includes(structure.structure_type)) {
        problems.push({
          type: 'foundation_protection',
          severity: 'HIGH',
          location: structure.geometry,
          description: `${structure.label || structure.structure_type} foundation requires minimum 5% grade away for 10 feet`,
          recommendation: 'Verify and establish proper grading, extend downspouts, consider French drain along foundation'
        });
      }
    }

    // Soil-based problems
    if (soil && ['clay', 'heavy_clay', 'silty_clay'].includes(soil.type)) {
      problems.push({
        type: 'poor_infiltration',
        severity: 'MODERATE',
        description: `${soil.type} soil has very low infiltration rate (${soil.infiltration_rate_in_hr || '< 0.2'} in/hr)`,
        recommendation: 'Prioritize surface drainage and consider soil amendments in garden areas'
      });
    }

    return problems;
  }

  static calculateOverallRisk({ peak_flow_gpm, area_sqft, impervious_ratio, soil_type, min_slope, problem_count }) {
    let score = 0;

    // Flow intensity scoring
    const flow_per_1000sf = peak_flow_gpm / (area_sqft / 1000);
    if (flow_per_1000sf > 5) score += 30;
    else if (flow_per_1000sf > 3) score += 20;
    else if (flow_per_1000sf > 1) score += 10;

    // Impervious ratio
    if (impervious_ratio > 0.6) score += 25;
    else if (impervious_ratio > 0.4) score += 15;
    else if (impervious_ratio > 0.2) score += 8;

    // Soil type
    if (['clay', 'heavy_clay'].includes(soil_type)) score += 20;
    else if (['silty_clay', 'silt'].includes(soil_type)) score += 12;
    else if (soil_type === 'loam') score += 5;

    // Slope
    if (min_slope < 1) score += 15;
    else if (min_slope < 2) score += 8;

    // Problem areas
    score += Math.min(problem_count * 5, 20);

    let level, color;
    if (score >= 70) { level = 'CRITICAL'; color = '#dc2626'; }
    else if (score >= 50) { level = 'HIGH'; color = '#ea580c'; }
    else if (score >= 30) { level = 'MODERATE'; color = '#ca8a04'; }
    else if (score >= 15) { level = 'LOW'; color = '#16a34a'; }
    else { level = 'MINIMAL'; color = '#059669'; }

    return { score: Math.min(score, 100), level, color };
  }

  static estimateAreaFromBoundary(boundaries) {
    if (!boundaries || boundaries.length === 0) return 10000; // Default 1/4 acre
    const b = boundaries[0];
    return b.area_sqft || 10000;
  }

  // ─── PLAN GENERATION ───────────────────────────────────────────────

  static generateDrainagePlan(siteData, preferences = {}) {
    const analysis = this.fullSiteAnalysis(siteData);
    const elements = [];
    const designStorm = analysis.storm_analysis[1]; // 10-year design storm

    // 1. Foundation protection — always
    for (const structure of siteData.structures) {
      if (['house', 'garage'].includes(structure.structure_type)) {
        // French drain along foundation
        const perimeter = structure.geometry.perimeter_ft || 100;
        const frenchDrain = this.designFrenchDrain({
          length_ft: perimeter,
          flow_cfs: designStorm.peak_flow_cfs * 0.3,
          slope_percent: preferences.min_slope || 1,
          soil_type: siteData.project.soil_type,
          depth_ft: 2
        });

        elements.push({
          type: 'french_drain',
          label: `Foundation Drain — ${structure.label || structure.structure_type}`,
          geometry: { follows_structure: structure.id, offset_ft: 2 },
          specifications: frenchDrain,
          slope_percent: preferences.min_slope || 1,
          depth_in: 24,
          width_in: frenchDrain.trench_width_in,
          material: 'Perforated corrugated HDPE',
          notes: 'Install 2ft from foundation wall, route to daylight or dry well'
        });

        // Downspout extensions
        const downspouts = Math.ceil(perimeter / 25); // Estimate 1 per 25ft
        elements.push({
          type: 'downspout_extension',
          label: `Downspout Extensions — ${structure.label || structure.structure_type}`,
          geometry: { around_structure: structure.id, count: downspouts },
          specifications: {
            type: 'underground_extension',
            pipe_diameter_in: 4,
            min_length_ft: 10,
            material: 'Solid corrugated HDPE or SDR-35 PVC',
            outlet: 'Pop-up emitter or daylight to swale',
            count: downspouts
          },
          slope_percent: 2,
          depth_in: 12,
          width_in: 4,
          material: 'Solid HDPE/PVC',
          notes: `${downspouts} downspouts, each extended minimum 10ft from foundation`
        });
      }
    }

    // 2. Catch basins at low points
    for (const problem of analysis.problem_areas) {
      if (problem.type === 'ponding_risk') {
        const catchBasin = this.designCatchBasin({
          drainage_area_sqft: siteData.project.property_area_sqft / 4,
          flow_cfs: designStorm.peak_flow_cfs * 0.25,
          location_type: 'yard'
        });

        elements.push({
          type: 'catch_basin',
          label: `Catch Basin — Low Point`,
          geometry: { point: problem.location },
          specifications: catchBasin,
          slope_percent: 0,
          depth_in: catchBasin.basin_size.depth_in,
          width_in: catchBasin.basin_size.width_in,
          material: catchBasin.basin_size.type + ' HDPE basin',
          notes: 'Place at identified low point, connect to outlet pipe'
        });
      }
    }

    // 3. Main collector pipe
    const mainPipe = this.sizePipe(designStorm.peak_flow_cfs, preferences.min_slope || 1, 'corrugated_plastic');
    elements.push({
      type: 'collector_pipe',
      label: 'Main Collector Line',
      geometry: { route: 'from_high_to_low', follow_grade: true },
      specifications: mainPipe,
      slope_percent: preferences.min_slope || 1,
      depth_in: 18,
      width_in: mainPipe.diameter_in,
      material: `${mainPipe.diameter_in}" solid corrugated HDPE`,
      notes: 'Connects all catch basins and French drains to outlet point'
    });

    // 4. Surface grading
    elements.push({
      type: 'grading',
      label: 'Surface Grading',
      geometry: { area: 'full_property' },
      specifications: {
        min_slope_from_structures: '5% (6" in 10ft) — IRC R401.3',
        general_yard_slope: '2% minimum toward collection points',
        swale_slope: '1-2% along bottom of swale',
        notes: 'Grade all surfaces to direct water to collection points and away from structures'
      },
      slope_percent: 2,
      depth_in: null,
      width_in: null,
      material: 'Topsoil and compacted fill',
      notes: 'Re-grade all areas to ensure positive drainage'
    });

    // 5. Swale if property is large enough
    if ((siteData.project.property_area_sqft || 10000) > 8000) {
      const swale = this.sizeSwale(designStorm.peak_flow_cfs * 0.5, preferences.min_slope || 1.5, siteData.project.soil_type);
      if (swale.adequate) {
        elements.push({
          type: 'swale',
          label: 'Drainage Swale',
          geometry: { route: 'along_property_low_side' },
          specifications: swale,
          slope_percent: preferences.min_slope || 1.5,
          depth_in: swale.depth_in,
          width_in: swale.top_width_ft * 12,
          material: 'Graded earth with sod/seed',
          notes: 'Grade broad, shallow channel along natural low path'
        });
      }
    }

    // 6. Outlet
    elements.push({
      type: 'outlet',
      label: 'System Outlet',
      geometry: { at: 'lowest_property_edge' },
      specifications: {
        type: analysis.overall_risk.score > 50 ? 'daylight_with_riprap' : 'pop_up_emitter',
        outlet_pipe_in: mainPipe.diameter_in,
        erosion_protection: 'Riprap apron 3ft × 3ft × 6" deep, #57 stone',
        discharge_to: 'Natural drainage way, storm sewer, or street'
      },
      slope_percent: null,
      depth_in: null,
      width_in: mainPipe.diameter_in,
      material: 'HDPE outlet with riprap',
      notes: 'Ensure outlet does not direct water toward neighboring properties'
    });

    return {
      elements,
      design_storm: designStorm,
      analysis,
      summary: {
        total_elements: elements.length,
        element_types: [...new Set(elements.map(e => e.type))],
        design_standard: 'IRC/IBC 10-Year Storm',
        risk_before: analysis.overall_risk,
        estimated_risk_after: {
          score: Math.max(5, analysis.overall_risk.score - 50),
          level: analysis.overall_risk.score > 70 ? 'LOW' : 'MINIMAL',
          color: '#16a34a'
        }
      }
    };
  }

  // ─── MATERIALS & COST ──────────────────────────────────────────────

  static calculateMaterials(plan) {
    const materials = [];

    for (const element of plan.elements) {
      switch (element.type) {
        case 'french_drain':
          if (element.specifications.materials) {
            materials.push({
              category: 'French Drain',
              element: element.label,
              items: [
                { name: `${element.specifications.pipe_diameter_in}" Perforated HDPE pipe`, quantity: element.specifications.materials.pipe_ft, unit: 'linear ft' },
                { name: '#57 Washed stone', quantity: element.specifications.materials.gravel_cubic_yards, unit: 'cubic yards' },
                { name: 'Non-woven geotextile fabric', quantity: element.specifications.materials.filter_fabric_sqft, unit: 'sq ft' },
                { name: 'Pipe couplings', quantity: element.specifications.materials.fittings.couplings, unit: 'each' },
                { name: 'End caps', quantity: element.specifications.materials.fittings.end_caps, unit: 'each' },
                { name: 'Pop-up emitters', quantity: element.specifications.materials.fittings.pop_up_emitters, unit: 'each' },
                { name: 'Cleanout ports', quantity: element.specifications.materials.fittings.cleanout_ports, unit: 'each' }
              ]
            });
          }
          break;

        case 'catch_basin':
          materials.push({
            category: 'Catch Basin',
            element: element.label,
            items: [
              { name: `${element.specifications.basin_size.type} catch basin`, quantity: 1, unit: 'each' },
              { name: element.specifications.grate_type, quantity: 1, unit: 'each' },
              { name: `${element.specifications.outlet_pipe_in}" solid HDPE pipe`, quantity: 20, unit: 'linear ft' },
              { name: '#57 Washed stone (basin bedding)', quantity: 0.5, unit: 'cubic yards' }
            ]
          });
          break;

        case 'downspout_extension':
          const count = element.specifications.count || 4;
          materials.push({
            category: 'Downspout Extensions',
            element: element.label,
            items: [
              { name: `4" Solid HDPE/PVC pipe`, quantity: count * 12, unit: 'linear ft' },
              { name: 'Downspout adapters (3×4 to 4" round)', quantity: count, unit: 'each' },
              { name: 'Pop-up emitters', quantity: count, unit: 'each' },
              { name: '4" PVC elbows', quantity: count * 2, unit: 'each' }
            ]
          });
          break;

        case 'collector_pipe':
          const length = 50; // Estimated
          materials.push({
            category: 'Collector Pipe',
            element: element.label,
            items: [
              { name: `${element.specifications.diameter_in}" Solid HDPE pipe`, quantity: length, unit: 'linear ft' },
              { name: 'Pipe couplings', quantity: Math.ceil(length / 10), unit: 'each' },
              { name: 'Wye fittings', quantity: 3, unit: 'each' }
            ]
          });
          break;

        case 'swale':
          if (element.specifications.adequate) {
            materials.push({
              category: 'Drainage Swale',
              element: element.label,
              items: [
                { name: 'Topsoil (for grading)', quantity: 3, unit: 'cubic yards' },
                { name: 'Grass seed (erosion control mix)', quantity: 10, unit: 'lbs' },
                { name: 'Straw erosion blanket', quantity: 100, unit: 'sq ft' }
              ]
            });
          }
          break;

        case 'outlet':
          materials.push({
            category: 'Outlet',
            element: element.label,
            items: [
              { name: 'Outlet adapter', quantity: 1, unit: 'each' },
              { name: '#57 Riprap stone', quantity: 0.5, unit: 'cubic yards' },
              { name: 'Geotextile fabric', quantity: 15, unit: 'sq ft' }
            ]
          });
          break;

        case 'grading':
          materials.push({
            category: 'Grading',
            element: element.label,
            items: [
              { name: 'Fill dirt / topsoil', quantity: 5, unit: 'cubic yards' },
              { name: 'Sod or grass seed', quantity: 500, unit: 'sq ft' }
            ]
          });
          break;
      }
    }

    return materials;
  }

  static estimateCosts(materials, project) {
    const unitCosts = {
      'linear ft': { 'pipe': 3.50, 'fabric': 0.50, default: 3.00 },
      'cubic yards': { 'stone': 55, 'topsoil': 35, 'dirt': 25, default: 45 },
      'sq ft': { 'fabric': 0.45, 'sod': 0.80, 'blanket': 0.60, default: 0.60 },
      'each': { 'basin': 85, 'emitter': 12, 'coupling': 4, 'adapter': 8, 'cap': 5, 'elbow': 4, 'cleanout': 15, 'wye': 12, 'grate': 35, default: 15 },
      'lbs': { default: 5 }
    };

    let materialTotal = 0;
    const costBreakdown = [];

    for (const group of materials) {
      let groupTotal = 0;
      const itemCosts = [];

      for (const item of group.items) {
        let unitCost = unitCosts[item.unit]?.default || 10;
        // Try to match specific cost
        for (const [keyword, cost] of Object.entries(unitCosts[item.unit] || {})) {
          if (keyword !== 'default' && item.name.toLowerCase().includes(keyword)) {
            unitCost = cost;
            break;
          }
        }
        const totalCost = item.quantity * unitCost;
        groupTotal += totalCost;
        itemCosts.push({ ...item, unit_cost: unitCost, total_cost: Math.round(totalCost * 100) / 100 });
      }

      materialTotal += groupTotal;
      costBreakdown.push({
        category: group.category,
        element: group.element,
        items: itemCosts,
        subtotal: Math.round(groupTotal * 100) / 100
      });
    }

    // Labor estimate (typically 1.5-2.5x materials for drainage work)
    const laborMultiplier = 2.0;
    const laborTotal = materialTotal * laborMultiplier;

    // Equipment rental
    const equipmentTotal = materialTotal > 500 ? 350 : 150; // Mini excavator rental vs hand tools

    const grandTotal = materialTotal + laborTotal + equipmentTotal;

    return {
      material_cost: Math.round(materialTotal * 100) / 100,
      labor_cost: Math.round(laborTotal * 100) / 100,
      equipment_cost: equipmentTotal,
      subtotal: Math.round(grandTotal * 100) / 100,
      contingency_percent: 15,
      contingency_amount: Math.round(grandTotal * 0.15 * 100) / 100,
      grand_total: Math.round(grandTotal * 1.15 * 100) / 100,
      cost_breakdown: costBreakdown,
      notes: [
        'Costs are estimates based on national averages — local pricing may vary',
        'Labor assumes professional installation at $45-65/hr',
        'Equipment includes mini excavator rental if needed',
        '15% contingency for unforeseen conditions',
        'Permit fees not included — check local requirements',
        'DIY savings: labor portion can be reduced 50-100%'
      ],
      diy_estimate: Math.round((materialTotal + equipmentTotal) * 1.15 * 100) / 100
    };
  }

  static generateInstallationSteps(plan, landscaping) {
    const steps = [];
    let stepNum = 1;

    // Phase 1: Preparation
    steps.push({
      phase: 'Preparation',
      step: stepNum++,
      title: 'Call 811 — Locate Underground Utilities',
      description: 'Contact your local 811 service at least 48 hours before digging. Mark all utility locations. This is REQUIRED BY LAW.',
      duration: '2-3 business days',
      critical: true
    });
    steps.push({
      phase: 'Preparation',
      step: stepNum++,
      title: 'Obtain Permits',
      description: 'Check with local building department for grading/drainage permits. Some jurisdictions require permits for any work affecting stormwater flow.',
      duration: '1-2 weeks',
      critical: true
    });
    steps.push({
      phase: 'Preparation',
      step: stepNum++,
      title: 'Mark Layout & Establish Grade Stakes',
      description: 'Use string lines and stakes to mark all trench locations, catch basin positions, and outlet points. Verify slopes with a laser level or transit.',
      duration: '2-4 hours',
      critical: false
    });

    // Phase 2: Excavation
    steps.push({
      phase: 'Excavation',
      step: stepNum++,
      title: 'Strip & Stockpile Topsoil',
      description: 'Remove topsoil from trench areas and stockpile for backfill. Keep separate from subsoil.',
      duration: '2-4 hours',
      critical: false
    });

    for (const element of plan.elements) {
      if (element.type === 'french_drain') {
        steps.push({
          phase: 'Excavation',
          step: stepNum++,
          title: `Excavate French Drain Trench — ${element.label}`,
          description: `Dig trench ${element.width_in}" wide × ${element.depth_in}" deep. Maintain ${element.slope_percent}% grade. Verify with level every 10ft.`,
          duration: '4-8 hours',
          critical: true
        });
      }
      if (element.type === 'catch_basin') {
        steps.push({
          phase: 'Excavation',
          step: stepNum++,
          title: `Excavate Catch Basin Pit — ${element.label}`,
          description: `Dig pit ${element.specifications.basin_size.width_in + 12}" square × ${element.specifications.basin_size.depth_in + 6}" deep. Level bottom.`,
          duration: '1-2 hours',
          critical: false
        });
      }
    }

    // Phase 3: Installation
    steps.push({
      phase: 'Installation',
      step: stepNum++,
      title: 'Install Catch Basins & Set Elevations',
      description: 'Set catch basins on compacted gravel base. Verify rim elevation flush with planned finished grade. Connect outlet pipes.',
      duration: '2-3 hours',
      critical: true
    });
    steps.push({
      phase: 'Installation',
      step: stepNum++,
      title: 'Install French Drain System',
      description: 'Line trenches with fabric, add gravel bed, place perforated pipe (holes DOWN), backfill with gravel, wrap fabric over top.',
      duration: '4-8 hours',
      critical: true
    });
    steps.push({
      phase: 'Installation',
      step: stepNum++,
      title: 'Install Collector Pipes & Connect System',
      description: 'Lay solid collector pipe from catch basins and French drain outlets to system outlet. Maintain minimum 1% slope throughout.',
      duration: '3-5 hours',
      critical: true
    });
    steps.push({
      phase: 'Installation',
      step: stepNum++,
      title: 'Install Downspout Extensions',
      description: 'Connect underground extensions to each downspout. Route to pop-up emitters or tie into collector system.',
      duration: '2-4 hours',
      critical: false
    });
    steps.push({
      phase: 'Installation',
      step: stepNum++,
      title: 'Install System Outlet',
      description: 'Install outlet at lowest property point. Add riprap apron for erosion protection. Verify discharge direction.',
      duration: '1-2 hours',
      critical: true
    });

    // Phase 4: Grading & Restoration
    steps.push({
      phase: 'Grading & Restoration',
      step: stepNum++,
      title: 'Rough Grading',
      description: 'Grade all disturbed areas to establish proper drainage slopes. Minimum 5% away from structures, 2% across yard areas.',
      duration: '3-6 hours',
      critical: true
    });
    steps.push({
      phase: 'Grading & Restoration',
      step: stepNum++,
      title: 'Fine Grading & Swale Construction',
      description: 'Shape swales and fine-grade all surfaces. Compact fill. Verify all grades with level.',
      duration: '2-4 hours',
      critical: false
    });

    // Phase 5: Landscaping
    if (landscaping && landscaping.elements) {
      for (const lElement of landscaping.elements) {
        steps.push({
          phase: 'Landscaping',
          step: stepNum++,
          title: `Install ${lElement.label}`,
          description: lElement.installation_summary || lElement.description,
          duration: lElement.estimated_duration || '2-4 hours',
          critical: false
        });
      }
    }

    steps.push({
      phase: 'Landscaping',
      step: stepNum++,
      title: 'Seed/Sod & Mulch',
      description: 'Apply seed or sod to all disturbed areas. Mulch planting beds. Install erosion control blanket on slopes.',
      duration: '2-4 hours',
      critical: false
    });

    // Phase 6: Testing
    steps.push({
      phase: 'Testing & Verification',
      step: stepNum++,
      title: 'System Flow Test',
      description: 'Run water through each system component using a garden hose. Verify flow at all catch basins, French drains, and outlet. Check for leaks or backups.',
      duration: '1-2 hours',
      critical: true
    });
    steps.push({
      phase: 'Testing & Verification',
      step: stepNum++,
      title: 'Grade Verification',
      description: 'After first rain event, walk property and verify no ponding near structures. Check all grades and make adjustments as needed.',
      duration: '1 hour (after rain)',
      critical: true
    });

    return {
      total_steps: steps.length,
      estimated_total_duration: '2-4 days (professional) / 3-7 days (DIY)',
      phases: [...new Set(steps.map(s => s.phase))],
      steps
    };
  }
}

module.exports = DrainageEngine;
