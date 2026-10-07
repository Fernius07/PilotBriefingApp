/**
 * Real-time Weather Service (NOAA Aviation Weather Center)
 * Provides METAR, TAF, Airport info and calculates Environmental Threats
 */

// Fallback airport runway data for airports where NOAA data/airport might lack complete runway sets
const AIRPORT_RUNWAY_FALLBACKS = {
  'LEMD': [
    { id: '18R/36L', dimension: '13711x197', surface: 'A', alignment: 181 },
    { id: '18L/36R', dimension: '11483x148', surface: 'A', alignment: 181 },
    { id: '14R/32L', dimension: '13084x197', surface: 'A', alignment: 143 },
    { id: '14L/32R', dimension: '11483x197', surface: 'A', alignment: 143 },
  ],
  'KJFK': [
    { id: '04L/22R', dimension: '12079x200', surface: 'A', alignment: 44 },
    { id: '04R/22L', dimension: '8400x200', surface: 'A', alignment: 44 },
    { id: '13L/31R', dimension: '10000x200', surface: 'A', alignment: 134 },
    { id: '13R/31L', dimension: '14511x200', surface: 'A', alignment: 134 },
  ],
  'EGLL': [
    { id: '09L/27R', dimension: '12799x164', surface: 'A', alignment: 91 },
    { id: '09R/27L', dimension: '12008x164', surface: 'A', alignment: 91 },
  ],
  'LFPG': [
    { id: '08L/26R', dimension: '13829x148', surface: 'A', alignment: 85 },
    { id: '08R/26L', dimension: '8858x148', surface: 'A', alignment: 85 },
    { id: '09L/27R', dimension: '8858x148', surface: 'A', alignment: 85 },
    { id: '09R/27L', dimension: '13780x148', surface: 'A', alignment: 85 },
  ],
  'EDDF': [
    { id: '07C/25C', dimension: '13123x197', surface: 'A', alignment: 69 },
    { id: '07R/25L', dimension: '13123x148', surface: 'A', alignment: 69 },
    { id: '07L/25R', dimension: '9186x148', surface: 'A', alignment: 69 },
    { id: '18', dimension: '13123x148', surface: 'A', alignment: 179 },
  ],
  'KLAX': [
    { id: '06L/24R', dimension: '8926x150', surface: 'A', alignment: 69 },
    { id: '06R/24L', dimension: '10285x150', surface: 'A', alignment: 69 },
    { id: '07L/25R', dimension: '12091x150', surface: 'A', alignment: 69 },
    { id: '07R/25L', dimension: '11095x200', surface: 'A', alignment: 69 },
  ],
  'OMDB': [
    { id: '12L/30R', dimension: '13123x197', surface: 'A', alignment: 120 },
    { id: '12R/30L', dimension: '14599x197', surface: 'A', alignment: 120 },
  ],
};

/**
 * Assesses environmental threats from METAR observation
 */
function assessEnvironmentalThreats(metar) {
  const threats = [];
  if (!metar || !metar.rawOb) return threats;

  const raw = metar.rawOb.toUpperCase();
  const temp = metar.temp !== undefined ? metar.temp : null;
  const dewp = metar.dewp !== undefined ? metar.dewp : null;
  const wspd = metar.wspd || 0;
  const wgst = metar.wgst || 0;
  const altim = metar.altim || 1013;

  // 1. Convective Hazards (Thunderstorms / CB / Squalls)
  if (raw.includes('TS') || raw.includes('CB') || raw.includes('SQ') || raw.includes('VCTS')) {
    threats.push({
      id: 'convective',
      level: 'CRITICAL',
      title: 'Convective Activity / Thunderstorms',
      desc: 'Active thunderstorms or Cumulonimbus (CB/TS) clouds present at the aerodrome or immediate vicinity.',
      badge: 'THUNDERSTORM / CB',
      icon: 'zap'
    });
  }

  // 2. Icing Hazards (Temp between -15°C and +3°C with narrow spread or precip)
  if (temp !== null && temp <= 3 && temp >= -15) {
    const spread = (temp !== null && dewp !== null) ? Math.abs(temp - dewp) : 99;
    const hasMoisture = spread <= 2 || raw.includes('SN') || raw.includes('DZ') || raw.includes('RA') || raw.includes('FG') || raw.includes('OVC');
    if (hasMoisture) {
      threats.push({
        id: 'icing',
        level: 'WARNING',
        title: 'Icing Conditions (Structural Icing Threat)',
        desc: `Temperature (${temp}°C) with high relative humidity (spread ${spread.toFixed(1)}°C). Anti-ice protection required.`,
        badge: 'ICING CONDITIONS',
        icon: 'snowflake'
      });
    }
  }

  // 3. Low Visibility Operations (LVO / Fog / Low Ceiling)
  const isLVO = metar.fltCat === 'LIFR' || metar.fltCat === 'IFR' || raw.includes('FG') || (metar.visib && (parseFloat(metar.visib) < 3 || metar.visib.includes('<')));
  if (isLVO) {
    threats.push({
      id: 'low_vis',
      level: metar.fltCat === 'LIFR' ? 'CRITICAL' : 'WARNING',
      title: 'Low Visibility (LVO / Fog)',
      desc: `Flight category ${metar.fltCat}. Low ceilings or restricted visibility. Precision approach procedures in effect.`,
      badge: 'LVO / CAT II/III',
      icon: 'eye-off'
    });
  }

  // 4. High Wind / Gusts / Wind Shear
  if (wgst >= 25 || wspd >= 22 || raw.includes('WS ') || raw.includes('SHEAR')) {
    threats.push({
      id: 'wind_hazard',
      level: wgst >= 32 ? 'CRITICAL' : 'WARNING',
      title: 'Wind Gusts / Wind Shear Hazard',
      desc: `Surface wind ${wspd} kt with gusts up to ${wgst || wspd} kt. Exercise caution for turbulence and airspeed fluctuations on final approach.`,
      badge: `GUSTS ${wgst || wspd}KT`,
      icon: 'wind'
    });
  }

  // 5. Extreme low pressure
  if (altim < 995) {
    threats.push({
      id: 'low_qnh',
      level: 'CAUTION',
      title: 'Very Low Barometric Pressure',
      desc: `Current altimeter ${altim} hPa. Deep low pressure system in the vicinity.`,
      badge: `QNH ${altim} HPA`,
      icon: 'gauge'
    });
  }

  return threats;
}

