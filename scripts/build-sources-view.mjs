#!/usr/bin/env node
// js/sources-data.js — fuentes en uso (registro de licencias) para la lista agrupada de la pagina Informacion.
// Fuente unica: data/license-registry.json (used=true). Nada se escribe a mano.
// Uso: node scripts/build-sources-view.mjs [--check]   (Dehesa Quality lo ejecuta con --check)
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const reg = JSON.parse(await readFile(path.join(root, 'data/license-registry.json'), 'utf8')).sources;
const rows = [];
for (const [id, s] of Object.entries(reg)) {
  if (!s.used) continue;
  rows.push({
    id, n: String(s.name).replace(/^(Spain|Portugal|Mexico|Australia|Brazil) — /, ''),
    u: s.url, c: s.country === 'GB' ? 'UK' : s.country,
    l: s.status === 'VERIFIED' ? s.licenseId : '', lu: s.status === 'VERIFIED' ? (s.licenseUrl || '') : '',
    p: s.status === 'VERIFIED' ? 0 : 1
  });
}
rows.sort((a, b) => a.c.localeCompare(b.c) || a.n.localeCompare(b.n));
const out = '/* Generado por scripts/build-sources-view.mjs desde data/license-registry.json. No editar a mano. */\nwindow.DEHESA_SOURCES = ' + JSON.stringify(rows) + ';\n';
const f = path.join(root, 'js/sources-data.js');
let old = ''; try { old = await readFile(f, 'utf8'); } catch {}
if (CHECK) { if (old !== out) { console.error('js/sources-data.js desactualizado. Ejecuta: node scripts/build-sources-view.mjs'); process.exit(1); } }
else if (old !== out) await writeFile(f, out);
console.log('sources-view: ' + rows.length + ' fuentes, ' + new Set(rows.map(r => r.c)).size + ' paises/grupos' + (CHECK ? ' (al dia)' : ''));
