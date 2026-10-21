// Lighthouse CI configuration - see .github/workflows/lighthouse-ci.yml,
// which runs `lhci autorun` against this file.
//
// This site has no build step (it's static HTML/CSS/JS), so there is
// nothing to serve locally: LHCI audits the real Vercel deployment URL for
// the commit that triggered it (production, or a PR's preview), the same
// way deployment-health-check.yml does. LHCI_BASE_URL is set by the
// workflow; the fallback here just lets `npx lhci autorun` work locally
// without any env setup.
const BASE_URL = process.env.LHCI_BASE_URL || 'https://me.shadowdewuff.gay';

// Preview deployments sit behind Vercel's deployment protection. Without
// these headers every audited page would just be Vercel's login wall.
// --no-sandbox is the standard CI flag for Chrome under GitHub Actions'
// containerized runners, which don't give it the namespaces its sandbox
// needs.
const settings = { chromeFlags: ['--no-sandbox'] };
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  settings.extraHeaders = {
    'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    'x-vercel-set-bypass-cookie': 'true',
  };
}

module.exports = {
  ci: {
    collect: {
      url: [
        BASE_URL + '/',
        BASE_URL + '/privacy',
        BASE_URL + '/tos',
      ],
      numberOfRuns: 3,
      settings,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Recommended trips on things this fork won't fix (e.g. third-party
        // brand icons with imperfect contrast, or scores that swing with
        // network noise in CI) - warn instead of failing the run for those.
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'color-contrast': 'warn',
        'unminified-css': 'off',
        'unminified-javascript': 'off',
      },
    },
    upload: {
      // No LHCI server for this project, so reports go to Google's free,
      // temporary public storage (7-day link) - fine for a personal site.
      target: 'temporary-public-storage',
    },
  },
};
