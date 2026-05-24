/**
 * TrainingDataTransformer — Converts raw project data into feature vectors
 * Used client-side to prepare inference inputs from current project state
 */

const SOIL_TYPES = ['clay', 'heavy_clay', 'silty_clay', 'loam', 'sandy_loam', 'sand', 'gravel', 'silt', 'unknown']

/**
 * Transform a project object into a normalized feature vector for model inference
 * @param {Object} project - Project data from the API
 * @returns {number[]} Array of 20 normalized features
 */
export function projectToFeatures(project) {
  if (!project) return null

  const area = project.property_area_sqft || 5000
  const rainfall = project.avg_annual_rainfall_in || 40
  const climateZoneNum = parseClimateZone(project.climate_zone)
  const soilType = project.soil_type || 'unknown'
  const soilIndex = SOIL_TYPES.indexOf(soilType)

  // Normalize numeric features to 0-1 range
  const normalizedArea = Math.min(area / 50000, 1)
  const normalizedRainfall = Math.min(rainfall / 80, 1)
  const normalizedClimate = climateZoneNum / 13

  // Default impervious ratio — could be computed from structures if available
  const imperviousRatio = project.impervious_ratio || estimateImperviousRatio(project)

  // Slope estimate
  const slopePercent = project.avg_slope_percent || estimateSlope(project)
  const normalizedSlope = Math.min(slopePercent / 15, 1)

  // One-hot encode soil type
  const soilOneHot = new Array(SOIL_TYPES.length).fill(0)
  soilOneHot[soilIndex >= 0 ? soilIndex : SOIL_TYPES.length - 1] = 1

  return [
    normalizedArea,
    normalizedRainfall,
    normalizedClimate,
    imperviousRatio,
    normalizedSlope,
    ...soilOneHot,
    // Derived interaction features
    normalizedArea * normalizedRainfall,
    normalizedArea * imperviousRatio,
    normalizedRainfall * normalizedSlope,
    soilIndex >= 0 && soilIndex <= 2 ? 1 : 0, // is_clay_type
    normalizedRainfall > 0.5 ? 1 : 0,         // high_rainfall
    normalizedArea > 0.4 ? 1 : 0              // large_property
  ]
}

/**
 * Estimate impervious area ratio from project structures
 */
function estimateImperviousRatio(project) {
  if (!project.property_area_sqft) return 0.2

  // If structures are available, estimate from them
  const structures = project.structures || []
  if (structures.length === 0) return 0.2

  let imperviousArea = 0
  for (const s of structures) {
    if (s.geometry && s.geometry.area_sqft) {
      imperviousArea += s.geometry.area_sqft
    } else {
      // Estimate typical structure footprint
      imperviousArea += 200
    }
  }

  return Math.min(imperviousArea / project.property_area_sqft, 0.8)
}

/**
 * Estimate average slope from survey points
 */
function estimateSlope(project) {
  const surveyPoints = project.surveyPoints || []
  if (surveyPoints.length < 2) return 2 // default 2%

  const elevations = surveyPoints
    .filter(p => p.elevation_ft != null)
    .map(p => p.elevation_ft)

  if (elevations.length < 2) return 2

  const maxElev = Math.max(...elevations)
  const minElev = Math.min(...elevations)
  const rise = maxElev - minElev

  // Approximate run from property area
  const run = Math.sqrt(project.property_area_sqft || 5000)
  const slopePercent = (rise / run) * 100

  return Math.max(0.5, Math.min(15, slopePercent))
}

function parseClimateZone(zone) {
  if (!zone) return 6
  const num = parseInt(zone)
  if (!isNaN(num)) return Math.min(13, Math.max(1, num))
  return 6
}

export { SOIL_TYPES }
