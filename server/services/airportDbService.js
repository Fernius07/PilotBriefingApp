const fs = require('fs');
const path = require('path');

// Ensure Node.js does not abort on intermediate certificates if downloading
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DATA_DIR = path.join(__dirname, '../data/ourairports');

const CSV_SOURCES = {
  airports: 'https://davidmegginson.github.io/ourairports-data/airports.csv',
  frequencies: 'https://davidmegginson.github.io/ourairports-data/airport-frequencies.csv',
  runways: 'https://davidmegginson.github.io/ourairports-data/runways.csv',
  navaids: 'https://davidmegginson.github.io/ourairports-data/navaids.csv',
  countries: 'https://davidmegginson.github.io/ourairports-data/countries.csv',
  regions: 'https://davidmegginson.github.io/ourairports-data/regions.csv',
};

const SURFACE_LABELS = {
  'ASP': 'Asphalt',
  'ASPH': 'Asphalt',
  'CON': 'Concrete',
  'CONC': 'Concrete',
  'BIT': 'Bitumen',
  'GRS': 'Grass / Turf',
  'TURF': 'Turf',
  'GRV': 'Gravel',
  'GRE': 'Gravel / Earth',
  'DIRT': 'Dirt',
  'SAN': 'Sand',
  'WAT': 'Water',
  'MAC': 'Macadam',
  'COR': 'Coral',
  'LAT': 'Laterite',
  'CLAY': 'Clay',
  'ICE': 'Ice / Snow',
  'MAT': 'PSP Metal Mat',
};

const AIRPORT_TYPE_LABELS = {
  'large_airport': 'Large International Airport',
  'medium_airport': 'Medium Regional Airport',
  'small_airport': 'Small Civil Aerodrome',
  'heliport': 'Heliport',
  'seaplane_base': 'Seaplane Base',
  'balloonport': 'Balloonport',
  'closed': 'Closed Aerodrome',
};

// In-memory indexed caches
let isInitialized = false;
let initPromise = null;

const airportsByIdent = new Map();
const airportsByIata = new Map();
const frequenciesByAirport = new Map();
const runwaysByAirport = new Map();
const navaidsByAirport = new Map();
const countriesByCode = new Map();
const regionsByCode = new Map();

/**
 * Fast RFC-compliant CSV line parser handling embedded commas and quotes
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  const len = line.length;

  for (let i = 0; i < len; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Reads local CSV file or falls back to remote URL if file is missing
 */
async function loadCsvFile(fileName, remoteUrl) {
  const localPath = path.join(DATA_DIR, fileName);
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, 'utf8');
  }

  console.log(`[OurAirports DB] Local file ${fileName} not found. Fetching from ${remoteUrl}...`);
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`Failed to download ${fileName}: HTTP ${res.status}`);
  const text = await res.text();
  
  // Cache to disk if possible
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(localPath, text, 'utf8');
  } catch (err) {
    console.warn(`[OurAirports DB] Notice: could not cache ${fileName} to disk: ${err.message}`);
  }

  return text;
}

/**
 * Parses raw CSV text into array of objects using header line
 */
function parseCsv(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];
  const header = parseCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCsvLine(line);
    const row = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = values[j] !== undefined ? values[j] : '';
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Initializes and indexes the entire OurAirports database in memory
 */
