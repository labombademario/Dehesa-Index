#!/usr/bin/env node
/* Portadas estaticas por idioma: /en/, /fr/ y /it/ (la portada en espanol es / y se pinta con JS segun el idioma guardado, asi que una sola URL no puede llevar hreflang).
   Cada una trae titulo, descripcion y texto propios en su idioma, enlaces a las paginas de precios y de regiones de ese idioma (se leen de en/prices, fr/prix, it/prezzi,
   en/regions, fr/regions, it/regioni: titulo h1 de cada pagina) y un boton al rastreador interactivo que guarda el idioma elegido. Con hreflang reciproco entre las cuatro.
   index.html recibe los hreflang entre marcadores. Escribe el bloque home-pages de sitemap.xml. Uso: node scripts/build-home-pages.mjs (lo llama build-seo-pages.mjs) */
import fs from 'node:fs';
import { seoTitle, seoDesc, socialMeta } from './lib_seo.mjs';
const SITE = 'https://dehesaindex.com', read = f => fs.readFileSync(f, 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const L = {
  en: { dir: 'en', prices: 'en/prices', regions: 'en/regions', t: 'Farm prices and statistics for the US and Europe', h1: 'Agricultural prices and official statistics for the US, Europe, the UK and Canada',
    d: 'Track grain, dairy, livestock, feed and fertiliser prices and official farm statistics for the US, Europe, the UK and Canada, with the source and date of every figure.',
    p: ['Dehesa Index brings together agricultural prices and official statistics in one place: cereals and oilseeds, dairy, livestock and meat, feed, fertilisers and energy.', 'Every figure keeps its original value, unit, source and date. Series from different markets are shown side by side but are not converted or merged.'],
    open: 'Open the live tracker', pr: 'Prices by product', rg: 'Farm data by region', me: 'How the data is built', mu: 'metodologia.html' },
  fr: { dir: 'fr', prices: 'fr/prix', regions: 'fr/regions', t: 'Prix agricoles et statistiques : États-Unis et Europe', h1: 'Prix agricoles et statistiques officielles : États-Unis, Europe, Royaume-Uni et Canada',
    d: 'Suivez les prix des céréales, du lait, du bétail, des aliments et des engrais, et les statistiques agricoles officielles des États-Unis, d’Europe, du Royaume-Uni et du Canada.',
    p: ['Dehesa Index réunit au même endroit les prix agricoles et les statistiques officielles : céréales et oléagineux, produits laitiers, bétail et viande, aliments pour animaux, engrais et énergie.', 'Chaque chiffre garde sa valeur d’origine, son unité, sa source et sa date. Les séries de marchés différents sont présentées côte à côte, sans conversion ni fusion.'],
    open: 'Ouvrir le suivi interactif', pr: 'Prix par produit', rg: 'Données agricoles par région', me: 'Comment les données sont construites', mu: 'metodologia.html' },
  it: { dir: 'it', prices: 'it/prezzi', regions: 'it/regioni', t: 'Prezzi agricoli e statistiche: Stati Uniti ed Europa', h1: 'Prezzi agricoli e statistiche ufficiali: Stati Uniti, Europa, Regno Unito e Canada',
    d: 'Segui i prezzi di cereali, latte, bestiame, mangimi e fertilizzanti e le statistiche agricole ufficiali di Stati Uniti, Europa, Regno Unito e Canada, con fonte e data di ogni dato.',
    p: ['Dehesa Index riunisce in un unico posto prezzi agricoli e statistiche ufficiali: cereali e semi oleosi, latte e derivati, bestiame e carne, mangimi, fertilizzanti ed energia.', 'Ogni dato conserva valore originale, unità, fonte e data. Le serie di mercati diversi sono affiancate, senza conversioni né fusioni.'],
    open: 'Apri il monitor interattivo', pr: 'Prezzi per prodotto', rg: 'Dati agricoli per regione', me: 'Come sono costruiti i dati', mu: 'metodologia.html' },
};
const h1Of = f => { const m = /<h1[^>]*>([^<]+)<\/h1>/.exec(read(f)); return m ? m[1].trim() : null; };
const links = (dir, up, side) => fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory() && fs.existsSync(dir + '/' + e.name + '/index.html')).sort((a, b) => a.name.localeCompare(b.name)).map(e => ({ href: up + dir + '/' + e.name + '/', txt: ((h1Of(dir + '/' + e.name + '/index.html') || e.name).split(/\s*[:：]\s*/)[side === 'right' ? 1 : 0] || e.name).trim() }));
const urls = [], alt = ['es', 'en', 'fr', 'it'].map(l => '<link rel="alternate" hreflang="' + l + '" href="' + SITE + (l === 'es' ? '/' : '/' + l + '/') + '">').join('\n');
for (const lang of ['en', 'fr', 'it']) {
  const c = L[lang], up = '../', url = SITE + '/' + lang + '/', title = seoTitle(c.t), desc = seoDesc(c.d);
  const sect = (h, arr) => '<h2 style="font-size:18px;margin:26px 0 8px">' + esc(h) + '</h2>\n    <ul style="columns:2;column-gap:28px;padding-left:18px;line-height:1.7">' + arr.map(x => '<li><a href="' + x.href + '">' + esc(x.txt) + '</a></li>').join('') + '</ul>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, isPartOf: { '@id': SITE + '/#site' } }, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Dehesa Index', item: url }] }] };
  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${alt}
<link rel="alternate" hreflang="x-default" href="${SITE}/en/">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Dehesa Index">${socialMeta(lang)}
<link rel="icon" href="${up}assets/icon-192.png">
<link rel="stylesheet" href="${up}css/fonts.css">
<link rel="stylesheet" href="${up}css/style.css">
<script>try{localStorage.setItem('dehesaIndexLang','${lang}')}catch(e){}</script>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<div id="di-nav-root"></div>
<main class="di-page">
  <article class="di-main di-content-narrow">
    <div class="di-page-head"><h1>${esc(c.h1)}</h1></div>
    <p>${esc(c.p[0])}</p>
    <p>${esc(c.p[1])}</p>
    <p style="margin:16px 0"><a class="di-btn-gold-solid" data-open href="${up}index.html">${esc(c.open)} →</a> · <a href="${up}${c.mu}">${esc(c.me)}</a></p>
    ${sect(c.pr, links(c.prices, up))}
    ${sect(c.rg, links(c.regions, up, 'right'))}
  </article>
</main>
<div id="di-footer-root"></div>
<script src="${up}js/shared.js"></script>
<script>if(window.DehesaShared&&window.DehesaShared.init)window.DehesaShared.init('informacion');document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-open]');if(a){try{localStorage.setItem('dehesaIndexLang','${lang}')}catch(x){}}});</script>
</body>
</html>
`;
  fs.mkdirSync(lang, { recursive: true }); fs.writeFileSync(lang + '/index.html', html); urls.push(url);
}
// hreflang en la portada espanola (entre marcadores, idempotente)
let ix = read('index.html'); const A = '<!--home-hreflang:start-->', B = '<!--home-hreflang:end-->', blk = A + alt + '\n<link rel="alternate" hreflang="x-default" href="' + SITE + '/en/">' + B;
if (ix.includes(A)) ix = ix.replace(new RegExp(A + '[\\s\\S]*?' + B), blk); else ix = ix.replace('<link rel="canonical" href="https://dehesaindex.com/">', '<link rel="canonical" href="https://dehesaindex.com/">\n' + blk);
fs.writeFileSync('index.html', ix);
let sm = read('sitemap.xml'); const SA = '  <!-- home-pages:start -->', SB = '  <!-- home-pages:end -->', block = SA + '\n' + urls.map(u => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n' + SB;
if (sm.includes(SA)) sm = sm.replace(new RegExp(SA + '[\\s\\S]*?' + SB), block); else sm = sm.replace('</urlset>', block + '\n</urlset>');
fs.writeFileSync('sitemap.xml', sm);
console.log('portadas por idioma', urls.length);
