/**
 * LandscapeEngine — Landscaping Specialist Module
 * 
 * Integrates drainage solutions with beautiful, functional landscaping:
 * - Rain gardens with native plant recommendations
 * - Bioswales with appropriate vegetation
 * - Dry creek beds (aesthetic drainage channels)
 * - Permeable hardscape options
 * - Erosion control planting
 * - French drain concealment
 * - Water-tolerant plant palettes by zone
 */

class LandscapeEngine {

  // ─── PLANT DATABASE (by moisture tolerance zone) ───────────────────

  static PLANT_DATABASE = {
    // Rain Garden / Wet Zone — plants that tolerate periodic flooding
    wet_zone: [
      { name: 'Blue Flag Iris', botanical: 'Iris versicolor', type: 'perennial', height: '2-3 ft', zones: '3-9', moisture: 'wet to moist', notes: 'Excellent rain garden plant, beautiful blue flowers' },
      { name: 'Cardinal Flower', botanical: 'Lobelia cardinalis', type: 'perennial', height: '2-4 ft', zones: '3-9', moisture: 'wet to moist', notes: 'Bright red flowers, attracts hummingbirds' },
      { name: 'Swamp Milkweed', botanical: 'Asclepias incarnata', type: 'perennial', height: '3-5 ft', zones: '3-8', moisture: 'wet to moist', notes: 'Supports monarch butterflies, pink flowers' },
      { name: 'Joe-Pye Weed', botanical: 'Eutrochium purpureum', type: 'perennial', height: '4-7 ft', zones: '4-9', moisture: 'wet to moist', notes: 'Large purple flower clusters, excellent for pollinators' },
      { name: 'Switchgrass', botanical: 'Panicum virgatum', type: 'grass', height: '3-6 ft', zones: '4-9', moisture: 'wet to dry', notes: 'Very adaptable native grass, excellent erosion control' },
      { name: 'Soft Rush', botanical: 'Juncus effusus', type: 'grass', height: '2-4 ft', zones: '4-9', moisture: 'wet', notes: 'Tolerates standing water, good for biofiltering' },
      { name: 'Sedge', botanical: 'Carex spp.', type: 'grass', height: '1-3 ft', zones: '3-9', moisture: 'wet to moist', notes: 'Many species available, great groundcover for wet areas' },
      { name: 'River Birch', botanical: 'Betula nigra', type: 'tree', height: '40-70 ft', zones: '4-9', moisture: 'wet to moist', notes: 'Beautiful peeling bark, very water-tolerant tree' },
      { name: 'Red Maple', botanical: 'Acer rubrum', type: 'tree', height: '40-60 ft', zones: '3-9', moisture: 'wet to moist', notes: 'Stunning fall color, tolerates wet conditions' },
      { name: 'Winterberry Holly', botanical: 'Ilex verticillata', type: 'shrub', height: '6-10 ft', zones: '3-9', moisture: 'wet to moist', notes: 'Bright red berries in winter, native' }
    ],

    // Moist Zone — transitions area between wet and dry
    moist_zone: [
      { name: 'Black-Eyed Susan', botanical: 'Rudbeckia fulgida', type: 'perennial', height: '2-3 ft', zones: '3-9', moisture: 'moist to dry', notes: 'Long-blooming yellow flowers, very hardy' },
      { name: 'Coneflower', botanical: 'Echinacea purpurea', type: 'perennial', height: '2-4 ft', zones: '3-8', moisture: 'moist to dry', notes: 'Purple daisy flowers, drought tolerant once established' },
      { name: 'Daylily', botanical: 'Hemerocallis spp.', type: 'perennial', height: '1-4 ft', zones: '3-9', moisture: 'moist', notes: 'Reliable, many color options, good for slopes' },
      { name: 'Fern (Ostrich)', botanical: 'Matteuccia struthiopteris', type: 'perennial', height: '3-5 ft', zones: '3-7', moisture: 'moist', notes: 'Elegant fronds, excellent for shaded moist areas' },
      { name: 'Spicebush', botanical: 'Lindera benzoin', type: 'shrub', height: '6-12 ft', zones: '4-9', moisture: 'moist', notes: 'Yellow fall color, spice-scented, native' },
      { name: 'Virginia Sweetspire', botanical: 'Itea virginica', type: 'shrub', height: '3-6 ft', zones: '5-9', moisture: 'moist to wet', notes: 'White flower clusters, great fall color' },
      { name: 'Little Bluestem', botanical: 'Schizachyrium scoparium', type: 'grass', height: '2-4 ft', zones: '3-9', moisture: 'moist to dry', notes: 'Native prairie grass, copper fall color' }
    ],

    // Dry / Upland Zone — well-drained areas and slopes
    dry_zone: [
      { name: 'Lavender', botanical: 'Lavandula spp.', type: 'perennial', height: '1-3 ft', zones: '5-9', moisture: 'dry', notes: 'Fragrant, drought tolerant, needs excellent drainage' },
      { name: 'Sedum', botanical: 'Sedum spp.', type: 'perennial', height: '3-24 in', zones: '3-9', moisture: 'dry', notes: 'Succulent groundcover, excellent for dry slopes' },
      { name: 'Creeping Juniper', botanical: 'Juniperus horizontalis', type: 'groundcover', height: '6-18 in', zones: '3-9', moisture: 'dry', notes: 'Excellent erosion control on slopes, evergreen' },
      { name: 'Prairie Dropseed', botanical: 'Sporobolus heterolepis', type: 'grass', height: '2-3 ft', zones: '3-8', moisture: 'dry', notes: 'Fine-textured native grass, fragrant in fall' },
      { name: 'Butterfly Weed', botanical: 'Asclepias tuberosa', type: 'perennial', height: '1-3 ft', zones: '3-9', moisture: 'dry', notes: 'Bright orange flowers, supports monarchs' },
      { name: 'Yarrow', botanical: 'Achillea millefolium', type: 'perennial', height: '1-3 ft', zones: '3-9', moisture: 'dry', notes: 'Tough, spreading perennial, many colors available' }
    ],

    // Erosion Control — for slopes and disturbed areas
    erosion_control: [
      { name: 'Crown Vetch', botanical: 'Securigera varia', type: 'groundcover', height: '1-2 ft', zones: '3-9', notes: 'Aggressive slope stabilizer, pink flowers' },
      { name: 'Creeping Red Fescue', botanical: 'Festuca rubra', type: 'grass', height: '6-10 in', zones: '3-7', notes: 'Fine-textured lawn grass that handles slopes well' },
      { name: 'Buffalograss', botanical: 'Bouteloua dactyloides', type: 'grass', height: '3-5 in', zones: '4-8', notes: 'Native low-water lawn alternative, deep roots' },
      { name: 'Virginia Creeper', botanical: 'Parthenocissus quinquefolia', type: 'vine', height: 'climbing', zones: '3-9', notes: 'Fast-growing native vine for slope coverage' },
      { name: 'Pachysandra', botanical: 'Pachysandra terminalis', type: 'groundcover', height: '8-12 in', zones: '4-8', notes: 'Evergreen groundcover, excellent for shade slopes' }
    ]
  };

