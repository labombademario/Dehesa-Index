#!/usr/bin/env node
// Version automatica de scripts y estilos: cada <script src> / <link href> local de las paginas raiz lleva ?v=<hash del contenido del fichero>.
// Asi el navegador (cache HTTP de GitHub Pages) nunca sirve un JS/CSS viejo con un HTML nuevo, sin tocar a mano las cadenas ?v=.
// Uso: node scripts/stamp-assets.mjs          (reescribe los HTML)
//      node scripts/stamp-assets.mjs --check  (falla si algun HTML no corresponde al contenido actual; lo ejecuta Dehesa Quality)
// Ejecutar ANTES de stamp-sw.mjs (el hash del service worker incluye los HTML).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// Los bots regeneran estos ficheros con datos: su hash cambiaria en cada refresco y obligaria a reescribir HTML. Se dejan como estan.
const SKIP = new Set(['js/data.js', 'js/news-index.js', 'js/news-feed.js']);
const CHECK = process.argv.includes('--check');
const cache = new Map();
async function hash(rel) {
  if (!cache.has(rel)) { try { cache.set(rel, createHash('sha256').update(await readFile(path.join(root, rel))).digest('hex').slice(0, 8)); } catch { cache.set(rel, null); } }
  return cache.get(rel);
}
const re = /((?:src|href)=")((?:js|css|vendor)\/[^"?#]+\.(?:js|css))(\?v=[^"]*)?(")/g;
let changed = 0, refs = 0, missing = [];
for (const e of await readdir(root, { withFileTypes: true })) {
  if (!e.isFile() || !e.name.endsWith('.html')) continue;
  const src = await readFile(path.join(root, e.name), 'utf8'); let out = '', last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(src))) {
    if (SKIP.has(m[2])) continue;
    const h = await hash(m[2]); if (!h) { missing.push(e.name + ' -> ' + m[2]); continue; }
    refs++; out += src.slice(last, m.index) + m[1] + m[2] + '?v=' + h + m[4]; last = m.index + m[0].length;
  }
  out += src.slice(last);
  if (out !== src) { changed++; if (CHECK) console.error('desactualizado: ' + e.name); else await writeFile(path.join(root, e.name), out); }
}
if (missing.length) { console.error('referencias a ficheros que no existen:\n  ' + missing.join('\n  ')); process.exit(1); }
if (CHECK && changed) { console.error(changed + ' HTML con versiones desactualizadas. Ejecuta: node scripts/stamp-assets.mjs'); process.exit(1); }
console.log('stamp-assets: ' + refs + ' referencias, ' + (CHECK ? 'todas al dia' : changed + ' HTML reescritos'));
