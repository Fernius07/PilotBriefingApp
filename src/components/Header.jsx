import React, { useState, useEffect } from 'react';
import { 
  Plane, Search, RefreshCw, Clock, MapPin, Database
} from 'lucide-react';

const QUICK_AIRPORTS = ['LEMD', 'KJFK', 'EGLL', 'LFPG', 'EDDF', 'KLAX', 'OMDB', 'SAEZ'];

export default function Header({ 
  currentIcao, 
  onSearch, 
  loading, 
  onRefresh, 
  onOpenSimbrief
}) {
  const [searchInput, setSearchInput] = useState('');
  const [zuluTime, setZuluTime] = useState('');

  // Update Zulu clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setZuluTime(`${h}:${m}:${s}Z`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const clean = searchInput.trim().toUpperCase();
    if (clean.length >= 3) {
      onSearch(clean);
      setSearchInput('');
    }
  };

  return (
    <header className="border-b border-cockpit-border bg-cockpit-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Live status */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cockpit-cyan/15 border border-cockpit-cyan/30 flex items-center justify-center text-cockpit-cyan shadow-lg shadow-cockpit-cyan/10">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-slate-100 font-mono">
                  PILOT<span className="text-cockpit-cyan">BRIEFING</span>
                </span>
                <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-cockpit-cyan text-cockpit-950 uppercase tracking-wider font-mono">APP</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE NOAA / FAA
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cockpit-cyan" />
                  {zuluTime}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Right Tools */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenSimbrief}
              className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono"
              title="Import flight plan from SimBrief"
            >
              <Database className="w-4 h-4" />
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg bg-cockpit-800 border border-cockpit-border text-slate-300 hover:text-white"
              title="Refresh live data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cockpit-cyan' : ''}`} />
            </button>
          </div>
        </div>

        {/* Airport Search Bar */}
        <div className="w-full md:w-auto flex-1 max-w-lg">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <div className="absolute left-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              placeholder="Search ICAO (e.g. LEMD, KJFK, EGLL, KLAX)..."
              maxLength={5}
              className="w-full pl-9 pr-24 py-2 bg-cockpit-950 border border-cockpit-border rounded-lg text-sm text-slate-100 placeholder-slate-500 font-mono tracking-widest focus:outline-none focus:border-cockpit-cyan transition-colors"
            />
            <button
              type="submit"
              disabled={loading || searchInput.trim().length < 3}
              className="absolute right-1 px-3 py-1.5 rounded-md bg-cockpit-cyan/20 hover:bg-cockpit-cyan text-cockpit-cyan hover:text-cockpit-950 border border-cockpit-cyan/40 text-xs font-mono font-semibold transition-all disabled:opacity-40"
            >
              SEARCH
            </button>
          </form>

          {/* Quick Airports Pills */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1 mr-1">
              <MapPin className="w-3 h-3" /> Frequent:
            </span>
            {QUICK_AIRPORTS.map((code) => (
              <button
                key={code}
                onClick={() => onSearch(code)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  currentIcao === code
                    ? 'bg-cockpit-cyan text-cockpit-950 font-bold'
                    : 'bg-cockpit-850 hover:bg-cockpit-800 text-slate-300 border border-cockpit-border'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: SimBrief, Refresh */}
        <div className="hidden md:flex items-center gap-2">
          {/* SimBrief Button */}
          <button
            onClick={onOpenSimbrief}
            className="px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Import operational flight plan from SimBrief"
          >
            <Database className="w-3.5 h-3.5" />
            SIMBRIEF OFP
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-cockpit-850 hover:bg-cockpit-800 border border-cockpit-border text-slate-300 hover:text-cockpit-cyan text-xs font-mono flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Refresh real-time data from NOAA and FAA"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cockpit-cyan' : ''}`} />
            <span>REFRESH</span>
          </button>
        </div>

      </div>
    </header>
  );
}