  // ─── LANDSCAPE INTEGRATION ─────────────────────────────────────────

  static generateLandscapeIntegration(siteData, drainagePlan) {
    const elements = [];
    const plantList = [];
    const soilType = siteData.project.soil_type || 'unknown';
    const climateZone = siteData.project.climate_zone || '6';

    // 1. Rain Garden(s) — where catch basins or low points exist
    const catchBasins = drainagePlan.elements.filter(e => e.type === 'catch_basin');
    if (catchBasins.length > 0 || drainagePlan.analysis.overall_risk.score > 30) {
      const rainGarden = this.designRainGarden(siteData, drainagePlan);
      elements.push(rainGarden);
      plantList.push(...rainGarden.plants);
    }

    // 2. Dry Creek Bed — aesthetic alternative to exposed swales
    const swales = drainagePlan.elements.filter(e => e.type === 'swale');
    if (swales.length > 0) {
      const dryCreek = this.designDryCreekBed(siteData, swales[0]);
      elements.push(dryCreek);
      plantList.push(...(dryCreek.plants || []));
    }

    // 3. Bioswale enhancement — if property has swales
    if (swales.length > 0) {
      const bioswale = this.designBioswale(siteData);
      elements.push(bioswale);
      plantList.push(...bioswale.plants);
    }

    // 4. Foundation planting buffer
    const foundationDrains = drainagePlan.elements.filter(e => e.type === 'french_drain' && e.label.includes('Foundation'));
    if (foundationDrains.length > 0) {
      const foundationPlanting = this.designFoundationBuffer(siteData);
      elements.push(foundationPlanting);
      plantList.push(...foundationPlanting.plants);
    }

    // 5. Slope stabilization
    if (siteData.topography && siteData.topography.steep_areas > 0) {
      const slopeStabilization = this.designSlopeStabilization(siteData);
      elements.push(slopeStabilization);
      plantList.push(...slopeStabilization.plants);
    }

    // 6. Permeable hardscape recommendations
    const permeableOptions = this.recommendPermeableHardscape(siteData);
    elements.push(permeableOptions);

    return {
      elements,
      plant_list: this.consolidatePlantList(plantList),
      design_philosophy: this.getDesignPhilosophy(siteData),
      maintenance_schedule: this.getMaintenanceSchedule()
    };
  }

