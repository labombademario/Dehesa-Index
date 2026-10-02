#!/usr/bin/env node
// QA de SEO: cada URL del sitemap existe en local, tiene UNA canonical que coincide con su URL (y ninguna se repite), JSON-LD valido,
// hreflang coherente y reciproco, titulo/descripcion presentes y contenido visible no vacio. Ademas, toda landing local esta en el sitemap.
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://dehesaindex.com';
const errs = []; let checks = 0;
const ok = (c, m) => { checks++; if (!c) errs.push(m); };
const exists = async p => stat(p).then(() => true).catch(() => false);
const toFile = u => { const p = u.replace(ORIGIN, '').split('#')[0].split('?')[0]; return path.join(root, p.endsWith('/') ? p + 'index.html' : p || 'index.html'); };
const sm = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
ok(new Set(locs).size === locs.length, 'sitemap: URLs duplicadas');
ok((sm.match(/<url>/g) || []).length === locs.length, 'sitemap: numero de <url> distinto del de <loc> (XML mal formado)');
ok(locs.length <= 50000 && Buffer.byteLength(sm) <= 50 * 1024 * 1024, 'sitemap: supera los limites del protocolo (50.000 URLs / 50 MB)');
for (const m of sm.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) ok(/^\d{4}-\d{2}-\d{2}(T[\d:.+Z-]+)?$/.test(m[1]) && new Date(m[1]) <= new Date(Date.now() + 864e5), 'sitemap: lastmod invalido o en el futuro ' + m[1]);
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8').catch(() => '');
ok(/^Sitemap:\s*https:\/\/dehesaindex\.com\/sitemap\.xml/mi.test(robots), 'robots.txt: no declara el sitemap');
ok(!/^Disallow:\s*\/\s*$/mi.test(robots), 'robots.txt: bloquea todo el sitio');
const canon = new Map(); const pages = new Map();
for (const u of locs) {
  ok(u.startsWith(ORIGIN), u + ': fuera del dominio'); const f = toFile(u);
  if (!(await exists(f))) { ok(false, u + ': no existe en local (' + path.relative(root, f) + ')'); continue; }
  const h = await readFile(f, 'utf8'); pages.set(u, h);
  const cs = [...h.matchAll(/<link[^>]+rel="canonical"[^>]*>/g)].map(m => (m[0].match(/href="([^"]+)"/) || [])[1]);
  ok(cs.length === 1, u + ': ' + cs.length + ' canonicals');
  if (cs.length === 1 && u.includes('?')) { const js = await readFile(path.join(root, 'js/' + path.basename(f, '.html') + '.js'), 'utf8').catch(() => ''); ok(/canonical/.test(js), u + ': URL con parametros sin canonical dinamica en js/' + path.basename(f, '.html') + '.js'); ok(cs[0] === u.split('?')[0], u + ': canonical base = ' + cs[0]); }
  else if (cs.length === 1) { ok(cs[0] === u, u + ': canonical = ' + cs[0]); if (!u.includes('?') && canon.has(cs[0])) ok(false, u + ': canonical repetida con ' + canon.get(cs[0])); canon.set(cs[0], u); }
  ok(!/<meta[^>]+name="robots"[^>]+noindex/i.test(h), u + ': esta en el sitemap pero tiene noindex');
  ok(/<title>[^<]{5,}<\/title>/.test(h), u + ': sin <title>'); ok(/<meta name="description" content="[^"]{20,}"/.test(h), u + ': sin meta description');
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { const j = JSON.parse(m[1]); ok(!!(j['@context'] || j['@graph']), u + ': JSON-LD sin @context'); } catch (e) { ok(false, u + ': JSON-LD invalido (' + e.message.slice(0, 40) + ')'); } }
  const body = h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  if (/\/(datos|precios|regiones|regions|regioni)\//.test(u)) ok(body.trim().length > 200, u + ': landing con contenido vacio');
  const alts = [...h.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/g)].map(m => [m[1], m[2]]);
  if (alts.length) {
    const langs = alts.map(a => a[0]); ok(new Set(langs).size === langs.length, u + ': hreflang repetido');
    ok(alts.some(a => a[1] === u), u + ': hreflang no incluye su propia URL');
    for (const [, href] of alts) { if (href === u) continue; const ff = toFile(href); if (!(await exists(ff))) { ok(false, u + ': hreflang a pagina inexistente ' + href); continue; } const h2 = await readFile(ff, 'utf8'); ok(h2.includes('href="' + u + '"'), u + ': hreflang no reciproco con ' + href); }
  }
}
// toda landing local debe estar en el sitemap
for (const dir of ['datos', 'precios']) {
  const walk = async d => { for (const e of await readdir(path.join(root, d), { withFileTypes: true })) { const rel = d + '/' + e.name; if (e.isDirectory()) await walk(rel); else if (e.name === 'index.html') ok(locs.includes(ORIGIN + '/' + d + '/'), rel + ': landing fuera del sitemap'); } };
  await walk(dir);
}
for (const dir of ['regiones', 'en/regions', 'fr/regions', 'it/regioni']) {
  const walk = async d => { for (const e of await readdir(path.join(root, d), { withFileTypes: true })) { const rel = d + '/' + e.name; if (e.isDirectory()) await walk(rel); else if (e.name === 'index.html') ok(locs.includes(ORIGIN + '/' + d + '/'), rel + ': pagina de region fuera del sitemap'); } };
  await walk(dir);
}
console.log('SEO QA: ' + checks + ' comprobaciones, ' + locs.length + ' URLs');
if (errs.length) { console.error(errs.slice(0, 40).join('\n') + (errs.length > 40 ? '\n... +' + (errs.length - 40) : '')); process.exit(1); }
console.log('SEO QA OK');
