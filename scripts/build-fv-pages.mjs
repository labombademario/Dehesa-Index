#!/usr/bin/env node
/* SEO de fruta, hortaliza y fruto seco: una pagina estatica e indexable por producto (75) e idioma (es, en, fr, it), mas un indice por idioma.
   Lee data/fv-products.json (generado por build-fv-products.py): ultimo precio semanal por pais (Comision Europea), precio percibido en Espana (MAPA),
   precio anual al productor (USDA NASS, Eurostat, KSH), precio mayorista del Reino Unido (Defra; serie en data/uk-fv-stats.json) y superficie/produccion (MAPA).
   Todo es dato ya publicado, con fecha y fuente con enlace; nada se estima. Si un producto no tiene ningun dato reciente, la pagina se genera igual pero la puerta
   de calidad (seo-gate.mjs) la deja con noindex y fuera del sitemap.
   URLs: es /precios/frutas-hortalizas/<id>/ · en /en/prices/fruit-vegetables/<slug>/ · fr /fr/prix/fruits-legumes/<slug>/ · it /it/prezzi/frutta-verdura/<slug>/
   (se evita /precios/<x>/ porque build-product-pages.mjs limpia del sitemap las entradas manuales de ese formato).
   Se ejecuta desde scripts/build-seo-pages.mjs y reescribe el bloque marcado fv-pages de sitemap.xml. */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { seoTitle, seoDesc, socialMeta } from './lib_seo.mjs';