  // ─── RAIN GARDEN DESIGN ────────────────────────────────────────────

  static designRainGarden(siteData, drainagePlan) {
    const drainage_area_sqft = siteData.project.property_area_sqft || 10000;
    const soilType = siteData.project.soil_type || 'unknown';
    const soilInfo = require('./soilEngine').getSoilInfo(soilType);

    // Rain garden sizing: typically 20-30% of impervious area draining to it
    // Or sized for 1" rain event storage
    const targetVolume_cf = (drainage_area_sqft * 0.3) * (1 / 12); // 1 inch over 30% of drainage area
    const infiltRate = soilInfo.infiltration_rate_in_hr || 0.5;

    // Depth: 6" for clay, 12" for loam, 18" for sand
    let depth_in;
    if (infiltRate < 0.5) depth_in = 6;
    else if (infiltRate < 2) depth_in = 9;
    else depth_in = 12;

    const area_sqft = targetVolume_cf / (depth_in / 12);
    const size = Math.max(50, Math.min(area_sqft, 500)); // 50-500 sq ft practical range

    // Select plants based on zones within rain garden
    const wetPlants = this.PLANT_DATABASE.wet_zone.slice(0, 4);
    const moistPlants = this.PLANT_DATABASE.moist_zone.slice(0, 3);
    const edgePlants = this.PLANT_DATABASE.dry_zone.slice(0, 2);

    return {
      type: 'rain_garden',
      label: 'Rain Garden',
      description: 'Shallow depression planted with native plants that captures and filters stormwater runoff',
      area_sqft: Math.round(size),
      depth_in,
      ponding_depth_in: depth_in,
      drain_time_hours: Math.round(depth_in / infiltRate * 10) / 10,
      soil_mix: infiltRate < 0.5
        ? '60% sand, 20% compost, 20% topsoil (replace existing clay)'
        : '50% existing soil, 30% compost, 20% sand',
      mulch: '3" hardwood mulch on slopes, 2" in basin (NOT rubber mulch)',
      overflow: 'Connect overflow to main drainage system or install weir at 6" depth',
      plants: [...wetPlants, ...moistPlants, ...edgePlants],
      planting_zones: {
        center_wet: { description: 'Deepest area — tolerates periodic flooding', plants: wetPlants.map(p => p.name) },
        middle_moist: { description: 'Transition zone — moist but not flooded', plants: moistPlants.map(p => p.name) },
        edge_dry: { description: 'Rim of garden — well-drained', plants: edgePlants.map(p => p.name) }
      },
      installation_summary: `Excavate ${Math.round(size)} sq ft area to ${depth_in}" deep with gradual side slopes (3:1). Amend soil, install plants in zones (wet center, moist middle, dry edges). Mulch and connect overflow.`,
      estimated_duration: '1-2 days',
      estimated_cost: `$${Math.round(size * 4)}-$${Math.round(size * 8)} (materials + plants)`
    };
  }

