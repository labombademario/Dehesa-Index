import { writeFile } from 'node:fs/promises';
const out = [];
for (const ms of ['ES','FR','DE']) {
  const url = 'https://api.tech.ec.europa.eu/agrifood/api/oilseeds/prices?memberStateCodes=' + ms + '&beginDate=01/01/2026';
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  out.push('== ' + ms + ' HTTP ' + res.status);
  if (!res.ok) continue;
  const rows = await res.json();
  out.push('sample: ' + JSON.stringify(rows[0]));
  const m = new Map();
  for (const r of rows) {
    const k = [r.product, r.productName, r.marketName, r.stageName, r.marketStage, r.sector, r.unit].join(' | ');
    const e = m.get(k) || { n: 0, last: '', lp: '' };
    e.n++; const key = (r.endDate || '').split('/').reverse().join('');
    if (key > e.last) { e.last = key; e.lp = r.price + ' @ ' + r.endDate; }
    m.set(k, e);
  }
  for (const [k, e] of m) out.push(e.n + ' | ' + k + ' | last ' + e.lp);
}
await writeFile('scripts/.probe-output.txt', out.join('\n') + '\n');
