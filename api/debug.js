// Vercel Edge Function behind the debug page (/.debug) and the "cluster:"
// label in every page footer.
//
// This runs on the Edge Runtime (config.runtime = "edge" below), not as a
// Node.js serverless Function. Vercel deploys an Edge Function to every
// region on its edge network and answers each request from the Point of
// Presence closest to whoever made it - so a visitor in Germany is served
// by a nearby European PoP, not routed across the Atlantic to a single
// fixed region the way a plain Node Function would be.
//
// It reports where and what handled the request, using the environment
// variables Vercel exposes at the edge and the headers its network attaches
// to the request. Nothing is stored or forwarded; the response is generated
// fresh per request and marked no-store.
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

// Captured once per isolate, so it reflects when this particular edge
// instance last cold-started rather than when the request came in. Edge
// isolates are short-lived and scoped to one PoP, so this resets far more
// often than a Node Function's equivalent would.
var INSTANCE_STARTED_AT = new Date().toISOString();

function decoded(value) {
  if (value === null || value === undefined) return null;
  try { return decodeURIComponent(value); } catch (e) { return value; }
}

export default function handler(request) {
  var headers = request.headers;
  var env = (typeof process !== 'undefined' && process.env) || {};

  // x-vercel-id is a colon-separated chain of the Vercel infrastructure that
  // touched the request, e.g. "fra1::abc123" for an Edge Function answered
  // straight from Frankfurt, or "iad1::cle1::abc123" when an edge PoP had to
  // forward to a Node Function pinned elsewhere. Its first segment is the
  // edge PoP that actually answered - which is what "closest region"
  // really means here - so it's preferred over VERCEL_REGION, whose value
  // for Edge Functions doesn't reliably name a specific PoP the way it does
  // for Node Functions.
  var vercelId = headers.get('x-vercel-id') || '';
  var idParts = vercelId.split('::').filter(Boolean);
  var edgeRegion = idParts.length ? idParts[0] : null;
  var regionEnv = env.VERCEL_REGION || null;
  var region = edgeRegion || regionEnv;

  var body = {
    ok: true,
    host: env.VERCEL ? 'vercel' : 'unknown',
    environment: env.VERCEL_ENV || null,
    region: region,
    regionName: (region && REGION_NAMES[region]) || null,
    regionSource: edgeRegion ? 'edge PoP that answered (x-vercel-id)' : (regionEnv ? 'VERCEL_REGION' : null),
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
      node: 'Vercel Edge Runtime (V8 isolate - not Node.js, so no process.version)',
      instanceStartedAt: INSTANCE_STARTED_AT
    },
    request: {
      id: vercelId || null,
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
