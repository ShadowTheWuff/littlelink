// Fills the "cluster:" label in the page footer with the environment and
// region this deployment is actually running in, as reported by /api/debug.
//
// The label starts out as a placeholder in the HTML so the page never looks
// broken; this only replaces it once real data arrives. Off Vercel (a local
// checkout, another static host) the request fails and the label says so.
// The result is kept in sessionStorage for a few minutes so navigating
// between pages doesn't hit the function every time.
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

  fetch('/api/debug', { headers: { accept: 'application/json' } })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (info) {
      var env = ENV_SHORT[info.environment] || info.environment || 'unknown';
      var region = info.region || 'unknown';
      var text = env + '-' + region;
      var title = info.regionName ? region + ' = ' + info.regionName : '';
      apply(text, title);
      remember(text, title);
    })
    .catch(function () {
      apply('unavailable', 'Could not reach /api/debug');
    });
})();
