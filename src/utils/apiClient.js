/**
 * Secure API Client with anti-scraping cryptographic signature
 * Protects endpoints from unauthorized direct curl/scraper extraction
 */

const APP_SALT = 'PILOT_BRIEF_SECURE_TOKEN_SALT_2026';

/**
 * Generates dynamic HMAC-SHA256 signature using browser native Web Crypto API
 */
async function generateAuthToken(pathname) {
  try {
    const timestamp = Date.now();
    // Normalize path to match backend validation
    const cleanPath = (pathname || '').split('?')[0].replace(/\/+$/, '').toLowerCase();
    const message = `${timestamp}:${cleanPath}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(APP_SALT);
    const msgData = encoder.encode(message);

    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await window.crypto.subtle.sign('HMAC', key, msgData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const hexSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `${timestamp}:${hexSignature}`;
  } catch (err) {
    console.warn('Fallback signature generation:', err);
    return `${Date.now()}:fallback`;
  }
}

/**
 * Secure fetch wrapper that attaches dynamic authentication signature
 */
export async function secureFetch(url, options = {}) {
  const parsedPath = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0];
  const token = await generateAuthToken(parsedPath);

  const headers = {
    ...(options.headers || {}),
    'x-pilot-auth': token,
    'x-requested-with': 'XMLHttpRequest',
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
