#!/usr/bin/env node
// data/app/v1/*.json — vistas pequenas y estables para la app movil (iOS y Android). Solo leen ficheros ya publicados en data/:
// no descargan nada ni crean cifras nuevas. Cada valor conserva su sourceId (licencia y cita igual que en la web).
// prices.json · today.json · news.json · countries.json · sections.json · manifest.json
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'app', 'v1');
const LANGS = ['es', 'en', 'fr', 'it'];
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const exists = f => fs.existsSync(path.join(ROOT, f));
const t4 = (es, en, fr, it) => ({ es, en, fr, it });

// Nombres de producto y unidades: la misma fuente que la web (js/data.js), cargada sin navegador
const ctx = { window: {}, document: {}, navigator: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8'), ctx);
const D = ctx.window.DehesaData;
if (!D || !D.NAMES || !D.UNIT_LABELS) throw new Error('app-views: js/data.js no expone NAMES/UNIT_LABELS');

// sourceId canonico del registro de licencias (los alias, como european_commission -> eu_agrifood, se resuelven aqui)
const REG = read('data/license-registry.json').sources, ALIAS = {};
for (const [k, v] of Object.entries(REG)) for (const a of (v.aliases || [])) ALIAS[a] = k;
const canon = id => (REG[id] ? id : ALIAS[id] || id);

// Lugar de cada observacion, sacado de su metodologia publicada (sin inventar): mercado concreto, pais o agregado
const PLACE = {
  'España': t4('España', 'Spain', 'Espagne', 'Spagna'), 'UE': t4('UE', 'EU', 'UE', 'UE'), 'EE. UU.': t4('EE. UU.', 'US', 'États-Unis', 'USA'),
  'Canadá': t4('Canadá', 'Canada', 'Canada', 'Canada'), 'Reino Unido': t4('Reino Unido', 'United Kingdom', 'Royaume-Uni', 'Regno Unito'),
  'Europa': t4('Europa', 'Europe', 'Europe', 'Europa'),
  'Alberta': t4('Alberta (Canadá)', 'Alberta (Canada)', 'Alberta (Canada)', 'Alberta (Canada)'), 'Mundo': t4('Mercado mundial', 'World market', 'Marché mondial', 'Mercato mondiale')
};
function place(o) {
  const m = o.methodology || '';
  const mk = /en el mercado de ([A-ZÁÉÍÓÚÑa-záéíóúñ' -]+) \(España\)/.exec(m);
  if (mk) { const c = mk[1].trim(); return t4(c + ' (España)', c + ' (Spain)', c + ' (Espagne)', c + ' (Spagna)'); }
  if (/Alberta/.test(m)) return PLACE.Alberta;
  if (/Statistics Canada/.test(m) || o.region === 'ca') return PLACE['Canadá'];
  if (/Reino Unido/.test(m) || o.region === 'uk') return PLACE['Reino Unido'];
  if (/agregado de la UE|media de la UE,|Es la media de la UE|varios mercados de la UE|Weighted EU average|EU27/.test(m)) return PLACE.UE;
  if (/ en España/.test(m)) return PLACE['España'];
  if (o.region === 'us') return PLACE['EE. UU.'];
  if (o.product === 'gas_natural') return o.region === 'us' ? PLACE['EE. UU.'] : PLACE.Europa;  // Henry Hub en EE. UU., TTF en Europa
  if (!m && o.region === 'eu') return PLACE.Mundo;  // urea, Brent, gas: referencias internacionales sin metodologia de pais
  return PLACE.UE;
}
function unit(o) {
  const cur = (D.CCY_SYMBOL[o.currency] || (o.currency + ' ')).trim();
  const r = {};
  for (const l of LANGS) { const u = (D.UNIT_LABELS[l] || D.UNIT_LABELS.es)[o.unit] || o.unit; r[l] = cur + '/' + u; }
  return r;
}

// Historico con fechas (data/prices/history/<region>/<producto>.json): 'MM-DD', mes numerico o 'MAR' -> fecha ISO
const MON = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
function isoOf(h) {
  const p = h.period, y = h.year;
  if (typeof p === 'number') return `${y}-${String(p).padStart(2, '0')}`;
  if (/^\d{2}-\d{2}$/.test(p)) return `${y}-${p}`;
  if (MON[String(p).toUpperCase()]) return `${y}-${String(MON[String(p).toUpperCase()]).padStart(2, '0')}`;
  if (/^\d{1,2}$/.test(p)) return `${y}-${String(p).padStart(2, '0')}`;
  return null;
}
const dayNum = iso => Date.parse(iso.length === 7 ? iso + '-15' : iso) / 864e5;
function history(region, product, freq) {
  const f = `data/prices/history/${region}/${product}.json`;
  if (!exists(f)) return { points: [], all: [], yearAgo: null };
  const pts = read(f).history.map(h => [isoOf(h), h.value]).filter(x => x[0] && typeof x[1] === 'number');
  if (!pts.length) return { points: [], all: [], yearAgo: null };
  const last = pts.at(-1), target = dayNum(last[0]) - 365, tol = freq === 'weekly' ? 10 : 20;
  let best = null;
  for (const p of pts) { const dd = Math.abs(dayNum(p[0]) - target); if (dd <= tol && (!best || dd < best.dd)) best = { dd, p }; }
  return { points: pts.slice(freq === 'weekly' ? -52 : -24), all: pts, yearAgo: best ? { date: best.p[0], value: best.p[1] } : null };
}

// 1) Precios verificados de la capa ligera de la web
const prices = [], HIST = {};
for (const region of ['eu', 'us', 'uk', 'ca']) {
  const f = `data/prices/latest/${region}.json`;
  if (!exists(f)) continue;
  for (const o of read(f).observations) {
    if (o.status !== 'verified' || o.value == null || o.currency === 'INDEX') continue;
    const name = {}; let ok = true;
    for (const l of LANGS) { name[l] = (D.NAMES[l] || {})[o.product] || (D.NAMES.es || {})[o.product]; if (!name[l]) ok = false; }
    if (!ok) continue;  // sin nombre en los cuatro idiomas no se muestra
    // El Boletin Petrolero y la EIA miden el gasoleo de automocion en surtidor, con impuestos, no el gasoleo agricola
    if (o.product === 'diesel') Object.assign(name, t4('Gasóleo de automoción (surtidor)', 'Road diesel (pump price)', 'Gazole routier (prix à la pompe)', 'Gasolio per autotrazione (alla pompa)'));
    prices.push({ id: o.id, product: o.product, region, name, place: place(o), unit: unit(o), currency: o.currency, value: o.value,
      changePct: typeof o.changePct === 'number' ? Math.round(o.changePct * 100) / 100 : null, date: o.observationDate, frequency: o.frequency,
      sourceId: canon(o.sourceId), sourceName: (REG[canon(o.sourceId)] || {}).short || (REG[canon(o.sourceId)] || {}).name || canon(o.sourceId), comparability: o.comparability || null, note: o.methodology ? { es: o.methodology } : null,
      ...(() => { const h = history(region, o.product, o.frequency); HIST[o.id] = h.all; return { points: h.points, yearAgo: h.yearAgo }; })() });
  }
}
if (prices.length < 20) throw new Error('app-views: solo ' + prices.length + ' precios verificados; no se publica');

// 2) Hoy: indice, novedades, revisiones y calendario oficial (hora UTC)
const idx = exists('data/dehesa-index.json') ? read('data/dehesa-index.json') : null;
const brief = exists('data/daily-brief.json') ? read('data/daily-brief.json') : null;
function nyToUtc(date, time) {  // hora de Nueva York -> ISO UTC, con el horario de verano que corresponda a ese dia
  const [y, mo, d] = date.split('-').map(Number), [h, mi] = (time || '12:00').split(':').map(Number);
  let guess = Date.UTC(y, mo - 1, d, h + 5, mi);
  for (let i = 0; i < 2; i++) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(guess)).map(x => [x.type, x.value]));
    const shown = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    guess += Date.UTC(y, mo - 1, d, h, mi) - shown;
  }
  return new Date(guess).toISOString().replace('.000Z', 'Z');
}
const today = new Date().toISOString().slice(0, 10);
const cal = exists('data/usda-calendar.json') ? read('data/usda-calendar.json').releases.filter(r => r.date >= today).slice(0, 40).map(r => ({ id: r.id + '-' + r.date, name: r.name, agency: 'USDA ' + r.agency, at: nyToUtc(r.date, r.time) })) : [];
const todayDoc = {
  index: idx ? { value: idx.value, period: idx.lastPeriod, changeMoMPct: idx.changeMoMPct, changeYoYPct: idx.changeYoYPct, base: idx.base } : null,
  newDatasets: brief ? (brief.newDatasets || []).slice(0, 8).map(x => ({ file: x.file, name: x.name, series: x.series })) : [],
  revisions: brief ? (brief.revisions || []).length : 0,
  calendar: cal
};

