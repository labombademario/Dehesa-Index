// Genera scripts/search-bench.json: miles de preguntas al buscador con el DESTINO esperado (lo que abre Enter).
// La respuesta correcta sale de los datos publicados (índice, catálogos de país, precios, balances, precios locales),
// nunca del propio buscador: así la batería mide si el buscador lleva al dato que existe.
//   node scripts/gen-search-bench.mjs           -> escribe scripts/search-bench.json
// Categorías: prod (producto solo), typo (con erratas), cprice (producto + país), region (producto + UE/EE. UU./Canadá/R. Unido),
// country (país solo), local (grano + estado de EE. UU.), supply (producción/exportaciones/existencias), page (páginas y secciones), cal (calendario).
import fs from 'fs'; import path from 'path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), D = p => path.join(ROOT, 'data', p);
const J = p => JSON.parse(fs.readFileSync(D(p), 'utf8'));
const LANGS = ['es', 'en', 'fr', 'it'];
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();
const deacc = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
const idx = J('search-index.json').entries;
const out = [];
const add = (cat, q, lang, exp) => out.push({ cat, q, lang, exp });

/* ---------- 1. producto solo: el nombre publicado del producto, con 6 formas de preguntar ---------- */
const TPL = {
  es: ['precio de {p}', '{p}', 'a cuánto está {p}', '{p} hoy', 'cotización {p}', 'último precio de {p}'],
  en: ['{p} price', '{p}', 'how much is {p}', '{p} today', 'price of {p}', 'latest {p} price'],
  fr: ['prix de {p}', '{p}', 'combien coûte {p}', '{p} aujourd’hui', 'cours {p}', 'dernier prix {p}'],
  it: ['prezzo di {p}', '{p}', 'quanto costa {p}', '{p} oggi', 'quotazione {p}', 'ultimo prezzo {p}']
};
const prods = idx.filter(e => e.t === 'product');
const slugOf = e => { const m = /product=([^&]+)/.exec(e.u); if (m) return decodeURIComponent(m[1]).split(':')[1]; const p = /[?&]p=([^&]+)/.exec(e.u); return p ? decodeURIComponent(p[1]) : null; };
// «azúcar, precio de la UE» y «azúcar en la UE» se escriben igual: para las variantes regionales (azucar_ue, banana_us) vale también el producto base con su dato de esa región
const prodUrls = e => { const s = slugOf(e), u = [e.u]; if (s) { u.push('producto.html?p=' + encodeURIComponent(s)); const m = /^(.+)_(us|ue|uk|ca)$/.exec(s); if (m && prods.some(x => slugOf(x) === m[1])) u.push('producto.html?p=' + m[1]); } return u; };
for (const l of LANGS) {
  const seen = {}; prods.forEach(e => { const k = norm(e.n[l]); seen[k] = (seen[k] || 0) + 1; });
  for (const e of prods) {
    const nm = String(e.n[l] || '').toLowerCase(); if (!nm || seen[norm(nm)] > 1) continue;
    if (slugOf(e) === 'trigo_duro') continue; // «precio de trigo duro» tiene respuesta propia (tarjetas de varios países, js/answers.js rDurum); el nombre a secas lo cubre search-natural-cases.json
    const urls = prodUrls(e);
    TPL[l].forEach(t => add('prod', t.replace('{p}', nm), l, { urls }));
    // erratas: dos letras centrales intercambiadas en la palabra más larga, y sin tildes
    const ws = nm.split(/\s+/), i = ws.reduce((b, w, k) => w.length > ws[b].length ? k : b, 0), w = ws[i];
    if (w.length >= 6 && /^[a-záéíóúàèìòùâêîôûäëïöüçñ]+$/.test(w)) {
      const k = Math.floor(w.length / 2); const typo = w.slice(0, k) + w[k + 1] + w[k] + w.slice(k + 2);
      if (typo !== w) { const q = ws.slice(); q[i] = typo; add('typo', TPL[l][0].replace('{p}', q.join(' ')), l, { urls }); }
    }
    if (deacc(nm) !== nm) add('typo', TPL[l][1].replace('{p}', deacc(nm)), l, { urls });
  }
}

