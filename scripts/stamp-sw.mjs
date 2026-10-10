#!/usr/bin/env node
// Version del service worker = hash del codigo estructural (HTML raiz, js/, css/, manifest). Si cambia, el cache antiguo se descarta al activar.
// Uso: node scripts/stamp-sw.mjs          (reescribe sw.js)
//      node scripts/stamp-sw.mjs --check  (falla si sw.js no corresponde al codigo actual; lo ejecuta Dehesa Quality)
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
for (const e of await readdir(root, { withFileTypes: true })) if (e.isFile() && /\.(html|webmanifest)$/.test(e.name)) files.push(e.name);
for (const d of ['js', 'css']) for (const e of await readdir(path.join(root, d), { withFileTypes: true })) if (e.isFile()) files.push(d + '/' + e.name);
// Ficheros que los bots regeneran con datos (no son codigo estructural): no entran en el hash, o Dehesa Quality fallaria tras cada refresco de noticias/FX/diesel.
const GENERATED = new Set(['js/data.js']);
for (let i = files.length - 1; i >= 0; i--) if (GENERATED.has(files[i])) files.splice(i, 1);
files.sort();
const h = createHash('sha256');
for (const f of files) { h.update(f + '\0'); h.update(await readFile(path.join(root, f))); }
const swPath = path.join(root, 'sw.js'); const sw = await readFile(swPath, 'utf8');
h.update('sw.js\0'); h.update(sw.replace(/var BUILD = '[^']*';/, ''));   // el propio service worker (sin su linea de version): un cambio en su logica tambien renueva el cache
const build = h.digest('hex').slice(0, 10);
const re = /var BUILD = '[^']*';/;
if (!re.test(sw)) { console.error("sw.js no tiene 'var BUILD = ...;'"); process.exit(1); }
const cur = (re.exec(sw)[0].match(/'([^']*)'/) || [])[1];
if (process.argv.includes('--check')) { if (cur !== build) { console.error('sw.js desactualizado (' + cur + ' != ' + build + '). Ejecuta: node scripts/stamp-sw.mjs'); process.exit(1); } console.log('sw.js OK (' + build + ')'); process.exit(0); }
await writeFile(swPath, sw.replace(re, "var BUILD = '" + build + "';")); console.log('sw.js -> ' + build);
