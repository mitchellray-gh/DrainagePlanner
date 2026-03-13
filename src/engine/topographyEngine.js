/**
 * TopographyEngine — Land Surveyor Module
 * 
 * Elevation analysis, contour generation, slope calculation, flow path modeling
 * Uses principles from professional land surveying:
 * - Triangulated Irregular Network (TIN) surface modeling
 * - Contour interpolation via linear triangle interpolation
 * - Flow path determination via steepest descent
 * - Cut/fill volume calculations
 */

class TopographyEngine {

  // ─── SLOPE CALCULATIONS ─────────────────────────────────────────────

  /**
   * Calculate slope between pairs of points
   * Slope % = (rise / run) × 100
   */
  static calculateSlopes(points) {
    const slopes = [];

    for (let i = 0; i < points.length - 1; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const p1 = points[i];
        const p2 = points[j];

        if (p1.elevation_ft == null || p2.elevation_ft == null) continue;

        const distance_ft = this.haversineDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
        const rise = p2.elevation_ft - p1.elevation_ft;
        const slope_percent = distance_ft > 0 ? (rise / distance_ft) * 100 : 0;
        const slope_ratio = distance_ft > 0 ? `1:${Math.round(distance_ft / Math.abs(rise || 0.01))}` : 'flat';
        const direction = rise > 0 ? 'uphill' : rise < 0 ? 'downhill' : 'level';

        slopes.push({
          from: { label: p1.label, lat: p1.latitude, lng: p1.longitude, elevation: p1.elevation_ft },
          to: { label: p2.label, lat: p2.latitude, lng: p2.longitude, elevation: p2.elevation_ft },
          horizontal_distance_ft: Math.round(distance_ft * 10) / 10,
          vertical_rise_ft: Math.round(rise * 100) / 100,
          slope_percent: Math.round(slope_percent * 100) / 100,
          slope_ratio,
          direction,
          drainage_assessment: this.assessSlope(Math.abs(slope_percent))
        });
      }
    }

