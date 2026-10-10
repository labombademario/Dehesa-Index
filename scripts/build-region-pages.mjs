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
const MAPG = { US: 'DEHESA_US_STATES', CA: 'DEHESA_CA_PROVINCES', ES: 'DEHESA_ES_CCAA', FR: 'DEHESA_FR_REGIONS', IT: 'DEHESA_IT_REGIONS', DE: 'DEHESA_DE_LAENDER', AU: 'DEHESA_AU_STATES', NL: 'DEHESA_NL_PROVINCES', BE: 'DEHESA_BE_PROVINCES', DK: 'DEHESA_DK_REGIONS', PL: 'DEHESA_PL_VOIVODESHIPS', AT: 'DEHESA_AT_LAENDER' };
const MAPF = { US: 'us-states', CA: 'ca-provinces', ES: 'es-ccaa', FR: 'fr-regions', IT: 'it-regions', DE: 'de-laender', AU: 'au-states', NL: 'nl-provinces', BE: 'be-provinces', DK: 'dk-regions', PL: 'pl-voivodeships', AT: 'at-laender' };
const CORDER = ['US', 'CA', 'ES', 'FR', 'IT', 'DE', 'NL', 'AT', 'BE', 'DK', 'PL', 'AU'];
const CN = { US: ['United States', 'Estados Unidos', 'États-Unis', 'Stati Uniti'], CA: ['Canada', 'Canadá', 'Canada', 'Canada'], ES: ['Spain', 'España', 'Espagne', 'Spagna'], FR: ['France', 'Francia', 'France', 'Francia'], IT: ['Italy', 'Italia', 'Italie', 'Italia'], DE: ['Germany', 'Alemania', 'Allemagne', 'Germania'], AU: ['Australia', 'Australia', 'Australie', 'Australia'], NL: ['Netherlands', 'Países Bajos', 'Pays-Bas', 'Paesi Bassi'], BE: ['Belgium', 'Bélgica', 'Belgique', 'Belgio'], DK: ['Denmark', 'Dinamarca', 'Danemark', 'Danimarca'], PL: ['Poland', 'Polonia', 'Pologne', 'Polonia'], AT: ['Austria', 'Austria', 'Autriche', 'Austria'] };
const CSLUG = { US: ['united-states', 'estados-unidos', 'etats-unis', 'stati-uniti'], CA: ['canada', 'canada', 'canada', 'canada'], ES: ['spain', 'espana', 'espagne', 'spagna'], FR: ['france', 'francia', 'france', 'francia'], IT: ['italy', 'italia', 'italie', 'italia'], DE: ['germany', 'alemania', 'allemagne', 'germania'], AU: ['australia', 'australia', 'australie', 'australia'], NL: ['netherlands', 'paises-bajos', 'pays-bas', 'paesi-bassi'], BE: ['belgium', 'belgica', 'belgique', 'belgio'], DK: ['denmark', 'dinamarca', 'danemark', 'danimarca'], PL: ['poland', 'polonia', 'pologne', 'polonia'], AT: ['austria', 'austria', 'autriche', 'austria'] };
const KIND = { US: ['states', 'estados', 'États', 'stati'], CA: ['provinces and territories', 'provincias y territorios', 'provinces et territoires', 'province e territori'], ES: ['autonomous communities', 'comunidades autónomas', 'communautés autonomes', 'comunità autonome'], FR: ['regions', 'regiones', 'régions', 'regioni'], IT: ['regions', 'regiones', 'régions', 'regioni'], DE: ['federal states (Länder)', 'estados federados (Länder)', 'Länder', 'Länder'], AU: ['states and territories', 'estados y territorios', 'États et territoires', 'stati e territori'] };
const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const nm = (c, r, lg) => { const a = NAMES[c][r].split('|'); return a[LI[lg]] || a[0]; };
const J = f => { try { return JSON.parse(read(f)); } catch (e) { return null; } };
const D = { drought: J('data/drought.json'), crops: J('data/nass-crops.json'), cof: J('data/cattle-on-feed.json'), tax: J('data/other-tax.json'), cadr: J('data/canada-drought.json'), ca: J('data/canada-provinces.json'), au: J('data/NONE') || J('data/au-states.json'), eu: { ES: J('data/eu-regions-es.json'), FR: J('data/eu-regions-fr.json'), IT: J('data/eu-regions-it.json'), DE: J('data/eu-regions-de.json'), NL: J('data/eu-regions-nl.json'), BE: J('data/eu-regions-be.json'), DK: J('data/eu-regions-dk.json'), PL: J('data/eu-regions-pl.json'), AT: J('data/eu-regions-at.json') } };
const lastDay = new Date().toISOString().slice(0, 10);
/* ---- textos por idioma ---- */
const S = {
  es: { root: 'regiones', hub: 'Regiones', tbl: { drought: 'Sequía', crops: 'Cultivos', cattle: 'Ganado vacuno en cebaderos', tax: 'Impuesto sobre las ventas', lvst: 'Ganado', inc: 'Renta agraria', eaa: 'Cuentas agrarias', mix: 'Origen de la producción', land: 'Tierra y cultivos', animals: 'Ganadería', farms: 'Explotaciones', exp: 'Exportaciones agroalimentarias' },
    d1: 'Sequía moderada o peor', d2: 'Severa o peor', d3: 'Extrema o peor', d4: 'Excepcional', ofArea: 'de la superficie', asof: 'a', crop: 'Cultivo', area: 'Superficie', yield: 'Rendimiento', prod: 'Producción', year: 'Año', conc: 'Concepto', value: 'Valor', yoy: 'Variación anual', share: 'Peso', unit: 'Unidad',
    onfeed: 'En cebadero', yago: 'Hace un año', kh: 'mil cabezas', rate: 'Tipo estatal', nostate: 'Sin impuesto estatal sobre las ventas', head: 'Existencias', cattleN: 'Vacuno', hogsN: 'Porcino', sheepN: 'Ovino', netInc: 'Renta neta', cashRec: 'Ingresos en efectivo (total)', cad: 'M CAD', eur: 'M EUR', prodUnits: 'mil t', hth: 'mil ha',
    holdings: 'Explotaciones', ha: 'Superficie agraria (ha)', avg: 'Tamaño medio (ha)', sout: 'Producción estándar (M EUR)', milk: 'Leche de vaca recogida (mil t)', headk: 'mil cabezas', aud: 'M A$', noteH: 'Cómo leer estas cifras', note: 'Cifras tal como las publica cada fuente oficial, con su unidad. Lo que una fuente no publica para esta región no se rellena ni se estima.', cta: 'Abrir el perfil interactivo con gráficas →', mapCta: 'Ver el mapa de ' , src: 'Fuentes', lic: 'Licencia', gen: 'Página generada el', others: 'Otras', ofC: 'de', profile: 'Perfil del país', pageOf: 'Agricultura en', methodology: 'Metodología', pending: 'forecast', forecast: 'Cifras del año en curso: previsión de la fuente.', metodo: 'metodologia.html', home: 'Inicio',
    title: (r, c, h) => r + ' (' + c + '): agricultura' + (h ? ', ' + h : ''), h1: (r, c) => r + ': datos agrarios y estadísticas', lead: (r, c, h, k) => 'Cifras oficiales de ' + r + ' (' + c + ')' + (h ? ': ' + h : '') + '. Esta página reúne los datos agrarios publicados para ' + k + ' y enlaza con el perfil interactivo.', kindS: { US: 'este estado', CA: 'esta provincia o territorio', ES: 'esta comunidad autónoma', FR: 'esta región', IT: 'esta región', DE: 'este estado federado (Land)', AU: 'este estado o territorio', NL: 'esta provincia', BE: 'esta provincia', DK: 'esta región', AT: 'este estado federado (Land)' },
    hubTitle: (c, n) => 'Agricultura por región en ' + c + ': ' + n + ' perfiles', hubH1: c => 'Datos agrarios por región: ' + c, hubLead: (c, n, k) => n + ' ' + k + ' de ' + c + ' con las cifras que publican las fuentes oficiales: cultivos, ganado, renta agraria y más, según lo que exista para cada una.', hubList: 'Todas las regiones', hubOther: 'Otros países', heads: { US: 'Estados', CA: 'Provincias y territorios', ES: 'Comunidades autónomas', FR: 'Regiones', IT: 'Regiones', DE: 'Estados federados', AU: 'Estados y territorios', NL: 'Provincias', BE: 'Provincias', DK: 'Regiones', PL: 'Voivodías', AT: 'Estados federados' } },
  en: { root: 'en/regions', hub: 'Regions', tbl: { drought: 'Drought', crops: 'Crops', cattle: 'Cattle on feed', tax: 'Sales tax', lvst: 'Livestock', inc: 'Farm income', eaa: 'Agricultural accounts', mix: 'Where output comes from', land: 'Land and crops', animals: 'Livestock', farms: 'Farms', exp: 'Agri-food exports' },
    d1: 'Moderate drought or worse', d2: 'Severe or worse', d3: 'Extreme or worse', d4: 'Exceptional', ofArea: 'of the area', asof: 'as of', crop: 'Crop', area: 'Area', yield: 'Yield', prod: 'Production', year: 'Year', conc: 'Item', value: 'Value', yoy: 'Annual change', share: 'Share', unit: 'Unit',
    onfeed: 'On feed', yago: 'A year ago', kh: 'thousand head', rate: 'State rate', nostate: 'No state sales tax', head: 'Inventory', cattleN: 'Cattle', hogsN: 'Hogs', sheepN: 'Sheep', netInc: 'Net income', cashRec: 'Cash receipts (total)', cad: 'M CAD', eur: 'M EUR', prodUnits: 'thousand t', hth: 'thousand ha',
    holdings: 'Holdings', ha: 'Agricultural area (ha)', avg: 'Average size (ha)', sout: 'Standard output (M EUR)', milk: 'Cow’s milk collected (thousand t)', headk: 'thousand head', aud: 'A$ M', noteH: 'How to read these figures', note: 'Figures as each official source publishes them, with their unit. Anything a source does not publish for this region is not filled in or estimated.', cta: 'Open the interactive profile with charts →', mapCta: 'See the map of ', src: 'Sources', lic: 'Licence', gen: 'Page generated on', others: 'Other', ofC: 'of', profile: 'Country profile', pageOf: 'Agriculture in', methodology: 'Methodology', forecast: 'Current-year figures are the source’s forecast.', metodo: 'metodologia.html', home: 'Home',
    title: (r, c, h) => r + ' (' + c + '): agriculture' + (h ? ', ' + h : ''), h1: (r, c) => r + ': farm data and statistics', lead: (r, c, h, k) => 'Official figures for ' + r + ' (' + c + ')' + (h ? ': ' + h : '') + '. This page gathers the farm data published for this ' + k + ' and links to the interactive profile.', kindS: { US: 'state', CA: 'province or territory', ES: 'autonomous community', FR: 'region', IT: 'region', DE: 'federal state (Land)', AU: 'state or territory', NL: 'province', BE: 'province', DK: 'region', AT: 'federal state (Land)' },
    hubTitle: (c, n) => 'Agriculture by region in ' + c + ': ' + n + ' profiles', hubH1: c => 'Farm data by region: ' + c, hubLead: (c, n, k) => n + ' ' + k + ' of ' + c + ' with the figures official sources publish: crops, livestock, farm income and more, depending on what exists for each.', hubList: 'All regions', hubOther: 'Other countries', heads: { US: 'States', CA: 'Provinces and territories', ES: 'Autonomous communities', FR: 'Regions', IT: 'Regions', DE: 'Federal states', AU: 'States and territories', NL: 'Provinces', BE: 'Provinces', DK: 'Regions', PL: 'Voivodeships', AT: 'Federal states' } },
  fr: { root: 'fr/regions', hub: 'Régions', tbl: { drought: 'Sécheresse', crops: 'Cultures', cattle: 'Bovins en engraissement', tax: 'Taxe de vente', lvst: 'Élevage', inc: 'Revenu agricole', eaa: 'Comptes de l’agriculture', mix: 'Origine de la production', land: 'Terres et cultures', animals: 'Élevage', farms: 'Exploitations', exp: 'Exportations agroalimentaires' },
    d1: 'Sécheresse modérée ou pire', d2: 'Grave ou pire', d3: 'Extrême ou pire', d4: 'Exceptionnelle', ofArea: 'de la superficie', asof: 'au', crop: 'Culture', area: 'Superficie', yield: 'Rendement', prod: 'Production', year: 'Année', conc: 'Poste', value: 'Valeur', yoy: 'Variation annuelle', share: 'Part', unit: 'Unité',
    onfeed: 'En engraissement', yago: 'Il y a un an', kh: 'mille têtes', rate: 'Taux de l’État', nostate: 'Pas de taxe de vente d’État', head: 'Effectifs', cattleN: 'Bovins', hogsN: 'Porcins', sheepN: 'Ovins', netInc: 'Revenu net', cashRec: 'Recettes en espèces (total)', cad: 'M CAD', eur: 'M EUR', prodUnits: 'mille t', hth: 'mille ha',
    holdings: 'Exploitations', ha: 'Surface agricole (ha)', avg: 'Taille moyenne (ha)', sout: 'Production standard (M EUR)', milk: 'Lait de vache collecté (mille t)', headk: 'mille têtes', aud: 'M A$', noteH: 'Comment lire ces chiffres', note: 'Chiffres tels que les publie chaque source officielle, avec leur unité. Ce qu’une source ne publie pas pour cette région n’est ni comblé ni estimé.', cta: 'Ouvrir le profil interactif avec graphiques →', mapCta: 'Voir la carte : ', src: 'Sources', lic: 'Licence', gen: 'Page générée le', others: 'Autres', ofC: 'de', profile: 'Profil du pays', pageOf: 'Agriculture : ', methodology: 'Méthodologie', forecast: 'Les chiffres de l’année en cours sont une prévision de la source.', metodo: 'metodologia.html', home: 'Accueil',
    title: (r, c, h) => r + ' (' + c + ') : agriculture' + (h ? ', ' + h : ''), h1: (r, c) => r + ' : données agricoles et statistiques', lead: (r, c, h, k) => 'Chiffres officiels pour ' + r + ' (' + c + ')' + (h ? ' : ' + h : '') + '. Cette page rassemble les données agricoles publiées pour ' + k + ' et renvoie au profil interactif.', kindS: { US: 'cet État', CA: 'cette province ou ce territoire', ES: 'cette communauté autonome', FR: 'cette région', IT: 'cette région', DE: 'ce Land', AU: 'cet État ou territoire', NL: 'cette province', BE: 'cette province', DK: 'cette région', AT: 'ce Land' },
    hubTitle: (c, n) => 'Agriculture par région : ' + c + ', ' + n + ' profils officiels', hubH1: c => 'Données agricoles par région : ' + c, hubLead: (c, n, k) => n + ' ' + k + ' (' + c + ') avec les chiffres publiés par les sources officielles : cultures, élevage, revenu agricole et plus, selon ce qui existe pour chacune.', hubList: 'Toutes les régions', hubOther: 'Autres pays', heads: { US: 'États', CA: 'Provinces et territoires', ES: 'Communautés autonomes', FR: 'Régions', IT: 'Régions', DE: 'Länder', AU: 'États et territoires', NL: 'Provinces', BE: 'Provinces', DK: 'Régions', PL: 'Voïvodies', AT: 'Länder' } },
  it: { root: 'it/regioni', hub: 'Regioni', tbl: { drought: 'Siccità', crops: 'Colture', cattle: 'Bovini in ingrasso', tax: 'Imposta sulle vendite', lvst: 'Allevamento', inc: 'Reddito agricolo', eaa: 'Conti dell’agricoltura', mix: 'Origine della produzione', land: 'Terra e colture', animals: 'Allevamento', farms: 'Aziende agricole', exp: 'Esportazioni agroalimentari' },
    d1: 'Siccità moderata o peggiore', d2: 'Grave o peggiore', d3: 'Estrema o peggiore', d4: 'Eccezionale', ofArea: 'della superficie', asof: 'al', crop: 'Coltura', area: 'Superficie', yield: 'Resa', prod: 'Produzione', year: 'Anno', conc: 'Voce', value: 'Valore', yoy: 'Variazione annua', share: 'Peso', unit: 'Unità',
    onfeed: 'In ingrasso', yago: 'Un anno fa', kh: 'mila capi', rate: 'Aliquota statale', nostate: 'Nessuna imposta statale sulle vendite', head: 'Consistenza', cattleN: 'Bovini', hogsN: 'Suini', sheepN: 'Ovini', netInc: 'Reddito netto', cashRec: 'Ricavi in contanti (totale)', cad: 'M CAD', eur: 'M EUR', prodUnits: 'mila t', hth: 'mila ha',
    holdings: 'Aziende', ha: 'Superficie agricola (ha)', avg: 'Dimensione media (ha)', sout: 'Produzione standard (M EUR)', milk: 'Latte vaccino raccolto (mila t)', headk: 'mila capi', aud: 'M A$', noteH: 'Come leggere queste cifre', note: 'Cifre come le pubblica ogni fonte ufficiale, con la loro unità. Ciò che una fonte non pubblica per questa regione non viene riempito né stimato.', cta: 'Apri il profilo interattivo con i grafici →', mapCta: 'Vedi la mappa: ', src: 'Fonti', lic: 'Licenza', gen: 'Pagina generata il', others: 'Altre', ofC: 'di', profile: 'Profilo del paese', pageOf: 'Agricoltura: ', methodology: 'Metodologia', forecast: 'Le cifre dell’anno in corso sono una previsione della fonte.', metodo: 'metodologia.html', home: 'Home',
    title: (r, c, h) => r + ' (' + c + '): agricoltura' + (h ? ', ' + h : ''), h1: (r, c) => r + ': dati agricoli e statistiche', lead: (r, c, h, k) => 'Cifre ufficiali per ' + r + ' (' + c + ')' + (h ? ': ' + h : '') + '. Questa pagina raccoglie i dati agricoli pubblicati per ' + k + ' e rimanda al profilo interattivo.', kindS: { US: 'questo stato', CA: 'questa provincia o questo territorio', ES: 'questa comunità autonoma', FR: 'questa regione', IT: 'questa regione', DE: 'questo Land', AU: 'questo stato o territorio', NL: 'questa provincia', BE: 'questa provincia', DK: 'questa regione', AT: 'questo Land' },
    hubTitle: (c, n) => 'Agricoltura per regione: ' + c + ', ' + n + ' profili ufficiali', hubH1: c => 'Dati agricoli per regione: ' + c, hubLead: (c, n, k) => n + ' ' + k + ' (' + c + ') con le cifre pubblicate dalle fonti ufficiali: colture, allevamento, reddito agricolo e altro, secondo ciò che esiste per ciascuna.', hubList: 'Tutte le regioni', hubOther: 'Altri paesi', heads: { US: 'Stati', CA: 'Province e territori', ES: 'Comunità autonome', FR: 'Regioni', IT: 'Regioni', DE: 'Länder', AU: 'Stati e territori', NL: 'Province', BE: 'Province', DK: 'Regioni', PL: 'Voivodati', AT: 'Länder' } }
};
const SRC = { US: [['USDA NASS / US Drought Monitor / AMS', 'https://www.nass.usda.gov/']], CA: [['Statistics Canada · Canadian Drought Monitor (AAFC)', 'https://www150.statcan.gc.ca/']], ES: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], FR: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], IT: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], DE: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], NL: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], BE: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], DK: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], PL: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], AT: [['Eurostat (EAA, NUTS)', 'https://ec.europa.eu/eurostat/']], AU: [['Australian Bureau of Statistics (CC BY 4.0)', 'https://www.abs.gov.au/statistics/economy/international-trade']] };
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
    const t = S[lg], B = [], X = {}, st = D.drought && D.drought.states && D.drought.states[r]; let head = null;
    if (st && st.length) { const l = st[st.length - 1]; { const pv = st[st.length - 5], yr = st.slice(-52), mx = yr.reduce((m, q) => q[2] > m[2] ? q : m, yr[0]); X.dr = { v: l[2], date: l[0], prev: pv ? pv[2] : null, prevDate: pv ? pv[0] : null, max: mx[2], maxDate: mx[0], sev: l[3] }; X.m = l[2]; } head = t.d1.toLowerCase() + ' ' + f.nf(l[2], 1) + ' % ' + t.ofArea; B.push({ k: 'drought', cols: [t.conc, t.value], rows: [[t.d1, f.nf(l[2], 1) + ' %'], [t.d2, f.nf(l[3], 1) + ' %'], [t.d3, f.nf(l[4], 1) + ' %'], [t.d4, f.nf(l[5], 1) + ' %']], note: t.asof + ' ' + l[0] }); }
    const by = {}; if (D.crops && D.crops.series) for (const k of Object.keys(D.crops.series)) { const s = D.crops.series[k], i = k.indexOf(' - '), crop = k.slice(0, i), sn = k.slice(i + 3); if (!LBL.crops[crop] || !s.s || !s.s[r]) continue;
      const kind = sn === 'ACRES HARVESTED' ? 'area' : /^YIELD, MEASURED IN/.test(sn) ? 'yield' : /^PRODUCTION, MEASURED IN/.test(sn) && !/\$|PCT/.test(sn) ? 'prod' : null; if (!kind) continue;
      const pts = s.s[r].filter(p => p[1] != null && p[1] > 0); if (!pts.length) continue; (by[crop] = by[crop] || {})[kind] = { pts, unit: sn.replace(/^.*MEASURED IN /, '').toLowerCase() }; }
    const rows = []; for (const c of Object.keys(by)) { const o = by[c]; let yr = 0; for (const k of ['area', 'yield', 'prod']) if (o[k]) yr = Math.max(yr, +o[k].pts[o[k].pts.length - 1][0]); if (yr < 2020) continue;
      const cell = (k, u) => { const e = o[k]; if (!e) return '–'; const p = e.pts[e.pts.length - 1]; return +p[0] !== yr ? '–' : f.nf(p[1]) + ' ' + (u || e.unit); };
      rows.push({ a: o.area && +o.area.pts[o.area.pts.length - 1][0] === yr ? o.area.pts[o.area.pts.length - 1][1] : 0, r: [LBL.crops[c][LI[lg]], cell('area', 'acres'), cell('yield'), cell('prod'), String(yr)] }); }
    rows.sort((a, b) => b.a - a.a); if (rows.length) { const tot = rows.reduce((q, x) => q + x.a, 0); if (rows[0].a > 0 && tot > 0) X.top = { name: rows[0].r[0], a: rows[0].a, unit: 'acres', yr: rows[0].r[4], share: rows[0].a / tot * 100, n: rows.length }; B.push({ k: 'crops', cols: [t.crop, t.area, t.yield, t.prod, t.year], rows: rows.slice(0, 8).map(x => x.r), note: t.forecast }); }
    const rep = D.cof && D.cof.reports && D.cof.reports[D.cof.reports.length - 1], en = NAMES.US[r].split('|')[0], s = rep && (rep.states || []).find(q => q.state === en);
    if (s) X.cof = { cur: s.current, ago: s.yearAgo, date: rep.inventoryDate };
    if (s) B.push({ k: 'cattle', cols: [t.conc, t.value], rows: [[t.onfeed, f.nf(s.current) + ' ' + t.kh], [t.yago, f.nf(s.yearAgo) + ' ' + t.kh]], note: t.asof + ' ' + rep.inventoryDate });
    const tx = D.tax && D.tax.us && D.tax.us.states && D.tax.us.states[r]; if (tx) B.push({ k: 'tax', cols: [t.conc, t.value], rows: [[t.rate, tx.noStateSalesTax ? t.nostate : f.nf(tx.rate, 2) + ' %']], note: '' });
    return { head, B, X };
  },
  CA(r, lg, f) {
    const t = S[lg], B = [], X = {}, p = D.ca && D.ca.provinces && D.ca.provinces[r], dr = D.cadr && D.cadr.provinces && D.cadr.provinces[r]; let head = null;
    if (dr) { const l = dr.v[D.cadr.periods.length - 1]; if (l) { const pv = dr.v[D.cadr.periods.length - 2]; X.dr = { v: l[1], date: D.cadr.periods[D.cadr.periods.length - 1], prev: pv ? pv[1] : null, prevDate: pv ? D.cadr.periods[D.cadr.periods.length - 2] : null, sev: l[2], monthly: true }; X.m = l[1]; head = t.d1.toLowerCase() + ' ' + f.nf(l[1], 1) + ' % ' + t.ofArea; B.push({ k: 'drought', cols: [t.conc, t.value], rows: [[t.d1, f.nf(l[1], 1) + ' %'], [t.d2, f.nf(l[2], 1) + ' %'], [t.d3, f.nf(l[3], 1) + ' %'], [t.d4, f.nf(l[4], 1) + ' %']], note: t.asof + ' ' + D.cadr.asOf }); } }
    if (p) {
      const rows = []; for (const k of Object.keys(p.crops || {})) { const c = p.crops[k]; const a = lastOf(c.area); if (!a || a[1] <= 0) continue; const pr = atY(c.prod, a[0]), y = atY(c.yield, a[0]); rows.push({ a: a[1], r: [c.name, f.nf(a[1]) + ' ' + t.hth, y != null ? f.nf(y) + ' kg/ha' : '–', pr != null ? f.nf(pr) + ' ' + t.prodUnits : '–', a[0]] }); }
      rows.sort((a, b) => b.a - a.a); if (rows.length) { const tot = rows.reduce((q, x) => q + x.a, 0); if (rows[0].a > 0 && tot > 0) X.top = { name: rows[0].r[0], a: rows[0].a, unit: 'ha', yr: rows[0].r[4], share: rows[0].a / tot * 100, n: rows.length }; B.push({ k: 'crops', cols: [t.crop, t.area, t.yield, t.prod, t.year], rows: rows.slice(0, 8).map(x => x.r), note: t.forecast }); }
      const lv = []; [['cattle', 'total-cattle', t.cattleN], ['hogs', 'total-hogs', t.hogsN], ['sheep', 'total-sheep', t.sheepN]].forEach(z => { const o = p[z[0]] && (p[z[0]][z[1]] || p[z[0]][Object.keys(p[z[0]])[0]]), l = o && lastOf(o.pts); if (l) lv.push([z[2], f.nf(l[1]) + ' ' + t.kh, l[0]]); });
      if (lv.length) B.push({ k: 'lvst', cols: [t.conc, t.value, t.year], rows: lv, note: '' });
      const inc = [], g = (grp, key) => { const o = p[grp] && p[grp][key]; return o && lastOf(o.pts); };
      const ni = g('income', 'net-income-total'), cr = g('receipts', 'total-farm-cash-receipts');
      if (cr) { X.cash = { v: cr[1], y: cr[0], net: ni ? ni[1] : null }; inc.push([t.cashRec, f.nf(cr[1]) + ' ' + t.cad, cr[0]]); if (!head) head = t.cashRec.toLowerCase() + ' ' + f.nf(cr[1]) + ' ' + t.cad + ' (' + cr[0] + ')'; }
      if (ni) inc.push([t.netInc, f.nf(ni[1]) + ' ' + t.cad, ni[0]]);
      if (inc.length) B.push({ k: 'inc', cols: [t.conc, t.value, t.year], rows: inc, note: '' });
    }
    return { head, B, X };
  },
  EU(r, lg, f, c) {
    const t = S[lg], B = [], X = {}, d = D.eu[c], b = d && d.regions && d.regions[r]; if (!b) return { head: null, B, X };
    let head = null; const o = b.eaa || {};
    if (o.AM180000 && lastOf(o.AM180000)[1] > 0) {   // Bruselas-Capital: Eurostat da 0 en todas las partidas de 2023; no es un dato
      const y = lastOf(o.AM180000)[0], g = it => o[it] ? atY(o[it], y) : null, yoy = it => { const a = g(it), p = o[it] ? atY(o[it], y - 1) : null; return a != null && p ? (a / p - 1) * 100 : null; };
      const row = it => { const v = g(it); return v == null ? null : [EL[it][LI[lg]], f.nf(v) + ' ' + t.eur, yoy(it) == null ? '–' : f.pct(yoy(it))]; };
      X.out = { v: g('AM180000'), y, yoy: yoy('AM180000') }; X.m = X.out.v;
      head = EL.AM180000[LI[lg]].toLowerCase() + ' ' + f.nf(g('AM180000')) + ' ' + t.eur + ' (' + y + ')';
      B.push({ k: 'eaa', cols: [t.conc, t.value, t.yoy], rows: ['AM180000', 'AM260000', 'AM320000', 'AM370000'].map(row).filter(Boolean), note: t.year + ' ' + y });
      const base = g('AM160000'), items = ['AM100000', 'AM110000', 'AM120000'], det = ['AM010000', 'AM020000', 'AM030000', 'AM040000', 'AM050000', 'AM060000', 'AM070000', 'AM080000', 'AM111000', 'AM112000', 'AM114000', 'AM115000', 'AM121000', 'AM122000'].map(it => ({ it, v: g(it) })).filter(z => z.v != null && z.v > 0).sort((a, c2) => c2.v - a.v).slice(0, 5);
      const mix = items.map(it => ({ it, v: g(it) })).filter(z => z.v != null && z.v > 0).concat(det).map(z => [EL[z.it][LI[lg]], f.nf(z.v) + ' ' + t.eur, base ? f.nf(z.v / base * 100, 1) + ' %' : '–']);
      if (base) { X.mix = items.map(it => ({ k: it, v: g(it) })).filter(z => z.v != null && z.v > 0).map(z => ({ k: z.k, pct: z.v / base * 100 })); if (det[0]) X.mixTop = { k: det[0].it, pct: det[0].v / base * 100 }; }
      if (base && mix.length) B.push({ k: 'mix', cols: [t.conc, t.value, t.share], rows: mix, note: t.year + ' ' + y });
    }
    const cr = b.crops || {}, land = []; ['UAA', 'ARA', 'J0000'].forEach(k => { const l = cr[k] && lastOf(cr[k].area); if (l) land.push([EC[k][LI[lg]], f.nf(l[1]) + ' ' + t.hth, l[0]]); });
    const cl = Object.keys(cr).filter(k => !['UAA', 'ARA', 'J0000', 'C0000', 'F0000'].includes(k) && EC[k]).map(k => ({ k, l: lastOf(cr[k].area) })).filter(z => z.l && z.l[1] > 0).sort((a, c2) => c2.l[1] - a.l[1]).slice(0, 6);
    cl.forEach(z => { const pr = atY(cr[z.k].prod, z.l[0]); land.push([EC[z.k][LI[lg]] + (pr != null ? ' · ' + f.nf(pr) + ' ' + t.prodUnits : ''), f.nf(z.l[1]) + ' ' + t.hth, z.l[0]]); });
    { const u = cr.UAA && lastOf(cr.UAA.area); if (u) X.uaa = { v: u[1], y: u[0] }; if (cl[0]) X.cropTop = { k: cl[0].k, a: cl[0].l[1], y: cl[0].l[0], uaa: u && u[0] === cl[0].l[0] ? u[1] : null }; }
    if (land.length) B.push({ k: 'land', cols: [t.conc, t.area, t.year], rows: land, note: '' });
    const an = []; ['A2000', 'A2300F', 'A3100', 'A4100', 'A4200'].forEach(k => { const l = b.animals && b.animals[k] && lastOf(b.animals[k]); if (l) an.push([EAN[k][LI[lg]], f.nf(l[1]) + ' ' + t.headk, l[0]]); });
    const ml = b.milk && lastOf(b.milk); if (ml) an.push([t.milk, f.nf(ml[1]), ml[0]]);
    if (an.length) B.push({ k: 'animals', cols: [t.conc, t.value, t.year], rows: an, note: '' });
    const ft = b.farms && b.farms.TOTAL, yy = ft && Object.keys(ft).map(Number).sort((a, c2) => a - c2).pop(), fv = yy && ft[yy];
    if (fv && fv.HLD) { X.farms = { hld: fv.HLD, ha: fv.HA || null, y: yy }; const rr = [[t.holdings, f.nf(fv.HLD, 0), yy]]; if (fv.HA) { rr.push([t.ha, f.nf(fv.HA, 0), yy]); rr.push([t.avg, f.nf(fv.HA / fv.HLD, 1), yy]); } if (fv.EUR) rr.push([t.sout, f.nf(fv.EUR / 1e6, 0), yy]); B.push({ k: 'farms', cols: [t.conc, t.value, t.year], rows: rr, note: '' }); }
    return { head, B, X };
  },
  AU(r, lg, f) {
    const t = S[lg], B = [], X = {}, S0 = D.au && D.au.states, b = S0 && S0[r]; if (!b || !b.agrifood || !b.agrifood.length) return { head: null, B, X };
    const y = lastOf(b.agrifood)[0], tot = (k, yy) => Object.keys(S0).reduce((s, st) => s + ((S0[st][k] && atY(S0[st][k], yy)) || 0), 0), rows = [];
    for (const z of [['agrifood', 'auAll'], ['beef', 'auBeef'], ['sheepmeat', 'auSheep'], ['wheat', 'auWheat'], ['barley', 'auBarley'], ['maize', 'auMaize'], ['oilseeds', 'auOil'], ['cotton', 'auCotton'], ['wool', 'auWool'], ['wine', 'auWine'], ['sugar', 'auSugar'], ['milk', 'auMilk'], ['cheese', 'auCheese'], ['live', 'auLive']]) {
      const v = b[z[0]] && atY(b[z[0]], y); if (v == null || v <= 0) continue; const pv = atY(b[z[0]], y - 1), all = tot(z[0], y);
      rows.push([TAU[lg][z[1]], f.nf(v) + ' ' + t.aud, pv ? f.pct((v / pv - 1) * 100) : '–', all ? f.nf(v / all * 100, 1) + ' %' : '–']); }
    const v0 = atY(b.agrifood, y); X.m = v0; X.y = y; { const pv = atY(b.agrifood, y - 1), allA = tot('agrifood', y); X.ag = { v: v0, yoy: pv ? (v0 / pv - 1) * 100 : null, nat: allA ? v0 / allA * 100 : null }; let best = null; for (const z of ['beef', 'sheepmeat', 'wheat', 'barley', 'maize', 'oilseeds', 'cotton', 'wool', 'wine', 'sugar', 'milk', 'cheese']) { const v = b[z] && atY(b[z], y); if (v > 0 && (!best || v > best.v)) best = { k: z, v }; } if (best && v0 > 0) X.auTop = { k: best.k, share: best.v / v0 * 100, v: best.v }; }
    B.push({ k: 'exp', cols: [t.conc, t.value, t.yoy, t.share], rows, note: t.year + ' ' + y + '. ' + TAU[lg].auNote });
    return { head: TAU[lg].auAll.toLowerCase() + ' ' + f.nf(v0) + ' ' + t.aud + ' (' + y + ')', B, X };
  }
};
const factsOf = (c, r, lg, f) => (c === 'US' ? FACT.US(r, lg, f) : c === 'CA' ? FACT.CA(r, lg, f) : c === 'AU' ? FACT.AU(r, lg, f) : FACT.EU(r, lg, f, c));

