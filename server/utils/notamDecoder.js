// Dictionary of common ICAO NOTAM abbreviations
const NOTAM_CONTRACTIONS = {
  'RWY': 'Runway',
  'CLSD': 'CLOSED',
  'TWY': 'Taxiway',
  'WIP': 'Work in progress',
  'U/S': 'Unserviceable / Out of service',
  'UNSERVICEABLE': 'Unserviceable',
  'AVBL': 'Available',
  'BTN': 'Between',
  'OPR': 'Operating / Operational',
  'OBST': 'Obstacle',
  'LGT': 'Light / Lighting',
  'LGTD': 'Lighted',
  'ALS': 'Approach Light System',
  'PAPI': 'Precision Approach Path Indicator',
  'VASI': 'Visual Approach Slope Indicator',
  'THR': 'Threshold',
  'ILS': 'Instrument Landing System',
  'GP': 'Glidepath',
  'LLZ': 'Localizer',
  'LOC': 'Localizer',
  'DME': 'Distance Measuring Equipment',
  'VOR': 'VHF Omnidirectional Range',
  'DVOR': 'Doppler VOR',
  'NDB': 'Non-Directional Beacon',
  'APRON': 'Apron / Ramp',
  'TXC': 'Taxiing',
  'AERODROME': 'Aerodrome',
  'AD': 'Aerodrome',
  'ACFT': 'Aircraft',
  'CAT': 'Category',
  'DEP': 'Departure',
  'ARR': 'Arrival',
  'ALT': 'Altitude',
  'ELEV': 'Elevation',
  'FREQ': 'Frequency',
  'FL': 'Flight Level',
  'FLT': 'Flight',
  'FATO': 'Final Approach and Take-off Area',
  'H24': 'Continuous 24 hours',
  'HJ': 'Sunrise to sunset',
  'HN': 'Sunset to sunrise',
  'HX': 'No specific working hours',
  'HO': 'Operational requirements',
  'HR': 'Hours',
  'HRS': 'Hours',
  'INFO': 'Information',
  'INTL': 'International',
  'KT': 'Knots',
  'KM': 'Kilometers',
  'M': 'Meters',
  'NM': 'Nautical Miles',
  'FT': 'Feet',
  'MAX': 'Maximum',
  'MIN': 'Minimum',
  'MSL': 'Mean Sea Level',
  'AGL': 'Above Ground Level',
  'NAV': 'Navigation',
  'OBSTN': 'Obstruction',
  'OPS': 'Operations',
  'O/R': 'On request',
  'PAX': 'Passengers',
  'PJE': 'Parachute jumping exercise',
  'PLN': 'Flight plan',
  'PROC': 'Procedure',
  'RTE': 'Route',
  'RVR': 'Runway Visual Range',
  'SFC': 'Surface',
  'SID': 'Standard Instrument Departure',
  'STAR': 'Standard Terminal Arrival Route',
  'TAXI': 'Taxiing',
  'TWR': 'Tower',
  'GND': 'Ground',
  'APP': 'Approach',
  'TFR': 'Temporary Flight Restriction',
  'MIL': 'Military',
  'CIV': 'Civil',
  'EXC': 'Except',
  'DLA': 'Delay',
  'CNL': 'Cancelled',
  'EXP': 'Expect',
  'EST': 'Estimated',
  'WEF': 'With effect from',
  'TIL': 'Until',
  'UFN': 'Until further notice',
  'PERM': 'Permanent',
  'TEMPO': 'Temporarily',
  'CRANE': 'Crane',
  'MAST': 'Mast',
  'FLG': 'Flashing',
  'RED': 'Red',
  'WHT': 'White',
  'GRN': 'Green',
  'BLU': 'Blue',
};

// Common Q-codes to classify NOTAM and human meaning
const Q_CODES = {
  'QMRLC': { category: 'RUNWAY', severity: 'CRITICAL', label: 'Runway Closed' },
  'QMRXX': { category: 'RUNWAY', severity: 'WARNING', label: 'Runway Conditions' },
  'QMXLC': { category: 'TAXIWAY', severity: 'WARNING', label: 'Taxiway Closed' },
  'QMXLT': { category: 'TAXIWAY', severity: 'CAUTION', label: 'Taxiway with Restrictions' },
  'QMXXX': { category: 'TAXIWAY', severity: 'CAUTION', label: 'Taxiway Works in Progress' },
  'QOLAS': { category: 'OBSTACLE', severity: 'WARNING', label: 'Obstacle / Crane Beacon' },
  'QOBCE': { category: 'OBSTACLE', severity: 'WARNING', label: 'Crane / Obstacle Erected' },
  'QICAS': { category: 'NAVAID', severity: 'WARNING', label: 'ILS Out of Service (U/S)' },
  'QILAS': { category: 'NAVAID', severity: 'WARNING', label: 'ILS Localizer U/S' },
  'QIGAS': { category: 'NAVAID', severity: 'WARNING', label: 'ILS Glidepath U/S' },
  'QNVAS': { category: 'NAVAID', severity: 'WARNING', label: 'VOR Out of Service' },
  'QNDAS': { category: 'NAVAID', severity: 'CAUTION', label: 'DME Out of Service' },
  'QLCAS': { category: 'LIGHTING', severity: 'WARNING', label: 'Runway Lights Inoperative' },
  'QLPAS': { category: 'LIGHTING', severity: 'CAUTION', label: 'PAPI Inoperative' },
  'QLAAS': { category: 'LIGHTING', severity: 'WARNING', label: 'ALS Approach Lights U/S' },
  'QFAXX': { category: 'GENERAL', severity: 'INFO', label: 'Aerodrome Information' },
  'QFAAH': { category: 'GENERAL', severity: 'INFO', label: 'Aerodrome Operating Hours' },
  'QRTCA': { category: 'AIRSPACE', severity: 'CRITICAL', label: 'Temporary Flight Restriction (TFR)' },
  'QRRCA': { category: 'AIRSPACE', severity: 'WARNING', label: 'Active Restricted Airspace' },
};