/* ---------- 2. producto + país: ¿hay una cotización de ese producto en el catálogo del país? ---------- */
// Familias de producto con su nombre de uso común en 4 idiomas y la regla para reconocerlas en las etiquetas de las series
// (las etiquetas vienen en inglés, francés, español o polaco según la fuente). Solo cuentan precios en moneda.
const GN = /flour|harina|farine|farina|\bbran\b|semolina|semoule|straw|paille|paja|silage|ensilage|green maize|fourrage|malt\b|meal\b|tourteau|\bcake\b|\boil\b|huile|aceite|olio/i;
const FAM = [
  ['trigo', { es: 'trigo', en: 'wheat', fr: 'blé', it: 'frumento' }, /\bwheat\b|\bbl[ée]s?\b|\btrigo\b|pszenic|\bspelt\b/i, 'trigo', GN],
  ['maiz', { es: 'maíz', en: 'maize', fr: 'maïs', it: 'mais' }, /\bmaize\b|\bcorn\b|\bma[iï]s\b|\bma[ií]z\b|kukurydz/i, 'maiz', GN],
  ['cebada', { es: 'cebada', en: 'barley', fr: 'orge', it: 'orzo' }, /\bbarley\b|\borge\b|\bcebada\b|j[eę]czmie/i, 'cebada', GN],
  ['avena', { es: 'avena', en: 'oats', fr: 'avoine', it: 'avena' }, /\boats?\b|\bavoine\b|\bavena\b|\bowies/i, 'avena', GN],
  ['centeno', { es: 'centeno', en: 'rye', fr: 'seigle', it: 'segale' }, /\brye\b|\bseigle\b|\bcenteno\b|[zż]yto/i, 'centeno', GN],
  ['colza', { es: 'colza', en: 'rapeseed', fr: 'colza', it: 'colza' }, /rapeseed|canola|\brape\b|\bcolza\b|rzepak/i, 'colza', /\boil\b|huile|aceite|olio|meal\b|tourteau|\bcake\b|harina/i],
  ['soja', { es: 'soja', en: 'soybeans', fr: 'soja', it: 'soia' }, /\bsoy|\bsoja\b/i, 'soja_grano', /\boil\b|huile|aceite|olio|meal\b|tourteau|\bcake\b|harina|farina/i],
  ['girasol', { es: 'girasol', en: 'sunflower', fr: 'tournesol', it: 'girasole' }, /sunflower|tournesol|girasol/i, null],
  ['leche', { es: 'leche', en: 'milk', fr: 'lait', it: 'latte' }, /\bmilk\b|\blait\b|\bleche\b|\blatte\b|\bmleko\b/i, 'leche', /powder|poudre|polvo|lactos|whey|butter|beurre|replacer/i],
  ['vacuno', { es: 'vacuno', en: 'beef', fr: 'bœuf', it: 'manzo' }, /\bcattle\b|\bcows?\b|\bbeef\b|\bbulls?\b|\bsteers?\b|\bheifers?\b|\bbovin|\bvacuno\b|\bvaches?\b|\bveal\b|\bcalf\b|\bcalves\b|\bbœuf|\bboeuf/i, 'vaca', /milk|\blait|leche|latte|mleko|hides?|leather|compound feed|feedingstuff|\bfeed,|pienso|aliment/i],
  ['cerdo', { es: 'cerdo', en: 'pork', fr: 'porc', it: 'maiale' }, /\bpigs?\b|\bpork\b|\bhogs?\b|\bporcs?\b|\bcerdo\b|\bporcino\b|\bswine\b|wieprz|\bpiglets?\b/i, 'cerdo', /lard\b|manteca|compound feed|feedingstuff|\bfeed,|pienso|aliment/i],
  ['cordero', { es: 'cordero', en: 'lamb', fr: 'agneau', it: 'agnello' }, /\blambs?\b|\bagneaux?\b|\bcordero\b|\bagnell/i, 'cordero'],
  ['pollo', { es: 'pollo', en: 'chicken', fr: 'poulet', it: 'pollo' }, /chicken|broiler|poulet|\bpollo\b|kurcz/i, 'pollo', /\beggs?\b|(o|œ)eufs?|huevos|uova|compound feed|feedingstuff|\bfeed,|pienso|aliment/i],
  ['huevos', { es: 'huevos', en: 'eggs', fr: 'œufs', it: 'uova' }, /\beggs?\b|\b(o|œ)eufs?\b|\bhuevos?\b|\buova\b|\bjaj/i, 'huevos'],
  ['arroz', { es: 'arroz', en: 'rice', fr: 'riz', it: 'riso' }, /\brice\b|\briz\b|\barroz\b|\briso\b|\bpaddy\b/i, 'arroz'],
  ['urea', { es: 'urea', en: 'urea', fr: 'urée', it: 'urea' }, /\burea\b|\bur[ée]e\b/i, 'urea'],
  ['oliva', { es: 'aceite de oliva', en: 'olive oil', fr: 'huile d’olive', it: 'olio d’oliva' }, /olive oil|huile d.olive|aceite de oliva|olio d.oliva/i, 'oliva'],
  ['patata', { es: 'patata', en: 'potatoes', fr: 'pommes de terre', it: 'patate' }, /potato|pommes? de terre|\bpatatas?\b|ziemniak/i, null],
  ['mantequilla', { es: 'mantequilla', en: 'butter', fr: 'beurre', it: 'burro' }, /\bbutter\b|\bbeurre\b|mantequilla|\bburro\b|mas[lł]o/i, 'mantequilla'],
  ['queso', { es: 'queso', en: 'cheese', fr: 'fromage', it: 'formaggio' }, /cheese|fromage|\bqueso\b|formaggio|cheddar|emmental|gouda|\bgauda\b/i, null, /head ?cheese/i],
  ['tierra', { es: 'tierra agrícola', en: 'farmland', fr: 'terres agricoles', it: 'terreni agricoli' }, /land (price|rent|sales|rents)|farmland|mean rent|ag land/i, null, null, { inputs: 1, prices: 1, income: 1 }]
];
const PGRP = { quotes: 1, prices_lv: 1, milk: 1, prices: 1, prices_fv: 1, prices_paid: 1 };
const MONEY = /€|\beur\b|eur\/|usd|\$|£|gbp|chf|sek|dkk|pln|huf|czk|ron|bgn|nok|clp|uyu|ars|\bct\b|ct\/|cent|pence|\bp\/kg|kr\//i;
const okSeries = (s, f) => (f[5] || PGRP)[s.group] && s.latest != null && !/index|2020=100|= ?100/i.test((s.unit || '') + ' ' + (s.label || '')) && s.fs !== 'HISTORICAL' && s.fs !== 'DISCONTINUED' && MONEY.test(s.unit || '') && f[2].test(s.label || '') && !(f[4] && f[4].test(s.label || ''));
const CC = fs.readdirSync(D('catalog')).filter(f => /^[A-Z]{2}\.json$/.test(f)).map(f => f.slice(0, 2)).filter(c => !['US', 'CA', 'UK', 'EU'].includes(c));
const ISO = { EL: 'GR' }, dn = {}; LANGS.forEach(l => { dn[l] = new Intl.DisplayNames([l], { type: 'region' }); });
const cname = (cc, l) => dn[l].of(ISO[cc] || cc);
const CTPL = {
  es: ['precio de {p} en {c}', '{p} en {c}', '{p} {c}'],
  en: ['{p} price in {c}', '{c} {p} price', '{p} in {c}'],
  fr: ['prix de {p} en {c}', '{p} {c}', 'prix {p} {c}'],
  it: ['prezzo di {p} in {c}', '{p} {c}', 'prezzo {p} {c}']
};
const cov = {};
for (const cc of CC) {
  const cat = J('catalog/' + cc + '.json');
  for (const f of FAM) {
    const ids = (cat.series || []).filter(s => okSeries(s, f)).map(s => s.id);
    cov[cc + ':' + f[0]] = ids.length;
    // Alemania sin la palabra «precio»: «trigo en Alemania» responde con la cosecha de Destatis (por diseño); vale el perfil de Alemania
    for (const l of LANGS) CTPL[l].forEach(t => add('cprice', t.replace('{p}', f[1][l]).replace('{c}', cname(cc, l)), l, Object.assign(ids.length ? { cc, series: ids } : { cc, none: true }, cc === 'DE' && !/\{p\} (price|prix)|(precio|prix|prezzo)/.test(t) ? { profileOk: true } : {})));
  }
}

