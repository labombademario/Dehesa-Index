#!/usr/bin/env node
/* Paginas estaticas e indexables de denominaciones de origen (vinos y quesos) por pais, en es, en, fr e it, mas un indice por idioma.
   URLs: es /denominaciones/<pais>/ · en /en/designations/<country>/ · fr /fr/appellations/<pays>/ · it /it/denominazioni/<paese>/ (hreflang reciproco + x-default).
   Todo sale de data/gi/<CC>.json (registro eAmbrosia de la Comision Europea, CC BY 4.0): nombre, DOP/IGP, año de proteccion y enlace al texto legal.
   Los nombres de pais, de data/app/v1/countries.json. Nada se estima. Se ejecuta desde scripts/build-seo-pages.mjs (antes de seo-gate.mjs) y reescribe
   el bloque marcado gi-pages de sitemap.xml. Uso: node scripts/build-gi-pages.mjs */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { seoTitle, seoDesc, socialMeta } from './lib_seo.mjs';
const read = f => fs.readFileSync(f, 'utf8'), SITE = 'https://dehesaindex.com';
const hashOf = f => { try { return createHash('sha256').update(read(f)).digest('hex').slice(0, 8); } catch (e) { return 'x'; } };
const BOOT_V = hashOf('js/boot.js'), SHARED_V = hashOf('js/shared.js');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const LG = ['es', 'en', 'fr', 'it'], LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
const ROOT = { es: 'denominaciones', en: 'en/designations', fr: 'fr/appellations', it: 'it/denominazioni' };
const TYPE = { PDO: { es: 'DOP', en: 'PDO', fr: 'AOP', it: 'DOP' }, PGI: { es: 'IGP', en: 'PGI', fr: 'IGP', it: 'IGP' }, GI: { es: 'IG', en: 'GI', fr: 'IG', it: 'IG' } };
const MIN_TOTAL = 5;   // paises con menos denominaciones no tienen pagina propia (siguen en la ficha interactiva)
const CN = {};
for (const c of JSON.parse(read('data/app/v1/countries.json')).countries) CN[c.code] = c.name;
const EXTRA = { CY: { es: 'Chipre', en: 'Cyprus', fr: 'Chypre', it: 'Cipro' }, LU: { es: 'Luxemburgo', en: 'Luxembourg', fr: 'Luxembourg', it: 'Lussemburgo' }, MT: { es: 'Malta', en: 'Malta', fr: 'Malte', it: 'Malta' } };
for (const [c, n] of Object.entries(EXTRA)) CN[c] = CN[c] || n;
const index = JSON.parse(read('data/gi/index.json'));
const nf = (n, lg) => n.toLocaleString(LOC[lg]);

