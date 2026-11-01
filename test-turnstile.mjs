import assert from 'node:assert/strict';
import { createTurnstileGate } from './lib/turnstile.js';
import { createMiddleware } from './middleware.js';

const origin = 'https://me.shadowdewuff.gay';
const env = { TURNSTILE_SECRET: 'test-only-secret', TURNSTILE_HOSTNAMES: 'me.shadowdewuff.gay', VERCEL_ENV: 'production' };
let now = 1800000000000;
let result = { success: true, action: 'view_links', hostname: 'me.shadowdewuff.gay' };
let calls = 0;
const gate = createTurnstileGate({ env, clock: () => now, fetchImpl: async (url, options) => {
  calls++;
  assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.equal(options.body.get('secret'), env.TURNSTILE_SECRET);
  return Response.json(result);
} });
const request = (path = '/', headers = {}) => new Request(origin + path, { headers });
const submit = (token = 'fresh-token', returnTo = '/', requestOrigin = origin) => gate(new Request(origin + '/__turnstile', {
  method: 'POST', headers: { origin: requestOrigin, 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ 'cf-turnstile-response': token, returnTo }),
}));

for (const path of ['/', '/index.html', '/index', '/contact', '/api/now-playing', '/images/avatar.png']) {
  const response = await gate(request(path));
  assert.equal(response.headers.get('x-middleware-next'), null);
  assert.match(await response.text(), /cf-turnstile/);
  assert.match(response.headers.get('cache-control'), /no-store/);
}
assert.equal((await createTurnstileGate({ env: {} })(request())).status, 503);
assert.equal((await gate(new Request('https://alternate.vercel.app/'))).status, 403);
assert.equal((await submit('')).status, 403);
assert.equal((await submit('x'.repeat(2049))).status, 403);
assert.equal((await submit('token', '/', 'https://attacker.invalid')).status, 403);
assert.equal(calls, 0);
for (const invalid of [
  { success: false },
  { success: 'true', action: 'view_links', hostname: 'me.shadowdewuff.gay' },
  { success: true, action: 'wrong', hostname: 'me.shadowdewuff.gay' },
  { success: true, action: 'view_links', hostname: 'localhost' },
]) {
  result = invalid;
  assert.equal((await submit()).status, 403);
}
result = { success: true, action: 'view_links', hostname: 'me.shadowdewuff.gay' };
const accepted = await submit('fresh', '/now-playing?from=check');
assert.equal(accepted.status, 303);
assert.equal(accepted.headers.get('location'), '/now-playing?from=check');
const cookieHeader = accepted.headers.get('set-cookie');
assert.match(cookieHeader, /Secure; HttpOnly; SameSite=Lax/);
const cookie = cookieHeader.split(';')[0];
assert.equal((await gate(request('/', { cookie }))).headers.get('x-middleware-next'), '1');
assert.equal((await gate(request('/', { cookie: cookie + 'tampered' }))).headers.get('x-middleware-next'), null);
for (const unsafe of ['//attacker.invalid', '/\\attacker.invalid', '/%2f%2fattacker.invalid', '/__turnstile']) {
  assert.equal((await submit('fresh', unsafe)).headers.get('location'), '/');
}
now += 3600001;
assert.equal((await gate(request('/', { cookie }))).headers.get('x-middleware-next'), null);
result = { success: false, 'error-codes': ['timeout-or-duplicate'] };
assert.equal((await submit()).status, 403);
const offline = createTurnstileGate({ env, fetchImpl: async () => { throw new Error('offline'); } });
assert.equal((await offline(new Request(origin + '/__turnstile', {
  method: 'POST', headers: { origin, 'content-type': 'application/x-www-form-urlencoded' },
  body: 'cf-turnstile-response=token',
}))).status, 503);
const mw = createMiddleware(async () => false, gate);
assert.equal((await mw(request('/', { 'x-vercel-ip-country': 'IR', cookie }))).status, 451);
assert.match(await (await mw(request('/', { 'x-vercel-ip-country': 'US' }))).text(), /cf-turnstile/);
console.log('Turnstile gate checks passed (mocked Siteverify; live validation still required).');
