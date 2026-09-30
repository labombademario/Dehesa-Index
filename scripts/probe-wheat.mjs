import { writeFile } from 'node:fs/promises';
const out = [];
for (const ms of ['FR','DE','IT','ES']) {
  const url = 'https://api.tech.ec.europa.eu/agrifood/api/cereal/prices?memberStateCodes=' + ms + '&beginDate=01/01/2026';
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  out.push('== ' + ms + ' HTTP ' + res.status);
  if (!res.ok) continue;
  const rows = await res.json();
  const m = new Map();
  for (const r of rows) {
    if (!/wheat/i.test(r.productName || '')) continue;
    const k = [r.productName, r.marketName, r.stageName, r.unit].join(' | ');
    const e = m.get(k) || { n: 0, last: '', lastPrice: '' };
    e.n++; const d = r.endDate || ''; 
    const key = d.split('/').reverse().join('');
    if (key > e.last) { e.last = key; e.lastPrice = r.price + ' @ ' + d; }
    m.set(k, e);
  }
  for (const [k, e] of m) out.push(e.n + ' | ' + k + ' | last ' + e.lastPrice);
  if (rows[0]) out.push('sample keys: ' + Object.keys(rows[0]).join(','));
}
await writeFile('scripts/.probe-output.txt', out.join('\n') + '\n');
