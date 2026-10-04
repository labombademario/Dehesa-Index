#!/usr/bin/env node
// Contornos de condados de EE. UU. por estado -> data/us-county/geo/<ST>.json (trazados SVG ya proyectados, listos para pintar).
// Fuente: us-atlas 3.0.1 (counties-albers-10m.json), derivado de los ficheros cartograficos del Censo de EE. UU. (dominio publico) con
// licencia ISC del paquete (Mike Bostock). Uso: npm i --no-save us-atlas topojson-client && node scripts/build-us-county-geo.mjs
// No hay datos agrarios aqui: solo geometria y nombre del condado. Los codigos FIPS son los del Censo (estado + condado).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const topo = require('topojson-client');
const atlasPath = require.resolve('us-atlas/counties-albers-10m.json');
const A = JSON.parse(readFileSync(atlasPath, 'utf8'));
const ST = { '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY' };
const feats = topo.feature(A, A.objects.counties).features;
const r1 = n => Math.round(n * 10) / 10;
function ring(r) { let d = ''; r.forEach((p, i) => { d += (i ? 'L' : 'M') + r1(p[0]) + ' ' + r1(p[1]); }); return d + 'Z'; }
function path(g) { const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; return polys.map(pl => pl.map(ring).join('')).join(''); }
function bbox(g, b) { const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; for (const pl of polys) for (const p of pl[0]) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); } }
const by = {};
for (const f of feats) { const st = ST[String(f.id).slice(0, 2)]; if (!st || !f.geometry) continue; (by[st] = by[st] || []).push(f); }
mkdirSync('data/us-county/geo', { recursive: true });
let total = 0;
for (const st of Object.keys(by).sort()) {
  const b = [1e9, 1e9, -1e9, -1e9]; by[st].forEach(f => bbox(f.geometry, b));
  const c = by[st].sort((x, y) => String(x.id).localeCompare(String(y.id))).map(f => [String(f.id), f.properties.name, path(f.geometry)]);
  const doc = { schemaVersion: 1, state: st, vb: [r1(b[0] - 2), r1(b[1] - 2), r1(b[2] - b[0] + 4), r1(b[3] - b[1] + 4)], source: 'us-atlas 3.0.1 (Censo de EE. UU., dominio publico; ISC)', c };
  const s = JSON.stringify(doc); writeFileSync('data/us-county/geo/' + st + '.json', s + '\n'); total += s.length;
}
console.log(Object.keys(by).length, 'estados,', feats.length, 'condados,', Math.round(total / 1024), 'KB');
