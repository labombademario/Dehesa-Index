#!/usr/bin/env node
/*
 * Catálogo de precios de la UE (Agri-food Data Portal de la Comisión Europea,
 * API pública sin clave: https://api.tech.ec.europa.eu/agrifood).
 *
 * Guarda TODAS las series relevantes de cada familia (cereales, oleaginosas,
 * lácteos, vacuno, cerdo, pollo, huevos, ovino, arroz, leche cruda, aceite de
 * oliva, azúcar, vino, fertilizantes) con todos los países que las publican.
 *
 * Salida (la lee europa.html, que carga cada serie solo cuando se elige):
 *   data/eu/index.json            resumen de familias
 *   data/eu/<familia>.json        lista de series con el último dato de cada país
 *   data/eu/<familia>/<serie>.json puntos [días desde 2000-01-01, valor] por país
 *
 * Reglas del proyecto:
 *   - No se inventa ni se convierte nada: cada valor es el que publica el portal,
 *     en su unidad (€/t, €/100 kg…). No se hacen medias entre mercados.
 *   - Si un país publica varios mercados para la misma serie, cada mercado es
 *     una línea propia (nunca se promedian ni se pisa uno con otro).
 *   - Se descartan las filas cuyo precio no está en euros.
 *   - Si una familia falla (red, formato), se conservan sus ficheros anteriores.
 *
 * Uso: node scripts/update-eu-catalog.mjs [familia ...]   (sin argumentos: todas)
 * Pruebas locales: EU_FIXTURE_DIR=<dir con <endpoint>.json> usa datos de prueba.
 */
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { parseEuDate, parsePrice } from './update-eu-agrifood.mjs';

const root = process.cwd();
const OUT = path.join(root, 'data', 'eu');
const BASE = 'https://api.tech.ec.europa.eu/agrifood/api';
const EPOCH = Date.UTC(2000, 0, 1);
const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
const UNIT_LABEL = {
  'TONNES': '€/t', 'Tonne': '€/t', 'national currency/ton': '€/t', '€/tonne': '€/t',
  '100KG': '€/100 kg', '100 KG': '€/100 kg', '€/100Kg': '€/100 kg', '100kg': '€/100 kg', '€/100kg': '€/100 kg', 'national currency/100kg': '€/100 kg',
  'P': '€/animal', 'Euro / HL.': '€/hl'
};

const NAT = /^National Average/;
/**
 * parts(r): trozos que identifican la serie (sin país ni año comercial).
 * region(r): código del país o zona. keep(r): filtro de filas. since: 'dd/mm/aaaa' o null (histórico completo).
 */
export const FAMILIES = {
  cereales: { endpoint: 'cereal', freq: 'weekly', since: '01/01/2015', date: 'endDate',
    parts: r => [r.productName, r.stageName], region: r => r.memberStateCode,
    keep: r => NAT.test(r.stageName || '') || (r.memberStateCode === 'ES' && /^Departure from silo/.test(r.stageName || '')) },
  oleaginosas: { endpoint: 'oilseeds', freq: 'weekly', since: '01/01/2015', date: 'endDate',
    parts: r => [r.product, r.productType, r.marketStage], region: r => r.memberStateCode, market: r => r.market },
  lacteos: { endpoint: 'dairy', freq: 'weekly', since: '01/01/2015', date: 'endDate',
    parts: r => [r.product], region: r => r.memberStateCode },
  vacuno: { endpoint: 'beef', freq: 'weekly', since: '01/01/2015', date: 'endDate',
    parts: r => [r.category, r.productCode], region: r => r.memberStateCode },
  cerdo: { endpoint: 'pigmeat', freq: 'weekly', since: '01/01/2015', date: 'endDate',
    parts: r => [r.pigClass], region: r => r.memberStateCode },
  pollo: { endpoint: 'poultry', freq: 'weekly', since: '01/01/2015', date: 'endDate',
    parts: r => [r.productName, r.priceType], region: r => r.memberStateCode },
  huevos: { endpoint: 'poultry/egg', freq: 'weekly', since: '01/01/2015', date: 'endDate',
    parts: r => [r.farmingMethod], region: r => r.memberStateCode },
  ovino: { endpoint: 'sheepAndGoat', freq: 'weekly', since: '01/01/2015', date: 'endDate',
    parts: r => [r.category], region: r => r.memberStateCode, market: r => r.marketName },
  arroz: { endpoint: 'rice', freq: 'weekly', since: null, date: 'endDate',
    parts: r => [r.stage, r.type, r.variety], region: r => r.memberStateCode },
  leche: { endpoint: 'rawMilk', freq: 'monthly', since: null, date: 'endDate', completedOnly: true,
    parts: r => [r.product], region: r => r.memberStateCode },
  aceite: { endpoint: 'oliveOil', freq: 'weekly', since: '01/01/2015', date: 'endDate',
    parts: r => [r.product], region: r => r.memberStateCode, market: r => r.market },
  azucar: { endpoint: 'sugar', freq: 'monthly', since: null, date: 'ym',
    parts: r => [r.contractType], region: r => r.sugarRegion, unitFixed: 'Tonne' },
  vino: { endpoint: 'wine', freq: 'weekly', since: null, date: 'endDate',
    parts: r => [r.description], region: r => r.memberStateCode },
  // Precios a lo largo de la cadena (salida de envasado, finca, comercio): solo semanales y solo media nacional
  fruta: { endpoint: 'fruitAndVegetable/pricesSupplyChain', path: 'fruitAndVegetable/pricesSupplyChain', freq: 'weekly', since: '01/01/2015', date: 'endDate',
    parts: r => [r.variety, r.productStage], region: r => r.memberStateCode,
    keep: r => r.periodType === 'Week' && /^National/i.test(r.market || '') },
  fertilizantes: { endpoint: 'fertiliser', freq: 'monthly', since: null, date: 'yearMonth',
    parts: r => [r.product], region: () => 'EU', unitFixed: '€/tonne' }
};

