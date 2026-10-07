import React, { useState } from 'react';
import { Database, X, ArrowRight, Download, Check, AlertCircle, RefreshCw, Plane } from 'lucide-react';

export default function SimBriefModal({ isOpen, onClose, onImportPlan }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedPlan, setFetchedPlan] = useState(null);

  if (!isOpen) return null;

  const handleFetch = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setFetchedPlan(null);

    try {
      const res = await fetch(`/api/simbrief/${encodeURIComponent(username.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al obtener plan de vuelo de SimBrief');
      }

      setFetchedPlan(data);
    } catch (err) {
      setError(err.message || 'No se pudo conectar con la API de SimBrief');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (fetchedPlan) {
      onImportPlan(fetchedPlan);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-cockpit-900 border border-cockpit-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cockpit-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-base text-white">IMPORTAR OFP DE SIMBRIEF</h3>
              <p className="text-xs text-slate-400 font-mono">Carga tu último plan de vuelo generado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cockpit-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form input */}
        <form onSubmit={handleFetch} className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
              Nombre de usuario o Pilot ID de SimBrief:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. TuUsuario o 123456"
                className="flex-1 px-3 py-2 bg-cockpit-950 border border-cockpit-border rounded-lg text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cockpit-cyan"
              />
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>BUSCAR OFP</span>
              </button>
            </div>
          </div>
        </form>

        {/* Error state */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Fetched OFP Preview */}
        {fetchedPlan && (
          <div className="bg-cockpit-950 p-4 rounded-xl border border-cockpit-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cockpit-border">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-mono font-bold text-sm">
                  {fetchedPlan.flightNumber || 'FLIGHT'}
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  ({fetchedPlan.aircraft?.name || fetchedPlan.aircraft?.icaoCode})
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                CRZ: <strong className="text-white">{fetchedPlan.cruiseAltitude}</strong>
              </span>
            </div>

            {/* Origin -> Dest -> Alternate badges */}
            <div className="flex items-center justify-between gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-cockpit-900 border border-cockpit-border flex-1 text-center">
                <div className="text-[10px] text-slate-500 uppercase">ORIGEN</div>
                <div className="text-sm font-bold text-cockpit-cyan">{fetchedPlan.origin?.icao}</div>
                <div className="text-[10px] text-slate-400">RWY {fetchedPlan.origin?.planRwy || '--'}</div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />

              <div className="p-2 rounded bg-cockpit-900 border border-cockpit-border flex-1 text-center">
                <div className="text-[10px] text-slate-500 uppercase">DESTINO</div>
                <div className="text-sm font-bold text-amber-400">{fetchedPlan.destination?.icao}</div>
                <div className="text-[10px] text-slate-400">RWY {fetchedPlan.destination?.planRwy || '--'}</div>
              </div>

              {fetchedPlan.alternate?.icao && (
                <>
                  <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div className="p-2 rounded bg-cockpit-900 border border-cockpit-border flex-1 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">ALTERNATIVO</div>
                    <div className="text-sm font-bold text-purple-400">{fetchedPlan.alternate?.icao}</div>
                    <div className="text-[10px] text-slate-400">RWY {fetchedPlan.alternate?.planRwy || '--'}</div>
                  </div>
                </>
              )}
            </div>

            {/* Route preview */}
            {fetchedPlan.route && (
              <div className="text-[11px] font-mono text-slate-400 bg-cockpit-900 p-2 rounded border border-cockpit-border truncate">
                <strong className="text-slate-300">RUTA:</strong> {fetchedPlan.route}
              </div>
            )}

            {/* Fuel & Weights */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
              <span>Combustible Block: <strong className="text-slate-200">{fetchedPlan.fuel?.block}</strong></span>
              <span>Distancia: <strong className="text-slate-200">{fetchedPlan.distance}</strong></span>
              <span>ETE: <strong className="text-slate-200">{fetchedPlan.ete}</strong></span>
            </div>

            {/* Apply button */}
            <button
              onClick={handleApply}
              className="w-full mt-2 py-2.5 rounded-lg bg-cockpit-cyan hover:bg-cyan-400 text-cockpit-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cockpit-cyan/20"
            >
              <Check className="w-4 h-4" />
              <span>CARGAR EN EL BRIEFING DE VUELO</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
