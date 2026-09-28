// Drives admin/index.html: waits for Clerk to load, shows its sign-in
// widget when signed out, and fills the deployment table from the same
// /api/debug endpoint js/cluster.js and the /.debug page already call
// (js/api.js holds that base URL) once Clerk confirms a session that
// carries the permission below.
//
// This is a client-side gate only - see the note on the page itself for
// why that's an honest description of what it protects.
(function () {
  var api = window.LittleLinkApi;

  // Clerk custom permission from the log_acces feature (Configure >
  // Features). Clerk scopes custom permissions to an organization, so the
  // signed-in user needs an active organization whose role carries this
  // permission - a personal-account session has no permissions at all and
  // will be refused here.
  var REQUIRED_PERMISSION = 'log_acces:log_enabled';

  // The organization that carries REQUIRED_PERMISSION. Clerk scopes custom
  // permissions to an organization and checks them against whichever one is
  // *active* on the session, and a fresh sign-in leaves that null - so the
  // permission check fails on a correct account until this is selected.
  // Slug: tannerknapp-1790634481795651123
  var ORGANIZATION_ID = 'org_3JyXrbmV91342ZuMZgDEheZF0zl';

  // Clerk.addListener fires on every client/session resource change - it
  // fires even while the page sits idle - so nothing below may assume it
  // runs once. These two latches keep the listener from redoing work.
  var signInMounted = false;
  var diagnosticsLoaded = false;
  var orgActivationTried = false;

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

  // The deployment table is hidden whenever the page is showing something
  // other than the dashboard itself (activating, or refused).
  function setSection(visible) {
    var section = content.querySelector('section');
    if (section) { section.hidden = !visible; }
  }

  function describe(user) {
    var email = user.primaryEmailAddress && user.primaryEmailAddress.emailAddress;
    return email || user.id;
  }

  // Clerk's session object answers the permission check locally from the
  // session token's claims, so this is synchronous and needs no network
  // call. No session (or no active organization) means no permission.
  function hasPermission() {
    var session = window.Clerk && window.Clerk.session;
    if (!session || typeof session.checkAuthorization !== 'function') return false;
    return session.checkAuthorization({ permission: REQUIRED_PERMISSION }) === true;
  }

  function showSignedIn(user) {
    // Let Clerk tear its own widget down. Clearing innerHTML instead would
    // strip the DOM out from under a component that still thinks it is
    // mounted.
    if (signInMounted && window.Clerk) {
      window.Clerk.unmountSignIn(signInBox);
      signInMounted = false;
    }
    signInBox.hidden = true;

    // Select the organization before judging the permission, once. setActive
    // changes a resource and so re-fires the listener, which lands back
    // here - the latch is what stops that becoming a loop, and it also
    // means a genuine failure (not a member, org deleted) is reported
    // instead of being retried forever.
    var active = window.Clerk.organization && window.Clerk.organization.id;
    if (active !== ORGANIZATION_ID && !orgActivationTried) {
      orgActivationTried = true;
      setSection(false);
      content.hidden = false;
      userLabel.textContent = 'Signed in as ' + describe(user);
      window.Clerk.setActive({ organization: ORGANIZATION_ID })
        .then(function () { showSignedIn(user); })
        .catch(function (err) {
          showDenied(user, 'Could not select the organization that grants ' +
            REQUIRED_PERMISSION + ' (' + err.message + '). Check that this ' +
            'account is a member of it.');
        });
      return;
    }

    if (!hasPermission()) {
      showDenied(user);
      return;
    }

    if (errorBox) { errorBox.hidden = true; }
    setSection(true);
    content.hidden = false;
    userLabel.textContent = 'Signed in as ' + describe(user);

    if (!diagnosticsLoaded) {
      diagnosticsLoaded = true;
      loadDiagnostics();
    }
  }

  // Signed in, but without the permission: say so plainly and leave the
  // sign-out button reachable so the wrong account isn't a dead end.
  function showDenied(user, message) {
    content.hidden = false;
    userLabel.textContent = 'Signed in as ' + describe(user);

    setSection(false);

    showError(message ||
      'This account does not have the ' + REQUIRED_PERMISSION + ' permission, ' +
      'so the dashboard is hidden. Grant it to the role this account holds in ' +
      'the organization above (Clerk > Configure > Roles).'
    );
  }

  function showSignedOut() {
    // A different account may sign in next, so let activation run again.
    orgActivationTried = false;
    content.hidden = true;
    if (errorBox) { errorBox.hidden = true; }
    setSection(true);
    signInBox.hidden = false;

    // Mount once and leave it alone. Every step of the sign-in flow -
    // creating the attempt, sending the email code, verifying it - changes
    // a Clerk resource and so re-fires the listener above. Remounting on
    // those events tears the widget down mid-flow and it asks for a fresh
    // code on the way back up, which is what trips Clerk's rate limit with
    // "Too many requests. Please try again in a bit."
    if (!signInMounted && window.Clerk) {
      window.Clerk.mountSignIn(signInBox);
      signInMounted = true;
    }
  }

  function boot() {
    var Clerk = window.Clerk;
    if (!Clerk) {
      showError('Clerk did not load. Check the publishable key and frontend API host in admin/index.html.');
      return;
    }

    // clerk-js v6 ships without UI components; @clerk/ui is the separate
    // script tag above, and it only announces itself by setting this
    // global. clerk-js does NOT pick that global up on its own - it reads
    // the constructor out of load()'s options - so loading both scripts
    // isn't enough, and without this hand-off mountSignIn() throws
    // "Clerk was not loaded with Ui components".
    var ClerkUI = window.__internal_ClerkUICtor;
    if (!ClerkUI) {
      showError('The Clerk UI components did not load. Check that the @clerk/ui script in admin/index.html is reachable and names the same Clerk host as clerk-js.');
      return;
    }

    Clerk.load({ ui: { ClerkUI: ClerkUI } })
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
