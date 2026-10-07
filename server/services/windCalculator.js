/**
 * Mathematical calculations for Runway Wind components
 * Headwind / Tailwind & Crosswind (with left/right indication)
 */

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates wind components for a specific runway heading and METAR wind
 * @param {number} runwayHeading - Runway magnetic orientation in degrees (e.g. 180)
 * @param {number|string} windDir - Wind direction in degrees (0-360) or 'VRB'
 * @param {number} windSpeed - Wind speed in knots
 * @param {number|null} windGust - Gust speed in knots (optional)
 */
function calculateRunwayWind(runwayHeading, windDir, windSpeed, windGust = null) {
  if (windDir === 'VRB' || windDir === null || isNaN(windDir) || windSpeed === 0) {
    return {
      runwayHeading,
      windDir,
      windSpeed,
      windGust,
      headwind: 0,
      tailwind: 0,
      crosswind: 0,
      crosswindDir: 'CALM',
      isFavored: false,
      angleDiff: 0,
      isVariable: windDir === 'VRB',
      isCalm: windSpeed === 0,
    };
  }

  // Calculate shortest angular difference (-180 to +180)
  let angleDiff = windDir - runwayHeading;
  while (angleDiff < -180) angleDiff += 360;
  while (angleDiff > 180) angleDiff -= 360;

  const angleRad = toRad(angleDiff);

  // Effective wind speed (using gusts if applicable for peak crosswind check)
  const baseSpeed = Number(windSpeed) || 0;
  const gustSpeed = Number(windGust) || baseSpeed;

  // Headwind (positive) or Tailwind (negative)
  const alongTrack = Math.round(baseSpeed * Math.cos(angleRad));
  const headwind = alongTrack > 0 ? alongTrack : 0;
  const tailwind = alongTrack < 0 ? Math.abs(alongTrack) : 0;

  // Crosswind (always positive magnitude)
  const rawCross = baseSpeed * Math.sin(angleRad);
  const crosswind = Math.round(Math.abs(rawCross));
  const gustCrosswind = Math.round(Math.abs(gustSpeed * Math.sin(angleRad)));

  // Direction: Left or Right
  let crosswindDir = 'NONE';
  if (crosswind > 0) {
    crosswindDir = rawCross > 0 ? 'RIGHT' : 'LEFT';
  }

  // Runway is favored if headwind > 0
  const isFavored = alongTrack > 0;

  return {
    runwayHeading,
    windDir: Number(windDir),
    windSpeed: baseSpeed,
    windGust: windGust ? Number(windGust) : null,
    angleDiff: Math.abs(Math.round(angleDiff)),
    headwind,
    tailwind,
    crosswind,
    gustCrosswind,
    crosswindDir,
    isFavored,
    isHighCrosswind: crosswind >= 15 || gustCrosswind >= 20,
    isExtremeCrosswind: crosswind >= 25 || gustCrosswind >= 30,
    isHighTailwind: tailwind >= 10,
  };
}

/**
 * Computes wind breakdown for all runway ends of an airport
 * @param {Array} runways - List of airport runways
 * @param {Object} metar - Decoded METAR object
 */
function analyzeAllRunways(runways = [], metar = {}) {
  const windDir = metar.wdir !== undefined ? metar.wdir : (metar.wind_dir || 0);
  const windSpeed = metar.wspd !== undefined ? metar.wspd : (metar.wind_speed || 0);
  const windGust = metar.wgst !== undefined ? metar.wgst : (metar.wind_gust || null);

  const runwayEnds = [];

  for (const rwy of runways) {
    // A runway entry usually has id like "18R/36L" or "09/27"
    const ids = rwy.id.split('/');
    const alignment = rwy.alignment || null; // e.g., 181 for 18R

    if (ids.length === 2) {
      const end1 = ids[0].trim();
      const end2 = ids[1].trim();

      // Parse numerical heading from ID (e.g. "18R" -> 180)
      const num1 = parseInt(end1.replace(/[^\d]/g, ''), 10) * 10;
      const num2 = parseInt(end2.replace(/[^\d]/g, ''), 10) * 10;

      // Exact alignment if available, else parsed
      const hdg1 = alignment ? alignment : num1;
      const hdg2 = alignment ? (alignment + 180) % 360 : num2;

      runwayEnds.push({
        id: end1,
        oppositeId: end2,
        pairId: rwy.id,
        heading: hdg1,
        dimension: rwy.dimension,
        surface: rwy.surface,
        windAnalysis: calculateRunwayWind(hdg1, windDir, windSpeed, windGust),
      });

      runwayEnds.push({
        id: end2,
        oppositeId: end1,
        pairId: rwy.id,
        heading: hdg2,
        dimension: rwy.dimension,
        surface: rwy.surface,
        windAnalysis: calculateRunwayWind(hdg2, windDir, windSpeed, windGust),
      });
    } else {
      // Single identifier
      const end = rwy.id.trim();
      const hdg = alignment || (parseInt(end.replace(/[^\d]/g, ''), 10) * 10);
      runwayEnds.push({
        id: end,
        pairId: rwy.id,
        heading: hdg,
        dimension: rwy.dimension,
        surface: rwy.surface,
        windAnalysis: calculateRunwayWind(hdg, windDir, windSpeed, windGust),
      });
    }
  }

  // Find best runway (highest headwind and lowest crosswind)
  let bestRunway = null;
  let bestScore = -9999;

  for (const end of runwayEnds) {
    const wa = end.windAnalysis;
    // Score based on headwind (+), tailwind penalty (---), crosswind penalty (-)
    const score = wa.headwind * 2 - wa.tailwind * 5 - wa.crosswind * 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestRunway = end.id;
    }
  }

  return {
    runwayEnds,
    bestRunway,
    windSummary: {
      direction: windDir,
      speed: windSpeed,
      gust: windGust,
    }
  };
}

module.exports = {
  calculateRunwayWind,
  analyzeAllRunways
};
