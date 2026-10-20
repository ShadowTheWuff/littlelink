# Hidden Last.fm listening page

Open `/now-playing` (no leading dot). Vercel's existing `cleanUrls` setting
serves `now-playing.html` at this address. There is no navigation or sitemap
entry, and the page requests no search indexing. This is an unlisted public
page, not an authenticated private page.

## Connect Last.fm

1. Obtain an API key at https://www.last.fm/api/account/create.
2. Set `LASTFM_API_KEY` in the Vercel project's environment variables.
3. Optionally set `LASTFM_USERNAME`; the default is `ShadowTheWuff`.
4. Deploy when ready. No deployment is performed by adding these files.

For local development, put those variables in an ignored `.env.local` file
and run `vercel dev`. A static file server cannot run `/api/now-playing`.
Static Docker/Cloudflare deployments need an equivalent backend.

No Last.fm password, shared secret, or OAuth token is needed. The server calls
`user.getRecentTracks` and keeps the API key out of browser responses.
See https://www.last.fm/api/show/user.getRecentTracks.

Enable scrobbling in your music player or connect Spotify through Last.fm
settings. Live status depends on the player reporting now-playing to Last.fm.
The page checks every 30 seconds while visible, pauses when hidden, and checks
again on return. If Last.fm reports no current track, the most recent track is
clearly labelled as last listened to. Errors clear the previous live status.

Validation: `node --test test-now-playing.cjs`.