    return slopes.sort((a, b) => Math.abs(a.slope_percent) - Math.abs(b.slope_percent));
  }

  static assessSlope(slope_pct) {
    if (slope_pct < 0.5) return { rating: 'POOR', note: 'Nearly flat — ponding likely. Needs re-grading or subsurface drainage.' };
    if (slope_pct < 1.0) return { rating: 'MARGINAL', note: 'Below minimum for reliable surface drainage. Consider re-grading.' };
    if (slope_pct < 2.0) return { rating: 'ACCEPTABLE', note: 'Minimum slope for lawn drainage. Adequate for most conditions.' };
    if (slope_pct < 5.0) return { rating: 'GOOD', note: 'Good drainage slope. Meets IRC foundation grading requirements.' };
    if (slope_pct < 10.0) return { rating: 'STEEP', note: 'Steep grade — good drainage but may need erosion control.' };
    return { rating: 'VERY STEEP', note: 'Erosion risk is high. Needs terracing, retaining walls, or heavy ground cover.' };
  }

  // ─── TOPOGRAPHIC ANALYSIS ──────────────────────────────────────────

  static analyzeTopography(surveyPoints, boundaries) {
    const pointsWithElevation = surveyPoints.filter(p => p.elevation_ft != null);
    if (pointsWithElevation.length === 0) {
      return {
        status: 'insufficient_data',
        message: 'No elevation data available. Add survey points with elevations to enable topographic analysis.',
        min_elevation_ft: null,
        max_elevation_ft: null,
        total_relief_ft: null,
        avg_slope_percent: null,
        drainage_direction: 'unknown'
      };
    }

    const elevations = pointsWithElevation.map(p => p.elevation_ft);
    const minElev = Math.min(...elevations);
    const maxElev = Math.max(...elevations);
    const totalRelief = maxElev - minElev;

    // Find the general drainage direction
    const highPoint = pointsWithElevation.find(p => p.elevation_ft === maxElev);
    const lowPoint = pointsWithElevation.find(p => p.elevation_ft === minElev);

    let drainageDirection = 'unknown';
    let drainageBearing = null;
    if (highPoint && lowPoint) {
      drainageBearing = this.calculateBearing(highPoint.latitude, highPoint.longitude, lowPoint.latitude, lowPoint.longitude);
      drainageDirection = this.bearingToCardinal(drainageBearing);
    }

    // Calculate average and min slopes
    const allSlopes = this.calculateSlopes(pointsWithElevation);
    const slopeValues = allSlopes.map(s => Math.abs(s.slope_percent));
    const avgSlope = slopeValues.length > 0 ? slopeValues.reduce((a, b) => a + b, 0) / slopeValues.length : 0;
    const minSlope = slopeValues.length > 0 ? Math.min(...slopeValues) : 0;
    const maxSlope = slopeValues.length > 0 ? Math.max(...slopeValues) : 0;

    // Identify flat areas (potential ponding)
    const flatAreas = allSlopes.filter(s => Math.abs(s.slope_percent) < 1.0);

    // Identify steep areas (erosion risk)
    const steepAreas = allSlopes.filter(s => Math.abs(s.slope_percent) > 10);

    return {
      status: 'complete',
      point_count: pointsWithElevation.length,
      min_elevation_ft: minElev,
      max_elevation_ft: maxElev,
      total_relief_ft: Math.round(totalRelief * 100) / 100,
      avg_slope_percent: Math.round(avgSlope * 100) / 100,
      min_slope_percent: Math.round(minSlope * 100) / 100,
      max_slope_percent: Math.round(maxSlope * 100) / 100,
      drainage_direction: drainageDirection,
      drainage_bearing: drainageBearing ? Math.round(drainageBearing) : null,
      high_point: highPoint ? { lat: highPoint.latitude, lng: highPoint.longitude, elevation: highPoint.elevation_ft, label: highPoint.label } : null,
      low_point: lowPoint ? { lat: lowPoint.latitude, lng: lowPoint.longitude, elevation: lowPoint.elevation_ft, label: lowPoint.label } : null,
      flat_areas: flatAreas.length,
      steep_areas: steepAreas.length,
      flat_area_details: flatAreas.slice(0, 5),
      steep_area_details: steepAreas.slice(0, 5),
      overall_assessment: this.assessOverallTopography(avgSlope, minSlope, totalRelief, flatAreas.length),
      slopes: allSlopes
    };
  }

  static assessOverallTopography(avgSlope, minSlope, relief, flatCount) {
    const issues = [];
    let score = 100;

    if (minSlope < 1) {
      issues.push('Flat areas present — ponding risk without intervention');
      score -= 25;
    }
    if (avgSlope < 2) {
      issues.push('Average slope is below ideal minimum — consider re-grading');
      score -= 15;
    }
    if (avgSlope > 15) {
      issues.push('Steep average slope — erosion control measures needed');
      score -= 10;
    }
    if (relief < 1) {
      issues.push('Very little elevation change across site — subsurface drainage likely needed');
      score -= 20;
    }
    if (flatCount > 3) {
      issues.push(`Multiple flat zones (${flatCount}) — comprehensive grading plan recommended`);
      score -= 10;
    }

    let rating;
    if (score >= 80) rating = 'GOOD';
    else if (score >= 60) rating = 'FAIR';
    else if (score >= 40) rating = 'POOR';
    else rating = 'CRITICAL';

    return { score: Math.max(0, score), rating, issues };
  }

  // ─── CONTOUR GENERATION ────────────────────────────────────────────

  /**
   * Generate contour lines from survey points using TIN interpolation
   */
  static generateContours(surveyPoints, interval_ft = 1.0) {
    const pointsWithElev = surveyPoints.filter(p => p.elevation_ft != null);
    if (pointsWithElev.length < 3) {
      return { status: 'insufficient_data', contours: [] };
    }

    const elevations = pointsWithElev.map(p => p.elevation_ft);
    const minElev = Math.floor(Math.min(...elevations));
    const maxElev = Math.ceil(Math.max(...elevations));

    // Build TIN (Delaunay triangulation simplified)
    const triangles = this.buildTIN(pointsWithElev);

    // Generate contour levels
    const contours = [];
    for (let elev = minElev; elev <= maxElev; elev += interval_ft) {
      const contourLines = [];

      for (const tri of triangles) {
        const intersections = this.contourTriangleIntersection(tri, elev);
        if (intersections.length === 2) {
          contourLines.push(intersections);
        }
      }

      if (contourLines.length > 0) {
        contours.push({
          elevation: elev,
          is_index: elev % 5 === 0,
          segments: contourLines
        });
      }
    }

    return {
      status: 'complete',
      interval_ft,
      min_elevation: minElev,
      max_elevation: maxElev,
      contour_count: contours.length,
      contours
    };
  }

  /**
   * Simple TIN construction via triangle fan from centroid
   * (Production would use proper Delaunay triangulation)
   */
  static buildTIN(points) {
    if (points.length < 3) return [];

    const triangles = [];
    // Sort points by angle from centroid for reasonable triangulation
    const cx = points.reduce((s, p) => s + p.latitude, 0) / points.length;
    const cy = points.reduce((s, p) => s + p.longitude, 0) / points.length;

    const sorted = [...points].sort((a, b) => {
      const angleA = Math.atan2(a.longitude - cy, a.latitude - cx);
      const angleB = Math.atan2(b.longitude - cy, b.latitude - cx);
      return angleA - angleB;
    });

    for (let i = 0; i < sorted.length; i++) {
      const next = (i + 1) % sorted.length;
      const nextNext = (i + 2) % sorted.length;
      triangles.push([sorted[i], sorted[next], sorted[nextNext]]);
    }

    return triangles;
  }

  static contourTriangleIntersection(triangle, elevation) {
    const [p1, p2, p3] = triangle;
    const intersections = [];

    // Check each edge for intersection with contour elevation
    const edges = [[p1, p2], [p2, p3], [p3, p1]];

    for (const [a, b] of edges) {
      if ((a.elevation_ft <= elevation && b.elevation_ft >= elevation) ||
          (a.elevation_ft >= elevation && b.elevation_ft <= elevation)) {
        if (a.elevation_ft === b.elevation_ft) continue;

        const t = (elevation - a.elevation_ft) / (b.elevation_ft - a.elevation_ft);
        intersections.push({
          lat: a.latitude + t * (b.latitude - a.latitude),
          lng: a.longitude + t * (b.longitude - a.longitude),
          elevation
        });
      }
    }

    return intersections;
  }

  // ─── FLOW PATHS ────────────────────────────────────────────────────

  static calculateFlowPaths(surveyPoints, structures) {
    const pointsWithElev = surveyPoints.filter(p => p.elevation_ft != null);
    if (pointsWithElev.length < 2) {
      return { status: 'insufficient_data', paths: [] };
    }

    // Sort by elevation (high to low)
    const sorted = [...pointsWithElev].sort((a, b) => b.elevation_ft - a.elevation_ft);

    const paths = [];

    // From each high point, trace flow to lowest neighbor
    for (const startPoint of sorted.slice(0, Math.min(5, sorted.length))) {
      const path = [startPoint];
      let current = startPoint;
      const visited = new Set([`${current.latitude},${current.longitude}`]);

      for (let step = 0; step < 20; step++) {
        // Find steepest downhill neighbor
        let bestNext = null;
        let steepestSlope = 0;

        for (const candidate of pointsWithElev) {
          const key = `${candidate.latitude},${candidate.longitude}`;
          if (visited.has(key)) continue;
          if (candidate.elevation_ft >= current.elevation_ft) continue;

          const dist = this.haversineDistance(current.latitude, current.longitude, candidate.latitude, candidate.longitude);
          if (dist === 0) continue;

          const slope = (current.elevation_ft - candidate.elevation_ft) / dist;
          if (slope > steepestSlope) {
            steepestSlope = slope;
            bestNext = candidate;
          }
        }

        if (!bestNext) break;
        path.push(bestNext);
        visited.add(`${bestNext.latitude},${bestNext.longitude}`);
        current = bestNext;
      }

      if (path.length > 1) {
        const totalDrop = path[0].elevation_ft - path[path.length - 1].elevation_ft;
        const totalDist = this.pathLength(path);

        paths.push({
          start: { lat: path[0].latitude, lng: path[0].longitude, elevation: path[0].elevation_ft, label: path[0].label },
          end: { lat: current.latitude, lng: current.longitude, elevation: current.elevation_ft, label: current.label },
          points: path.map(p => ({ lat: p.latitude, lng: p.longitude, elevation: p.elevation_ft, label: p.label })),
          total_drop_ft: Math.round(totalDrop * 100) / 100,
          total_distance_ft: Math.round(totalDist * 10) / 10,
          avg_slope_percent: totalDist > 0 ? Math.round((totalDrop / totalDist) * 10000) / 100 : 0,
          step_count: path.length
        });
      }
    }

    return {
      status: 'complete',
      path_count: paths.length,
      paths,
      primary_flow_direction: paths.length > 0 ? this.bearingToCardinal(
        this.calculateBearing(paths[0].start.lat, paths[0].start.lng, paths[0].end.lat, paths[0].end.lng)
      ) : 'unknown'
    };
  }

  static pathLength(path) {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      total += this.haversineDistance(path[i].latitude, path[i].longitude, path[i + 1].latitude, path[i + 1].longitude);
    }
    return total;
  }

  // ─── CUT/FILL ANALYSIS ────────────────────────────────────────────

  static calculateCutFill(surveyPoints, targetElevation, area_sqft) {
    const pointsWithElev = surveyPoints.filter(p => p.elevation_ft != null);
    if (pointsWithElev.length === 0) return null;

    let totalCut = 0;
    let totalFill = 0;

    for (const point of pointsWithElev) {
      const diff = point.elevation_ft - targetElevation;
      if (diff > 0) totalCut += diff;
      else totalFill += Math.abs(diff);
    }

    // Average per point, extrapolate to area
    const avgCut = totalCut / pointsWithElev.length;
    const avgFill = totalFill / pointsWithElev.length;

    const cutVolume_cf = avgCut * area_sqft;
    const fillVolume_cf = avgFill * area_sqft;

    return {
      target_elevation_ft: targetElevation,
      cut_volume_cf: Math.round(cutVolume_cf),
      cut_volume_cy: Math.round(cutVolume_cf / 27),
      fill_volume_cf: Math.round(fillVolume_cf),
      fill_volume_cy: Math.round(fillVolume_cf / 27),
      net_volume_cy: Math.round((cutVolume_cf - fillVolume_cf) / 27),
      balance: cutVolume_cf > fillVolume_cf ? 'excess_cut' : 'needs_import',
      estimated_truck_loads: Math.ceil(Math.abs(cutVolume_cf - fillVolume_cf) / 27 / 10) // 10 CY per truck
    };
  }

  // ─── GEOMETRIC UTILITIES ───────────────────────────────────────────

  static haversineDistance(lat1, lon1, lat2, lon2) {
    // Returns distance in feet
    const R = 20902231; // Earth radius in feet
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = this.toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.toRad(lat2));
    const x = Math.cos(this.toRad(lat1)) * Math.sin(this.toRad(lat2)) -
              Math.sin(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.cos(dLon);
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  static bearingToCardinal(bearing) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(bearing / 22.5) % 16;
    return dirs[idx];
  }

  static toRad(deg) {
    return deg * Math.PI / 180;
  }

  /**
   * Calculate polygon area from coordinates using Shoelace formula
   * Coordinates in lat/lng, result in square feet
   */
  static calculatePolygonArea(points) {
    if (points.length < 3) return 0;

    // Convert to local coordinate system (feet from first point)
    const origin = points[0];
    const localPoints = points.map(p => ({
      x: this.haversineDistance(origin.lat, origin.lng, origin.lat, p.lng) * (p.lng > origin.lng ? 1 : -1),
      y: this.haversineDistance(origin.lat, origin.lng, p.lat, origin.lng) * (p.lat > origin.lat ? 1 : -1)
    }));

    // Shoelace formula
    let area = 0;
    for (let i = 0; i < localPoints.length; i++) {
      const j = (i + 1) % localPoints.length;
      area += localPoints[i].x * localPoints[j].y;
      area -= localPoints[j].x * localPoints[i].y;
    }

    return Math.abs(area / 2);
  }

  static calculatePerimeter(points) {
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      perimeter += this.haversineDistance(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
    }
    return perimeter;
  }
}

module.exports = TopographyEngine;
