import { createHmac, timingSafeEqual } from 'node:crypto';

const SITEKEY = '0x4AAAAAAFv05Hj9bvfizSPq';
const ACTION = 'view_links';
const COOKIE = '__Host-link_access';
const TTL = 3600;
const VERIFY_PATH = '/__turnstile';
const noCache = {
  'cache-control': 'private, no-store',
  'cdn-cache-control': 'no-store',
  'vercel-cdn-cache-control': 'no-store',
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);

function sign(payload, secret) {
  return createHmac('sha256', secret).update(`littlelink-access-v1:${payload}`).digest('base64url');
}

function validCookie(request, secret, hostname, now) {
  const raw = (request.headers.get('cookie') || '').split(';')
    .map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw || raw.length > 512) return false;
  const [expires, signature, extra] = raw.split('.');
  if (extra !== undefined || !/^\d+$/.test(expires || '') || !/^[\w-]{43}$/.test(signature || '')) return false;
  const expiry = Number(expires);
  if (expiry <= now || expiry > now + TTL) return false;
  const expected = sign(`${hostname}:${expires}`, secret);
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function returnPath(value) {
  // Only local paths; never redirect to another host, including encoded slashes.
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/';
  try {
    const url = new URL(value, 'https://local.invalid');
    if (url.origin !== 'https://local.invalid' || url.pathname === VERIFY_PATH || /%2f|%5c/i.test(url.pathname)) return '/';
    return url.pathname + url.search;
  } catch { return '/'; }
}

function challenge(path, message = '', status = 200) {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Quick check | ShadowTheWuff</title>
<style>:root{color-scheme:dark light}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111;color:#eee;font:16px/1.6 system-ui,sans-serif}main{width:min(90%,26rem);padding:2rem 0}h1{font-size:1.7rem}button{padding:.8rem 1.4rem;margin-top:1rem;border:0;border-radius:.5rem;background:#49baff;color:#111;font:inherit;font-weight:600;cursor:pointer}button:disabled{opacity:.5;cursor:wait}#status{min-height:1.6em}</style>
<script>function ready(){document.getElementById('continue').disabled=false;document.getElementById('status').textContent='Verified. You can continue.'}function retry(){document.getElementById('continue').disabled=true;document.getElementById('status').textContent='Please complete the check again.'}function failed(){retry();document.getElementById('status').textContent='The check could not load. Refresh this page to try again.'}</script>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onerror="failed()"></script>
</head><body><main><h1>A quick check before you visit</h1><p>Please verify to view my links. This helps reduce automated scraping.</p>
<form action="${VERIFY_PATH}" method="post"><input type="hidden" name="returnTo" value="${escape(returnPath(path))}">
<div class="cf-turnstile" data-sitekey="${SITEKEY}" data-action="${ACTION}" data-theme="auto" data-callback="ready" data-expired-callback="retry" data-error-callback="failed"></div>
<p id="status" role="status" aria-live="polite">${escape(message)}</p><button id="continue" disabled type="submit">Continue</button></form>
<noscript><p>Enable JavaScript to complete this check.</p></noscript></main></body></html>`, {
    status, headers: { ...noCache, 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'same-origin', 'x-frame-options': 'DENY' },
  });
}

// Dependency injection keeps tests offline; production reads server-only env.
export function createTurnstileGate({ env = process.env, fetchImpl = fetch, clock = () => Date.now() } = {}) {
  return async request => {
    const url = new URL(request.url);
    const secret = env.TURNSTILE_SECRET;
    const hostnames = new Set((env.TURNSTILE_HOSTNAMES || '').split(',').map(s => s.trim()).filter(Boolean));
    if (!secret || !hostnames.size) {
      return new Response('Verification is temporarily unavailable. Please try again later.', { status: 503, headers: noCache });
    }
    // Reject alternate deployment hosts unless explicitly configured for this widget.
    if (!hostnames.has(url.hostname) || (env.VERCEL_ENV === 'production' && ['localhost', '127.0.0.1'].some(h => hostnames.has(h)))) {
      return new Response('This address is not enabled for verification.', { status: 403, headers: noCache });
    }
    const now = Math.floor(clock() / 1000);
    if (url.pathname === VERIFY_PATH && request.method === 'POST') {
      if (request.headers.get('origin') !== url.origin || !request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) {
        return new Response('Forbidden', { status: 403, headers: noCache });
      }
      let fields;
      try {
        // Read with a hard bound, including chunked requests without Content-Length.
        const reader = request.body?.getReader();
        if (!reader) throw new Error('missing_body');
        let length = 0;
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > 8192) { await reader.cancel(); throw new Error('large_body'); }
          chunks.push(Buffer.from(value));
        }
        fields = new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
      } catch { return new Response('Invalid request', { status: 400, headers: noCache }); }
      const token = fields.get('cf-turnstile-response');
      const destination = returnPath(fields.get('returnTo'));
      if (!token || token.length > 2048) return challenge(destination, 'Please complete the check.', 403);
      try {
        const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret, response: token }), signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error('verification_unavailable');
        const result = await response.json();
        if (result.success !== true || result.action !== ACTION || result.hostname !== url.hostname || !hostnames.has(result.hostname)) {
          return challenge(destination, 'Verification expired or failed. Please try again.', 403);
        }
      } catch { return challenge(destination, 'Verification is unavailable. Please try again.', 503); }
      const expires = now + TTL;
      return new Response(null, { status: 303, headers: {
        ...noCache, location: destination,
        'set-cookie': `${COOKIE}=${expires}.${sign(`${url.hostname}:${expires}`, secret)}; Path=/; Max-Age=${TTL}; Secure; HttpOnly; SameSite=Lax`,
      } });
    }
    if (validCookie(request, secret, url.hostname, now)) {
      return new Response(null, { headers: { ...noCache, 'x-middleware-next': '1' } });
    }
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Verification required', { status: 403, headers: noCache });
    return challenge(url.pathname + url.search);
  };
}

export const turnstileGate = createTurnstileGate();