const MIN_POINTS = 10;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchRows(fam) {
  if (process.env.EU_FIXTURE_DIR) {
    return JSON.parse(await readFile(path.join(process.env.EU_FIXTURE_DIR, fam.endpoint.replace(/\//g, '_') + '.json'), 'utf8'));
  }
  let url = BASE + '/' + (fam.path || fam.endpoint + '/prices');
  if (fam.since) url += '?beginDate=' + fam.since;
  let last = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) return await res.json();
      last = 'HTTP ' + res.status;
    } catch (e) { last = e.message; }
    await sleep(15000 * attempt);
  }
  throw new Error('Agri-food API ' + last + ' (' + fam.endpoint + ')');
}

function rowDate(r, fam) {
  if (fam.date === 'yearMonth') return MONTHS[r.month] && r.year ? r.year + '-' + MONTHS[r.month] + '-01' : null;
  if (fam.date === 'ym') { const m = /^(\d{4})\/(\d{2})$/.exec(String(r.ym || '')); return m ? m[1] + '-' + m[2] + '-01' : null; }
  return parseEuDate(r[fam.date]);
}
const dayNum = iso => Math.round((Date.parse(iso + 'T00:00:00Z') - EPOCH) / 864e5);
const isoOf = n => new Date(EPOCH + n * 864e5).toISOString().slice(0, 10);
function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'x'; }
const clean = v => { const t = String(v == null ? '' : v).trim(); return t && !/^(N\.?A\.?|Not Defined|null|undefined)$/i.test(t) ? t : ''; };

/** Solo euros: si el precio trae otra divisa o texto, se descarta la fila. */
function priceOf(r, fam) {
  if (typeof r.price === 'number') return r.price > 0 ? r.price : null;
  const s = String(r.price == null ? '' : r.price).trim();
  if (!s || /[^\d.,\s€\-]/.test(s)) return null;
  return parsePrice(s);
}