/**
 * Classifies NOTAM and extracts threat severity
 */
function classifyNotam(rawText, qCode = '') {
  const textUpper = (rawText || '').toUpperCase();
  const qUpper = (qCode || '').toUpperCase();

  // 1. Check known Q-code match
  for (const [code, info] of Object.entries(Q_CODES)) {
    if (qUpper.includes(code)) {
      return info;
    }
  }

  // 2. Critical keywords: Runway closures
  if (
    /RWY\s+(\d{1,2}[LRC]?(\/\d{1,2}[LRC]?)?)\s+(CLSD|CLOSED)/i.test(textUpper) ||
    /RUNWAY\s+(\d{1,2}[LRC]?(\/\d{1,2}[LRC]?)?)\s+(CLSD|CLOSED)/i.test(textUpper) ||
    textUpper.includes('RWY CLSD') ||
    textUpper.includes('RUNWAY CLOSED') ||
    textUpper.includes('ALL RWY CLSD') ||
    textUpper.includes('AD CLSD') ||
    textUpper.includes('AERODROME CLOSED')
  ) {
    return { category: 'RUNWAY', severity: 'CRITICAL', label: 'Runway / Aerodrome Closure' };
  }

  // 3. Airspace / Restrictions / TFR (Checked before general words)
  if (
    textUpper.includes('RESTRICTED AREA') ||
    textUpper.includes('AIRSPACE') ||
    textUpper.includes('TFR') ||
    textUpper.includes('PROHIBITED AREA') ||
    textUpper.includes('DANGER AREA') ||
    textUpper.includes('ZONA RESTRINGIDA')
  ) {
    return { category: 'AIRSPACE', severity: 'CRITICAL', label: 'Airspace Restriction / TFR' };
  }

  // 4. Navaids / Instrument Procedures Outages
  if (
    textUpper.includes('ILS') || textUpper.includes('LOCALIZER') ||
    textUpper.includes('GLIDEPATH') || textUpper.includes('DVOR') ||
    textUpper.includes('VOR') || textUpper.includes('DME') ||
    textUpper.includes('NDB') || textUpper.includes('APPROACH PROCEDURE')
  ) {
    const isUs = textUpper.includes('U/S') || textUpper.includes('UNSERVICEABLE') || 
                 textUpper.includes('NOT USABLE') || textUpper.includes('NOT AVBL') || 
                 textUpper.includes('ON TEST') || textUpper.includes('WITHDRAWN');
    return {
      category: 'NAVAID',
      severity: isUs ? 'WARNING' : 'CAUTION',
      label: isUs ? 'Navaid Out of Service (U/S)' : 'Navaid / Procedure Notice'
    };
  }

  // 5. Runway maintenance / conditions
  if (textUpper.includes('RWY') || textUpper.includes('RUNWAY') || textUpper.includes('THRESHOLD') || textUpper.includes('THR DISPLACED')) {
    const isWip = textUpper.includes('WIP') || textUpper.includes('WORK IN PROGRESS');
    return {
      category: 'RUNWAY',
      severity: isWip ? 'WARNING' : 'CAUTION',
      label: isWip ? 'Runway Works / Maintenance' : 'Runway Advisory'
    };
  }

  // 6. Taxiway closures / limitations
  if (textUpper.includes('TWY') || textUpper.includes('TAXIWAY') || textUpper.includes('TAXILANE')) {
    const isClosed = textUpper.includes('CLSD') || textUpper.includes('CLOSED');
    return {
      category: 'TAXIWAY',
      severity: isClosed ? 'WARNING' : 'CAUTION',
      label: isClosed ? 'Taxiway Closed' : 'Taxiway Restriction'
    };
  }

  // 7. Lighting / Visual aids
  if (
    textUpper.includes('LIGHT') || textUpper.includes('LGT') ||
    textUpper.includes('ALS') || textUpper.includes('PAPI') ||
    textUpper.includes('VASI') || textUpper.includes('APCH LGT')
  ) {
    const isUs = textUpper.includes('U/S') || textUpper.includes('UNSERVICEABLE') || textUpper.includes('SWITCHED OFF') || textUpper.includes('NOT AVBL');
    return { 
      category: 'LIGHTING', 
      severity: isUs ? 'WARNING' : 'CAUTION', 
      label: isUs ? 'Lighting Outage / PAPI Inoperative' : 'Lighting Maintenance' 
    };
  }

  // 8. Obstacles & Cranes
  if (textUpper.includes('OBST') || textUpper.includes('CRANE') || textUpper.includes('MAST') || textUpper.includes('GRÚA')) {
    return { category: 'OBSTACLE', severity: 'CAUTION', label: 'Obstacle / Crane in Area' };
  }

  return { category: 'GENERAL', severity: 'INFO', label: 'General Information' };
}

/**
 * Generates a clean plain language translation for aviation NOTAM
 */
function decodePlainLanguage(rawText) {
  if (!rawText) return '';

  let cleanText = rawText;
  const eMatch = rawText.match(/E\)\s*([\s\S]+?)(?=(?:F\)|G\)|$))/i);
  if (eMatch && eMatch[1]) {
    cleanText = eMatch[1].trim();
  }

  cleanText = cleanText.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ');

  const words = cleanText.split(/(\s+|[.,;:()/-])/);
  const decodedWords = words.map(w => {
    const upper = w.toUpperCase();
    if (NOTAM_CONTRACTIONS[upper]) {
      return NOTAM_CONTRACTIONS[upper];
    }
    return w;
  });

  return decodedWords.join('');
}