async function initializeAirportDb() {
  if (isInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const start = Date.now();
    console.log('[OurAirports DB] Initializing global aeronautical database from OurAirports CSVs...');

    try {
      // 1. Countries and Regions
      const [countriesRaw, regionsRaw] = await Promise.all([
        loadCsvFile('countries.csv', CSV_SOURCES.countries),
        loadCsvFile('regions.csv', CSV_SOURCES.regions)
      ]);

      const countries = parseCsv(countriesRaw);
      for (const c of countries) {
        if (c.code) countriesByCode.set(c.code.toUpperCase().trim(), c);
      }

      const regions = parseCsv(regionsRaw);
      for (const r of regions) {
        if (r.code) regionsByCode.set(r.code.toUpperCase().trim(), r);
      }

      // 2. Runways, Frequencies, Navaids
      const [runwaysRaw, freqsRaw, navaidsRaw] = await Promise.all([
        loadCsvFile('runways.csv', CSV_SOURCES.runways),
        loadCsvFile('airport-frequencies.csv', CSV_SOURCES.frequencies),
        loadCsvFile('navaids.csv', CSV_SOURCES.navaids)
      ]);

      const runways = parseCsv(runwaysRaw);
      for (const r of runways) {
        const ident = (r.airport_ident || '').toUpperCase().trim();
        if (!ident) continue;
        if (!runwaysByAirport.has(ident)) runwaysByAirport.set(ident, []);
        runwaysByAirport.get(ident).push(r);
      }

      const freqs = parseCsv(freqsRaw);
      for (const f of freqs) {
        const ident = (f.airport_ident || '').toUpperCase().trim();
        if (!ident) continue;
        if (!frequenciesByAirport.has(ident)) frequenciesByAirport.set(ident, []);
        frequenciesByAirport.get(ident).push(f);
      }

      const navaids = parseCsv(navaidsRaw);
      for (const n of navaids) {
        const apt = (n.associated_airport || '').toUpperCase().trim();
        if (!apt) continue;
        if (!navaidsByAirport.has(apt)) navaidsByAirport.set(apt, []);
        navaidsByAirport.get(apt).push(n);
      }

      // 3. Airports (Main index)
      const airportsRaw = await loadCsvFile('airports.csv', CSV_SOURCES.airports);
      const airports = parseCsv(airportsRaw);
      for (const a of airports) {
        const ident = (a.ident || '').toUpperCase().trim();
        if (!ident) continue;
        airportsByIdent.set(ident, a);
        if (a.iata_code) {
          airportsByIata.set(a.iata_code.toUpperCase().trim(), a);
        }
      }

      isInitialized = true;
      console.log(`[OurAirports DB] Indexed ${airportsByIdent.size} airports, ${runwaysByAirport.size} runway aerodromes, ${frequenciesByAirport.size} frequency aerodromes in ${Date.now() - start}ms.`);
      return true;
    } catch (err) {
      console.error('[OurAirports DB] Error during database initialization:', err);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Priority order for sorting ATC frequencies
 */
const FREQ_ORDER = {
  'ATIS': 1,
  'AWOS': 2,
  'ASOS': 3,
  'CLD': 4,
  'DEL': 5,
  'GND': 6,
  'RAMP': 7,
  'APRON': 8,
  'TWR': 9,
  'DEP': 10,
  'APP': 11,
  'DIR': 12,
  'RADAR': 13,
  'CTR': 14,
  'INFO': 15,
  'UNICOM': 16,
  'CTAF': 17,
  'RDO': 18
};

/**
 * Retrieves comprehensive aerodrome data from OurAirports dataset
 */
async function getAirportDetails(icaoOrIata) {
  if (!isInitialized) {
    await initializeAirportDb();
  }

  const query = (icaoOrIata || '').toUpperCase().trim();
  if (!query) return null;

  // Search by ICAO/ident first, then IATA
  const rawApt = airportsByIdent.get(query) || airportsByIata.get(query);
  if (!rawApt) return null;

  const ident = rawApt.ident.toUpperCase();
  const country = countriesByCode.get((rawApt.iso_country || '').toUpperCase()) || null;
  const region = regionsByCode.get((rawApt.iso_region || '').toUpperCase()) || null;

  // Process Runways
  const rawRunways = runwaysByAirport.get(ident) || [];
  const processedRunways = rawRunways.map(r => {
    const le = r.le_ident || '';
    const he = r.he_ident || '';
    const rwyId = he ? `${le}/${he}` : le;

    const lengthFt = parseInt(r.length_ft, 10) || 0;
    const widthFt = parseInt(r.width_ft, 10) || 0;
    const lengthM = Math.round(lengthFt * 0.3048);
    const widthM = Math.round(widthFt * 0.3048);

    const surfaceCode = (r.surface || '').toUpperCase().trim();
    const surfaceLabel = SURFACE_LABELS[surfaceCode] || surfaceCode || 'Hard Surface';

    const leHeading = parseFloat(r.le_heading_degT) || (parseInt(le, 10) ? parseInt(le, 10) * 10 : 0);
    const heHeading = parseFloat(r.he_heading_degT) || (parseInt(he, 10) ? parseInt(he, 10) * 10 : (leHeading ? (leHeading + 180) % 360 : 0));

    return {
      id: rwyId,
      leIdent: le,
      heIdent: he,
      lengthFt,
      lengthM,
      widthFt,
      widthM,
      dimension: lengthFt && widthFt ? `${lengthFt}x${widthFt}` : (lengthFt ? `${lengthFt} ft` : 'Standard'),
      surface: surfaceCode,
      surfaceLabel,
      lighted: r.lighted === '1',
      closed: r.closed === '1',
      alignment: leHeading || 90,
      leHeadingDegT: leHeading,
      heHeadingDegT: heHeading,
      leElevationFt: r.le_elevation_ft ? parseInt(r.le_elevation_ft, 10) : null,
      heElevationFt: r.he_elevation_ft ? parseInt(r.he_elevation_ft, 10) : null,
      leDisplacedThresholdFt: r.le_displaced_threshold_ft ? parseInt(r.le_displaced_threshold_ft, 10) : 0,
      heDisplacedThresholdFt: r.he_displaced_threshold_ft ? parseInt(r.he_displaced_threshold_ft, 10) : 0,
      leCoordinates: (r.le_latitude_deg && r.le_longitude_deg) ? {
        lat: parseFloat(r.le_latitude_deg),
        lon: parseFloat(r.le_longitude_deg)
      } : null,
      heCoordinates: (r.he_latitude_deg && r.he_longitude_deg) ? {
        lat: parseFloat(r.he_latitude_deg),
        lon: parseFloat(r.he_longitude_deg)
      } : null,
    };
  });

  // Sort runways: Active and longest runways first
  processedRunways.sort((a, b) => {
    if (a.closed !== b.closed) return a.closed ? 1 : -1;
    return b.lengthFt - a.lengthFt;
  });

  // Process Frequencies
  const rawFreqs = frequenciesByAirport.get(ident) || [];
  const processedFreqs = rawFreqs.map(f => {
    const rawType = (f.type || '').toUpperCase().trim();
    const freqMhz = parseFloat(f.frequency_mhz);
    const freqFormatted = !isNaN(freqMhz) ? `${freqMhz.toFixed(3).replace(/\.?0+$/, '')} MHz` : (f.frequency_mhz || '');

    return {
      id: f.id,
      type: rawType,
      description: f.description || rawType,
      freq: freqFormatted,
      mhz: f.frequency_mhz,
      order: FREQ_ORDER[rawType] || 99
    };
  });

  // Sort frequencies logically: ATIS -> Delivery -> Ground -> Tower -> Dep -> App -> Radar
  processedFreqs.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return (a.description || '').localeCompare(b.description || '');
  });

  // Process Navaids
  const rawNavaids = navaidsByAirport.get(ident) || [];
  const processedNavaids = rawNavaids.map(n => {
    const freqKhz = parseInt(n.frequency_khz, 10) || 0;
    const freqFormatted = freqKhz >= 100000 
      ? `${(freqKhz / 1000).toFixed(3).replace(/\.?0+$/, '')} MHz`
      : `${freqKhz} kHz`;

    return {
      id: n.id,
      ident: n.ident,
      name: n.name,
      type: n.type,
      frequencyKhz: freqKhz,
      frequencyFormatted: freqFormatted,
      dmeFrequencyKhz: n.dme_frequency_khz ? parseInt(n.dme_frequency_khz, 10) : null,
      channel: n.dme_channel || null,
      latitude: n.latitude_deg ? parseFloat(n.latitude_deg) : null,
      longitude: n.longitude_deg ? parseFloat(n.longitude_deg) : null,
      elevationFt: n.elevation_ft ? parseInt(n.elevation_ft, 10) : null,
      magneticVariation: n.magnetic_variation_deg ? parseFloat(n.magnetic_variation_deg) : null,
      usageType: n.usageType || null,
      power: n.power || null
    };
  });

  const elevFt = parseInt(rawApt.elevation_ft, 10) || 0;
  const elevM = Math.round(elevFt * 0.3048);
  const lat = parseFloat(rawApt.latitude_deg) || 0;
  const lon = parseFloat(rawApt.longitude_deg) || 0;

  return {
    ident: rawApt.ident,
    icaoId: rawApt.ident,
    iataId: rawApt.iata_code || '',
    name: rawApt.name || `${ident} Aerodrome`,
    type: rawApt.type,
    typeLabel: AIRPORT_TYPE_LABELS[rawApt.type] || 'Civil Aerodrome',
    latitude: lat,
    longitude: lon,
    lat,
    lon,
    elevation: elevFt,
    elevationFt: elevFt,
    elevation_ft: elevFt,
    elevationM: elevM,
    elevation_m: elevM,
    continent: rawApt.continent || '',
    countryCode: rawApt.iso_country || '',
    countryName: country?.name || rawApt.iso_country || '',
    regionCode: rawApt.iso_region || '',
    regionName: region?.name || rawApt.iso_region || '',
    municipality: rawApt.municipality || '',
    city: rawApt.municipality || '',
    scheduledService: rawApt.scheduled_service === 'yes',
    gpsCode: rawApt.gps_code || rawApt.ident,
    localCode: rawApt.local_code || '',
    homeLink: rawApt.home_link || '',
    wikipediaLink: rawApt.wikipedia_link || '',
    countryWikipediaLink: country?.wikipedia_link || '',
    runways: processedRunways,
    frequencies: processedFreqs,
    frequencyList: processedFreqs,
    navaids: processedNavaids,
    dataSource: 'OurAirports Aviation Database (David Megginson)'
  };
}

module.exports = {
  initializeAirportDb,
  getAirportDetails
};
