import React, { useState, useMemo } from 'react';
import { 
  FileText, AlertTriangle, ShieldAlert, Search, Filter, 
  ChevronDown, ChevronUp, ChevronRight, Copy, Check, Info, AlertCircle, Sparkles, MapPin,
  Ban, Radio, Lightbulb, Compass, PlaneTakeoff, ShieldCheck, CheckCircle2,
  ListChecks, ArrowRight, Zap, Clock, Map
} from 'lucide-react';
import { copyToClipboard, formatNotamDate } from '../utils/aviationHelpers';
import NotamMapModal from './NotamMapModal';

export default function NotamSection({ notamsData, icao, airportCoords }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('DECODED'); // 'DECODED' | 'RAW'
  const [expandedNotamId, setExpandedNotamId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(true);
  
  // Executive timing subfilter: 'ALL_FLIGHT' | 'ACTIVE_ONLY' | 'UPCOMING_ONLY'
  const [timingFilter, setTimingFilter] = useState('ALL_FLIGHT');
  
  // Map modal state
  const [selectedMapNotam, setSelectedMapNotam] = useState(null);

  if (!notamsData || !notamsData.notams) {
    return (
      <div className="bg-cockpit-900 border border-cockpit-border rounded-xl p-6 text-center text-slate-400 font-mono">
        No hay avisos NOTAM disponibles para {icao}.
      </div>
    );
  }

  const { summary, operationalImpact, notams } = notamsData;

  // Filter full notams list based on category and search text
  const filteredNotams = useMemo(() => {
    return notams.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      if (!matchCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.number.toLowerCase().includes(q) ||
        item.plainText.toLowerCase().includes(q) ||
        item.rawText.toLowerCase().includes(q) ||
        item.threatLabel.toLowerCase().includes(q)
      );
    });
  }, [notams, selectedCategory, searchQuery]);

  // Filter executive key impacts based on timing (Active vs Upcoming)
  const filteredExecutiveImpacts = useMemo(() => {
    if (!operationalImpact?.keyImpacts) return [];
    if (timingFilter === 'ACTIVE_ONLY') {
      return operationalImpact.keyImpacts.filter(i => !i.isUpcoming);
    }
    if (timingFilter === 'UPCOMING_ONLY') {
      return operationalImpact.keyImpacts.filter(i => i.isUpcoming);
    }
    return operationalImpact.keyImpacts;
  }, [operationalImpact, timingFilter]);

  const handleCopy = (id, text) => {
    copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSeverityBadge = (severity, isUpcoming = false) => {
    if (isUpcoming) {
      return {
        label: 'PRÓXIMAMENTE',
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400'
      };
    }
    switch (severity) {
      case 'CRITICAL':
        return {
          label: 'CRÍTICO',
          bg: 'bg-rose-500/20 text-rose-400 border-rose-500/50 glow-red',
          dot: 'bg-rose-400'
        };
      case 'WARNING':
        return {
          label: 'ADVERTENCIA',
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40 glow-amber',
          dot: 'bg-amber-400'
        };
      case 'CAUTION':
        return {
          label: 'PRECAUCIÓN',
          bg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
          dot: 'bg-yellow-400'
        };
      default:
        return {
          label: 'INFO',
          bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          dot: 'bg-sky-400'
        };
    }
  };

  const overallLevel = operationalImpact?.overallLevel || (summary?.critical > 0 ? 'CRITICAL' : 'MODERATE');
  const activeNowCount = operationalImpact?.summaryStats?.activeNowCount || 0;
  const upcomingCount = operationalImpact?.summaryStats?.upcomingCount || 0;

  return (
    <div className="space-y-5">
      
      {/* ========================================================================= */}
      {/* 🌟 ZONA DE RESUMEN DE IMPACTO OPERACIONAL (EXECUTIVE FLIGHT BRIEFING)     */}
      {/* ========================================================================= */}
      <div className={`rounded-2xl border p-5 shadow-2xl transition-all ${
        overallLevel === 'CRITICAL'
          ? 'bg-rose-950/25 border-rose-500/40'
          : overallLevel === 'HIGH'
            ? 'bg-amber-950/25 border-amber-500/40'
            : overallLevel === 'MODERATE'
              ? 'bg-yellow-950/20 border-yellow-500/30'
              : 'bg-cockpit-900 border-cockpit-border'
      }`}>
        
        {/* Executive Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cockpit-border/70">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
              overallLevel === 'CRITICAL'
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 glow-red'
                : overallLevel === 'HIGH'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400 glow-amber'
                  : 'bg-cockpit-cyan/20 border-cockpit-cyan text-cockpit-cyan glow-cyan'
            }`}>
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-base tracking-wider uppercase text-white">
                  RESUMEN DE IMPACTO OPERACIONAL EN VUELO
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
                  overallLevel === 'CRITICAL'
                    ? 'bg-rose-500 text-black border-rose-400'
                    : overallLevel === 'HIGH'
                      ? 'bg-amber-400 text-black border-amber-300'
                      : 'bg-emerald-400 text-black border-emerald-300'
                }`}>
                  {overallLevel === 'CRITICAL' ? 'ALTO IMPACTO' : overallLevel === 'HIGH' ? 'IMPACTO MODERADO' : 'BAJO IMPACTO'}
                </span>
                
                {/* Time-window tag: Only today & next 3-4h */}
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-400" />
                  VENTANA OPERACIONAL: AHORA + 4 HORAS
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                {operationalImpact?.headline || 'Evaluación automática de avisos que afectan a la operación del vuelo.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowExecutiveSummary(!showExecutiveSummary)}
            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 self-end sm:self-center"
          >
            <span>{showExecutiveSummary ? 'Plegar Resumen' : 'Desplegar Resumen'}</span>
            {showExecutiveSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible Content */}
        {showExecutiveSummary && (
          <div className="mt-4 space-y-4">
            
            {/* Quick Status KPIs Grid (4 Pillars) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              
              {/* 1. Runways Pillar */}
              <div className={`p-3 rounded-xl border ${
                operationalImpact?.summaryStats?.closedRunwaysActiveCount > 0
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                  : operationalImpact?.summaryStats?.closedRunwaysUpcomingCount > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-cockpit-950/80 border-cockpit-border text-slate-300'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-[11px] uppercase flex items-center gap-1">
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    PISTAS
                  </span>
                  <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    operationalImpact?.summaryStats?.closedRunwaysActiveCount > 0
                      ? 'bg-rose-500 text-black'
                      : operationalImpact?.summaryStats?.closedRunwaysUpcomingCount > 0
                        ? 'bg-amber-400 text-black'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {operationalImpact?.summaryStats?.closedRunwaysActiveCount > 0
                      ? `${operationalImpact.summaryStats.closedRunwaysActiveCount} CERRADAS AHORA`
                      : operationalImpact?.summaryStats?.closedRunwaysUpcomingCount > 0
                        ? `${operationalImpact.summaryStats.closedRunwaysUpcomingCount} PREVISTAS 3-4H`
                        : 'OPERATIVAS'}
                  </span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {operationalImpact?.summaryStats?.closedRunwaysActiveList?.length > 0
                    ? operationalImpact.summaryStats.closedRunwaysActiveList.join(', ')
                    : operationalImpact?.summaryStats?.closedRunwaysUpcomingList?.length > 0
                      ? `Próx: ${operationalImpact.summaryStats.closedRunwaysUpcomingList.join(', ')}`
                      : 'Sin cierres en ventana'}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {operationalImpact?.summaryStats?.closedRunwaysActiveCount > 0
                    ? 'Excluir de cálculos EFB ahora'
                    : 'Pistas abiertas para salida/llegada'}
                </p>
              </div>

              {/* 2. Navaids / Approach Pillar */}
              <div className={`p-3 rounded-xl border ${
                operationalImpact?.summaryStats?.navaidOutagesCount > 0
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                  : 'bg-cockpit-950/80 border-cockpit-border text-slate-300'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-[11px] uppercase flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    RADIOAYUDAS / ILS
                  </span>
                  <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    operationalImpact?.summaryStats?.navaidOutagesCount > 0
                      ? 'bg-amber-400 text-black'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {operationalImpact?.summaryStats?.navaidOutagesCount > 0 ? `${operationalImpact.summaryStats.navaidOutagesCount} AFECTADAS` : 'OPERATIVAS'}
                  </span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {operationalImpact?.summaryStats?.navaidOutagesCount > 0
                    ? `${operationalImpact.summaryStats.navaidOutagesCount} fallos/pruebas activos`
                    : 'Sistemas ILS/VOR operando'}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {operationalImpact?.summaryStats?.navaidOutagesCount > 0 ? 'Verificar aproximaciones RNP' : 'Aproximaciones de precisión OK'}
                </p>
              </div>

              {/* 3. Taxiways Pillar */}
              <div className={`p-3 rounded-xl border ${
                operationalImpact?.summaryStats?.closedTaxiwaysActiveCount > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-cockpit-950/80 border-cockpit-border text-slate-300'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-[11px] uppercase flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-cockpit-cyan" />
                    CALLES DE RODAJE
                  </span>
                  <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    operationalImpact?.summaryStats?.closedTaxiwaysActiveCount > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {operationalImpact?.summaryStats?.closedTaxiwaysActiveCount > 0 ? `${operationalImpact.summaryStats.closedTaxiwaysActiveCount} CERRADAS` : 'SIN CIERRES'}
                  </span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {operationalImpact?.summaryStats?.closedTaxiwaysActiveList?.length > 0
                    ? `TWY ${operationalImpact.summaryStats.closedTaxiwaysActiveList.slice(0, 4).join(', ')}`
                    : 'Rodaje normal a plataforma'}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {operationalImpact?.summaryStats?.closedTaxiwaysActiveCount > 0 ? 'Prever instrucciones de desvío' : 'Circulación en tierra despejada'}
                </p>
              </div>

              {/* 4. Airspace / Obstacles Pillar */}
              <div className={`p-3 rounded-xl border ${
                operationalImpact?.summaryStats?.airspaceRestrictionsCount > 0
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                  : 'bg-cockpit-950/80 border-cockpit-border text-slate-300'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-[11px] uppercase flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    ESPACIO AÉREO / TFR
                  </span>
                  <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    operationalImpact?.summaryStats?.airspaceRestrictionsCount > 0
                      ? 'bg-rose-500 text-black'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {operationalImpact?.summaryStats?.airspaceRestrictionsCount > 0 ? `${operationalImpact.summaryStats.airspaceRestrictionsCount} ACTIVAS` : 'LIBRE'}
                  </span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {operationalImpact?.summaryStats?.airspaceRestrictionsCount > 0
                    ? 'Zonas restringidas activas'
                    : 'Espacio aéreo sin TFR'}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {operationalImpact?.summaryStats?.airspaceRestrictionsCount > 0 ? 'Verificar mapa delimitado' : 'Procedimientos estándar'}
                </p>
              </div>

            </div>

            {/* Crew Action Items / Checklist for the Flight */}
            {operationalImpact?.crewChecklist && operationalImpact.crewChecklist.length > 0 && (
              <div className="bg-cockpit-950/90 rounded-xl p-4 border border-cockpit-border space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-cockpit-border/50 text-xs font-mono">
                  <div className="flex items-center gap-2 font-bold text-slate-200 uppercase tracking-wider">
                    <ListChecks className="w-4 h-4 text-cockpit-cyan" />
                    <span>ACCIONES Y RECOMENDACIONES CLAVE PARA LA TRIPULACIÓN</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Ventana: <strong>Vuelo actual & Próximas 3-4 horas</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  {operationalImpact.crewChecklist.map((item, idx) => (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                        item.timing === 'UPCOMING'
                          ? 'bg-cockpit-900/60 border-amber-500/30 text-amber-200/90'
                          : item.level === 'CRITICAL'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                            : item.level === 'WARNING'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                              : 'bg-cockpit-900 border-cockpit-border text-slate-300'
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {item.timing === 'UPCOMING' ? (
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                        ) : item.level === 'CRITICAL' ? (
                          <Ban className="w-3.5 h-3.5 text-rose-400" />
                        ) : item.level === 'WARNING' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        ) : item.level === 'CAUTION' ? (
                          <Info className="w-3.5 h-3.5 text-yellow-400" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <span className="leading-snug">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Flight Impacts Highlights List with Timing Filters & Map Button */}
            {operationalImpact?.keyImpacts && operationalImpact.keyImpacts.length > 0 && (
              <div className="space-y-2.5">
                
                {/* Section header and Timing Subfilter buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span>AVISOS CON REPERCUSIÓN DIRECTA EN ESTE VUELO ({filteredExecutiveImpacts.length}):</span>
                  </div>

                  {/* Timing Filter buttons */}
                  <div className="flex items-center gap-1.5 bg-cockpit-950 p-1 rounded-lg border border-cockpit-border text-[11px] font-mono">
                    <button
                      onClick={() => setTimingFilter('ALL_FLIGHT')}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        timingFilter === 'ALL_FLIGHT'
                          ? 'bg-cockpit-cyan text-cockpit-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      TODOS ({operationalImpact.keyImpacts.length})
                    </button>
                    <button
                      onClick={() => setTimingFilter('ACTIVE_ONLY')}
                      className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                        timingFilter === 'ACTIVE_ONLY'
                          ? 'bg-rose-500 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      ACTIVOS AHORA ({activeNowCount})
                    </button>
                    {upcomingCount > 0 && (
                      <button
                        onClick={() => setTimingFilter('UPCOMING_ONLY')}
                        className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                          timingFilter === 'UPCOMING_ONLY'
                            ? 'bg-amber-400 text-black font-bold'
                            : 'text-amber-400/80 hover:text-amber-300'
                        }`}
                      >
                        <Clock className="w-3 h-3 text-amber-400" />
                        PRÓXIMAMENTE 3-4H ({upcomingCount})
                      </button>
                    )}
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-xs">
                  {filteredExecutiveImpacts.map((impact) => {
                    return (
                      <div
                        key={impact.id}
                        onClick={() => setSelectedMapNotam({
                          ...impact,
                          number: impact.notamNumber || impact.id,
                          threatLabel: impact.title,
                          plainText: impact.plainText || impact.description,
                          rawText: impact.rawText || impact.description,
                          startDate: impact.startDate,
                          endDate: impact.endDate,
                          startDateFormatted: impact.startDateFormatted,
                          endDateFormatted: impact.endDateFormatted,
                          timing: { label: impact.timingLabel, isUpcoming: impact.isUpcoming },
                          geo: impact.geo || null
                        })}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer group hover:border-cockpit-cyan/50 hover:bg-cockpit-850/80 ${
                          impact.isUpcoming
                            ? 'bg-cockpit-950/60 border-amber-500/30 text-amber-200/90 opacity-90'
                            : impact.severity === 'CRITICAL'
                              ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                              : impact.severity === 'WARNING'
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                                : 'bg-cockpit-950 border-cockpit-border text-slate-300'
                        }`}
                      >
                        <div>
                          {/* Row 1: Title, Timing badge, Open affordance */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-bold text-white text-xs truncate group-hover:text-cockpit-cyan transition-colors" title={impact.title}>
                              {impact.title}
                            </span>
                            
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {/* Timing Badge */}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 ${
                                impact.isUpcoming
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}>
                                {impact.isUpcoming ? <Clock className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                                {impact.timingLabel}
                              </span>

                              <span className="text-[10px] text-slate-500 group-hover:text-cockpit-cyan flex items-center gap-0.5 transition-colors pl-1">
                                <span>Abrir</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-300 line-clamp-2">
                            {impact.description}
                          </p>
                        </div>

                        {/* Footer: Advice & Notam number & Validity */}
                        <div className="mt-2.5 pt-2 border-t border-cockpit-border/50 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                          <span className="text-cockpit-cyan font-semibold truncate pr-2 max-w-[70%]">
                            💡 {impact.crewAdvice}
                          </span>
                          <span className="text-slate-400 flex-shrink-0 font-mono">
                            {impact.notamNumber}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 📋 LISTA COMPLETA DE NOTAMs Y FILTRADO POR CATEGORÍA                      */}
      {/* ========================================================================= */}
      <div className="bg-cockpit-900 border border-cockpit-border rounded-xl p-5 shadow-lg space-y-4">
        
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cockpit-cyan" />
              <h2 className="font-mono font-bold text-base tracking-wider uppercase text-white">
                LISTADO DETALLADO DE AVISOS NOTAM ({summary?.total || 0})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Visualice, filtre y consulte todos los avisos oficiales emitidos
            </p>
          </div>

          {/* View mode toggle: Decoded vs Raw */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-cockpit-950 p-1 rounded-lg border border-cockpit-border text-xs font-mono">
              <button
                onClick={() => setViewMode('DECODED')}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  viewMode === 'DECODED'
                    ? 'bg-cockpit-cyan text-cockpit-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>LENGUAJE CLARO</span>
              </button>
              <button
                onClick={() => setViewMode('RAW')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'RAW'
                    ? 'bg-cockpit-cyan text-cockpit-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                RAW ICAO
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded-lg border transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-cockpit-cyan/20 border-cockpit-cyan text-white font-bold'
                  : 'bg-cockpit-950 border-cockpit-border text-slate-400 hover:text-white'
              }`}
            >
              TODOS ({summary?.total || 0})
            </button>

            {summary?.runwayAlerts > 0 && (
              <button
                onClick={() => setSelectedCategory('RUNWAY')}
                className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                  selectedCategory === 'RUNWAY'
                    ? 'bg-rose-500/25 border-rose-500 text-rose-300 font-bold'
                    : 'bg-cockpit-950 border-cockpit-border text-rose-400 hover:text-rose-300'
                }`}
              >
                PISTAS ({summary.runwayAlerts})
              </button>
            )}

            {summary?.taxiwayAlerts > 0 && (
              <button
                onClick={() => setSelectedCategory('TAXIWAY')}
                className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                  selectedCategory === 'TAXIWAY'
                    ? 'bg-amber-500/25 border-amber-500 text-amber-300 font-bold'
                    : 'bg-cockpit-950 border-cockpit-border text-amber-400 hover:text-amber-300'
                }`}
              >
                RODAJE ({summary.taxiwayAlerts})
              </button>
            )}

            {summary?.lightingAlerts > 0 && (
              <button
                onClick={() => setSelectedCategory('LIGHTING')}
                className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                  selectedCategory === 'LIGHTING'
                    ? 'bg-yellow-500/25 border-yellow-500 text-yellow-300 font-bold'
                    : 'bg-cockpit-950 border-cockpit-border text-yellow-400 hover:text-yellow-300'
                }`}
              >
                LUCES ({summary.lightingAlerts})
              </button>
            )}

            {summary?.obstacleAlerts > 0 && (
              <button
                onClick={() => setSelectedCategory('OBSTACLE')}
                className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                  selectedCategory === 'OBSTACLE'
                    ? 'bg-purple-500/25 border-purple-500 text-purple-300 font-bold'
                    : 'bg-cockpit-950 border-cockpit-border text-purple-400 hover:text-purple-300'
                }`}
              >
                OBSTÁCULOS ({summary.obstacleAlerts})
              </button>
            )}

            {summary?.navaidAlerts > 0 && (
              <button
                onClick={() => setSelectedCategory('NAVAID')}
                className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                  selectedCategory === 'NAVAID'
                    ? 'bg-sky-500/25 border-sky-500 text-sky-300 font-bold'
                    : 'bg-cockpit-950 border-cockpit-border text-sky-400 hover:text-sky-300'
                }`}
              >
                RADIOAYUDAS ({summary.navaidAlerts})
              </button>
            )}

            {summary?.airspaceAlerts > 0 && (
              <button
                onClick={() => setSelectedCategory('AIRSPACE')}
                className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                  selectedCategory === 'AIRSPACE'
                    ? 'bg-red-600/30 border-red-500 text-red-200 font-bold'
                    : 'bg-cockpit-950 border-cockpit-border text-red-400 hover:text-red-300'
                }`}
              >
                ESPACIO AÉREO ({summary.airspaceAlerts})
              </button>
            )}
          </div>

          {/* Search within notams */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en NOTAMs..."
              className="w-full pl-8 pr-3 py-1.5 bg-cockpit-950 border border-cockpit-border rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cockpit-cyan"
            />
          </div>
        </div>

        {/* NOTAM Cards List */}
        <div className="space-y-3">
          {filteredNotams.length === 0 ? (
            <div className="p-8 text-center bg-cockpit-950 rounded-xl border border-cockpit-border text-slate-400 font-mono text-xs">
              No se encontraron NOTAMs con el filtro o término especificado.
            </div>
          ) : (
            filteredNotams.map((notam) => {
              const sevBadge = getSeverityBadge(notam.severity, notam.timing?.isUpcoming);
              const isExpanded = expandedNotamId === notam.id;
              const hasMap = notam.geo && notam.geo.hasGeo;

              return (
                <div
                  key={notam.id}
                  onClick={() => setSelectedMapNotam(notam)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group hover:border-cockpit-cyan/50 hover:bg-cockpit-850/60 ${
                    notam.timing?.isUpcoming
                      ? 'bg-cockpit-950/70 border-amber-500/30'
                      : notam.severity === 'CRITICAL'
                        ? 'bg-rose-500/5 border-rose-500/30'
                        : notam.severity === 'WARNING'
                          ? 'bg-amber-500/5 border-amber-500/30'
                          : 'bg-cockpit-950/70 border-cockpit-border'
                  }`}
                >
                  {/* Header row: ID, Category tag, Severity badge, Dates, Copy */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-cockpit-border/50">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-cockpit-cyan group-hover:text-white transition-colors">
                        {notam.number || notam.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1.5 ${sevBadge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sevBadge.dot}`}></span>
                        {notam.threatLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cockpit-850 text-slate-400 font-mono text-[10px] border border-cockpit-border">
                        {notam.category}
                      </span>

                      {/* Timing status badge */}
                      {notam.timing?.label && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                          notam.timing.isUpcoming 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {notam.timing.isUpcoming ? <Clock className="w-2.5 h-2.5" /> : null}
                          {notam.timing.label}
                        </span>
                      )}
                    </div>

                    {/* Strict DD/MM/YYYY HHMM UTC / HHMM LT Date Format */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-slate-400">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>
                          DESDE: <strong className="text-slate-200">{notam.startDateFormatted || formatNotamDate(notam.startDate)}</strong>
                        </span>
                        <span className="hidden sm:inline text-slate-600">•</span>
                        <span>
                          HASTA: <strong className={notam.isPermanent ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                            {notam.isPermanent ? 'PERMANENTE' : (notam.endDateFormatted || formatNotamDate(notam.endDate))}
                          </strong>
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(notam.id, notam.rawText);
                        }}
                        className="p-1 text-slate-400 hover:text-white self-end sm:self-center"
                        title="Copiar NOTAM completo"
                      >
                        {copiedId === notam.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* NOTAM Content (Plain Language Decoded OR Raw ICAO) */}
                  <div className="text-xs font-mono leading-relaxed">
                    {viewMode === 'DECODED' ? (
                      <div className="text-slate-200 font-medium">
                        {notam.plainText}
                      </div>
                    ) : (
                      <div className="text-cockpit-cyan whitespace-pre-wrap bg-cockpit-900/60 p-2.5 rounded border border-cockpit-border/70 select-all">
                        {notam.rawText}
                      </div>
                    )}
                  </div>

                  {/* Actions footer row */}
                  <div className="mt-2.5 pt-2 border-t border-cockpit-border/40 flex items-center justify-between text-[11px] font-mono">
                    {viewMode === 'DECODED' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedNotamId(isExpanded ? null : notam.id);
                        }}
                        className="text-slate-400 hover:text-cockpit-cyan flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Ocultar formato RAW ICAO' : 'Ver formato RAW ICAO'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    ) : <span />}

                    <div className="text-slate-500 group-hover:text-cockpit-cyan flex items-center gap-1 transition-colors font-medium">
                      <span>Abrir mapa e info</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {isExpanded && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 p-2.5 bg-cockpit-900 rounded border border-cockpit-border font-mono text-[11px] text-slate-300 whitespace-pre-wrap select-all cursor-text"
                    >
                      {notam.rawText}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Map Modal */}
      {selectedMapNotam && (
        <NotamMapModal
          notam={selectedMapNotam}
          airportCoords={airportCoords}
          onClose={() => setSelectedMapNotam(null)}
        />
      )}

    </div>
  );
}