/**
 * Fetches real live weather & airport info for an ICAO
 */
async function fetchAirportWeather(icao) {
  const code = (icao || '').toUpperCase().trim();
  if (!code) throw new Error('ICAO code is required');

  const headers = {
    'User-Agent': 'PilotBriefPro/1.0 (Aviation Flight Planning EFB)'
  };

  // 1. Fetch METAR from NOAA AWC
  let metar = null;
  try {
    const metarUrl = `https://aviationweather.gov/api/data/metar?ids=${code}&format=json`;
    const res = await fetch(metarUrl, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        metar = data[0];
      }
    }
  } catch (err) {
    console.error(`Error fetching METAR for ${code}:`, err.message);
  }

  // 2. Fetch TAF from NOAA AWC
  let taf = null;
  try {
    const tafUrl = `https://aviationweather.gov/api/data/taf?ids=${code}&format=json`;
    const res = await fetch(tafUrl, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        taf = data[0];
      }
    }
  } catch (err) {
    console.error(`Error fetching TAF for ${code}:`, err.message);
  }

  // 3. Fetch Airport Info & Runways from NOAA AWC
  let airport = null;
  try {
    const aptUrl = `https://aviationweather.gov/api/data/airport?ids=${code}&format=json`;
    const res = await fetch(aptUrl, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        airport = data[0];
      }
    }
  } catch (err) {
    console.error(`Error fetching Airport info for ${code}:`, err.message);
  }

  // Apply fallback runways if airport or runways is missing or empty
  let runways = (airport && airport.runways && airport.runways.length > 0) ? airport.runways : (AIRPORT_RUNWAY_FALLBACKS[code] || []);

  // If still no runways found, infer typical pairs if known or generate a default single dual-end runway based on 09/27
  if (runways.length === 0) {
    runways = [
      { id: '09/27', dimension: '10000x150', surface: 'A', alignment: 90 }
    ];
  }

  // Enrich Airport object
  const airportData = {
    icaoId: code,
    iataId: airport?.iataId || metar?.iataId || '',
    name: airport?.name || metar?.name || `${code} Aerodrome`,
    city: airport?.city || airport?.state || '',
    country: airport?.country || '',
    elevation: airport?.elev !== undefined ? airport?.elev : (metar?.elev || 0),
    lat: airport?.lat !== undefined ? airport?.lat : (metar?.lat || 0),
    lon: airport?.lon !== undefined ? airport?.lon : (metar?.lon || 0),
    magdec: airport?.magdec || '0E',
    freqs: airport?.freqs || '',
    runways: runways,
  };

  // Parse ATC frequencies into structured list
  const frequencyList = [];
  if (airportData.freqs) {
    const parts = airportData.freqs.split(';');
    for (const p of parts) {
      const [type, freq] = p.split(',');
      if (type && freq) {
        frequencyList.push({ type: type.trim(), freq: freq.trim() });
      }
    }
  }
  airportData.frequencyList = frequencyList;

  // Flight category determination (VFR, MVFR, IFR, LIFR)
  const fltCat = metar?.fltCat || 'VFR';

  // Environmental Threats
  const environmentalThreats = assessEnvironmentalThreats(metar);

  return {
    icao: code,
    timestamp: new Date().toISOString(),
    metar,
    taf,
    airport: airportData,
    fltCat,
    environmentalThreats,
  };
}

module.exports = {
  fetchAirportWeather,
  assessEnvironmentalThreats
};
