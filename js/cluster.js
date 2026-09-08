// Fills the "cluster:" label in the page footer with the environment and
// region serving this visitor, as reported by the /api/debug endpoint on the
// nitro-starter deployment (see js/api.js for where that lives and why).
//
// The label starts out as a placeholder in the HTML so the page never looks
// broken; this only replaces it once real data arrives. If the endpoint can't
// be reached the label says so. The result is kept in sessionStorage for a few
// minutes so navigating between pages doesn't hit the function every time.
//
// Both halves of the label now describe that deployment rather than this one:
// the region is the PoP nearest the visitor (which is the interesting half),
// and the environment is the API's, so a preview of this site still reports
// the API's production environment unless the API is previewed too.
(function () {
  var labels = document.querySelectorAll('[data-cluster]');
  if (!labels.length) return;

  var STORAGE_KEY = 'll-cluster';
  var TTL_MS = 5 * 60 * 1000;
  var ENV_SHORT = { production: 'prod', preview: 'preview', development: 'dev' };

  function apply(text, title) {
    Array.prototype.forEach.call(labels, function (el) {
      el.textContent = 'cluster: ' + text;
      if (title) { el.title = title; } else { el.removeAttribute('title'); }
    });
  }

  function remember(text, title) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ t: Date.now(), text: text, title: title }));
    } catch (e) { /* storage unavailable; nothing to do */ }
  }

  try {
    var cached = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (cached && Date.now() - cached.t < TTL_MS) {
      apply(cached.text, cached.title);
      return;
    }
  } catch (e) { /* no usable cache; fall through to fetch */ }

  if (!window.LittleLinkApi) {
    apply('unavailable', 'js/api.js did not load');
    return;
  }

  window.LittleLinkApi.json('/api/debug')
    .then(function (info) {
      var env = ENV_SHORT[info.environment] || info.environment || 'unknown';
      var region = info.region || 'unknown';
      var text = env + '-' + region;
      var title = info.regionName ? region + ' = ' + info.regionName : '';
      apply(text, title);
      remember(text, title);
    })
    .catch(function () {
      apply('unavailable', 'Could not reach ' + window.LittleLinkApi.url('/api/debug'));
    });
})();
