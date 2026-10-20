(function () {
  var status = document.getElementById('playing-status');
  var track = document.getElementById('track');
  var cover = document.getElementById('cover');
  var updated = document.getElementById('updated');
  var timer;
  var busy = false;

  function safeUrl(value, image) {
    try {
      var url = new URL(value);
      var allowed = image
        ? url.hostname === 'lastfm.freetls.fastly.net'
        : url.hostname === 'www.last.fm' || url.hostname === 'last.fm';
      return url.protocol === 'https:' && allowed ? url.href : '';
    } catch { return ''; }
  }

  cover.addEventListener('error', function () { cover.hidden = true; });

  async function refresh() {
    clearTimeout(timer);
    if (busy || document.hidden) return;
    busy = true;
    try {
      var response = await fetch('/api/now-playing', {
        cache: 'no-store', signal: AbortSignal.timeout(10000)
      });
      var data = await response.json();
      if (!response.ok) {
        throw new Error(data.error === 'not_configured' ? 'not_configured' : 'unavailable');
      }
      status.dataset.playing = String(data.playing);
      status.textContent = data.playing ? 'Listening now' :
        data.track ? 'Not playing right now · Last listened to' : 'No recent listening yet';
      track.hidden = !data.track;
      if (data.track) {
        document.getElementById('track-title').textContent = data.track.title;
        document.getElementById('artist').textContent = data.track.artist;
        document.getElementById('album').textContent = data.track.album;
        var link = document.getElementById('track-link');
        var href = safeUrl(data.track.url, false);
        link.hidden = !href;
        if (href) link.href = href;
        var image = safeUrl(data.track.image, true);
        cover.hidden = !image;
        if (image && cover.getAttribute('src') !== image) cover.src = image;
      }
      var profile = safeUrl(data.profile, false);
      if (profile) document.getElementById('profile').href = profile;
      updated.textContent = 'Checked ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (error) {
      track.hidden = true;
      status.dataset.playing = 'false';
      status.textContent = error.message === 'not_configured'
        ? 'Last.fm is not connected yet.'
        : 'Last.fm is unavailable. Trying again shortly.';
      updated.textContent = '';
    } finally {
      busy = false;
      if (!document.hidden) timer = setTimeout(refresh, 30000);
    }
  }

  document.addEventListener('visibilitychange', function () {
    clearTimeout(timer);
    if (!document.hidden) refresh();
  });
  refresh();
})();
