// Ensure Node.js does not abort on FAA / government intermediate SSL certificates (critical for Vercel/cloud environments)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { 
  classifyNotam, 
  decodePlainLanguage, 
  buildOperationalSummary,
  extractGeoData,
  evaluateTimingStatus,
  formatNotamDate
} = require('../utils/notamDecoder');

/**
 * Real-time NOTAM fetcher and intelligent analyzer
 * Queries official FAA International NOTAM system
 */
async function fetchAirportNotams(icao) {
  const code = (icao || '').toUpperCase().trim();
  if (!code) throw new Error('ICAO code is required');

  const url = 'https://notams.aim.faa.gov/notamSearch/search';
  const body = `searchType=0&designatorsForLocation=${encodeURIComponent(code)}`;

  let sessionCookie = 'DR_SITE_PM=https://notams.aim.faa.gov/notamSearch/;';

  const buildHeaders = (cookie) => ({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': 'https://notams.aim.faa.gov/notamSearch/',
    'Origin': 'https://notams.aim.faa.gov',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Cookie': cookie || sessionCookie
  });

  let rawNotams = [];
  try {
    console.log(`[NOTAM Service] Querying FAA NOTAM system for: ${code}...`);
    let res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(sessionCookie),
      body
    });

    // If 403 or non-200, attempt dynamic session cookie handshake from main search page
    if (!res.ok) {
      console.warn(`[NOTAM Service] Initial POST returned ${res.status}. Refreshing FAA session cookie...`);
      try {
        const handshakeRes = await fetch('https://notams.aim.faa.gov/notamSearch/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });
        const dynamicCookie = handshakeRes.headers.get('set-cookie');
        if (dynamicCookie) {
          sessionCookie = dynamicCookie;
        }
        res = await fetch(url, {
          method: 'POST',
          headers: buildHeaders(sessionCookie),
          body
        });
      } catch (handshakeErr) {
        console.warn('[NOTAM Service] FAA handshake attempt error:', handshakeErr.message);
      }
    }

    console.log(`[NOTAM Service] FAA Response status for ${code}: ${res.status}`);

    if (res.ok) {
      const data = await res.json();
      rawNotams = data.notamList || [];
      console.log(`[NOTAM Service] Received ${rawNotams.length} NOTAMs for ${code} (total count in feed: ${data.totalNotamCount})`);
    } else {
      console.warn(`[NOTAM Service] FAA NOTAM endpoint returned status ${res.status} for ${code}`);
    }
  } catch (err) {
    console.error(`[NOTAM Service] Error requesting NOTAMs for ${code}:`, err.message);
  }

  // Process and decode NOTAMs
  const processedNotams = rawNotams.map((item, index) => {
    const rawMessage = item.icaoMessage || item.traditionalMessage || '';
    const qMatch = rawMessage.match(/Q\)\s*([^/\s]+)/i);
    const qCode = qMatch ? qMatch[1] : '';

    const classification = classifyNotam(rawMessage, qCode);
    const plainText = decodePlainLanguage(rawMessage) || item.traditionalMessageFrom4thWord || rawMessage;
    const geo = extractGeoData(rawMessage, item.mapPointer);
    const timing = evaluateTimingStatus(item.startDate, item.endDate, item.endDate === 'PERM');
    const startDateFormatted = formatNotamDate(item.startDate);
    const endDateFormatted = formatNotamDate(item.endDate);

    return {
      id: item.notamNumber || `NOTAM-${index + 1}`,
      facility: item.facilityDesignator || code,
      number: item.notamNumber || '',
      issueDate: item.issueDate || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      startDateFormatted,
      endDateFormatted,
      isPermanent: item.endDate === 'PERM',
      rawText: rawMessage,
      plainText: plainText.trim(),
      category: classification.category,
      severity: classification.severity,
      threatLabel: classification.label,
      featureName: item.featureName || '',
      keyword: item.keyword || '',
      coordinates: item.mapPointer || null,
      geo,
      timing,
    };
  });

  // Severity rank for sorting: CRITICAL > WARNING > CAUTION > INFO
  const severityRank = {
    'CRITICAL': 4,
    'WARNING': 3,
    'CAUTION': 2,
    'INFO': 1
  };

  // Sort critical threats first
  processedNotams.sort((a, b) => {
    const diff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
    if (diff !== 0) return diff;
    return (b.startDate || '').localeCompare(a.startDate || '');
  });

  // Statistics summary
  const summary = {
    total: processedNotams.length,
    critical: processedNotams.filter(n => n.severity === 'CRITICAL').length,
    warning: processedNotams.filter(n => n.severity === 'WARNING').length,
    caution: processedNotams.filter(n => n.severity === 'CAUTION').length,
    runwayAlerts: processedNotams.filter(n => n.category === 'RUNWAY').length,
    taxiwayAlerts: processedNotams.filter(n => n.category === 'TAXIWAY').length,
    lightingAlerts: processedNotams.filter(n => n.category === 'LIGHTING').length,
    obstacleAlerts: processedNotams.filter(n => n.category === 'OBSTACLE').length,
    navaidAlerts: processedNotams.filter(n => n.category === 'NAVAID').length,
    airspaceAlerts: processedNotams.filter(n => n.category === 'AIRSPACE').length,
  };

  // Build Executive Operational Impact Summary for flight crews (filtered to 3-4h window)
  const now = new Date();
  const operationalImpact = buildOperationalSummary(processedNotams, code, now, 4);

  return {
    icao: code,
    timestamp: new Date().toISOString(),
    summary,
    operationalImpact,
    notams: processedNotams
  };
}

module.exports = {
  fetchAirportNotams
};