// 3) Noticias: solo titular, medio, pais, idioma y enlace (el texto esta en la web de cada medio)
const nf = exists('data/views/news-feed.json') ? read('data/views/news-feed.json').items : [];
const news = nf.filter(n => n.h && n.u).slice(0, 40).map(n => ({ id: n.id, title: n.h, source: n.s, country: n.c, lang: n.l, date: n.d, url: n.u, region: n.r }));

// 4) Paises con ficha: nombres del menu de la web (js/shared.js) + cobertura de data/coverage-gaps.json
const sh = fs.readFileSync(path.join(ROOT, 'js', 'shared.js'), 'utf8');
const cov = exists('data/coverage-gaps.json') ? read('data/coverage-gaps.json').countries : {};
const countries = [];
for (const m of sh.matchAll(/cd\('([A-Z]{2})', '([^']+)', '([^']+)', '([^']+)', '([^']+)'\)/g)) {
  const c = cov[m[1]];
  countries.push({ code: m[1], name: t4(m[2], m[3], m[4], m[5]), coveragePct: c ? c.coveredPct : null, url: 'https://dehesaindex.com/paises.html?c=' + m[1] });
}
countries.sort((a, b) => (b.coveragePct ?? -1) - (a.coveragePct ?? -1));
if (countries.length < 10) throw new Error('app-views: no se leyeron los paises del menu');

