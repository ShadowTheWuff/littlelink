// Drives admin/index.html: waits for Clerk to load, shows its sign-in
// widget when signed out, and fills the deployment table from the same
// /api/debug endpoint js/cluster.js and the /.debug page already call
// (js/api.js holds that base URL) once Clerk confirms a session.
//
// This is a client-side gate only - see the note on the page itself for
// why that's an honest description of what it protects.
(function () {
  var api = window.LittleLinkApi;
  var errorBox = document.getElementById('admin-error');
  var signInBox = document.getElementById('clerk-sign-in');
  var content = document.getElementById('admin-content');
  var userLabel = document.getElementById('admin-user');
  var signOutBtn = document.getElementById('admin-sign-out');

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function set(id, value) {
    var el = document.getElementById(id);
    if (el) { el.textContent = value; }
  }

  function or(value, fallback) {
    return (value === null || value === undefined || value === '') ? (fallback || 'n/a') : value;
  }

  function loadDiagnostics() {
    if (!api) {
      set('adm-status', 'unavailable - js/api.js did not load');
      return;
    }
    api.request('/api/debug')
      .then(function (res) { return res.json(); })
      .then(function (info) {
        var git = info.git || {};
        var dep = info.deployment || {};
        var rt = info.runtime || {};

        set('adm-status', 'ok');
        set('adm-host', or(info.host));
        set('adm-env', or(info.environment));
        set('adm-region', info.region
          ? info.region + (info.regionName ? ' (' + info.regionName + ')' : '')
          : 'n/a');
        set('adm-id', or(dep.id));
        set('adm-branch', or(git.ref));
        set('adm-commit', git.sha ? git.sha.slice(0, 7) : 'n/a');
        set('adm-message', or(git.message));
        set('adm-author', or(git.author));
        set('adm-node', rt.framework
          ? or(rt.node) + ' via ' + rt.framework + (rt.preset ? ' (' + rt.preset + ')' : '')
          : or(rt.node));
        set('adm-started', or(rt.instanceStartedAt));
        set('adm-time', or(info.serverTime));
      })
      .catch(function (err) {
        set('adm-status', 'unavailable - could not reach ' + api.url('/api/debug') + ' (' + err.message + ')');
      });
  }

  function showSignedIn(user) {
    signInBox.hidden = true;
    signInBox.innerHTML = '';
    content.hidden = false;

    var email = user.primaryEmailAddress && user.primaryEmailAddress.emailAddress;
    userLabel.textContent = 'Signed in as ' + (email || user.id);

    loadDiagnostics();
  }

  function showSignedOut() {
    content.hidden = true;
    signInBox.hidden = false;
    if (window.Clerk) { window.Clerk.mountSignIn(signInBox); }
  }

  function boot() {
    var Clerk = window.Clerk;
    if (!Clerk) {
      showError('Clerk did not load. Check the publishable key and frontend API host in admin/index.html.');
      return;
    }

    Clerk.load()
      .then(function () {
        Clerk.addListener(function (resource) {
          if (resource.user) { showSignedIn(resource.user); } else { showSignedOut(); }
        });
        if (Clerk.user) { showSignedIn(Clerk.user); } else { showSignedOut(); }
      })
      .catch(function (err) {
        showError('Clerk failed to initialize: ' + err.message);
      });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', function () {
      if (window.Clerk) { window.Clerk.signOut(); }
    });
  }

  // The Clerk script tag loads async, so `window.Clerk` isn't guaranteed to
  // exist yet when this file (deferred) runs. Waiting for the window load
  // event, the pattern Clerk's own no-framework quickstart uses, is more
  // reliable here than racing two independently-timed script tags.
  if (document.readyState === 'complete') {
    boot();
  } else {
    window.addEventListener('load', boot);
  }
})();
