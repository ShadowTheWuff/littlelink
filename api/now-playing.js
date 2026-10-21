// Last.fm credentials stay on the server; only public track metadata is returned.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const key = process.env.LASTFM_API_KEY;
  const user = process.env.LASTFM_USERNAME || 'ShadowTheWuff';
  if (!key) return res.status(503).json({ error: 'not_configured' });

  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.search = new URLSearchParams({
    method: 'user.getrecenttracks', user, api_key: key, format: 'json', limit: '1'
  }).toString();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('upstream_http');
    const data = await response.json();
    if (data.error || !data.recenttracks) throw new Error('upstream_data');
    const tracks = data.recenttracks.track;
    const track = Array.isArray(tracks) ? tracks[0] : tracks;
    const profile = 'https://www.last.fm/user/' + encodeURIComponent(user);
    if (!track) return res.status(200).json({ playing: false, track: null, profile });
    return res.status(200).json({
      playing: track['@attr']?.nowplaying === 'true',
      profile,
      track: {
        title: track.name || '',
        artist: track.artist?.['#text'] || '',
        album: track.album?.['#text'] || '',
        image: (track.image || []).find(image => image.size === 'extralarge')?.['#text'] || '',
        url: track.url || profile
      }
    });
  } catch {
    // Do not log the request URL: it contains the API key.
    return res.status(502).json({ error: 'unavailable' });
  }
};
