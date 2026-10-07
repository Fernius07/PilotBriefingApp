const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { fetchAirportWeather } = require('./services/weatherService');
const { fetchAirportNotams } = require('./services/notamService');
const { analyzeAllRunways } = require('./services/windCalculator');
const { fetchAirportVatsim } = require('./services/vatsimService');
const { fetchSimBriefOfp } = require('./services/simbriefService');

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
 * Health check endpoint
 */
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    app: 'PilotBriefingApp API',
    sources: ['NOAA Aviation Weather Center', 'FAA International NOTAM', 'VATSIM Network', 'SimBrief']
  });
});

/**
 * Full Complete Live Airport Briefing
 * Combines: Weather (METAR + TAF), Runways + Wind Components, NOTAMs (Decoded + Categorized), VATSIM ATC
 */
apiRouter.get('/briefing/:icao', async (req, res) => {
  const icao = (req.params.icao || '').toUpperCase().trim();
  if (!icao || icao.length < 3 || icao.length > 5) {
    return res.status(400).json({ error: 'Código ICAO inválido. Debe tener entre 3 y 5 letras.' });
  }

  try {
    // Run live queries in parallel for maximum speed
    const [weatherData, notamData, vatsimData] = await Promise.allSettled([
      fetchAirportWeather(icao),
      fetchAirportNotams(icao),
      fetchAirportVatsim(icao),
    ]);

    const weather = weatherData.status === 'fulfilled' ? weatherData.value : null;
    const notams = notamData.status === 'fulfilled' ? notamData.value : null;
    const vatsim = vatsimData.status === 'fulfilled' ? vatsimData.value : null;

    if (!weather && !notams) {
      return res.status(404).json({ error: `No se pudieron obtener datos aeronáuticos para ${icao}. Verifique el código ICAO.` });
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
    res.status(500).json({ error: `Error al procesar el briefing para ${icao}: ${err.message}` });
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
    res.status(400).json({ error: err.message || 'Error al obtener plan de SimBrief' });
  }
});

/**
 * Multi-Airport Route Briefing
 */
apiRouter.post('/route-briefing', async (req, res) => {
  const { airports } = req.body;
  if (!Array.isArray(airports) || airports.length === 0) {
    return res.status(400).json({ error: 'Debe proporcionar una lista de códigos ICAO en "airports"' });
  }

  try {
    const results = await Promise.all(
      airports.map(async (item) => {
        const icao = typeof item === 'string' ? item.toUpperCase().trim() : item.icao.toUpperCase().trim();
        const role = typeof item === 'object' ? item.role : 'STATION';

        try {
          const [weather, notams, vatsim] = await Promise.all([
            fetchAirportWeather(icao).catch(() => null),
            fetchAirportNotams(icao).catch(() => null),
            fetchAirportVatsim(icao).catch(() => null),
          ]);

          let windAnalysis = null;
          if (weather?.airport?.runways) {
            windAnalysis = analyzeAllRunways(weather.airport.runways, weather.metar || {});
          }

          return {
            icao,
            role,
            success: true,
            weather,
            windAnalysis,
            notams,
            vatsim,
          };
        } catch (e) {
          return {
            icao,
            role,
            success: false,
            error: e.message
          };
        }
      })
    );

    res.json({
      timestamp: new Date().toISOString(),
      routeBriefings: results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mount the API router at both /api and root /
// This ensures compatibility whether Vercel retains the /api prefix or strips it
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Serve static frontend build from dist if available (for standalone production Node.js)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback for non-API routes in Express 5
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

module.exports = app;
