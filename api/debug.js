// Vercel Function behind the debug page (/.debug) and the "cluster:" label
// in every page footer.
//
// Written as the framework-agnostic Web fetch handler Vercel documents for
// projects with no framework preset (export default { fetch(request) {} },
// rather than a bare default-exported function) and opted into the Edge
// runtime via the config export below, so it can run at whichever Vercel
// PoP is closest to the visitor instead of one fixed region - a visitor in
// Germany gets answered from a nearby European PoP instead of crossing the
// Atlantic to a single region pinned in the US.
//
// It reports where and what handled the request, using the environment
// variables Vercel exposes and the headers its network attaches to the
// request. Nothing is stored or forwarded; the response is generated fresh
// per request and marked no-store.
//
// Requires "Automatically expose System Environment Variables" to be on in
// the Vercel project settings, otherwise most fields come back null.

export const config = { runtime: 'edge' };

var REGION_NAMES = {
  arn1: 'Stockholm, Sweden',
  bom1: 'Mumbai, India',
  cdg1: 'Paris, France',
  cle1: 'Cleveland, USA',
  cpt1: 'Cape Town, South Africa',
  dub1: 'Dublin, Ireland',
  fra1: 'Frankfurt, Germany',
  gru1: 'São Paulo, Brazil',
  hkg1: 'Hong Kong',
  hnd1: 'Tokyo, Japan',
  iad1: 'Washington, D.C., USA',
  icn1: 'Seoul, South Korea',
  kix1: 'Osaka, Japan',
  lhr1: 'London, United Kingdom',
  pdx1: 'Portland, USA',
  sfo1: 'San Francisco, USA',
  sin1: 'Singapore',
  syd1: 'Sydney, Australia',
  dev1: 'Local development'
};

// Captured once per instance, so it reflects when this instance last
// cold-started rather than when the request came in.
var INSTANCE_STARTED_AT = new Date().toISOString();

function decoded(value) {
  if (value === null || value === undefined) return null;
  try { return decodeURIComponent(value); } catch (e) { return value; }
}

export default {
  fetch: function (request) {
    var headers = request.headers;
    var env = (typeof process !== 'undefined' && process.env) || {};

    // VERCEL_REGION is Vercel's own documented answer to "which region is
    // this running in" - simple and authoritative, so it's used as-is
    // rather than derived from parsing x-vercel-id, whose exact format
    // isn't a stable, documented contract.
    var region = env.VERCEL_REGION || null;

    var body = {
      ok: true,
      host: env.VERCEL ? 'vercel' : 'unknown',
      environment: env.VERCEL_ENV || null,
      region: region,
      regionName: (region && REGION_NAMES[region]) || null,
      deployment: {
        id: env.VERCEL_DEPLOYMENT_ID || null,
        url: env.VERCEL_URL || null,
        branchUrl: env.VERCEL_BRANCH_URL || null,
        productionUrl: env.VERCEL_PROJECT_PRODUCTION_URL || null
      },
      git: {
        provider: env.VERCEL_GIT_PROVIDER || null,
        owner: env.VERCEL_GIT_REPO_OWNER || null,
        repo: env.VERCEL_GIT_REPO_SLUG || null,
        ref: env.VERCEL_GIT_COMMIT_REF || null,
        sha: env.VERCEL_GIT_COMMIT_SHA || null,
        message: env.VERCEL_GIT_COMMIT_MESSAGE || null,
        author: env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN || null
      },
      runtime: {
        node: typeof EdgeRuntime === 'string'
          ? 'Vercel Edge Runtime (V8 isolate - not Node.js, so no process.version)'
          : (typeof process !== 'undefined' && process.version) || 'unknown',
        instanceStartedAt: INSTANCE_STARTED_AT
      },
      request: {
        id: headers.get('x-vercel-id'),
        country: headers.get('x-vercel-ip-country'),
        countryRegion: headers.get('x-vercel-ip-country-region'),
        city: decoded(headers.get('x-vercel-ip-city'))
      },
      serverTime: new Date().toISOString()
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  }
};
