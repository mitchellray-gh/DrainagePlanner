/**
 * SoilEngine — Soil Classification & Infiltration Analysis
 * 
 * Based on USDA soil classification and NRCS Hydrologic Soil Groups:
 * - Group A: Sand, loamy sand, sandy loam — high infiltration
 * - Group B: Silt loam, loam — moderate infiltration
 * - Group C: Sandy clay loam — slow infiltration
 * - Group D: Clay loam, silty clay, clay — very slow infiltration
 */

class SoilEngine {

  static SOIL_DATABASE = {
    sand: {
      usda_class: 'Sand',
      hydrologic_group: 'A',
      infiltration_rate_in_hr: 8.0,
      infiltration_range: '6.0 - 12.0 in/hr',
      permeability: 'Very High',
      runoff_potential: 'Low',
      water_holding_capacity: 'Very Low',
      compaction_risk: 'Low',
      shrink_swell: 'None',
      drainage_class: 'Excessively drained',
      description: 'Loose, single-grain structure. Water moves through very quickly.',
      drainage_implications: [
        'Surface drainage often adequate without subsurface systems',
        'Downspout extensions may be sufficient for foundation protection',
        'Dry wells work extremely well in sandy soil',
        'Erosion can be a concern on slopes — stabilize with vegetation'
      ],
      amendment_recommendations: [
        'Add organic matter to improve water retention in garden areas',
        'Compost or peat moss at 3-4" depth tilled into top 8"'
      ],
      curve_number: { lawn_good: 39, lawn_fair: 49, woods_good: 25 }
    },
    sandy_loam: {
      usda_class: 'Sandy Loam',
      hydrologic_group: 'A',
      infiltration_rate_in_hr: 4.0,
      infiltration_range: '2.0 - 6.0 in/hr',
      permeability: 'High',
      runoff_potential: 'Low to Moderate',
      water_holding_capacity: 'Low to Moderate',
      compaction_risk: 'Low',
      shrink_swell: 'None to Low',
      drainage_class: 'Well drained',
      description: 'Good balance of drainage and structure. Ideal for most construction and landscaping.',
      drainage_implications: [
        'Generally good natural drainage',
        'French drains highly effective',
        'Rain gardens work very well',
        'Standard grading practices usually sufficient'
      ],
      amendment_recommendations: [
        'Add compost to improve structure in planting areas',
        'Mulch beds to retain moisture'
      ],
      curve_number: { lawn_good: 39, lawn_fair: 49, woods_good: 25 }
    },
    loam: {
      usda_class: 'Loam',
      hydrologic_group: 'B',
      infiltration_rate_in_hr: 1.5,
      infiltration_range: '0.5 - 2.0 in/hr',
      permeability: 'Moderate',
      runoff_potential: 'Moderate',
      water_holding_capacity: 'Moderate to High',
      compaction_risk: 'Moderate',
      shrink_swell: 'Low',
      drainage_class: 'Moderately well drained',
      description: 'Mix of sand, silt, and clay. Good all-around soil but needs drainage attention.',
      drainage_implications: [
        'Surface grading is important for positive drainage',
        'French drains effective with proper gravel backfill',
        'May need longer French drain runs due to moderate infiltration',
        'Rain gardens need to be sized larger than in sandy soils'
      ],
      amendment_recommendations: [
        'Add coarse sand and compost to improve drainage in problem areas',
        'Avoid compaction during construction'
      ],
      curve_number: { lawn_good: 61, lawn_fair: 69, woods_good: 55 }
    },
    silt: {
      usda_class: 'Silt',
      hydrologic_group: 'B',
      infiltration_rate_in_hr: 0.8,
      infiltration_range: '0.3 - 1.5 in/hr',
      permeability: 'Moderate to Low',
      runoff_potential: 'Moderate to High',
      water_holding_capacity: 'High',
      compaction_risk: 'High',
      shrink_swell: 'Low to Moderate',
      drainage_class: 'Somewhat poorly drained',
      description: 'Fine-grained, smooth texture. Compacts easily and can become waterlogged.',
      drainage_implications: [
        'Surface drainage critical — silt compacts and seals easily',
        'French drains need extra gravel volume for storage',
        'Avoid working soil when wet to prevent compaction',
        'Subsurface drainage systems recommended for most sites'
      ],
      amendment_recommendations: [
        'Add gypsum to improve structure (5 lbs per 100 sq ft)',
        'Incorporate coarse organic matter and sand',
        'Core aeration annually to combat compaction'
      ],
      curve_number: { lawn_good: 61, lawn_fair: 69, woods_good: 55 }
    },
    silty_clay: {
      usda_class: 'Silty Clay',
      hydrologic_group: 'C',
      infiltration_rate_in_hr: 0.3,
      infiltration_range: '0.1 - 0.5 in/hr',
      permeability: 'Low',
      runoff_potential: 'High',
      water_holding_capacity: 'High',
      compaction_risk: 'High',
      shrink_swell: 'Moderate to High',
      drainage_class: 'Poorly drained',
      description: 'Dense, sticky when wet. Very slow water movement. Common in river floodplains.',
      drainage_implications: [
        'Aggressive drainage plan needed',
        'French drains essential but must discharge to positive outlet',
        'Surface grading is critical — maintain steep grades from structures',
        'Dry wells will NOT work well — soil cannot accept water fast enough',
        'Consider curtain drains to intercept subsurface flow'
      ],
      amendment_recommendations: [
        'Add gypsum heavily (10 lbs per 100 sq ft)',
        'Incorporate 4-6" of coarse compost into planting beds',
        'Consider raised beds for gardens'
      ],
      curve_number: { lawn_good: 74, lawn_fair: 79, woods_good: 70 }
    },
    clay: {
      usda_class: 'Clay',
      hydrologic_group: 'D',
      infiltration_rate_in_hr: 0.15,
      infiltration_range: '0.05 - 0.3 in/hr',
      permeability: 'Very Low',
      runoff_potential: 'Very High',
      water_holding_capacity: 'Very High',
      compaction_risk: 'Very High',
      shrink_swell: 'High',
      drainage_class: 'Very poorly drained',
      description: 'Dense, plastic when wet, hard when dry. Cracks in drought, swells in rain. Very challenging for drainage.',
      drainage_implications: [
        'COMPREHENSIVE drainage system required',
        'All surface water must be actively collected and conveyed off-site',
        'French drains serve as collection, NOT infiltration — must route to outlet',
        'Dry wells are NOT effective in clay',
        'Minimum 5% grade from all structures for 10 feet',
        'Consider channel drains in hardscape areas',
        'Foundation waterproofing is critical',
        'Sump pump may be needed in basement/crawl space'
      ],
      amendment_recommendations: [
        'Add gypsum: 10-15 lbs per 100 sq ft annually for 3 years',
        'Incorporate coarse sand and compost 6" deep in garden areas',
        'Raised beds strongly recommended for planting',
        'Core aerate lawn areas 2x per year'
      ],
      curve_number: { lawn_good: 80, lawn_fair: 84, woods_good: 77 }
    },
    heavy_clay: {
      usda_class: 'Heavy Clay (Expansive)',
      hydrologic_group: 'D',
      infiltration_rate_in_hr: 0.05,
      infiltration_range: '0.01 - 0.1 in/hr',
      permeability: 'Essentially Impermeable',
      runoff_potential: 'Extreme',
      water_holding_capacity: 'Extreme',
      compaction_risk: 'Extreme',
      shrink_swell: 'Very High (Expansive)',
      drainage_class: 'Very poorly drained — perched water table likely',
      description: 'Montmorillonite/bentonite clay. Extreme swelling when wet, severe cracking when dry. Can damage foundations.',
      drainage_implications: [
        'MAXIMUM drainage intervention required',
        'ALL water must be intercepted and conveyed rapidly',
        'Maintain consistent soil moisture around foundations to prevent differential settling',
        'Deep French drains (3ft+) around all structures',
        'Surface collection system (catch basins + channel drains) essential',
        'Consider moisture barrier around foundation',
        'Sump pump likely required',
        'Consult structural engineer for foundation protection'
      ],
      amendment_recommendations: [
        'Soil replacement may be necessary in critical areas',
        'Gypsum application: 15-20 lbs per 100 sq ft',
        'Use raised beds exclusively for planting',
        'Maintain uniform moisture to prevent heaving'
      ],
      curve_number: { lawn_good: 85, lawn_fair: 89, woods_good: 83 }
    },
    gravel: {
      usda_class: 'Gravel / Coarse',
      hydrologic_group: 'A',
      infiltration_rate_in_hr: 12.0,
      infiltration_range: '8.0 - 20.0+ in/hr',
      permeability: 'Extremely High',
      runoff_potential: 'Very Low',
      water_holding_capacity: 'Very Low',
      compaction_risk: 'Very Low',
      shrink_swell: 'None',
      drainage_class: 'Excessively drained',
      description: 'Coarse material with very rapid drainage. Minimal water retention.',
      drainage_implications: [
        'Natural drainage is excellent',
        'Minimal intervention usually needed',
        'Dry wells extremely effective',
        'Focus on directing water away from foundations is usually sufficient'
      ],
      amendment_recommendations: [
        'Add topsoil for planting areas',
        'Irrigation will be needed for landscaping'
      ],
      curve_number: { lawn_good: 30, lawn_fair: 39, woods_good: 20 }
    },
    unknown: {
      usda_class: 'Unknown — Soil Test Recommended',
      hydrologic_group: 'C (assumed)',
      infiltration_rate_in_hr: 0.5,
      infiltration_range: 'Unknown — assuming conservative 0.5 in/hr',
      permeability: 'Assumed Low (conservative)',
      runoff_potential: 'Assumed High (conservative)',
      water_holding_capacity: 'Unknown',
      compaction_risk: 'Unknown',
      shrink_swell: 'Unknown',
      drainage_class: 'Unknown',
      description: 'Soil type has not been determined. Analysis uses conservative assumptions. A soil test is strongly recommended.',
      drainage_implications: [
        'GET A SOIL TEST — results will significantly improve drainage plan accuracy',
        'Using conservative (clay-like) assumptions for safety',
        'Plan may be over-designed — soil test could reveal simpler solutions',
        'Consider a percolation test: dig 12" hole, fill with water, measure drain time'
      ],
      amendment_recommendations: [
        'Perform soil test: USDA Web Soil Survey or local extension office',
        'DIY perc test: fill 12" deep hole, time to drain. >4hrs = clay, <30min = sand'
      ],
      curve_number: { lawn_good: 74, lawn_fair: 79, woods_good: 70 }
    }
  };

