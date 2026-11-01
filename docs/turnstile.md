# Turnstile page gate

The existing Vercel middleware applies location restrictions first, then checks a
signed, Secure, HttpOnly, host-only access cookie before serving any matched route.
Without the cookie it returns a Turnstile page containing no profile links.
POST /__turnstile validates the token with Cloudflare Siteverify, requires literal
success=true, action=view_links, and the exact allowed request hostname. A valid
result issues a one-hour cookie and redirects to a local path. Tokens are redeemed
once; a failed form submission returns a new widget for retry.

## Production settings

- Existing sitekey: `0x4AAAAAAFv05Hj9bvfizSPq` (public).
- `TURNSTILE_SECRET`: the matching widget secret, stored only in Vercel's secret manager.
- `TURNSTILE_HOSTNAMES`: `me.shadowdewuff.gay`.
- The widget's allowed domains must include `me.shadowdewuff.gay`.

Missing configuration fails closed with HTTP 503. Alternate deployment hosts are
denied unless explicitly configured and also allowed on the widget. Never allow
localhost in production. Rotating the Turnstile secret invalidates access cookies.

Do not push/deploy until the secret is configured. Cloudflare cache rules must
bypass caching for this hostname (including HTML and API responses); purge any
previous cached HTML when enabling the gate. The application emits no-store on
challenge and verified responses, but an override such as Cache Everything with
an edge TTL can bypass the origin gate. Existing public GitHub source and past
copies of links remain public; this is bot friction, not private authentication.

This protection requires Vercel middleware; a plain static/nginx file server does
not run it. /_vercel/ platform routes retain their existing matcher exclusion.

## Validation

Run `node test-geoblock.mjs` and `node test-turnstile.mjs` for offline checks.
Before claiming live readiness, test the deployed custom domain in a fresh browser:
verify no profile links appear in the initial response, complete the real widget,
confirm the protected page opens and the cookie is Secure/HttpOnly, and repeat the
same token submission to confirm Cloudflare rejects replay. Check direct HTML,
clean URLs, alternate deployment URLs, and cached responses for bypasses.

References: https://developers.cloudflare.com/turnstile/spin/prompt.md and
https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
