import React, { useState } from 'react';
import { Plane, Plus, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { getFlightCategoryBadge } from '../utils/aviationHelpers';

export default function RouteBar({ 
  routeStations, 
  activeStationIcao, 
  onSelectStation, 
  onAddStation, 
  onRemoveStation,
  simbriefPlan
}) {
  const [newIcao, setNewIcao] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newIcao.trim().length >= 3) {
      onAddStation(newIcao.trim().toUpperCase());
      setNewIcao('');
      setShowAddInput(false);
    }
  };

  return (
    <div className="bg-cockpit-900 border-b border-cockpit-border px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Route Stations Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5 mr-2">
            <Plane className="w-3.5 h-3.5 text-cockpit-cyan" />
            RUTA / DOSSIER:
          </span>

          {routeStations.map((station, idx) => {
            const isActive = station.icao === activeStationIcao;
            const badge = getFlightCategoryBadge(station.fltCat);

            return (
              <div
                key={station.icao}
                className="flex items-center"
              >
                {idx > 0 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 mx-1 flex-shrink-0" />
                )}
                <div className={`flex items-center rounded-lg border text-xs font-mono transition-all ${
                  isActive 
                    ? 'bg-cockpit-cyan/15 border-cockpit-cyan text-slate-100 shadow-md shadow-cockpit-cyan/10' 
                    : 'bg-cockpit-850 hover:bg-cockpit-800 border-cockpit-border text-slate-300'
                }`}>
                  <button
                    onClick={() => onSelectStation(station.icao)}
                    className="px-2.5 py-1.5 flex items-center gap-2 text-left"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {station.role || (idx === 0 ? 'DEP' : idx === 1 ? 'ARR' : 'ALTN')}
                    </span>
                    <span className="font-bold tracking-wider">{station.icao}</span>
                    {station.fltCat && (
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${badge.bgColor} ${badge.textColor} border ${badge.borderColor}`}>
                        {station.fltCat}
                      </span>
                    )}
                  </button>

                  {/* Allow removing alternate stations if more than 1 */}
                  {routeStations.length > 1 && (
                    <button
                      onClick={() => onRemoveStation(station.icao)}
                      className="pr-2 pl-0.5 py-1.5 text-slate-500 hover:text-rose-400"
                      title="Eliminar del dossier"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Station Input / Button */}
          {showAddInput ? (
            <form onSubmit={handleAddSubmit} className="flex items-center gap-1 ml-2">
              <input
                type="text"
                value={newIcao}
                onChange={(e) => setNewIcao(e.target.value.toUpperCase())}
                placeholder="ICAO"
                maxLength={4}
                autoFocus
                className="w-16 px-2 py-1 bg-cockpit-950 border border-cockpit-cyan rounded text-xs font-mono text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-cockpit-cyan text-cockpit-950 rounded text-xs font-mono font-bold"
              >
                Añadir
              </button>
              <button
                type="button"
                onClick={() => setShowAddInput(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddInput(true)}
              className="ml-2 px-2.5 py-1.5 rounded-lg border border-dashed border-cockpit-border hover:border-slate-500 text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center gap-1 transition-colors"
              title="Añadir aeropuerto alternativo o en ruta"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Escala / Alternativo</span>
            </button>
          )}
        </div>

        {/* SimBrief Flight details pill if imported */}
        {simbriefPlan && (
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono bg-cockpit-850 px-3 py-1 rounded-lg border border-cockpit-border">
            <span className="text-amber-400 font-semibold">{simbriefPlan.flightNumber || 'FLT'}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">{simbriefPlan.aircraft?.name || simbriefPlan.aircraft?.icaoCode}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">CRZ: {simbriefPlan.cruiseAltitude}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">BLOCK: {simbriefPlan.fuel?.block}</span>
          </div>
        )}

      </div>
    </div>
  );
}
