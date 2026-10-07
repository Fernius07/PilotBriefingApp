import React, { useState } from 'react';
import { 
  Cloud, Wind, Thermometer, Gauge, Eye, EyeOff, 
  AlertTriangle, Copy, Check, Clock, ShieldAlert,
  Zap, Snowflake, Compass, Layers, ArrowUpRight
} from 'lucide-react';
import { 
  getFlightCategoryBadge, 
  formatZuluTime, 
  formatZuluDateTime, 
  hpaToInhg, 
  calculateDensityAltitude,
  copyToClipboard 
} from '../utils/aviationHelpers';

export default function WeatherCard({ weather, windAnalysis }) {
  const [copiedMetar, setCopiedMetar] = useState(false);
  const [copiedTaf, setCopiedTaf] = useState(false);
  const [showRawTaf, setShowRawTaf] = useState(false);

  if (!weather) {
    return (
      <div className="bg-cockpit-900 border border-cockpit-border rounded-xl p-6 text-center text-slate-400 font-mono">
        No hay datos meteorológicos disponibles para esta estación.
      </div>
    );
  }

  const { metar, taf, airport, fltCat, environmentalThreats } = weather;
  const categoryBadge = getFlightCategoryBadge(fltCat);

  const handleCopyMetar = () => {
    if (metar?.rawOb) {
      copyToClipboard(metar.rawOb);
      setCopiedMetar(true);
      setTimeout(() => setCopiedMetar(false), 2000);
    }
  };

  const handleCopyTaf = () => {
    if (taf?.rawTAF) {
      copyToClipboard(taf.rawTAF);
      setCopiedTaf(true);
      setTimeout(() => setCopiedTaf(false), 2000);
    }
  };

  const densityAlt = metar ? calculateDensityAltitude(metar.altim, metar.temp, airport?.elevation || 0) : null;
  const tempSpread = (metar && metar.temp !== undefined && metar.dewp !== undefined) 
    ? (metar.temp - metar.dewp).toFixed(1) 
    : null;

  return (
    <div className="space-y-4">
      {/* Airport Header Card */}
      <div className="bg-cockpit-900 border border-cockpit-border rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold font-mono tracking-wider text-white">
                {airport?.icaoId || weather.icao}
              </span>
              {airport?.iataId && (
                <span className="px-2 py-0.5 rounded bg-cockpit-800 border border-cockpit-border text-slate-300 font-mono text-sm font-semibold">
                  {airport.iataId}
                </span>
              )}
              {/* Flight Category Pill */}
              <div className={`px-3 py-1 rounded-lg border flex items-center gap-2 ${categoryBadge.bgColor} ${categoryBadge.borderColor} ${categoryBadge.textColor} ${categoryBadge.glowClass}`}>
                <span className={`w-2 h-2 rounded-full ${categoryBadge.dotColor} animate-pulse`}></span>
                <span className="font-mono font-bold text-sm">{categoryBadge.label}</span>
                <span className="text-xs font-sans opacity-90 hidden md:inline">({categoryBadge.name})</span>
              </div>
            </div>

            <h1 className="text-base font-medium text-slate-200 mt-1">
              {airport?.name || 'Aeródromo'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 mt-1.5">
              <span>ELEV: <strong className="text-slate-200">{airport?.elevation || 0} FT</strong></span>
              <span>•</span>
              <span>COORD: <strong className="text-slate-200">{airport?.lat?.toFixed(3)}°, {airport?.lon?.toFixed(3)}°</strong></span>
              <span>•</span>
              <span>MAG VAR: <strong className="text-slate-200">{airport?.magdec || '0°'}</strong></span>
            </div>
          </div>

          {/* ATC Frequencies pill list */}
          {airport?.frequencyList && airport.frequencyList.length > 0 && (
            <div className="flex flex-wrap sm:flex-col gap-1.5 text-xs font-mono bg-cockpit-950 p-2.5 rounded-lg border border-cockpit-border max-w-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">FRECUENCIAS OFICIALES</span>
              <div className="flex flex-wrap gap-2">
                {airport.frequencyList.slice(0, 4).map((f, i) => (
                  <span key={i} className="text-slate-300">
                    <span className="text-cockpit-cyan font-bold">{f.type}:</span> {f.freq}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Environmental Threat Alerts (If active) */}
        {environmentalThreats && environmentalThreats.length > 0 && (
          <div className="mt-4 pt-4 border-t border-cockpit-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 tracking-wider uppercase">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              ALERTAS METEOROLÓGICAS Y DE AMENAZA EN CABINA ({environmentalThreats.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {environmentalThreats.map((threat) => (
                <div 
                  key={threat.id} 
                  className={`p-3 rounded-lg border flex items-start gap-3 ${
                    threat.level === 'CRITICAL' 
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-200' 
                      : threat.level === 'WARNING' 
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' 
                        : 'bg-sky-500/10 border-sky-500/40 text-sky-200'
                  }`}
                >
                  <div className="p-1.5 rounded bg-black/30 mt-0.5">
                    {threat.id === 'icing' && <Snowflake className="w-4 h-4 text-sky-400" />}
                    {threat.id === 'convective' && <Zap className="w-4 h-4 text-amber-400" />}
                    {threat.id === 'low_vis' && <EyeOff className="w-4 h-4 text-rose-400" />}
                    {threat.id === 'wind_hazard' && <Wind className="w-4 h-4 text-amber-400" />}
                    {threat.id === 'low_qnh' && <Gauge className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase font-mono tracking-wide">{threat.title}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40">{threat.badge}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{threat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Real-time METAR Observation */}
      <div className="bg-cockpit-900 border border-cockpit-border rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cockpit-cyan animate-ping"></span>
            <span className="font-mono font-bold text-sm tracking-wider uppercase text-white">
              METAR EN TIEMPO REAL
            </span>
            {metar?.receiptTime && (
              <span className="text-xs font-mono text-slate-400 ml-2">
                (Observado: {formatZuluDateTime(metar.receiptTime)})
              </span>
            )}
          </div>
          <button
            onClick={handleCopyMetar}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cockpit-850 hover:bg-cockpit-800 border border-cockpit-border text-xs font-mono text-slate-300 transition-colors"
          >
            {copiedMetar ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMetar ? 'COPIADO' : 'COPIAR RAW'}</span>
          </button>
        </div>

        {/* Raw METAR Text Box */}
        <div className="bg-cockpit-950 p-3 rounded-lg border border-cockpit-border font-mono text-sm text-cockpit-cyan tracking-wide break-words select-all">
          {metar?.rawOb || 'No METAR observation reported.'}
        </div>

        {/* Decoded METAR Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          
          {/* Wind */}
          <div className="bg-cockpit-950/80 p-3 rounded-lg border border-cockpit-border/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
              <Wind className="w-3.5 h-3.5 text-cockpit-cyan" />
              <span>VIENTO</span>
            </div>
            <div className="text-base font-bold font-mono text-white">
              {metar?.wdir !== undefined && metar?.wdir !== null ? `${String(metar.wdir).padStart(3, '0')}°` : 'VRB'} / {metar?.wspd || 0} KT
            </div>
            {metar?.wgst && (
              <div className="text-xs font-mono text-amber-400 font-semibold mt-0.5">
                Rachas: {metar.wgst} KT
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className="bg-cockpit-950/80 p-3 rounded-lg border border-cockpit-border/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
              <Eye className="w-3.5 h-3.5 text-cockpit-cyan" />
              <span>VISIBILIDAD</span>
            </div>
            <div className="text-base font-bold font-mono text-white">
              {metar?.visib || '10+'} {typeof metar?.visib === 'number' || (metar?.visib && !metar.visib.includes('KM')) ? 'SM' : ''}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              {metar?.fltCat} Conditions
            </div>
          </div>

          {/* Temperature / Dewpoint */}
          <div className="bg-cockpit-950/80 p-3 rounded-lg border border-cockpit-border/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
              <Thermometer className="w-3.5 h-3.5 text-cockpit-cyan" />
              <span>TEMP / ROCÍO</span>
            </div>
            <div className="text-base font-bold font-mono text-white">
              {metar?.temp !== undefined ? `${metar.temp}°C` : '--'} / {metar?.dewp !== undefined ? `${metar.dewp}°C` : '--'}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              Spread: {tempSpread !== null ? `${tempSpread}°C` : '--'}
            </div>
          </div>

          {/* Altimeter / QNH */}
          <div className="bg-cockpit-950/80 p-3 rounded-lg border border-cockpit-border/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
              <Gauge className="w-3.5 h-3.5 text-cockpit-cyan" />
              <span>ALTIMETER / QNH</span>
            </div>
            <div className="text-base font-bold font-mono text-white">
              {metar?.altim ? `${Math.round(metar.altim)} hPa` : '----'}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              {metar?.altim ? `${hpaToInhg(metar.altim)} inHg` : '--.-- inHg'}
            </div>
          </div>

          {/* Clouds / Ceiling */}
          <div className="bg-cockpit-950/80 p-3 rounded-lg border border-cockpit-border/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
              <Layers className="w-3.5 h-3.5 text-cockpit-cyan" />
              <span>NUBES / TECHO</span>
            </div>
            <div className="text-sm font-bold font-mono text-white truncate">
              {metar?.clouds && metar.clouds.length > 0 
                ? metar.clouds.map(c => `${c.cover}${c.base ? String(c.base).padStart(3, '0') : ''}`).join(' ')
                : (metar?.cover || 'DESPEJADO (CLR)')}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              {metar?.clouds?.length || 0} capa(s)
            </div>
          </div>

          {/* Density Altitude */}
          <div className="bg-cockpit-950/80 p-3 rounded-lg border border-cockpit-border/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-cockpit-cyan" />
              <span>ALT. DENSIDAD</span>
            </div>
            <div className="text-base font-bold font-mono text-white">
              {densityAlt !== null ? `${densityAlt} FT` : '----'}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              Elev: {airport?.elevation || 0} FT
            </div>
          </div>

        </div>
      </div>

      {/* Real-time TAF Forecast Evolution */}
      {taf && (
        <div className="bg-cockpit-900 border border-cockpit-border rounded-xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-mono font-bold text-sm tracking-wider uppercase text-white">
                PRONÓSTICO DE AERÓDROMO TAF (EVOLUCIÓN TEMPORAL)
              </span>
              {taf.validTimeFrom && taf.validTimeTo && (
                <span className="text-xs font-mono text-slate-400 ml-2">
                  (Válido: {formatZuluDateTime(taf.validTimeFrom * 1000)} al {formatZuluDateTime(taf.validTimeTo * 1000)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRawTaf(!showRawTaf)}
                className="px-2.5 py-1 rounded bg-cockpit-850 hover:bg-cockpit-800 border border-cockpit-border text-xs font-mono text-slate-300"
              >
                {showRawTaf ? 'OCULTAR RAW' : 'VER RAW TAF'}
              </button>
              <button
                onClick={handleCopyTaf}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cockpit-850 hover:bg-cockpit-800 border border-cockpit-border text-xs font-mono text-slate-300"
              >
                {copiedTaf ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTaf ? 'COPIADO' : 'COPIAR'}</span>
              </button>
            </div>
          </div>

          {/* Raw TAF Box if toggled */}
          {showRawTaf && (
            <div className="bg-cockpit-950 p-3 rounded-lg border border-cockpit-border font-mono text-xs text-amber-400/90 tracking-wide break-words mb-3 select-all">
              {taf.rawTAF}
            </div>
          )}

          {/* TAF Forecast Step Timeline Cards */}
          {taf.fcsts && taf.fcsts.length > 0 ? (
            <div className="space-y-2 mt-3">
              {taf.fcsts.map((fcst, idx) => {
                const changeType = fcst.fcstChange || (idx === 0 ? 'BASE' : 'PERIOD');
                const isTempo = changeType === 'TEMPO';
                const isProb = changeType.includes('PROB');

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono ${
                      isTempo
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : isProb
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                          : 'bg-cockpit-950/70 border-cockpit-border text-slate-300'
                    }`}
                  >
                    {/* Time & Change Indicator */}
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        isTempo 
                          ? 'bg-amber-400 text-black' 
                          : isProb 
                            ? 'bg-purple-400 text-black' 
                            : 'bg-cockpit-cyan text-black'
                      }`}>
                        {fcst.probability ? `PROB${fcst.probability}` : changeType}
                      </span>
                      <span className="text-slate-200 font-semibold">
                        {fcst.timeFrom ? formatZuluTime(fcst.timeFrom * 1000) : '--:--Z'} 
                        {' → '} 
                        {fcst.timeTo ? formatZuluTime(fcst.timeTo * 1000) : '--:--Z'}
                      </span>
                    </div>

                    {/* Wind & Gusts */}
                    <div className="flex items-center gap-4">
                      <span>
                        Viento: <strong className="text-white">
                          {fcst.wdir !== undefined ? `${String(fcst.wdir).padStart(3, '0')}°` : 'VRB'} / {fcst.wspd || 0} KT
                        </strong>
                        {fcst.wgst && <span className="text-amber-400 ml-1">G{fcst.wgst}KT</span>}
                      </span>

                      {/* Visibility */}
                      <span>
                        Vis: <strong className="text-white">{fcst.visib || '6+'} SM</strong>
                      </span>

                      {/* Clouds */}
                      <span>
                        Nubes: <strong className="text-white">
                          {fcst.clouds && fcst.clouds.length > 0 
                            ? fcst.clouds.map(c => `${c.cover}${c.base ? String(c.base).padStart(3, '0') : ''}`).join(' ') 
                            : 'SKC'}
                        </strong>
                      </span>
                    </div>

                    {/* Weather Phenomenon if any (e.g. RA, TS, FG) */}
                    {fcst.wxString && (
                      <span className="px-2 py-0.5 rounded bg-black/40 text-amber-300 font-bold">
                        {fcst.wxString}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs font-mono text-slate-400">
              No hay segmentos de pronóstico detallados disponibles en este TAF.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