export function buildFamily(rows, fam, today) {
  // 1) agrupa por serie (partes + unidad) y detecta países con varios mercados
  const series = new Map();
  for (const r of rows) {
    if (fam.keep && !fam.keep(r)) continue;
    const p = priceOf(r, fam); const d = rowDate(r, fam); const reg = fam.region(r);
    if (p === null || !d || !reg) continue;
    if (fam.completedOnly && !(d < today)) continue;
    const unit = fam.unitFixed || r.unit || '';
    const parts = fam.parts(r).map(clean).filter(Boolean);
    if (!parts.length) continue;
    const key = parts.join(' | ') + ' || ' + unit;
    let s = series.get(key);
    if (!s) { s = { parts, unit, cells: new Map(), markets: new Map() }; series.set(key, s); }
    const mk = fam.market ? clean(fam.market(r)) : '';
    const cellKey = reg + '\u0001' + mk;
    let c = s.cells.get(cellKey);
    if (!c) { c = { c: reg, m: mk, pts: new Map() }; s.cells.set(cellKey, c); }
    c.pts.set(d, Number(p.toFixed(2)));
    if (!s.markets.has(reg)) s.markets.set(reg, new Set());
    s.markets.get(reg).add(mk);
  }
  // 2) construye las series; un país con un solo mercado se muestra sin mercado
  const out = []; const used = new Set();
  for (const [key, s] of series) {
    const regions = [];
    for (const c of s.cells.values()) {
      const multi = s.markets.get(c.c).size > 1;
      const pts = [...c.pts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      if (!pts.length) continue;
      regions.push({ c: c.c, m: multi ? c.m : '', pts });
    }
    // series residuales (menos de MIN_POINTS puntos en cualquier país) no aportan y ensucian el selector
    if (!regions.length || Math.max.apply(null, regions.map(r => r.pts.length)) < MIN_POINTS) continue;
    regions.sort((a, b) => (a.c === 'EU' ? -1 : b.c === 'EU' ? 1 : a.c.localeCompare(b.c)) || a.m.localeCompare(b.m));
    let id = slug(s.parts.join('-')); let n = 2;
    while (used.has(id)) id = slug(s.parts.join('-')) + '-' + n++;
    used.add(id);
    out.push({ id, parts: s.parts, unit: s.unit, unitLabel: UNIT_LABEL[s.unit] || s.unit, regions });
  }
  out.sort((a, b) => b.regions.reduce((x, r) => x + r.pts.length, 0) - a.regions.reduce((x, r) => x + r.pts.length, 0));
  return out;
}

function nearest(pts, iso, tolDays) {
  const t = Date.parse(iso + 'T00:00:00Z'); let best = null, bd = Infinity;
  for (const p of pts) { const d = Math.abs(Date.parse(p[0] + 'T00:00:00Z') - t) / 864e5; if (d < bd) { bd = d; best = p; } }
  return best && bd <= tolDays ? best : null;
}

async function writeFamily(id, fam, built, generatedAt) {
  const dir = path.join(OUT, id);
  await mkdir(dir, { recursive: true });
  const keepFiles = new Set();
  const list = [];
  const tol = fam.freq === 'monthly' ? 20 : 10;
  for (const s of built) {
    const file = s.id + '.json';
    keepFiles.add(file);
    const sum = s.regions.map(r => {
      const last = r.pts[r.pts.length - 1], prev = r.pts.length > 1 ? r.pts[r.pts.length - 2] : null;
      const yAgo = new Date(Date.parse(last[0] + 'T00:00:00Z') - 365 * 864e5).toISOString().slice(0, 10);
      const y = nearest(r.pts, yAgo, tol);
      return { c: r.c, m: r.m || undefined, first: r.pts[0][0], last: last, prev: prev, yoy: y && y[0] !== last[0] ? y : null, n: r.pts.length };
    });
    const latest = sum.reduce((m, r) => (r.last[0] > m ? r.last[0] : m), '');
    list.push({ id: s.id, parts: s.parts, unit: s.unitLabel, freq: fam.freq, latest, regions: sum });
    const body = {
      schemaVersion: '1.0', id: s.id, family: id, parts: s.parts, unit: s.unitLabel, freq: fam.freq,
      regions: s.regions.map(r => ({ c: r.c, m: r.m || undefined, d: r.pts.map(p => dayNum(p[0])), v: r.pts.map(p => p[1]) }))
    };
    await writeFile(path.join(dir, file), JSON.stringify(body) + '\n', 'utf8');
  }
  for (const f of await readdir(dir)) if (!keepFiles.has(f)) await rm(path.join(dir, f));
  await writeFile(path.join(OUT, id + '.json'), JSON.stringify({
    schemaVersion: '1.0', family: id, endpoint: fam.endpoint, freq: fam.freq, source: 'eu_agrifood', generatedAt,
    epoch: '2000-01-01', series: list
  }) + '\n', 'utf8');
  return { id, endpoint: fam.endpoint, freq: fam.freq, series: list.length, points: built.reduce((x, s) => x + s.regions.reduce((y, r) => y + r.pts.length, 0), 0), latest: list.reduce((m, s) => (s.latest > m ? s.latest : m), '') };
}

async function main() {
  const wanted = process.argv.slice(2);
  const ids = wanted.length ? wanted : Object.keys(FAMILIES);
  for (const id of ids) if (!FAMILIES[id]) throw new Error('Familia desconocida: ' + id + ' (' + Object.keys(FAMILIES).join(', ') + ')');
  const today = new Date().toISOString().slice(0, 10);
  const generatedAt = new Date().toISOString();
  await mkdir(OUT, { recursive: true });
  let prevIndex = { families: [] };
  try { prevIndex = JSON.parse(await readFile(path.join(OUT, 'index.json'), 'utf8')); } catch (e) {}
  const results = new Map((prevIndex.families || []).map(f => [f.id, f]));
  let failed = 0;
  for (const id of ids) {
    try {
      const fam = FAMILIES[id];
      const rows = await fetchRows(fam);
      if (!Array.isArray(rows) || !rows.length) throw new Error('respuesta vacía');
      const built = buildFamily(rows, fam, today);
      if (!built.length) throw new Error('ninguna serie válida (¿cambió el formato?)');
      const res = await writeFamily(id, fam, built, generatedAt);
      results.set(id, res);
      console.log(id + ': ' + res.series + ' series, ' + res.points + ' puntos, último dato ' + res.latest + ' (' + rows.length + ' filas)');
    } catch (e) { failed++; console.error('FALLO ' + id + ': ' + e.message + ' — se conservan los ficheros anteriores'); }
    if (!process.env.EU_FIXTURE_DIR) await sleep(3000);
  }
  const order = Object.keys(FAMILIES);
  await writeFile(path.join(OUT, 'index.json'), JSON.stringify({
    schemaVersion: '1.0', source: 'eu_agrifood', generatedAt,
    families: order.filter(k => results.has(k)).map(k => results.get(k))
  }, null, 1) + '\n', 'utf8');
  if (failed === ids.length) process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('update-eu-catalog.mjs')) await main();
