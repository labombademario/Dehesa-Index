#!/usr/bin/env node
/* Paginas estaticas e indexables del blog semanal: una por edicion APROBADA y por idioma (blog/<semana>/, en/blog/, fr/blog/, it/blog/).
   Solo salen de ediciones con status APPROVED y editorial.reviewedBy rellenado por una persona (build-blog-editions.py las crea siempre como DRAFT).
   Con todas en DRAFT no genera nada: el blog.html dinamico sigue siendo la vista de uso y no se indexan resumenes sin revisar.
   Texto: el markdown de la edicion tal cual (cifras y titulares archivados; sin prosa inventada). Escribe el bloque blog-pages de sitemap.xml
   y la lista de ediciones aprobadas de blog.html. Uso: node scripts/build-blog-pages.mjs  (lo llama build-seo-pages.mjs) */
import fs from 'node:fs';
import { seoTitle, seoDesc, socialMeta } from './lib_seo.mjs';
const SITE = 'https://dehesaindex.com', LANGS = ['es', 'en', 'fr', 'it'];
const DIR = { es: 'blog', en: 'en/blog', fr: 'fr/blog', it: 'it/blog' };
const UI = { es: ['Blog semanal', 'Todas las ediciones', 'Datos y herramientas'], en: ['Weekly blog', 'All editions', 'Data and tools'], fr: ['Blog hebdomadaire', 'Toutes les éditions', 'Données et outils'], it: ['Blog settimanale', 'Tutte le edizioni', 'Dati e strumenti'] };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = s => esc(s).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, t, u) => '<a href="' + u + '" rel="noopener nofollow">' + t + '</a>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
function md(src) {
  const out = []; let list = false;
  for (const raw of src.split('\n')) {
    const l = raw.trimEnd(), li = /^[-*] (.*)$/.exec(l);
    if (list && !li) { out.push('</ul>'); list = false; }
    if (li) { if (!list) { out.push('<ul>'); list = true; } out.push('<li>' + inline(li[1]) + '</li>'); }
    else if (/^## /.test(l)) out.push('<h2 style="font-size:19px;margin:22px 0 8px">' + inline(l.slice(3)) + '</h2>');
    else if (/^# /.test(l)) continue;     // el h1 va aparte
    else if (l.trim()) out.push('<p>' + inline(l) + '</p>');
  }
  if (list) out.push('</ul>'); return out.join('\n');
}
const read = f => fs.readFileSync(f, 'utf8');
const eds = fs.existsSync('data/blog/editions') ? fs.readdirSync('data/blog/editions').filter(f => /^\d{4}-W\d{2}\.json$/.test(f)).sort().reverse().map(f => JSON.parse(read('data/blog/editions/' + f))) : [];
const ok = eds.filter(e => e.status === 'APPROVED' && e.editorial && e.editorial.reviewedBy);
const urls = [];
for (const e of ok) for (const lang of LANGS) {
  const L = e.languages && e.languages[lang]; if (!L || !L.markdown) continue;
  const dir = DIR[lang] + '/' + e.week, up = '../'.repeat(dir.split('/').length), url = SITE + '/' + dir + '/', title = seoTitle(L.title), desc = seoDesc(L.excerpt || L.title);
  const alts = LANGS.filter(x => e.languages[x] && e.languages[x].markdown).map(x => '<link rel="alternate" hreflang="' + x + '" href="' + SITE + '/' + DIR[x] + '/' + e.week + '/">').join('\n');
  const pub = (e.editorial.reviewedAt || e.to || '').slice(0, 10);
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'Article', headline: L.title, description: desc, inLanguage: lang, datePublished: pub, dateModified: pub, mainEntityOfPage: url, author: { '@type': 'Organization', name: 'Dehesa Index', url: SITE }, publisher: { '@type': 'Organization', name: 'Dehesa Index', url: SITE } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Dehesa Index', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: UI[lang][0], item: SITE + '/blog.html' }, { '@type': 'ListItem', position: 3, name: L.title, item: url }] }] };
  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${alts}
<link rel="alternate" hreflang="x-default" href="${SITE}/en/blog/${e.week}/">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Dehesa Index">${socialMeta(lang)}
<link rel="icon" href="${up}assets/icon-192.png">
<link rel="stylesheet" href="${up}css/fonts.css">
<link rel="stylesheet" href="${up}css/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<div id="di-nav-root"></div>
<main class="di-page">
  <article class="di-main di-content-narrow">
    <div class="di-page-head"><h1>${esc(L.title)}</h1></div>
    ${md(L.markdown)}
    <p style="margin:18px 0"><a href="${up}blog.html#${e.week}">${esc(UI[lang][1])} →</a> · <a href="${up}catalogo.html">${esc(UI[lang][2])} →</a></p>
  </article>
</main>
<div id="di-footer-root"></div>
<script src="${up}js/shared.js"></script>
<script>if(window.DehesaShared&&window.DehesaShared.init)window.DehesaShared.init('informacion');</script>
</body>
</html>
`;
  fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(dir + '/index.html', html); urls.push(url);
}
let sm = read('sitemap.xml'); const A = '  <!-- blog-pages:start -->', B = '  <!-- blog-pages:end -->';
const block = A + '\n' + urls.sort().map(u => '  <url><loc>' + u + '</loc></url>').join('\n') + (urls.length ? '\n' : '') + B;
if (sm.includes(A)) sm = sm.replace(new RegExp(A + '[\\s\\S]*?' + B), block); else sm = sm.replace('</urlset>', block + '\n</urlset>');
fs.writeFileSync('sitemap.xml', sm);
// blog.html: enlaces rastreables a las ediciones aprobadas (el resto de la pagina se pinta con JS)
let bl = read('blog.html'); const BA = '<!--blog-editions:start-->', BB = '<!--blog-editions:end-->';
const lst = ok.length ? '<nav aria-label="Blog"><ul>' + ok.map(e => '<li><a href="blog/' + e.week + '/">' + esc(e.languages.es.title) + '</a></li>').join('') + '</ul></nav>' : '';
if (bl.includes(BA)) { const nb = bl.replace(new RegExp(BA + '[\\s\\S]*?' + BB), BA + lst + BB); if (nb !== bl) fs.writeFileSync('blog.html', nb); }
console.log('paginas de blog', urls.length, '(ediciones aprobadas: ' + ok.length + ' de ' + eds.length + ')');
