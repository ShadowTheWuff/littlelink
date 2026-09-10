// Base URL for the utility API behind the "cluster:" footer label and the
// /.debug page, plus the failure handling both of them share.
//
// These endpoints used to be a Vercel Edge Function in this repo, at
// /api/debug. They now live in the nitro-starter project, which deploys them
// on Nitro's vercel-edge preset - so they still run at the Vercel Point of
// Presence closest to whoever asks, which is the whole reason the region they
// report is worth showing.
//
// The browser calls that deployment directly instead of going through a rewrite
// here: a proxy hop would make the endpoint report the proxy's location rather
// than yours. Responses carry no cookies and are sent with credentials omitted.
(function () {
  var BASE = 'https://nitro-starter-three.vercel.app';
  var WEBMASTER = 'webmaster@shadowdewuff.gay';
  var TIMEOUT_MS = 8000;

  function reportUrl(path, reason) {
    var body = [
      'The edge API did not answer, so this page could not show its deployment info.',
      '',
      'Endpoint: ' + BASE + (path || ''),
      'Reason: ' + (reason || 'unknown'),
      'Page: ' + window.location.href,
      'Time: ' + new Date().toISOString(),
      'Browser: ' + navigator.userAgent
    ].join('\n');

    return 'mailto:' + WEBMASTER +
      '?subject=' + encodeURIComponent('Edge API unavailable on ' + window.location.hostname) +
      '&body=' + encodeURIComponent(body);
  }

  window.LittleLinkApi = {
    base: BASE,
    webmaster: WEBMASTER,

    url: function (path) {
      return BASE + path;
    },

    // Resolves with the Response so callers can read headers too. Rejects on a
    // non-2xx status, which fetch() alone would not do, and on a request that
    // simply never comes back: without a deadline a stalled connection leaves
    // the promise pending forever, and the page keeps showing its loading
    // placeholder as though nothing were wrong.
    request: function (path) {
      var controller = ('AbortController' in window) ? new AbortController() : null;
      var timedOut = false;
      var timer = controller && setTimeout(function () {
        timedOut = true;
        controller.abort();
      }, TIMEOUT_MS);

      return fetch(BASE + path, {
        headers: { accept: 'application/json' },
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        signal: controller ? controller.signal : undefined
      }).then(function (res) {
        if (timer) { clearTimeout(timer); }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res;
      }, function (err) {
        if (timer) { clearTimeout(timer); }
        throw new Error(timedOut
          ? 'no answer after ' + Math.round(TIMEOUT_MS / 1000) + 's'
          : (err && err.message) || 'network error');
      });
    },

    json: function (path) {
      return window.LittleLinkApi.request(path).then(function (res) {
        return res.json();
      });
    },

    // A mailto: with the diagnostics already filled in, so a report arrives
    // with something to act on rather than "the site is broken".
    reportUrl: reportUrl,

    // The same thing as a link element, for callers to drop into their own
    // error text. Built as a node rather than an HTML string so nothing here
    // has to trust the error message it was handed.
    reportLink: function (path, reason, text) {
      var a = document.createElement('a');
      a.href = reportUrl(path, reason);
      a.textContent = text || WEBMASTER;
      return a;
    }
  };
})();
