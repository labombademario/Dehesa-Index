#!/usr/bin/env node
// Comercio agrario de EE. UU. por país (USDA FAS GATS, datos del Census Bureau). Mensual.
// Clave: FAS_API_KEY. Escribe data/gats.json (acumula meses; solo pide los que faltan).
// Solo copia cifras de la API: valor en USD y cantidad en toneladas cuando la unidad del Census es el kilo.
import { readFile, writeFile } from 'node:fs/promises';
import { ISO3TO2 } from './lib/iso.mjs';
const KEY = process.env.FAS_API_KEY;
if (!KEY) { console.error('falta FAS_API_KEY'); process.exit(1); }
const B = 'https://api.fas.usda.gov/api/gats';
const OUT = 'data/gats.json';
const MONTHS_KEEP = 26;
const GROUPS = [
  { id: 'trigo', hs: ['1001'] }, { id: 'maiz', hs: ['1005'] }, { id: 'arroz', hs: ['1006'] }, { id: 'sorgo', hs: ['1007'] }, { id: 'cebada', hs: ['1003'] },
  { id: 'soja', hs: ['1201'] }, { id: 'harina_soja', hs: ['2304'] }, { id: 'aceite_soja', hs: ['1507'] }, { id: 'ddgs', hs: ['2303'] }, { id: 'etanol', hs: ['2207'] },
  { id: 'vacuno', hs: ['0201', '0202'] }, { id: 'cerdo', hs: ['0203'] }, { id: 'pollo', hs: ['0207'] }, { id: 'lacteos', hs: ['0401', '0402', '0403', '0404', '0405', '0406'] },
  { id: 'huevos', hs: ['0407', '0408'] }, { id: 'algodon', hs: ['5201'] }, { id: 'fertilizantes', hs: ['3102', '3103', '3104', '3105'] }, { id: 'ganado_vivo', hs: ['0102'] }
];
function groupOf(h) { for (const g of GROUPS) for (const p of g.hs) if (h.startsWith(p)) return g.id; return null; }
async function get(p, ok404 = true) {
  let err = '';
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(B + p, { headers: { 'X-Api-Key': KEY }, signal: AbortSignal.timeout(90000) });
      if (r.status === 404) return ok404 ? [] : null;
      if (!r.ok) { err = 'HTTP ' + r.status; await new Promise(z => setTimeout(z, 2500 * (i + 1))); continue; }
      return await r.json();
    } catch (e) { err = e.message; await new Promise(z => setTimeout(z, 2500)); }
  }
  throw new Error(p + ' ' + err);
}
const ym = (y, m) => String(y) + String(m).padStart(2, '0');
function prevMonths(n) { const r = []; const d = new Date(); let y = d.getUTCFullYear(), m = d.getUTCMonth() + 1; for (let i = 0; i < n; i++) { m--; if (m === 0) { m = 12; y--; } r.push(ym(y, m)); } return r; }
let doc = { schemaVersion: '1.0', source: 'USDA FAS GATS (Census Bureau)', groups: GROUPS.map(g => g.id), partners: {}, months: [], ex: {}, im: {} };
try { const old = JSON.parse(await readFile(OUT, 'utf8')); if (old && old.months) doc = old; } catch (e) {}
const [countries, uoms] = await Promise.all([get('/countries'), get('/unitsOfMeasure')]);
const kgIds = new Set(uoms.filter(u => /^KG$/i.test(u.unitOfMeasureCode)).map(u => u.unitOfMeasureId));
console.log('unidades KG:', [...kgIds].join(','));
const seen = new Set(); const plist = [];
for (const c of countries) {
  if (!/^[A-Z]{2}$/.test(c.countryCode) || c.discontinuedOn) continue;
  const iso3 = (c.gencCode || '').trim();
  const iso2 = ISO3TO2[iso3] || null;
  if (!iso2 || seen.has(c.countryCode)) continue; seen.add(c.countryCode);
  plist.push({ code: c.countryCode, name: c.countryName, iso2 });
}
console.log('socios:', plist.length);
// último mes disponible: se prueba con China hacia atrás
let latest = null;
for (const m of prevMonths(6)) { const r = await get('/censusExports/partnerCode/CH/year/' + m.slice(0, 4) + '/month/' + Number(m.slice(4))); if (r.length) { latest = m; break; } }
if (!latest) { console.error('No se encontró ningún mes con datos'); process.exit(1); }
console.log('último mes con datos:', latest);
// meses que faltan: los últimos 25 hasta 'latest'
const want = []; { let y = Number(latest.slice(0, 4)), m = Number(latest.slice(4)); for (let i = 0; i < 25; i++) { want.push(ym(y, m)); m--; if (m === 0) { m = 12; y--; } } }
const have = new Set(doc.months);
// se rehacen siempre los 2 últimos por si el Census revisa cifras
const todo = want.filter(m => !have.has(m) || want.indexOf(m) < 2).sort();
console.log('meses a pedir:', todo.join(','));
async function pool(items, n, fn) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const it = items[i++]; await fn(it); } })); }
for (const flow of [['ex', 'censusExports'], ['im', 'censusImports']]) {
  const [fk, ep] = flow;
  doc[fk] = doc[fk] || {};
  for (const mo of todo) {
    const y = mo.slice(0, 4), mm = Number(mo.slice(4));
    const agg = {}; // group -> partner -> [value, tons, hasTons]
    let calls = 0, rows = 0;
    await pool(plist, 8, async p => {
      const arr = await get('/' + ep + '/partnerCode/' + p.code + '/year/' + y + '/month/' + mm);
      calls++;
      for (const r of arr) {
        const g = groupOf(String(r.hS10Code || '').trim()); if (!g) continue;
        rows++;
        const a = ((agg[g] = agg[g] || {})[p.code] = agg[g][p.code] || [0, 0, 1]);
        a[0] += Number(r.value) || 0;
        if (kgIds.has(r.censusUOMId1)) a[1] += (Number(r.quantity1) || 0) / 1000; else a[2] = 0;
      }
    });
    for (const g of Object.keys(doc[fk])) for (const pc of Object.keys(doc[fk][g])) delete doc[fk][g][pc][mo];
    for (const g of Object.keys(agg)) {
      doc[fk][g] = doc[fk][g] || {};
      for (const pc of Object.keys(agg[g])) { const a = agg[g][pc]; (doc[fk][g][pc] = doc[fk][g][pc] || {})[mo] = [Math.round(a[0]), a[2] ? Math.round(a[1]) : null]; }
    }
    console.log(fk, mo, 'llamadas', calls, 'filas de interés', rows);
  }
}
const allMonths = new Set(doc.months); todo.forEach(m => allMonths.add(m));
doc.months = [...allMonths].sort().slice(-MONTHS_KEEP);
const keep = new Set(doc.months);
for (const fk of ['ex', 'im']) for (const g of Object.keys(doc[fk])) for (const pc of Object.keys(doc[fk][g])) { for (const mo of Object.keys(doc[fk][g][pc])) if (!keep.has(mo)) delete doc[fk][g][pc][mo]; if (!Object.keys(doc[fk][g][pc]).length) delete doc[fk][g][pc]; }
doc.partners = Object.fromEntries(plist.map(p => [p.code, { n: p.name, i2: p.iso2 }]));
doc.latest = doc.months[doc.months.length - 1]; doc.generatedAt = new Date().toISOString();
const total = m => Object.values(doc.ex).reduce((s, g) => s + Object.values(g).reduce((t, pm) => t + ((pm[m] || [0])[0]), 0), 0);
console.log('exportaciones totales (grupos) último mes:', total(doc.latest), 'USD');
if (total(doc.latest) < 1e9) { console.error('Total de exportaciones implausible: no se escribe'); process.exit(1); }
await writeFile(OUT, JSON.stringify(doc) + '\n', 'utf8');
