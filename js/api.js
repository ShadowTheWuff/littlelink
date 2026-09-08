// Base URL for the utility API behind the "cluster:" footer label and the
// /.debug page.
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

  window.LittleLinkApi = {
    base: BASE,

    url: function (path) {
      return BASE + path;
    },

    // Resolves with the Response so callers can read headers too; rejects on a
    // non-2xx status, which fetch() alone would not do.
    request: function (path) {
      return fetch(BASE + path, {
        headers: { accept: 'application/json' },
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store'
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res;
      });
    },

    json: function (path) {
      return window.LittleLinkApi.request(path).then(function (res) {
        return res.json();
      });
    }
  };
})();