/* ---------- 3. producto + región de precios (UE, EE. UU., Canadá, Reino Unido) ---------- */
const RN = { eu: { es: 'la Unión Europea', en: 'the EU', fr: 'l’Union européenne', it: 'Unione europea' }, us: { es: 'Estados Unidos', en: 'the US', fr: 'États-Unis', it: 'Stati Uniti' }, ca: { es: 'Canadá', en: 'Canada', fr: 'Canada', it: 'Canada' }, uk: { es: 'Reino Unido', en: 'the UK', fr: 'Royaume-Uni', it: 'Regno Unito' } };
const RTPL = { es: ['precio de {p} en {r}', '{p} {r}'], en: ['{p} price in {r}', '{p} {r}'], fr: ['prix de {p} en {r}', '{p} {r}'], it: ['prezzo di {p} in {r}', '{p} {r}'] };
for (const r of Object.keys(RN)) {
  const have = new Set(J('prices/latest/' + r + '.json').observations.map(o => o.product));
  for (const f of FAM) { if (!f[3] || !have.has(f[3])) continue;
    for (const l of LANGS) RTPL[l].forEach(t => add('region', t.replace('{p}', f[1][l]).replace('{r}', RN[r][l]), l, { urls: ['producto.html?p=' + f[3]], region: r })); }
}

