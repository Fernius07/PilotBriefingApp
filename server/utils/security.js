const crypto = require('crypto');

// Secret salt used for signing client session tokens
const APP_SALT = 'PILOT_BRIEF_SECURE_TOKEN_SALT_2026';

/**
 * Generates an HMAC-SHA256 signature for a timestamp and path
 */
function generateSignature(timestamp, path) {
  // Normalize path (ensure lowercase, strip query string and trailing slash)
  const cleanPath = (path || '').split('?')[0].replace(/\/+$/, '').toLowerCase();
  return crypto.createHmac('sha256', APP_SALT)
    .update(`${timestamp}:${cleanPath}`)
    .digest('hex');
}

/**
 * Validates incoming client request signature
 * Prevents automated scrapers, third-party hotlinking, and unauthorized API reuse
 */
function verifySecurityToken(req) {
  // Always permit public health check and debug-notam diagnostic route
  if (req.path === '/health' || req.path === '/api/health') return true;
  if (req.path.includes('debug-notam') || (req.originalUrl && req.originalUrl.includes('debug-notam'))) return true;

  // Direct browser document navigation protection
  // If someone pastes the API URL into their browser address bar, deny or redirect
  const secFetchDest = req.headers['sec-fetch-dest'];
  const acceptHeader = req.headers['accept'] || '';
  if (secFetchDest === 'document' || (acceptHeader.includes('text/html') && !req.headers['x-pilot-auth'])) {
    return false;
  }

  const token = req.headers['x-pilot-auth'] || req.headers['x-app-token'];
  if (!token || typeof token !== 'string') return false;

  const parts = token.split(':');
  if (parts.length !== 2) return false;

  const [timeStr, clientSig] = parts;
  const timestamp = parseInt(timeStr, 10);
  if (isNaN(timestamp)) return false;

  // Enforce 90-second expiration window to prevent token reuse / replay attacks
  const now = Date.now();
  if (Math.abs(now - timestamp) > 90000) {
    return false;
  }

  // Validate signature against normalized req.path and req.originalUrl
  const sigFromPath = generateSignature(timestamp, req.path);
  const sigFromOriginal = generateSignature(timestamp, req.originalUrl);

  // Strip possible /api prefix comparison
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  const sigWithoutApi = generateSignature(timestamp, pathWithoutApi);

  return (
    clientSig === sigFromPath ||
    clientSig === sigFromOriginal ||
    clientSig === sigWithoutApi
  );
}

module.exports = {
  verifySecurityToken,
  generateSignature
};
