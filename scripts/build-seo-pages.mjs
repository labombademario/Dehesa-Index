#!/usr/bin/env node
/* SEO programatico: una pagina HTML estatica e indexable por pais x categoria de datos (es y en) en datos/<cc>-<grupo>/ y datos/en/<cc>-<grupo>/.
   Cada pagina trae contenido real en el HTML (tabla con ultimo valor, periodo y variacion de las series principales, fuente y licencia), canonical, hreflang, Open Graph,
   datos estructurados (Dataset + BreadcrumbList) y enlaces a la herramienta interactiva. Se regenera con los datos: node scripts/build-seo-pages.mjs
   Tambien reescribe el bloque marcado de sitemap.xml. */
import fs from 'node:fs';
import { seoTitle, seoDesc, socialMeta } from './lib_seo.mjs';
const read = f => fs.readFileSync(f, 'utf8');
const SITE = 'https://dehesaindex.com';
const FILES = ['country-stats', 'spain-stats', 'france-stats', 'france-crops-stats', 'france-extras-stats', 'france-campaign-stats', 'france-rnm-stats', 'france-dairy-stats', 'germany-stats', 'belgium-stats', 'austria-stats', 'uk-stats', 'portugal-stats', 'portugal-eurostat-stats', 'italy-eurostat-stats', 'eurostat-depth-stats', 'uk-trade-stats', 'chile-stats', 'argentina-stats', 'poland-eurostat-stats', 'eurostat-eu-stats', 'eurostat-euw-stats', 'us-ers-stats', 'france-insee-stats', 'eu-stocks-stats', 'spain-siega-stats', 'spain-hicp-stats', 'spain-oilseeds-stats', 'us-ttb-stats', 'abares-stats', 'switzerland-foag-stats', 'switzerland-bfs-stats', 'austria-balances-stats', 'us-weekly-stats', 'switzerland-meteo-stats', 'poland-stats', 'eu-gapfill-stats', 'us-nass-extra-stats', 'us-climate-stats', 'us-kcfed-stats', 'us-snotel-stats', 'canada-stats', 'us-stats', 'australia-trade-stats', 'eu-trade-stats', 'interest-rates-stats'];
const CN = { ES: ['España', 'Spain'], FR: ['Francia', 'France'], DE: ['Alemania', 'Germany'], BE: ['Bélgica', 'Belgium'], AT: ['Austria', 'Austria'], PT: ['Portugal', 'Portugal'], DK: ['Dinamarca', 'Denmark'], NL: ['Países Bajos', 'Netherlands'], CA: ['Canadá', 'Canada'], AU: ['Australia', 'Australia'], US: ['EE. UU.', 'United States'], EU: ['Unión Europea', 'European Union'] };
// etiquetas de grupo (es/en) tomadas de js/paises.js
const pl = read('js/paises.js').split('\n'), GL = {};
[9, 13].forEach((ix, i) => { const ln = pl[ix], seg = ln.slice(ln.indexOf("production: '")), re = /(\w+): '((?:[^'\\]|\\.)*)'/g; let m; while ((m = re.exec(seg))) { if (m[1] === 'latest') break; (GL[m[1]] = GL[m[1]] || [])[i] = m[2].replace(/\\'/g, '’'); } });
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const acc = {}, src = {}, filesOf = {};
for (const f of FILES) {
  let d; try { d = JSON.parse(read('data/' + f + '.json')); } catch (e) { continue; }
  for (const [cc, c] of Object.entries(d.countries || {})) { src[cc] = src[cc] || c.source; for (const s of c.series) { filesOf[cc + '|' + s.group + '|' + f] = 1; } for (const s of c.series) (acc[cc + '|' + s.group] = acc[cc + '|' + s.group] || []).push(s); }
}
const MON = { es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
function plabel(p, lang) { const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(p); if (!m) return p; return (m[3] ? +m[3] + ' ' : '') + MON[lang][+m[2] - 1] + ' ' + m[1]; }
function nf(v, lang) { const d = Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2; return v.toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }); }
const T = {
  es: { title: (c, g) => g + ' en ' + c + ': estadísticas oficiales', h1: (c, g) => g + ' — ' + c, desc: (c, g, n, last) => 'Estadísticas oficiales de ' + g.toLowerCase() + ' en ' + c + ': ' + n + ' series con datos hasta ' + last + '. Último valor, variación, fuente y licencia. Datos abiertos de Dehesa Index.', intro: (c, g, n, last, first) => 'Dehesa Index reúne ' + n + ' series de «' + g + '» de ' + c + ', con datos oficiales y su histórico (desde ' + first + ', último dato ' + last + '). Cada valor se muestra tal como lo publica la fuente, sin convertir ni recalcular.', th: ['Serie', 'Último dato', 'Periodo', 'Variación', 'Unidad'], src: 'Fuente', lic: 'Licencia', open: 'Explorar series, gráficos e histórico', other: 'Otras categorías de', same: 'Mismo tipo de dato en otros países', home: 'Inicio', data: 'Datos por país', upd: 'Datos actualizados', note: 'Cada fuente publica con su propia metodología y puede revisar valores pasados; consulta la metodología antes de comparar países.' },
  en: { title: (c, g) => g + ' in ' + c + ': official statistics', h1: (c, g) => g + ' — ' + c, desc: (c, g, n, last) => 'Official statistics on ' + g.toLowerCase() + ' in ' + c + ': ' + n + ' series with data up to ' + last + '. Latest value, change, source and licence. Open data by Dehesa Index.', intro: (c, g, n, last, first) => 'Dehesa Index brings together ' + n + ' “' + g + '” series for ' + c + ', with official data and its history (since ' + first + ', latest ' + last + '). Each value is shown as the source publishes it, not converted or recalculated.', th: ['Series', 'Latest', 'Period', 'Change', 'Unit'], src: 'Source', lic: 'Licence', open: 'Explore series, charts and history', other: 'Other categories for', same: 'Same data type in other countries', home: 'Home', data: 'Data by country', upd: 'Data updated', note: 'Each source publishes with its own methodology and may revise past values; read the methodology before comparing countries.' }
};
// Licencia como URL (Google la pide asi). Solo se enlaza cuando el texto de la fuente identifica la licencia sin ambiguedad; si no, se omite y el texto va en conditionsOfAccess.
function licenseUrl(t) {
  t = String(t || '');
  if (/CC BY 4\.0/.test(t)) return 'https://creativecommons.org/licenses/by/4.0/';
  if (/Datenlizenz Deutschland/.test(t)) return 'https://www.govdata.de/dl-de/by-2-0';
  if (/Statistics Canada Open Licence/.test(t)) return 'https://www.statcan.gc.ca/en/reference/licence';
  if (/Licence Ouverte 2\.0/.test(t)) return 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/';
  return null;
}

