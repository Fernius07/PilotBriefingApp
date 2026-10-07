import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import RouteBar from './components/RouteBar';
import WeatherCard from './components/WeatherCard';
import RunwayWindAnalysis from './components/RunwayWindAnalysis';
import NotamSection from './components/NotamSection';
import VatsimCard from './components/VatsimCard';
import SimBriefModal from './components/SimBriefModal';
import PrintableBriefing from './components/PrintableBriefing';
import { 
  Cloud, Compass, ShieldAlert, Radio, RefreshCw, 
  AlertCircle, LayoutDashboard, Sparkles, CheckCircle2 
} from 'lucide-react';

export default function App() {
  const [activeStationIcao, setActiveStationIcao] = useState('LEMD');
  const [briefingData, setBriefingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'METAR' | 'RUNWAYS' | 'NOTAMS' | 'VATSIM'
  
  // Route builder state
  const [routeStations, setRouteStations] = useState([
    { icao: 'LEMD', role: 'DEP', fltCat: null }
  ]);
  
  // EFB & Simulation
  const [simbriefPlan, setSimbriefPlan] = useState(null);
  const [nightVision, setNightVision] = useState(false);
  const [showSimbriefModal, setShowSimbriefModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch live briefing for an airport
  const fetchBriefing = useCallback(async (icao) => {
    const code = (icao || '').toUpperCase().trim();
    if (!code) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/briefing/${code}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `No se pudieron cargar datos para ${code}`);
      }

      setBriefingData(data);
      setLastUpdated(new Date());

      // Update fltCat in route station list
      setRouteStations((prev) => 
        prev.map((s) => s.icao === code ? { ...s, fltCat: data.weather?.fltCat || 'VFR' } : s)
      );
    } catch (err) {
      console.error('Fetch briefing error:', err);
      setError(err.message || 'Error de conexión con el servidor aeronáutico');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBriefing(activeStationIcao);
  }, [activeStationIcao, fetchBriefing]);

  // Handle Search from Header
  const handleSearch = (newIcao) => {
    const code = newIcao.toUpperCase().trim();
    setActiveStationIcao(code);

    // If not in route, replace single or add
    setRouteStations((prev) => {
      const exists = prev.find(s => s.icao === code);
      if (exists) return prev;
      if (prev.length === 1 && prev[0].role === 'DEP') {
        return [{ icao: code, role: 'DEP', fltCat: null }];
      }
      return [...prev, { icao: code, role: 'STATION', fltCat: null }];
    });
  };

  // Select station from RouteBar
  const handleSelectStation = (icao) => {
    setActiveStationIcao(icao);
  };

  // Add station to RouteBar
  const handleAddStation = (icao) => {
    const code = icao.toUpperCase().trim();
    setRouteStations((prev) => {
      if (prev.find(s => s.icao === code)) return prev;
      const role = prev.length === 1 ? 'ARR' : `ALTN ${prev.length - 1}`;
      return [...prev, { icao: code, role, fltCat: null }];
    });
    setActiveStationIcao(code);
  };

  // Remove station from RouteBar
  const handleRemoveStation = (icao) => {
    setRouteStations((prev) => {
      const next = prev.filter(s => s.icao !== icao);
      if (activeStationIcao === icao && next.length > 0) {
        setActiveStationIcao(next[0].icao);
      }
      return next;
    });
  };

  // Import SimBrief OFP
  const handleImportSimbriefPlan = (ofp) => {
    setSimbriefPlan(ofp);

    const newStations = [];
    if (ofp.origin?.icao) {
      newStations.push({ icao: ofp.origin.icao, role: 'DEP', fltCat: null });
    }
    if (ofp.destination?.icao) {
      newStations.push({ icao: ofp.destination.icao, role: 'ARR', fltCat: null });
    }
    if (ofp.alternate?.icao) {
      newStations.push({ icao: ofp.alternate.icao, role: 'ALTN', fltCat: null });
    }

    if (newStations.length > 0) {
      setRouteStations(newStations);
      setActiveStationIcao(newStations[0].icao);
    }
  };

  return (
    <div className={`min-h-screen bg-cockpit-950 text-slate-100 flex flex-col ${nightVision ? 'night-vision' : ''}`}>
      
      {/* Cockpit Header */}
      <Header
        currentIcao={activeStationIcao}
        onSearch={handleSearch}
        loading={loading}
        onRefresh={() => fetchBriefing(activeStationIcao)}
        onOpenSimbrief={() => setShowSimbriefModal(true)}
        nightVision={nightVision}
        setNightVision={setNightVision}
        onPrint={() => setShowPrintModal(true)}
        lastUpdated={lastUpdated}
      />

      {/* Route & Multi-Airport Dossier Switcher */}
      <RouteBar
        routeStations={routeStations}
        activeStationIcao={activeStationIcao}
        onSelectStation={handleSelectStation}
        onAddStation={handleAddStation}
        onRemoveStation={handleRemoveStation}
        simbriefPlan={simbriefPlan}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 space-y-5">
        
        {/* Navigation Tabs for Active Airport */}
        <div className="flex items-center justify-between border-b border-cockpit-border pb-2 overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                activeTab === 'ALL'
                  ? 'bg-cockpit-cyan text-cockpit-950 shadow-md shadow-cockpit-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-cockpit-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>BRIEFING COMPLETO</span>
            </button>

            <button
              onClick={() => setActiveTab('METAR')}
              className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                activeTab === 'METAR'
                  ? 'bg-cockpit-cyan text-cockpit-950 shadow-md shadow-cockpit-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-cockpit-900'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>METAR & TAF</span>
            </button>

            <button
              onClick={() => setActiveTab('RUNWAYS')}
              className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                activeTab === 'RUNWAYS'
                  ? 'bg-cockpit-cyan text-cockpit-950 shadow-md shadow-cockpit-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-cockpit-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>PISTAS Y VIENTO</span>
            </button>

            <button
              onClick={() => setActiveTab('NOTAMS')}
              className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                activeTab === 'NOTAMS'
                  ? 'bg-cockpit-cyan text-cockpit-950 shadow-md shadow-cockpit-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-cockpit-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>NOTAMS ({briefingData?.notams?.summary?.total || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('VATSIM')}
              className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                activeTab === 'VATSIM'
                  ? 'bg-cockpit-cyan text-cockpit-950 shadow-md shadow-cockpit-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-cockpit-900'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>RED VATSIM</span>
            </button>
          </div>

          {/* Quick Refresh Status */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>DATOS EN VIVO ACTUALIZADOS</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="p-12 text-center bg-cockpit-900/60 border border-cockpit-border rounded-2xl flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-cockpit-cyan animate-spin" />
            <div className="font-mono text-sm text-slate-200">
              Consultando fuentes oficiales en tiempo real (NOAA AWC, FAA NOTAM, VATSIM)...
            </div>
            <div className="text-xs font-mono text-slate-500">
              Decodificando observaciones y calculando componentes de viento para {activeStationIcao}...
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && !loading && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchBriefing(activeStationIcao)}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-black rounded border border-rose-500/50 transition-colors font-bold"
            >
              REINTENTAR
            </button>
          </div>
        )}

        {/* Loaded Briefing View */}
        {briefingData && !loading && (
          <div className="space-y-6">
            
            {/* View: ALL or specific tabs */}
            {(activeTab === 'ALL' || activeTab === 'METAR') && (
              <WeatherCard 
                weather={briefingData.weather} 
                windAnalysis={briefingData.windAnalysis} 
              />
            )}

            {(activeTab === 'ALL' || activeTab === 'RUNWAYS') && (
              <RunwayWindAnalysis 
                windAnalysis={briefingData.windAnalysis} 
                metar={briefingData.weather?.metar} 
              />
            )}

            {(activeTab === 'ALL' || activeTab === 'NOTAMS') && (
              <NotamSection 
                notamsData={briefingData.notams} 
                icao={activeStationIcao} 
                airportCoords={briefingData.weather?.airport ? { lat: briefingData.weather.airport.lat, lon: briefingData.weather.airport.lon } : null}
              />
            )}

            {(activeTab === 'ALL' || activeTab === 'VATSIM') && (
              <VatsimCard 
                vatsimData={briefingData.vatsim} 
                icao={activeStationIcao} 
              />
            )}

          </div>
        )}

      </main>

      {/* Cockpit Footer */}
      <footer className="border-t border-cockpit-border bg-cockpit-900/60 py-3 px-4 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PILOTBRIEFINGAPP • INFORMACIÓN AERONÁUTICA EN TIEMPO REAL</span>
          <span>FUENTES: NOAA AVIATION WEATHER CENTER • FAA FNS • VATSIM NETWORK</span>
        </div>
      </footer>

      {/* SimBrief Import Modal */}
      <SimBriefModal
        isOpen={showSimbriefModal}
        onClose={() => setShowSimbriefModal(false)}
        onImportPlan={handleImportSimbriefPlan}
      />

      {/* Printable / PDF Export Modal */}
      {showPrintModal && (
        <PrintableBriefing
          briefing={briefingData}
          simbriefPlan={simbriefPlan}
          onClose={() => setShowPrintModal(false)}
        />
      )}

    </div>
  );
}
