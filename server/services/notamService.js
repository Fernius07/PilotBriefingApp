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

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  let rawNotams = [];
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body
    });

    if (res.ok) {
      const data = await res.json();
      rawNotams = data.notamList || [];
    } else {
      console.warn(`FAA NOTAM endpoint returned status ${res.status} for ${code}`);
    }
  } catch (err) {
    console.error(`Error requesting NOTAMs for ${code}:`, err.message);
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
