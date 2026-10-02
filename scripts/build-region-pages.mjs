#!/usr/bin/env node
/* SEO por region: una pagina estatica e indexable por region e idioma (es, en, fr, it) con las cifras reales de data/ ya escritas en el HTML,
   mas una pagina indice por pais e idioma. Cubre EE. UU. (51), Canada (13), Espana (17), Francia (13), Italia (20), Alemania (16) y Australia (8).
   URLs: es /regiones/<pais>/<region>/ · en /en/regions/... · fr /fr/regions/... · it /it/regioni/... (hreflang reciproco + x-default).
   Solo se genera la pagina de una region si hay al menos una cifra publicada para ella; nada se rellena ni se estima.
   Los nombres y las etiquetas salen de js/region-names.js y js/region.js (una sola fuente de verdad); los mapas de vendor/ dan la lista de regiones.
   Se ejecuta al final de scripts/build-seo-pages.mjs y reescribe el bloque marcado de sitemap.xml. */
import fs from 'node:fs';
import { seoTitle, seoDesc, socialMeta } from './lib_seo.mjs';
import vm from 'node:vm';
const read = f => fs.readFileSync(f, 'utf8');
const SITE = 'https://dehesaindex.com';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LG = ['en', 'es', 'fr', 'it'], LI = { en: 0, es: 1, fr: 2, it: 3 }, LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
/* ---- etiquetas de js/region.js (EL, EC, EAN, LBL, TAU) ---- */
const rsrc = read('js/region.js');
function grab(name) {
  const i = rsrc.indexOf('var ' + name + ' = '); if (i < 0) throw new Error('region.js: falta ' + name);
  let j = rsrc.indexOf('{', i), d = 0, k = j, q = null;
  for (; k < rsrc.length; k++) { const c = rsrc[k];
    if (q) { if (c === '\\') k++; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"') { q = c; continue; }
    if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } }
  return vm.runInNewContext('(' + rsrc.slice(j, k + 1) + ')');
}
const EL = grab('EL'), EC = grab('EC'), EAN = grab('EAN'), LBL = grab('LBL'), TAU = grab('TAU');
const win = {}; vm.runInNewContext(read('js/region-names.js'), { window: win }); const NAMES = win.DehesaRegionNames;
const MAPG = { US: 'DEHESA_US_STATES', CA: 'DEHESA_CA_PROVINCES', ES: 'DEHESA_ES_CCAA', FR: 'DEHESA_FR_REGIONS', IT: 'DEHESA_IT_REGIONS', DE: 'DEHESA_DE_LAENDER', AU: 'DEHESA_AU_STATES', NL: 'DEHESA_NL_PROVINCES', AT: 'DEHESA_AT_LAENDER' };
const MAPF = { US: 'us-states', CA: 'ca-provinces', ES: 'es-ccaa', FR: 'fr-regions', IT: 'it-regions', DE: 'de-laender', AU: 'au-states', NL: 'nl-provinces', AT: 'at-laender' };
const CORDER = ['US', 'CA', 'ES', 'FR', 'IT', 'DE', 'NL', 'AT', 'AU'];
const CN = { US: ['United States', 'Estados Unidos', 'États-Unis', 'Stati Uniti'], CA: ['Canada', 'Canadá', 'Canada', 'Canada'], ES: ['Spain', 'España', 'Espagne', 'Spagna'], FR: ['France', 'Francia', 'France', 'Francia'], IT: ['Italy', 'Italia', 'Italie', 'Italia'], DE: ['Germany', 'Alemania', 'Allemagne', 'Germania'], AU: ['Australia', 'Australia', 'Australie', 'Australia'], NL: ['Netherlands', 'Países Bajos', 'Pays-Bas', 'Paesi Bassi'], AT: ['Austria', 'Austria', 'Autriche', 'Austria'] };
const CSLUG = { US: ['united-states', 'estados-unidos', 'etats-unis', 'stati-uniti'], CA: ['canada', 'canada', 'canada', 'canada'], ES: ['spain', 'espana', 'espagne', 'spagna'], FR: ['france', 'francia', 'france', 'francia'], IT: ['italy', 'italia', 'italie', 'italia'], DE: ['germany', 'alemania', 'allemagne', 'germania'], AU: ['australia', 'australia', 'australie', 'australia'], NL: ['netherlands', 'paises-bajos', 'pays-bas', 'paesi-bassi'], AT: ['austria', 'austria', 'autriche', 'austria'] };
const KIND = { US: ['states', 'estados', 'États', 'stati'], CA: ['provinces and territories', 'provincias y territorios', 'provinces et territoires', 'province e territori'], ES: ['autonomous communities', 'comunidades autónomas', 'communautés autonomes', 'comunità autonome'], FR: ['regions', 'regiones', 'régions', 'regioni'], IT: ['regions', 'regiones', 'régions', 'regioni'], DE: ['federal states (Länder)', 'estados federados (Länder)', 'Länder', 'Länder'], AU: ['states and territories', 'estados y territorios', 'États et territoires', 'stati e territori'] };
const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const nm = (c, r, lg) => { const a = NAMES[c][r].split('|'); return a[LI[lg]] || a[0]; };
const J = f => { try { return JSON.parse(read(f)); } catch (e) { return null; } };
const D = { drought: J('data/drought.json'), crops: J('data/nass-crops.json'), cof: J('data/cattle-on-feed.json'), tax: J('data/other-tax.json'), cadr: J('data/canada-drought.json'), ca: J('data/canada-provinces.json'), au: J('data/NONE') || J('data/au-states.json'), eu: { ES: J('data/eu-regions-es.json'), FR: J('data/eu-regions-fr.json'), IT: J('data/eu-regions-it.json'), DE: J('data/eu-regions-de.json'), NL: J('data/eu-regions-nl.json'), AT: J('data/eu-regions-at.json') } };
const lastDay = new Date().toISOString().slice(0, 10);
/* ---- textos por idioma ---- */
const S = {
  es: { root: 'regiones', hub: 'Regiones', tbl: { drought: 'Sequía', crops: 'Cultivos', cattle: 'Ganado vacuno en cebaderos', tax: 'Impuesto sobre las ventas', lvst: 'Ganado', inc: 'Renta agraria', eaa: 'Cuentas agrarias', mix: 'Origen de la producción', land: 'Tierra y cultivos', animals: 'Ganadería', farms: 'Explotaciones', exp: 'Exportaciones agroalimentarias' },
    d1: 'Sequía moderada o peor', d2: 'Severa o peor', d3: 'Extrema o peor', d4: 'Excepcional', ofArea: 'de la superficie', asof: 'a', crop: 'Cultivo', area: 'Superficie', yield: 'Rendimiento', prod: 'Producción', year: 'Año', conc: 'Concepto', value: 'Valor', yoy: 'Variación anual', share: 'Peso', unit: 'Unidad',
    onfeed: 'En cebadero', yago: 'Hace un año', kh: 'mil cabezas', rate: 'Tipo estatal', nostate: 'Sin impuesto estatal sobre las ventas', head: 'Existencias', cattleN: 'Vacuno', hogsN: 'Porcino', sheepN: 'Ovino', netInc: 'Renta neta', cashRec: 'Ingresos en efectivo (total)', cad: 'M CAD', eur: 'M EUR', prodUnits: 'mil t', hth: 'mil ha',
    holdings: 'Explotaciones', ha: 'Superficie agraria (ha)', avg: 'Tamaño medio (ha)', sout: 'Producción estándar (M EUR)', milk: 'Leche de vaca recogida (mil t)', headk: 'mil cabezas', aud: 'M A$', noteH: 'Cómo leer estas cifras', note: 'Cifras tal como las publica cada fuente oficial, con su unidad. Lo que una fuente no publica para esta región no se rellena ni se estima.', cta: 'Abrir el perfil interactivo con gráficas →', mapCta: 'Ver el mapa de ' , src: 'Fuentes', lic: 'Licencia', gen: 'Página generada el', others: 'Otras', ofC: 'de', profile: 'Perfil del país', pageOf: 'Agricultura en', methodology: 'Metodología', pending: 'forecast', forecast: 'Cifras del año en curso: previsión de la fuente.', metodo: 'metodologia.html', home: 'Inicio',
    title: (r, c, h) => r + ' (' + c + '): agricultura' + (h ? ', ' + h : ''), h1: (r, c) => r + ': datos agrarios y estadísticas', lead: (r, c, h, k) => 'Cifras oficiales de ' + r + ' (' + c + ')' + (h ? ': ' + h : '') + '. Esta página reúne los datos agrarios publicados para ' + k + ' y enlaza con el perfil interactivo.', kindS: { US: 'este estado', CA: 'esta provincia o territorio', ES: 'esta comunidad autónoma', FR: 'esta región', IT: 'esta región', DE: 'este estado federado (Land)', AU: 'este estado o territorio', NL: 'esta provincia', AT: 'este estado federado (Land)' },
    hubTitle: (c, n) => 'Agricultura por ' + ' región en ' + c + ': ' + n + ' perfiles con datos oficiales', hubH1: c => 'Datos agrarios por región: ' + c, hubLead: (c, n, k) => n + ' ' + k + ' de ' + c + ' con las cifras que publican las fuentes oficiales: cultivos, ganado, renta agraria y más, según lo que exista para cada una.', hubList: 'Todas las regiones', hubOther: 'Otros países', heads: { US: 'Estados', CA: 'Provincias y territorios', ES: 'Comunidades autónomas', FR: 'Regiones', IT: 'Regiones', DE: 'Estados federados', AU: 'Estados y territorios', NL: 'Provincias', AT: 'Estados federados' } },
  en: { root: 'en/regions', hub: 'Regions', tbl: { drought: 'Drought', crops: 'Crops', cattle: 'Cattle on feed', tax: 'Sales tax', lvst: 'Livestock', inc: 'Farm income', eaa: 'Agricultural accounts', mix: 'Where output comes from', land: 'Land and crops', animals: 'Livestock', farms: 'Farms', exp: 'Agri-food exports' },
    d1: 'Moderate drought or worse', d2: 'Severe or worse', d3: 'Extreme or worse', d4: 'Exceptional', ofArea: 'of the area', asof: 'as of', crop: 'Crop', area: 'Area', yield: 'Yield', prod: 'Production', year: 'Year', conc: 'Item', value: 'Value', yoy: 'Annual change', share: 'Share', unit: 'Unit',
    onfeed: 'On feed', yago: 'A year ago', kh: 'thousand head', rate: 'State rate', nostate: 'No state sales tax', head: 'Inventory', cattleN: 'Cattle', hogsN: 'Hogs', sheepN: 'Sheep', netInc: 'Net income', cashRec: 'Cash receipts (total)', cad: 'M CAD', eur: 'M EUR', prodUnits: 'thousand t', hth: 'thousand ha',
    holdings: 'Holdings', ha: 'Agricultural area (ha)', avg: 'Average size (ha)', sout: 'Standard output (M EUR)', milk: 'Cow’s milk collected (thousand t)', headk: 'thousand head', aud: 'A$ M', noteH: 'How to read these figures', note: 'Figures as each official source publishes them, with their unit. Anything a source does not publish for this region is not filled in or estimated.', cta: 'Open the interactive profile with charts →', mapCta: 'See the map of ', src: 'Sources', lic: 'Licence', gen: 'Page generated on', others: 'Other', ofC: 'of', profile: 'Country profile', pageOf: 'Agriculture in', methodology: 'Methodology', forecast: 'Current-year figures are the source’s forecast.', metodo: 'metodologia.html', home: 'Home',
    title: (r, c, h) => r + ' (' + c + '): agriculture' + (h ? ', ' + h : ''), h1: (r, c) => r + ': farm data and statistics', lead: (r, c, h, k) => 'Official figures for ' + r + ' (' + c + ')' + (h ? ': ' + h : '') + '. This page gathers the farm data published for this ' + k + ' and links to the interactive profile.', kindS: { US: 'state', CA: 'province or territory', ES: 'autonomous community', FR: 'region', IT: 'region', DE: 'federal state (Land)', AU: 'state or territory', NL: 'province', AT: 'federal state (Land)' },
    hubTitle: (c, n) => 'Agriculture by region in ' + c + ': ' + n + ' profiles with official data', hubH1: c => 'Farm data by region: ' + c, hubLead: (c, n, k) => n + ' ' + k + ' of ' + c + ' with the figures official sources publish: crops, livestock, farm income and more, depending on what exists for each.', hubList: 'All regions', hubOther: 'Other countries', heads: { US: 'States', CA: 'Provinces and territories', ES: 'Autonomous communities', FR: 'Regions', IT: 'Regions', DE: 'Federal states', AU: 'States and territories', NL: 'Provinces', AT: 'Federal states' } },
  fr: { root: 'fr/regions', hub: 'Régions', tbl: { drought: 'Sécheresse', crops: 'Cultures', cattle: 'Bovins en engraissement', tax: 'Taxe de vente', lvst: 'Élevage', inc: 'Revenu agricole', eaa: 'Comptes de l’agriculture', mix: 'Origine de la production', land: 'Terres et cultures', animals: 'Élevage', farms: 'Exploitations', exp: 'Exportations agroalimentaires' },
    d1: 'Sécheresse modérée ou pire', d2: 'Grave ou pire', d3: 'Extrême ou pire', d4: 'Exceptionnelle', ofArea: 'de la superficie', asof: 'au', crop: 'Culture', area: 'Superficie', yield: 'Rendement', prod: 'Production', year: 'Année', conc: 'Poste', value: 'Valeur', yoy: 'Variation annuelle', share: 'Part', unit: 'Unité',
    onfeed: 'En engraissement', yago: 'Il y a un an', kh: 'mille têtes', rate: 'Taux de l’État', nostate: 'Pas de taxe de vente d’État', head: 'Effectifs', cattleN: 'Bovins', hogsN: 'Porcins', sheepN: 'Ovins', netInc: 'Revenu net', cashRec: 'Recettes en espèces (total)', cad: 'M CAD', eur: 'M EUR', prodUnits: 'mille t', hth: 'mille ha',
    holdings: 'Exploitations', ha: 'Surface agricole (ha)', avg: 'Taille moyenne (ha)', sout: 'Production standard (M EUR)', milk: 'Lait de vache collecté (mille t)', headk: 'mille têtes', aud: 'M A$', noteH: 'Comment lire ces chiffres', note: 'Chiffres tels que les publie chaque source officielle, avec leur unité. Ce qu’une source ne publie pas pour cette région n’est ni comblé ni estimé.', cta: 'Ouvrir le profil interactif avec graphiques →', mapCta: 'Voir la carte : ', src: 'Sources', lic: 'Licence', gen: 'Page générée le', others: 'Autres', ofC: 'de', profile: 'Profil du pays', pageOf: 'Agriculture : ', methodology: 'Méthodologie', forecast: 'Les chiffres de l’année en cours sont une prévision de la source.', metodo: 'metodologia.html', home: 'Accueil',
    title: (r, c, h) => r + ' (' + c + ') : agriculture' + (h ? ', ' + h : ''), h1: (r, c) => r + ' : données agricoles et statistiques', lead: (r, c, h, k) => 'Chiffres officiels pour ' + r + ' (' + c + ')' + (h ? ' : ' + h : '') + '. Cette page rassemble les données agricoles publiées pour ' + k + ' et renvoie au profil interactif.', kindS: { US: 'cet État', CA: 'cette province ou ce territoire', ES: 'cette communauté autonome', FR: 'cette région', IT: 'cette région', DE: 'ce Land', AU: 'cet État ou territoire', NL: 'cette province', AT: 'ce Land' },
    hubTitle: (c, n) => 'Agriculture par région : ' + c + ', ' + n + ' profils officiels', hubH1: c => 'Données agricoles par région : ' + c, hubLead: (c, n, k) => n + ' ' + k + ' (' + c + ') avec les chiffres publiés par les sources officielles : cultures, élevage, revenu agricole et plus, selon ce qui existe pour chacune.', hubList: 'Toutes les régions', hubOther: 'Autres pays', heads: { US: 'États', CA: 'Provinces et territoires', ES: 'Communautés autonomes', FR: 'Régions', IT: 'Régions', DE: 'Länder', AU: 'États et territoires', NL: 'Provinces', AT: 'Länder' } },
  it: { root: 'it/regioni', hub: 'Regioni', tbl: { drought: 'Siccità', crops: 'Colture', cattle: 'Bovini in ingrasso', tax: 'Imposta sulle vendite', lvst: 'Allevamento', inc: 'Reddito agricolo', eaa: 'Conti dell’agricoltura', mix: 'Origine della produzione', land: 'Terra e colture', animals: 'Allevamento', farms: 'Aziende agricole', exp: 'Esportazioni agroalimentari' },
    d1: 'Siccità moderata o peggiore', d2: 'Grave o peggiore', d3: 'Estrema o peggiore', d4: 'Eccezionale', ofArea: 'della superficie', asof: 'al', crop: 'Coltura', area: 'Superficie', yield: 'Resa', prod: 'Produzione', year: 'Anno', conc: 'Voce', value: 'Valore', yoy: 'Variazione annua', share: 'Peso', unit: 'Unità',
    onfeed: 'In ingrasso', yago: 'Un anno fa', kh: 'mila capi', rate: 'Aliquota statale', nostate: 'Nessuna imposta statale sulle vendite', head: 'Consistenza', cattleN: 'Bovini', hogsN: 'Suini', sheepN: 'Ovini', netInc: 'Reddito netto', cashRec: 'Ricavi in contanti (totale)', cad: 'M CAD', eur: 'M EUR', prodUnits: 'mila t', hth: 'mila ha',
    holdings: 'Aziende', ha: 'Superficie agricola (ha)', avg: 'Dimensione media (ha)', sout: 'Produzione standard (M EUR)', milk: 'Latte vaccino raccolto (mila t)', headk: 'mila capi', aud: 'M A$', noteH: 'Come leggere queste cifre', note: 'Cifre come le pubblica ogni fonte ufficiale, con la loro unità. Ciò che una fonte non pubblica per questa regione non viene riempito né stimato.', cta: 'Apri il profilo interattivo con i grafici →', mapCta: 'Vedi la mappa: ', src: 'Fonti', lic: 'Licenza', gen: 'Pagina generata il', others: 'Altre', ofC: 'di', profile: 'Profilo del paese', pageOf: 'Agricoltura: ', methodology: 'Metodologia', forecast: 'Le cifre dell’anno in corso sono una previsione della fonte.', metodo: 'metodologia.html', home: 'Home',
    title: (r, c, h) => r + ' (' + c + '): agricoltura' + (h ? ', ' + h : ''), h1: (r, c) => r + ': dati agricoli e statistiche', lead: (r, c, h, k) => 'Cifre ufficiali per ' + r + ' (' + c + ')' + (h ? ': ' + h : '') + '. Questa pagina raccoglie i dati agricoli pubblicati per ' + k + ' e rimanda al profilo interattivo.', kindS: { US: 'questo stato', CA: 'questa provincia o questo territorio', ES: 'questa comunità autonoma', FR: 'questa regione', IT: 'questa regione', DE: 'questo Land', AU: 'questo stato o territorio', NL: 'questa provincia', AT: 'questo Land' },
    hubTitle: (c, n) => 'Agricoltura per regione: ' + c + ', ' + n + ' profili ufficiali', hubH1: c => 'Dati agricoli per regione: ' + c, hubLead: (c, n, k) => n + ' ' + k + ' (' + c + ') con le cifre pubblicate dalle fonti ufficiali: colture, allevamento, reddito agricolo e altro, secondo ciò che esiste per ciascuna.', hubList: 'Tutte le regioni', hubOther: 'Altri paesi', heads: { US: 'Stati', CA: 'Province e territori', ES: 'Comunità autonome', FR: 'Regioni', IT: 'Regioni', DE: 'Länder', AU: 'Stati e territori', NL: 'Province', AT: 'Länder' } }
};
const SRC = { US: [['USDA NASS / US Drought Monitor / AMS', 'https://www.nass.usda.gov/']], CA: [['Statistics Canada · Canadian Drought Monitor (AAFC)', 'https://www150.statcan.gc.ca/']], ES: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], FR: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], IT: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], DE: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], NL: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], AT: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], AU: [['Australian Bureau of Statistics (CC BY 4.0)', 'https://www.abs.gov.au/statistics/economy/international-trade']] };
/* ---- facts por pais: devuelven { head: {valor numerico formateable, clave}, blocks:[{k, cols, rows(lg->array), note}] } ---- */
const lastOf = a => { for (let i = (a || []).length - 1; i >= 0; i--) if (a[i][1] != null) return a[i]; return null; };
const atY = (a, y) => { const p = (a || []).find(q => +q[0] === +y); return p && p[1] != null ? p[1] : null; };
function mk(lg) {
  const nf = (v, d) => v.toLocaleString(LOC[lg], { minimumFractionDigits: d == null ? (Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2) : d, maximumFractionDigits: d == null ? (Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2) : d });
  const pct = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
  return { nf, pct };
}
const FACT = {
  US(r, lg, f) {
    const t = S[lg], B = [], st = D.drought && D.drought.states && D.drought.states[r]; let head = null;
    if (st && st.length) { const l = st[st.length - 1]; head = t.d1.toLowerCase() + ' ' + f.nf(l[2], 1) + ' % ' + t.ofArea; B.push({ k: 'drought', cols: [t.conc, t.value], rows: [[t.d1, f.nf(l[2], 1) + ' %'], [t.d2, f.nf(l[3], 1) + ' %'], [t.d3, f.nf(l[4], 1) + ' %'], [t.d4, f.nf(l[5], 1) + ' %']], note: t.asof + ' ' + l[0] }); }
    const by = {}; if (D.crops && D.crops.series) for (const k of Object.keys(D.crops.series)) { const s = D.crops.series[k], i = k.indexOf(' - '), crop = k.slice(0, i), sn = k.slice(i + 3); if (!LBL.crops[crop] || !s.s || !s.s[r]) continue;
      const kind = sn === 'ACRES HARVESTED' ? 'area' : /^YIELD, MEASURED IN/.test(sn) ? 'yield' : /^PRODUCTION, MEASURED IN/.test(sn) && !/\$|PCT/.test(sn) ? 'prod' : null; if (!kind) continue;
      const pts = s.s[r].filter(p => p[1] != null && p[1] > 0); if (!pts.length) continue; (by[crop] = by[crop] || {})[kind] = { pts, unit: sn.replace(/^.*MEASURED IN /, '').toLowerCase() }; }
    const rows = []; for (const c of Object.keys(by)) { const o = by[c]; let yr = 0; for (const k of ['area', 'yield', 'prod']) if (o[k]) yr = Math.max(yr, +o[k].pts[o[k].pts.length - 1][0]); if (yr < 2020) continue;
      const cell = (k, u) => { const e = o[k]; if (!e) return '–'; const p = e.pts[e.pts.length - 1]; return +p[0] !== yr ? '–' : f.nf(p[1]) + ' ' + (u || e.unit); };
      rows.push({ a: o.area && +o.area.pts[o.area.pts.length - 1][0] === yr ? o.area.pts[o.area.pts.length - 1][1] : 0, r: [LBL.crops[c][LI[lg]], cell('area', 'acres'), cell('yield'), cell('prod'), String(yr)] }); }
    rows.sort((a, b) => b.a - a.a); if (rows.length) { B.push({ k: 'crops', cols: [t.crop, t.area, t.yield, t.prod, t.year], rows: rows.slice(0, 8).map(x => x.r), note: t.forecast }); }
    const rep = D.cof && D.cof.reports && D.cof.reports[D.cof.reports.length - 1], en = NAMES.US[r].split('|')[0], s = rep && (rep.states || []).find(q => q.state === en);
    if (s) B.push({ k: 'cattle', cols: [t.conc, t.value], rows: [[t.onfeed, f.nf(s.current) + ' ' + t.kh], [t.yago, f.nf(s.yearAgo) + ' ' + t.kh]], note: t.asof + ' ' + rep.inventoryDate });
    const tx = D.tax && D.tax.us && D.tax.us.states && D.tax.us.states[r]; if (tx) B.push({ k: 'tax', cols: [t.conc, t.value], rows: [[t.rate, tx.noStateSalesTax ? t.nostate : f.nf(tx.rate, 2) + ' %']], note: '' });
    return { head, B };
  },
  CA(r, lg, f) {
    const t = S[lg], B = [], p = D.ca && D.ca.provinces && D.ca.provinces[r], dr = D.cadr && D.cadr.provinces && D.cadr.provinces[r]; let head = null;
    if (dr) { const l = dr.v[D.cadr.periods.length - 1]; if (l) { head = t.d1.toLowerCase() + ' ' + f.nf(l[1], 1) + ' % ' + t.ofArea; B.push({ k: 'drought', cols: [t.conc, t.value], rows: [[t.d1, f.nf(l[1], 1) + ' %'], [t.d2, f.nf(l[2], 1) + ' %'], [t.d3, f.nf(l[3], 1) + ' %'], [t.d4, f.nf(l[4], 1) + ' %']], note: t.asof + ' ' + D.cadr.asOf }); } }
    if (p) {
      const rows = []; for (const k of Object.keys(p.crops || {})) { const c = p.crops[k]; const a = lastOf(c.area); if (!a || a[1] <= 0) continue; const pr = atY(c.prod, a[0]), y = atY(c.yield, a[0]); rows.push({ a: a[1], r: [c.name, f.nf(a[1]) + ' ' + t.hth, y != null ? f.nf(y) + ' kg/ha' : '–', pr != null ? f.nf(pr) + ' ' + t.prodUnits : '–', a[0]] }); }
      rows.sort((a, b) => b.a - a.a); if (rows.length) B.push({ k: 'crops', cols: [t.crop, t.area, t.yield, t.prod, t.year], rows: rows.slice(0, 8).map(x => x.r), note: t.forecast });
      const lv = []; [['cattle', 'total-cattle', t.cattleN], ['hogs', 'total-hogs', t.hogsN], ['sheep', 'total-sheep', t.sheepN]].forEach(z => { const o = p[z[0]] && (p[z[0]][z[1]] || p[z[0]][Object.keys(p[z[0]])[0]]), l = o && lastOf(o.pts); if (l) lv.push([z[2], f.nf(l[1]) + ' ' + t.kh, l[0]]); });
      if (lv.length) B.push({ k: 'lvst', cols: [t.conc, t.value, t.year], rows: lv, note: '' });
      const inc = [], g = (grp, key) => { const o = p[grp] && p[grp][key]; return o && lastOf(o.pts); };
      const ni = g('income', 'net-income-total'), cr = g('receipts', 'total-farm-cash-receipts');
      if (cr) { inc.push([t.cashRec, f.nf(cr[1]) + ' ' + t.cad, cr[0]]); if (!head) head = t.cashRec.toLowerCase() + ' ' + f.nf(cr[1]) + ' ' + t.cad + ' (' + cr[0] + ')'; }
      if (ni) inc.push([t.netInc, f.nf(ni[1]) + ' ' + t.cad, ni[0]]);
      if (inc.length) B.push({ k: 'inc', cols: [t.conc, t.value, t.year], rows: inc, note: '' });
    }
    return { head, B };
  },
  EU(r, lg, f, c) {
    const t = S[lg], B = [], d = D.eu[c], b = d && d.regions && d.regions[r]; if (!b) return { head: null, B };
    let head = null; const o = b.eaa || {};
    if (o.AM180000) { const y = lastOf(o.AM180000)[0], g = it => o[it] ? atY(o[it], y) : null, yoy = it => { const a = g(it), p = o[it] ? atY(o[it], y - 1) : null; return a != null && p ? (a / p - 1) * 100 : null; };
      const row = it => { const v = g(it); return v == null ? null : [EL[it][LI[lg]], f.nf(v) + ' ' + t.eur, yoy(it) == null ? '–' : f.pct(yoy(it))]; };
      head = EL.AM180000[LI[lg]].toLowerCase() + ' ' + f.nf(g('AM180000')) + ' ' + t.eur + ' (' + y + ')';
      B.push({ k: 'eaa', cols: [t.conc, t.value, t.yoy], rows: ['AM180000', 'AM260000', 'AM320000', 'AM370000'].map(row).filter(Boolean), note: t.year + ' ' + y });
      const base = g('AM160000'), items = ['AM100000', 'AM110000', 'AM120000'], det = ['AM010000', 'AM020000', 'AM030000', 'AM040000', 'AM050000', 'AM060000', 'AM070000', 'AM080000', 'AM111000', 'AM112000', 'AM114000', 'AM115000', 'AM121000', 'AM122000'].map(it => ({ it, v: g(it) })).filter(z => z.v != null && z.v > 0).sort((a, c2) => c2.v - a.v).slice(0, 5);
      const mix = items.map(it => ({ it, v: g(it) })).filter(z => z.v != null && z.v > 0).concat(det).map(z => [EL[z.it][LI[lg]], f.nf(z.v) + ' ' + t.eur, base ? f.nf(z.v / base * 100, 1) + ' %' : '–']);
      if (base && mix.length) B.push({ k: 'mix', cols: [t.conc, t.value, t.share], rows: mix, note: t.year + ' ' + y });
    }
    const cr = b.crops || {}, land = []; ['UAA', 'ARA', 'J0000'].forEach(k => { const l = cr[k] && lastOf(cr[k].area); if (l) land.push([EC[k][LI[lg]], f.nf(l[1]) + ' ' + t.hth, l[0]]); });
    const cl = Object.keys(cr).filter(k => !['UAA', 'ARA', 'J0000', 'C0000', 'F0000'].includes(k) && EC[k]).map(k => ({ k, l: lastOf(cr[k].area) })).filter(z => z.l && z.l[1] > 0).sort((a, c2) => c2.l[1] - a.l[1]).slice(0, 6);
    cl.forEach(z => { const pr = atY(cr[z.k].prod, z.l[0]); land.push([EC[z.k][LI[lg]] + (pr != null ? ' · ' + f.nf(pr) + ' ' + t.prodUnits : ''), f.nf(z.l[1]) + ' ' + t.hth, z.l[0]]); });
    if (land.length) B.push({ k: 'land', cols: [t.conc, t.area, t.year], rows: land, note: '' });
    const an = []; ['A2000', 'A2300F', 'A3100', 'A4100', 'A4200'].forEach(k => { const l = b.animals && b.animals[k] && lastOf(b.animals[k]); if (l) an.push([EAN[k][LI[lg]], f.nf(l[1]) + ' ' + t.headk, l[0]]); });
    const ml = b.milk && lastOf(b.milk); if (ml) an.push([t.milk, f.nf(ml[1]), ml[0]]);
    if (an.length) B.push({ k: 'animals', cols: [t.conc, t.value, t.year], rows: an, note: '' });
    const ft = b.farms && b.farms.TOTAL, yy = ft && Object.keys(ft).map(Number).sort((a, c2) => a - c2).pop(), fv = yy && ft[yy];
    if (fv && fv.HLD) { const rr = [[t.holdings, f.nf(fv.HLD, 0), yy]]; if (fv.HA) { rr.push([t.ha, f.nf(fv.HA, 0), yy]); rr.push([t.avg, f.nf(fv.HA / fv.HLD, 1), yy]); } if (fv.EUR) rr.push([t.sout, f.nf(fv.EUR / 1e6, 0), yy]); B.push({ k: 'farms', cols: [t.conc, t.value, t.year], rows: rr, note: '' }); }
    return { head, B };
  },
  AU(r, lg, f) {
    const t = S[lg], B = [], S0 = D.au && D.au.states, b = S0 && S0[r]; if (!b || !b.agrifood || !b.agrifood.length) return { head: null, B };
    const y = lastOf(b.agrifood)[0], tot = (k, yy) => Object.keys(S0).reduce((s, st) => s + ((S0[st][k] && atY(S0[st][k], yy)) || 0), 0), rows = [];
    for (const z of [['agrifood', 'auAll'], ['beef', 'auBeef'], ['sheepmeat', 'auSheep'], ['wheat', 'auWheat'], ['barley', 'auBarley'], ['maize', 'auMaize'], ['oilseeds', 'auOil'], ['cotton', 'auCotton'], ['wool', 'auWool'], ['wine', 'auWine'], ['sugar', 'auSugar'], ['milk', 'auMilk'], ['cheese', 'auCheese'], ['live', 'auLive']]) {
      const v = b[z[0]] && atY(b[z[0]], y); if (v == null || v <= 0) continue; const pv = atY(b[z[0]], y - 1), all = tot(z[0], y);
      rows.push([TAU[lg][z[1]], f.nf(v) + ' ' + t.aud, pv ? f.pct((v / pv - 1) * 100) : '–', all ? f.nf(v / all * 100, 1) + ' %' : '–']); }
    const v0 = atY(b.agrifood, y);
    B.push({ k: 'exp', cols: [t.conc, t.value, t.yoy, t.share], rows, note: t.year + ' ' + y + '. ' + TAU[lg].auNote });
    return { head: TAU[lg].auAll.toLowerCase() + ' ' + f.nf(v0) + ' ' + t.aud + ' (' + y + ')', B };
  }
};
const factsOf = (c, r, lg, f) => (c === 'US' ? FACT.US(r, lg, f) : c === 'CA' ? FACT.CA(r, lg, f) : c === 'AU' ? FACT.AU(r, lg, f) : FACT.EU(r, lg, f, c));
/* ---- paginas ---- */
const urlR = (lg, c, slug) => SITE + '/' + S[lg].root + '/' + CSLUG[c][LI[lg]] + '/' + (slug ? slug + '/' : '');
const upOf = (lg, depth) => '../'.repeat((lg === 'es' ? 2 : 3) + depth);
const head = (lg, title, desc, url, alts, ld, up) => `<!doctype html>
<html lang="${lg}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(seoDesc(desc))}">
<link rel="canonical" href="${url}">
${alts}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(seoDesc(desc))}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Dehesa Index">${socialMeta(lg)}
<link rel="icon" href="${up}assets/icon-192.png">
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
<script>try{if(!localStorage.getItem('dehesaIndexLang'))localStorage.setItem('dehesaIndexLang','${lg}')}catch(e){}</script>
<script src="${up}js/shared.js?v=20260929-context-fix"></script>
<script>if(window.DehesaShared&&window.DehesaShared.init)window.DehesaShared.init('informacion');</script>
</body>
</html>
`;
const table = (cols, rows) => '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-bottom:12px"><table style="border-collapse:collapse;width:100%;min-width:420px;font-size:14px"><thead><tr>' + cols.map((h, i) => '<th scope="col" style="text-align:' + (i ? 'right' : 'left') + ';padding:8px 6px;font-size:11px">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map((v, i) => i ? '<td style="text-align:right;padding:8px 6px">' + esc(v) + '</td>' : '<th scope="row" style="text-align:left;padding:8px 6px;font-weight:600">' + esc(v) + '</th>').join('') + '</tr>').join('') + '</tbody></table></div>';
// regiones por pais
const REG = {};
for (const c of CORDER) { const w = {}; vm.runInNewContext(read('vendor/' + MAPF[c] + '.js'), { window: w }); REG[c] = w[MAPG[c]].states.map(s => s.id).filter(id => NAMES[c][id]); }
const out = [], urls = [], summary = {};
for (const c of CORDER) {
  // lista de regiones con datos (se decide con es; el conjunto es el mismo en todos los idiomas)
  const has = REG[c].filter(r => factsOf(c, r, 'es', mk('es')).B.length);
  summary[c] = has.length + '/' + REG[c].length;
  for (const lg of ['es', 'en', 'fr', 'it']) {
    const t = S[lg], f = mk(lg), cname = CN[c][LI[lg]], nameOf = r => nm(c, r, lg);
    const sorted = has.slice().sort((a, b) => nameOf(a).localeCompare(nameOf(b), LOC[lg]));
    const alts = (fn) => LG.slice().sort().concat([]).map(l2 => l2).filter(l2 => l2 !== 'x').map(l2 => '<link rel="alternate" hreflang="' + l2 + '" href="' + fn(l2) + '">').join('\n') + '\n<link rel="alternate" hreflang="x-default" href="' + fn('en') + '">';
    const heads = {};
    for (const r of sorted) heads[r] = factsOf(c, r, lg, f).head;
    const profile = lg === 'es' ? 'paises.html?c=' + c : 'paises.html?c=' + c;
    for (const r of sorted) {
      const F = factsOf(c, r, lg, f), rn = nameOf(r), url = urlR(lg, c, slugify(nm(c, r, lg))), up = upOf(lg, 1);
      const title = seoTitle(t.title(rn, cname, (F.head || '').replace(' ' + t.ofArea, '').replace(/\s*\((?:\d{4}|[^)]*\d{4}[^)]*)\)\s*$/, ''))), top = F.B[0];
      const desc = (t.lead(rn, cname, F.head, t.kindS[c]) + ' ' + F.B.map(b => t.tbl[b.k]).join(', ') + '.').slice(0, 300);
      const alt = alts(l2 => urlR(l2, c, slugify(nm(c, r, l2))));
      const ld = { '@context': 'https://schema.org', '@graph': [
        { '@type': 'Dataset', name: t.pageOf + ' ' + rn + ' (' + cname + ')', description: desc, url, inLanguage: lg, isAccessibleForFree: true, dateModified: lastDay, spatialCoverage: { '@type': 'Place', name: rn + ', ' + cname }, creator: { '@type': 'Organization', name: 'Dehesa Index', url: SITE }, isBasedOn: SRC[c].map(s => s[1]) },
        { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Dehesa Index', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: cname, item: urlR(lg, c) }, { '@type': 'ListItem', position: 3, name: rn, item: url }] }] };
      let h = head(lg, title, desc, url, alt, ld, up);
      h += '    <div class="di-page-head"><h1>' + esc(t.h1(rn, cname)) + '</h1><p>' + esc(t.lead(rn, cname, F.head, t.kindS[c])) + '</p></div>\n';
      for (const b of F.B) h += '    <h2 style="font-size:17px;margin:18px 0 6px">' + esc(t.tbl[b.k]) + '</h2>\n    ' + table(b.cols, b.rows) + (b.note ? '\n    <p class="di-movers-hint" style="margin:-4px 0 8px">' + esc(b.note) + '</p>' : '') + '\n';
      h += '    <p style="margin:16px 0"><a class="di-btn-gold-solid" href="' + up + 'region.html?c=' + c + '&amp;r=' + r + '">' + esc(t.cta) + '</a></p>\n';
      h += '    <p class="di-movers-hint">' + esc(t.src) + ': ' + SRC[c].map(s => '<a href="' + esc(s[1]) + '" rel="noopener">' + esc(s[0]) + '</a>').join(' · ') + ' · <a href="' + up + profile + '">' + esc(t.profile + ' · ' + cname) + '</a> · ' + esc(t.gen) + ' ' + lastDay + '.</p>\n';
      h += '    <p class="di-movers-hint">' + esc(t.note) + ' <a href="' + up + t.metodo + '">' + esc(t.methodology) + '</a></p>\n';
      h += '    <h2 style="font-size:17px;margin-top:22px">' + esc(t.heads[c]) + ': ' + esc(cname) + '</h2>\n    <p>' + sorted.filter(x => x !== r).map(x => '<a href="../' + slugify(nm(c, x, lg)) + '/">' + esc(nameOf(x)) + '</a>').join(' · ') + ' · <a href="../">' + esc(t.hubList) + '</a></p>\n';
      h += foot(lg, up);
      out.push([url.replace(SITE + '/', ''), h]); urls.push(url);
    }
    // indice del pais
    { const url = urlR(lg, c), up = upOf(lg, 0), title = seoTitle(t.hubTitle(cname, sorted.length)), desc = t.hubLead(cname, sorted.length, t.heads[c].toLowerCase()).slice(0, 300);
      const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', name: t.hubH1(cname), description: desc, url, inLanguage: lg, hasPart: sorted.map(r => ({ '@type': 'WebPage', name: nameOf(r), url: urlR(lg, c, slugify(nm(c, r, lg))) })) },
        { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Dehesa Index', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: cname, item: url }] }] };
      let h = head(lg, title, desc, url, alts(l2 => urlR(l2, c)), ld, up);
      h += '    <div class="di-page-head"><h1>' + esc(t.hubH1(cname)) + '</h1><p>' + esc(desc) + '</p></div>\n    <h2 style="font-size:17px;margin:18px 0 6px">' + esc(t.hubList) + '</h2>\n    <ul>\n' + sorted.map(r => '      <li><a href="' + slugify(nm(c, r, lg)) + '/">' + esc(nameOf(r)) + '</a>' + (heads[r] ? ' — ' + esc(heads[r]) : '') + '</li>').join('\n') + '\n    </ul>\n';
      h += '    <p style="margin:16px 0"><a class="di-btn-gold-solid" href="' + up + 'paises.html?c=' + c + '">' + esc(t.profile + ' · ' + cname + ' →') + '</a></p>\n';
      h += '    <h2 style="font-size:17px;margin-top:22px">' + esc(t.hubOther) + '</h2>\n    <p>' + CORDER.filter(x => x !== c).map(x => '<a href="../' + CSLUG[x][LI[lg]] + '/">' + esc(CN[x][LI[lg]]) + '</a>').join(' · ') + '</p>\n';
      h += '    <p class="di-movers-hint">' + esc(t.note) + ' <a href="' + up + t.metodo + '">' + esc(t.methodology) + '</a> · ' + esc(t.gen) + ' ' + lastDay + '.</p>\n' + foot(lg, up);
      out.push([url.replace(SITE + '/', ''), h]); urls.push(url); }
  }
}
// escribir: se vacian antes los directorios generados para no dejar paginas obsoletas
for (const lg of Object.keys(S)) fs.rmSync(S[lg].root, { recursive: true, force: true });
for (const [p, h] of out) { fs.mkdirSync(p, { recursive: true }); fs.writeFileSync(p + 'index.html', h); }
let sm = read('sitemap.xml'); const A = '  <!-- region-pages:start -->', B = '  <!-- region-pages:end -->';
const block = A + '\n' + urls.sort().map(u => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n' + B;
if (sm.includes(A)) sm = sm.replace(new RegExp(A + '[\\s\\S]*?' + B), block); else sm = sm.replace('</urlset>', block + '\n</urlset>');
fs.writeFileSync('sitemap.xml', sm);
console.log('paginas de region', urls.length, JSON.stringify(summary));