/* ---------- 4. país solo ---------- */
const PTPL = { es: ['{c}', 'agricultura en {c}', 'datos de {c}'], en: ['{c}', 'agriculture in {c}', '{c} farm data'], fr: ['{c}', 'agriculture en {c}', 'données {c}'], it: ['{c}', 'agricoltura in {c}', 'dati {c}'] };
for (const cc of CC) for (const l of LANGS) PTPL[l].forEach(t => add('country', t.replace('{c}', cname(cc, l)), l, { cc }));

/* ---------- 5. grano + estado de EE. UU. (precios locales) ---------- */
const CROPN = { corn: { es: 'maíz', en: 'corn', fr: 'maïs', it: 'mais' }, soybeans: { es: 'soja', en: 'soybeans', fr: 'soja', it: 'soia' }, wheat: { es: 'trigo', en: 'wheat', fr: 'blé', it: 'frumento' }, sorghum: { es: 'sorgo', en: 'sorghum', fr: 'sorgho', it: 'sorgo' }, barley: { es: 'cebada', en: 'barley', fr: 'orge', it: 'orzo' }, oats: { es: 'avena', en: 'oats', fr: 'avoine', it: 'avena' } };
const SN = { AR: 'Arkansas', CA: 'California', CO: 'Colorado', IA: 'Iowa', IL: 'Illinois', IN: 'Indiana', KS: 'Kansas', KY: 'Kentucky', MD: 'Maryland', MN: 'Minnesota', MO: 'Missouri', MS: 'Mississippi', MT: 'Montana', NC: { es: 'Carolina del Norte', en: 'North Carolina', fr: 'Caroline du Nord', it: 'Carolina del Nord' }, ND: { es: 'Dakota del Norte', en: 'North Dakota', fr: 'Dakota du Nord', it: 'Dakota del Nord' }, NE: 'Nebraska', OH: 'Ohio', OK: 'Oklahoma', PA: { es: 'Pensilvania', en: 'Pennsylvania', fr: 'Pennsylvanie', it: 'Pennsylvania' }, SC: { es: 'Carolina del Sur', en: 'South Carolina', fr: 'Caroline du Sud', it: 'Carolina del Sud' }, SD: { es: 'Dakota del Sur', en: 'South Dakota', fr: 'Dakota du Sud', it: 'Dakota del Sud' }, TN: 'Tennessee', TX: 'Texas', VA: 'Virginia', WY: 'Wyoming' };
const LTPL = { es: ['precio del {p} en {s}', '{p} {s}'], en: ['{p} price in {s}', '{s} {p} cash bids'], fr: ['prix du {p} en {s}', '{p} {s}'], it: ['prezzo del {p} in {s}', '{p} {s}'] };
for (const st of Object.keys(SN)) {
  let files = []; try { files = fs.readdirSync(D('us-cash-bids/' + st)).filter(f => /\.json$/.test(f)).map(f => f.slice(0, -5)); } catch (e) { continue; }
  for (const com of files) { if (!CROPN[com]) continue;
    for (const l of LANGS) { const sname = typeof SN[st] === 'string' ? SN[st] : SN[st][l]; LTPL[l].forEach(t => add('local', t.replace('{p}', CROPN[com][l]).replace('{s}', sname), l, { prefix: 'precios-locales.html?s=' + st })); } }
}

