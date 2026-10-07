import React from 'react';
import { Printer, Plane, Clock } from 'lucide-react';
import { formatZuluDateTime, formatNotamDate } from '../utils/aviationHelpers';

export default function PrintableBriefing({ briefing, simbriefPlan, onClose }) {
  if (!briefing) return null;

  const { weather, windAnalysis, notams, vatsim, icao } = briefing;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 p-4 sm:p-8 flex justify-center">
      <div className="bg-white text-black max-w-4xl w-full p-8 rounded-xl shadow-2xl space-y-6 font-mono text-xs">
        
        {/* Controls (no-print) */}
        <div className="flex items-center justify-between border-b pb-4 no-print">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-sky-700" />
            <h2 className="text-base font-bold uppercase text-slate-800">
              DOSSIER DE DESPACHO AERONÁUTICO (EFB PRINT READY)
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded font-bold flex items-center gap-2 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>IMPRIMIR / GUARDAR PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold"
            >
              CERRAR
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="border-b-2 border-black pb-3 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold tracking-wider">
              PILOTBRIEFINGAPP • OPERATIONAL FLIGHT BRIEFING
            </h1>
            <p className="text-slate-600">
              ESTACIÓN: <strong>{icao} ({weather?.airport?.name || 'AERÓDROMO'})</strong> • ELEV: {weather?.airport?.elevation} FT
            </p>
          </div>
          <div className="text-right">
            <p>GENERADO: <strong>{formatZuluDateTime(new Date())}</strong></p>
            <p className="text-slate-600">DATOS OFICIALES: NOAA AWC / FAA NOTAM</p>
          </div>
        </div>

        {/* SimBrief Flight details if imported */}
        {simbriefPlan && (
          <div className="border p-3 rounded bg-slate-50 space-y-1">
            <div className="font-bold border-b pb-1">DATOS DEL PLAN DE VUELO SIMBRIEF</div>
            <div className="grid grid-cols-4 gap-2">
              <div>VUELO: <strong>{simbriefPlan.flightNumber}</strong></div>
              <div>ACFT: <strong>{simbriefPlan.aircraft?.name || simbriefPlan.aircraft?.icaoCode}</strong></div>
              <div>CRZ: <strong>{simbriefPlan.cruiseAltitude}</strong></div>
              <div>BLOCK: <strong>{simbriefPlan.fuel?.block}</strong></div>
            </div>
            {simbriefPlan.route && (
              <div className="pt-1 text-[11px]"><strong className="text-slate-700">RUTA:</strong> {simbriefPlan.route}</div>
            )}
          </div>
        )}

        {/* Weather METAR & TAF */}
        <div className="space-y-3">
          <div className="font-bold text-sm border-b pb-1 flex justify-between">
            <span>METAR & CATEGORÍA DE VUELO</span>
            <span className="font-bold underline">CATEGORÍA: {weather?.fltCat}</span>
          </div>
          <div className="p-2.5 bg-slate-100 rounded border border-slate-300 whitespace-pre-wrap font-bold">
            {weather?.metar?.rawOb || 'NO METAR REPORTED'}
          </div>

          {weather?.taf && (
            <>
              <div className="font-bold text-sm border-b pb-1 pt-2">PRONÓSTICO TAF</div>
              <div className="p-2.5 bg-slate-100 rounded border border-slate-300 whitespace-pre-wrap">
                {weather.taf.rawTAF}
              </div>
            </>
          )}
        </div>

        {/* Runway & Wind Components */}
        {windAnalysis && (
          <div className="space-y-2">
            <div className="font-bold text-sm border-b pb-1 flex justify-between">
              <span>ANÁLISIS DE PISTAS & VIENTO EN SUPERFICIE</span>
              <span>PISTA PREFERIDA: <strong>RWY {windAnalysis.bestRunway || '--'}</strong></span>
            </div>
            <table className="w-full border-collapse border border-slate-400 text-left">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border border-slate-400 p-1.5">PISTA</th>
                  <th className="border border-slate-400 p-1.5">RUMBO</th>
                  <th className="border border-slate-400 p-1.5">VIENTO FRENTE / COLA</th>
                  <th className="border border-slate-400 p-1.5">VIENTO CRUZADO</th>
                  <th className="border border-slate-400 p-1.5">ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {windAnalysis.runwayEnds?.map((rwy) => (
                  <tr key={rwy.id} className={rwy.id === windAnalysis.bestRunway ? 'bg-emerald-50 font-bold' : ''}>
                    <td className="border border-slate-400 p-1.5">RWY {rwy.id}</td>
                    <td className="border border-slate-400 p-1.5">{rwy.heading}°</td>
                    <td className="border border-slate-400 p-1.5">
                      {rwy.windAnalysis.headwind > 0 ? `HW ${rwy.windAnalysis.headwind} KT` : `TW ${rwy.windAnalysis.tailwind} KT`}
                    </td>
                    <td className="border border-slate-400 p-1.5">
                      {rwy.windAnalysis.crosswind} KT ({rwy.windAnalysis.crosswindDir})
                    </td>
                    <td className="border border-slate-400 p-1.5">
                      {rwy.id === windAnalysis.bestRunway ? 'FAVORECIDA' : 'DISPONIBLE'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* NOTAMs Operational Summary */}
        {notams?.operationalImpact && (
          <div className="border-2 border-slate-700 p-3 rounded bg-slate-50 space-y-2">
            <div className="flex justify-between items-center font-bold text-sm border-b pb-1">
              <span>RESUMEN DE IMPACTO OPERACIONAL EN VUELO (NOTAMs)</span>
              <span className={`px-2 py-0.5 rounded text-white text-xs ${
                notams.operationalImpact.overallLevel === 'CRITICAL' ? 'bg-red-700' : 'bg-amber-600'
              }`}>
                {notams.operationalImpact.overallLevel === 'CRITICAL' ? 'ALTO IMPACTO' : 'IMPACTO MODERADO'}
              </span>
            </div>
            <p className="font-bold text-slate-800">{notams.operationalImpact.headline}</p>

            {notams.operationalImpact.crewChecklist && notams.operationalImpact.crewChecklist.length > 0 && (
              <div className="pt-1">
                <div className="font-bold underline mb-1">RECOMENDACIONES PARA LA TRIPULACIÓN:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {notams.operationalImpact.crewChecklist.map((item, idx) => (
                    <li key={idx} className={item.level === 'CRITICAL' ? 'font-bold text-red-800' : 'text-slate-800'}>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* NOTAMs summary */}
        {notams?.notams && notams.notams.length > 0 && (
          <div className="space-y-2">
            <div className="font-bold text-sm border-b pb-1 flex justify-between">
              <span>AVISOS NOTAM OFICIALES DETALLADOS</span>
              <span>TOTAL AVISOS: {notams.summary?.total}</span>
            </div>
            <div className="space-y-2">
              {notams.notams.slice(0, 10).map((n) => (
                <div key={n.id} className="border-b pb-1.5">
                  <div className="flex justify-between font-bold">
                    <span>{n.number || n.id} [{n.category}]</span>
                    <span>{n.threatLabel} • {n.startDateFormatted || formatNotamDate(n.startDate)} al {n.isPermanent ? 'PERMANENTE' : (n.endDateFormatted || formatNotamDate(n.endDate))}</span>
                  </div>
                  <p className="text-slate-700 mt-0.5">{n.plainText}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
