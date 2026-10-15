// Ensure Node.js does not abort on NOAA / US Government intermediate SSL certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Real-time Weather Service (NOAA Aviation Weather Center & VATSIM METAR Backup)
 * Enriched with OurAirports Gold Standard Aviation Database
 */
const { getAirportDetails } = require('./airportDbService');

// Fallback airport runway data for airports where NOAA data/airport might lack complete runway sets
const AIRPORT_RUNWAY_FALLBACKS = {
  'LEMD': [
    { id: '18R/36L', dimension: '13711x197', surface: 'A', alignment: 181 },
    { id: '18L/36R', dimension: '11483x148', surface: 'A', alignment: 181 },
    { id: '14R/32L', dimension: '13084x197', surface: 'A', alignment: 143 },
    { id: '14L/32R', dimension: '11483x197', surface: 'A', alignment: 143 },
  ],
  'LEBB': [
    { id: '12/30', dimension: '8530x148', surface: 'A', alignment: 120 },
    { id: '10/28', dimension: '6562x148', surface: 'A', alignment: 100 },
  ],
  'LEBL': [
    { id: '06L/24R', dimension: '11000x150', surface: 'A', alignment: 65 },
    { id: '06R/24L', dimension: '8727x150', surface: 'A', alignment: 65 },
    { id: '02/20', dimension: '8333x150', surface: 'A', alignment: 20 },
  ],
  'LEMG': [
    { id: '13/31', dimension: '10500x150', surface: 'A', alignment: 130 },
    { id: '12/30', dimension: '9022x150', surface: 'A', alignment: 120 },
  ],
  'LEPA': [
    { id: '06L/24R', dimension: '10728x150', surface: 'A', alignment: 60 },
    { id: '06R/24L', dimension: '9842x150', surface: 'A', alignment: 60 },
  ],
  'LEAL': [
    { id: '10/28', dimension: '9842x148', surface: 'A', alignment: 100 },
  ],
  'LEVC': [
    { id: '12/30', dimension: '10500x148', surface: 'A', alignment: 120 },
  ],
  'LEST': [
    { id: '17/35', dimension: '10170x148', surface: 'A', alignment: 170 },
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

  // 1. Icing Risk
  if (temp !== null && temp <= 3 && temp >= -10) {
    if (raw.includes('RA') || raw.includes('DZ') || raw.includes('SN') || raw.includes('FG') || (dewp !== null && Math.abs(temp - dewp) <= 2)) {
      threats.push({
        id: 'icing',
        level: temp <= 0 ? 'CRITICAL' : 'WARNING',
        title: 'Icing Risk in Area',
        desc: `Temperature ${temp}°C near freezing with visible moisture/low spread. High risk of structural and carburettor/induction icing.`,
        badge: `${temp}°C / MOIST`,
        icon: 'snowflake'
      });
    }
  }

  // 2. Convective / Thunderstorm Activity
  if (raw.includes('TS') || raw.includes('CB') || raw.includes('SQ') || raw.includes('GR')) {
    threats.push({
      id: 'convective',
      level: 'CRITICAL',
      title: 'Active Convective Activity / Thunderstorms',
      desc: 'Thunderstorm (TS) or cumulonimbus (CB) reported. Risk of severe turbulence, windshear and hail.',
      badge: 'THUNDERSTORM / CB',
      icon: 'zap'
    });
  }

  // 3. Low Visibility & Low Ceiling (LIFR / IFR)
  if (raw.includes('FG') || raw.includes('+SN') || raw.includes('BLSN') || (metar.fltCat === 'LIFR' || metar.fltCat === 'IFR')) {
    threats.push({
      id: 'low_vis',
      level: metar.fltCat === 'LIFR' ? 'CRITICAL' : 'WARNING',
      title: 'Low Visibility / Reduced Ceiling (LVP)',
      desc: `Flight category: ${metar.fltCat}. Possible Low Visibility Procedures (LVP) in force at the aerodrome.`,
      badge: metar.fltCat,
      icon: 'eye-off'
    });
  }

  // 4. Strong Wind & Gust Hazards
  if (wspd >= 25 || wgst >= 30) {
    threats.push({
      id: 'wind_hazard',
      level: (wspd >= 35 || wgst >= 40) ? 'CRITICAL' : 'WARNING',
      title: 'High Wind / Strong Gusts',
      desc: `Sustained wind ${wspd} KT with gusts up to ${wgst || wspd} KT. Verify crosswind limits and expect mechanical turbulence.`,
      badge: `${wgst || wspd} KT GUST`,
      icon: 'wind'
    });
  }

  // 5. Low Barometric Pressure (Deep Depressions)
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
 * Parses raw METAR string into structured fields when NOAA fails
 */
function parseRawMetarString(raw, code) {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim();
  if (clean.length < 10) return null;

  const metar = {
    icaoId: code,
    rawOb: clean,
    wspd: 0,
    wdir: 0,
    wgst: null,
    temp: 15,
    dewp: 10,
    altim: 1013,
    visib: '10+',
    fltCat: 'VFR'
  };

  // Wind: e.g. 29009KT, 29009G18KT, VRB03KT
  const wMatch = clean.match(/(?:^|\s)(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?KT/);
  if (wMatch) {
    metar.wdir = wMatch[1] === 'VRB' ? null : parseInt(wMatch[1], 10);
    metar.wspd = parseInt(wMatch[2], 10);
    if (wMatch[3]) metar.wgst = parseInt(wMatch[3], 10);
  }

  // Temp / Dewpoint: e.g. 17/17, M02/M05
  const tMatch = clean.match(/(?:^|\s)(M?\d{2})\/(M?\d{2})(?:$|\s)/);
  if (tMatch) {
    metar.temp = parseInt(tMatch[1].replace('M', '-'), 10);
    metar.dewp = parseInt(tMatch[2].replace('M', '-'), 10);
  }

  // Altimeter: Q1016 (hPa) or A2992 (inHg)
  const qMatch = clean.match(/(?:^|\s)Q(\d{4})/);
  const aMatch = clean.match(/(?:^|\s)A(\d{4})/);
  if (qMatch) {
    metar.altim = parseInt(qMatch[1], 10);
  } else if (aMatch) {
    metar.altim = Math.round(parseFloat(aMatch[1]) * 0.338639);
  }

  // Visib: e.g. 8000 or 10SM
  const vMatch = clean.match(/(?:^|\s)(\d{4})(?:$|\s)/);
  const vSmMatch = clean.match(/(?:^|\s)(\d+(?:\/\d+)?SM)/);
  if (vMatch) {
    const meters = parseInt(vMatch[1], 10);
    metar.visib = meters >= 9999 ? '10+ KM' : `${meters} M`;
    if (meters < 1500) metar.fltCat = 'IFR';
    else if (meters < 5000) metar.fltCat = 'MVFR';
  } else if (vSmMatch) {
    metar.visib = vSmMatch[1];
  }

  return metar;
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

  // 1. Fetch METAR from NOAA AWC (with 4500ms timeout)
  let metar = null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const metarUrl = `https://aviationweather.gov/api/data/metar?ids=${code}&format=json`;
    const res = await fetch(metarUrl, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        metar = data[0];
      }
    }
  } catch (err) {
    console.warn(`[Weather] NOAA METAR fetch notice for ${code}:`, err.message);
  }

  // Backup METAR source: VATSIM network feed (instant high-availability global mirror)
  if (!metar || !metar.rawOb) {
    try {
      const vatsimUrl = `https://metar.vatsim.net/metar.php?id=${code}`;
      const vRes = await fetch(vatsimUrl, { headers });
      if (vRes.ok) {
        const text = await vRes.text();
        if (text && text.trim().length > 10) {
          metar = parseRawMetarString(text.trim(), code);
          console.log(`[Weather] Retrieved backup METAR from VATSIM for ${code}`);
        }
      }
    } catch (vErr) {
      console.warn(`[Weather] VATSIM METAR backup notice for ${code}:`, vErr.message);
    }
  }

  // 2. Fetch TAF from NOAA AWC
  let taf = null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const tafUrl = `https://aviationweather.gov/api/data/taf?ids=${code}&format=json`;
    const res = await fetch(tafUrl, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        taf = data[0];
      }
    }
  } catch (err) {
    console.warn(`[Weather] NOAA TAF notice for ${code}:`, err.message);
  }

  // 3. Fetch Comprehensive Airport Info, Runways, Frequencies & Navaids from OurAirports DB
  let ourAirportsData = null;
  try {
    ourAirportsData = await getAirportDetails(code);
  } catch (dbErr) {
    console.warn(`[Weather] Notice querying OurAirports DB for ${code}:`, dbErr.message);
  }

  // Optional: NOAA Airport query as fallback if not in OurAirports
  let noaaAirport = null;
  if (!ourAirportsData) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const aptUrl = `https://aviationweather.gov/api/data/airport?ids=${code}&format=json`;
      const res = await fetch(aptUrl, { headers, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          noaaAirport = data[0];
        }
      }
    } catch (err) {
      console.warn(`[Weather] NOAA Airport info notice for ${code}:`, err.message);
    }
  }

  // Determine effective runways
  let runways = (ourAirportsData && ourAirportsData.runways && ourAirportsData.runways.length > 0)
    ? ourAirportsData.runways
    : ((noaaAirport && noaaAirport.runways && noaaAirport.runways.length > 0) ? noaaAirport.runways : (AIRPORT_RUNWAY_FALLBACKS[code] || []));

  // If still no runways found, infer default dual-end runway based on 09/27
  if (runways.length === 0) {
    runways = [
      { id: '09/27', dimension: '10000x150', surface: 'ASP', surfaceLabel: 'Asphalt', alignment: 90, lengthFt: 10000, widthFt: 150 }
    ];
  }

  // Determine effective frequencies
  let frequencyList = (ourAirportsData && ourAirportsData.frequencyList && ourAirportsData.frequencyList.length > 0)
    ? ourAirportsData.frequencyList
    : [];

  if (frequencyList.length === 0 && noaaAirport?.freqs) {
    const parts = noaaAirport.freqs.split(';');
    for (const p of parts) {
      const [type, freq] = p.split(',');
      if (type && freq) {
        frequencyList.push({ type: type.trim(), description: type.trim(), freq: `${freq.trim()} MHz` });
      }
    }
  }

  // Enrich Airport object with complete OurAirports gold standard data
  const airportData = {
    icaoId: code,
    iataId: ourAirportsData?.iataId || noaaAirport?.iataId || metar?.iataId || '',
    name: ourAirportsData?.name || noaaAirport?.name || metar?.name || `${code} Aerodrome`,
    city: ourAirportsData?.city || ourAirportsData?.municipality || noaaAirport?.city || noaaAirport?.state || '',
    municipality: ourAirportsData?.municipality || ourAirportsData?.city || '',
    country: ourAirportsData?.countryName || noaaAirport?.country || '',
    countryCode: ourAirportsData?.countryCode || '',
    region: ourAirportsData?.regionName || noaaAirport?.state || '',
    regionCode: ourAirportsData?.regionCode || '',
    type: ourAirportsData?.type || '',
    typeLabel: ourAirportsData?.typeLabel || 'Civil Aerodrome',
    elevation: ourAirportsData?.elevationFt !== undefined ? ourAirportsData.elevationFt : (noaaAirport?.elev !== undefined ? noaaAirport?.elev : (metar?.elev || 0)),
    elevationFt: ourAirportsData?.elevationFt !== undefined ? ourAirportsData.elevationFt : (noaaAirport?.elev !== undefined ? noaaAirport?.elev : (metar?.elev || 0)),
    elevationM: ourAirportsData?.elevationM || Math.round((noaaAirport?.elev || metar?.elev || 0) * 0.3048),
    lat: ourAirportsData?.latitude !== undefined ? ourAirportsData.latitude : (noaaAirport?.lat !== undefined ? noaaAirport?.lat : (metar?.lat || 0)),
    lon: ourAirportsData?.longitude !== undefined ? ourAirportsData.longitude : (noaaAirport?.lon !== undefined ? noaaAirport?.lon : (metar?.lon || 0)),
    magdec: ourAirportsData?.runways?.[0]?.magneticVariation ? `${ourAirportsData.runways[0].magneticVariation}°` : (noaaAirport?.magdec || '0E'),
    wikipediaLink: ourAirportsData?.wikipediaLink || '',
    homeLink: ourAirportsData?.homeLink || '',
    runways: runways,
    frequencyList: frequencyList,
    frequencies: frequencyList,
    navaids: ourAirportsData?.navaids || [],
    dataSource: ourAirportsData ? 'OurAirports Aviation Database' : 'NOAA AWC'
  };

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