/**
 * Parses NOTAM date string into JavaScript Date object (UTC)
 * Supports 'MM/DD/YYYY HHmm' (FAA) and 'YYMMDDHHmm' (ICAO B/C format)
 */
function parseNotamDate(dateStr) {
  if (!dateStr || dateStr === 'PERM' || dateStr.includes('UFN')) return null;
  const clean = dateStr.replace('EST', '').trim();

  // Format 1: MM/DD/YYYY HHmm
  const m1 = clean.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2})(\d{2})/);
  if (m1) {
    const month = parseInt(m1[1], 10) - 1;
    const day = parseInt(m1[2], 10);
    const year = parseInt(m1[3], 10);
    const hour = parseInt(m1[4], 10);
    const min = parseInt(m1[5], 10);
    return new Date(Date.UTC(year, month, day, hour, min));
  }

  // Format 2: YYMMDDHHmm (ICAO B/C format)
  const m2 = clean.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (m2) {
    const year = 2000 + parseInt(m2[1], 10);
    const month = parseInt(m2[2], 10) - 1;
    const day = parseInt(m2[3], 10);
    const hour = parseInt(m2[4], 10);
    const min = parseInt(m2[5], 10);
    return new Date(Date.UTC(year, month, day, hour, min));
  }

  return null;
}

/**
 * Formats NOTAM date string strictly into:
 * DD/MM/YYYY HHMM UTC / HHMM LT
 */
function formatNotamDate(dateStr) {
  if (!dateStr) return '';
  const cleanStr = String(dateStr).trim();
  if (cleanStr === 'PERM' || cleanStr.includes('UFN') || cleanStr.toUpperCase() === 'PERMANENT') {
    return 'PERMANENT';
  }

  const dateObj = parseNotamDate(cleanStr);
  if (!dateObj || isNaN(dateObj.getTime())) {
    return cleanStr;
  }

  const dd = String(dateObj.getUTCDate()).padStart(2, '0');
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getUTCFullYear();
  const utcHH = String(dateObj.getUTCHours()).padStart(2, '0');
  const utcMM = String(dateObj.getUTCMinutes()).padStart(2, '0');

  const ltHH = String(dateObj.getHours()).padStart(2, '0');
  const ltMM = String(dateObj.getMinutes()).padStart(2, '0');

  return `${dd}/${mm}/${yyyy} ${utcHH}${utcMM}Z / ${ltHH}${ltMM} LT`;
}


/**
 * Evaluates whether NOTAM is active now, upcoming in 3-4h, or future
 */
function evaluateTimingStatus(startDateStr, endDateStr, isPerm, now = new Date(), windowHours = 4) {
  const start = parseNotamDate(startDateStr);
  const end = parseNotamDate(endDateStr);
  const windowEnd = new Date(now.getTime() + windowHours * 3600 * 1000);

  if (!start) {
    if (isPerm || endDateStr === 'PERM') {
      return { 
        status: 'ACTIVE_NOW', 
        isUpcoming: false, 
        label: 'ACTIVE NOW', 
        badgeColor: 'emerald',
        priority: 1 
      };
    }
  }

  if (start && start <= now) {
    if (isPerm || !end || end >= now) {
      return { 
        status: 'ACTIVE_NOW', 
        isUpcoming: false, 
        label: 'ACTIVE NOW', 
        badgeColor: 'emerald',
        priority: 1 
      };
    } else {
      return { 
        status: 'EXPIRED', 
        isUpcoming: false, 
        label: 'EXPIRED', 
        badgeColor: 'slate',
        priority: 9 
      };
    }
  }

  if (start && start > now && start <= windowEnd) {
    const diffMs = start - now;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.round((diffMs % 3600000) / 60000);
    const timeUntilStr = diffHours > 0 ? `${diffHours}h ${diffMins}m` : `${diffMins} min`;
    return {
      status: 'UPCOMING_SOON',
      isUpcoming: true,
      label: `UPCOMING (in ${timeUntilStr})`,
      timeUntilMinutes: Math.round(diffMs / 60000),
      timeUntilStr,
      badgeColor: 'amber',
      priority: 2 // Lower importance than active now
    };
  }

  return { 
    status: 'FUTURE', 
    isUpcoming: false, 
    label: 'FUTURE (> 4h)', 
    badgeColor: 'slate',
    priority: 8 
  };
}

/**
 * Extracts coordinate and delimited area/radius data from NOTAM
 * Distinguishes 3 geometry types:
 * 1. POLYGON: When NOTAM text contains >= 3 coordinate points (e.g. bounded airspace, UAS polygon).
 * 2. CIRCLE: When NOTAM has a point AND an explicit radius in text (e.g. WI 2000M RADIUS).
 * 3. POINT: When NOTAM is a specific obstacle/navaid/point without an explicit radius.
 */