// 5) Secciones de la web con su dato principal cuando se puede leer de forma fiable; si no, solo el enlace
const W = 'https://dehesaindex.com/';
const sections = [];
const sec = (id, group, name, page, fig) => sections.push(Object.assign({ id, group, name, url: W + page }, fig ? { figure: fig } : {}));
const fig = (value, unit, label, period, sourceId) => ({ value, unit, label, period, sourceId, sourceName: sourceId === 'dehesa' ? 'Dehesa Index' : ((REG[sourceId] || {}).short || (REG[sourceId] || {}).name || sourceId) });
try { const c = read('data/crop-progress.json'), s = c.crops.find(x => x.id === 'corn').seasons[c.lastWeekEnding.slice(0, 4)], last = s.condition.at(-1);
  sec('cultivos', 'production', t4('Estado de los cultivos (EE. UU.)', 'Crop progress (US)', 'État des cultures (É.-U.)', 'Stato delle colture (USA)'), 'cultivos.html',
    fig(last[4] + last[5], '%', t4('Maíz en estado bueno o excelente', 'Corn in good or excellent condition', 'Maïs en bon ou excellent état', 'Mais in condizioni buone o eccellenti'), last[0], 'usda_nass'));
} catch (e) { sec('cultivos', 'production', t4('Estado de los cultivos (EE. UU.)', 'Crop progress (US)', 'État des cultures (É.-U.)', 'Stato delle colture (USA)'), 'cultivos.html'); }
sec('rendimientos', 'production', t4('Rendimientos (EE. UU.)', 'Yields (US)', 'Rendements (É.-U.)', 'Rese (USA)'), 'rendimientos.html');
sec('ganaderia', 'production', t4('Ganadería (EE. UU.)', 'Livestock (US)', 'Élevage (É.-U.)', 'Zootecnia (USA)'), 'ganaderia.html');
try { const sd = read('data/supply-demand.json'), w = sd.commodities.find(x => x.id === 'trigo'), y = String(w.latestMarketYear);
  sec('oferta', 'production', t4('Oferta y demanda mundial', 'World supply and demand', 'Offre et demande mondiales', 'Offerta e domanda mondiale'), 'oferta-demanda.html',
    fig(w.world[y].endingStocks, w.unit, t4('Existencias finales mundiales de trigo', 'World wheat ending stocks', 'Stocks finaux mondiaux de blé', 'Scorte finali mondiali di frumento'), y + '/' + String(+y + 1).slice(2), 'usda_fas_psd'));
} catch (e) { sec('oferta', 'production', t4('Oferta y demanda mundial', 'World supply and demand', 'Offre et demande mondiales', 'Offerta e domanda mondiale'), 'oferta-demanda.html'); }
try { const d = read('data/drought.json'), last = d.us.conus.at(-1);
  sec('sequia', 'production', t4('Sequía', 'Drought', 'Sécheresse', 'Siccità'), 'sequia.html',
    fig(last[2], '%', t4('Superficie de EE. UU. en sequía (D1 o peor)', 'US area in drought (D1 or worse)', 'Surface des É.-U. en sécheresse (D1 ou pire)', 'Superficie USA in siccità (D1 o peggio)'), last[0], 'us_drought_monitor'));
} catch (e) { sec('sequia', 'production', t4('Sequía', 'Drought', 'Sécheresse', 'Siccità'), 'sequia.html'); }
sec('clima', 'production', t4('Clima agrícola', 'Farm weather', 'Météo agricole', 'Meteo agricolo'), 'clima.html');
sec('mapa', 'production', t4('Mapa agrícola', 'Farm map', 'Carte agricole', 'Mappa agricola'), 'mapa.html');
try { const ex = read('data/export-sales.json'), c = ex.commodities.find(x => x.code === 401);
  sec('exportaciones', 'trade', t4('Exportaciones (EE. UU.)', 'Exports (US)', 'Exportations (É.-U.)', 'Esportazioni (USA)'), 'exportaciones.html',
    fig(c.totals.net, 't', t4('Ventas netas semanales de maíz', 'Weekly net corn sales', 'Ventes nettes hebdomadaires de maïs', 'Vendite nette settimanali di mais'), c.weekEnding, 'usda_fas_esr'));
} catch (e) { sec('exportaciones', 'trade', t4('Exportaciones (EE. UU.)', 'Exports (US)', 'Exportations (É.-U.)', 'Esportazioni (USA)'), 'exportaciones.html'); }
sec('aranceles', 'trade', t4('Aranceles', 'Tariffs', 'Droits de douane', 'Dazi'), 'aranceles.html');
try { const g = read('data/canada-grain.json'), w = g.grains.find(x => x.id === 'wheat');
  sec('canada', 'trade', t4('Granos de Canadá', 'Canadian grain', 'Grains du Canada', 'Cereali del Canada'), 'canada-granos.html',
    fig(w.exports.at(-1), t4('miles de t', 'thousand t', 'milliers de t', 'migliaia di t'), t4('Exportaciones semanales de trigo (sin duro)', 'Weekly wheat exports (excl. durum)', 'Exportations hebdomadaires de blé (hors dur)', 'Esportazioni settimanali di frumento (escluso duro)'), g.asOf, 'cgc'));
} catch (e) { sec('canada', 'trade', t4('Granos de Canadá', 'Canadian grain', 'Grains du Canada', 'Cereali del Canada'), 'canada-granos.html'); }
sec('insumos', 'costs', t4('Insumos (EE. UU.)', 'Inputs (US)', 'Intrants (É.-U.)', 'Input (USA)'), 'insumos.html');
sec('costes', 'costs', t4('Costes por cultivo (EE. UU.)', 'Crop costs (US)', 'Coûts par culture (É.-U.)', 'Costi per coltura (USA)'), 'costes.html');
sec('recan', 'costs', t4('Costes y rentas en España (RECAN)', 'Spanish farm costs and incomes (RECAN)', 'Coûts et revenus en Espagne (RECAN)', 'Costi e redditi in Spagna (RECAN)'), 'recan.html');
try { const m = read('data/catalog/manifest.json');
  sec('catalogo', 'data', t4('Catálogo de datos', 'Data catalogue', 'Catalogue de données', 'Catalogo dei dati'), 'catalogo.html',
    fig(m.seriesTotal, t4('series', 'series', 'séries', 'serie'), t4('Series en el catálogo', 'Series in the catalogue', 'Séries dans le catalogue', 'Serie nel catalogo'), today, 'dehesa'));
} catch (e) { sec('catalogo', 'data', t4('Catálogo de datos', 'Data catalogue', 'Catalogue de données', 'Catalogo dei dati'), 'catalogo.html'); }
try { const p = read('data/pipeline-status.json'), s = p.summary, tot = Object.values(s).reduce((a, b) => a + b, 0);
  sec('estado', 'data', t4('Estado de los datos', 'Data status', 'État des données', 'Stato dei dati'), 'status.html',
    fig(s.ok + '/' + tot, t4('procesos al día', 'pipelines up to date', 'traitements à jour', 'processi aggiornati'), t4('Procesos de datos al día', 'Data pipelines up to date', 'Traitements de données à jour', 'Processi di dati aggiornati'), today, 'dehesa'));
} catch (e) { sec('estado', 'data', t4('Estado de los datos', 'Data status', 'État des données', 'Stato dei dati'), 'status.html'); }
sec('observatorio', 'data', t4('Observatorio de datos', 'Data observatory', 'Observatoire des données', 'Osservatorio dei dati'), 'observatorio.html');
sec('metodologia', 'data', t4('Metodología', 'Methodology', 'Méthodologie', 'Metodologia'), 'metodologia.html');
sec('informacion', 'data', t4('Información', 'About', 'Informations', 'Informazioni'), 'informacion.html');

