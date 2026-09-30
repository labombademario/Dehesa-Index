#!/usr/bin/env node
/* Dehesa Index — Estado de los cultivos (USDA NASS Crop Progress), semanal, EE. UU.
   Usa la API Quick Stats (NASS_API_KEY). Publica data/crop-progress.json.
   Nunca inventa: solo valores numéricos publicados; los "(D)" se descartan. Si la descarga no cuadra, no sobrescribe. */
import fs from 'node:fs';
import path from 'node:path';
const KEY = process.env.NASS_API_KEY;
if (!KEY) { console.error('Falta NASS_API_KEY'); process.exit(1); }
const OUT = path.join(process.cwd(), 'data', 'crop-progress.json');
const YEAR = new Date().getUTCFullYear();
const FROM = YEAR - 7; // 8 campañas: la actual y 7 anteriores
// prefijo de short_desc (antes de " - ") -> id
const CROPS = {
  'CORN': 'corn', 'CORN, GRAIN': 'corn',
  'SOYBEANS': 'soybeans',
  'WHEAT, WINTER': 'wheat_winter',
  'WHEAT, SPRING, (EXCL DURUM)': 'wheat_spring',
  'COTTON, UPLAND': 'cotton'
};
const CLASSES = { 'PCT VERY POOR': 've', 'PCT POOR': 'p', 'PCT FAIR': 'f', 'PCT GOOD': 'g', 'PCT EXCELLENT': 'e' };
async function q(params) {
  const u = 'https://quickstats.nass.usda.gov/api/api_GET/?' + new URLSearchParams({ key: KEY, format: 'JSON', source_desc: 'SURVEY', freq_desc: 'WEEKLY', ...params });
  for (let i = 0; i < 3; i++) {
    const r = await fetch(u);
    if (r.ok) return (await r.json()).data || [];
    if (r.status === 400) return []; // sin datos para esa consulta
    await new Promise(s => setTimeout(s, 3000 * (i + 1)));
  }
  throw new Error('NASS no responde');
}
const num = v => { const n = Number(String(v).replace(/,/g, '')); return String(v).trim() !== '' && Number.isFinite(n) ? n : null; };
function parse(sd) { const m = /^(.*?) - (CONDITION|PROGRESS), MEASURED IN (.*)$/.exec(sd); return m ? { crop: CROPS[m[1]] || null, cat: m[2], meas: m[3] } : null; }
const crops = {};
const ensure = id => crops[id] || (crops[id] = { id, seasons: {}, states: {} });
const seasonOf = (c, y) => c.seasons[y] || (c.seasons[y] = { condition: {}, progress: {} });
for (const commodity of ['CORN', 'SOYBEANS', 'WHEAT', 'COTTON']) {
  for (const cat of ['CONDITION', 'PROGRESS']) {
    const rows = await q({ commodity_desc: commodity, agg_level_desc: 'NATIONAL', statisticcat_desc: cat, year__GE: String(FROM) });
    for (const r of rows) {
      const p = parse(r.short_desc); if (!p || !p.crop) continue;
      const v = num(r.Value); if (v === null || !/^\d{4}-\d\d-\d\d$/.test(r.week_ending)) continue;
      const s = seasonOf(ensure(p.crop), r.year);
      if (p.cat === 'CONDITION') { const k = CLASSES[p.meas]; if (!k) continue; (s.condition[r.week_ending] = s.condition[r.week_ending] || {})[k] = v; }
      else { const k = p.meas.replace(/^PCT /, '').toLowerCase().replace(/[^a-z]+/g, '_'); (s.progress[k] = s.progress[k] || {})[r.week_ending] = v; }
    }
  }
}
// estados: última y penúltima semana de valoración de la campaña más reciente
for (const commodity of ['CORN', 'SOYBEANS', 'WHEAT', 'COTTON']) {
  const rows = await q({ commodity_desc: commodity, agg_level_desc: 'STATE', statisticcat_desc: 'CONDITION', year__GE: String(YEAR) });
  const by = {};
  for (const r of rows) {
    const p = parse(r.short_desc); if (!p || !p.crop || !CLASSES[p.meas]) continue;
    const v = num(r.Value); if (v === null || !r.state_alpha || r.state_alpha.length !== 2) continue;
    const k = p.crop + '|' + r.state_alpha;
    (by[k] = by[k] || {})[r.week_ending] = by[k][r.week_ending] || {}; by[k][r.week_ending][CLASSES[p.meas]] = v;
  }
  for (const k of Object.keys(by)) {
    const [crop, st] = k.split('|'); const weeks = Object.keys(by[k]).sort().slice(-2);
    ensure(crop).states[st] = weeks.map(w => ({ we: w, ...by[k][w] }));
  }
}
// salida compacta
const out = [];
let lastWe = '';
for (const id of Object.keys(crops).sort()) {
  const c = crops[id], seasons = {};
  for (const y of Object.keys(c.seasons).sort()) {
    const s = c.seasons[y];
    const cond = Object.keys(s.condition).sort().filter(w => ['ve', 'p', 'f', 'g', 'e'].every(k => typeof s.condition[w][k] === 'number')).map(w => [w, s.condition[w].ve, s.condition[w].p, s.condition[w].f, s.condition[w].g, s.condition[w].e]);
    const prog = {};
    for (const k of Object.keys(s.progress).sort()) prog[k] = Object.keys(s.progress[k]).sort().map(w => [w, s.progress[k][w]]);
    if (cond.length) lastWe = cond[cond.length - 1][0] > lastWe ? cond[cond.length - 1][0] : lastWe;
    seasons[y] = { condition: cond, progress: prog };
  }
  out.push({ id, seasons, states: c.states });
}
// comprobaciones antes de sobrescribir
const bad = [];
for (const id of ['corn', 'soybeans', 'wheat_winter', 'wheat_spring', 'cotton']) {
  const c = out.find(x => x.id === id);
  if (!c) { bad.push(id + ' sin datos'); continue; }
  const full = Object.values(c.seasons).filter(s => s.condition.length >= 8).length;
  if (full < 5) bad.push(id + ' con menos de 5 campañas de valoración completas');
  for (const s of Object.values(c.seasons)) for (const w of s.condition) { const t = w[1] + w[2] + w[3] + w[4] + w[5]; if (t < 97 || t > 103) bad.push(id + ' valoración suma ' + t + ' en ' + w[0]); }
}
if (bad.length) { console.error('No se sobrescribe data/crop-progress.json:\n' + bad.slice(0, 10).join('\n')); process.exit(1); }
fs.writeFileSync(OUT, JSON.stringify({
  schemaVersion: '1.0', generatedAt: new Date().toISOString(),
  source: { name: 'USDA NASS — Crop Progress (Quick Stats)', url: 'https://quickstats.nass.usda.gov/', license: 'Datos oficiales de USDA NASS, de uso público; se cita la fuente. Este producto usa la API de NASS pero no está respaldado ni certificado por NASS.' },
  lastWeekEnding: lastWe,
  note: 'Valoración: % de superficie en cada categoría (muy mala, mala, regular, buena, excelente), orden [semana, ve, p, f, g, e]. Avance: % de superficie en cada etapa, [semana, valor]. Campaña = año del cultivo (el trigo de invierno empieza a valorarse el otoño anterior). Estados: dos últimas semanas de la campaña más reciente.',
  crops: out
}) + '\n');
console.log('OK', out.map(c => c.id + ':' + Object.keys(c.seasons).length + 'c/' + Object.keys(c.states).length + 'e').join(' '), 'última semana', lastWe);
