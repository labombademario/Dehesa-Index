#!/usr/bin/env node
/*
 * HERRAMIENTA DE INVESTIGACIÓN (no de producción, se borra al terminar).
 * Pregunta al Agri-food Data Portal de la Comisión qué productos, categorías
 * y países publica cada endpoint, en qué unidad y hasta qué fecha, y escribe
 * un resumen compacto en scripts/.probe-catalog.txt. Se ejecuta en GitHub
 * Actions porque el entorno de desarrollo no llega a esa API.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '.probe-catalog.txt');
const BASE = 'https://api.tech.ec.europa.eu/agrifood/api';
const BEGIN = '01/01/2021';
const CANDIDATES = ['fruit-and-vegetable', 'fruit-and-vegetables', 'fruit_and_vegetables', 'fruitAndVegetables', 'fruitandvegetables', 'fruitAndVegetable', 'fruit_and_vegetable', 'fruitsAndVegetables', 'fruit-and-vegetables-supply-chain'];
const OLD_CANDIDATES = ['cereal', 'fruitAndVegetable', 'fruitsAndVegetables', 'fruitsandvegetables', 'fruits', 'vegetables', 'fruit', 'fruitAndVeg/prices', 'fruit-and-veg', 'fruitAndVegetablesPrices', 'fruitVeg', 'fruitsVegetables', 'produce'];
const SKIP = new Set(['referencePeriod', 'marketingYear', 'marketingYearMonth', 'weight', 'price', 'endDate', 'beginDate', 'startDate', 'ym', 'year', 'month', 'quarter', 'week', 'weekNumber', 'weekNumberDay']);

const sleep = ms => new Promise(r => setTimeout(r, ms));
function isoOf(r) {
  const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(r.endDate || r.beginDate || '');
  if (m) return m[3] + '-' + m[2] + '-' + m[1];
  if (r.ym) return String(r.ym);
  if (r.year) return String(r.year) + '-' + String(r.month || '').padStart(2, '0');
  return '';
}

async function get(url) {
  let last;
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const text = await res.text();
      if (res.ok) return { status: res.status, text };
      last = { status: res.status, text: text.slice(0, 200) };
      if (res.status === 404 || res.status === 400) return last;
    } catch (e) { last = { status: 'ERR', text: e.message }; }
    await sleep(8000 * a);
  }
  return last;
}

async function probe(name) {
  const url = BASE + '/' + name + '/prices?beginDate=' + BEGIN;
  const out = ['=== ' + name];
  const r = await get(url);
  out.push('STATUS ' + r.status);
  if (r.status !== 200) { out.push('  ' + String(r.text).replace(/\s+/g, ' ').slice(0, 160)); return out.join('\n'); }
  let rows;
  try { rows = JSON.parse(r.text); } catch (e) { out.push('  no es JSON: ' + r.text.slice(0, 120)); return out.join('\n'); }
  if (!Array.isArray(rows) || !rows.length) { out.push('  vacío'); return out.join('\n'); }
  out.push('FILAS ' + rows.length + ' CAMPOS ' + Object.keys(rows[0]).join(','));
  const fields = Object.keys(rows[0]).filter(f => !SKIP.has(f) && f !== 'memberStateCode' && f !== 'memberStateName' && f !== 'marketName' && f !== 'market');
  const groups = new Map();
  for (const row of rows) {
    const key = fields.map(f => String(row[f])).join(' | ');
    let g = groups.get(key);
    if (!g) { g = { n: 0, members: new Set(), markets: new Set(), first: '9', last: '', price: null }; groups.set(key, g); }
    g.n++; g.members.add(row.memberStateCode); if (row.marketName || row.market) g.markets.add(row.marketName || row.market);
    const d = isoOf(row); if (d && d < g.first) g.first = d; if (d && d >= g.last) { g.last = d; g.price = row.price; }
  }
  out.push('CAMPOS_DE_GRUPO ' + fields.join(' | '));
  out.push('GRUPOS ' + groups.size);
  let i = 0;
  for (const [k, g] of [...groups.entries()].sort((a, b) => b[1].n - a[1].n)) {
    if (i++ >= 60) { out.push('  … (recortado)'); break; }
    out.push('  [' + k + '] n=' + g.n + ' países=' + [...g.members].sort().join(',') + ' mercados=' + g.markets.size + ' ' + g.first + '→' + g.last + ' último=' + g.price);
  }
  out.push('EJEMPLO ' + JSON.stringify(rows[0]));
  return out.join('\n');
}

const parts = [];
for (const n of ['fruit_and_vegetables', 'fruitandvegetables', 'fruit-and-vegetables']) {
  const r = await get('https://api.tech.ec.europa.eu/agrifood/v3/api-docs/' + n);
  let txt = String(r.text).slice(0, 300);
  try { const j = JSON.parse(r.text); txt = Object.entries(j.paths || {}).map(([k, v]) => k + ' ' + Object.entries(v).map(([m, o]) => m + '(' + (o.parameters || []).map(x => x.name).join(',') + ')').join(' ')).join('\n  '); } catch (e) {}
  parts.push('=== SPEC ' + n + ' STATUS ' + r.status + '\n  ' + txt); await sleep(1500);
}
for (const c of CANDIDATES) { parts.push(await probe(c)); await sleep(2500); }
await writeFile(OUT, parts.join('\n\n') + '\n', 'utf8');
console.log('escrito ' + OUT);
