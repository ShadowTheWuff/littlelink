// Cookie notice shown on first visit. This is a notice, not a consent gate:
// Google Analytics and the Google tag load regardless of whether it has been
// dismissed, so it tells a visitor what is already happening rather than
// asking permission first. See privacy.html's Cookies section for what each
// service actually sets.
//
// Dismissal is remembered in localStorage, per browser, so it does not come
// back on every page once acknowledged. If storage is unavailable (private
// browsing in some browsers) the notice simply shows on every visit instead
// of failing.
(function () {
  var STORAGE_KEY = 'll-cookie-notice-dismissed';
  var el = document.getElementById('cookie-notice');
  if (!el) return;

  function dismissed() {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function remember() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch (e) { /* storage unavailable; the notice will just show again */ }
  }

  if (dismissed()) return;

  el.hidden = false;

  var button = document.getElementById('cookie-notice-dismiss');
  if (button) {
    button.addEventListener('click', function () {
      remember();
      el.hidden = true;
    });
  }
})();
