// Drives admin/index.html: renders the page for whichever state
// auth/clerk.js reports, and fills the deployment table from the same
// /api/debug endpoint js/cluster.js and the /.debug page already call
// (js/api.js holds that base URL) once a session is allowed through.
//
// Nothing here talks to Clerk. auth/clerk.js owns the SDK, the sign-in
// widget, the organization and the permission check; this file only
// decides what the page looks like in each of the states it reports.
(function () {
  var api = window.LittleLinkApi;
  var auth = window.LittleLinkAuth;

  var diagnosticsLoaded = false;

  // Set when a ?__clerk_ticket= link was rejected. onSignedOut re-fires on
  // every Clerk resource change and clears the error box, so the message is
  // kept here and put back each time rather than flashing and vanishing.
  var ticketError = null;

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

  function clearError() {
    if (errorBox) { errorBox.hidden = true; }
  }

  function set(id, value) {
    var el = document.getElementById(id);
    if (el) { el.textContent = value; }
  }

  function or(value, fallback) {
    return (value === null || value === undefined || value === '') ? (fallback || 'n/a') : value;
  }

  // The deployment table is hidden whenever the page is showing something
  // other than the dashboard itself (activating, or refused).
  function setSection(visible) {
    var section = content.querySelector('section');
    if (section) { section.hidden = !visible; }
  }

  function nameUser(user) {
    userLabel.textContent = 'Signed in as ' + auth.describe(user) +
      (auth.testMode ? ' (TEST MODE via ?as=tanner - not a real Clerk session)' : '');
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

  if (!auth) {
    showError('auth/clerk.js did not load, so this page cannot sign anyone in.');
    return;
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', function () { auth.signOut(); });
  }

  auth.start({
    mountTo: signInBox,

    onError: showError,

    onTicketFailed: function (message) {
      ticketError = message;
      showError(message);
    },

    onSignedOut: function () {
      content.hidden = true;
      clearError();
      if (ticketError) { showError(ticketError); }
      setSection(true);
    },

    // Signed in, but the organization is still being selected. Name the
    // account so the page is not blank while that round trip happens, and
    // keep the table back until it is settled.
    onActivating: function (user) {
      clearError();
      setSection(false);
      content.hidden = false;
      nameUser(user);
    },

    onSignedIn: function (user) {
      clearError();
      setSection(true);
      content.hidden = false;
      nameUser(user);

      if (!diagnosticsLoaded) {
        diagnosticsLoaded = true;
        loadDiagnostics();
      }
    },

    // Signed in and refused: say so plainly and leave the sign-out button
    // reachable, so the wrong account is not a dead end.
    onDenied: function (user, message) {
      setSection(false);
      content.hidden = false;
      nameUser(user);

      showError(message ||
        'This account does not have the ' + auth.permission + ' permission, ' +
        'so the dashboard is hidden. Grant it to the role this account holds in ' +
        'the organization above (Clerk > Configure > Roles).'
      );
    }
  });
})();
