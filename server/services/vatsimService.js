/**
 * Real-time VATSIM ATC & Traffic Service
 * Fetches live controllers, frequencies and traffic from VATSIM Network
 */

let cachedVatsimData = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds cache to avoid overwhelming VATSIM servers

async function getVatsimData() {
  const now = Date.now();
  if (cachedVatsimData && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedVatsimData;
  }

  try {
    const res = await fetch('https://data.vatsim.net/v3/vatsim-data.json', {
      headers: {
        'User-Agent': 'PilotBriefPro/1.0 (Aviation Flight Briefing App)'
      }
    });

    if (res.ok) {
      cachedVatsimData = await res.json();
      lastFetchTime = now;
      return cachedVatsimData;
    }
  } catch (err) {
    console.error('Error fetching VATSIM data:', err.message);
  }

  return cachedVatsimData || { controllers: [], pilots: [] };
}

/**
 * Categorize ATC position type by callsign suffix
 */
function getAtcPositionType(callsign) {
  const cs = (callsign || '').toUpperCase();
  if (cs.endsWith('_DEL')) return { type: 'DELIVERY', order: 1, label: 'Autorizaciones (Delivery)' };
  if (cs.endsWith('_GND')) return { type: 'GROUND', order: 2, label: 'Control Rodadura (Ground)' };
  if (cs.endsWith('_TWR')) return { type: 'TOWER', order: 3, label: 'Torre de Control (Tower)' };
  if (cs.endsWith('_DEP')) return { type: 'DEPARTURE', order: 4, label: 'Salidas (Departure)' };
  if (cs.endsWith('_APP')) return { type: 'APPROACH', order: 5, label: 'Aproximación (Approach)' };
  if (cs.endsWith('_CTR')) return { type: 'CENTER', order: 6, label: 'Control En Ruta (Radar/Center)' };
  if (cs.endsWith('_ATIS')) return { type: 'ATIS', order: 0, label: 'Servicio ATIS' };
  return { type: 'ATC', order: 7, label: 'Controlador de Tráfico' };
}

/**
 * Fetches online ATC and traffic for a specific airport ICAO
 */
async function fetchAirportVatsim(icao) {
  const code = (icao || '').toUpperCase().trim();
  const vatsim = await getVatsimData();

  const controllers = vatsim.controllers || [];
  const pilots = vatsim.pilots || [];

  // Match airport controllers:
  // e.g. LEMD_TWR, LEMD_GND, or 3-letter IATA / short prefix
  const matchedControllers = controllers.filter(ctrl => {
    const cs = (ctrl.callsign || '').toUpperCase();
    return cs.startsWith(code + '_');
  }).map(ctrl => {
    const pos = getAtcPositionType(ctrl.callsign);
    return {
      callsign: ctrl.callsign,
      frequency: ctrl.frequency,
      facility: ctrl.facility,
      rating: ctrl.rating,
      visual_range: ctrl.visual_range,
      text_atis: ctrl.text_atis ? ctrl.text_atis.join(' ') : '',
      logon_time: ctrl.logon_time,
      positionType: pos.type,
      positionLabel: pos.label,
      positionOrder: pos.order,
    };
  });

  // Sort controllers by standard flow: ATIS -> DEL -> GND -> TWR -> DEP -> APP -> CTR
  matchedControllers.sort((a, b) => a.positionOrder - b.positionOrder);

  // Inbound & Outbound flights
  const inboundPilots = pilots.filter(p => p.flight_plan?.arrival === code).map(p => ({
    callsign: p.callsign,
    aircraft: p.flight_plan?.aircraft_short || p.flight_plan?.aircraft || 'ACFT',
    departure: p.flight_plan?.departure,
    arrival: p.flight_plan?.arrival,
    altitude: p.altitude,
    groundspeed: p.groundspeed,
    heading: p.heading,
  }));

  const outboundPilots = pilots.filter(p => p.flight_plan?.departure === code).map(p => ({
    callsign: p.callsign,
    aircraft: p.flight_plan?.aircraft_short || p.flight_plan?.aircraft || 'ACFT',
    departure: p.flight_plan?.departure,
    arrival: p.flight_plan?.arrival,
    altitude: p.altitude,
    groundspeed: p.groundspeed,
    heading: p.heading,
  }));

  return {
    icao: code,
    hasAtcOnline: matchedControllers.length > 0,
    controllersCount: matchedControllers.length,
    controllers: matchedControllers,
    inboundsCount: inboundPilots.length,
    inbounds: inboundPilots.slice(0, 15),
    outboundsCount: outboundPilots.length,
    outbounds: outboundPilots.slice(0, 15),
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  fetchAirportVatsim
};
