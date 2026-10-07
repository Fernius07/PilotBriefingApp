/**
 * Aviation utility functions & formatters
 */

export function getFlightCategoryBadge(category) {
  switch ((category || '').toUpperCase()) {
    case 'VFR':
      return {
        label: 'VFR',
        name: 'Visual Flight Rules',
        bgColor: 'bg-emerald-500/15',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        glowClass: 'glow-green',
        dotColor: 'bg-emerald-400'
      };
    case 'MVFR':
      return {
        label: 'MVFR',
        name: 'Marginal VFR',
        bgColor: 'bg-sky-500/15',
        textColor: 'text-sky-400',
        borderColor: 'border-sky-500/40',
        glowClass: 'glow-cyan',
        dotColor: 'bg-sky-400'
      };
    case 'IFR':
      return {
        label: 'IFR',
        name: 'Instrument Flight Rules',
        bgColor: 'bg-rose-500/15',
        textColor: 'text-rose-400',
        borderColor: 'border-rose-500/40',
        glowClass: 'glow-red',
        dotColor: 'bg-rose-400'
      };
    case 'LIFR':
      return {
        label: 'LIFR',
        name: 'Low IFR',
        bgColor: 'bg-purple-500/20',
        textColor: 'text-purple-400',
        borderColor: 'border-purple-500/50',
        glowClass: 'glow-purple',
        dotColor: 'bg-purple-400'
      };
    default:
      return {
        label: 'UNK',
        name: 'Unknown',
        bgColor: 'bg-slate-700/30',
        textColor: 'text-slate-400',
        borderColor: 'border-slate-600',
        glowClass: '',
        dotColor: 'bg-slate-500'
      };
  }
}

export function formatZuluTime(date = new Date()) {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '--:--Z';
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}Z`;
}

export function formatZuluDateTime(date = new Date()) {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '--/-- --:--Z';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = monthNames[d.getUTCMonth()];
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${hours}:${minutes}Z`;
}

export function hpaToInhg(hpa) {
  if (!hpa) return '--.--';
  return (hpa * 0.02953).toFixed(2);
}

export function inhgToHpa(inhg) {
  if (!inhg) return '----';
  return Math.round(inhg * 33.8639);
}

export function calculateDensityAltitude(altimHpa, tempC, elevFt) {
  if (altimHpa === undefined || tempC === undefined || elevFt === undefined) return null;
  // Standard pressure at sea level = 1013.25 hPa
  const pressureAltitude = elevFt + (1013.25 - altimHpa) * 30;
  // Standard temp at elevation = 15 - (elevFt * 1.98 / 1000)
  const isaTemp = 15 - (elevFt * 0.00198);
  const densityAltitude = pressureAltitude + 120 * (tempC - isaTemp);
  return Math.round(densityAltitude);
}

export function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

/**
 * Formats NOTAM date string strictly into:
 * DD/MM/YYYY HHMM UTC / HHMM LT
 * Handles 'MM/DD/YYYY HHmm', 'YYMMDDHHmm', ISO string, and 'PERM'.
 */
export function formatNotamDate(dateStr) {
  if (!dateStr) return '';
  const cleanStr = String(dateStr).trim();
  if (cleanStr === 'PERM' || cleanStr.includes('UFN') || cleanStr.toUpperCase() === 'PERMANENT') {
    return 'PERMANENT';
  }

  let dateObj = null;
  const noEst = cleanStr.replace(/EST$/i, '').trim();

  // Format 1: MM/DD/YYYY HHmm (FAA format, e.g. 10/13/2026 2100)
  const m1 = noEst.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2})(\d{2})$/);
  if (m1) {
    const month = parseInt(m1[1], 10) - 1;
    const day = parseInt(m1[2], 10);
    const year = parseInt(m1[3], 10);
    const hour = parseInt(m1[4], 10);
    const min = parseInt(m1[5], 10);
    dateObj = new Date(Date.UTC(year, month, day, hour, min));
  } else {
    // Format 2: YYMMDDHHmm (ICAO B/C format, e.g. 2610132100)
    const m2 = noEst.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (m2) {
      const year = 2000 + parseInt(m2[1], 10);
      const month = parseInt(m2[2], 10) - 1;
      const day = parseInt(m2[3], 10);
      const hour = parseInt(m2[4], 10);
      const min = parseInt(m2[5], 10);
      dateObj = new Date(Date.UTC(year, month, day, hour, min));
    } else {
      const parsed = new Date(noEst);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return cleanStr;
  }

  // DD/MM/YYYY HHMM UTC
  const dd = String(dateObj.getUTCDate()).padStart(2, '0');
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getUTCFullYear();
  const utcHH = String(dateObj.getUTCHours()).padStart(2, '0');
  const utcMM = String(dateObj.getUTCMinutes()).padStart(2, '0');

  // HHMM LT (Local Time of browser/user)
  const ltHH = String(dateObj.getHours()).padStart(2, '0');
  const ltMM = String(dateObj.getMinutes()).padStart(2, '0');

  return `${dd}/${mm}/${yyyy} ${utcHH}${utcMM}Z / ${ltHH}${ltMM} LT`;
}

