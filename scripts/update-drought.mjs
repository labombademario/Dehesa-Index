#!/usr/bin/env node
// Monitor de sequía de EE. UU. (U.S. Drought Monitor, NDMC/USDA/NOAA). Semanal (se publica los jueves; mapa válido al martes).
// Sin clave. Copia el % de superficie de cada estado en D0–D4 (acumulado: D1 incluye D2-D4, etc.) tal como lo publica la API.
import { readFile, writeFile } from 'node:fs/promises';
const D = 'https://usdmdataservices.unl.edu/api/';
const OUT = 'data/drought.json';
const FIPS = { 1: 'AL', 2: 'AK', 4: 'AZ', 5: 'AR', 6: 'CA', 8: 'CO', 9: 'CT', 10: 'DE', 11: 'DC', 12: 'FL', 13: 'GA', 15: 'HI', 16: 'ID', 17: 'IL', 18: 'IN', 19: 'IA', 20: 'KS', 21: 'KY', 22: 'LA', 23: 'ME', 24: 'MD', 25: 'MA', 26: 'MI', 27: 'MN', 28: 'MS', 29: 'MO', 30: 'MT', 31: 'NE', 32: 'NV', 33: 'NH', 34: 'NJ', 35: 'NM', 36: 'NY', 37: 'NC', 38: 'ND', 39: 'OH', 40: 'OK', 41: 'OR', 42: 'PA', 44: 'RI', 45: 'SC', 46: 'SD', 47: 'TN', 48: 'TX', 49: 'UT', 50: 'VT', 51: 'VA', 53: 'WA', 54: 'WV', 55: 'WI', 56: 'WY' };
const now = new Date();
const fmt = d => (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + '/' + d.getUTCFullYear();
const start = new Date(now.getTime() - 3 * 365 * 864e5);
async function get(url) {
  let err = '';
  for (let i = 0; i < 5; i++) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(90000) }); if (r.ok) return await r.text(); err = 'HTTP ' + r.status; } catch (e) { err = e.message; }
    await new Promise(z => setTimeout(z, 2500 * (i + 1)));
  }
  throw new Error(url + ' ' + err);
}
function parse(csv) {
  const lines = csv.trim().split(/\r?\n/); const h = lines.shift().split(',');
  const ix = n => h.indexOf(n);
  const out = [];
  for (const l of lines) {
    const c = l.split(','); const md = c[ix('MapDate')]; if (!/^\d{8}$/.test(md)) continue;
    const v = ['D0', 'D1', 'D2', 'D3', 'D4'].map(k => Number(c[ix(k)]));
    if (v.some(x => !isFinite(x))) continue;
    out.push([md.slice(0, 4) + '-' + md.slice(4, 6) + '-' + md.slice(6), ...v]);
  }
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}
const q = (path, aoi) => D + path + '/GetDroughtSeverityStatisticsByAreaPercent?aoi=' + aoi + '&startdate=' + fmt(start) + '&enddate=' + fmt(now) + '&statisticsType=1';
const doc = { schemaVersion: '1.0', source: 'U.S. Drought Monitor (NDMC, USDA, NOAA)', unit: '% de superficie; D0..D4 acumulado', states: {}, us: {} };
for (const [k, aoi] of [['conus', 'conus']]) { doc.us[k] = parse(await get(q('USStatistics', aoi))); }
const ids = Object.keys(FIPS).map(k => String(k).padStart(2, '0'));
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => { while (i < ids.length) { const f = ids[i++]; try { const rows = parse(await get(q('StateStatistics', f))); if (rows.length) doc.states[FIPS[Number(f)]] = rows; else console.log('sin datos', FIPS[Number(f)]); } catch (e) { console.log('error', FIPS[Number(f)], e.message); } } }));
const n = Object.keys(doc.states).length;
if (n < 45 || doc.us.conus.length < 50) { console.error('Datos insuficientes: estados=' + n + ' conus=' + doc.us.conus.length); process.exit(1); }
doc.latest = doc.us.conus[doc.us.conus.length - 1][0];
doc.generatedAt = new Date().toISOString();
await writeFile(OUT, JSON.stringify(doc) + '\n', 'utf8');
console.log('estados:', n, '; semanas CONUS:', doc.us.conus.length, '; última semana:', doc.latest);
