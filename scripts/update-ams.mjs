#!/usr/bin/env node
/*
 * Mercados USDA AMS (API MARS): lee una lista curada de informes nacionales y
 * regionales con PRECIOS (piensos y subproductos, etanol, granos, oleaginosas,
 * legumbres, arroz, aves, huevos, subproductos cárnicos, cerdos de recría,
 * ganado directo, heno, lácteos) y los guarda como series en data/ams/.
 *
 * Los informes MARS tienen estructuras distintas, así que el lector es genérico:
 *  - busca en cada fila los campos de precio (medio, mínimo, máximo o base),
 *  - todo campo de texto que describe el producto (clase, calidad, lugar...) forma
 *    la clave de la serie; los que no cambian en todo el informe se descartan,
 *  - si una semana/día tiene dos filas distintas para la misma serie, se descarta
 *    ese punto (no se adivina cuál vale).
 * No convierte monedas ni unidades. Si falla un informe conserva su archivo anterior.
 *
 * Requiere MARS_API_KEY. Uso: node scripts/update-ams.mjs [id,id,...]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'data', 'ams');
const KEY = process.env.MARS_API_KEY;
if (!KEY) { console.error('falta MARS_API_KEY'); process.exit(1); }
const BASE = 'https://marsapi.ams.usda.gov/services/v1.2/reports/';

// fam: feed, bio, grain, oilseed, pulse, rice, poultry, meat, pig, cattle, hay, dairy
export const REPORTS = [
  ...[3510, 3511, 3512, 3618].map(id => ({ id, fam: 'feed', f: 'w' })),
  ...[3616].map(id => ({ id, fam: 'bio', f: 'w' })), { id: 3617, fam: 'bio', f: 'd' },
  { id: 2920, fam: 'grain', f: 'w' },
  ...[3046, 3223, 3043, 2850, 2711, 2771, 2786, 2787, 2851, 2886, 2892, 2912, 2928, 2932, 2960, 3049, 3088, 3091, 3100, 3146, 3148, 3156, 3167, 3186, 3192, 3225, 3239, 3463, 3878].map(id => ({ id, fam: 'grain', f: 'd' })),
  { id: 2887, fam: 'oilseed', f: 'd' },
  { id: 2914, fam: 'pulse', f: 'w' }, { id: 2917, fam: 'pulse', f: 'd' },
  { id: 1655, fam: 'rice', f: 'w' },
  { id: 3804, fam: 'grain', f: 'd' },
  ...[2843, 2734, 3888].map(id => ({ id, fam: 'poultry', f: 'd' })),
  ...[2842, 2844, 2848, 3645, 3646, 3647].map(id => ({ id, fam: 'poultry', f: 'w' })),
  { id: 2833, fam: 'meat', f: 'd' },
  ...[2838, 2839, 2835, 3641, 2911].map(id => ({ id, fam: 'meat', f: 'w' })),
  { id: 2810, fam: 'pig', f: 'w' }, { id: 2907, fam: 'pig', f: 'w' },
  ...[2708, 2709, 2710, 2770, 2906, 2940, 3059, 3096, 3097, 3098, 3184, 3237, 3455, 2808].map(id => ({ id, fam: 'cattle', f: 'w' })),
  { id: 3486, fam: 'cattle', f: 'd' },
  ...[2707, 2769, 2807, 2885, 2904, 2905, 2929, 2935, 2939, 3056, 3057, 3058, 3095, 3236, 3731, 3784, 3793, 3926].map(id => ({ id, fam: 'hay', f: 'w' })),
  ...[1034, 1035, 1036, 1038, 1039, 1041, 1042, 1043, 1044, 1045, 1046, 1047, 1048, 1049, 1050, 1051, 1052, 1053, 1082, 1083, 1084, 1085, 1089, 1090, 1091, 1092, 1098, 1099, 1100, 1101, 1102, 1602].map(id => ({ id, fam: 'dairy', f: 'w' })),
  { id: 1603, fam: 'dairy', f: 'd' }
];

const norm = k => String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
const num = v => { if (v === null || v === undefined || v === '') return null; const n = Number(String(v).replace(/[$,]/g, '')); return Number.isFinite(n) ? n : null; };
const iso = s => { const m = /^(\d\d)\/(\d\d)\/(\d{4})/.exec(String(s || '')); return m ? m[3] + '-' + m[1] + '-' + m[2] : null; };
const AVG = new Set(['avgprice', 'wtdavgprice', 'price', 'priceavg', 'weightedavgprice', 'averageprice', 'wtdavg', 'avgpricewtd']);
const LO = new Set(['pricemin', 'pricelow', 'lowprice', 'priceminimum', 'minprice', 'pricelo']);
const HI = new Set(['pricemax', 'pricehigh', 'highprice', 'pricemaximum', 'maxprice']);
const BLO = new Set(['basismin']), BHI = new Set(['basismax']);
const UNIT = ['priceunit', 'unit', 'basisunit'];
const META = /^(reportdate|reportbegindate|reportenddate|publisheddate|officename|officecode|officecity|officestate|slugid|slugname|reporttitle|markettype|markettypecategory|finalind|revision|reportstatus|marketlocationcity|marketlocationstate|reportsection)$/;
const NOISE = /(change|direction|previous|lastyear|lastrep|lastreported|yearago|weekago|volume|loads|receipts|quantity|headcount|lotsize|lotdesc|count|pct|percent|futuresmonth|deliveryperiod|deliverymonth|slaughter|value|epv|current$|comment|note|narrative)/;
const NUMOK = new Set(['weightmin', 'weightmax']);

async function get(id, from, to) {
  const url = BASE + id + '?q=report_begin_date=' + from + ':' + to + '&allSections=true';
  let err = '';
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { Authorization: 'Basic ' + Buffer.from(KEY + ':').toString('base64'), Accept: 'application/json' } });
      if (!r.ok) { err = 'HTTP ' + r.status; await new Promise(z => setTimeout(z, 1500)); continue; }
      const d = await r.json();
      return Array.isArray(d) ? d : [d];
    } catch (e) { err = e.message; }
  }
  throw new Error(err);
}

function build(cfg, sections) {
  const rows = [];
  let title = null;
  for (const s of sections) {
    const name = s.reportSection || 'Report';
    if (name === 'Report Header') { if (s.results && s.results[0]) title = s.results[0].report_title || title; continue; }
    for (const r of (s.results || [])) rows.push({ sec: name, r });
  }
  const skippedSecs = {};
  const recs = [];
  for (const { sec, r } of rows) {
    if (!title && r.report_title) title = r.report_title;
    let avg = null, lo = null, hi = null, blo = null, bhi = null, unit = null, bunit = null;
    const dims = {};
    for (const [k, v] of Object.entries(r)) {
      const n = norm(k);
      if (v === null || v === undefined || v === '') continue;
      if (AVG.has(n)) { avg = num(v); continue; }
      if (LO.has(n)) { lo = num(v); continue; }
      if (HI.has(n)) { hi = num(v); continue; }
      if (BLO.has(n)) { blo = num(v); continue; }
      if (BHI.has(n)) { bhi = num(v); continue; }
      if (n === 'priceunit') { unit = String(v); continue; }
      if (n === 'basisunit') { bunit = String(v); continue; }
      if (META.test(n) || NOISE.test(n)) continue;
      if (typeof v === 'number') continue;
      const sv = String(v).trim();
      if (!sv || sv === 'N/A' || sv === 'None') continue;
      if (num(sv) !== null && !NUMOK.has(n)) continue;
      dims[k] = sv;
    }
    let a = avg, l = lo, h = hi, u = unit;
    if (a === null && l === null && h === null) { if (blo !== null || bhi !== null) { l = blo; h = bhi; u = 'Basis ' + (bunit || unit || ''); } else { skippedSecs[sec] = (skippedSecs[sec] || 0) + 1; continue; } }
    const d = iso(r.report_end_date) || iso(r.report_date);
    if (!d || !u) { skippedSecs[sec] = (skippedSecs[sec] || 0) + 1; continue; }
    dims._sec = sec;
    recs.push({ d, dims, u: u.trim(), a, l, h, pub: String(r.published_date || '') });
  }
  // dimensiones constantes fuera
  const names = new Set(); recs.forEach(x => Object.keys(x.dims).forEach(k => names.add(k)));
  const keep = [];
  for (const k of names) { const vals = new Set(recs.map(x => x.dims[k] === undefined ? '' : x.dims[k])); if (vals.size > 1) keep.push(k); }
  keep.sort();
  const map = new Map();
  let dup = 0;
  for (const x of recs) {
    const v = keep.map(k => x.dims[k] === undefined ? '' : x.dims[k]);
    const sk = v.join('\u0001') + '\u0002' + x.u;
    if (!map.has(sk)) map.set(sk, { v, u: x.u, pts: new Map() });
    const s = map.get(sk);
    const cur = s.pts.get(x.d);
    if (!cur) s.pts.set(x.d, [x]);
    else cur.push(x);
  }
  const series = [];
  for (const s of map.values()) {
    const pts = [];
    for (const [d, list] of [...s.pts.entries()].sort()) {
      const lastPub = list.map(x => x.pub).sort().pop();
      const c = list.filter(x => x.pub === lastPub);
      const sig = new Set(c.map(x => [x.a, x.l, x.h].join()));
      if (sig.size !== 1) { dup++; continue; }
      const x = c[0];
      pts.push([d, x.a, x.l, x.h]);
    }
    if (pts.length) series.push({ v: s.v, u: s.u, p: pts });
  }
  return { title, dn: keep.map(k => k === '_sec' ? 'Section' : k), series, skippedSecs, dup, nrows: rows.length };
}

function windowFor(cfg) {
  const t = new Date();
  const f = new Date(t.getTime() - (cfg.f === 'd' ? 130 : 760) * 864e5);
  const p = d => String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + String(d.getUTCDate()).padStart(2, '0') + '/' + d.getUTCFullYear();
  return [p(f), p(t)];
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
  let index = { reports: [] };
  try { index = JSON.parse(await readFile(path.join(OUT, 'index.json'), 'utf8')); } catch (e) {}
  const byId = new Map((index.reports || []).map(r => [r.id, r]));
  const log = [];
  let ok = 0, bad = 0;
  for (const cfg of REPORTS) {
    if (only && !only.includes(cfg.id)) continue;
    try {
      const [from, to] = windowFor(cfg);
      const secs = await get(cfg.id, from, to);
      const b = build(cfg, secs);
      const maxPts = cfg.f === 'd' ? 130 : 110;
      const latest = b.series.reduce((m, s) => s.p[s.p.length - 1][0] > m ? s.p[s.p.length - 1][0] : m, '');
      const cutoff = new Date(Date.now() - (cfg.f === 'd' ? 150 : 400) * 864e5).toISOString().slice(0, 10);
      const series = b.series.filter(s => s.p[s.p.length - 1][0] >= cutoff).map(s => ({ ...s, p: s.p.slice(-maxPts) }));
      series.sort((x, y) => x.v.join('|').localeCompare(y.v.join('|')));
      if (!series.length) { log.push(cfg.id + ' SIN SERIES (filas ' + b.nrows + ', secciones sin precio ' + JSON.stringify(b.skippedSecs) + ')'); bad++; continue; }
      const doc = { id: cfg.id, title: b.title || ('Informe ' + cfg.id), fam: cfg.fam, freq: cfg.f, dn: b.dn, lastDate: latest, updated: new Date().toISOString(), series };
      const txt = JSON.stringify(doc);
      await writeFile(path.join(OUT, cfg.id + '.json'), txt + '\n', 'utf8');
      byId.set(cfg.id, { id: cfg.id, title: doc.title, fam: cfg.fam, freq: cfg.f, lastDate: latest, series: series.length, kb: Math.round(txt.length / 1024) });
      log.push(cfg.id + ' OK ' + series.length + ' series, ' + b.nrows + ' filas, último ' + latest + ', ' + Math.round(txt.length / 1024) + ' KB, dims=' + b.dn.join(',') + (b.dup ? ' descartados_por_ambiguedad=' + b.dup : '') + (Object.keys(b.skippedSecs).length ? ' sin_precio=' + JSON.stringify(b.skippedSecs) : ''));
      ok++;
    } catch (e) { log.push(cfg.id + ' ERROR ' + e.message); bad++; }
  }
  const reports = [...byId.values()].sort((a, b) => a.id - b.id);
  await writeFile(path.join(OUT, 'index.json'), JSON.stringify({ schemaVersion: '1.0', generatedAt: new Date().toISOString(), source: 'USDA AMS Market News (MARS API)', reports }, null, 1) + '\n', 'utf8');
  await writeFile(path.join(OUT, '_log.txt'), log.join('\n') + '\n', 'utf8');
  console.log(log.join('\n'));
  console.log('OK ' + ok + ' / fallos ' + bad);
  if (!only && ok < REPORTS.length * 0.5) { console.error('Menos de la mitad de los informes se leyeron bien: se aborta'); process.exit(1); }
}
if (process.argv[1] && process.argv[1].endsWith('update-ams.mjs')) main().catch(e => { console.error(e); process.exit(1); });