function extractGeoData(rawText = '', mapPointer = null) {
  if (!rawText && !mapPointer) return null;
  const textUpper = (rawText || '').toUpperCase();

  // 1. Extract vertical limits from F) and G) lines if present
  let lowerLimit = null;
  let upperLimit = null;
  const fgMatch = textUpper.match(/F\)\s*([^\s\r\n]+)\s+G\)\s*([^\s\r\n]+)/i);
  if (fgMatch) {
    lowerLimit = fgMatch[1];
    upperLimit = fgMatch[2];
  } else {
    // Check Q-line for flight levels
    const qFLLine = textUpper.match(/Q\)\s*[^/]+\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/(\d{3})\/(\d{3})/i);
    if (qFLLine) {
      lowerLimit = qFLLine[1] === '000' ? 'SFC' : `FL${qFLLine[1]}`;
      upperLimit = `FL${qFLLine[2]}`;
    }
  }

  // 2. Extract location / city name
  let locationName = null;
  const parenLocMatch = textUpper.match(/\(([^)]+)\)\.?\s*(?:MAX\s+HGT|FOR\s+INFO|AR-|SWARM|F\)|G\)|$)/i);
  if (parenLocMatch && parenLocMatch[1].length < 40) {
    locationName = parenLocMatch[1].trim();
  } else {
    const atLocMatch = textUpper.match(/AT\s+([A-Z0-9\s-]+?)(?:\.|\s+MAX|\s+FOR|\s+F\)|\s+G\)|$)/i);
    if (atLocMatch && atLocMatch[1].length < 30 && !atLocMatch[1].startsWith('PSN')) {
      locationName = atLocMatch[1].trim();
    }
  }

  // 3. Scan NOTAM body (preferring Item E, or full text) for coordinate pairs
  const eMatch = textUpper.match(/E\)\s*([\s\S]+?)(?=(?:F\)|G\)|$))/i);
  const textToScan = eMatch ? eMatch[1] : textUpper;

  if (!locationName) {
    const afterCoordMatch = textToScan.match(/\d{4,7}[EW]\s+([A-Z0-9\s,/-]+?)(?:\.|\s+MAX|\s+FOR|\s+F\)|\s+G\)|\s+AR-|$)/i);
    if (afterCoordMatch && afterCoordMatch[1].trim().length > 2 && afterCoordMatch[1].trim().length < 40) {
      const cand = afterCoordMatch[1].replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!cand.startsWith('RMK') && !cand.startsWith('WI') && !cand.startsWith('RADIUS')) {
        locationName = cand;
      }
    }
  }

  // Coordinate regex: e.g. 513046N 0003005W or 5128N 00037W
  const coordRegex = /\b(\d{4,6}[NS])\s*(\d{4,7}[EW])\b/gi;
  const foundCoords = [];
  let match;
  while ((match = coordRegex.exec(textToScan)) !== null) {
    const parsed = parseDmsCoord(match[1], match[2]);
    if (parsed.lat !== null && parsed.lon !== null) {
      foundCoords.push({
        lat: parsed.lat,
        lon: parsed.lon,
        latStr: match[1],
        lonStr: match[2],
        fullStr: formatCoordString(match[1], match[2])
      });
    }
  }

  // 4. CHECK FOR POLYGON (Zona Acotada / Polígono)
  // When there are 3 or more coordinate points in the text:
  if (foundCoords.length >= 3) {
    // If the polygon closes itself with the same starting coordinate at the end, clean up duplicates
    const polygonPoints = [];
    foundCoords.forEach((pt, idx) => {
      if (idx === 0) {
        polygonPoints.push([pt.lat, pt.lon]);
      } else {
        const prev = polygonPoints[polygonPoints.length - 1];
        if (Math.abs(pt.lat - prev[0]) > 0.00001 || Math.abs(pt.lon - prev[1]) > 0.00001) {
          polygonPoints.push([pt.lat, pt.lon]);
        }
      }
    });

    if (polygonPoints.length >= 3) {
      const sumLat = polygonPoints.reduce((acc, p) => acc + p[0], 0);
      const sumLon = polygonPoints.reduce((acc, p) => acc + p[1], 0);
      const centroidLat = sumLat / polygonPoints.length;
      const centroidLon = sumLon / polygonPoints.length;

      return {
        hasGeo: true,
        shape: 'POLYGON',
        shapeLabel: 'Bounded Area (Polygon)',
        polygonPoints,
        lat: centroidLat,
        lon: centroidLon,
        radiusMeters: null,
        radiusNm: null,
        vertexCount: polygonPoints.length,
        lowerLimit,
        upperLimit,
        locationName,
        coordText: `${polygonPoints.length} vertices (Delimited Area)`
      };
    }
  }

  // 5. CHECK FOR EXPLICIT RADIUS (Punto y Radio de Alcance)
  // Search for radius patterns in the text:
  const radMatch = textToScan.match(/(?:WI\s+(?:AN?\s+)?(?:RADIUS\s+OF\s+)?|RADIUS\s+OF\s+|WI\s+)?(\d+(?:\.\d+)?)\s*(M|KM|NM)\s+RADIUS/i) ||
                   textToScan.match(/WI\s+(\d+(?:\.\d+)?)\s*(M|KM|NM)\s+RADIUS/i) ||
                   textToScan.match(/RADIUS\s+OF\s+(\d+(?:\.\d+)?)\s*(M|KM|NM)/i);

  let explicitRadiusMeters = null;
  let explicitRadiusNm = null;

  if (radMatch) {
    const val = parseFloat(radMatch[1]);
    const unit = radMatch[2].toUpperCase();
    if (unit === 'M') {
      explicitRadiusMeters = Math.round(val);
      explicitRadiusNm = parseFloat((val / 1852).toFixed(1));
    } else if (unit === 'KM') {
      explicitRadiusMeters = Math.round(val * 1000);
      explicitRadiusNm = parseFloat((val / 1.852).toFixed(1));
    } else if (unit === 'NM') {
      explicitRadiusNm = val;
      explicitRadiusMeters = Math.round(val * 1852);
    }
  }

  // Determine the primary coordinate:
  let primaryLat = null;
  let primaryLon = null;
  let primaryCoordText = null;

  if (foundCoords.length > 0) {
    primaryLat = foundCoords[0].lat;
    primaryLon = foundCoords[0].lon;
    primaryCoordText = foundCoords[0].fullStr;
  } else {
    // Check Q-line: Q) ... /latlon
    const qMatch = textUpper.match(/Q\)\s*[^/]+\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/\d{3}\/\d{3}\/(\d{4}[NS])(\d{5}[EW])/i);
    if (qMatch) {
      const parsed = parseDmsCoord(qMatch[1], qMatch[2]);
      primaryLat = parsed.lat;
      primaryLon = parsed.lon;
      primaryCoordText = formatCoordString(qMatch[1], qMatch[2]);
    } else if (mapPointer && typeof mapPointer === 'string') {
      const ptMatch = mapPointer.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (ptMatch) {
        primaryLon = parseFloat(ptMatch[1]);
        primaryLat = parseFloat(ptMatch[2]);
        primaryCoordText = `${primaryLat.toFixed(4)}°, ${primaryLon.toFixed(4)}°`;
      }
    }
  }

  if (primaryLat === null || primaryLon === null) {
    return null;
  }

  // If explicit radius is present in text:
  if (explicitRadiusMeters && explicitRadiusMeters > 0) {
    return {
      hasGeo: true,
      shape: 'CIRCLE',
      shapeLabel: 'Specific Point & Nautical Radius',
      lat: primaryLat,
      lon: primaryLon,
      radiusMeters: explicitRadiusMeters,
      radiusNm: explicitRadiusNm,
      lowerLimit,
      upperLimit,
      locationName,
      coordText: primaryCoordText
    };
  }

  // Otherwise, it is a single concrete point:
  return {
    hasGeo: true,
    shape: 'POINT',
    shapeLabel: 'Single Concrete Point',
    lat: primaryLat,
    lon: primaryLon,
    radiusMeters: null,
    radiusNm: null,
    lowerLimit,
    upperLimit,
    locationName,
    coordText: primaryCoordText
  };
}