const read = f => fs.readFileSync(f, 'utf8');
const hash = f => { try { return createHash('sha256').update(fs.readFileSync(new URL(f, import.meta.url))).digest('hex').slice(0, 8); } catch (e) { return 'x'; } };
const BOOT_V = hash('../js/boot.js'), SHARED_V = hash('../js/shared.js');
const SITE = 'https://dehesaindex.com';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DAY = 864e5, today = new Date().toISOString().slice(0, 10), nowT = Date.parse(today);
const doc = JSON.parse(read('data/fv-products.json')), PR = doc.products;
let cite = {}; try { cite = JSON.parse(read('data/views/license-cite.json')).sources || {}; } catch (e) { /* sin citas */ }
// nombres de pais, fase y variante: los mismos que usa la ficha interactiva (js/producto-hortaliza.js)
const js = read('js/producto-hortaliza.js'), grab = n => { const m = new RegExp('var ' + n + ' = (\\{[\\s\\S]*?\\});\\n').exec(js); if (!m) throw new Error('no encuentro ' + n); return (new Function('return ' + m[1]))(); };
const CN = grab('CN'), STG = grab('STG'), VAR = grab('VAR');
CN.US = ['EE. UU.', 'United States', 'États-Unis', 'Stati Uniti']; CN.UK = ['Reino Unido', 'United Kingdom', 'Royaume-Uni', 'Regno Unito'];
const LI = { es: 0, en: 1, fr: 2, it: 3 };
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const L = {
  es: { root: 'precios/frutas-hortalizas', up: '../../../', locale: 'es-ES', mon: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'],
    title: (n, h) => 'Precio de ' + n.toLowerCase() + ': ' + h, h1: n => 'Precio de ' + n.toLowerCase() + ': últimos datos oficiales',
    lead: (n, h, d) => 'Último precio de ' + n.toLowerCase() + ' publicado por fuentes oficiales: ' + h + '. Dato más reciente: ' + d + '. Cada cifra va con su fecha, unidad y fuente.',
    desc: (n, h) => 'Precio de ' + n.toLowerCase() + ': ' + h + '. Datos oficiales con fecha, unidad y fuente con enlace. ',
    th: ['Mercado', 'Precio', 'Unidad', 'Periodo', 'Variación', 'Hace un año', 'Fuente'], old: 'dato antiguo', prev: 'frente al dato anterior',
    note: 'Los precios de mercados distintos no son directamente comparables: cambian la unidad, la moneda, el punto de la cadena (finca, almacén, mayorista) y la calidad. Cifras tal como las publica cada fuente, sin conversión ni estimaciones.',
    meth: 'Metodología', gen: 'Página generada el', cta: 'Ver gráficas, comparación entre países y estacionalidad →', faqH: 'Preguntas frecuentes', othersH: 'Otros productos', all: 'Todas las frutas, hortalizas y frutos secos', home: 'precios.html', metodo: 'metodologia.html', prices: 'Precios',
    q: (n, m) => '¿Cuál es el precio de ' + n.toLowerCase() + ' en ' + m + '?', a: (v, d, ch) => v + ', dato de ' + d + (ch ? ', ' + ch + ' frente al dato anterior' : '') + '.',
    qc: n => '¿Cuánto ' + n.toLowerCase() + ' se produce en España?', ac: (a, p, y, st) => 'En la campaña ' + y + ' (' + st + ') la superficie fue de ' + a + ' ha y la producción de ' + p + ' t, según el MAPA.', prov: 'provisional', def: 'definitiva',
    what: {"eu": "Precio semanal de la Comisión Europea: lo declaran los Estados miembros por tipo de producto y fase de venta (en finca, salida de almacén o compra del minorista), en euros por kilo y sin IVA.", "perc": "Precio percibido por el agricultor en España (MAPA): media mensual de lo que cobra el productor por el producto en finca, en euros por kilo.", "ann": "Precio anual al productor: media del año de lo que recibe el agricultor, en la unidad y moneda de cada fuente oficial.", "uk": "Precio mayorista del Reino Unido (Defra): media semanal de venta al por mayor de producto cultivado en el país, en libras por kilo.", "h": "Qué mide cada precio"},
    src: { eu: 'Comisión Europea, portal agroalimentario', perc: 'MAPA, precios percibidos', usda_nass: 'USDA NASS', eurostat: 'Eurostat', ksh_hu: 'KSH (Hungría)', defra: 'Defra (Reino Unido)' },
    stage: 'fase', kind: { eu: 'precio semanal', perc: 'precio percibido por el agricultor (mensual)', ann: 'precio anual al productor', uk: 'precio mayorista (semanal)' },
    idxT: 'Precios de frutas, hortalizas y frutos secos: datos oficiales', veg: 'Hortalizas', fruit: 'Frutas', nut: 'Frutos secos' },
  en: { root: 'en/prices/fruit-vegetables', up: '../../../../', locale: 'en-GB', mon: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    title: (n, h) => n + ' price: ' + h, h1: n => n + ' price: latest official data',
    lead: (n, h, d) => 'Latest ' + n.toLowerCase() + ' price published by official sources: ' + h + '. Most recent data point: ' + d + '. Every figure comes with its date, unit and source.',
    desc: (n, h) => n + ' price: ' + h + '. Official data with date, unit and linked source. ',
    th: ['Market', 'Price', 'Unit', 'Period', 'Change', 'A year ago', 'Source'], old: 'old figure', prev: 'versus the previous data point',
    note: 'Prices from different markets are not directly comparable: unit, currency, point in the supply chain (farm, packing house, wholesale) and quality all differ. Figures are shown as each source publishes them, without conversion or estimates.',
    meth: 'Methodology', gen: 'Page generated on', cta: 'See charts, country comparison and seasonality →', faqH: 'Frequently asked questions', othersH: 'Other products', all: 'All fruit, vegetables and nuts', home: 'precios.html', metodo: 'metodologia.html', prices: 'Prices',
    q: (n, m) => 'What is the price of ' + n.toLowerCase() + ' in ' + m + '?', a: (v, d, ch) => v + ', data for ' + d + (ch ? ', ' + ch + ' versus the previous data point' : '') + '.',
    qc: n => 'How much ' + n.toLowerCase() + ' is produced in Spain?', ac: (a, p, y, st) => 'In the ' + y + ' season (' + st + ') the area was ' + a + ' ha and production ' + p + ' t, according to MAPA.', prov: 'provisional', def: 'final',
    what: {"eu": "European Commission weekly price: reported by member states by product type and stage of sale (farm-gate, packing-house or retailer buying price), in euro per kilo, excluding VAT.", "perc": "Price received by farmers in Spain (MAPA): monthly average of what the grower is paid for the product at the farm, in euro per kilo.", "ann": "Annual producer price: yearly average of what the farmer receives, in the unit and currency of each official source.", "uk": "UK wholesale price (Defra): weekly average wholesale selling price of home-grown produce, in pounds per kilo.", "h": "What each price measures"},
    src: { eu: 'European Commission, agri-food data portal', perc: 'MAPA, prices received', usda_nass: 'USDA NASS', eurostat: 'Eurostat', ksh_hu: 'KSH (Hungary)', defra: 'Defra (UK)' },
    kind: { eu: 'weekly price', perc: 'price received by farmers (monthly)', ann: 'annual producer price', uk: 'wholesale price (weekly)' },
    idxT: 'Fruit, vegetable and nut prices: official data', veg: 'Vegetables', fruit: 'Fruit', nut: 'Nuts' },
  fr: { root: 'fr/prix/fruits-legumes', up: '../../../../', locale: 'fr-FR', mon: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    title: (n, h) => n + ' : prix ' + h, h1: n => n + ' : prix, dernières données officielles',
    lead: (n, h, d) => 'Dernier prix publié par des sources officielles pour « ' + n.toLowerCase() + ' » : ' + h + '. Donnée la plus récente : ' + d + '. Chaque chiffre est accompagné de sa date, de son unité et de sa source.',
    desc: (n, h) => n + ' : prix ' + h + '. Données officielles avec date, unité et source liée. ',
    th: ['Marché', 'Prix', 'Unité', 'Période', 'Variation', 'Il y a un an', 'Source'], old: 'donnée ancienne', prev: 'par rapport à la donnée précédente',
    note: 'Les prix de marchés différents ne sont pas directement comparables : l’unité, la devise, le stade de la chaîne (ferme, station de conditionnement, gros) et la qualité changent. Chiffres tels que publiés par chaque source, sans conversion ni estimation.',
    meth: 'Méthodologie', gen: 'Page générée le', cta: 'Voir les graphiques, la comparaison entre pays et la saisonnalité →', faqH: 'Questions fréquentes', othersH: 'Autres produits', all: 'Tous les fruits, légumes et fruits à coque', home: 'precios.html', metodo: 'metodologia.html', prices: 'Prix',
    q: (n, m) => 'Quel est le prix de « ' + n.toLowerCase() + ' » en ' + m + ' ?', a: (v, d, ch) => v + ', donnée de ' + d + (ch ? ', ' + ch + ' par rapport à la donnée précédente' : '') + '.',
    qc: n => 'Quelle quantité de « ' + n.toLowerCase() + ' » est produite en Espagne ?', ac: (a, p, y, st) => 'Pour la campagne ' + y + ' (' + st + '), la surface était de ' + a + ' ha et la production de ' + p + ' t, selon le MAPA.', prov: 'provisoire', def: 'définitive',
    what: {"eu": "Prix hebdomadaire de la Commission européenne : déclaré par les États membres par type de produit et stade de vente (à la ferme, sortie de station ou achat du détaillant), en euros par kilo, hors TVA.", "perc": "Prix perçu par l’agriculteur en Espagne (MAPA) : moyenne mensuelle de ce que touche le producteur à la ferme, en euros par kilo.", "ann": "Prix annuel au producteur : moyenne de l’année de ce que reçoit l’agriculteur, dans l’unité et la devise de chaque source officielle.", "uk": "Prix de gros au Royaume-Uni (Defra) : moyenne hebdomadaire du prix de vente en gros des produits cultivés dans le pays, en livres par kilo.", "h": "Ce que mesure chaque prix"},
    src: { eu: 'Commission européenne, portail agroalimentaire', perc: 'MAPA, prix perçus', usda_nass: 'USDA NASS', eurostat: 'Eurostat', ksh_hu: 'KSH (Hongrie)', defra: 'Defra (Royaume-Uni)' },
    kind: { eu: 'prix hebdomadaire', perc: 'prix perçu par l’agriculteur (mensuel)', ann: 'prix annuel au producteur', uk: 'prix de gros (hebdomadaire)' },
    idxT: 'Prix des fruits, légumes et fruits à coque : données officielles', veg: 'Légumes', fruit: 'Fruits', nut: 'Fruits à coque' },
  it: { root: 'it/prezzi/frutta-verdura', up: '../../../../', locale: 'it-IT', mon: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
    title: (n, h) => n + ': prezzo ' + h, h1: n => n + ': prezzo, ultimi dati ufficiali',
    lead: (n, h, d) => 'Ultimo prezzo pubblicato da fonti ufficiali per «' + n.toLowerCase() + '»: ' + h + '. Dato più recente: ' + d + '. Ogni cifra riporta data, unità e fonte.',
    desc: (n, h) => n + ': prezzo ' + h + '. Dati ufficiali con data, unità e fonte con link. ',
    th: ['Mercato', 'Prezzo', 'Unità', 'Periodo', 'Variazione', 'Un anno fa', 'Fonte'], old: 'dato vecchio', prev: 'rispetto al dato precedente',
    note: 'I prezzi di mercati diversi non sono direttamente confrontabili: cambiano unità, valuta, punto della filiera (azienda, centro di confezionamento, ingrosso) e qualità. Cifre come le pubblica ogni fonte, senza conversione né stime.',
    meth: 'Metodologia', gen: 'Pagina generata il', cta: 'Vedi grafici, confronto tra paesi e stagionalità →', faqH: 'Domande frequenti', othersH: 'Altri prodotti', all: 'Tutta la frutta, la verdura e la frutta secca', home: 'precios.html', metodo: 'metodologia.html', prices: 'Prezzi',
    q: (n, m) => 'Qual è il prezzo di «' + n.toLowerCase() + '» in ' + m + '?', a: (v, d, ch) => v + ', dato di ' + d + (ch ? ', ' + ch + ' rispetto al dato precedente' : '') + '.',
    qc: n => 'Quanta «' + n.toLowerCase() + '» si produce in Spagna?', ac: (a, p, y, st) => 'Nella campagna ' + y + ' (' + st + ') la superficie era di ' + a + ' ha e la produzione di ' + p + ' t, secondo il MAPA.', prov: 'provvisorio', def: 'definitivo',
    what: {"eu": "Prezzo settimanale della Commissione europea: dichiarato dagli Stati membri per tipo di prodotto e fase di vendita (in azienda, uscita magazzino o acquisto del dettagliante), in euro al chilo, IVA esclusa.", "perc": "Prezzo percepito dall’agricoltore in Spagna (MAPA): media mensile di quanto incassa il produttore in azienda, in euro al chilo.", "ann": "Prezzo annuale al produttore: media dell’anno di quanto riceve l’agricoltore, nell’unità e nella valuta di ciascuna fonte ufficiale.", "uk": "Prezzo all’ingrosso nel Regno Unito (Defra): media settimanale del prezzo di vendita all’ingrosso dei prodotti coltivati nel paese, in sterline al chilo.", "h": "Cosa misura ogni prezzo"},
    src: { eu: 'Commissione europea, portale agroalimentare', perc: 'MAPA, prezzi percepiti', usda_nass: 'USDA NASS', eurostat: 'Eurostat', ksh_hu: 'KSH (Ungheria)', defra: 'Defra (Regno Unito)' },
    kind: { eu: 'prezzo settimanale', perc: 'prezzo percepito dall’agricoltore (mensile)', ann: 'prezzo annuale al produttore', uk: 'prezzo all’ingrosso (settimanale)' },
    idxT: 'Prezzi di frutta, verdura e frutta secca: dati ufficiali', veg: 'Verdura', fruit: 'Frutta', nut: 'Frutta secca' }
};
const LG = Object.keys(L);
// slugs por idioma (es = id); si dos productos coinciden en un idioma, se anade el id
const SL = {}; for (const lg of LG) { const seen = {}; SL[lg] = {}; for (const p of PR) { let s = lg === 'es' ? p.id : slug(p.name[lg]); if (seen[s]) s += '-' + slug(p.id); seen[s] = 1; SL[lg][p.id] = s; } }
const urlOf = (lg, id) => SITE + '/' + L[lg].root + '/' + SL[lg][id] + '/', hubUrl = lg => SITE + '/' + L[lg].root + '/';
const alts = f => LG.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + f(l) + '">').join('\n') + '\n<link rel="alternate" hreflang="x-default" href="' + f('en') + '">';
const days = iso => { const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(iso || ''); return m ? (nowT - Date.UTC(+m[1], +m[2] - 1, +(m[3] || 15))) / DAY : 1e9; };
let uk = {}; try { for (const s of JSON.parse(read('data/uk-fv-stats.json')).countries.UK.series) uk[s.id] = s; } catch (e) { /* sin Reino Unido */ }
const FRESH = 400, OLD = 70;   // mas de 400 dias: no se muestra; mas de 70: se rotula «dato antiguo»
const urls = [];
const hasData = p => !!((p.eu && p.eu.latest && Object.values(p.eu.latest).some(e => typeof e.v === 'number' && days(e.d) <= FRESH)) || (p.perc && typeof p.perc.v === 'number' && days(p.perc.m) <= FRESH) ||
  (p.annual || []).some(a => a.pts && a.pts.length && typeof a.pts[a.pts.length - 1][1] === 'number') || (p.uk || []).some(u => uk[u.id] && typeof uk[u.id].latest === 'number' && days(uk[u.id].latestPeriod) <= FRESH));
