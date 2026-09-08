// Vercel serverless function behind the debug page (/.debug) and the
// "cluster:" label in every page footer.
//
// It reports where and what this deployment is, using only the system
// environment variables Vercel sets at runtime and a few headers the edge
// attaches to the request. Nothing is stored or forwarded anywhere; the
// response is generated fresh per request and marked no-store.
//
// Requires "Automatically expose System Environment Variables" to be on in
// the Vercel project settings, otherwise most fields come back null.

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

// Captured once per function instance, so it reflects when this instance
// cold-started rather than when the request came in.
var INSTANCE_STARTED_AT = new Date().toISOString();

function header(req, name) {
  var value = req.headers[name];
  return typeof value === 'string' && value.length ? value : null;
}

function decoded(value) {
  if (value === null) return null;
  try { return decodeURIComponent(value); } catch (e) { return value; }
}

module.exports = function handler(req, res) {
  var env = process.env;
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
      node: process.version,
      instanceStartedAt: INSTANCE_STARTED_AT
    },
    request: {
      id: header(req, 'x-vercel-id'),
      country: header(req, 'x-vercel-ip-country'),
      countryRegion: header(req, 'x-vercel-ip-country-region'),
      city: decoded(header(req, 'x-vercel-ip-city'))
    },
    serverTime: new Date().toISOString()
  };

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};