// 6) Ficha de pais: indicadores del catalogo unificado de la web (data/catalog + data/series), una vista pequena por pais que la app baja al abrirlo.
// Solo reordena y recorta lo ya publicado: ninguna cifra nueva, cada serie conserva su sourceId.
const cdSrc = fs.readFileSync(path.join(ROOT, 'js', 'country-data.js'), 'utf8');
const GL = JSON.parse(/var L = (\{.*?\});\n/s.exec(cdSrc)[1]);
const GORDER = vm.runInNewContext(/var GROUPS = (\[.*?\]);/s.exec(cdSrc)[1]);
const PER_GROUP = 8, MAX_POINTS = 24;
// Etiquetas de series en 4 idiomas (data/app/labels-i18n.json, traducidas a mano); si falta una, la app enseña la original
const LABELS = exists('data/app/labels-i18n.json') ? read('data/app/labels-i18n.json') : {};
const profiles = {};
const catMan = exists('data/catalog/manifest.json') ? read('data/catalog/manifest.json') : { countries: {} };
for (const c of countries) {
  const me = catMan.countries[c.code];
  if (!me || !me.summary || !exists('data/catalog/' + c.code + '.json')) continue;
  const cat = read('data/catalog/' + c.code + '.json');
  const byGroup = {};
  for (const sr of cat.series) {
    if (!GL.es[sr.group] || sr.group === 'countries' || sr.group === 'freq' || sr.latest == null || !sr.latestPeriod || !sr.file) continue;
    if (!REG[canon(sr.sourceId)] || REG[canon(sr.sourceId)].status !== 'VERIFIED') continue;
    (byGroup[sr.group] = byGroup[sr.group] || []).push(sr);
  }
  const cache = {};
  const chunk = f => cache[f] || (cache[f] = exists('data/' + f) ? new Map((read('data/' + f).series || []).map(x => [x.id, x])) : new Map());
  const groups = [];
  const gids = GORDER.filter(g => byGroup[g]).concat(Object.keys(byGroup).filter(g => !GORDER.includes(g)));
  for (const g of gids) {
    const seen = new Set(), pick = [];
    // lo mas reciente primero; a igual fecha, la serie con mas historia; sin repetir etiqueta
    for (const sr of byGroup[g].sort((a, b) => (b.latestPeriod > a.latestPeriod ? 1 : b.latestPeriod < a.latestPeriod ? -1 : (b.n || 0) - (a.n || 0)))) {
      if (seen.has(sr.label)) continue; seen.add(sr.label);
      const full = chunk(sr.file).get(sr.id);
      const pts = full && Array.isArray(full.points) ? full.points.filter(x => typeof x[1] === 'number').slice(-MAX_POINTS) : [];
      pick.push({ id: sr.id, label: sr.label, ...(LABELS[sr.label] ? { labelT: LABELS[sr.label] } : {}), unit: sr.unit, frequency: sr.freq, latest: sr.latest, period: sr.latestPeriod, changePct: typeof sr.changePct === 'number' ? Math.round(sr.changePct * 100) / 100 : null,
        sourceId: canon(sr.sourceId), file: sr.file, points: pts });
      if (pick.length >= PER_GROUP) break;
    }
    if (pick.length) groups.push({ id: g, title: t4(GL.es[g], GL.en[g], GL.fr[g], GL.it[g]), total: byGroup[g].length, series: pick });
  }
  if (!groups.length) continue;
  profiles[c.code] = { country: c.code, seriesTotal: me.n || cat.series.length, latestPeriod: me.summary.latestPeriod || null, firstPeriod: me.summary.first || null,
    sources: (me.summary.sources || []).slice(0, 6), sourceNames: {}, groups };
  for (const g of groups) for (const sr of g.series) profiles[c.code].sourceNames[sr.sourceId] = (REG[sr.sourceId].short || REG[sr.sourceId].name || sr.sourceId);
}

