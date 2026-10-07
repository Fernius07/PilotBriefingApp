import React, { useState } from 'react';
import { Radio, Users, PlaneTakeoff, PlaneLanding, Clock, Wifi, Shield } from 'lucide-react';
import { formatZuluDateTime } from '../utils/aviationHelpers';

export default function VatsimCard({ vatsimData, icao }) {
  const [activeTab, setActiveTab] = useState('ATC'); // 'ATC' | 'TRAFFIC'

  if (!vatsimData) {
    return (
      <div className="bg-cockpit-900 border border-cockpit-border rounded-xl p-5 text-center text-slate-400 font-mono text-xs">
        No se pudieron obtener datos de la red VATSIM en este momento.
      </div>
    );
  }

  const { hasAtcOnline, controllers, inbounds, outbounds, timestamp } = vatsimData;

  return (
    <div className="bg-cockpit-900 border border-cockpit-border rounded-xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <h2 className="font-mono font-bold text-base tracking-wider uppercase text-white">
              COBERTURA ATC Y TRÁFICO EN RED (VATSIM)
            </h2>
            {hasAtcOnline ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {controllers.length} CONTROLADOR(ES) ONLINE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-400 border border-slate-600 text-xs font-mono">
                UNICOM 122.800 (SIN ATC)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Integración en vivo con simuladores (MSFS 2024/2020, X-Plane, P3D)
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-cockpit-950 p-1 rounded-lg border border-cockpit-border text-xs font-mono">
          <button
            onClick={() => setActiveTab('ATC')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'ATC'
                ? 'bg-cockpit-cyan text-cockpit-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>ESTACIONES ATC ({controllers?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('TRAFFIC')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'TRAFFIC'
                ? 'bg-cockpit-cyan text-cockpit-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>TRÁFICO ({ (inbounds?.length || 0) + (outbounds?.length || 0) })</span>
          </button>
        </div>
      </div>

      {/* Tab: Online ATC Controllers */}
      {activeTab === 'ATC' && (
        <div>
          {controllers && controllers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {controllers.map((ctrl, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-cockpit-950 border border-cockpit-border flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        {ctrl.callsign}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                        {ctrl.positionType}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-mono mb-2">
                      {ctrl.positionLabel}
                    </div>

                    <div className="flex items-center justify-between bg-cockpit-900 p-2 rounded-lg border border-cockpit-border font-mono text-xs">
                      <span className="text-slate-400">FRECUENCIA:</span>
                      <span className="text-white font-bold text-sm tracking-wider">{ctrl.frequency} MHz</span>
                    </div>
                  </div>

                  {ctrl.text_atis && (
                    <div className="mt-2 p-2 bg-cockpit-900/50 rounded text-[11px] font-mono text-slate-400 border border-cockpit-border/50 truncate" title={ctrl.text_atis}>
                      ATIS: {ctrl.text_atis}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-cockpit-950 border border-cockpit-border text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <Radio className="w-5 h-5" />
              </div>
              <div className="font-mono text-sm font-bold text-slate-200">
                No hay controladores conectados para {icao} actualmente
              </div>
              <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
                Opere bajo auto-coordinación en la frecuencia Unicom <strong className="text-cockpit-cyan">122.800 MHz</strong> transmitiendo intenciones en rodaje, pista y circuito.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Inbound & Outbound Traffic */}
      {activeTab === 'TRAFFIC' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Inbound flights */}
          <div className="bg-cockpit-950 p-4 rounded-xl border border-cockpit-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cockpit-border">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <PlaneLanding className="w-4 h-4 text-cockpit-cyan" />
                LLEGADAS PREVISTAS ({inbounds?.length || 0})
              </span>
            </div>
            {inbounds && inbounds.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {inbounds.map((flight, i) => (
                  <div key={i} className="p-2 bg-cockpit-900 rounded border border-cockpit-border flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-white">{flight.callsign}</span>
                      <span className="text-slate-400 ml-2">({flight.aircraft})</span>
                    </div>
                    <div className="text-right text-slate-400">
                      <span>Desde <strong className="text-cockpit-cyan">{flight.departure || '???'}</strong></span>
                      <div className="text-[10px]">FL{Math.round(flight.altitude / 100)} • {flight.groundspeed}kt</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-500 py-4 text-center">
                Sin vuelos entrantes reportados en VATSIM
              </div>
            )}
          </div>

          {/* Outbound flights */}
          <div className="bg-cockpit-950 p-4 rounded-xl border border-cockpit-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cockpit-border">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <PlaneTakeoff className="w-4 h-4 text-amber-400" />
                SALIDAS PREVISTAS ({outbounds?.length || 0})
              </span>
            </div>
            {outbounds && outbounds.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {outbounds.map((flight, i) => (
                  <div key={i} className="p-2 bg-cockpit-900 rounded border border-cockpit-border flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-white">{flight.callsign}</span>
                      <span className="text-slate-400 ml-2">({flight.aircraft})</span>
                    </div>
                    <div className="text-right text-slate-400">
                      <span>Hacia <strong className="text-amber-400">{flight.arrival || '???'}</strong></span>
                      <div className="text-[10px]">FL{Math.round(flight.altitude / 100)} • {flight.groundspeed}kt</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-500 py-4 text-center">
                Sin vuelos salientes reportados en VATSIM
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
