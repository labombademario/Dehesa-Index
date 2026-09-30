#!/usr/bin/env node
// USDA NASS Quick Stats: ganadería y lácteo (livestock) y precios pagados por los agricultores (prices).
// Uso: node scripts/update-nass.mjs livestock|prices   Clave: NASS_API_KEY
// Copia las cifras tal como las publica NASS (sin recalcular ni estimar). Cada serie = short_desc de Quick Stats.
import { writeFile } from 'node:fs/promises';
const KEY = process.env.NASS_API_KEY; if (!KEY) { console.error('falta NASS_API_KEY'); process.exit(1); }
const MODE = process.argv[2];
const B = 'https://quickstats.nass.usda.gov/api/api_GET/';
const Y0 = new Date().getUTCFullYear() - 5;
const MON = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
async function q(params) {
  const p = new URLSearchParams({ key: KEY, format: 'JSON', year__GE: String(Y0), ...params });
  let err = '';
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(B + '?' + p, { signal: AbortSignal.timeout(120000) });
      if (r.status === 400) return [];
      if (r.ok) { const j = await r.json(); return j.data || []; }
      err = 'HTTP ' + r.status;
    } catch (e) { err = e.message; }
    await new Promise(z => setTimeout(z, 3000 * (i + 1)));
  }
  console.log('ERROR', JSON.stringify(params), err); return [];
}
function period(r) {
  const y = r.year, rp = String(r.reference_period_desc || '').toUpperCase().trim();
  let m = rp.match(/^(?:FIRST OF |END OF )?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/);
  if (m) return y + '-' + String(MON[m[1]]).padStart(2, '0');
  m = rp.match(/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC) THRU (JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/);
  if (m && MON[m[2]] >= MON[m[1]]) return y + '-' + String(MON[m[2]]).padStart(2, '0'); // trimestre: se etiqueta con su último mes
  if (ANNUAL && (rp === 'YEAR' || rp === 'ANNUAL')) return String(y);
  return null;
}
let ANNUAL = false;
const num = v => { const s = String(v).replace(/,/g, '').trim(); return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null; };
const store = {};
function add(rows, keep) {
  let n = 0;
  for (const r of rows) {
    if (r.domaincat_desc && r.domaincat_desc !== 'NOT SPECIFIED') continue;
    if (keep && !keep(r)) continue;
    const p = period(r), v = num(r.Value); if (!p || v === null) continue;
    const k = r.short_desc;
    const s = store[k] = store[k] || { d: k, u: r.unit_desc, n: {}, s: {} };
    if (r.agg_level_desc === 'NATIONAL') s.n[p] = v;
    else if (/REGION/.test(r.agg_level_desc)) { const st = r.location_desc; (s.s[st] = s.s[st] || {})[p] = v; }
    else if (r.agg_level_desc === 'STATE') { const st = r.state_alpha; if (!st) continue; (s.s[st] = s.s[st] || {})[p] = v; }
    else continue;
    n++;
  }
  return n;
}
async function job(label, params, keep) { const rows = await q(params); const n = add(rows, keep); console.log(label, 'filas', rows.length, 'usadas', n); }
if (MODE === 'livestock') {
  await job('cerdos inventario nacional', { commodity_desc: 'HOGS', statisticcat_desc: 'INVENTORY', agg_level_desc: 'NATIONAL' });
  await job('cerdos camada y lechones', { commodity_desc: 'HOGS', statisticcat_desc: 'PIG CROP', agg_level_desc: 'NATIONAL' });
  await job('cerdos camada litter', { commodity_desc: 'HOGS', statisticcat_desc: 'LITTER RATE', agg_level_desc: 'NATIONAL' });
  await job('cerdos inventario estados', { commodity_desc: 'HOGS', statisticcat_desc: 'INVENTORY', agg_level_desc: 'STATE' }, r => /^HOGS( & PIGS)?( - INVENTORY|, (BREEDING|MARKET)[^-]* - INVENTORY)/.test(r.short_desc));
  for (const sc of ['INVENTORY', 'PLACEMENTS', 'MARKETINGS']) await job('vacuno nacional ' + sc, { commodity_desc: 'CATTLE', statisticcat_desc: sc, agg_level_desc: 'NATIONAL' });
  for (const sd of ['CATTLE, INCL CALVES - INVENTORY', 'CATTLE, COWS, BEEF - INVENTORY', 'CATTLE, COWS, MILK - INVENTORY', 'CATTLE, ON FEED - INVENTORY']) await job('vacuno estados ' + sd, { commodity_desc: 'CATTLE', short_desc: sd, agg_level_desc: 'STATE', domain_desc: 'TOTAL' });
  for (const c of ['BEEF', 'PORK', 'BUTTER', 'CHEESE', 'EGGS', 'TURKEYS', 'CHICKENS', 'LAMB & MUTTON', 'VEAL', 'MILK', 'WHEY']) await job('frigoríficos ' + c, { commodity_desc: c, statisticcat_desc: 'STOCKS', agg_level_desc: 'NATIONAL' }, r => /COLD STORAGE/.test(r.short_desc));
  await job('leche producción estados', { commodity_desc: 'MILK', statisticcat_desc: 'PRODUCTION', agg_level_desc: 'STATE' }, r => /^MILK - PRODUCTION/.test(r.short_desc));
  await job('leche producción nacional', { commodity_desc: 'MILK', statisticcat_desc: 'PRODUCTION', agg_level_desc: 'NATIONAL' }, r => /^MILK - PRODUCTION/.test(r.short_desc));
  await job('leche precio recibido', { commodity_desc: 'MILK', statisticcat_desc: 'PRICE RECEIVED', agg_level_desc: 'NATIONAL' });
  await job('vacas lecheras', { commodity_desc: 'MILK', statisticcat_desc: 'INVENTORY', agg_level_desc: 'STATE' });
  await job('vacas lecheras nacional', { commodity_desc: 'MILK', statisticcat_desc: 'INVENTORY', agg_level_desc: 'NATIONAL' });
} else if (MODE === 'prices') {
  ANNUAL = true;
  await job('índices pagados nacional', { statisticcat_desc: 'INDEX FOR PRICE PAID, 2011', agg_level_desc: 'NATIONAL', freq_desc: 'MONTHLY' });
  for (const c of ['FEED', 'FUELS']) {
    await job('precio pagado ' + c + ' nacional', { commodity_desc: c, statisticcat_desc: 'PRICE PAID', agg_level_desc: 'NATIONAL' });
    await job('precio pagado ' + c + ' estados', { commodity_desc: c, statisticcat_desc: 'PRICE PAID', agg_level_desc: 'STATE' });
    await job('precio pagado ' + c + ' región', { commodity_desc: c, statisticcat_desc: 'PRICE PAID', agg_level_desc: 'REGION : MULTI-STATE' });
  }
  await job('precios pagados otros', { commodity_desc: 'FERTILIZER', statisticcat_desc: 'PRICE PAID', agg_level_desc: 'NATIONAL' });
} else if (MODE === 'crops') {
  ANNUAL = true;
  const Y10 = String(new Date().getUTCFullYear() - 10);
  for (const c of ['CORN', 'SOYBEANS', 'WHEAT', 'COTTON', 'SORGHUM', 'BARLEY', 'OATS', 'RICE', 'PEANUTS', 'HAY']) {
    for (const sc of ['YIELD', 'AREA HARVESTED', 'AREA PLANTED', 'PRODUCTION']) {
      for (const lvl of ['NATIONAL', 'STATE']) await job(c + ' ' + sc + ' ' + lvl, { commodity_desc: c, statisticcat_desc: sc, agg_level_desc: lvl, source_desc: 'SURVEY', year__GE: Y10 }, r => !/IRRIGATED|SILAGE|SEED|ORGANIC|UTILIZED|FORAGE/.test(r.short_desc) && r.freq_desc === 'ANNUAL');
    }
  }
} else { console.error('modo desconocido'); process.exit(1); }
const out = { schemaVersion: '1.0', source: 'USDA NASS Quick Stats', mode: MODE, generatedAt: new Date().toISOString(), series: {} };
let total = 0;
for (const k of Object.keys(store).sort()) {
  const s = store[k], toArr = o => Object.keys(o).sort().map(p => [p, o[p]]);
  const nat = toArr(s.n), sts = {}; for (const st of Object.keys(s.s)) sts[st] = toArr(s.s[st]);
  if (!nat.length && !Object.keys(sts).length) continue;
  out.series[k] = { u: s.u, n: nat, s: sts }; total++;
  console.log(' •', k, '|', s.u, '| nac', nat.length, nat.length ? nat[nat.length - 1][0] : '', '| estados', Object.keys(sts).length);
}
if (total < 5) { console.error('series insuficientes'); process.exit(1); }
await writeFile('data/nass-' + MODE + '.json', JSON.stringify(out) + '\n', 'utf8');
console.log('series:', total);
