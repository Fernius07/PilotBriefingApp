// Ensure Node.js does not abort on FAA / government intermediate SSL certificates in cloud environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { fetchAirportWeather } = require('./services/weatherService');
const { fetchAirportNotams } = require('./services/notamService');
const { analyzeAllRunways } = require('./services/windCalculator');
const { fetchAirportVatsim } = require('./services/vatsimService');
const { fetchSimBriefOfp } = require('./services/simbriefService');
const { verifySecurityToken } = require('./utils/security');

const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Create API router for modularity and dual mounting (/api and /)
const apiRouter = express.Router();

/**
 * Anti-scraping & Anti-inspection Security Middleware
 * Blocks direct URL bar navigation, external unauthorized scrapers, and bot extractors
 */
apiRouter.use((req, res, next) => {
  // Allow health check and debug endpoints freely
  if (req.path === '/health' || req.path.includes('debug-notam') || (req.originalUrl && req.originalUrl.includes('debug-notam'))) {
    return next();
  }

  // If someone directly pastes the API URL in their browser tab, redirect to the app homepage
  const secFetchDest = req.headers['sec-fetch-dest'];
  const acceptHeader = req.headers['accept'] || '';
  if (secFetchDest === 'document' || (acceptHeader.includes('text/html') && !req.headers['x-pilot-auth'])) {
    return res.redirect('/');
  }

  // Verify internal cryptographic signature token
  const isValid = verifySecurityToken(req);
  if (!isValid) {
    console.warn(`[Security Alert] Blocked unauthorized API request to ${req.originalUrl} from IP: ${req.ip}`);
    return res.status(403).json({
      error: 'Forbidden: Direct API access is restricted. Use the official PilotBriefingApp web interface.',
      code: 'UNAUTHORIZED_ACCESS'
    });
  }

  next();
});

/**
 * Health check endpoint
 */
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    app: 'PilotBriefingApp API',
    sources: ['NOAA Aviation Weather Center', 'FAA International NOTAM System', 'VATSIM Network', 'SimBrief']
  });
});

/**
 * Live FAA Upstream Diagnostic Route (Exempt from security token)
 * Allows developers and pilots to inspect raw FAA upstream responses in real-time
 */
apiRouter.get('/debug-notam/:icao', async (req, res) => {
  const icao = (req.params.icao || '').toUpperCase().trim();
  const start = Date.now();
  const url = 'https://notams.aim.faa.gov/notamSearch/search';
  const body = `searchType=0&designatorsForLocation=${encodeURIComponent(icao)}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const upstreamRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://notams.aim.faa.gov/notamSearch/',
        'Origin': 'https://notams.aim.faa.gov',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Cookie': 'DR_SITE_PM=https://notams.aim.faa.gov/notamSearch/;'
      },
      body,
      signal: controller.signal
    });
    clearTimeout(timeout);

    const text = await upstreamRes.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (_) {}

    res.json({
      icao,
      durationMs: Date.now() - start,
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      ok: upstreamRes.ok,
      headers: Object.fromEntries(upstreamRes.headers.entries()),
      isJson: !!parsed,
      totalNotamCount: parsed?.totalNotamCount,
      notamListLength: parsed?.notamList?.length || 0,
      preview: parsed ? parsed.notamList?.slice(0, 3) : text.slice(0, 500)
    });
  } catch (err) {
    res.status(500).json({
      icao,
      durationMs: Date.now() - start,
      error: err.message,
      stack: err.stack
    });
  }
});

/**
 * Full Complete Live Airport Briefing
 * Combines: Weather (METAR + TAF), Runways + Wind Components, NOTAMs (Decoded + Categorized), VATSIM ATC
 */
apiRouter.get('/briefing/:icao', async (req, res) => {
  const icao = (req.params.icao || '').toUpperCase().trim();
  if (!icao || icao.length < 3 || icao.length > 5) {
    return res.status(400).json({ error: 'Invalid ICAO code. Must be between 3 and 5 characters.' });
  }

  try {
    // Run live queries in parallel for maximum performance
    const [weatherData, notamData, vatsimData] = await Promise.allSettled([
      fetchAirportWeather(icao),
      fetchAirportNotams(icao),
      fetchAirportVatsim(icao),
    ]);

    const weather = weatherData.status === 'fulfilled' ? weatherData.value : null;
    const notams = notamData.status === 'fulfilled' ? notamData.value : null;
    const vatsim = vatsimData.status === 'fulfilled' ? vatsimData.value : null;

    if (!weather && !notams) {
      return res.status(404).json({ error: `Could not obtain aeronautical data for ${icao}. Please verify the ICAO code.` });
    }

    // Calculate runway wind components based on real METAR
    let windAnalysis = null;
    if (weather && weather.airport && weather.airport.runways) {
      windAnalysis = analyzeAllRunways(weather.airport.runways, weather.metar || {});
    }

    res.json({
      icao,
      timestamp: new Date().toISOString(),
      weather,
      windAnalysis,
      notams,
      vatsim,
    });
  } catch (err) {
    console.error(`Briefing error for ${icao}:`, err);
    res.status(500).json({ error: `Error processing briefing for ${icao}: ${err.message}` });
  }
});

/**
 * Real-time Weather Only
 */
apiRouter.get('/weather/:icao', async (req, res) => {
  const icao = (req.params.icao || '').toUpperCase().trim();
  try {
    const data = await fetchAirportWeather(icao);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Real-time NOTAMs Only
 */
apiRouter.get('/notams/:icao', async (req, res) => {
  const icao = (req.params.icao || '').toUpperCase().trim();
  try {
    const data = await fetchAirportNotams(icao);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Real-time VATSIM ATC & Traffic
 */
apiRouter.get('/vatsim/:icao', async (req, res) => {
  const icao = (req.params.icao || '').toUpperCase().trim();
  try {
    const data = await fetchAirportVatsim(icao);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Real-time SimBrief OFP Import
 */
apiRouter.get('/simbrief/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const ofp = await fetchSimBriefOfp(username);
    res.json(ofp);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Error fetching SimBrief flight plan' });
  }
});

// Serve static frontend build from dist if available (for standalone production Node.js like Render/Railway)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Mount the API router at /api
app.use('/api', apiRouter);

// SPA fallback for non-API routes in Express 5 (serving React client)
if (fs.existsSync(distPath)) {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

module.exports = app;