/* Lectura en prosa de cada ficha: frases que salen SOLO de las series de la tabla (direccion del ultimo cambio, mayor subida y caida,
   variacion interanual cuando hay el mismo periodo un ano antes, maximos o minimos de la serie). Nada se estima. */
const BT = {
  es: { head: 'En pocas palabras', dir: (u, d, f, n) => 'En su último dato, ' + u + ' de las ' + n + ' series ' + (u === 1 ? 'sube' : 'suben') + ', ' + d + ' ' + (d === 1 ? 'baja' : 'bajan') + (f ? ' y ' + f + ' no ' + (f === 1 ? 'cambia' : 'cambian') : '') + ' respecto a la observación anterior.',
    hiLo: (a, b) => (a ? 'La mayor subida es la de «' + a.l + '» (' + a.p + ', ' + a.d + ')' : '') + (a && b ? '; la mayor caída, ' : b ? 'La mayor caída es la de ' : '') + (b ? '«' + b.l + '» (' + b.p + ', ' + b.d + ')' : '') + '.',
    yoy: (n, a, b) => 'Frente al mismo periodo del año anterior (' + n + ' series comparables), ' + (a ? 'sube más «' + a.l + '» (' + a.p + ')' : '') + (a && b ? ' y ' : '') + (b ? 'baja más «' + b.l + '» (' + b.p + ')' : '') + '.',
    rec: (hi, lo) => (hi.length ? (hi.length === 1 ? '«' + hi[0].l + '» está en el máximo de toda su serie (desde ' + hi[0].f + ')' : hi.length + ' series están en el máximo de toda su serie') : '') + (hi.length && lo.length ? '; ' : '') + (lo.length ? (lo.length === 1 ? '«' + lo[0].l + '» está en su mínimo (desde ' + lo[0].f + ')' : lo.length + ' series están en su mínimo histórico') : '') + '.',
    src: 'Calculado con las series de la tabla; cada una con su propia frecuencia y unidad.' },
  en: { head: 'In brief', dir: (u, d, f, n) => 'In their latest reading, ' + u + ' of the ' + n + ' series rose, ' + d + ' fell' + (f ? ' and ' + f + ' were unchanged' : '') + ' against the previous observation.',
    hiLo: (a, b) => (a ? 'The largest rise is “' + a.l + '” (' + a.p + ', ' + a.d + ')' : '') + (a && b ? '; the largest fall, ' : b ? 'The largest fall is ' : '') + (b ? '“' + b.l + '” (' + b.p + ', ' + b.d + ')' : '') + '.',
    yoy: (n, a, b) => 'Against the same period a year earlier (' + n + ' comparable series), ' + (a ? '“' + a.l + '” rose most (' + a.p + ')' : '') + (a && b ? ' and ' : '') + (b ? '“' + b.l + '” fell most (' + b.p + ')' : '') + '.',
    rec: (hi, lo) => (hi.length ? (hi.length === 1 ? '“' + hi[0].l + '” is at the highest level in its whole series (since ' + hi[0].f + ')' : hi.length + ' series are at the highest level in their whole history') : '') + (hi.length && lo.length ? '; ' : '') + (lo.length ? (lo.length === 1 ? '“' + lo[0].l + '” is at its lowest (since ' + lo[0].f + ')' : lo.length + ' series are at their lowest on record') : '') + '.',
    src: 'Computed from the series in the table; each keeps its own frequency and unit.' }
};
function brief(top, lang) {
  const t = BT[lang], o = [], pc = v => (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), lang) + ' %';
  const ch = top.filter(s => s.changePct != null && isFinite(s.changePct));
  if (ch.length >= 2) {
    const u = ch.filter(s => s.changePct > 0).length, d = ch.filter(s => s.changePct < 0).length;
    o.push(t.dir(u, d, ch.length - u - d, ch.length));
    const mx = ch.reduce((m, s) => s.changePct > m.changePct ? s : m), mn = ch.reduce((m, s) => s.changePct < m.changePct ? s : m);
    const A = mx.changePct > 0 ? { l: mx.label, p: pc(mx.changePct), d: plabel(mx.latestPeriod, lang) } : null, B = mn.changePct < 0 ? { l: mn.label, p: pc(mn.changePct), d: plabel(mn.latestPeriod, lang) } : null;
    if (A || B) o.push(t.hiLo(A, B));
  }
  const yy = top.map(s => { const m = /^(\d{4})(.*)$/.exec(s.latestPeriod || ''); if (!m) return null; const pk = (+m[1] - 1) + m[2], p = (s.points || []).find(q => q[0] === pk); return p && p[1] ? { l: s.label, v: (s.latest / p[1] - 1) * 100 } : null; }).filter(z => z && isFinite(z.v));
  if (yy.length >= 2) { const a = yy.reduce((m, z) => z.v > m.v ? z : m), b = yy.reduce((m, z) => z.v < m.v ? z : m); o.push(t.yoy(yy.length, a.v > 0 ? { l: a.l, p: pc(a.v) } : null, b.v < 0 ? { l: b.l, p: pc(b.v) } : null)); }
  const hi = [], lo = [];
  for (const s of top) { const P = (s.points || []).filter(q => q[1] != null); if (P.length < 24 || !s.latest) continue; const vs = P.map(q => q[1]), f = plabel(P[0][0].length === 4 ? P[0][0] + '-01' : P[0][0], lang).replace(/^(\d+ )?\S+ (?=\d{4}$)/, lang === 'es' ? '' : '');
    if (s.latest >= Math.max(...vs) && s.latest > Math.min(...vs)) hi.push({ l: s.label, f: P[0][0].slice(0, 4) }); else if (s.latest <= Math.min(...vs) && s.latest < Math.max(...vs)) lo.push({ l: s.label, f: P[0][0].slice(0, 4) }); }
  if (hi.length || lo.length) o.push(t.rec(hi, lo));
  return o.map(x => x.replace(/^\./, '')).filter(x => x.length > 2);
}
function score(s) { return (s.points || []).length + (s.latestPeriod > '2025' ? 200 : 0); }
let n = 0; const urls = [];
for (const [k, list] of Object.entries(acc)) {
  const [cc, g] = k.split('|'); if (!CN[cc] || !GL[g] || list.length < 2) continue;
  for (const lang of ['es', 'en']) {
    const t = T[lang], ci = lang === 'es' ? 0 : 1, cname = CN[cc][ci], gname = GL[g][ci] || GL[g][0], slug = cc.toLowerCase() + '-' + g.replace(/_/g, '-');
    const dir = lang === 'es' ? 'datos/' + slug : 'datos/en/' + slug, up = lang === 'es' ? '../../' : '../../../', url = SITE + '/' + dir + '/', alt = lang === 'es' ? SITE + '/datos/en/' + slug + '/' : SITE + '/datos/' + slug + '/';
    const top = list.slice().sort((a, b) => score(b) - score(a)).slice(0, 15);
    const last = list.reduce((m, s) => s.latestPeriod > m ? s.latestPeriod : m, ''), first = list.reduce((m, s) => { const p = s.points[0][0]; return !m || p < m ? p : m; }, '');
    const rows = top.map(s => '<tr><td>' + esc(s.label) + '</td><td style="text-align:right"><b>' + nf(s.latest, lang) + '</b></td><td>' + esc(plabel(s.latestPeriod, lang)) + '</td><td style="text-align:right">' + (s.changePct == null ? '–' : (s.changePct > 0 ? '+' : s.changePct < 0 ? '−' : '') + nf(Math.abs(s.changePct), lang) + ' %') + '</td><td>' + esc(s.unit) + '</td></tr>').join('\n');
    const BR = brief(top, lang);
    const otherG = [...new Set(Object.keys(acc).filter(x => x.startsWith(cc + '|') && x !== k).map(x => x.split('|')[1]))].filter(x => GL[x] && acc[cc + '|' + x].length >= 2);
    const sameG = Object.keys(acc).filter(x => x.endsWith('|' + g) && x !== k && CN[x.split('|')[0]] && acc[x].length >= 2).map(x => x.split('|')[0]);
    const lk = (c2, g2) => (lang === 'es' ? '../' : '../') + c2.toLowerCase() + '-' + g2.replace(/_/g, '-') + '/';
    const title0 = t.title(cname, gname), title = seoTitle(title0.length <= 65 ? title0 : title0.replace(/:[^:]*$/, '')), desc = t.desc(cname, gname, list.length, plabel(last, lang));
    const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'Dataset', name: t.h1(cname, gname), description: desc, url, inLanguage: lang, creator: { '@type': 'Organization', name: 'Dehesa Index', url: SITE }, isBasedOn: src[cc] && src[cc].url, license: licenseUrl(src[cc] && src[cc].license) || undefined, conditionsOfAccess: (src[cc] && src[cc].license) || undefined, isAccessibleForFree: true, publisher: { '@type': 'Organization', name: 'Dehesa Index', url: SITE }, spatialCoverage: { '@type': 'Place', name: cname }, keywords: [gname, cname, lang === 'es' ? 'estadísticas agrarias' : 'agricultural statistics', lang === 'es' ? 'datos abiertos' : 'open data'], distribution: Object.keys(filesOf).filter(x => x.startsWith(cc + '|' + g + '|')).map(x => ({ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: SITE + '/data/' + x.split('|')[2] + '.json' })), temporalCoverage: first + '/' + last, variableMeasured: top.slice(0, 8).map(s => s.label) }, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: t.home, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: t.data, item: SITE + '/paises.html' }, { '@type': 'ListItem', position: 3, name: t.h1(cname, gname), item: url }] }] };
    const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(seoDesc(desc))}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="${lang}" href="${url}">