/* ---- lectura en prosa: frases que salen SOLO de las cifras de la propia pagina (nada se estima ni se rellena) ---- */
const NT = {
  es: { rkDr: '(1 = la más afectada)', rk: (k, n) => 'puesto ' + k + ' de ' + n, rkIn: h => ' entre ' + h.toLowerCase() + ' con datos', head: 'En pocas palabras',
    dr: (rn, x, f, d) => 'El ' + d(x.date) + ', el ' + f.nf(x.v, 1) + ' % de la superficie de ' + rn + ' estaba en sequía moderada o peor' + (x.prev != null ? ' (el ' + d(x.prevDate) + ' era el ' + f.nf(x.prev, 1) + ' %' + (x.v > x.prev + 0.05 ? ': ha empeorado' : x.v < x.prev - 0.05 ? ': ha mejorado' : ': sin cambios') + ')' : '') + '.',
    drMax: (x, f, d) => 'En las últimas 52 semanas, el máximo fue el ' + f.nf(x.max, 1) + ' %, el ' + d(x.maxDate) + '.', drMon: (x, f, d) => 'Datos mensuales: el valor anterior corresponde a ' + d(x.prevDate) + '.',
    top: (x, f, ha) => 'El cultivo con más superficie de la tabla es ' + x.name.toLowerCase() + ': ' + f.nf(x.a) + ' ' + ha + ' en ' + x.yr + ', el ' + f.nf(x.share, 0) + ' % de la superficie de los ' + x.n + ' cultivos mostrados.',
    cof: (x, f, kh, d, pc) => 'En ganado vacuno en cebaderos hay ' + f.nf(x.cur) + ' ' + kh + ' (' + d(x.date) + '), frente a ' + f.nf(x.ago) + ' hace un año (' + pc + ').',
    cash: (x, f, cur) => 'Los ingresos agrarios en efectivo fueron de ' + f.nf(x.v) + ' ' + cur + ' en ' + x.y + (x.net != null ? ' y la renta neta, de ' + f.nf(x.net) + ' ' + cur : '') + '.',
    out: (rn, x, f, eur, nm, pc) => 'La ' + nm.toLowerCase() + ' de ' + rn + ' alcanzó ' + f.nf(x.v) + ' ' + eur + ' en ' + x.y + (x.yoy != null ? ' (' + pc + ' respecto al año anterior)' : '') + '.',
    mix: (a, tn) => 'Por origen, ' + a.map(z => z.n.toLowerCase() + ' ' + z.p).join(', ') + ' de la producción' + (tn ? '; la partida individual mayor es ' + tn.n.toLowerCase() + ' (' + tn.p + ')' : '') + '.',
    land: (x, f, hth, nmU, nmC, pr) => 'La ' + nmU.toLowerCase() + ' suma ' + f.nf(x.uaa) + ' ' + hth + ' (' + x.uy + ')' + (x.ck ? '; el grupo de cultivo con más superficie es ' + nmC.toLowerCase() + ' (' + f.nf(x.ca) + ' ' + hth + (pr ? ', el ' + pr + ' de la superficie agraria útil' : '') + ').' : '.'),
    farms: (x, f, hth) => 'Hay ' + f.nf(x.hld, 0) + ' explotaciones (' + x.y + ')' + (x.avg != null ? ' con una superficie media de ' + f.nf(x.avg, 1) + ' ha' : '') + '.',
    ag: (rn, x, f, aud, pc, nat) => 'Las exportaciones agroalimentarias de ' + rn + ' fueron de ' + f.nf(x.v) + ' ' + aud + (x.yoy != null ? ' (' + pc + ' respecto al año anterior)' : '') + (nat != null ? ' y suponen el ' + nat + ' del total de los estados y territorios' : '') + '.',
    auTop: (nmP, x, f, aud) => 'El producto que más pesa es ' + nmP.toLowerCase() + ' (' + f.nf(x.v) + ' ' + aud + ', el ' + f.nf(x.share, 0) + ' % de las exportaciones agroalimentarias).', rkMet: { dr: 'superficie en sequía moderada o peor', out: 'producción de la rama agraria', au: 'exportaciones agroalimentarias' }, rkOf: (rn, m, r) => rn + ' ocupa el ' + r + ' en ' + m + '.', src: 'Cifras de la tabla inferior; la fecha de cada dato figura junto a él.' },
  en: { rkDr: '(1 = most affected)', rk: (k, n) => 'rank ' + k + ' of ' + n, rkIn: h => ' among the ' + h.toLowerCase() + ' with data', head: 'In brief',
    dr: (rn, x, f, d) => 'On ' + d(x.date) + ', ' + f.nf(x.v, 1) + ' % of ' + rn + ' was in moderate drought or worse' + (x.prev != null ? ' (on ' + d(x.prevDate) + ' it was ' + f.nf(x.prev, 1) + ' %' + (x.v > x.prev + 0.05 ? ': worse' : x.v < x.prev - 0.05 ? ': better' : ': unchanged') + ')' : '') + '.',
    drMax: (x, f, d) => 'Over the last 52 weeks the peak was ' + f.nf(x.max, 1) + ' %, on ' + d(x.maxDate) + '.', drMon: (x, f, d) => 'Monthly data: the previous value is for ' + d(x.prevDate) + '.',
    top: (x, f, ha) => 'The crop with the largest area in the table is ' + x.name.toLowerCase() + ': ' + f.nf(x.a) + ' ' + ha + ' in ' + x.yr + ', ' + f.nf(x.share, 0) + ' % of the area of the ' + x.n + ' crops shown.',
    cof: (x, f, kh, d, pc) => 'Cattle on feed stand at ' + f.nf(x.cur) + ' ' + kh + ' (' + d(x.date) + '), against ' + f.nf(x.ago) + ' a year earlier (' + pc + ').',
    cash: (x, f, cur) => 'Farm cash receipts were ' + f.nf(x.v) + ' ' + cur + ' in ' + x.y + (x.net != null ? ' and net income ' + f.nf(x.net) + ' ' + cur : '') + '.',
    out: (rn, x, f, eur, nm, pc) => 'Agricultural industry output in ' + rn + ' reached ' + f.nf(x.v) + ' ' + eur + ' in ' + x.y + (x.yoy != null ? ' (' + pc + ' on the previous year)' : '') + '.',
    mix: (a, tn) => 'By origin, ' + a.map(z => z.n.toLowerCase() + ' ' + z.p).join(', ') + ' of output' + (tn ? '; the largest single item is ' + tn.n.toLowerCase() + ' (' + tn.p + ')' : '') + '.',
    land: (x, f, hth, nmU, nmC, pr) => 'Utilised agricultural area totals ' + f.nf(x.uaa) + ' ' + hth + ' (' + x.uy + ')' + (x.ck ? '; the crop group with the most land is ' + nmC.toLowerCase() + ' (' + f.nf(x.ca) + ' ' + hth + (pr ? ', ' + pr + ' of utilised agricultural area' : '') + ').' : '.'),
    farms: (x, f, hth) => 'There are ' + f.nf(x.hld, 0) + ' holdings (' + x.y + ')' + (x.avg != null ? ' with an average area of ' + f.nf(x.avg, 1) + ' ha' : '') + '.',
    ag: (rn, x, f, aud, pc, nat) => 'Agri-food exports from ' + rn + ' were ' + f.nf(x.v) + ' ' + aud + (x.yoy != null ? ' (' + pc + ' on the previous year)' : '') + (nat != null ? ' and make up ' + nat + ' of the total for all states and territories' : '') + '.',
    auTop: (nmP, x, f, aud) => 'The heaviest product is ' + nmP.toLowerCase() + ' (' + f.nf(x.v) + ' ' + aud + ', ' + f.nf(x.share, 0) + ' % of agri-food exports).', rkMet: { dr: 'area in moderate drought or worse', out: 'agricultural output', au: 'agri-food exports' }, rkOf: (rn, m, r) => rn + ' is at ' + r + ' for ' + m + '.', src: 'Figures from the tables below; each value carries its own date.' },
  fr: { rkDr: '(1 = la plus touchée)', rk: (k, n) => 'rang ' + k + ' sur ' + n, rkIn: h => ' parmi les ' + h.toLowerCase() + ' avec données', head: 'En bref',
    dr: (rn, x, f, d) => 'Le ' + d(x.date) + ', ' + f.nf(x.v, 1) + ' % de la superficie de ' + rn + ' était en sécheresse modérée ou pire' + (x.prev != null ? ' (le ' + d(x.prevDate) + ', ' + f.nf(x.prev, 1) + ' %' + (x.v > x.prev + 0.05 ? ' : en aggravation' : x.v < x.prev - 0.05 ? ' : en amélioration' : ' : stable') + ')' : '') + '.',
    drMax: (x, f, d) => 'Sur les 52 dernières semaines, le maximum a été de ' + f.nf(x.max, 1) + ' %, le ' + d(x.maxDate) + '.', drMon: (x, f, d) => 'Données mensuelles : la valeur précédente date du ' + d(x.prevDate) + '.',
    top: (x, f, ha) => 'La culture qui occupe le plus de surface dans le tableau est ' + x.name.toLowerCase() + ' : ' + f.nf(x.a) + ' ' + ha + ' en ' + x.yr + ', soit ' + f.nf(x.share, 0) + ' % de la surface des ' + x.n + ' cultures présentées.',
    cof: (x, f, kh, d, pc) => 'Les bovins en engraissement sont au nombre de ' + f.nf(x.cur) + ' ' + kh + ' (' + d(x.date) + '), contre ' + f.nf(x.ago) + ' un an plus tôt (' + pc + ').',
    cash: (x, f, cur) => 'Les recettes agricoles en espèces ont atteint ' + f.nf(x.v) + ' ' + cur + ' en ' + x.y + (x.net != null ? ' et le revenu net ' + f.nf(x.net) + ' ' + cur : '') + '.',
    out: (rn, x, f, eur, nm, pc) => 'La ' + nm.toLowerCase() + ' de ' + rn + ' a atteint ' + f.nf(x.v) + ' ' + eur + ' en ' + x.y + (x.yoy != null ? ' (' + pc + ' sur un an)' : '') + '.',
    mix: (a, tn) => 'Par origine, ' + a.map(z => z.n.toLowerCase() + ' ' + z.p).join(', ') + ' de la production' + (tn ? ' ; le poste individuel le plus important est ' + tn.n.toLowerCase() + ' (' + tn.p + ')' : '') + '.',
    land: (x, f, hth, nmU, nmC, pr) => 'La ' + nmU.toLowerCase() + ' totalise ' + f.nf(x.uaa) + ' ' + hth + ' (' + x.uy + ')' + (x.ck ? ' ; le groupe de cultures le plus étendu est ' + nmC.toLowerCase() + ' (' + f.nf(x.ca) + ' ' + hth + (pr ? ', soit ' + pr + ' de la surface agricole utilisée' : '') + ').' : '.'),
    farms: (x, f, hth) => 'On compte ' + f.nf(x.hld, 0) + ' exploitations (' + x.y + ')' + (x.avg != null ? ' d’une superficie moyenne de ' + f.nf(x.avg, 1) + ' ha' : '') + '.',
    ag: (rn, x, f, aud, pc, nat) => 'Les exportations agroalimentaires de ' + rn + ' ont atteint ' + f.nf(x.v) + ' ' + aud + (x.yoy != null ? ' (' + pc + ' sur un an)' : '') + (nat != null ? ' et représentent ' + nat + ' du total des États et territoires' : '') + '.',
    auTop: (nmP, x, f, aud) => 'Le produit le plus lourd est ' + nmP.toLowerCase() + ' (' + f.nf(x.v) + ' ' + aud + ', ' + f.nf(x.share, 0) + ' % des exportations agroalimentaires).', rkMet: { dr: 'superficie en sécheresse modérée ou pire', out: 'production agricole', au: 'exportations agroalimentaires' }, rkOf: (rn, m, r) => rn + ' se classe au ' + r + ' pour ' + m + '.', src: 'Chiffres des tableaux ci-dessous ; chaque valeur porte sa propre date.' },
  it: { rkDr: '(1 = la più colpita)', rk: (k, n) => 'posizione ' + k + ' su ' + n, rkIn: h => ' tra le ' + h.toLowerCase() + ' con dati', head: 'In breve',
    dr: (rn, x, f, d) => 'Il ' + d(x.date) + ', il ' + f.nf(x.v, 1) + ' % della superficie di ' + rn + ' era in siccità moderata o peggiore' + (x.prev != null ? ' (il ' + d(x.prevDate) + ' era il ' + f.nf(x.prev, 1) + ' %' + (x.v > x.prev + 0.05 ? ': in peggioramento' : x.v < x.prev - 0.05 ? ': in miglioramento' : ': invariato') + ')' : '') + '.',
    drMax: (x, f, d) => 'Nelle ultime 52 settimane il massimo è stato del ' + f.nf(x.max, 1) + ' %, il ' + d(x.maxDate) + '.', drMon: (x, f, d) => 'Dati mensili: il valore precedente è del ' + d(x.prevDate) + '.',
    top: (x, f, ha) => 'La coltura con più superficie nella tabella è ' + x.name.toLowerCase() + ': ' + f.nf(x.a) + ' ' + ha + ' nel ' + x.yr + ', il ' + f.nf(x.share, 0) + ' % della superficie delle ' + x.n + ' colture mostrate.',
    cof: (x, f, kh, d, pc) => 'I bovini in ingrasso sono ' + f.nf(x.cur) + ' ' + kh + ' (' + d(x.date) + '), contro ' + f.nf(x.ago) + ' un anno prima (' + pc + ').',
    cash: (x, f, cur) => 'I ricavi agricoli in contanti sono stati di ' + f.nf(x.v) + ' ' + cur + ' nel ' + x.y + (x.net != null ? ' e il reddito netto di ' + f.nf(x.net) + ' ' + cur : '') + '.',
    out: (rn, x, f, eur, nm, pc) => 'La ' + nm.toLowerCase() + ' di ' + rn + ' ha raggiunto ' + f.nf(x.v) + ' ' + eur + ' nel ' + x.y + (x.yoy != null ? ' (' + pc + ' sull’anno precedente)' : '') + '.',
    mix: (a, tn) => 'Per origine, ' + a.map(z => z.n.toLowerCase() + ' ' + z.p).join(', ') + ' della produzione' + (tn ? '; la voce singola più grande è ' + tn.n.toLowerCase() + ' (' + tn.p + ')' : '') + '.',
    land: (x, f, hth, nmU, nmC, pr) => 'La ' + nmU.toLowerCase() + ' ammonta a ' + f.nf(x.uaa) + ' ' + hth + ' (' + x.uy + ')' + (x.ck ? '; il gruppo di colture più esteso è ' + nmC.toLowerCase() + ' (' + f.nf(x.ca) + ' ' + hth + (pr ? ', il ' + pr + ' della superficie agricola utilizzata' : '') + ').' : '.'),
    farms: (x, f, hth) => 'Ci sono ' + f.nf(x.hld, 0) + ' aziende (' + x.y + ')' + (x.avg != null ? ' con una superficie media di ' + f.nf(x.avg, 1) + ' ha' : '') + '.',
    ag: (rn, x, f, aud, pc, nat) => 'Le esportazioni agroalimentari di ' + rn + ' sono state di ' + f.nf(x.v) + ' ' + aud + (x.yoy != null ? ' (' + pc + ' sull’anno precedente)' : '') + (nat != null ? ' e valgono il ' + nat + ' del totale di stati e territori' : '') + '.',
    auTop: (nmP, x, f, aud) => 'Il prodotto più pesante è ' + nmP.toLowerCase() + ' (' + f.nf(x.v) + ' ' + aud + ', il ' + f.nf(x.share, 0) + ' % delle esportazioni agroalimentari).', rkMet: { dr: 'superficie in siccità moderata o peggiore', out: 'produzione agricola', au: 'esportazioni agroalimentari' }, rkOf: (rn, m, r) => rn + ' è alla ' + r + ' per ' + m + '.', src: 'Cifre delle tabelle sottostanti; ogni valore riporta la propria data.' }
};
const AUK = { beef: 'auBeef', sheepmeat: 'auSheep', wheat: 'auWheat', barley: 'auBarley', maize: 'auMaize', oilseeds: 'auOil', cotton: 'auCotton', wool: 'auWool', wine: 'auWine', sugar: 'auSugar', milk: 'auMilk', cheese: 'auCheese' };
// X (datos en bruto de factsOf) -> lista de frases. rank = {k, n, metric} dentro del pais (solo regiones con datos)
function narr(c, r, lg, F, rank, rn) {
  const X = F.X || {}, t = S[lg], n = NT[lg], f = mk(lg), o = [], mo = (lg === 'es' ? ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] : lg === 'en' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : lg === 'fr' ? ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] : ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']);
  const d = iso => { const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(iso || ''); return m ? (m[3] ? (lg === 'en' ? mo[+m[2] - 1] + ' ' + +m[3] + ', ' : +m[3] + ' ' + mo[+m[2] - 1] + ' ') + m[1] : mo[+m[2] - 1] + ' ' + m[1]) : String(iso); };
  const ha = t.hth;
  if (X.dr) { o.push(n.dr(rn, X.dr, f, d)); if (!X.dr.monthly && X.dr.max != null) o.push(n.drMax(X.dr, f, d)); }
  if (X.top) o.push(n.top(X.top, f, X.top.unit === 'acres' ? 'acres' : ha));
  if (X.cof) o.push(n.cof(X.cof, f, t.kh, d, f.pct((X.cof.cur / X.cof.ago - 1) * 100)));
  if (X.cash) o.push(n.cash(X.cash, f, t.cad));
  if (X.out) o.push(n.out(rn, X.out, f, t.eur, EL.AM180000[LI[lg]], X.out.yoy != null ? f.pct(X.out.yoy) : ''));
  if (X.mix && X.mix.length) o.push(n.mix(X.mix.map(z => ({ n: EL[z.k][LI[lg]], p: f.nf(z.pct, 0) + ' %' })), X.mixTop ? { n: EL[X.mixTop.k][LI[lg]], p: f.nf(X.mixTop.pct, 0) + ' %' } : null));
  if (X.uaa) o.push(n.land({ uaa: X.uaa.v, uy: X.uaa.y, ck: X.cropTop && X.cropTop.k, ca: X.cropTop && X.cropTop.a }, f, ha, EC.UAA[LI[lg]], X.cropTop ? EC[X.cropTop.k][LI[lg]] : '', X.cropTop && X.cropTop.uaa ? f.nf(X.cropTop.a / X.cropTop.uaa * 100, 0) + ' %' : ''));
  if (X.farms) o.push(n.farms({ hld: X.farms.hld, y: X.farms.y, avg: X.farms.ha ? X.farms.ha / X.farms.hld : null }, f, ha));
  if (X.ag) { o.push(n.ag(rn, X.ag, f, t.aud, X.ag.yoy != null ? f.pct(X.ag.yoy) : '', X.ag.nat != null ? f.nf(X.ag.nat, 1) + ' %' : null)); if (X.auTop) o.push(n.auTop(TAU[lg][AUK[X.auTop.k]], X.auTop, f, t.aud)); }
  if (rank && rank.n >= 3) o.push(n.rkOf(rn, n.rkMet[rank.metric] + n.rkIn(t.heads[c] || ''), n.rk(rank.k, rank.n)) + (rank.metric === 'dr' ? ' ' + n.rkDr : ''));
  return o;
}
/* ---- paginas ---- */
const STATIC = {};   // c -> region -> 'pais/slug' de la pagina estatica en espanol (el seo-gate quita las que quedan en noindex)
const urlR = (lg, c, slug) => SITE + '/' + S[lg].root + '/' + CSLUG[c][LI[lg]] + '/' + (slug ? slug + '/' : '');
const upOf = (lg, depth) => '../'.repeat((lg === 'es' ? 2 : 3) + depth);
const head = (lg, title, desc, url, alts, ld, up) => `<!doctype html>
<html lang="${lg}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(seoDesc(desc))}">
<link rel="canonical" href="${url}">
${alts}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(seoDesc(desc))}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Dehesa Index">${socialMeta(lg)}
<link rel="icon" href="${up}assets/icon-192.png">
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
<script>try{if(!localStorage.getItem('dehesaIndexLang'))localStorage.setItem('dehesaIndexLang','${lg}')}catch(e){}</script>
<script src="${up}js/shared.js?v=20260929-context-fix"></script>
<script>if(window.DehesaShared&&window.DehesaShared.init)window.DehesaShared.init('informacion');</script>
</body>
</html>
`;
/* Mismo orden de bloques que la ficha interactiva (js/region.js, RANK): costes, produccion (cuentas, cultivos, ganado, explotaciones), clima y comercio. */
const BRANK = { tax: 23, eaa: 30, inc: 32, mix: 33, land: 40, crops: 40, lvst: 50, cattle: 50, animals: 50, farms: 60, drought: 80, exp: 90 };
const table = (cols, rows) => '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-bottom:12px"><table style="border-collapse:collapse;width:100%;min-width:420px;font-size:14px"><thead><tr>' + cols.map((h, i) => '<th scope="col" style="text-align:' + (i ? 'right' : 'left') + ';padding:8px 6px;font-size:11px">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map((v, i) => i ? '<td style="text-align:right;padding:8px 6px">' + esc(v) + '</td>' : '<th scope="row" style="text-align:left;padding:8px 6px;font-weight:600">' + esc(v) + '</th>').join('') + '</tr>').join('') + '</tbody></table></div>';
// regiones por pais
const REG = {};
for (const c of CORDER) { const w = {}; vm.runInNewContext(read('vendor/' + MAPF[c] + '.js'), { window: w }); REG[c] = w[MAPG[c]].states.map(s => s.id).filter(id => NAMES[c][id]); }
const out = [], urls = [], summary = {};
for (const c of CORDER) {
  // lista de regiones con datos (se decide con es; el conjunto es el mismo en todos los idiomas)
  const has = REG[c].filter(r => factsOf(c, r, 'es', mk('es')).B.length);
  const RK = {}; { const mv = has.map(r => [r, (factsOf(c, r, 'es', mk('es')).X || {}).m]).filter(z => z[1] != null).sort((a, b) => b[1] - a[1]); mv.forEach((z, i) => { RK[z[0]] = { k: i + 1, n: mv.length, metric: c === 'AU' ? 'au' : c === 'US' || c === 'CA' ? 'dr' : 'out' }; }); }
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
      const headT = (F.head || '').replace(' ' + t.ofArea, '').replace(/\s*\((?:\d{4}|[^)]*\d{4}[^)]*)\)\s*$/, '');
      const title = seoTitle(t.title(rn, cname, t.title(rn, cname, headT).length <= 62 ? headT : '')), top = F.B[0];   // titulo <= ~62 caracteres (Google recorta mas): la cifra destacada va en la descripcion
      const desc = (t.lead(rn, cname, F.head, t.kindS[c]) + ' ' + F.B.map(b => t.tbl[b.k]).join(', ') + '.').slice(0, 300);
      const alt = alts(l2 => urlR(l2, c, slugify(nm(c, r, l2))));
      if (lg === 'es') (STATIC[c] = STATIC[c] || {})[r] = CSLUG[c][LI.es] + '/' + slugify(nm(c, r, 'es'));
      const ld = { '@context': 'https://schema.org', '@graph': [
        { '@type': 'Dataset', name: t.pageOf + ' ' + rn + ' (' + cname + ')', description: desc, url, inLanguage: lg, isAccessibleForFree: true, dateModified: lastDay, spatialCoverage: { '@type': 'Place', name: rn + ', ' + cname }, creator: { '@type': 'Organization', name: 'Dehesa Index', url: SITE }, isBasedOn: SRC[c].map(s => s[1]) },
        { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Dehesa Index', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: cname, item: urlR(lg, c) }, { '@type': 'ListItem', position: 3, name: rn, item: url }] }] };
      let h = head(lg, title, desc, url, alt, ld, up);
      h += '    <div class="di-page-head"><h1>' + esc(t.h1(rn, cname)) + '</h1><p>' + esc(t.lead(rn, cname, F.head, t.kindS[c])) + '</p></div>\n';
      { const NR = narr(c, r, lg, F, RK[r], rn); if (NR.length >= 2) h += '    <h2 style="font-size:17px;margin:18px 0 6px">' + esc(NT[lg].head) + '</h2>\n    <p>' + NR.map(esc).join(' ') + '</p>\n    <p class="di-movers-hint" style="margin:-4px 0 8px">' + esc(NT[lg].src) + '</p>\n'; }
      for (const b of F.B.map((x, i) => [x, i]).sort((a, c) => (BRANK[a[0].k] ?? 65) - (BRANK[c[0].k] ?? 65) || a[1] - c[1]).map(x => x[0])) h += '    <h2 style="font-size:17px;margin:18px 0 6px">' + esc(t.tbl[b.k]) + '</h2>\n    ' + table(b.cols, b.rows) + (b.note ? '\n    <p class="di-movers-hint" style="margin:-4px 0 8px">' + esc(b.note) + '</p>' : '') + '\n';
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
fs.writeFileSync('regiones/mapa-estaticas.js', '/* generado por scripts/build-region-pages.mjs (y filtrado por seo-gate.mjs): paginas de region estaticas e indexables; region.js las usa como canonical de region.html?c=&r= */\nwindow.DehesaRegionStatic = ' + JSON.stringify(STATIC) + ';\n');
console.log('paginas de region', urls.length, JSON.stringify(summary));
