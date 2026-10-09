#!/usr/bin/env node
/* Enlaces internos entre tipos de pagina generada (se ejecuta tras los generadores y antes de la puerta de calidad). Antes solo se enlazaban entre si paginas del mismo tipo.
   Inserta, justo antes de </article> y entre marcadores (idempotente), un bloque "relacionado" con enlaces reales del mismo idioma:
   - pagina de datos (datos/<pais>-<grupo>/): sus datos por region del pais (hub) + precios de referencia
   - hub de regiones de un pais: estadisticas oficiales del pais (solo es/en, que son los idiomas de datos/) + precios de referencia
   - pagina de producto: datos agrarios de los paises principales (hubs)
   Los enlaces se leen de lo que existe en disco (nada inventado) y los emparejamientos de idioma, de los hreflang de la propia pagina. */
import fs from 'node:fs';
const SITE = 'https://dehesaindex.com', read = f => fs.readFileSync(f, 'utf8');
const A = '<!--xlinks:start-->', B = '<!--xlinks:end-->';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const HUBDIR = { es: 'regiones', en: 'en/regions', fr: 'fr/regions', it: 'it/regioni' }, PRDIR = { es: 'precios', en: 'en/prices', fr: 'fr/prix', it: 'it/prezzi' };
const HUB_ES = { au: 'australia', at: 'austria', be: 'belgica', ca: 'canada', dk: 'dinamarca', es: 'espana', us: 'estados-unidos', fr: 'francia', it: 'italia', nl: 'paises-bajos', pl: 'polonia', de: 'alemania' };
const TOP_PRICES_ES = ['trigo', 'maiz', 'leche', 'cerdo', 'vaca', 'cebada', 'urea', 'colza'];
const TOPHUB = ['us', 'es', 'fr', 'de', 'ca', 'nl', 'it', 'pl'];
const TX = {
  es: { pr: 'Precios de referencia', hubOf: c => 'Datos agrarios por región: ' + c, stat: c => 'Estadísticas oficiales de ' + c, cty: 'Datos agrarios por país' },
  en: { pr: 'Reference prices', hubOf: c => 'Farm data by region: ' + c, stat: c => 'Official statistics for ' + c, cty: 'Farm data by country' },
  fr: { pr: 'Prix de référence', hubOf: c => 'Données agricoles par région : ' + c, stat: c => 'Statistiques officielles : ' + c, cty: 'Données agricoles par pays' },
  it: { pr: 'Prezzi di riferimento', hubOf: c => 'Dati agricoli per regione: ' + c, stat: c => 'Statistiche ufficiali: ' + c, cty: 'Dati agricoli per paese' },
};
const alts = h => Object.fromEntries([...h.matchAll(/<link[^>]+hreflang="(es|en|fr|it)"[^>]+href="([^"]+)"/g)].map(m => [m[1], m[2].replace(SITE + '/', '')]));
const h1 = f => { const m = /<h1[^>]*>([^<]+)<\/h1>/.exec(read(f)); return m ? m[1].trim() : ''; };
const right = s => (s.split(/\s*[:：]\s*/)[1] || s).trim(), left = s => s.split(/\s*[:：]\s*/)[0].trim(), dash = s => (s.split(/\s+—\s+/)[1] || s).trim();
// hubs[lang][cc] = {dir, name}
const hubs = { es: {}, en: {}, fr: {}, it: {} };
for (const [cc, slug] of Object.entries(HUB_ES)) { const f = 'regiones/' + slug + '/index.html'; if (!fs.existsSync(f)) continue; const al = alts(read(f)); for (const l of ['es', 'en', 'fr', 'it']) { const d = (al[l] || '').replace(/index\.html$/, ''); if (d && fs.existsSync(d + 'index.html')) hubs[l][cc] = { dir: d, name: right(h1(d + 'index.html')) }; } }
const prices = { es: [], en: [], fr: [], it: [] };
for (const slug of TOP_PRICES_ES) { const f = 'precios/' + slug + '/index.html'; if (!fs.existsSync(f)) continue; const al = alts(read(f)); for (const l of ['es', 'en', 'fr', 'it']) { const d = (al[l] || '').replace(/index\.html$/, ''); if (d && fs.existsSync(d + 'index.html')) prices[l].push({ dir: d, name: left(h1(d + 'index.html')) }); } }
const rel = (from, to) => { const up = '../'.repeat(from.replace(/\/$/, '').split('/').length); return up + to; };
const li = (from, arr) => arr.map(x => '<a href="' + rel(from, x.dir) + '">' + esc(x.name) + '</a>').join(' · ');
const block = (title, from, arr) => arr.length ? '<h2 style="font-size:17px;margin-top:22px">' + esc(title) + '</h2>\n    <p>' + li(from, arr) + '</p>\n    ' : '';
function put(file, html) { let h = read(file); const b = A + html + B; const n = h.includes(A) ? h.replace(new RegExp(A + '[\\s\\S]*?' + B), b) : h.replace('</article>', b + '\n  </article>'); if (n !== h) fs.writeFileSync(file, n); }
// datos por pais disponibles (es y en)
const datosOf = {}; for (const l of ['es', 'en']) { const base = l === 'es' ? 'datos' : 'datos/en'; datosOf[l] = {}; for (const e of fs.readdirSync(base, { withFileTypes: true })) { if (!e.isDirectory() || e.name === 'en' || !fs.existsSync(base + '/' + e.name + '/index.html')) continue; const cc = e.name.split('-')[0]; (datosOf[l][cc] = datosOf[l][cc] || []).push({ dir: base + '/' + e.name + '/', name: dash(h1(base + '/' + e.name + '/index.html')) , full: h1(base + '/' + e.name + '/index.html') }); } }
let n = 0;
for (const l of ['es', 'en']) {            // datos
  const base = l === 'es' ? 'datos' : 'datos/en', t = TX[l];
  for (const e of fs.readdirSync(base, { withFileTypes: true })) { if (!e.isDirectory() || e.name === 'en') continue; const f = base + '/' + e.name + '/index.html'; if (!fs.existsSync(f)) continue; const cc = e.name.split('-')[0], hub = hubs[l][cc], from = base + '/' + e.name + '/';
    put(f, '\n    ' + block(hub ? t.hubOf(hub.name) : '', from, hub ? [{ dir: hub.dir, name: hub.name }] : []) + block(t.pr, from, prices[l])); n++; }
}
for (const l of ['es', 'en', 'fr', 'it']) {   // hubs
  for (const [cc, hub] of Object.entries(hubs[l])) { const f = hub.dir + 'index.html', t = TX[l], ds = (datosOf[l] || {})[cc] || [];
    put(f, '\n    ' + block(t.stat(hub.name), hub.dir, ds.map(x => ({ dir: x.dir, name: x.full }))) + block(t.pr, hub.dir, prices[l])); n++; }
}
for (const l of ['es', 'en', 'fr', 'it']) {   // productos
  const t = TX[l]; for (const e of fs.readdirSync(PRDIR[l], { withFileTypes: true })) { if (!e.isDirectory()) continue; const f = PRDIR[l] + '/' + e.name + '/index.html'; if (!fs.existsSync(f)) continue; const from = PRDIR[l] + '/' + e.name + '/';
    put(f, '\n    ' + block(t.cty, from, TOPHUB.map(cc => hubs[l][cc]).filter(Boolean).map(h => ({ dir: h.dir, name: h.name })))); n++; }
}
// portada en espanol: enlaces rastreables a los paises y a las portadas por idioma (los precios ya estan en index.html) (el resto de la portada se pinta con JS)
{ const f = 'index.html', h = read(f), SA = '<!--home-xlinks:start-->', SB = '<!--home-xlinks:end-->';
  const hs = Object.values(hubs.es).map(x => ({ dir: x.dir, name: x.name }));
  const html = SA + '<h2 style="font-size:16px;margin:20px 0 8px">Datos agrarios por país</h2>\n      <p class="di-movers-hint" style="line-height:1.9">' + li('', hs) + '</p>\n      <p class="di-movers-hint">English: <a href="en/">Agricultural prices and statistics</a> · Français : <a href="fr/">Prix et statistiques agricoles</a> · Italiano: <a href="it/">Prezzi e statistiche agricole</a></p>' + SB;
  if (h.includes(SA)) fs.writeFileSync(f, h.replace(new RegExp(SA + '[\\s\\S]*?' + SB), html)); else console.log('index.html: falta el marcador home-xlinks'); }
console.log('enlaces cruzados en', n, 'paginas');
