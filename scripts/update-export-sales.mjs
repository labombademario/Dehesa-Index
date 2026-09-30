#!/usr/bin/env node
// Ventas de exportación de EE. UU. (USDA FAS, Export Sales Reporting). Semanal. Datos públicos del Gobierno de EE. UU.
// Clave: FAS_API_KEY (api.data.gov). Escribe data/export-sales.json. No inventa nada: copia cifras de la API;
// los totales son la suma de los destinos publicados. Si algo no cuadra no se sobrescribe el fichero.
import { readFile, writeFile } from 'node:fs/promises';
import { ISO3TO2 } from './lib/iso.mjs';
const KEY = process.env.FAS_API_KEY;
if (!KEY) { console.error('falta FAS_API_KEY'); process.exit(1); }
const B = 'https://api.fas.usda.gov/api/esr';
const OUT = 'data/export-sales.json';
const WANT = [107, 101, 102, 103, 104, 105, 401, 701, 301, 801, 901, 902, 1404, 1505, 1701, 1702];
async function get(p) {
  let err = '';
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(B + p, { headers: { 'X-Api-Key': KEY }, signal: AbortSignal.timeout(120000) });
      if (!r.ok) { err = 'HTTP ' + r.status; await new Promise(z => setTimeout(z, 3000 * (i + 1))); continue; }
      return await r.json();
    } catch (e) { err = e.message; await new Promise(z => setTimeout(z, 3000)); }
  }
  throw new Error(p + ' ' + err);
}
const d10 = s => String(s).slice(0, 10);
const log = [];
const [comms, countries, units, rel] = await Promise.all([get('/commodities'), get('/countries'), get('/unitsOfMeasure'), get('/datareleasedates')]);
const unitName = Object.fromEntries(units.map(u => [u.unitId, u.unitNames]));
const FIX = { 5800: 'KR', 7910: 'ZA', 3150: 'SR', 7480: 'CI', 4644: 'UZ', 4634: 'KZ', 4632: 'AZ', 4794: 'MK', 9110: 'VI' };
const cInfo = {};
for (const c of countries) {
  const g = (c.gencCode || '').trim();
  cInfo[c.countryCode] = { name: (c.countryDescription || c.countryName || '').trim(), iso3: g || null, iso2: c.countryCode === 1 ? 'EU' : (FIX[c.countryCode] || ISO3TO2[g] || null), region: c.regionId };
}
const out = { schemaVersion: '1.0', source: 'USDA FAS Export Sales Reporting (ESR)', generatedAt: new Date().toISOString(), commodities: [] };
for (const code of WANT) {
  const cm = comms.find(c => c.commodityCode === code);
  if (!cm) { log.push(code + ' no está en la lista'); continue; }
  const my = Math.max(...rel.filter(r => r.commodityCode === code).map(r => r.marketYear));
  if (!Number.isFinite(my)) { log.push(code + ' sin campaña'); continue; }
  const rows = {};
  for (const y of [my, my - 1]) { try { rows[y] = await get('/exports/commodityCode/' + code + '/allCountries/marketYear/' + y); } catch (e) { log.push(code + ' MY' + y + ' ' + e.message); rows[y] = []; } }
  const cur = rows[my];
  if (!cur.length) { log.push(code + ' MY' + my + ' sin filas'); continue; }
  // semanas de cada campaña
  const byWeek = arr => { const m = new Map(); for (const r of arr) { const w = d10(r.weekEndingDate); if (!m.has(w)) m.set(w, []); m.get(w).push(r); } return m; };
  const wk = byWeek(cur), wkPrev = byWeek(rows[my - 1]);
  const weeks = [...wk.keys()].sort();
  const last = weeks[weeks.length - 1];
  const sum = (list, f) => list.reduce((s, r) => s + (Number(r[f]) || 0), 0);
  // ¿coexisten el agregado de la UE (1) y sus miembros? si es así, se descuenta el agregado para no contar dos veces
  const isMember = cc => cInfo[cc] && cInfo[cc].region === 1 && cc !== 1;
  const clean = list => { const hasAgg = list.some(r => r.countryCode === 1), hasMem = list.some(r => isMember(r.countryCode)); return (hasAgg && hasMem) ? list.filter(r => r.countryCode !== 1) : list; };
  const hist = m => [...m.keys()].sort().map(w => { const l = clean(m.get(w)); return { w, wk: sum(l, 'weeklyExports'), acc: sum(l, 'accumulatedExports'), out: sum(l, 'outstandingSales'), net: sum(l, 'currentMYNetSales'), gross: sum(l, 'grossNewSales'), nxtOut: sum(l, 'nextMYOutstandingSales') }; });
  const H = hist(wk), HP = hist(wkPrev);
  const latestRows = clean(wk.get(last));
  const aggMix = wk.get(last).some(r => r.countryCode === 1) && wk.get(last).some(r => isMember(r.countryCode));
  if (aggMix) log.push(code + ' aviso: EU-27 y miembros a la vez en ' + last + ' (se descuenta el agregado)');
  const tot = H[H.length - 1];
  // misma semana de la campaña anterior (por posición: n-ésima semana)
  const idx = H.length - 1; const prevSame = HP[idx] || null;
  const ctry = latestRows.map(r => {
    const ci = cInfo[r.countryCode] || { name: 'Código ' + r.countryCode, iso3: null, iso2: null };
    return { c: r.countryCode, n: ci.name, i2: ci.iso2, wk: r.weeklyExports, acc: r.accumulatedExports, out: r.outstandingSales, net: r.currentMYNetSales, gross: r.grossNewSales, com: r.currentMYTotalCommitment, nxt: r.nextMYOutstandingSales };
  }).filter(x => x.wk || x.acc || x.out || x.net || x.gross || x.nxt).sort((a, b) => (b.acc + b.out) - (a.acc + a.out));
  const unitId = latestRows[0].unitId;
  out.commodities.push({ code, name: cm.commodityName, unit: unitName[unitId] || 'Metric Tons', myEnd: my, my: (Number(weeks[0].slice(0, 4)) === my ? String(my) : (my - 1) + '/' + String(my).slice(2)), weekEnding: last, totals: { wk: tot.wk, acc: tot.acc, out: tot.out, net: tot.net, gross: tot.gross, com: sum(latestRows, 'currentMYTotalCommitment'), nxt: sum(latestRows, 'nextMYOutstandingSales') }, prevSameWeek: prevSame ? { w: prevSame.w, acc: prevSame.acc, out: prevSame.out } : null, weekly: H.slice(-60), weeklyPrev: HP.slice(-60), countries: ctry });
  log.push(code + ' OK ' + cm.commodityName + ' MY' + my + ' semana ' + last + ' destinos ' + ctry.length + ' exportado acumulado ' + tot.acc + ' pendiente ' + tot.out);
}
if (out.commodities.length < 8) { console.error(log.join('\n')); console.error('Demasiado pocos productos: no se escribe'); process.exit(1); }
out.countryMeta = undefined;
await writeFile(OUT, JSON.stringify(out) + '\n', 'utf8');
await writeFile('data/export-sales-log.txt', log.join('\n') + '\n', 'utf8');
console.log(log.join('\n'));