/* ---------- 6. oferta y demanda (balance USDA) ---------- */
const sd = J('supply-demand.json');
const SUPN = { trigo: FAM[0][1], maiz: { es: 'maíz', en: 'corn', fr: 'maïs', it: 'mais' }, arroz: FAM[14][1], cebada: FAM[2][1], soja: FAM[6][1], colza: FAM[5][1], cerdo: FAM[10][1], pollo: FAM[12][1], leche: FAM[8][1], azucar: { es: 'azúcar', en: 'sugar', fr: 'sucre', it: 'zucchero' }, harina_soja: { es: 'harina de soja', en: 'soybean meal', fr: 'tourteau de soja', it: 'farina di soia' }, oliva: FAM[16][1] };
const ATTR = { production: { es: 'producción', en: 'production', fr: 'production', it: 'produzione' }, exports: { es: 'exportaciones', en: 'exports', fr: 'exportations', it: 'esportazioni' }, endingStocks: { es: 'existencias', en: 'stocks', fr: 'stocks', it: 'scorte' }, consumption: { es: 'consumo', en: 'consumption', fr: 'consommation', it: 'consumo' } };
const SCOPE = { world: { es: 'mundial', en: 'world', fr: 'mondiale', it: 'mondiale' }, US: { es: 'en Estados Unidos', en: 'in the United States', fr: 'aux États-Unis', it: 'negli Stati Uniti' }, CN: { es: 'en China', en: 'in China', fr: 'en Chine', it: 'in Cina' }, BR: { es: 'en Brasil', en: 'in Brazil', fr: 'au Brésil', it: 'in Brasile' } };
const KEY = { US: 'United States', CN: 'China', BR: 'Brazil' };
for (const com of sd.commodities) { const nm = SUPN[com.id]; if (!nm) continue; const y = com.latestMarketYear;
  for (const a of Object.keys(ATTR)) for (const sc of Object.keys(SCOPE)) {
    const rec = sc === 'world' ? com.world && com.world[y] : ((com.countries || {})[KEY[sc]] || { years: {} }).years[y];
    if (!rec || typeof rec[a] !== 'number') continue;
    for (const l of LANGS) {
      const q = l === 'en' ? (sc === 'world' ? 'world ' + nm[l] + ' ' + ATTR[a][l] : nm[l] + ' ' + ATTR[a][l] + ' ' + SCOPE[sc][l]) : ATTR[a][l] + ' ' + ({ es: 'de ', fr: 'de ', it: 'di ' }[l]) + nm[l] + ' ' + SCOPE[sc][l];
      add('supply', q, l, { prefix: 'oferta-demanda.html?c=' + com.id });
    }
  }
}

/* ---------- 7. páginas, secciones, categorías y cultivos: el título exacto debe salir primero ---------- */
for (const l of LANGS) {
  const pool = idx.filter(e => ['page', 'section', 'category', 'crop', 'supply', 'climate', 'map'].includes(e.t));
  const seen = {}; idx.forEach(e => { const k = norm(e.n[l]); seen[k] = (seen[k] || 0) + 1; });
  for (const e of pool) { const nm = e.n[l]; if (!nm || seen[norm(nm)] > 1 || norm(nm).length < 4) continue; add('page', nm, l, { urls: [e.u] }); }
}

/* ---------- 8. calendario ---------- */
const CAL = { es: ['cuándo sale el WASDE', 'cuándo se publica el WASDE', 'calendario de informes', 'cuándo sale el cattle on feed', 'cuándo sale el crop progress'], en: ['when is the WASDE', 'next WASDE release', 'report calendar', 'when is cattle on feed released', 'crop progress release date'], fr: ['quand sort le WASDE', 'calendrier des rapports', 'date du prochain WASDE'], it: ['quando esce il WASDE', 'calendario dei rapporti', 'data del prossimo WASDE'] };
for (const l of LANGS) CAL[l].forEach(q => add('cal', q, l, { prefix: 'calendario.html' }));

const cats = {}; out.forEach(c => { cats[c.cat] = (cats[c.cat] || 0) + 1; });
fs.writeFileSync(path.join(ROOT, 'scripts/search-bench.json'), '[\n' + out.map(c => JSON.stringify(c)).join(',\n') + '\n]\n');
console.log(out.length + ' preguntas', JSON.stringify(cats));
const none = Object.entries(cov).filter(([, n]) => !n).length; console.log('producto+país sin cotización en los datos: ' + none + ' de ' + Object.keys(cov).length);
