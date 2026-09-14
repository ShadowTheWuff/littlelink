// Exercise the geo-block without deploying anything.
//   node test-geoblock.mjs            -> run the matrix
//   node test-geoblock.mjs IR         -> one country
//   node test-geoblock.mjs UA 43      -> country + region
import mw from './middleware.js';

const call = async (country, region) => {
  const headers = {};
  if (country) headers['x-vercel-ip-country'] = country;
  if (region) headers['x-vercel-ip-country-region'] = region;
  const res = await mw(new Request('https://shadowdewuff.gay/', { headers }));
  // Returning nothing means "continue to the static file", i.e. not blocked.
  return res ? res.status : 200;
};

const [c, r] = process.argv.slice(2);
if (c) {
  console.log(`${c}${r ? '/' + r : ''} -> ${await call(c, r)}`);
} else {
  const cases = [
    ['IR', '', 451, 'Iran'], ['CU', '', 451, 'Cuba'],
    ['KP', '', 451, 'North Korea'], ['SY', '', 451, 'Syria'],
    ['UA', '43', 451, 'Crimea'], ['UA', '14', 451, 'Donetsk'],
    ['UA', '30', 200, 'Kyiv - not embargoed'],
    ['US', '', 200, 'United States'], ['DE', '', 200, 'Germany'],
    ['', '', 200, 'no geo headers at all'],
    ['ir', '', 451, 'lowercase header'],
    ['I R', '', 451, 'sanitizer strips junk'],
  ];
  let bad = 0;
  for (const [country, region, want, note] of cases) {
    const got = await call(country, region);
    const ok = got === want;
    if (!ok) bad++;
    const label = (country || '--') + (region ? '/' + region : '');
    console.log(`${ok ? 'pass' : 'FAIL'}  ${label.padEnd(7)} ${String(got).padEnd(4)} ${note}`);
  }
  console.log(bad ? `\n${bad} failing` : '\nall passing');
}
