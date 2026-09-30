import { writeFile } from 'node:fs/promises';
const out = [];
const url = 'https://api.tech.ec.europa.eu/agrifood/api/oilseeds/prices?memberStateCodes=ES&beginDate=01/01/2026';
const res = await fetch(url, { headers: { Accept: 'application/json' } });
const rows = await res.json();
const m = new Map();
for (const r of rows) {
  if (!/soya|rape/i.test(r.product)) continue;
  const k = [r.product, r.productType, r.market, r.marketStage].join(' | ');
  const e = m.get(k) || { n: 0, lp: '' , last: ''};
  e.n++; const key = (r.endDate || '').split('/').reverse().join('');
  if (key > e.last) { e.last = key; e.lp = r.price + ' @ ' + r.endDate; }
  m.set(k, e);
}
for (const [k, e] of m) out.push(e.n + ' | ' + k + ' | last ' + e.lp);
await writeFile('scripts/.probe-output.txt', out.join('\n') + '\n');