const T = {
  es: {
    kindW: 'Vinos', kindC: 'Quesos', th: ['Denominación', 'Tipo', 'Protegida desde', 'Texto legal'], legal: 'Texto legal', hubSee: 'Denominaciones de origen por país',
    title: c => 'Denominaciones de origen de ' + c + ': vinos y quesos', h1: c => 'Denominaciones de origen de ' + c,
    lead: (c, n, w, wp, wg, k, kp, kg) => c + ' tiene ' + nf(n, 'es') + ' denominaciones de origen protegidas en la UE: ' + (w ? nf(w, 'es') + ' vinos (' + wp + ' DOP y ' + wg + ' IGP)' : '') + (w && k ? ' y ' : '') + (k ? nf(k, 'es') + ' quesos (' + kp + ' DOP y ' + kg + ' IGP)' : '') + '. Esta página las lista con su tipo, el año de protección y el texto legal de cada una en el registro eAmbrosia de la Comisión Europea.',
    head: 'En pocas palabras',
    first: (y, nm, k) => 'La más antigua de la lista es «' + nm + '» (protegida desde ' + y + ')' + (k > 1 ? '; ' + nf(k, 'es') + ' denominaciones comparten ese año' : '') + '.',
    recent: (k, y) => nf(k, 'es') + ' denominaciones se protegieron desde ' + y + '.',
    zones: z => 'Para ' + nf(z, 'es') + ' de ellas la ficha interactiva del país dibuja la zona de producción en un mapa; las zonas de las IGP y de algunas DOP van a nivel de unidades administrativas y pueden ser mayores que la real.',
    pdoPgi: 'DOP: vínculo más estrecho con la zona (queso: todo el proceso; vino: toda la uva). IGP: vínculo más flexible (queso: al menos una fase; vino: al menos el 85 % de la uva).',
    open: 'Ver el mapa de cada zona', src: 'Fuente', lic: 'Licencia', fuente: 'Comisión Europea, eAmbrosia (registro de indicaciones geográficas de la UE)', licT: 'CC BY 4.0, © Unión Europea', upd: 'Datos del registro a', note: 'Solo lo que publica el registro; no se añade nada.', metodo: 'metodologia.html', methodology: 'Metodología',
    others: 'Denominaciones de origen en otros países', hubTitle: 'Denominaciones de origen por país: vinos y quesos', hubH1: 'Denominaciones de origen por país',
    hubLead: (n, t) => 'Vinos y quesos con nombre protegido en la UE (DOP e IGP) en ' + n + ' países, ' + nf(t, 'es') + ' denominaciones en total, con su año de protección y el texto legal.', count: (w, k) => (w ? nf(w, 'es') + ' vinos' : '') + (w && k ? ' y ' : '') + (k ? nf(k, 'es') + ' quesos' : ''), ctry: 'País', profile: 'Ficha del país', home: 'Dehesa Index'
  },
  en: {
    kindW: 'Wines', kindC: 'Cheeses', th: ['Designation', 'Type', 'Protected since', 'Legal text'], legal: 'Legal text', hubSee: 'Designations of origin by country',
    title: c => 'Designations of origin in ' + c + ': wines and cheeses', h1: c => 'Designations of origin in ' + c,
    lead: (c, n, w, wp, wg, k, kp, kg) => c + ' has ' + nf(n, 'en') + ' designations of origin protected in the EU: ' + (w ? nf(w, 'en') + ' wines (' + wp + ' PDO and ' + wg + ' PGI)' : '') + (w && k ? ' and ' : '') + (k ? nf(k, 'en') + ' cheeses (' + kp + ' PDO and ' + kg + ' PGI)' : '') + '. This page lists them with their type, the year of protection and the legal text of each in the European Commission’s eAmbrosia register.',
    head: 'In brief',
    first: (y, nm, k) => 'The oldest on the list is “' + nm + '” (protected since ' + y + ')' + (k > 1 ? '; ' + nf(k, 'en') + ' designations share that year' : '') + '.',
    recent: (k, y) => nf(k, 'en') + ' designations have been protected since ' + y + '.',
    zones: z => 'For ' + nf(z, 'en') + ' of them the country’s interactive profile draws the production area on a map; PGI areas and some PDO areas are at the level of administrative units and may be larger than the real area.',
    pdoPgi: 'PDO: closest link to the area (cheese: the whole process; wine: all the grapes). PGI: looser link (cheese: at least one stage; wine: at least 85% of the grapes).',
    open: 'See the map of each area', src: 'Source', lic: 'Licence', fuente: 'European Commission, eAmbrosia (EU geographical indications register)', licT: 'CC BY 4.0, © European Union', upd: 'Register data as of', note: 'Only what the register publishes; nothing is added.', metodo: 'metodologia.html', methodology: 'Methodology',
    others: 'Designations of origin in other countries', hubTitle: 'Designations of origin by country: wines and cheeses', hubH1: 'Designations of origin by country',
    hubLead: (n, t) => 'Wines and cheeses with a name protected in the EU (PDO and PGI) in ' + n + ' countries, ' + nf(t, 'en') + ' designations in total, with their year of protection and legal text.', count: (w, k) => (w ? nf(w, 'en') + ' wines' : '') + (w && k ? ' and ' : '') + (k ? nf(k, 'en') + ' cheeses' : ''), ctry: 'Country', profile: 'Country profile', home: 'Dehesa Index'
  },
  fr: {
    kindW: 'Vins', kindC: 'Fromages', th: ['Appellation', 'Type', 'Protégée depuis', 'Texte légal'], legal: 'Texte légal', hubSee: 'Appellations d’origine par pays',
    title: c => 'Appellations d’origine : ' + c + ', vins et fromages', h1: c => 'Appellations d’origine : ' + c,
    lead: (c, n, w, wp, wg, k, kp, kg) => c + ' compte ' + nf(n, 'fr') + ' appellations d’origine protégées dans l’UE : ' + (w ? nf(w, 'fr') + ' vins (' + wp + ' AOP et ' + wg + ' IGP)' : '') + (w && k ? ' et ' : '') + (k ? nf(k, 'fr') + ' fromages (' + kp + ' AOP et ' + kg + ' IGP)' : '') + '. Cette page les liste avec leur type, l’année de protection et le texte légal de chacune dans le registre eAmbrosia de la Commission européenne.',
    head: 'En bref',
    first: (y, nm, k) => 'La plus ancienne de la liste est « ' + nm + ' » (protégée depuis ' + y + ')' + (k > 1 ? ' ; ' + nf(k, 'fr') + ' appellations partagent cette année' : '') + '.',
    recent: (k, y) => nf(k, 'fr') + ' appellations sont protégées depuis ' + y + '.',
    zones: z => 'Pour ' + nf(z, 'fr') + ' d’entre elles, la fiche interactive du pays dessine l’aire de production sur une carte ; les aires des IGP et de certaines AOP sont à l’échelle d’unités administratives et peuvent être plus grandes que l’aire réelle.',
    pdoPgi: 'AOP : lien le plus étroit avec la zone (fromage : tout le processus ; vin : tout le raisin). IGP : lien plus souple (fromage : au moins une étape ; vin : au moins 85 % du raisin).',
    open: 'Voir la carte de chaque aire', src: 'Source', lic: 'Licence', fuente: 'Commission européenne, eAmbrosia (registre des indications géographiques de l’UE)', licT: 'CC BY 4.0, © Union européenne', upd: 'Données du registre au', note: 'Uniquement ce que publie le registre ; rien n’est ajouté.', metodo: 'metodologia.html', methodology: 'Méthodologie',
    others: 'Appellations d’origine dans d’autres pays', hubTitle: 'Appellations d’origine par pays : vins et fromages', hubH1: 'Appellations d’origine par pays',
    hubLead: (n, t) => 'Vins et fromages au nom protégé dans l’UE (AOP et IGP) dans ' + n + ' pays, ' + nf(t, 'fr') + ' appellations au total, avec leur année de protection et leur texte légal.', count: (w, k) => (w ? nf(w, 'fr') + ' vins' : '') + (w && k ? ' et ' : '') + (k ? nf(k, 'fr') + ' fromages' : ''), ctry: 'Pays', profile: 'Fiche du pays', home: 'Dehesa Index'
  },
  it: {
    kindW: 'Vini', kindC: 'Formaggi', th: ['Denominazione', 'Tipo', 'Protetta dal', 'Testo legale'], legal: 'Testo legale', hubSee: 'Denominazioni di origine per paese',
    title: c => 'Denominazioni di origine: ' + c + ', vini e formaggi', h1: c => 'Denominazioni di origine: ' + c,
    lead: (c, n, w, wp, wg, k, kp, kg) => c + ' ha ' + nf(n, 'it') + ' denominazioni di origine protette nell’UE: ' + (w ? nf(w, 'it') + ' vini (' + wp + ' DOP e ' + wg + ' IGP)' : '') + (w && k ? ' e ' : '') + (k ? nf(k, 'it') + ' formaggi (' + kp + ' DOP e ' + kg + ' IGP)' : '') + '. Questa pagina le elenca con il tipo, l’anno di protezione e il testo legale di ciascuna nel registro eAmbrosia della Commissione europea.',
    head: 'In breve',
    first: (y, nm, k) => 'La più antica dell’elenco è «' + nm + '» (protetta dal ' + y + ')' + (k > 1 ? '; ' + nf(k, 'it') + ' denominazioni condividono quell’anno' : '') + '.',
    recent: (k, y) => nf(k, 'it') + ' denominazioni sono protette dal ' + y + ' in poi.',
    zones: z => 'Per ' + nf(z, 'it') + ' di esse la scheda interattiva del paese disegna la zona di produzione su una mappa; le zone delle IGP e di alcune DOP sono a livello di unità amministrative e possono essere più grandi di quella reale.',
    pdoPgi: 'DOP: legame più stretto con la zona (formaggio: tutto il processo; vino: tutta l’uva). IGP: legame più flessibile (formaggio: almeno una fase; vino: almeno l’85% dell’uva).',
    open: 'Vedi la mappa di ogni zona', src: 'Fonte', lic: 'Licenza', fuente: 'Commissione europea, eAmbrosia (registro delle indicazioni geografiche dell’UE)', licT: 'CC BY 4.0, © Unione europea', upd: 'Dati del registro al', note: 'Solo ciò che pubblica il registro; non si aggiunge nulla.', metodo: 'metodologia.html', methodology: 'Metodologia',
    others: 'Denominazioni di origine in altri paesi', hubTitle: 'Denominazioni di origine per paese: vini e formaggi', hubH1: 'Denominazioni di origine per paese',
    hubLead: (n, t) => 'Vini e formaggi con nome protetto nell’UE (DOP e IGP) in ' + n + ' paesi, ' + nf(t, 'it') + ' denominazioni in totale, con anno di protezione e testo legale.', count: (w, k) => (w ? nf(w, 'it') + ' vini' : '') + (w && k ? ' e ' : '') + (k ? nf(k, 'it') + ' formaggi' : ''), ctry: 'Paese', profile: 'Scheda del paese', home: 'Dehesa Index'
  }
};

