#!/usr/bin/env node
// USDA NASS Quick Stats: ganadería y lácteo (livestock) y precios pagados por los agricultores (prices).
// Uso: node scripts/update-nass.mjs livestock|prices|crops|received   Clave: NASS_API_KEY
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
  if (ANNUAL && (rp === 'YEAR' || rp === 'ANNUAL' || (MARKET_YEAR && rp === 'MARKETING YEAR'))) return String(y);
  return null;
}
let ANNUAL = false;
let MARKET_YEAR = false; // solo en los trabajos de precios recibidos anuales (campaña de comercialización)
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
  // existencias de lacteos secos y condensados (informe Dairy Products, mensual, libras): no llevan 'COLD STORAGE' en el nombre; se copian tal cual
  await job('leche existencias lácteos secos', { commodity_desc: 'MILK', statisticcat_desc: 'STOCKS', agg_level_desc: 'NATIONAL' }, r => /^MILK, [A-Z ,&]+ - STOCKS, MEASURED IN LB$/.test(r.short_desc) && r.freq_desc === 'POINT IN TIME');
  await job('leche producción estados', { commodity_desc: 'MILK', statisticcat_desc: 'PRODUCTION', agg_level_desc: 'STATE' }, r => /^MILK - PRODUCTION/.test(r.short_desc));
  await job('leche producción nacional', { commodity_desc: 'MILK', statisticcat_desc: 'PRODUCTION', agg_level_desc: 'NATIONAL' }, r => /^MILK - PRODUCTION/.test(r.short_desc));
  await job('leche precio recibido', { commodity_desc: 'MILK', statisticcat_desc: 'PRICE RECEIVED', agg_level_desc: 'NATIONAL' });
  await job('vacas lecheras', { commodity_desc: 'MILK', statisticcat_desc: 'INVENTORY', agg_level_desc: 'STATE' });
  await job('vacas lecheras nacional', { commodity_desc: 'MILK', statisticcat_desc: 'INVENTORY', agg_level_desc: 'NATIONAL' });
  // ovino, huevos y lacteos: produccion y existencias nacionales (informes Sheep and Goats, Chickens and Eggs y Dairy Products; cifras tal como las publica NASS)
  for (const sd of ['SHEEP, INCL LAMBS - INVENTORY', 'SHEEP, EWES, BREEDING, GE 1 YEAR - INVENTORY', 'SHEEP - LAMB CROP, MEASURED IN HEAD']) await job('ovino ' + sd, { commodity_desc: 'SHEEP', short_desc: sd, agg_level_desc: 'NATIONAL' });
  await job('cordero y cordero adulto producción', { commodity_desc: 'LAMB & MUTTON', statisticcat_desc: 'PRODUCTION', agg_level_desc: 'NATIONAL' }, r => r.short_desc === 'LAMB & MUTTON, SLAUGHTER, COMMERCIAL - PRODUCTION, MEASURED IN LB' && r.freq_desc === 'MONTHLY');
  await job('huevos producción', { commodity_desc: 'EGGS', statisticcat_desc: 'PRODUCTION', agg_level_desc: 'NATIONAL' }, r => r.short_desc === 'EGGS, TABLE - PRODUCTION, MEASURED IN EGGS' && r.freq_desc === 'MONTHLY');
  for (const c of ['BUTTER', 'CHEESE']) await job(c + ' producción', { commodity_desc: c, statisticcat_desc: 'PRODUCTION', agg_level_desc: 'NATIONAL' }, r => r.short_desc === c + ' - PRODUCTION, MEASURED IN LB' && r.freq_desc === 'MONTHLY');
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
  // existencias trimestrales de avena (Grain Stocks): 1 mar/jun/sep/dic, total, en granja y fuera de granja, bushels
  await job('OATS STOCKS NATIONAL', { commodity_desc: 'OATS', statisticcat_desc: 'STOCKS', agg_level_desc: 'NATIONAL', source_desc: 'SURVEY', year__GE: Y10 }, r => /^OATS(, (ON|OFF) FARM)? - STOCKS, MEASURED IN BU$/.test(r.short_desc) && r.freq_desc === 'POINT IN TIME');
  // centeno, patata, remolacha y cana de azucar, uva, manzana y aceituna: produccion, rendimiento y superficie nacionales (anuales)
  const EXTRA = { RYE: ['RYE - PRODUCTION, MEASURED IN BU', 'RYE - YIELD, MEASURED IN BU / ACRE', 'RYE - ACRES HARVESTED'], POTATOES: ['POTATOES - PRODUCTION, MEASURED IN CWT', 'POTATOES - YIELD, MEASURED IN CWT / ACRE', 'POTATOES - ACRES HARVESTED'],
    SUGARBEETS: ['SUGARBEETS - PRODUCTION, MEASURED IN TONS', 'SUGARBEETS - YIELD, MEASURED IN TONS / ACRE', 'SUGARBEETS - ACRES HARVESTED'], SUGARCANE: ['SUGARCANE, SUGAR & SEED - PRODUCTION, MEASURED IN TONS', 'SUGARCANE, SUGAR & SEED - YIELD, MEASURED IN TONS / ACRE', 'SUGARCANE, SUGAR & SEED - ACRES HARVESTED'],
    GRAPES: ['GRAPES - PRODUCTION, MEASURED IN TONS', 'GRAPES - YIELD, MEASURED IN TONS / ACRE'], APPLES: ['APPLES - PRODUCTION, MEASURED IN LB', 'APPLES - YIELD, MEASURED IN LB / ACRE'], OLIVES: ['OLIVES - PRODUCTION, MEASURED IN TONS', 'OLIVES - YIELD, MEASURED IN TONS / ACRE'] };
  for (const c of Object.keys(EXTRA)) for (const sd of EXTRA[c]) await job(sd, { commodity_desc: c, short_desc: sd, agg_level_desc: 'NATIONAL', source_desc: 'SURVEY', year__GE: Y10 }, r => r.freq_desc === 'ANNUAL');
  await job('RYE STOCKS NATIONAL', { commodity_desc: 'RYE', short_desc: 'RYE - STOCKS, MEASURED IN BU', agg_level_desc: 'NATIONAL', source_desc: 'SURVEY', year__GE: Y10 }, r => r.freq_desc === 'POINT IN TIME');
} else if (MODE === 'received') {
  // Indices de precios RECIBIDOS por los agricultores (2011=100, mensual) y precios recibidos de los productos que NASS publica a nivel nacional. Mismas cifras que Quick Stats.
  await job('índices recibidos nacional', { statisticcat_desc: 'INDEX FOR PRICE RECEIVED, 2011', agg_level_desc: 'NATIONAL', freq_desc: 'MONTHLY', source_desc: 'SURVEY' });
  for (const [c, sd] of [['POTATOES', 'POTATOES, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT'], ['APPLES', 'APPLES, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / LB'], ['GRAPES', 'GRAPES, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / TON']]) await job(sd, { commodity_desc: c, short_desc: sd, agg_level_desc: 'NATIONAL', source_desc: 'SURVEY', freq_desc: 'MONTHLY' });
  ANNUAL = true; MARKET_YEAR = true;
  for (const [c, sd] of [['RYE', 'RYE - PRICE RECEIVED, MEASURED IN $ / BU'], ['POTATOES', 'POTATOES - PRICE RECEIVED, MEASURED IN $ / CWT'], ['SUGARBEETS', 'SUGARBEETS - PRICE RECEIVED, MEASURED IN $ / TON'], ['SUGARCANE', 'SUGARCANE, SUGAR - PRICE RECEIVED, MEASURED IN $ / TON'],
                         ['GRAPES', 'GRAPES - PRICE RECEIVED, MEASURED IN $ / TON'], ['APPLES', 'APPLES - PRICE RECEIVED, MEASURED IN $ / LB'], ['OLIVES', 'OLIVES - PRICE RECEIVED, MEASURED IN $ / TON']])
    await job(sd, { commodity_desc: c, short_desc: sd, agg_level_desc: 'NATIONAL', source_desc: 'SURVEY', freq_desc: 'ANNUAL', year__GE: String(new Date().getUTCFullYear() - 10) }, r => r.freq_desc === 'ANNUAL');
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