  // ─── DRY CREEK BED DESIGN ─────────────────────────────────────────

  static designDryCreekBed(siteData, swale) {
    const length_ft = 30; // Default estimate
    const width_ft = swale.specifications?.top_width_ft || 3;
    const depth_in = swale.specifications?.depth_in || 8;

    return {
      type: 'dry_creek_bed',
      label: 'Dry Creek Bed',
      description: 'Natural-looking stone channel that conveys water during rain and serves as landscape feature when dry',
      length_ft,
      width_ft: Math.round(width_ft * 10) / 10,
      depth_in,
      materials: {
        river_rock: { size: '3-6 inch', quantity_tons: Math.round(length_ft * width_ft * (depth_in / 12) / 27 * 1.4 * 10) / 10 },
        boulders: { size: '12-24 inch', quantity: Math.ceil(length_ft / 5), note: 'Place at bends and transitions' },
        pea_gravel: { size: '3/8 inch', quantity_bags: Math.ceil(length_ft / 3), note: 'Fill between larger stones' },
        landscape_fabric: { quantity_sqft: Math.ceil(length_ft * (width_ft + 2) * 1.1) },
        edging: { type: 'Natural stone or steel edging', quantity_ft: length_ft * 2 }
      },
      plants: [
        ...this.PLANT_DATABASE.moist_zone.filter(p => p.type !== 'tree').slice(0, 3),
        ...this.PLANT_DATABASE.erosion_control.slice(0, 2)
      ],
      design_tips: [
        'Curve the creek bed naturally — avoid straight lines',
        'Vary stone sizes from large boulders to small pebbles',
        'Place largest boulders at outside of curves',
        'Cluster plants at bends and edges',
        'Let some stones overlap the edges for natural look',
        'Ensure positive grade throughout — no flat spots',
        'Start and end at logical points (downspout, garden, property edge)'
      ],
      installation_summary: `Excavate winding channel ${length_ft}ft × ${width_ft}ft × ${depth_in}". Line with landscape fabric, place boulders at bends, fill with river rock, plant edges.`,
      estimated_duration: '1-2 days',
      estimated_cost: `$${Math.round(length_ft * 15)}-$${Math.round(length_ft * 30)}`
    };
  }

  // ─── BIOSWALE DESIGN ───────────────────────────────────────────────

  static designBioswale(siteData) {
    return {
      type: 'bioswale',
      label: 'Planted Bioswale',
      description: 'Vegetated channel that slows, filters, and infiltrates stormwater while adding beauty',
      specifications: {
        bottom_width_ft: 2,
        side_slopes: '3:1 or gentler',
        depth_in: 12,
        check_dams: 'Install small stone check dams every 15-20 ft on steeper grades'
      },
      plants: [
        ...this.PLANT_DATABASE.wet_zone.filter(p => p.type === 'grass').slice(0, 2),
        ...this.PLANT_DATABASE.wet_zone.filter(p => p.type === 'perennial').slice(0, 3)
      ],
      installation_summary: 'Grade broad, shallow swale with 3:1 side slopes. Amend bottom 6" with compost. Plant dense native grasses and perennials. Install check dams on slopes >2%.',
      estimated_duration: '1 day',
      benefits: [
        'Slows runoff velocity by 50-80%',
        'Filters sediment and pollutants',
        'Promotes infiltration',
        'Creates pollinator habitat',
        'Low maintenance once established'
      ]
    };
  }

