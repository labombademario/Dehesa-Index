#!/usr/bin/env node
// Contornos de las 9 regiones agrícolas del USDA ERS (Farm Resource Regions): une los condados de us-atlas (Censo de EE. UU., dominio público; ISC)
// según data/us-resource-regions.json (fichero reglink.xls del ERS). Escribe vendor/us-resource-regions.js (proyección Albers 975x610).
// Uso (herramienta puntual, no forma parte del sitio): npm i us-atlas@3.0.1 topojson-client en una carpeta temporal y NODE_PATH hacia ella.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire(process.env.ATLAS_DIR ? process.env.ATLAS_DIR + '/' : import.meta.url);
const topo = req('topojson-client');
const us = JSON.parse(fs.readFileSync((process.env.ATLAS_DIR || '.') + '/node_modules/us-atlas/counties-albers-10m.json', 'utf8'));
const M = JSON.parse(fs.readFileSync('data/us-resource-regions.json', 'utf8'));
const geoms = us.objects.counties.geometries;
const r1 = (n) => Math.round(n * 10) / 10;
function ring(rg) { let s = '', px = null, py = null; rg.forEach((p, i) => { const x = r1(p[0]), y = r1(p[1]); if (i && x === px && y === py) return; s += (i ? 'L' : 'M') + x + ' ' + y; px = x; py = y; }); return s + 'Z'; }
const out = [];
for (const id of Object.keys(M.regions)) {
  const g = geoms.filter((x) => String(M.counties[x.id]) === id);
  const m = topo.merge(us, g);
  const polys = m.type === 'MultiPolygon' ? m.coordinates : [m.coordinates];
  out.push({ id: +id, name: M.regions[id], n: g.length, d: polys.map((pl) => pl.map(ring).join('')).join('') });
}
const js = '/* Contornos de las 9 regiones agrícolas del USDA ERS (Farm Resource Regions), unidos desde los condados de us-atlas (Censo de EE. UU., dominio público; ISC). Proyección Albers 975x610. */\nwindow.DEHESA_US_RESOURCE_REGIONS = ' + JSON.stringify({ viewBox: '0 0 975 610', regions: out }) + ';\n';
fs.writeFileSync('vendor/us-resource-regions.js', js);
console.log(out.map((r) => r.name + ' ' + r.n + ' ' + r.d.length).join('\n'), js.length);