<link rel="alternate" hreflang="${lang === 'es' ? 'en' : 'es'}" href="${alt}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(seoDesc(desc))}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Dehesa Index">${socialMeta(lang)}
<link rel="icon" href="${up}assets/icon-192.png">
<link rel="stylesheet" href="${up}css/fonts.css">
<link rel="stylesheet" href="${up}css/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<div id="di-nav-root"></div>
<main class="di-page">
  <article class="di-main di-content-narrow">
    <div class="di-page-head"><h1>${esc(t.h1(cname, gname))}</h1><p>${esc(t.intro(cname, gname, list.length, plabel(last, lang), plabel(first.length === 4 ? first + '-01' : first, lang)))}</p></div>
${BR.length >= 2 ? '    <h2 style="font-size:17px;margin:18px 0 6px">' + esc(BT[lang].head) + '</h2>\n    <p>' + BR.map(esc).join(' ') + '</p>\n    <p class="di-movers-hint" style="margin:-4px 0 10px">' + esc(BT[lang].src) + '</p>\n' : ''}    <div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:620px;font-size:13.5px">
<thead><tr>${t.th.map((h, i) => '<th scope="col" style="text-align:' + (i === 1 || i === 3 ? 'right' : 'left') + ';padding:8px 6px;font-size:11px">' + esc(h) + '</th>').join('')}</tr></thead>
<tbody>
${rows}
</tbody></table></div>
    <p style="margin:14px 0"><a class="di-btn-gold-solid" href="${up}paises.html?c=${cc}&amp;g=${g}">${esc(t.open)} →</a></p>
    <p class="di-movers-hint">${esc(t.src)}: ${src[cc] ? '<a href="' + esc(src[cc].url) + '" rel="noopener">' + esc(src[cc].name) + '</a>' : ''} · ${esc(t.lic)}: ${esc((src[cc] && src[cc].license) || '')} · ${esc(t.upd)}: ${new Date().toISOString().slice(0, 10)}</p>
    <p class="di-movers-hint">${esc(t.note)} <a href="${up}metodologia.html">${lang === 'es' ? 'Metodología' : 'Methodology'}</a></p>
    <h2 style="font-size:17px;margin-top:22px">${esc(t.other)} ${esc(cname)}</h2>
    <p>${otherG.map(x => '<a href="' + lk(cc, x) + '">' + esc(GL[x][ci] || GL[x][0]) + '</a>').join(' · ')}</p>
    <h2 style="font-size:17px">${esc(t.same)}</h2>
    <p>${sameG.map(x => '<a href="' + lk(x, g) + '">' + esc(CN[x][ci]) + '</a>').join(' · ')}</p>
  </article>
