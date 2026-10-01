#!/usr/bin/env node
// Presupuesto de rendimiento: tamano comprimido (gzip) de los JSON de datos y JS/CSS compartidos.
// Falla (exit 1) si un fichero supera su limite y NO esta en la lista de deuda conocida (KNOWN_DEBT).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const KB = 1024;
const BUDGET = { data: 900 * KB, js: 120 * KB, css: 60 * KB };   // gzip, por fichero
// Deuda conocida: ficheros que ya superan el presupuesto (se cargan solo bajo demanda). Cada uno con su limite propio.
const KNOWN_DEBT = { 'data/eu-trade-stats.json': 1100 * KB, 'data/us-tariffs.json': 2500 * KB };
async function walk(dir, ext, out) {
  for (const e of await readdir(path.join(root, dir), { withFileTypes: true })) {
    if (e.isDirectory()) continue;
    if (e.name.endsWith(ext)) out.push(dir + '/' + e.name);
  }
  return out;
}
const items = [];
for (const f of await walk('data', '.json', [])) items.push([f, 'data']);
for (const f of await walk('js', '.js', [])) items.push([f, 'js']);
for (const f of await walk('css', '.css', [])) items.push([f, 'css']);
const rows = []; const bad = [];
for (const [f, kind] of items) {
  const buf = await readFile(path.join(root, f)); const gz = gzipSync(buf, { level: 9 }).length;
  const limit = KNOWN_DEBT[f] || BUDGET[kind];
  rows.push({ file: f, kind, raw: buf.length, gzip: gz, limit, debt: !!KNOWN_DEBT[f] && gz > BUDGET[kind] });
  if (gz > limit) bad.push(f + ': ' + Math.round(gz / KB) + ' KB gzip > ' + Math.round(limit / KB) + ' KB');
}
rows.sort((a, b) => b.gzip - a.gzip);
console.log('Mayores ficheros (gzip):');
rows.slice(0, 12).forEach(r => console.log('  ' + String(Math.round(r.gzip / KB)).padStart(6) + ' KB  ' + r.file + (r.debt ? '  [deuda conocida]' : '')));
if (process.argv.includes('--write')) await writeFile(path.join(root, 'data', 'performance-budget.json'), JSON.stringify({ generatedAt: new Date().toISOString(), budget: BUDGET, files: rows.slice(0, 40) }, null, 1));
if (bad.length) { console.error('Presupuesto superado:\n  ' + bad.join('\n  ')); process.exit(1); }
console.log('Presupuesto OK (' + rows.length + ' ficheros).');
