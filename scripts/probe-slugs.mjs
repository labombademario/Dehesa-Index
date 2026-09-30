// TEMPORAL
import { writeFile } from 'node:fs/promises';
const r = await fetch('https://api.tech.ec.europa.eu/agrifood/api/poultry/egg/prices?memberStateCodes=ES,DE,FR,IT', { headers: { Accept: 'application/json' } });
const j = await r.json();
const out = ['STATUS ' + r.status, 'FILAS ' + j.length, 'CAMPOS ' + Object.keys(j[0]).join(',')];
for (const f of Object.keys(j[0])) { const v = [...new Set(j.map(x => x[f]))]; if (v.length <= 20) out.push(f + ' -> ' + JSON.stringify(v)); }
const g = {};
for (const x of j) { const m = /(\d\d)\/(\d\d)\/(\d{4})/.exec(x.endDate); const d = m[3] + '-' + m[2] + '-' + m[1]; const k = x.memberStateCode + ' | ' + x.farmingMethod + (x.eggClass ? ' | ' + x.eggClass : ''); const e = g[k] || (g[k] = { n: 0, last: '', p: null }); e.n++; if (d >= e.last) { e.last = d; e.p = x.price; } }
Object.keys(g).sort().forEach(k => out.push('GRUPO [' + k + '] n=' + g[k].n + ' ultimo=' + g[k].last + ' precio=' + g[k].p));
await writeFile('scripts/.probe-output.txt', out.join('\n') + '\n');