const PRD = PR.filter(hasData), skipped = PR.filter(p => !hasData(p)).map(p => p.id);
for (const lg of LG) for (const id of skipped) fs.rmSync(L[lg].root + '/' + SL[lg][id], { recursive: true, force: true });   // sin dato reciente: no hay pagina (y no queda una vieja)
const pageHtml = (lg, o) => `<!doctype html>
<html lang="${lg}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${o.url}">
${alts(o.alt)}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${o.url}"><meta property="og:site_name" content="Dehesa Index">${socialMeta(lg)}
<link rel="icon" href="${L[lg].up}assets/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="${L[lg].up}assets/icon-192.png">
<link rel="stylesheet" href="${L[lg].up}css/fonts.css">
<link rel="stylesheet" href="${L[lg].up}css/style.css">
<script type="application/ld+json">${JSON.stringify(o.ld)}</script>
</head>
<body>
<div id="di-nav-root"></div>
<main class="di-page">
  <article class="di-main di-content-narrow">
${o.body}
  </article>
</main>
<div id="di-footer-root"></div>
<script src="${L[lg].up}js/boot.js?v=${BOOT_V}" data-lang="${lg}"></script>
<script src="${L[lg].up}js/shared.js?v=${SHARED_V}"></script>
<script src="${L[lg].up}js/boot.js?v=${BOOT_V}" data-init="informacion"></script>
</body>
</html>
`;
const write = (url, html) => { const dir = url.replace(SITE + '/', ''); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(dir + 'index.html', html); urls.push(url); };
for (const lg of LG) {
  const T = L[lg], li = LI[lg], up = T.up;
  const per = p => { const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(p || ''); return m ? (m[3] ? +m[3] + ' ' : '') + T.mon[+m[2] - 1] + ' ' + m[1] : String(p || ''); };
  const nf = v => v.toLocaleString(T.locale, { minimumFractionDigits: Math.abs(v) >= 100 ? 0 : 2, maximumFractionDigits: Math.abs(v) >= 100 ? 1 : 2 });
  const pct = v => v == null || !isFinite(v) ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(T.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
  const cn = cc => (CN[cc] || [cc, cc, cc, cc])[li];
  const srcLink = k => { const c = { eu: 'eu_agrifood', perc: 'mapa_es', usda_nass: 'usda_nass', eurostat: 'eurostat', ksh_hu: 'ksh_hu', defra: 'defra' }[k], u = (cite[c] || {}).url; return u ? '<a href="' + esc(u) + '" rel="noopener">' + esc(T.src[k]) + '</a>' : esc(T.src[k]); };
  for (const p of PRD) {
    const n = p.name[lg], rows = [];   // fila: { place, v, cur, unit, d, ch, ago, src, kind, t }
    if (p.eu && p.eu.latest) for (const cc of Object.keys(p.eu.latest)) { const e = p.eu.latest[cc]; if (typeof e.v !== 'number' || days(e.d) > FRESH) continue;
      const vr = (VAR[e.variant] || [])[li] || e.variant || '', st = (STG[e.stage] || [])[li] || e.stage || '';
      rows.push({ k: 'eu', cc, place: cn(cc) + (vr || st ? ' · ' + [vr, st].filter(Boolean).join(', ') : ''), short: cn(cc), v: e.v, unit: '€/kg', d: e.d, ch: typeof e.p === 'number' && e.p > 0 ? (e.v / e.p - 1) * 100 : null, ago: typeof e.y === 'number' ? e.y : null, src: 'eu' }); }
    rows.sort((a, b) => (b.cc === 'ES') - (a.cc === 'ES') || (a.d < b.d ? 1 : a.d > b.d ? -1 : a.short.localeCompare(b.short, T.locale)));
    rows.splice(14);
    if (p.perc && typeof p.perc.v === 'number' && days(p.perc.m) <= FRESH) rows.push({ k: 'perc', place: cn('ES') + ' · ' + T.kind.perc, short: cn('ES'), v: p.perc.v, unit: '€/kg', d: p.perc.m, ch: null, ago: typeof p.perc.y === 'number' ? p.perc.y : null, src: 'perc' });
    for (const a of p.annual || []) { const pts = a.pts || [], l = pts[pts.length - 1], pv = pts[pts.length - 2]; if (!l || typeof l[1] !== 'number') continue; const lab = a.label && a.label[lg] ? ' · ' + a.label[lg] : '';
      rows.push({ k: 'ann', place: cn(a.cc) + ' · ' + T.kind.ann + lab, short: cn(a.cc), v: l[1], unit: a.unit, d: String(l[0]), ch: pv && pv[1] > 0 ? (l[1] / pv[1] - 1) * 100 : null, ago: pv ? pv[1] : null, src: a.src, annual: true }); }
    for (const u of p.uk || []) { const s = uk[u.id]; if (!s || typeof s.latest !== 'number' || days(s.latestPeriod) > FRESH) continue; const lab = u.label && u.label[lg] ? ' · ' + u.label[lg] : '';
      const pts = s.points || [], yt = Date.parse(s.latestPeriod) - 365 * DAY; let ag = null; for (const q of pts) if (Math.abs(Date.parse(q[0]) - yt) <= 10 * DAY && (!ag || Math.abs(Date.parse(q[0]) - yt) < Math.abs(Date.parse(ag[0]) - yt))) ag = q;
      rows.push({ k: 'uk', place: cn('UK') + ' · ' + T.kind.uk + lab, short: cn('UK'), v: s.latest, unit: 'GBP/kg', d: s.latestPeriod, ch: typeof s.changePct === 'number' ? s.changePct : null, ago: ag ? ag[1] : null, src: 'defra' }); }
    // titular: España (UE) si hay dato, si no el dato mas reciente
    const head0 = rows.find(r => r.k === 'eu' && r.cc === 'ES') || rows.slice().sort((a, b) => a.d < b.d ? 1 : -1)[0];
    const fm = r => nf(r.v) + ' ' + r.unit.replace('/', ' /').replace(' /', '/'), hd = head0 ? head0.short + ' ' + fm(head0) : '';
    const title = seoTitle(T.title(n, hd || '')), crop = p.crops && p.crops.area && p.crops.production ? p.crops : null;
    const latestD = rows.reduce((m, r) => r.d > m ? r.d : m, '');
    const dsc = seoDesc(T.desc(n, hd) + (rows.length > 1 ? rows.slice(0, 3).filter(r => r !== head0).map(r => r.short + ' ' + fm(r)).join(' · ') : ''));
    const tdc = 'padding:8px 6px', th = (t, i) => '<th scope="col" style="text-align:' + (i === 1 || i === 4 || i === 5 ? 'right' : 'left') + ';' + tdc + ';font-size:11px">' + esc(t) + '</th>';
    const trs = rows.map(r => '<tr><th scope="row" style="text-align:left;' + tdc + '">' + esc(r.place) + '</th><td style="text-align:right;' + tdc + '"><b>' + esc(nf(r.v)) + '</b></td><td style="' + tdc + '">' + esc(r.unit) + '</td><td style="' + tdc + '">' + esc(per(r.d) + (days(r.d) > OLD && !r.annual ? ' (' + T.old + ')' : '')) + '</td><td style="text-align:right;' + tdc + '">' + esc(pct(r.ch)) + '</td><td style="text-align:right;' + tdc + '">' + (r.ago != null ? esc(nf(r.ago)) : '–') + '</td><td style="' + tdc + '">' + srcLink(r.src) + '</td></tr>').join('\n');
    const faq = rows.map(r => '<h3 style="font-size:15px;margin:14px 0 4px">' + esc(T.q(n, r.place.split(' · ')[0] + (r.k === 'eu' ? '' : ', ' + T.kind[r.k]))) + '</h3><p>' + esc(T.a(nf(r.v) + ' ' + r.unit, per(r.d), r.ch != null ? pct(r.ch) : '')) + '</p>').join('\n') +
      (crop ? '\n<h3 style="font-size:15px;margin:14px 0 4px">' + esc(T.qc(n)) + '</h3><p>' + esc(T.ac(Math.round(crop.area).toLocaleString(T.locale), Math.round(crop.production).toLocaleString(T.locale), crop.campaign, crop.status === 'provisional' ? T.prov : T.def)) + '</p>' : '');
    const kinds = ['eu', 'perc', 'ann', 'uk'].filter(k => rows.some(r => r.k === k)), what = kinds.length ? '    <h2 style="font-size:17px;margin-top:22px">' + esc(T.what.h) + '</h2>\n    <ul>' + kinds.map(k => '<li>' + esc(T.what[k]) + '</li>').join('') + '</ul>\n' : '';
    const sib = PRD.filter(x => x.group === p.group && x.id !== p.id).map(x => '<a href="../' + SL[lg][x.id] + '/">' + esc(x.name[lg]) + '</a>').join(' · ');
    const url = urlOf(lg, p.id), alt = l => urlOf(l, p.id), cur = rows.length ? rows : null;
    const ld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Dataset', name: T.title(n, '').replace(/[:：]\s*$/, ''), description: dsc, url, inLanguage: lg, isAccessibleForFree: true, dateModified: today, temporalCoverage: latestD, creator: { '@type': 'Organization', name: 'Dehesa Index', url: SITE }, isBasedOn: [...new Set(rows.map(r => ({ eu: 'eu_agrifood', perc: 'mapa_es', usda_nass: 'usda_nass', eurostat: 'eurostat', ksh_hu: 'ksh_hu', defra: 'defra' }[r.src])).map(c => (cite[c] || {}).url).filter(Boolean))] },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Dehesa Index', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: T.prices, item: SITE + '/precios.html' }, { '@type': 'ListItem', position: 3, name: T.all, item: hubUrl(lg) }, { '@type': 'ListItem', position: 4, name: n, item: url }] }] };
    const body = `    <div class="di-page-head">
      <h1>${esc(T.h1(n))}</h1>
      <p>${esc(cur ? T.lead(n, hd, per(latestD)) : T.cta)}</p>
    </div>
${cur ? `    <div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:640px;font-size:14px">
<thead><tr>${T.th.map(th).join('')}</tr></thead>
<tbody>
${trs}
</tbody></table></div>` : ''}
    <p style="margin:14px 0"><a class="di-btn-gold-solid" href="${up}producto.html?p=${esc(p.id)}">${esc(T.cta)}</a></p>
    <p class="di-movers-hint">${esc(T.note)} <a href="${up}${T.metodo}">${esc(T.meth)}</a> · ${esc(T.gen)} ${esc(today)}.</p>
${what}    <h2 style="font-size:17px;margin-top:22px">${esc(T.faqH)}</h2>
${faq}
    <h2 style="font-size:17px;margin-top:22px">${esc(T.othersH)}</h2>
    <p>${sib} · <a href="../">${esc(T.all)}</a></p>`;
    write(url, pageHtml(lg, { title, desc: dsc, url, alt, ld, body }));
  }
  // indice por idioma
  const G = ['veg', 'fruit', 'nut'], hurl = hubUrl(lg);
  const hbody = `    <div class="di-page-head">
      <h1>${esc(T.all)}</h1>
      <p>${esc(T.idxT)}</p>
    </div>
${G.map(g => '    <h2 style="font-size:17px;margin-top:22px">' + esc(T[g]) + '</h2>\n    <p>' + PRD.filter(x => x.group === g).map(x => '<a href="' + SL[lg][x.id] + '/">' + esc((x.emoji ? x.emoji + ' ' : '') + x.name[lg]) + '</a>').join(' · ') + '</p>').join('\n')}
    <p class="di-movers-hint"><a href="${up}${T.home}">${esc(T.prices)}</a> · <a href="${up}${T.metodo}">${esc(T.meth)}</a> · ${esc(T.gen)} ${esc(today)}.</p>`;
  const hdesc = seoDesc(T.idxT + ' (' + PRD.length + '). ' + T.note);
  write(hurl, pageHtml(lg, { title: seoTitle(T.idxT), desc: hdesc, url: hurl, alt: hubUrl, ld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: T.all, url: hurl, inLanguage: lg }, body: hbody }));
}
let sm = read('sitemap.xml'); const A = '  <!-- fv-pages:start -->', B = '  <!-- fv-pages:end -->';
const block = A + '\n' + urls.sort().map(u => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n' + B;
if (sm.includes(A)) sm = sm.replace(new RegExp(A + '[\\s\\S]*?' + B), block); else sm = sm.replace('</urlset>', block + '\n</urlset>');
fs.writeFileSync('sitemap.xml', sm);
console.log('paginas de fruta/hortaliza/fruto seco', urls.length, skipped.length ? '(sin dato reciente, sin pagina: ' + skipped.join(', ') + ')' : '');