// 7) Mapas de pais: contornos de vendor/*.js (Natural Earth, dominio publico) + metricas regionales de data/views/region-metrics.json,
// con los mismos nombres y paletas que la web. La app baja el mapa de un pais al abrirlo.
const sandbox = { window: {}, document: {}, navigator: {}, console, fetch: () => Promise.reject(new Error('no fetch')) };
vm.createContext(sandbox);
for (const f of fs.readdirSync(path.join(ROOT, 'vendor')).filter(x => /\.js$/.test(x) && x !== 'es-provinces.js')) vm.runInContext(fs.readFileSync(path.join(ROOT, 'vendor', f), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'region-names.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'region-metrics.js'), 'utf8'), sandbox);
const MAPVAR = { US: 'DEHESA_US_STATES', CA: 'DEHESA_CA_PROVINCES', AU: 'DEHESA_AU_STATES', ES: 'DEHESA_ES_CCAA', FR: 'DEHESA_FR_REGIONS', IT: 'DEHESA_IT_REGIONS', DE: 'DEHESA_DE_LAENDER',
  NL: 'DEHESA_NL_PROVINCES', AT: 'DEHESA_AT_LAENDER', BE: 'DEHESA_BE_PROVINCES', DK: 'DEHESA_DK_REGIONS', PL: 'DEHESA_PL_VOIVODESHIPS' };
const RM = exists('data/views/region-metrics.json') ? read('data/views/region-metrics.json') : { countries: {} };
const maps = {};
for (const [cc, v] of Object.entries(MAPVAR)) {
  const g = sandbox.window[v], names = sandbox.window.DehesaRegionNames[cc] || {};
  if (!g || !g.states) continue;
  const regions = g.states.map(st => { const a = (names[st.id] || '').split('|'); return a.length === 4 ? { id: st.id, name: t4(a[1], a[0], a[2], a[3]), d: st.d } : null; });
  if (regions.some(r => !r)) throw new Error('app-views: faltan nombres de region en ' + cc);
  const metrics = [];
  for (const m of sandbox.window.DehesaRegionMetrics.list(cc)) {
    const cv = ((RM.countries || {})[cc] || {})[m.id];
    if (!cv || !cv.vals || !Object.keys(cv.vals).length) continue;
    const vals = {}; for (const [k, x] of Object.entries(cv.vals)) if (typeof x === 'number' && isFinite(x) && regions.some(r => r.id === k)) vals[k] = Math.round(x * 1000) / 1000;
    if (!Object.keys(vals).length) continue;
    metrics.push({ id: m.id, label: t4(m.label[1], m.label[0], m.label[2], m.label[3]), unit: m.unit.trim(), dec: m.dec == null ? 0 : m.dec, ramp: m.ramp.join('') === sandbox.window.DehesaRegionMetrics.list('US')[0].ramp.join('') ? 'warm' : 'green', period: cv.period || null, vals });
  }
  maps[cc] = { country: cc, viewBox: g.viewBox, regions, metrics };
}
// Escritura: solo si cambia el contenido (generatedAt fuera del hash) + manifiesto con hash y tamano
fs.mkdirSync(OUT, { recursive: true });
const gen = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const files = { 'prices.json': { prices }, 'today.json': todayDoc, 'news.json': { news }, 'countries.json': { countries }, 'sections.json': { sections } };
const manifest = { schemaVersion: 1, generatedAt: gen, languages: LANGS, files: {} };
for (const [name, body] of Object.entries(files)) {
  const content = JSON.stringify(body);
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  const p = path.join(OUT, name);
  let prev = null; try { prev = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  if (!prev || prev.hash !== hash) fs.writeFileSync(p, JSON.stringify(Object.assign({ schemaVersion: 1, generatedAt: gen, hash }, body)) + '\n');
  manifest.files[name] = { hash, bytes: fs.statSync(p).size };
}
// Historico completo por precio (la app lo baja al abrir un grafico para los rangos 6 meses ... maximo)
const hdir = path.join(OUT, 'history'); fs.mkdirSync(hdir, { recursive: true });
const keep = new Set();
for (const pr of prices) {
  const all = HIST[pr.id] || [];
  if (all.length <= pr.points.length) continue;  // sin mas historia que la ya incluida
  const f = pr.id.replace(/[^A-Za-z0-9_.-]/g, '_') + '.json'; keep.add(f);
  const content = JSON.stringify({ schemaVersion: 1, id: pr.id, points: all }) + '\n';
  const fp = path.join(hdir, f);
  if (!fs.existsSync(fp) || fs.readFileSync(fp, 'utf8') !== content) fs.writeFileSync(fp, content);
}
for (const f of fs.readdirSync(hdir)) if (!keep.has(f)) fs.unlinkSync(path.join(hdir, f));
const cdir = path.join(OUT, 'country'); fs.mkdirSync(cdir, { recursive: true });
manifest.countries = {};
for (const [cc, body] of Object.entries(profiles)) {
  const content = JSON.stringify(body);
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  const p = path.join(cdir, cc + '.json');
  let prev = null; try { prev = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  if (!prev || prev.hash !== hash) fs.writeFileSync(p, JSON.stringify(Object.assign({ schemaVersion: 1, generatedAt: gen, hash }, body)) + '\n');
  manifest.countries[cc] = { hash, bytes: fs.statSync(p).size };
}
const mdir = path.join(OUT, 'map'); fs.mkdirSync(mdir, { recursive: true });
manifest.maps = {};
for (const [cc, body] of Object.entries(maps)) {
  const content = JSON.stringify(body);
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  const p = path.join(mdir, cc + '.json');
  let prev = null; try { prev = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  if (!prev || prev.hash !== hash) fs.writeFileSync(p, JSON.stringify(Object.assign({ schemaVersion: 1, generatedAt: gen, hash }, body)) + '\n');
  manifest.maps[cc] = { hash, bytes: fs.statSync(p).size };
}
const mp = path.join(OUT, 'manifest.json');
let prevM = null; try { prevM = JSON.parse(fs.readFileSync(mp, 'utf8')); } catch (e) {}
if (!prevM || JSON.stringify(prevM.files) !== JSON.stringify(manifest.files) || JSON.stringify(prevM.countries) !== JSON.stringify(manifest.countries) || JSON.stringify(prevM.maps) !== JSON.stringify(manifest.maps)) fs.writeFileSync(mp, JSON.stringify(manifest) + '\n');
console.log('app-views:', prices.length, 'precios ·', cal.length, 'publicaciones ·', news.length, 'noticias ·', countries.length, 'paises ·', sections.filter(s => s.figure).length + '/' + sections.length, 'secciones con dato ·', Object.values(manifest.files).reduce((a, f) => a + f.bytes, 0), 'bytes');
