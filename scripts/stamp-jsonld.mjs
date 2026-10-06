#!/usr/bin/env node
// Datos estructurados (WebPage + BreadcrumbList) en las paginas raiz que no tienen JSON-LD propio. Idempotente.
// Solo usa lo que la propia pagina declara (title, meta description, canonical): no inventa nada. Las paginas con JSON-LD propio
// (WebApplication, Organization/WebSite en la portada) no se tocan. Uso: node scripts/stamp-jsonld.mjs [--check]
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const MARK = '<script type="application/ld+json" id="di-ld-page">';
const RE = /<script type="application\/ld\+json" id="di-ld-page">[\s\S]*?<\/script>\n?/;
const dec = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
let changed = 0, n = 0;
for (const e of await readdir(root, { withFileTypes: true })) {
  if (!e.isFile() || !e.name.endsWith('.html') || e.name === 'index.html') continue;
  const f = path.join(root, e.name), src = await readFile(f, 'utf8');
  const canon = /<link rel="canonical" href="([^"]+)"/.exec(src), ti = /<title>([^<]+)<\/title>/.exec(src), de = /<meta name="description" content="([^"]+)"/.exec(src);
  if (!canon || !ti || !de) continue;
  const own = src.replace(RE, '');
  if (/application\/ld\+json/.test(own)) continue;   // ya tiene JSON-LD propio
  n++;
  const name = dec(ti[1]).replace(/\s*[|—-]\s*Dehesa Index\s*$/, '').trim(), url = canon[1];
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': url + '#page', url, name, description: dec(de[1]), inLanguage: 'es', isPartOf: { '@id': 'https://dehesaindex.com/#site' }, breadcrumb: { '@id': url + '#bc' } },
    { '@type': 'BreadcrumbList', '@id': url + '#bc', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Dehesa Index', item: 'https://dehesaindex.com/' }, { '@type': 'ListItem', position: 2, name, item: url }] }] };
  const tag = MARK + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>\n';
  const out = RE.test(src) ? src.replace(RE, tag) : src.replace('</head>', tag + '</head>');
  if (out !== src) { changed++; if (CHECK) console.error('JSON-LD desactualizado: ' + e.name); else await writeFile(f, out); }
}
if (CHECK && changed) { console.error(changed + ' paginas con JSON-LD desactualizado. Ejecuta: node scripts/stamp-jsonld.mjs'); process.exit(1); }
console.log('stamp-jsonld: ' + n + ' paginas, ' + (CHECK ? 'todas al dia' : changed + ' reescritas'));