  // ─── FOUNDATION BUFFER ─────────────────────────────────────────────

  static designFoundationBuffer(siteData) {
    return {
      type: 'foundation_buffer',
      label: 'Foundation Planting Buffer',
      description: 'Strategic planting around foundation to manage moisture while maintaining proper drainage clearance',
      specifications: {
        clearance_from_foundation: '18-24 inches minimum — NO plants touching siding',
        planting_bed_width: '3-5 feet',
        mulch_depth: '2-3 inches (keep 6" away from siding)',
        grading: 'Bed must slope AWAY from foundation at 5% minimum'
      },
      plants: [
        { name: 'Dwarf Boxwood', botanical: 'Buxus sempervirens Suffruticosa', type: 'shrub', height: '2-3 ft', notes: 'Compact, evergreen, low water needs near foundation' },
        { name: 'Dwarf Yaupon Holly', botanical: 'Ilex vomitoria Nana', type: 'shrub', height: '3-4 ft', notes: 'Tough native evergreen, handles dry conditions' },
        { name: 'Liriope', botanical: 'Liriope muscari', type: 'groundcover', height: '12-18 in', notes: 'Excellent border plant, handles sun or shade' },
        { name: 'Coral Bells', botanical: 'Heuchera spp.', type: 'perennial', height: '12-18 in', notes: 'Colorful foliage, compact, well-drained soil' }
      ],
      critical_notes: [
        'NEVER plant large trees within 10ft of foundation',
        'NEVER allow soil or mulch to contact siding',
        'NEVER create planting beds that dam water against foundation',
        'Ensure French drain access points remain accessible',
        'Keep gutter downspout splash areas clear of plants'
      ],
      installation_summary: 'Create raised bed sloping away from foundation. Install compact shrubs and groundcovers 18-24" from wall. Mulch lightly. Maintain drainage grade.',
      estimated_duration: '4-6 hours'
    };
  }

  // ─── SLOPE STABILIZATION ───────────────────────────────────────────

  static designSlopeStabilization(siteData) {
    const avgSlope = siteData.topography?.avg_slope_percent || 5;

    let approach;
    if (avgSlope > 33) {
      approach = 'Retaining wall + terracing required (consult structural engineer)';
    } else if (avgSlope > 15) {
      approach = 'Heavy groundcover + erosion blanket + possible terracing';
    } else {
      approach = 'Dense groundcover planting + mulch + erosion blanket during establishment';
    }

    return {
      type: 'slope_stabilization',
      label: 'Slope Erosion Control',
      description: `Stabilize slopes (avg ${avgSlope}%) with vegetation and erosion control measures`,
      approach,
      plants: this.PLANT_DATABASE.erosion_control.slice(0, 4),
      materials: {
        erosion_blanket: 'Biodegradable coconut fiber blanket (not plastic netting — wildlife hazard)',
        stakes: 'Biodegradable wooden stakes, 12" long, every 3 ft',
        mulch: 'Shredded hardwood mulch 3-4" deep on gentler slopes'
      },
      installation_summary: 'Install erosion blanket on bare slopes, plant dense groundcover, apply mulch between plants. Water regularly until established.',
      estimated_duration: '4-8 hours per 500 sq ft'
    };
  }

  // ─── PERMEABLE HARDSCAPE ───────────────────────────────────────────

