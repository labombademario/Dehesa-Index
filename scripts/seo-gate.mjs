#!/usr/bin/env node
/* Puerta de calidad SEO (ultimo paso de build-seo-pages.mjs, antes de sitemap-lastmod.mjs).
   Recorre las landings generadas que estan en los bloques marcados de sitemap.xml:
   - Hoja con pocos datos (menos de GATE.minRows filas de datos o GATE.minWords palabras): se le pone <meta name="robots" content="noindex,follow">
     y se quita del sitemap. Sigue accesible y enlazada.
   - Hub (sin tabla de datos): solo se indexa si enlaza al menos GATE.minHubLinks hojas indexables.
   - Si una pagina que tenia noindex ya cumple, se le quita y vuelve al sitemap en la siguiente regeneracion.
   Idempotente. Uso: node scripts/seo-gate.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { GATE, NOINDEX, pageQuality, isThinLeaf } from './lib_seo.mjs';
const SITE = 'https://dehesaindex.com';
const MARK = /(  <!-- (seo-pages|product-pages|region-pages):start -->\n)([\s\S]*?)(\n  <!-- \2:end -->)/g;
const fileOf = u => { const rel = u.replace(SITE + '/', ''); return rel === '' || rel.endsWith('/') ? rel + 'index.html' : rel; };
let sm = fs.readFileSync('sitemap.xml', 'utf8');
const urls = []; sm.replace(MARK, (all, a, name, body) => { body.split('\n').forEach(l => { const m = /<loc>([^<]+)<\/loc>/.exec(l); if (m) urls.push(m[1]); }); return all; });
const info = new Map();
for (const u of urls) { let h; try { h = fs.readFileSync(fileOf(u), 'utf8'); } catch (e) { continue; } info.set(u, { h, q: pageQuality(h) }); }
const leaf = u => info.get(u).q.rows > 0;
const ok = new Set(); for (const [u, i] of info) if (leaf(u) && !isThinLeaf(i.q, u)) ok.add(u);
for (const [u, i] of info) {       // hubs: enlaces relativos a hojas indexables
  if (leaf(u)) continue;
  const base = new URL(u), art = (/<article[\s\S]*?<\/article>/.exec(i.h) || [i.h])[0];
  const n = new Set([...art.matchAll(/href="([^"#?]+)"/g)].map(m => new URL(m[1], base).href).filter(x => ok.has(x))).size;
  if (n >= GATE.minHubLinks) ok.add(u);
}
const thin = [];
for (const [u, i] of info) {
  const f = fileOf(u), has = i.h.includes(NOINDEX), want = !ok.has(u);
  if (want) thin.push(u);
  if (want && !has) fs.writeFileSync(f, i.h.replace(/(<meta name="viewport"[^>]*>)/, '$1' + NOINDEX));
  if (!want && has) fs.writeFileSync(f, i.h.split(NOINDEX).join(''));
}
const drop = new Set(thin);
sm = sm.replace(MARK, (all, a, name, body, z) => a + body.split('\n').filter(l => { const m = /<loc>([^<]+)<\/loc>/.exec(l); return !(m && drop.has(m[1])); }).join('\n') + z);
fs.writeFileSync('sitemap.xml', sm);
console.log('puerta SEO: ' + ok.size + ' paginas indexables, ' + thin.length + ' con noindex y fuera del sitemap (hojas: menos de ' + GATE.minRows + ' filas de datos o ' + GATE.minWords + ' palabras; producto: menos de ' + GATE.product.minRows + ' o ' + GATE.product.minWords + ')');
