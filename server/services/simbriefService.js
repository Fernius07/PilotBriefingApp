/**
 * SimBrief Real-time OFP (Operational Flight Plan) Import Service
 * Fetches latest dispatched flight plan via SimBrief API
 */

async function fetchSimBriefOfp(usernameOrId) {
  const query = (usernameOrId || '').trim();
  if (!query) throw new Error('SimBrief username or Pilot ID is required');

  const url = `https://www.simbrief.com/api/xml.fetcher.php?username=${encodeURIComponent(query)}&json=1`;

  const headers = {
    'User-Agent': 'PilotBriefPro/1.0 (Aviation Flight Briefing App)'
  };

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`SimBrief API error: HTTP ${res.status}`);
    }

    const data = await res.json();

    // Check if error status is returned by SimBrief
    if (data.fetch && data.fetch.status && data.fetch.status.startsWith('Error')) {
      throw new Error(data.fetch.status);
    }

    // Extract essential flight plan parameters
    const origin = data.origin || {};
    const destination = data.destination || {};
    const alternate = data.alternate || {};
    const general = data.general || {};
    const aircraft = data.aircraft || {};
    const fuel = data.fuel || {};
    const weights = data.weights || {};
    const times = data.times || {};

    const extracted = {
      flightNumber: (general.icao_airline || '') + (general.flight_number || ''),
      airline: general.icao_airline || '',
      aircraft: {
        icaoCode: aircraft.icaocode || '',
        name: aircraft.name || '',
        reg: aircraft.reg || '',
        selcal: aircraft.selcal || '',
      },
      origin: {
        icao: origin.icao_code || '',
        iata: origin.iata_code || '',
        name: origin.name || '',
        planRwy: origin.plan_rwy || '',
        transAlt: origin.trans_alt || '',
        elevation: origin.elevation || '',
      },
      destination: {
        icao: destination.icao_code || '',
        iata: destination.iata_code || '',
        name: destination.name || '',
        planRwy: destination.plan_rwy || '',
        transAlt: destination.trans_alt || '',
        elevation: destination.elevation || '',
      },
      alternate: {
        icao: alternate.icao_code || '',
        iata: alternate.iata_code || '',
        name: alternate.name || '',
        planRwy: alternate.plan_rwy || '',
        elevation: alternate.elevation || '',
      },
      route: general.route || '',
      cruiseAltitude: general.initial_altitude ? `FL${Math.round(parseInt(general.initial_altitude, 10) / 100)}` : '',
      costIndex: general.costindex || '',
      distance: general.air_distance ? `${general.air_distance} NM` : '',
      ete: times.est_time_enroute ? `${Math.floor(times.est_time_enroute / 3600)}h ${Math.floor((times.est_time_enroute % 3600) / 60)}m` : '',
      fuel: {
        block: fuel.plan_ramp ? `${Math.round(fuel.plan_ramp)} kg/lbs` : '',
        trip: fuel.plan_takeoff ? `${Math.round(fuel.plan_takeoff)} kg/lbs` : '',
        contingency: fuel.contingency ? `${Math.round(fuel.contingency)} kg/lbs` : '',
        reserve: fuel.reserve ? `${Math.round(fuel.reserve)} kg/lbs` : '',
      },
      weights: {
        zfw: weights.est_zfw || '',
        tow: weights.est_tow || '',
        law: weights.est_ldw || '',
        payload: weights.payload || '',
      },
      // Raw briefing text preview if available
      textSummary: data.text?.plan_html || null,
      fetchTime: new Date().toISOString()
    };

    return extracted;
  } catch (err) {
    console.error('Error fetching SimBrief OFP:', err.message);
    throw err;
  }
}

module.exports = {
  fetchSimBriefOfp
};
