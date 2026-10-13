#!/usr/bin/env node
/* Dehesa Index — Estado semanal de los cultivos por estado de EE. UU. (USDA NASS Crop Progress, nivel STATE), API Quick Stats (NASS_API_KEY).
   Publica data/us-crop-progress/<ESTADO>.json (campana actual y anterior) y data/us-crop-progress/index.json.
   Para cada cultivo y estado: valoracion semanal (% muy mala, mala, regular, buena, excelente) y avance por etapa (% sembrado, cosechado...) con la media de 5 anos
   que publica el propio NASS. Solo valores numericos publicados; los "(D)" o vacios se descartan. Si la descarga no cuadra no se sobrescribe nada. */
import fs from 'node:fs'; import path from 'node:path';
const KEY = process.env.NASS_API_KEY;
if (!KEY) { console.error('Falta NASS_API_KEY'); process.exit(1); }
const DIR = path.join(process.cwd(), 'data', 'us-crop-progress');
const YEAR = new Date().getUTCFullYear(), FROM = YEAR - 1;
const CROPS = { 'CORN': 'corn', 'CORN, GRAIN': 'corn', 'SOYBEANS': 'soybeans', 'WHEAT, WINTER': 'wheat_winter', 'WHEAT, SPRING, (EXCL DURUM)': 'wheat_spring', 'COTTON, UPLAND': 'cotton',
  'SORGHUM': 'sorghum', 'SORGHUM, GRAIN': 'sorghum', 'BARLEY': 'barley', 'RICE': 'rice', 'OATS': 'oats', 'PEANUTS': 'peanuts' };
const CLASSES = { 'PCT VERY POOR': 0, 'PCT POOR': 1, 'PCT FAIR': 2, 'PCT GOOD': 3, 'PCT EXCELLENT': 4 };
async function q(params) {
  const u = 'https://quickstats.nass.usda.gov/api/api_GET/?' + new URLSearchParams({ key: KEY, format: 'JSON', source_desc: 'SURVEY', freq_desc: 'WEEKLY', agg_level_desc: 'STATE', ...params });
  for (let i = 0; i < 3; i++) {
    const r = await fetch(u);
    if (r.ok) return (await r.json()).data || [];
    if (r.status === 400) return [];
    await new Promise(s => setTimeout(s, 3000 * (i + 1)));
  }
  throw new Error('NASS no responde');
}
const num = v => { const n = Number(String(v).replace(/,/g, '')); return String(v).trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 100 ? n : null; };
const parse = sd => { const m = /^(.*?) - (CONDITION|PROGRESS)(, 5 YEAR AVG)?, MEASURED IN (.*)$/.exec(sd); return m ? { crop: CROPS[m[1]] || null, cat: m[2], avg: !!m[3], meas: m[4] } : null; };
const S = {};   // estado -> cultivo -> {condition:{ano:{semana:[5]}}, progress:{ano:{etapa:{semana:v}}}, avg:{etapa:{semana:v}}}
const slot = (st, crop) => ((S[st] = S[st] || {})[crop] = S[st][crop] || { condition: {}, progress: {}, avg: {} });
for (const commodity of ['CORN', 'SOYBEANS', 'WHEAT', 'COTTON', 'SORGHUM', 'BARLEY', 'RICE', 'OATS', 'PEANUTS']) {
  for (const cat of ['CONDITION', 'PROGRESS', 'PROGRESS, 5 YEAR AVG']) {
    const rows = await q({ commodity_desc: commodity, statisticcat_desc: cat, year__GE: String(FROM) });
    for (const r of rows) {
      const p = parse(r.short_desc); if (!p || !p.crop || !r.state_alpha || r.state_alpha.length !== 2 || !/^\d{4}-\d\d-\d\d$/.test(r.week_ending)) continue;
      const v = num(r.Value); if (v === null) continue;
      const c = slot(r.state_alpha, p.crop), y = String(r.year);
      if (p.cat === 'CONDITION') { const k = CLASSES[p.meas]; if (k == null) continue; ((c.condition[y] = c.condition[y] || {})[r.week_ending] = c.condition[y][r.week_ending] || [null, null, null, null, null])[k] = v; }
      else { const k = p.meas.replace(/^PCT /, '').toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
        if (p.avg) { if (y === String(YEAR) || y === String(FROM)) ((c.avg[y] = c.avg[y] || {})[k] = c.avg[y][k] || {})[r.week_ending] = v; }
        else ((c.progress[y] = c.progress[y] || {})[k] = c.progress[y][k] || {})[r.week_ending] = v; }
    }
  }
}
const files = {}; let lastWe = '', nPts = 0;
for (const st of Object.keys(S).sort()) {
  const crops = {};
  for (const crop of Object.keys(S[st]).sort()) {
    const c = S[st][crop], cond = {}, prog = {}, avg = {};
    for (const y of Object.keys(c.condition)) {
      const rows = Object.keys(c.condition[y]).sort().filter(w => c.condition[y][w].every(x => x !== null) && Math.abs(c.condition[y][w].reduce((a, b) => a + b, 0) - 100) <= 3).map(w => [w, ...c.condition[y][w]]);
      if (rows.length) { cond[y] = rows; nPts += rows.length; if (y === String(YEAR) || !lastWe) lastWe = rows[rows.length - 1][0] > lastWe ? rows[rows.length - 1][0] : lastWe; }
    }
    for (const y of Object.keys(c.progress)) { const o = {}; for (const k of Object.keys(c.progress[y]).sort()) o[k] = Object.keys(c.progress[y][k]).sort().map(w => [w, c.progress[y][k][w]]); if (Object.keys(o).length) prog[y] = o; }
    for (const y of Object.keys(c.avg)) { const o = {}; for (const k of Object.keys(c.avg[y]).sort()) o[k] = Object.keys(c.avg[y][k]).sort().map(w => [w, c.avg[y][k][w]]); if (Object.keys(o).length) avg[y] = o; }
    if (Object.keys(cond).length || Object.keys(prog).length) crops[crop] = { condition: cond, progress: prog, avg };
  }
  if (Object.keys(crops).length) files[st] = crops;
}
// comprobaciones antes de sobrescribir
const sts = Object.keys(files);
if (sts.length < 15 || nPts < 500) { console.error('Descarga corta (' + sts.length + ' estados, ' + nPts + ' valoraciones): no se sobrescribe'); process.exit(0); }
fs.mkdirSync(DIR, { recursive: true });
const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z'), src = { name: 'USDA NASS, Crop Progress and Condition (Quick Stats)', url: 'https://quickstats.nass.usda.gov/', license: 'Dominio publico (datos del Gobierno de EE. UU.); se cita la fuente' };
let changed = 0;
const write = (f, doc) => { const p = path.join(DIR, f); let old = null; try { old = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  const strip = d => JSON.stringify({ ...d, generatedAt: '' }); if (old && strip(old) === strip(doc)) return; fs.writeFileSync(p, JSON.stringify(doc) + '\n'); changed++; };
for (const st of sts) write(st + '.json', { schemaVersion: 1, generatedAt: now, state: st, source: src, year: YEAR, crops: files[st] });
write('index.json', { schemaVersion: 1, generatedAt: now, source: src, year: YEAR, lastWeekEnding: lastWe, states: sts, note: 'Valoracion: % de superficie [semana, muy mala, mala, regular, buena, excelente]. Avance: % por etapa [semana, valor]; avg = media de 5 anos publicada por el NASS.' });
console.log('us-crop-progress: ' + sts.length + ' estados, ' + nPts + ' valoraciones semanales, ultima semana ' + lastWe + ', ' + changed + ' ficheros cambiados');
