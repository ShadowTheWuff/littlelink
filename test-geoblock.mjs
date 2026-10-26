// Test the geo-block without a Vercel deployment or live Flags credentials.
//   node test-geoblock.mjs                 -> all cases (UK flag on and off)
//   node test-geoblock.mjs GB              -> UK flag on
//   node test-geoblock.mjs GB --uk-off     -> UK flag off
//   node test-geoblock.mjs UA 43          -> country + region
import { createMiddleware } from './middleware.js';

const call = async (country, region = '', ukBlockEnabled = true) => {
  const headers = {};
  if (country) headers['x-vercel-ip-country'] = country;
  if (region) headers['x-vercel-ip-country-region'] = region;
  const mw = createMiddleware(async () => ukBlockEnabled);
  const res = await mw(new Request('https://shadowdewuff.gay/', { headers }));
  return { status: res?.status ?? 200, body: res ? await res.text() : '' };
};

const args = process.argv.slice(2);
const ukEnabled = !args.includes('--uk-off');
const [c, r] = args.filter((arg) => arg !== '--uk-off');

if (c) {
  const { status } = await call(c, r, ukEnabled);
  console.log(`${c}${r ? '/' + r : ''} -> ${status}`);
} else {
  const cases = [
    ['IR', '', true, 451, 'Iran'], ['CU', '', true, 451, 'Cuba'],
    ['KP', '', true, 451, 'North Korea'], ['SY', '', true, 451, 'Syria'],
    ['UA', '43', true, 451, 'Crimea'], ['UA', '14', true, 451, 'Donetsk'],
    ['UA', '30', true, 200, 'Kyiv - not embargoed'],
    ['GB', '', true, 403, 'United Kingdom, flag ON'],
    ['GB', '', false, 200, 'United Kingdom, flag OFF'],
    ['IR', '', false, 451, 'Iran stays blocked, flag OFF'],
    ['UA', '43', false, 451, 'Crimea stays blocked, flag OFF'],
    ['UK', '', true, 200, 'nonstandard UK code is not used by Vercel'],
    ['US', '', true, 200, 'United States'], ['DE', '', true, 200, 'Germany'],
    ['', '', true, 200, 'no geo headers'],
    ['ir', '', true, 451, 'lowercase header'],
    ['I R', '', true, 451, 'sanitizer strips junk'],
  ];

  let failures = 0;
  for (const [country, region, enabled, expected, note] of cases) {
    const { status, body } = await call(country, region, enabled);
    const messageOk = status === 403
      ? body.includes('Due to security concerns') && !body.includes('Unavailable for legal reasons')
      : status === 451
        ? body.includes('Unavailable for legal reasons')
        : true;
    const pass = status === expected && messageOk;
    if (!pass) failures++;
    const label = (country || '--') + (region ? '/' + region : '');
    console.log(`${pass ? 'pass' : 'FAIL'}  ${label.padEnd(7)} ${String(status).padEnd(4)} ${note}`);
  }

  console.log(failures ? `\n${failures} failing` : '\nall passing');
  if (failures) process.exitCode = 1;
}