function parseDmsCoord(latStr, lonStr) {
  let lat = null, lon = null;
  const latClean = (latStr || '').trim().toUpperCase();
  const lonClean = (lonStr || '').trim().toUpperCase();

  if (latClean.length === 7) { // 402610N
    const d = parseInt(latClean.slice(0, 2), 10);
    const m = parseInt(latClean.slice(2, 4), 10);
    const s = parseInt(latClean.slice(4, 6), 10);
    lat = (d + m / 60 + s / 3600) * (latClean.endsWith('N') ? 1 : -1);
  } else if (latClean.length === 5) { // 4026N
    const d = parseInt(latClean.slice(0, 2), 10);
    const m = parseInt(latClean.slice(2, 4), 10);
    lat = (d + m / 60) * (latClean.endsWith('N') ? 1 : -1);
  }

  if (lonClean.length === 8) { // 0033558W
    const d = parseInt(lonClean.slice(0, 3), 10);
    const m = parseInt(lonClean.slice(3, 5), 10);
    const s = parseInt(lonClean.slice(5, 7), 10);
    lon = (d + m / 60 + s / 3600) * (lonClean.endsWith('E') ? 1 : -1);
  } else if (lonClean.length === 7) { // 033558W
    const d = parseInt(lonClean.slice(0, 2), 10);
    const m = parseInt(lonClean.slice(2, 4), 10);
    const s = parseInt(lonClean.slice(4, 6), 10);
    lon = (d + m / 60 + s / 3600) * (lonClean.endsWith('E') ? 1 : -1);
  } else if (lonClean.length === 6) { // 00335W
    const d = parseInt(lonClean.slice(0, 3), 10);
    const m = parseInt(lonClean.slice(3, 5), 10);
    lon = (d + m / 60) * (lonClean.endsWith('E') ? 1 : -1);
  } else if (lonClean.length === 5) { // 0335W
    const d = parseInt(lonClean.slice(0, 2), 10);
    const m = parseInt(lonClean.slice(2, 4), 10);
    lon = (d + m / 60) * (lonClean.endsWith('E') ? 1 : -1);
  }

  return { lat, lon };
}

function formatCoordString(latStr, lonStr) {
  if (latStr.length === 7 && lonStr.length === 8) {
    return `${latStr.slice(0, 2)}°${latStr.slice(2, 4)}'${latStr.slice(4, 6)}"${latStr.slice(6)} ${lonStr.slice(0, 3)}°${lonStr.slice(3, 5)}'${lonStr.slice(5, 7)}"${lonStr.slice(7)}`;
  }
  return `${latStr} ${lonStr}`;
}

/**
 * Builds an Executive Operational Impact Summary for flight crews
 * ONLY considers impacts active now or upcoming in the next 3-4 hours!
 */
