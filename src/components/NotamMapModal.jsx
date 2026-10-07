import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, AlertTriangle, Layers, Radio, Crosshair, Copy, Check, Clock, ShieldAlert, FileText, Map as MapIcon } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatNotamDate } from '../utils/aviationHelpers';

export default function NotamMapModal({ notam, airportCoords, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentTileLayerRef = useRef(null);
  
  const [mapType, setMapType] = useState('NORMAL'); // 'NORMAL' | 'SATELLITE'
  const [mapError, setMapError] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  
  // Mobile active tab: 'MAP' | 'INFO'
  const [mobileTab, setMobileTab] = useState('MAP');

  // 1. Prevent background scrolling while modal is open + Escape key handler
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Determine effective coordinates (either NOTAM geo or airport ARP fallback)
  const hasSpecificGeo = Boolean(notam?.geo?.lat && notam?.geo?.lon);
  const effectiveLat = hasSpecificGeo ? notam.geo.lat : airportCoords?.lat;
  const effectiveLon = hasSpecificGeo ? notam.geo.lon : airportCoords?.lon;

  // 2. Leaflet Map Initialization and Layer updates
  useEffect(() => {
    if (!notam || !mapContainerRef.current || !effectiveLat || !effectiveLon) return;

    const geo = notam.geo || {};
    const {
      radiusMeters,
      radiusNm,
      lowerLimit,
      upperLimit,
      locationName,
      shape = hasSpecificGeo ? 'POINT' : 'ARP',
      polygonPoints = [],
      vertexCount
    } = geo;

    // Clean up existing map if already present
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      // Initialize Map
      const initialZoom = shape === 'POLYGON' ? 12 : (radiusMeters ? (radiusMeters > 15000 ? 10 : radiusMeters > 3000 ? 12 : 14) : 14);
      const map = L.map(mapContainerRef.current, {
        center: [effectiveLat, effectiveLon],
        zoom: initialZoom,
        zoomControl: true,
        attributionControl: false
      });
      mapInstanceRef.current = map;

      // Select Tile Layer URL (Normal OSM vs Satellite Esri)
      let tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      let subdomains = 'abc';
      let maxZoom = 19;

      if (mapType === 'SATELLITE') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        subdomains = 'abc';
        maxZoom = 18;
      }

      const tiles = L.tileLayer(tileUrl, {
        maxZoom,
        subdomains,
      }).addTo(map);
      currentTileLayerRef.current = tiles;

      tiles.on('tileerror', () => {
        if (mapType === 'SATELLITE') {
          console.warn('Satellite tile error, falling back to Normal');
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        }
      });

      // Severity Color
      const isCritical = notam.severity === 'CRITICAL' || notam.category === 'AIRSPACE';
      const shapeColor = isCritical ? '#ff3d71' : notam.severity === 'WARNING' ? '#ffab00' : '#00d2ff';

      // Popup Content template
      const popupContent = `
        <div style="font-family: monospace; font-size: 11px; color: #f8fafc; background: #0c131d; padding: 6px; border-radius: 6px; min-width: 190px;">
          <strong style="color: ${shapeColor}; font-size: 13px;">${notam.number || notam.id}</strong><br/>
          <span style="color: #94a3b8;">${notam.threatLabel || notam.title || 'Navigation Notice'}</span><br/>
          ${shape === 'POLYGON' ? `<span style="color: #c084fc;">📐 Bounded Area (${polygonPoints.length || vertexCount} vertices)</span><br/>` : ''}
          ${locationName ? `<span style="color: #38bdf8;">📍 ${locationName}</span><br/>` : ''}
          ${shape === 'CIRCLE' && radiusMeters ? `<span style="color: #cbd5e1;">Radius: ${radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(1)} km` : `${radiusMeters} m`} (${radiusNm} NM)</span><br/>` : ''}
          ${lowerLimit || upperLimit ? `<span style="color: #a78bfa;">Limits: ${lowerLimit || 'SFC'} - ${upperLimit || 'UNL'}</span>` : ''}
        </div>
      `;

      // Custom Cockpit Marker Icon (Glowing target)
      const targetHtml = `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: ${shapeColor}; opacity: 0.45; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background-color: ${shapeColor}; border: 2.5px solid #ffffff; box-shadow: 0 0 12px ${shapeColor};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: targetHtml,
        className: 'custom-cockpit-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      let activeBounds = null;

      // CASE A: POLYGON (Demarcated Area / Polygon)
      if (shape === 'POLYGON' && polygonPoints && polygonPoints.length >= 3) {
        const polygon = L.polygon(polygonPoints, {
          color: shapeColor,
          weight: 2.5,
          opacity: 0.95,
          fillColor: shapeColor,
          fillOpacity: 0.28,
        }).addTo(map);

        polygon.bindTooltip(`Bounded Area (${polygonPoints.length} vertices)`, {
          permanent: false,
          direction: 'center',
          className: 'bg-cockpit-950 text-white font-mono text-[11px] border border-cockpit-border p-1 rounded font-bold'
        });

        const centroidMarker = L.marker([effectiveLat, effectiveLon], { icon: customIcon }).addTo(map);
        centroidMarker.bindPopup(popupContent, { autoPan: true, autoPanPadding: [50, 50], closeButton: true }).openPopup();
        polygon.on('click', () => centroidMarker.openPopup());

        activeBounds = polygon.getBounds();
      }

      // CASE B: CIRCLE (Point & Radius)
      else if (shape === 'CIRCLE' && radiusMeters && radiusMeters > 0) {
        const restrictionCircle = L.circle([effectiveLat, effectiveLon], {
          radius: radiusMeters,
          color: shapeColor,
          weight: 3,
          opacity: 0.95,
          fillColor: shapeColor,
          fillOpacity: 0.22,
          dashArray: '6, 6',
        }).addTo(map);

        restrictionCircle.bindTooltip(`Radius: ${radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(1)} km` : `${radiusMeters} m`} (${radiusNm || ''} NM)`, {
          permanent: true,
          direction: 'top',
          className: 'bg-cockpit-950 text-white font-mono text-[11px] border border-cockpit-border p-1 rounded font-bold'
        });

        const marker = L.marker([effectiveLat, effectiveLon], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent, { autoPan: true, autoPanPadding: [50, 50], closeButton: true }).openPopup();

        activeBounds = restrictionCircle.getBounds();
      }

      // CASE C: POINT (Specific Point)
      else {
        const marker = L.marker([effectiveLat, effectiveLon], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent, { autoPan: true, autoPanPadding: [50, 50], closeButton: true }).openPopup();
        activeBounds = L.latLngBounds([[effectiveLat - 0.008, effectiveLon - 0.008], [effectiveLat + 0.008, effectiveLon + 0.008]]);
      }

      // Airport Reference Marker & Connecting Line (if distinct from point)
      if (hasSpecificGeo && airportCoords && airportCoords.lat && airportCoords.lon) {
        const aptHtml = `
          <div style="background: #00d2ff; color: #060a0f; border-radius: 4px; padding: 3px 6px; font-family: monospace; font-size: 10px; font-weight: bold; border: 1.5px solid #ffffff; box-shadow: 0 0 10px rgba(0,210,255,0.7); display: flex; align-items: center; gap: 3px;">
            ✈️ ARP
          </div>
        `;
        const aptIcon = L.divIcon({
          html: aptHtml,
          className: 'apt-marker',
          iconSize: [48, 22],
          iconAnchor: [24, 11]
        });

        L.marker([airportCoords.lat, airportCoords.lon], { icon: aptIcon })
          .addTo(map)
          .bindTooltip(`Airport (${airportCoords.lat.toFixed(3)}°, ${airportCoords.lon.toFixed(3)}°)`, { direction: 'bottom' });

        const distanceMeters = map.distance([airportCoords.lat, airportCoords.lon], [effectiveLat, effectiveLon]);
        if (distanceMeters > 300) {
          L.polyline([[airportCoords.lat, airportCoords.lon], [effectiveLat, effectiveLon]], {
            color: '#00d2ff',
            weight: 2,
            dashArray: '5, 6',
            opacity: 0.65
          }).addTo(map);

          if (activeBounds) {
            activeBounds = activeBounds.extend([airportCoords.lat, airportCoords.lon]);
          }
        }
      }

      // Fit map bounds with generous padding so nothing is cut off at borders
      if (activeBounds) {
        map.fitBounds(activeBounds, { padding: [65, 65], maxZoom: 14 });
      }

      // Ensure proper sizing after DOM render
      const triggerInvalidate = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };

      triggerInvalidate();
      const t1 = setTimeout(triggerInvalidate, 80);
      const t2 = setTimeout(triggerInvalidate, 250);
      const t3 = setTimeout(triggerInvalidate, 500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error mounting Leaflet map:', err);
      setMapError(true);
    }
  }, [notam, airportCoords, mapType, effectiveLat, effectiveLon, hasSpecificGeo, mobileTab]);

  if (!notam) return null;

  const geo = notam.geo || {};
  const {
    radiusMeters,
    radiusNm,
    lowerLimit,
    upperLimit,
    locationName,
    coordText,
    shape = hasSpecificGeo ? 'POINT' : 'ARP',
    polygonPoints = [],
    vertexCount
  } = geo;

  const formattedStart = notam.startDateFormatted || formatNotamDate(notam.startDate);
  const formattedEnd = notam.isPermanent ? 'PERMANENT' : (notam.endDateFormatted || formatNotamDate(notam.endDate));

  const handleCopyRaw = () => {
    if (notam.rawText && navigator.clipboard) {
      navigator.clipboard.writeText(notam.rawText);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-cockpit-900 border border-cockpit-border rounded-2xl max-w-6xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[92vh] my-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header - Fixed non-scrolling */}
        <div className="p-3.5 sm:p-4 bg-cockpit-950 border-b border-cockpit-border flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg border flex-shrink-0 ${
              shape === 'POLYGON'
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                : shape === 'CIRCLE'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-cockpit-cyan/15 border-cockpit-cyan/30 text-cockpit-cyan'
            }`}>
              {shape === 'POLYGON' ? (
                <Layers className="w-5 h-5" />
              ) : shape === 'CIRCLE' ? (
                <Radio className="w-5 h-5" />
              ) : (
                <Crosshair className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-base text-white">
                  {notam.number || notam.id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cockpit-850 text-cockpit-cyan border border-cockpit-border uppercase">
                  {notam.threatLabel || notam.title}
                </span>

                {/* Geometry Shape Badge */}
                {shape === 'POLYGON' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-purple-400" />
                    BOUNDED AREA ({polygonPoints.length || vertexCount} VERTICES)
                  </span>
                )}
                {shape === 'CIRCLE' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-amber-400" />
                    POINT & RADIUS ({radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(1)} km` : `${radiusMeters} m`})
                  </span>
                )}
                {shape === 'POINT' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-400" />
                    SPECIFIC POINT
                  </span>
                )}

                {notam.timing?.label && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    notam.timing.isUpcoming 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {notam.timing.label}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                {locationName ? `📍 ${locationName} • ` : ''}
                {shape === 'POLYGON' 
                  ? 'Demarcated airspace polygon' 
                  : shape === 'CIRCLE' 
                    ? 'Circular radius of operational impact' 
                    : shape === 'POINT'
                      ? 'Precise notice / obstacle location'
                      : 'Airport reference point & general notice'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Map Type Switcher: Normal & Satellite */}
            <div className="hidden sm:flex items-center bg-cockpit-850 p-1 rounded-lg border border-cockpit-border text-[11px] font-mono">
              <button
                onClick={() => setMapType('NORMAL')}
                className={`px-2.5 py-1 rounded transition-colors ${mapType === 'NORMAL' ? 'bg-cockpit-cyan text-black font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Normal
              </button>
              <button
                onClick={() => setMapType('SATELLITE')}
                className={`px-2.5 py-1 rounded transition-colors ${mapType === 'SATELLITE' ? 'bg-cockpit-cyan text-black font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Satellite
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cockpit-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info & Exact Dates Bar with Strict DD/MM/YYYY HHMMZ / HHMM LT format */}
        <div className="px-4 py-2.5 bg-cockpit-900/95 border-b border-cockpit-border flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono flex-shrink-0">
          <div className="flex flex-wrap items-center gap-3 text-slate-300">
            {shape === 'POLYGON' ? (
              <>
                <span>
                  AREA: <strong className="text-purple-300">{polygonPoints.length || vertexCount} VERTICES</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span>
                  CENTER: <strong className="text-cockpit-cyan">{effectiveLat?.toFixed(4)}°, {effectiveLon?.toFixed(4)}°</strong>
                </span>
              </>
            ) : shape === 'CIRCLE' ? (
              <>
                <span>
                  CENTER: <strong className="text-cockpit-cyan">{coordText || `${effectiveLat?.toFixed(4)}°, ${effectiveLon?.toFixed(4)}°`}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span>
                  RADIUS: <strong className="text-amber-400">{radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(1)} KM` : `${radiusMeters} M`} ({radiusNm} NM)</strong>
                </span>
              </>
            ) : (
              <span>
                COORD: <strong className="text-cockpit-cyan">{coordText || (effectiveLat ? `${effectiveLat.toFixed(4)}°, ${effectiveLon.toFixed(4)}°` : 'Airport')}</strong>
              </span>
            )}

            {(lowerLimit || upperLimit) && (
              <>
                <span className="text-slate-600">•</span>
                <span>
                  LIMITS: <strong className="text-purple-400">{lowerLimit || 'SFC'} TO {upperLimit || 'UNL'}</strong>
                </span>
              </>
            )}
          </div>

          {/* Dates in strict DD/MM/YYYY HHMMZ / HHMM LT */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span>
              FROM: <strong className="text-slate-200">{formattedStart}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span>
              TO: <strong className={notam.isPermanent ? 'text-amber-400 font-bold' : 'text-slate-200'}>{formattedEnd}</strong>
            </span>
          </div>
        </div>

        {/* Mobile Tab Switcher (< md) */}
        <div className="flex md:hidden border-b border-cockpit-border bg-cockpit-950 text-xs font-mono">
          <button
            onClick={() => setMobileTab('MAP')}
            className={`flex-1 py-2 text-center font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              mobileTab === 'MAP'
                ? 'border-cockpit-cyan text-cockpit-cyan bg-cockpit-900/60'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>INTERACTIVE MAP</span>
          </button>
          <button
            onClick={() => setMobileTab('INFO')}
            className={`flex-1 py-2 text-center font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              mobileTab === 'INFO'
                ? 'border-cockpit-cyan text-cockpit-cyan bg-cockpit-900/60'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>TEXT & DETAILS</span>
          </button>
        </div>

        {/* Main Content Area: Side-by-Side 2-Column on Desktop, Tabbed on Mobile */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-[#0c131d]">
          
          {/* Left Column: Interactive Map Canvas */}
          <div className={`md:col-span-7 flex flex-col relative h-[380px] md:h-[530px] border-b md:border-b-0 md:border-r border-cockpit-border bg-[#0c131d] overflow-hidden ${
            mobileTab === 'INFO' ? 'hidden md:flex' : 'flex'
          }`}>
            
            {/* Floating Mobile/Tablet Layer Switcher inside Map */}
            <div className="absolute top-3 right-3 z-[400] flex sm:hidden bg-cockpit-950/90 backdrop-blur p-1 rounded-lg border border-cockpit-border text-[10px] font-mono shadow-lg">
              <button
                onClick={() => setMapType('NORMAL')}
                className={`px-2 py-0.5 rounded transition-colors ${mapType === 'NORMAL' ? 'bg-cockpit-cyan text-black font-bold' : 'text-slate-400'}`}
              >
                Normal
              </button>
              <button
                onClick={() => setMapType('SATELLITE')}
                className={`px-2 py-0.5 rounded transition-colors ${mapType === 'SATELLITE' ? 'bg-cockpit-cyan text-black font-bold' : 'text-slate-400'}`}
              >
                Satellite
              </button>
            </div>

            <div 
              ref={mapContainerRef} 
              style={{ width: '100%', height: '100%', minHeight: '340px', backgroundColor: '#0c131d' }}
              className="w-full h-full flex-1" 
            />

            {mapError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-cockpit-950 text-center font-mono text-xs text-rose-300 space-y-2">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
                <span>Could not load interactive cartographic layer.</span>
                <span className="text-slate-400">Notice coordinates: {coordText || 'Airport location'}</span>
              </div>
            )}
          </div>

          {/* Right Column: Aviation Briefing Dossier & Complete Text */}
          <div className={`md:col-span-5 flex flex-col h-[400px] md:h-[530px] overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5 bg-cockpit-900/95 font-mono text-xs ${
            mobileTab === 'MAP' ? 'hidden md:flex' : 'flex'
          }`}>
            
            {/* Decoded Plain Language Section */}
            <div className="bg-cockpit-950 p-4 rounded-xl border border-cockpit-border space-y-2 shadow-sm">
              <div className="flex items-center justify-between pb-1.5 border-b border-cockpit-border/60">
                <div className="flex items-center gap-2 text-cockpit-cyan font-bold tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-cockpit-cyan" />
                  <span>PLAIN LANGUAGE DECODED</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase">
                  {notam.category || 'GENERAL'}
                </span>
              </div>
              <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans font-medium pt-0.5">
                {notam.plainText || notam.description}
              </div>
            </div>

            {/* Crew Operational Advice if present */}
            {notam.crewAdvice && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-200">
                <span className="text-amber-400 font-bold flex-shrink-0">💡 RECOMMENDATION:</span>
                <span className="leading-snug">{notam.crewAdvice}</span>
              </div>
            )}

            {/* Original RAW ICAO Message with Copy Button */}
            <div className="bg-cockpit-950 p-4 rounded-xl border border-cockpit-border space-y-2 shadow-sm">
              <div className="flex items-center justify-between pb-1.5 border-b border-cockpit-border/60">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  ORIGINAL RAW MESSAGE (ICAO / FAA)
                </span>
                <button
                  onClick={handleCopyRaw}
                  className="px-2.5 py-1 rounded bg-cockpit-850 hover:bg-cockpit-800 text-slate-300 hover:text-white border border-cockpit-border text-[10px] flex items-center gap-1.5 transition-colors font-mono"
                  title="Copy raw text"
                >
                  {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedRaw ? 'COPIED' : 'COPY RAW'}</span>
                </button>
              </div>

              <pre className="text-cockpit-cyan text-[11px] leading-relaxed whitespace-pre-wrap bg-cockpit-900/70 p-3 rounded-lg border border-cockpit-border/70 select-all overflow-x-auto">
                {notam.rawText || notam.description}
              </pre>
            </div>

            {/* Exact Validity Box */}
            <div className="p-3 bg-cockpit-950/80 rounded-xl border border-cockpit-border/70 text-[11px] text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-400 font-bold">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>OPERATIONAL VALIDITY WINDOW:</span>
              </div>
              <div className="flex flex-col gap-1 text-[11px]">
                <div className="bg-cockpit-900/90 p-2 rounded border border-cockpit-border flex items-center justify-between">
                  <span className="text-slate-400">FROM (EFFECTIVE):</span>
                  <strong className="text-white">{formattedStart}</strong>
                </div>
                <div className="bg-cockpit-900/90 p-2 rounded border border-cockpit-border flex items-center justify-between">
                  <span className="text-slate-400">TO (EXPIRATION):</span>
                  <strong className={notam.isPermanent ? 'text-amber-400 font-bold' : 'text-white'}>
                    {formattedEnd}
                  </strong>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
