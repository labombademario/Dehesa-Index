import { writeFile } from 'node:fs/promises';
const out = [];
async function q(label, params) {
  const p = new URLSearchParams({ key: process.env.NASS_API_KEY, format: 'JSON', agg_level_desc: 'NATIONAL', ...params });
  const res = await fetch('https://quickstats.nass.usda.gov/api/api_GET/?' + p);
  out.push('== ' + label + ' HTTP ' + res.status);
  if (!res.ok) { out.push((await res.text()).slice(0, 120)); return; }
  const j = await res.json();
  const m = new Map();
  for (const r of j.data || []) {
    const k = [r.short_desc, r.domain_desc, r.freq_desc, r.unit_desc].join(' | ');
    const e = m.get(k) || { n: 0, last: '' };
    e.n++; const t = r.year + '-' + String(r.begin_code || '').padStart(2, '0');
    if (t > e.last.split(' ')[0]) e.last = t + ' ' + r.Value;
    m.set(k, e);
  }
  for (const [k, e] of m) out.push(e.n + ' | ' + k + ' | last ' + e.last);
}
for (const c of ['HOGS', 'CATTLE', 'CALVES', 'LAMBS', 'SHEEP', 'GOATS', 'CHICKENS', 'BROILERS', 'TURKEYS', 'OLIVES', 'SUGARCANE', 'SUGAR BEETS', 'SOYBEANS'])
  await q(c, { commodity_desc: c, statisticcat_desc: 'PRICE RECEIVED' });
await q('FERTILIZER', { commodity_desc: 'FERTILIZER', statisticcat_desc: 'PRICE PAID' });
await q('FERTILIZER2', { commodity_desc: 'FERTILIZER' });
await writeFile('scripts/.probe-output.txt', out.join('\n') + '\n');
