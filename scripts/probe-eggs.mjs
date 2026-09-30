import { writeFile } from 'node:fs/promises';
const out = [];
const p = new URLSearchParams({ key: process.env.NASS_API_KEY, commodity_desc: 'EGGS', statisticcat_desc: 'PRICE RECEIVED', agg_level_desc: 'NATIONAL', freq_desc: 'MONTHLY', format: 'JSON' });
const res = await fetch('https://quickstats.nass.usda.gov/api/api_GET/?' + p);
out.push('HTTP ' + res.status);
const j = res.ok ? await res.json() : { data: [] };
const m = new Map();
for (const r of j.data || []) {
  const k = [r.short_desc, r.domain_desc, r.class_desc, r.prodn_practice_desc, r.util_practice_desc, r.unit_desc].join(' | ');
  const e = m.get(k) || { n: 0, last: '' };
  e.n++; const t = r.year + '-' + String(r.begin_code || '').padStart(2, '0');
  if (t > e.last.split(' ')[0]) e.last = t + ' ' + r.Value;
  m.set(k, e);
}
for (const [k, e] of m) out.push(e.n + ' | ' + k + ' | last ' + e.last);
await writeFile('scripts/.probe-output.txt', out.join('\n') + '\n');
