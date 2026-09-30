// Investigación temporal: ¿publica el portal algún precio de sorgo? Se borra al terminar.
import { writeFile } from 'node:fs/promises';
const res = await fetch('https://api.tech.ec.europa.eu/agrifood/api/cereal/prices?beginDate=01/01/2015', { headers: { Accept: 'application/json' } });
const rows = await res.json();
const names = new Map();
for (const r of rows) { const k = r.productName + ' | ' + r.stageName; const g = names.get(k) || { n: 0, c: new Set(), last: '' }; g.n++; g.c.add(r.memberStateCode); g.last = r.endDate > g.last ? r.endDate : g.last; names.set(k, g); }
const out = ['FILAS ' + rows.length, 'PRODUCTOS ' + [...new Set(rows.map(r => r.productName))].sort().join('; '), ''];
for (const [k, g] of [...names.entries()].sort()) out.push(k + ' n=' + g.n + ' ' + [...g.c].sort().join(','));
await writeFile('scripts/.probe-sorghum.txt', out.join('\n') + '\n');
