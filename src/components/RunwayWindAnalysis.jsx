import React, { useState } from 'react';
import { 
  Compass, Wind, AlertTriangle, CheckCircle, 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Layers 
} from 'lucide-react';

export default function RunwayWindAnalysis({ windAnalysis, metar }) {
  const [selectedRunwayId, setSelectedRunwayId] = useState(null);

  if (!windAnalysis || !windAnalysis.runwayEnds || windAnalysis.runwayEnds.length === 0) {
    return (
      <div className="bg-cockpit-900 border border-cockpit-border rounded-xl p-6 text-center text-slate-400 font-mono">
        No se encontraron datos de pistas para este aeródromo.
      </div>
    );
  }

  const { runwayEnds, bestRunway, windSummary } = windAnalysis;
  const windDir = windSummary.direction;
  const windSpeed = windSummary.speed;
  const windGust = windSummary.gust;

  // Selected runway or best runway by default
  const activeRunway = selectedRunwayId 
    ? runwayEnds.find(r => r.id === selectedRunwayId) || runwayEnds[0]
    : runwayEnds.find(r => r.id === bestRunway) || runwayEnds[0];

  // Unique physical runways (pairs)
  const uniquePairs = [];
  const seenPairs = new Set();
  for (const rwy of runwayEnds) {
    if (!seenPairs.has(rwy.pairId)) {
      seenPairs.add(rwy.pairId);
      uniquePairs.push(rwy);
    }
  }

  return (
    <div className="bg-cockpit-900 border border-cockpit-border rounded-xl p-5 shadow-lg space-y-5">
      
      {/* Title & Wind Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cockpit-cyan" />
            <h2 className="font-mono font-bold text-base tracking-wider uppercase text-white">
              ANÁLISIS DE PISTA Y COMPONENTES DEL VIENTO
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Viento actual en superficie: <strong className="text-cockpit-cyan">{windDir !== 'VRB' ? `${String(windDir).padStart(3, '0')}°` : 'VRB'} a {windSpeed} KT</strong>
            {windGust && <span className="text-amber-400"> (Rachas: {windGust} KT)</span>}
          </p>
        </div>

        {/* Best Runway Recommendation Pill */}
        {bestRunway && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-xs flex items-center gap-2 glow-green">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>PISTA PREFERIDA: <strong className="text-white text-sm">RWY {bestRunway}</strong></span>
          </div>
        )}
      </div>

      {/* Main Grid: Visual SVG Compass Diagram + Runway Component Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Visual Runway Compass (SVG) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-cockpit-950 rounded-xl border border-cockpit-border relative">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            
            {/* SVG Compass Rose */}
            <svg viewBox="0 0 300 300" className="w-full h-full">
              {/* Outer dial */}
              <circle cx="150" cy="150" r="135" fill="#0c131d" stroke="#1f2e42" strokeWidth="2" />
              <circle cx="150" cy="150" r="120" fill="none" stroke="#162334" strokeWidth="1" strokeDasharray="3 3" />

              {/* Degree ticks */}
              {[...Array(36)].map((_, i) => {
                const deg = i * 10;
                const rad = (deg * Math.PI) / 180;
                const isMajor = deg % 30 === 0;
                const r1 = 135;
                const r2 = isMajor ? 122 : 128;
                const x1 = 150 + r1 * Math.sin(rad);
                const y1 = 150 - r1 * Math.cos(rad);
                const x2 = 150 + r2 * Math.sin(rad);
                const y2 = 150 - r2 * Math.cos(rad);

                return (
                  <line
                    key={deg}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isMajor ? '#475569' : '#334155'}
                    strokeWidth={isMajor ? 1.5 : 1}
                  />
                );
              })}

              {/* Cardinal Labels */}
              <text x="150" y="32" textAnchor="middle" fill="#00d2ff" fontSize="12" fontWeight="bold" fontFamily="monospace">N 360°</text>
              <text x="272" y="154" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">E 090°</text>
              <text x="150" y="278" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">S 180°</text>
              <text x="28" y="154" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">W 270°</text>

              {/* Draw Runway Strips */}
              {uniquePairs.map((rwy) => {
                const hdg = rwy.heading || 0;
                const isSelected = activeRunway?.pairId === rwy.pairId;
                const ids = rwy.pairId.split('/');
                const id1 = ids[0] || '';
                const id2 = ids[1] || '';

                return (
                  <g key={rwy.pairId} transform={`rotate(${hdg}, 150, 150)`}>
                    {/* Asphalt runway strip */}
                    <rect
                      x="142"
                      y="45"
                      width="16"
                      height="210"
                      rx="3"
                      fill={isSelected ? '#00e676' : '#334155'}
                      stroke={isSelected ? '#00e676' : '#64748b'}
                      strokeWidth="1.5"
                      className="cursor-pointer transition-colors"
                      onClick={() => setSelectedRunwayId(rwy.id)}
                    />
                    {/* Centerline */}
                    <line
                      x1="150"
                      y1="55"
                      x2="150"
                      y2="245"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeDasharray="8 6"
                      strokeOpacity="0.8"
                    />
                    {/* End 1 label */}
                    <text
                      x="150"
                      y="40"
                      textAnchor="middle"
                      fill={rwy.id === bestRunway ? '#00e676' : '#f8fafc'}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {id1}
                    </text>
                    {/* End 2 label */}
                    <text
                      x="150"
                      y="270"
                      textAnchor="middle"
                      fill={rwy.oppositeId === bestRunway ? '#00e676' : '#f8fafc'}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                      transform="rotate(180, 150, 270)"
                    >
                      {id2}
                    </text>
                  </g>
                );
              })}

              {/* Dynamic Wind Vector Arrow */}
              {windDir !== 'VRB' && windDir !== null && (
                <g transform={`rotate(${windDir}, 150, 150)`}>
                  {/* Wind source arrow pointing inward */}
                  <line
                    x1="150"
                    y1="10"
                    x2="150"
                    y2="85"
                    stroke="#ffab00"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Arrow head pointing towards center */}
                  <polygon
                    points="150,95 143,80 157,80"
                    fill="#ffab00"
                  />
                  {/* Wind origin circle */}
                  <circle cx="150" cy="10" r="5" fill="#ffab00" />
                </g>
              )}

              {/* Center Pivot Indicator */}
              <circle cx="150" cy="150" r="4" fill="#00d2ff" />
            </svg>

            {/* Wind Vector Label Badge overlay */}
            <div className="absolute bottom-2 left-2 right-2 text-center bg-cockpit-900/90 border border-cockpit-border rounded px-2 py-1 text-[11px] font-mono text-amber-300">
              Flecha ámbar: Viento {windDir !== 'VRB' ? `${String(windDir).padStart(3, '0')}°` : 'VRB'} @ {windSpeed} KT
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500 mt-2">
            Haga clic en una pista para inspeccionar componentes
          </span>
        </div>

        {/* Detailed Selected Runway Wind Component Card */}
        <div className="lg:col-span-7 space-y-4">
          {activeRunway && (
            <div className="bg-cockpit-950 p-4 rounded-xl border border-cockpit-border">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-cockpit-border">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold font-mono text-white">
                    RWY {activeRunway.id}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Rumbo: <strong className="text-slate-200">{String(activeRunway.heading).padStart(3, '0')}° MAG</strong>
                  </span>
                  {activeRunway.id === bestRunway && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/40">
                      FAVORECIDA
                    </span>
                  )}
                </div>

                <div className="text-xs font-mono text-slate-400">
                  {activeRunway.dimension ? `${activeRunway.dimension} FT` : ''} 
                  {activeRunway.surface ? ` (${activeRunway.surface === 'A' ? 'Asfalto' : activeRunway.surface === 'C' ? 'Hormigón' : 'Pavimento'})` : ''}
                </div>
              </div>

              {/* Component Gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                
                {/* Headwind / Tailwind */}
                <div className={`p-3 rounded-lg border font-mono ${
                  activeRunway.windAnalysis.headwind > 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : activeRunway.windAnalysis.tailwind > 0
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-cockpit-900 border-cockpit-border text-slate-400'
                }`}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{activeRunway.windAnalysis.headwind > 0 ? 'VIENTO DE FRENTE' : 'VIENTO DE COLA'}</span>
                    {activeRunway.windAnalysis.headwind > 0 ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {activeRunway.windAnalysis.headwind > 0 
                      ? `${activeRunway.windAnalysis.headwind} KT` 
                      : activeRunway.windAnalysis.tailwind > 0 
                        ? `${activeRunway.windAnalysis.tailwind} KT` 
                        : '0 KT'}
                  </div>
                  <div className="text-[10px] opacity-80 mt-1">
                    {activeRunway.windAnalysis.headwind > 0 ? 'Favorable para aterrizaje/despegue' : 'Desfavorable (Cola)'}
                  </div>
                </div>

                {/* Crosswind */}
                <div className={`p-3 rounded-lg border font-mono ${
                  activeRunway.windAnalysis.isExtremeCrosswind
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-400 glow-red'
                    : activeRunway.windAnalysis.isHighCrosswind
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 glow-amber'
                      : 'bg-cockpit-900 border-cockpit-border text-slate-300'
                }`}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>VIENTO CRUZADO</span>
                    {activeRunway.windAnalysis.crosswindDir === 'LEFT' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {activeRunway.windAnalysis.crosswind} KT
                  </div>
                  <div className="text-[10px] opacity-80 mt-1">
                    {activeRunway.windAnalysis.crosswindDir === 'LEFT' 
                      ? 'Desde la IZQUIERDA' 
                      : activeRunway.windAnalysis.crosswindDir === 'RIGHT' 
                        ? 'Desde la DERECHA' 
                        : 'Sin componente cruzado'}
                  </div>
                </div>

                {/* Angular Difference */}
                <div className="p-3 rounded-lg border border-cockpit-border bg-cockpit-900 font-mono col-span-2 sm:col-span-1">
                  <div className="text-xs text-slate-400 mb-1">ÁNGULO RELATIVO</div>
                  <div className="text-2xl font-bold text-white">
                    {activeRunway.windAnalysis.angleDiff}°
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Diferencia pista vs viento
                  </div>
                </div>

              </div>

              {/* Warning alert if high crosswind or tailwind */}
              {activeRunway.windAnalysis.isHighTailwind && (
                <div className="mt-3 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>PRECAUCIÓN: Componente de viento de cola superior a 10 KT. Verifique limitaciones de aeronave.</span>
                </div>
              )}

              {activeRunway.windAnalysis.isHighCrosswind && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  <span>PRECAUCIÓN: Viento cruzado de {activeRunway.windAnalysis.crosswind} KT. Requiere técnica de aterrizaje con viento cruzado.</span>
                </div>
              )}
            </div>
          )}

          {/* Quick List of All Airport Runway Ends */}
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
              TODAS LAS CABECERAS DE PISTA ({runwayEnds.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {runwayEnds.map((rwy) => {
                const isSelected = rwy.id === activeRunway?.id;
                const isBest = rwy.id === bestRunway;

                return (
                  <button
                    key={rwy.id}
                    onClick={() => setSelectedRunwayId(rwy.id)}
                    className={`p-2 rounded-lg border text-left font-mono transition-all ${
                      isSelected
                        ? 'bg-cockpit-cyan/20 border-cockpit-cyan text-white shadow-sm'
                        : isBest
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-cockpit-950 hover:bg-cockpit-850 border-cockpit-border text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">RWY {rwy.id}</span>
                      {isBest && <span className="text-[9px] bg-emerald-400 text-black px-1 rounded font-bold">BEST</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {rwy.windAnalysis.headwind > 0 ? (
                        <span className="text-emerald-400 font-semibold">HW {rwy.windAnalysis.headwind}kt</span>
                      ) : (
                        <span className="text-rose-400">TW {rwy.windAnalysis.tailwind}kt</span>
                      )}
                      <span className="text-slate-500"> • </span>
                      <span>XW {rwy.windAnalysis.crosswind}kt</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
