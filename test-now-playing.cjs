const { test } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('./api/now-playing.js');
const fs = require('node:fs');
const vm = require('node:vm');

test('Last.fm backend handles live, idle, empty, and failure responses without exposing credentials', async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.LASTFM_API_KEY;
  function response() {
    return {
      headers: {}, code: 200,
      setHeader(key, value) { this.headers[key] = value; },
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; return this; }
    };
  }
  try {
    delete process.env.LASTFM_API_KEY;
    let res = response();
    await handler({ method: 'GET' }, res);
    assert.equal(res.code, 503);
    assert.equal(res.body.error, 'not_configured');
    process.env.LASTFM_API_KEY = 'test-private-key';
    res = response();
    await handler({ method: 'POST' }, res);
    assert.equal(res.code, 405);
    const track = { name: '<song>', artist: { '#text': 'Artist' }, album: { '#text': 'Album' }, '@attr': { nowplaying: 'true' } };
    for (const [tracks, expected] of [[[track], true], [[{ ...track, '@attr': {} }], false], [[], false]]) {
      global.fetch = async url => {
        assert.equal(url.searchParams.get('method'), 'user.getrecenttracks');
        return { ok: true, json: async () => ({ recenttracks: { track: tracks } }) };
      };
      res = response();
      await handler({ method: 'GET' }, res);
      assert.equal(res.code, 200);
      assert.equal(res.body.playing, expected);
      assert.equal(res.body.track === null, tracks.length === 0);
      assert.ok(!JSON.stringify(res.body).includes('test-private-key'));
      assert.equal(res.headers['Cache-Control'], 'no-store');
    }
    for (const failure of [
      async () => ({ ok: false }),
      async () => ({ ok: true, json: async () => ({ error: 6 }) }),
      async () => { throw new Error('timeout'); }
    ]) {
      global.fetch = failure;
      res = response();
      await handler({ method: 'GET' }, res);
      assert.equal(res.code, 502);
    }
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.LASTFM_API_KEY;
    else process.env.LASTFM_API_KEY = originalKey;
  }
});

test('page refreshes, pauses when hidden, and clears stale playback on errors', async () => {
  const elements = {};
  const events = {};
  const timers = [];
  const document = {
    hidden: false,
    getElementById(id) {
      return elements[id] ||= {
        dataset: {}, hidden: false, textContent: '',
        addEventListener() {}, getAttribute(name) { return this[name]; }
      };
    },
    addEventListener(name, fn) { events[name] = fn; }
  };
  let fail = false;
  let calls = 0;
  vm.runInNewContext(fs.readFileSync('js/now-playing.js', 'utf8'), {
    document, URL, Date, AbortSignal,
    clearTimeout() {},
    setTimeout(fn, delay) { assert.equal(delay, 30000); timers.push(fn); },
    fetch: async () => {
      calls++;
      if (fail) throw new Error('offline');
      return { ok: true, json: async () => ({
        playing: true,
        track: { title: '<script>text only</script>', artist: 'Artist', album: 'Album', url: 'javascript:alert(1)', image: '' }
      }) };
    }
  });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  await flush();
  assert.equal(elements['playing-status'].textContent, 'Listening now');
  assert.equal(elements['track-title'].textContent, '<script>text only</script>');
  assert.equal(elements['track-link'].hidden, true);
  document.hidden = true;
  events.visibilitychange();
  await timers.pop()();
  assert.equal(calls, 1);
  document.hidden = false;
  fail = true;
  events.visibilitychange();
  await flush();
  assert.equal(elements.track.hidden, true);
  assert.equal(elements['playing-status'].dataset.playing, 'false');
  assert.match(elements['playing-status'].textContent, /unavailable/);
});