</main>
<div id="di-footer-root"></div>
<script src="${up}js/shared.js?v=20260929-context-fix"></script>
<script>if(window.DehesaShared&&window.DehesaShared.init)window.DehesaShared.init('informacion');</script>
</body>
</html>
`;
    fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(dir + '/index.html', html); urls.push(url); n++;
  }
}
// sitemap: bloque marcado
let sm = read('sitemap.xml'); const A = '  <!-- seo-pages:start -->', B = '  <!-- seo-pages:end -->';
const block = A + '\n' + urls.sort().map(u => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n' + B;
if (sm.includes(A)) sm = sm.replace(new RegExp(A + '[\\s\\S]*?' + B), block); else sm = sm.replace('</urlset>', block + '\n</urlset>');
fs.writeFileSync('sitemap.xml', sm);
console.log('paginas SEO', n);
await import('./build-product-pages.mjs');  // paginas de producto (precios/<producto>/) con el ultimo precio real
await import('./build-region-pages.mjs');  // paginas por region (regiones/<pais>/<region>/) con las cifras reales de data/
await import('./build-home-pages.mjs');  // portadas /en/, /fr/, /it/ con hreflang a la portada
await import('./build-blog-pages.mjs');  // blog semanal: pagina estatica por edicion APROBADA (hoy ninguna)
await import('./build-crosslinks.mjs');  // enlaces internos entre tipos de pagina (datos, hubs de region, productos, portada)
await import('./seo-gate.mjs');  // puerta de calidad: noindex y fuera del sitemap las landings con pocos datos
await import('./sitemap-lastmod.mjs');  // lastmod solo cuando cambia el contenido de la pagina
