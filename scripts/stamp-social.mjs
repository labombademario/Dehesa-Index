#!/usr/bin/env node
// Etiquetas de vista previa social (og:image, twitter:card) en las paginas raiz. Idempotente.
// Uso: node scripts/stamp-social.mjs [--check]   (lo ejecuta Dehesa Quality con --check)
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { socialMeta } from './lib_seo.mjs';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const tags = socialMeta('es');
const RE = /<meta property="og:image"[^>]*>(?:<meta property="og:image:width"[^>]*>)?(?:<meta property="og:image:height"[^>]*>)?(?:<meta name="twitter:card"[^>]*>)?(?:<meta name="twitter:image"[^>]*>)?/;
let changed = 0, n = 0;
for (const e of await readdir(root, { withFileTypes: true })) {
  if (!e.isFile() || !e.name.endsWith('.html')) continue;
  const f = path.join(root, e.name), src = await readFile(f, 'utf8');
  if (!src.includes('property="og:title"')) continue;
  n++;
  const out = RE.test(src) ? src.replace(RE, tags) : src.replace('</head>', tags + '\n</head>');
  if (out !== src) { changed++; if (CHECK) console.error('sin vista previa social: ' + e.name); else await writeFile(f, out); }
}
if (CHECK && changed) { console.error(changed + ' HTML sin etiquetas sociales. Ejecuta: node scripts/stamp-social.mjs'); process.exit(1); }
console.log('stamp-social: ' + n + ' paginas, ' + (CHECK ? 'todas al dia' : changed + ' reescritas'));