  static getSoilInfo(soilType) {
    return this.SOIL_DATABASE[soilType] || this.SOIL_DATABASE['unknown'];
  }

  static analyzeSoil(soilType, surveyPoints) {
    const info = this.getSoilInfo(soilType);

    // Check if survey points have soil type data
    const soilVariations = {};
    for (const point of surveyPoints) {
      if (point.soil_type) {
        soilVariations[point.soil_type] = (soilVariations[point.soil_type] || 0) + 1;
      }
    }

    const hasVariation = Object.keys(soilVariations).length > 1;

    return {
      type: soilType,
      ...info,
      site_variations: soilVariations,
      has_variation: hasVariation,
      variation_note: hasVariation
        ? 'Multiple soil types detected across site — drainage plan should account for varying infiltration rates'
        : 'Uniform soil type assumed across site',
      infiltration_capacity_cf_hr_per_1000sqft: Math.round(info.infiltration_rate_in_hr / 12 * 1000 * 100) / 100,
      perc_test_recommendation: soilType === 'unknown'
        ? 'STRONGLY RECOMMENDED: Perform percolation test at 3+ locations across property'
        : 'Optional: confirm lab analysis with field perc test at 2+ locations'
    };
  }

  /**
   * SCS Curve Number method for more detailed runoff calculation
   * Q = (P - 0.2S)² / (P + 0.8S) where S = (1000/CN) - 10
   */
  static curveNumberRunoff(rainfall_inches, soilType, landCover = 'lawn_good') {
    const info = this.getSoilInfo(soilType);
    const CN = info.curve_number[landCover] || info.curve_number.lawn_fair || 74;

    const S = (1000 / CN) - 10; // Maximum retention
    const Ia = 0.2 * S; // Initial abstraction

    if (rainfall_inches <= Ia) return { runoff_inches: 0, CN, S, Ia };

    const Q = Math.pow(rainfall_inches - Ia, 2) / (rainfall_inches + 0.8 * S);

    return {
      runoff_inches: Math.round(Q * 1000) / 1000,
      rainfall_inches,
      CN,
      S: Math.round(S * 100) / 100,
      Ia: Math.round(Ia * 100) / 100,
      retention_inches: Math.round((rainfall_inches - Q) * 1000) / 1000,
      runoff_ratio: Math.round((Q / rainfall_inches) * 100)
    };
  }
}

module.exports = SoilEngine;
