// Keeps the footer copyright year current without a yearly edit.
(function () {
  var el = document.getElementById('copyright-year');
  if (!el) return;
  el.textContent = new Date().getFullYear();
})();
