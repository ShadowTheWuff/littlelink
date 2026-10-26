// Country and region restrictions for this Vercel deployment.
// Sanctions-related restrictions are always enforced. UK security blocking is
// controlled separately by the Vercel Flags boolean "geo-block-enabled".
// Cloudflare Workers and Docker deployments need their own equivalent rules.
// Check sanctions against current OFAC guidance before relying on this list:
// https://ofac.treasury.gov/sanctions-programs-and-country-information
import { flagsClient } from '@vercel/flags-core';

const SANCTIONED_COUNTRIES = new Set([
  'CU', // Cuba
  'IR', // Iran
  'KP', // North Korea
  'SY', // Syria
]);

// Crimea, Sevastopol, Donetsk, Luhansk, Kherson, Zaporizhzhia.
const BLOCKED_UA_REGIONS = new Set(['43', '40', '14', '09', '65', '23']);
const CONTACT = 'webmaster@shadowdewuff.gay';

export const config = {
  runtime: 'nodejs', // Required by the Vercel Flags core SDK.
  matcher: '/((?!_vercel/).*)',
};

// The evaluator is injected for local tests; production uses Vercel Flags.
export function createMiddleware(
  evaluateUkBlock = async () =>
    (await flagsClient.evaluate('geo-block-enabled', true)).value,
) {
  return async function middleware(request) {
    const country = header(request, 'x-vercel-ip-country');
    const region = header(request, 'x-vercel-ip-country-region');

    // The UK flag must never turn off sanctions restrictions.
    if (
      SANCTIONED_COUNTRIES.has(country) ||
      (country === 'UA' && BLOCKED_UA_REGIONS.has(region))
    ) {
      return blockedResponse(451, country);
    }

    // Vercel uses GB (not UK) for the United Kingdom.
    // No flag evaluation is needed for visitors outside the UK.
    if (country !== 'GB') return;

    // On evaluation failure, retain UK blocking rather than silently allowing it.
    let ukBlockEnabled = true;
    try {
      ukBlockEnabled = (await evaluateUkBlock()) !== false;
    } catch (error) {
      console.error('Unable to evaluate geo-block-enabled; defaulting to ON', error);
    }

    if (!ukBlockEnabled) return;
    return blockedResponse(403, country);
  };
}

export default createMiddleware();

// Never reflect arbitrary incoming header characters into HTML.
function header(request, name) {
  return (request.headers.get(name) || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function blockedResponse(status, country) {
  return new Response(refusalPage(status, country), {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Geo-specific responses must not be cached across visitors.
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}

function refusalPage(status, country) {
  const legal = status === 451;
  const title = legal ? 'Unavailable for legal reasons' : 'Access denied';
  const explanation = legal
    ? `<p>This site is not available from your location. The Owner and the site's
  hosting provider are subject to United States sanctions and export-control
  law, which does not permit serving comprehensively embargoed jurisdictions.</p>
  <p>This is a check on the country your connection appears to come from, and
  nothing else. Nothing has been decided about you as a person.</p>`
    : `<p>Due to security concerns, access to this website has been restricted
  from your geographic location.</p>
  <p>This restriction is based on your connection's apparent location, not
  your identity.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    padding: 2rem 1.25rem;
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #fff;
    color: #1a1a1a;
  }
  main { max-width: 34rem; margin: 0 auto; }
  h1 { font-size: 1.5rem; line-height: 1.3; margin: 0 0 1rem; }
  p { margin: 0 0 1rem; }
  .meta { color: #666; font-size: 0.875rem; }
  a { color: inherit; }
  @media (prefers-color-scheme: dark) {
    body { background: #111; color: #eee; }
    .meta { color: #999; }
  }
</style>
</head>
<body>
<main>
  <h1>${title}</h1>
  ${explanation}
  <p>IP-based location can be wrong &mdash; for example, when using a VPN.
  If you believe this is a mistake, contact
  <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
  <p class="meta">HTTP ${status}${country ? ` &middot; detected country: ${country}` : ''}</p>
</main>
</body>
</html>
`;
}