const countries = [];
for (const [cc, v] of Object.entries(index.countries)) {
  if (v.wine + v.cheese < MIN_TOTAL || !CN[cc]) continue;
  let d; try { d = JSON.parse(read('data/gi/' + cc + '.json')); } catch (e) { continue; }
  let geo = {}; try { geo = JSON.parse(read('data/gi/' + cc + '-geo.json')).areas || {}; } catch (e) { /* sin zonas */ }
  const wine = d.wine || [], cheese = d.cheese || [];
  if (wine.length + cheese.length < MIN_TOTAL) continue;
  countries.push({ cc, wine, cheese, zones: [...wine, ...cheese].filter(g => g.f && geo[g.f]).length, gen: String(d.generatedAt || '').slice(0, 10), slug: Object.fromEntries(LG.map(l => [l, slugify(CN[cc][l])])) });
}
countries.sort((a, b) => (b.wine.length + b.cheese.length) - (a.wine.length + a.cheese.length));
const genAll = countries.reduce((m, c) => c.gen > m ? c.gen : m, '');

const urlC = (lg, c) => SITE + '/' + ROOT[lg] + '/' + (c ? c.slug[lg] + '/' : '');
const upOf = (lg, leaf) => '../'.repeat((lg === 'es' ? 1 : 2) + (leaf ? 1 : 0));
const alts = fn => LG.slice().sort().map(l => '<link rel="alternate" hreflang="' + l + '" href="' + fn(l) + '">').join('\n') + '\n<link rel="alternate" hreflang="x-default" href="' + fn('en') + '">';
const head = (lg, title, desc, url, al, ld, up) => `<!doctype html>
<html lang="${lg}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(seoDesc(desc))}">
<link rel="canonical" href="${url}">
${al}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(seoDesc(desc))}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Dehesa Index">${socialMeta(lg)}
<link rel="icon" href="${up}assets/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="${up}assets/icon-192.png">
<link rel="stylesheet" href="${up}css/fonts.css">
<link rel="stylesheet" href="${up}css/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<div id="di-nav-root"></div>
<main class="di-page">
  <article class="di-main di-content-narrow">
`;
const foot = (lg, up) => `  </article>
</main>
<div id="di-footer-root"></div>
<script src="${up}js/boot.js?v=${BOOT_V}" data-lang="${lg}"></script>
<script src="${up}js/shared.js?v=${SHARED_V}"></script>
<script src="${up}js/boot.js?v=${BOOT_V}" data-init="informacion"></script>
</body>
</html>
`;
const crumbs = (lg, items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] })) });
const nm = g => (g.n || []).join(' / ');
const table = (lg, t, list) => '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-bottom:12px"><table style="border-collapse:collapse;width:100%;min-width:420px;font-size:14px"><thead><tr>' + t.th.map((h, i) => '<th scope="col" style="text-align:' + (i === 2 ? 'right' : 'left') + ';padding:8px 6px;font-size:11px">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
  list.map(g => '<tr><th scope="row" style="text-align:left;padding:8px 6px;font-weight:600">' + esc(nm(g)) + '</th><td style="padding:8px 6px">' + esc((TYPE[g.t] || TYPE.GI)[lg]) + '</td><td style="text-align:right;padding:8px 6px">' + (g.y || '–') + '</td><td style="padding:8px 6px">' + (g.u && /^https:\/\//.test(g.u) ? '<a href="' + esc(g.u) + '" rel="noopener">' + esc(t.legal) + '</a>' : '–') + '</td></tr>').join('') + '</tbody></table></div>';
const cnt = (list, ty) => list.filter(g => g.t === ty).length;

const out = [], urls = [];
for (const lg of LG) {
  const t = T[lg];
  for (const c of countries) {
    const cname = CN[c.cc][lg], url = urlC(lg, c), up = upOf(lg, true), all = [...c.wine, ...c.cheese], n = all.length;
    const sortL = a => a.slice().sort((x, y) => nm(x).localeCompare(nm(y), LOC[lg]));
    const desc = t.lead(cname, n, c.wine.length, cnt(c.wine, 'PDO'), cnt(c.wine, 'PGI'), c.cheese.length, cnt(c.cheese, 'PDO'), cnt(c.cheese, 'PGI'));
    const title = seoTitle(t.title(cname));
    const ld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Dataset', name: t.h1(cname), description: desc, url, inLanguage: lg, isAccessibleForFree: true, license: 'https://creativecommons.org/licenses/by/4.0/', dateModified: c.gen || genAll, creator: { '@type': 'Organization', name: 'Dehesa Index', url: SITE }, isBasedOn: 'https://ec.europa.eu/agriculture/eambrosia/geographical-indications-register/', spatialCoverage: { '@type': 'Place', name: cname } },
      crumbs(lg, [[t.home, SITE + '/'], [t.hubSee, urlC(lg)], [cname, url]])] };
    let h = head(lg, title, desc, url, alts(l2 => urlC(l2, c)), ld, up);
    h += '    <div class="di-page-head"><h1>' + esc(t.h1(cname)) + '</h1><p>' + esc(desc) + '</p></div>\n';
    // en pocas palabras: solo cifras del propio registro
    const ys = all.filter(g => g.y).map(g => g.y), B = [];
    if (ys.length >= 3) {
      const y0 = Math.min(...ys), first = all.filter(g => g.y === y0);
      B.push(t.first(y0, nm(sortL(first)[0]), first.length));
      const r = ys.filter(y => y >= 2010).length; if (r >= 2) B.push(t.recent(r, 2010));
    }
    if (c.zones >= 3) B.push(t.zones(c.zones));
    if (B.length >= 2) h += '    <h2 style="font-size:17px;margin:18px 0 6px">' + esc(t.head) + '</h2>\n    <p>' + B.map(esc).join(' ') + '</p>\n';
    h += '    <p class="di-movers-hint" style="margin:-4px 0 8px">' + esc(t.pdoPgi) + '</p>\n';
    if (c.wine.length) h += '    <h2 style="font-size:17px;margin:18px 0 6px">' + esc(t.kindW) + ' (' + nf(c.wine.length, lg) + ')</h2>\n    ' + table(lg, t, sortL(c.wine)) + '\n';
    if (c.cheese.length) h += '    <h2 style="font-size:17px;margin:18px 0 6px">' + esc(t.kindC) + ' (' + nf(c.cheese.length, lg) + ')</h2>\n    ' + table(lg, t, sortL(c.cheese)) + '\n';
    h += '    <p style="margin:16px 0"><a class="di-btn-gold-solid" href="' + up + 'paises.html?c=' + c.cc + '">' + esc(t.open + ' · ' + cname) + ' →</a></p>\n';
    h += '    <p class="di-movers-hint">' + esc(t.src) + ': <a href="https://ec.europa.eu/agriculture/eambrosia/geographical-indications-register/" rel="noopener">' + esc(t.fuente) + '</a> · ' + esc(t.lic) + ': ' + esc(t.licT) + ' · ' + esc(t.upd) + ' ' + (c.gen || genAll) + '. ' + esc(t.note) + ' <a href="' + up + t.metodo + '">' + esc(t.methodology) + '</a></p>\n';
    h += '    <h2 style="font-size:17px;margin-top:22px">' + esc(t.others) + '</h2>\n    <p>' + countries.filter(x => x !== c).map(x => '<a href="../' + x.slug[lg] + '/">' + esc(CN[x.cc][lg]) + '</a>').join(' · ') + ' · <a href="../">' + esc(t.hubSee) + '</a></p>\n';
    h += foot(lg, up);
    out.push([url.replace(SITE + '/', ''), h]); urls.push(url);
  }
  // indice del idioma
  const url = urlC(lg), up = upOf(lg, false), total = countries.reduce((s, c) => s + c.wine.length + c.cheese.length, 0), desc = t.hubLead(countries.length, total), title = seoTitle(t.hubTitle);
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', name: t.hubH1, description: desc, url, inLanguage: lg, hasPart: countries.map(c => ({ '@type': 'WebPage', name: t.h1(CN[c.cc][lg]), url: urlC(lg, c) })) }, crumbs(lg, [[t.home, SITE + '/'], [t.hubH1, url]])] };
  let h = head(lg, title, desc, url, alts(l2 => urlC(l2)), ld, up);
  h += '    <div class="di-page-head"><h1>' + esc(t.hubH1) + '</h1><p>' + esc(desc) + '</p></div>\n    <ul>\n' + countries.map(c => '      <li><a href="' + c.slug[lg] + '/">' + esc(CN[c.cc][lg]) + '</a> — ' + esc(t.count(c.wine.length, c.cheese.length)) + '</li>').join('\n') + '\n    </ul>\n';
  h += '    <p class="di-movers-hint">' + esc(t.src) + ': <a href="https://ec.europa.eu/agriculture/eambrosia/geographical-indications-register/" rel="noopener">' + esc(t.fuente) + '</a> · ' + esc(t.lic) + ': ' + esc(t.licT) + ' · <a href="' + up + t.metodo + '">' + esc(t.methodology) + '</a></p>\n' + foot(lg, up);
  out.push([url.replace(SITE + '/', ''), h]); urls.push(url);
}
for (const lg of LG) fs.rmSync(ROOT[lg], { recursive: true, force: true });
for (const [p, h] of out) { fs.mkdirSync(p, { recursive: true }); fs.writeFileSync(p + 'index.html', h); }
let sm = read('sitemap.xml'); const A = '  <!-- gi-pages:start -->', Z = '  <!-- gi-pages:end -->';
const block = A + '\n' + urls.sort().map(u => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n' + Z;
if (sm.includes(A)) sm = sm.replace(new RegExp(A + '[\\s\\S]*?' + Z), block); else sm = sm.replace('</urlset>', block + '\n</urlset>');
fs.writeFileSync('sitemap.xml', sm);
console.log('paginas de denominaciones', urls.length, '(' + countries.length + ' paises x 4 idiomas + 4 indices)');