function buildOperationalSummary(processedNotams = [], icao = '', now = new Date(), windowHours = 4) {
  const impacts = [];
  const checklist = [];

  // Filter ONLY NOTAMs that impact today within the 3-4 hour window:
  // (timingStatus === 'ACTIVE_NOW' or 'UPCOMING_SOON')
  const relevantNotams = processedNotams.filter(n => {
    return n.timing && (n.timing.status === 'ACTIVE_NOW' || n.timing.status === 'UPCOMING_SOON');
  });

  const closedRunwaysActive = new Set();
  const closedRunwaysUpcoming = new Set();
  const closedTaxiwaysActive = new Set();
  const closedTaxiwaysUpcoming = new Set();
  const navaidOutages = [];
  const lightingOutages = [];
  const airspaceRestrictions = [];
  const cranesObstacles = [];

  for (const n of relevantNotams) {
    const textUpper = (n.rawText || '').toUpperCase();
    const plain = n.plainText || '';
    const isUpcoming = n.timing.isUpcoming;

    // 1. RUNWAY CLOSURES & IMPACTS
    if (n.category === 'RUNWAY') {
      const rwyMatch = textUpper.match(/(?:RWY|RUNWAY)\s*(\d{1,2}[LRC]?(?:\/\d{1,2}[LRC]?)?)/i);
      const rwyIdent = rwyMatch ? rwyMatch[1].toUpperCase() : null;

      if (n.severity === 'CRITICAL' || textUpper.includes('CLSD') || textUpper.includes('CLOSED')) {
        const title = rwyIdent ? `Runway ${rwyIdent} CLOSED` : `Runway CLOSED`;
        if (rwyIdent) {
          if (isUpcoming) closedRunwaysUpcoming.add(rwyIdent);
          else closedRunwaysActive.add(rwyIdent);
        }

        impacts.push({
          id: n.id,
          type: 'RUNWAY_CLOSURE',
          severity: isUpcoming ? 'WARNING' : 'CRITICAL',
          isUpcoming,
          timingLabel: n.timing.label,
          affectedItem: rwyIdent ? `RWY ${rwyIdent}` : 'RUNWAY',
          title: isUpcoming ? `[UPCOMING] ${title}` : title,
          description: plain,
          crewAdvice: isUpcoming
            ? `Scheduled closure in ${n.timing.timeUntilStr || '3h'}. If arrival/departure window coincides, recalculate performance for alternate runway.`
            : 'Runway closed at this time. Exclude from EFB takeoff and landing performance calculations.',
          notamNumber: n.number || n.id,
          startDate: n.startDate,
          endDate: n.endDate,
          startDateFormatted: formatNotamDate(n.startDate),
          endDateFormatted: formatNotamDate(n.endDate),
          validity: `${formatNotamDate(n.startDate)} to ${formatNotamDate(n.endDate)}`,
          rawText: n.rawText,
          plainText: n.plainText,
          geo: n.geo || null
        });
      } else {
        impacts.push({
          id: n.id,
          type: 'RUNWAY_RESTRICTION',
          severity: isUpcoming ? 'CAUTION' : n.severity,
          isUpcoming,
          timingLabel: n.timing.label,
          affectedItem: rwyIdent ? `RWY ${rwyIdent}` : 'RUNWAY',
          title: rwyIdent ? `Restriction on Runway ${rwyIdent}` : `Runway Works / Restriction`,
          description: plain,
          crewAdvice: 'Caution on runway. Review declared distances and surface conditions.',
          notamNumber: n.number || n.id,
          startDate: n.startDate,
          endDate: n.endDate,
          startDateFormatted: formatNotamDate(n.startDate),
          endDateFormatted: formatNotamDate(n.endDate),
          validity: `${formatNotamDate(n.startDate)} to ${formatNotamDate(n.endDate)}`,
          rawText: n.rawText,
          plainText: n.plainText,
          geo: n.geo || null
        });
      }
    }

    // 2. NAVAID & INSTRUMENT APPROACH IMPACTS
    else if (n.category === 'NAVAID') {
      const isOutage = n.severity === 'WARNING' || textUpper.includes('U/S') || textUpper.includes('NOT USABLE') || textUpper.includes('ON TEST');
      const rwyMatch = textUpper.match(/(?:RWY|RUNWAY)\s*(\d{1,2}[LRC]?)/i);
      const rwy = rwyMatch ? `RWY ${rwyMatch[1]}` : '';

      let navaidName = 'Navaid';
      if (textUpper.includes('ILS')) navaidName = `ILS ${rwy}`.trim();
      else if (textUpper.includes('GLIDEPATH') || textUpper.includes('GP')) navaidName = `Glidepath (GP) ${rwy}`.trim();
      else if (textUpper.includes('LOCALIZER') || textUpper.includes('LLZ') || textUpper.includes('LOC')) navaidName = `Localizer (LOC) ${rwy}`.trim();
      else if (textUpper.includes('DVOR') || textUpper.includes('VOR')) navaidName = 'VOR';
      else if (textUpper.includes('DME')) navaidName = 'DME';

      const title = isOutage 
        ? `${navaidName} OUT OF SERVICE (U/S)` 
        : `Operational Advisory for ${navaidName}`;

      impacts.push({
        id: n.id,
        type: 'NAVAID_OUTAGE',
        severity: isUpcoming ? 'CAUTION' : (isOutage ? 'WARNING' : 'CAUTION'),
        isUpcoming,
        timingLabel: n.timing.label,
        affectedItem: navaidName,
        title: isUpcoming ? `[UPCOMING] ${title}` : title,
        description: plain,
        crewAdvice: isOutage 
          ? (isUpcoming 
              ? `Out of service starting in ${n.timing.timeUntilStr || '3h'}. Expect higher approach minima for later arrivals.`
              : 'Do not use for precision approaches. Plan RNP/VOR approach or increase visibility minima.')
          : 'Verify calibration status prior to approach.',
        notamNumber: n.number || n.id,
        startDate: n.startDate,
        endDate: n.endDate,
        startDateFormatted: formatNotamDate(n.startDate),
        endDateFormatted: formatNotamDate(n.endDate),
        validity: `${formatNotamDate(n.startDate)} to ${formatNotamDate(n.endDate)}`,
        rawText: n.rawText,
        plainText: n.plainText,
        geo: n.geo || null
      });
      navaidOutages.push(navaidName);
    }

    // 3. TAXIWAY & APRON RESTRICTIONS
    else if (n.category === 'TAXIWAY') {
      const twyMatch = textUpper.match(/(?:TWY|TAXIWAY)\s*([A-Z0-9]+)/i);
      const twyIdent = twyMatch ? twyMatch[1].toUpperCase() : 'TAXIWAY';

      const isClosed = textUpper.includes('CLSD') || textUpper.includes('CLOSED');
      if (isClosed) {
        if (isUpcoming) closedTaxiwaysUpcoming.add(twyIdent);
        else closedTaxiwaysActive.add(twyIdent);
      }

      impacts.push({
        id: n.id,
        type: 'TAXIWAY_CLOSURE',
        severity: isUpcoming ? 'CAUTION' : (isClosed ? 'WARNING' : 'CAUTION'),
        isUpcoming,
        timingLabel: n.timing.label,
        affectedItem: `TWY ${twyIdent}`,
        title: isClosed 
          ? (isUpcoming ? `[UPCOMING] Taxiway ${twyIdent} CLOSED` : `Taxiway ${twyIdent} CLOSED`)
          : `Restriction on Taxiway ${twyIdent}`,
        description: plain,
        crewAdvice: 'Plan taxi route with ATC avoiding closed segments.',
        notamNumber: n.number || n.id,
        startDate: n.startDate,
        endDate: n.endDate,
        startDateFormatted: formatNotamDate(n.startDate),
        endDateFormatted: formatNotamDate(n.endDate),
        validity: `${formatNotamDate(n.startDate)} to ${formatNotamDate(n.endDate)}`,
        rawText: n.rawText,
        plainText: n.plainText,
        geo: n.geo || null
      });
    }

    // 4. LIGHTING & VISUAL AIDS
    else if (n.category === 'LIGHTING') {
      const isPapi = textUpper.includes('PAPI');
      const isAls = textUpper.includes('ALS') || textUpper.includes('APPROACH LIGHT');
      const affectedItem = isPapi ? 'PAPI' : isAls ? 'ALS' : 'LIGHTS';

      impacts.push({
        id: n.id,
        type: 'LIGHTING_ISSUE',
        severity: isUpcoming ? 'CAUTION' : n.severity,
        isUpcoming,
        timingLabel: n.timing.label,
        affectedItem,
        title: isUpcoming ? `[UPCOMING] Outage on ${affectedItem}` : `Failure / Maintenance on ${affectedItem}`,
        description: plain,
        crewAdvice: isPapi 
          ? 'Visual glidepath guidance inoperative. Plan barometric or ILS approach.' 
          : 'Approach visibility minima may be increased.',
        notamNumber: n.number || n.id,
        startDate: n.startDate,
        endDate: n.endDate,
        startDateFormatted: formatNotamDate(n.startDate),
        endDateFormatted: formatNotamDate(n.endDate),
        validity: `${formatNotamDate(n.startDate)} to ${formatNotamDate(n.endDate)}`,
        rawText: n.rawText,
        plainText: n.plainText,
        geo: n.geo || null
      });
      lightingOutages.push(affectedItem);
    }

    // 5. AIRSPACE & SPECIAL RESTRICTIONS
    else if (n.category === 'AIRSPACE') {
      impacts.push({
        id: n.id,
        type: 'AIRSPACE_HAZARD',
        severity: isUpcoming ? 'WARNING' : 'CRITICAL',
        isUpcoming,
        timingLabel: n.timing.label,
        affectedItem: 'AIRSPACE',
        title: isUpcoming ? '[UPCOMING] Temporary Flight Restriction (TFR)' : 'Temporary Flight Restriction (TFR) Active',
        description: plain,
        crewAdvice: 'Avoid delimited airspace volume. Comply strictly with ATC instructions.',
        notamNumber: n.number || n.id,
        startDate: n.startDate,
        endDate: n.endDate,
        startDateFormatted: formatNotamDate(n.startDate),
        endDateFormatted: formatNotamDate(n.endDate),
        validity: `${formatNotamDate(n.startDate)} to ${formatNotamDate(n.endDate)}`,
        rawText: n.rawText,
        plainText: n.plainText,
        geo: n.geo || null
      });
      airspaceRestrictions.push(n.number);
    }

    // 6. OBSTACLES & CRANES
    else if (n.category === 'OBSTACLE') {
      const heightMatch = textUpper.match(/(\d+)\s*(?:FT|M)/i);
      const height = heightMatch ? heightMatch[0] : '';
      cranesObstacles.push(height);

      impacts.push({
        id: n.id,
        type: 'OBSTACLE_ALERT',
        severity: 'CAUTION',
        isUpcoming,
        timingLabel: n.timing.label,
        affectedItem: 'CRANE / OBSTACLE',
        title: `Obstacle / Crane in Vicinity ${height ? `(${height})` : ''}`,
        description: plain,
        crewAdvice: 'Maintain visual vigilance for obstacles during visual maneuvers and traffic circuit.',
        notamNumber: n.number || n.id,
        startDate: n.startDate,
        endDate: n.endDate,
        startDateFormatted: formatNotamDate(n.startDate),
        endDateFormatted: formatNotamDate(n.endDate),
        validity: `${formatNotamDate(n.startDate)} to ${formatNotamDate(n.endDate)}`,
        rawText: n.rawText,
        plainText: n.plainText,
        geo: n.geo || null
      });
    }
  }

  // Sort impacts: Currently ACTIVE first, UPCOMING second
  impacts.sort((a, b) => {
    if (a.isUpcoming !== b.isUpcoming) {
      return a.isUpcoming ? 1 : -1; // Active first
    }
    const sevRank = { 'CRITICAL': 3, 'WARNING': 2, 'CAUTION': 1 };
    return (sevRank[b.severity] || 0) - (sevRank[a.severity] || 0);
  });

  // Calculate Overall Level
  let overallLevel = 'LOW';
  if (closedRunwaysActive.size > 0 || (airspaceRestrictions.length > 0 && !impacts.find(i => i.type === 'AIRSPACE_HAZARD')?.isUpcoming)) {
    overallLevel = 'CRITICAL';
  } else if (navaidOutages.length > 0 || closedTaxiwaysActive.size > 0) {
    overallLevel = 'HIGH';
  } else if (closedRunwaysUpcoming.size > 0 || lightingOutages.length > 0) {
    overallLevel = 'MODERATE';
  }

  // Headline in English
  let headline = 'Normal operations at this time with no immediate critical closures.';
  if (closedRunwaysActive.size > 0) {
    headline = `WARNING! Runways closed at this time: ${Array.from(closedRunwaysActive).join(', ')}.`;
  } else if (closedRunwaysUpcoming.size > 0) {
    headline = `Runways currently operational. Scheduled closure in upcoming hours: ${Array.from(closedRunwaysUpcoming).join(', ')}.`;
  } else if (navaidOutages.length > 0) {
    headline = `Active navaid restrictions: ${navaidOutages.slice(0, 3).join(', ')} out of service.`;
  } else if (closedTaxiwaysActive.size > 0) {
    headline = `Active taxiway closures: ${Array.from(closedTaxiwaysActive).slice(0, 4).join(', ')}.`;
  }

  // Build Crew Checklist bullet points in English
  if (closedRunwaysActive.size > 0) {
    checklist.push({
      icon: 'ban',
      level: 'CRITICAL',
      timing: 'NOW',
      text: `[ACTIVE NOW] Unavailable runways: ${Array.from(closedRunwaysActive).join(', ')}. Exclude from EFB calculations.`
    });
  }
  if (closedRunwaysUpcoming.size > 0) {
    checklist.push({
      icon: 'clock',
      level: 'WARNING',
      timing: 'UPCOMING',
      text: `[UPCOMING] Scheduled runway closure in 3-4h: ${Array.from(closedRunwaysUpcoming).join(', ')}. Verify estimated arrival/departure time.`
    });
  }
  if (navaidOutages.length > 0) {
    checklist.push({
      icon: 'radio',
      level: 'WARNING',
      timing: 'NOW',
      text: `Navaid(s) U/S or on test: ${navaidOutages.slice(0, 3).join(', ')}. Increase approach minima or plan RNP approach.`
    });
  }
  if (closedTaxiwaysActive.size > 0) {
    checklist.push({
      icon: 'alert-triangle',
      level: 'WARNING',
      timing: 'NOW',
      text: `[ACTIVE NOW] Closed taxiways: ${Array.from(closedTaxiwaysActive).slice(0, 5).join(', ')}. Coordinate taxi route with ATC.`
    });
  }
  if (closedTaxiwaysUpcoming.size > 0) {
    checklist.push({
      icon: 'clock',
      level: 'CAUTION',
      timing: 'UPCOMING',
      text: `[UPCOMING] Taxiway closures in upcoming hours: ${Array.from(closedTaxiwaysUpcoming).slice(0, 4).join(', ')}.`
    });
  }
  if (lightingOutages.length > 0) {
    checklist.push({
      icon: 'lightbulb',
      level: 'CAUTION',
      timing: 'NOW',
      text: `Visual aids affected: ${lightingOutages.slice(0, 3).join(', ')}. Expect higher visibility requirement on night/IFR approach.`
    });
  }
  if (airspaceRestrictions.length > 0) {
    checklist.push({
      icon: 'shield-alert',
      level: 'CRITICAL',
      timing: 'NOW',
      text: `Airspace temporarily restricted in vicinity. Monitor radar frequencies.`
    });
  }
  if (cranesObstacles.length > 0) {
    checklist.push({
      icon: 'alert-circle',
      level: 'CAUTION',
      timing: 'NOW',
      text: `${cranesObstacles.length} crane(s) / obstacle(s) erected in vicinity. Maintain visual vigilance.`
    });
  }

  if (checklist.length === 0) {
    checklist.push({
      icon: 'check',
      level: 'INFO',
      timing: 'NOW',
      text: 'No immediate critical flight restrictions detected at this aerodrome for the next 3-4 hours.'
    });
  }

  return {
    overallLevel,
    headline,
    timeWindowHours: windowHours,
    summaryStats: {
      closedRunwaysActiveCount: closedRunwaysActive.size,
      closedRunwaysActiveList: Array.from(closedRunwaysActive),
      closedRunwaysUpcomingCount: closedRunwaysUpcoming.size,
      closedRunwaysUpcomingList: Array.from(closedRunwaysUpcoming),
      closedTaxiwaysActiveCount: closedTaxiwaysActive.size,
      closedTaxiwaysActiveList: Array.from(closedTaxiwaysActive),
      closedTaxiwaysUpcomingCount: closedTaxiwaysUpcoming.size,
      closedTaxiwaysUpcomingList: Array.from(closedTaxiwaysUpcoming),
      navaidOutagesCount: navaidOutages.length,
      lightingOutagesCount: lightingOutages.length,
      airspaceRestrictionsCount: airspaceRestrictions.length,
      cranesCount: cranesObstacles.length,
      relevantNotamsCount: relevantNotams.length,
      totalNotamsAnalyzed: processedNotams.length,
      activeNowCount: relevantNotams.filter(n => !n.timing.isUpcoming).length,
      upcomingCount: relevantNotams.filter(n => n.timing.isUpcoming).length,
    },
    keyImpacts: impacts.slice(0, 12),
    crewChecklist: checklist,
  };
}

module.exports = {
  classifyNotam,
  decodePlainLanguage,
  parseNotamDate,
  formatNotamDate,
  evaluateTimingStatus,
  extractGeoData,
  buildOperationalSummary,
  NOTAM_CONTRACTIONS
};