  static recommendPermeableHardscape(siteData) {
    return {
      type: 'permeable_hardscape',
      label: 'Permeable Hardscape Recommendations',
      description: 'Replace or supplement impervious surfaces to reduce runoff at the source',
      options: [
        {
          name: 'Permeable Pavers',
          application: 'Driveways, patios, walkways',
          infiltration: '10-20 in/hr when properly installed',
          cost: '$12-25 per sq ft installed',
          maintenance: 'Vacuum or pressure wash joints annually to maintain infiltration',
          pros: ['Significant runoff reduction', 'Attractive appearance', 'Long-lasting'],
          cons: ['Higher cost than standard concrete', 'Requires periodic maintenance', 'Needs proper base']
        },
        {
          name: 'Gravel / Crushed Stone',
          application: 'Paths, parking areas, utility areas',
          infiltration: '20+ in/hr',
          cost: '$3-8 per sq ft',
          maintenance: 'Replenish annually, maintain edges',
          pros: ['Very affordable', 'Excellent infiltration', 'Easy to install'],
          cons: ['Not suitable for heavy traffic', 'Can migrate without edging', 'Weed maintenance']
        },
        {
          name: 'Grass Pavers (Turf Block)',
          application: 'Overflow parking, fire lanes, light-traffic areas',
          infiltration: '8-15 in/hr',
          cost: '$8-15 per sq ft',
          maintenance: 'Mow and water like regular lawn',
          pros: ['Looks like lawn', 'Supports vehicle weight', 'High infiltration'],
          cons: ['Needs irrigation', 'Not for heavy daily traffic', 'Can rut in clay soil']
        },
        {
          name: 'Decomposed Granite (DG)',
          application: 'Paths, patios, drought-tolerant landscapes',
          infiltration: '5-10 in/hr',
          cost: '$3-6 per sq ft',
          maintenance: 'Replenish and compact annually',
          pros: ['Natural appearance', 'Good drainage', 'Affordable'],
          cons: ['Can be dusty', 'Tracks into house', 'Requires edging']
        }
      ],
      installation_summary: 'Evaluate existing impervious surfaces for conversion opportunities. Permeable pavers over French drain lines provide dual benefit.',
      estimated_duration: 'Varies by scope'
    };
  }

  // ─── UTILITIES ─────────────────────────────────────────────────────

  static consolidatePlantList(plants) {
    const map = {};
    for (const plant of plants) {
      if (!map[plant.name]) {
        map[plant.name] = { ...plant, quantity: 1 };
      } else {
        map[plant.name].quantity += 1;
      }
    }

    return Object.values(map).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  }

  static getDesignPhilosophy(siteData) {
    return {
      principles: [
        'Manage water at the source — reduce, slow, spread, and infiltrate before conveying',
        'Mimic natural hydrology — use plants and soil to filter and absorb runoff',
        'Create multi-functional landscapes — every element serves drainage AND aesthetic purpose',
        'Use native plants — adapted to local rainfall patterns, support ecosystem, low maintenance',
        'Design for the worst, enjoy the best — system handles storms, looks great every day'
      ],
      approach: 'Green Infrastructure First — use natural systems where possible, engineered systems where necessary'
    };
  }

  static getMaintenanceSchedule() {
    return {
      monthly: [
        'Inspect catch basin grates — clear debris',
        'Check pop-up emitters — ensure they operate freely',
        'Verify no erosion at outlet points'
      ],
      quarterly: [
        'Inspect French drain cleanouts — flush if needed',
        'Check rain garden — remove sediment buildup if >1"',
        'Inspect dry creek bed — reposition displaced stones',
        'Check all grades near foundation — correct any settlement'
      ],
      annually: [
        'Flush entire pipe system with garden hose',
        'Replenish mulch in rain garden and planting beds (spring)',
        'Divide and replant rain garden perennials as needed',
        'Reseed any bare spots on slopes or swales',
        'Clean/vacuum permeable paver joints',
        'Inspect and repair any erosion damage',
        'Test sump pump if installed'
      ],
      after_major_storms: [
        'Walk property and check for new ponding areas',
        'Verify all catch basins are draining',
        'Check outlet points for erosion',
        'Clear any debris from grates and channels',
        'Note any areas where system was overwhelmed — may need upgrades'
      ]
    };
  }
}

module.exports = LandscapeEngine;
