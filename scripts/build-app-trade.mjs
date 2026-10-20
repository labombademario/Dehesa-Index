// Comercio agroalimentario por producto de cada pais para la app movil -> data/app/v1/trade/<CC>.json y index.json (13-oct-2026).
// Mismos datos y reglas que el bloque «Por producto» del perfil de la web (js/perfil-pais.js, tradeProducts): data/views/trade-products/<CC>.json
// y, para Canada y Argentina, data/trade-sections.json. Sin doble conteo (un subcapitulo no se suma a su capitulo), sin el codigo '0', ultimo periodo.
// Formato: {country, blocks:[{id:'trade', title, asOf, bars:[{title, unit, dec, items:[{label{es,en,fr,it}, value}]}], note, source}]}
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import crypto from 'crypto';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'data/app/v1/trade'); fs.mkdirSync(OUT, { recursive: true });
const LG = ['es', 'en', 'fr', 'it'];
const sb = { window: {}, document: { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, readyState: 'loading' }, navigator: {}, console, fetch: () => Promise.reject(new Error('no fetch')), setTimeout() {} };
vm.createContext(sb); vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/comercio-socios.js'), 'utf8'), sb);
const PL = sb.window.DITradePartners && sb.window.DITradePartners.label;
const J = f => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); } catch { return null; } };
const T = {
  title: { es: 'Comercio agroalimentario por producto', en: 'Agri-food trade by product', fr: 'Commerce agroalimentaire par produit', it: 'Commercio agroalimentare per prodotto' },
  exp: { es: 'Principales productos exportados', en: 'Top exported products', fr: 'Principaux produits exportés', it: 'Principali prodotti esportati' },
  imp: { es: 'Principales productos importados', en: 'Top imported products', fr: 'Principaux produits importés', it: 'Principali prodotti importati' },
  n5: { es: 'Suma de los productos que seguimos (no el total agroalimentario). ', en: 'Sum of the products we track (not total agri-food trade). ', fr: 'Somme des produits que nous suivons (pas le total agroalimentaire). ', it: 'Somma dei prodotti che seguiamo (non il totale agroalimentare). ' },
  n6: { es: 'Incluye el comercio dentro de la UE. ', en: 'Includes trade within the EU. ', fr: 'Inclut le commerce intra-UE. ', it: 'Include il commercio intra-UE. ' },
  n7: { es: 'En Países Bajos y Bélgica una parte importante es tránsito y reexportación. ', en: 'In the Netherlands and Belgium a large share is transit and re-exports. ', fr: 'Aux Pays-Bas et en Belgique, une part importante est du transit et de la réexportation. ', it: 'Nei Paesi Bassi e in Belgio una quota importante è transito e riesportazione. ' },
  ltm: { es: '12 meses hasta ', en: '12 months to ', fr: '12 mois glissants à ', it: '12 mesi a ' },
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
// Emoticonos por producto: los mismos mapas que «Por producto» de la web (js/perfil-pais.js, 19-oct-2026)
const _pp = fs.readFileSync(path.join(ROOT, 'js/perfil-pais.js'), 'utf8');
const EMO_HS = vm.runInNewContext('(' + _pp.match(/var EMO_HS = (\{[^}]*\});/)[1] + ')');
const EMO_RE = vm.runInNewContext(_pp.match(/var EMO_RE = (\[\[.*?\]\]);/)[1]);
const emo = (k, name) => { let e = EMO_HS[String(k).slice(0, 2)]; const nm = String(name || '').toLowerCase(); if (!e || !/^\d/.test(k)) { e = ''; for (const r of EMO_RE) if (r[0].test(nm)) { e = r[1]; break; } } return e ? e + ' ' : ''; };
function build(cc, d, meta) {
  const pr = d.reporters && d.reporters[cc]; if (!pr) return null;
  const years = meta.years, i = years.length - 1, ys = String(years[i]);
  let keys = Object.keys(pr).filter(k => k !== '0');
  keys = keys.filter(k => !keys.some(j => j.length < k.length && k.indexOf(j) === 0));
  const lab = k => { const p = pr[k], o = {}; for (const l of LG) o[l] = emo(k, p.name) + ((p.nm && p.nm[l]) || (PL && PL(k, l)) || cap(p.name)).replace(/\s*\(HS \d+\)$/, ''); return o; };
  const unitRaw = String(meta.unit || ''), eu = /^EUR/.test(unitRaw), cur = unitRaw.replace(/\s*million$/i, '');
  const unitT = {}; for (const l of LG) unitT[l] = ({ es: 'millones de ', en: 'million ', fr: 'millions de ', it: 'milioni di ' })[l] + cur;
  const bars = [];
  for (const [flow, tt] of [['exp', T.exp], ['imp', T.imp]]) {
    const items = keys.map(k => { const n = pr[k][flow]; return { label: lab(k), value: n && n.world ? n.world[i] : null }; }).filter(r => r.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);
    if (items.length >= 3) bars.push({ title: tt, unit: cur ? cur.trim() + ' M' : '', dec: 0, items: items.map(r => ({ label: r.label, value: Math.round(r.value * 10) / 10 })) });
  }
  if (!bars.length) return null;
  const note = {}; for (const l of LG) note[l] = (meta.note ? (meta.note[l] || meta.note.es) + ' ' : T.n5[l] + (eu ? T.n6[l] + (/^(NL|BE)$/.test(cc) ? T.n7[l] : '') : ''));
  const asOf = {}; for (const l of LG) asOf[l] = /^LTM/.test(ys) ? T.ltm[l] + ys.replace(/^LTM\s*/, '') : ys;
  return { id: 'trade', cc, title: T.title, asOf: asOf.es, asOfT: asOf, unitT, bars, note, source: { name: (meta.source && meta.source.name) || '', url: (meta.source && meta.source.url) || '' } };
}
// ---- Socios comerciales (panel «Socios» de la web, js/eu-trade-panel.js): 10 mayores destinos y orígenes; en los países miembros, dentro y fuera de la UE por separado ----
const CL = (await import('node:module')).createRequire(import.meta.url)(path.join(ROOT, 'js/perfil-claro.js'));
const EU27N = ['Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'];
const MEMBERS = new Set(['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'EL', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SK', 'SI']);
const LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
const PT = {
  title: { es: 'Socios comerciales', en: 'Trading partners', fr: 'Partenaires commerciaux', it: 'Partner commerciali' },
  e0: { es: 'A quién vendemos (10 mayores)', en: 'Top 10 destinations', fr: 'Principaux clients (10)', it: 'Principali destinazioni (10)' },
  i0: { es: 'De quién compramos (10 mayores)', en: 'Top 10 origins', fr: 'Principaux fournisseurs (10)', it: 'Principali origini (10)' },
  eo: { es: 'Destinos fuera de la UE', en: 'Destinations outside the EU', fr: 'Clients hors UE', it: 'Destinazioni extra-UE' },
  ei: { es: 'Destinos dentro de la UE', en: 'Destinations inside the EU', fr: 'Clients dans l’UE', it: 'Destinazioni intra-UE' },
  io: { es: 'Orígenes fuera de la UE', en: 'Origins outside the EU', fr: 'Fournisseurs hors UE', it: 'Origini extra-UE' },
  ii: { es: 'Orígenes dentro de la UE', en: 'Origins inside the EU', fr: 'Fournisseurs dans l’UE', it: 'Origini intra-UE' },
  note: { es: 'Productos agroalimentarios (capítulos 01 a 24 del Sistema Armonizado), último año completo y variación frente al anterior.', en: 'Agri-food products (Harmonised System chapters 01 to 24), latest full year and change on the previous year.', fr: 'Produits agroalimentaires (chapitres 01 à 24 du Système harmonisé), dernière année complète et variation sur l’année précédente.', it: 'Prodotti agroalimentari (capitoli 01-24 del Sistema armonizzato), ultimo anno completo e variazione sull’anno precedente.' },
};
const nfm = (v, l) => v.toLocaleString(LOC[l], { maximumFractionDigits: v >= 100 ? 0 : 1 });
function partnersBlock(cc) {
  let S = null, srcName = 'Eurostat Comext';
  const st = J('data/eu-trade-stats.json');
  if (cc !== 'EU' && st && st.countries && st.countries[cc]) S = st.countries[cc].series;
  else { const d = J('data/series/' + cc + '/partners.json'); if (d) S = d.series.map(x => { const p = x.points || [], a = p[p.length - 1], b = p[p.length - 2]; return { group: 'partners', ...x, latest: x.latest != null ? x.latest : a && a[1], latestPeriod: x.latestPeriod || (a && a[0]), changePct: x.changePct !== undefined ? x.changePct : (a && b && b[1] ? Math.round((a[1] / b[1] - 1) * 1000) / 10 : null) }; }); }
  if (!S) return null;
  const base = x => x.label.replace(/^(Exports to|Imports from)\s+/i, '').replace(/:.*$/, '');
  const pick = tag => { let l = S.filter(x => x.group === 'partners' && x.id.indexOf('-' + tag + '-') > -1); const an = l.filter(x => x.frequency === 'annual'); if (an.length) l = an; return l.filter(x => x.latest > 0).sort((a, b) => b.latest - a.latest); };
  const all = { exp: pick('exp'), imp: pick('imp') };
  if (!all.exp.length && !all.imp.length) return null;
  const f0 = all.exp[0] || all.imp[0], unit = /^EUR/.test(f0.unit) ? 'M€' : f0.unit, year = f0.latestPeriod;
  const inEU = x => EU27N.indexOf(base(x)) > -1;
  const mk = (title, list) => {
    const items = list.slice(0, 10).map(x => {
      const n = base(x), fl = CL.flagOf(n), label = {}, sub = {};
      for (const l of LG) { label[l] = (fl ? fl + ' ' : '') + (CL._country(n, l) || n); sub[l] = nfm(x.latest, l) + ' ' + unit + (x.changePct == null ? '' : ' · ' + (x.changePct >= 0 ? '+' : '−') + nfm(Math.abs(x.changePct), l) + ' %'); }
      return { label, value: Math.round(x.latest * 10) / 10, sub };
    });
    return items.length >= 3 ? { title, unit, dec: 0, items } : null;
  };
  const bars = [];
  if (MEMBERS.has(cc)) {
    bars.push(mk(PT.eo, all.exp.filter(x => !inEU(x))), mk(PT.ei, all.exp.filter(inEU)), mk(PT.io, all.imp.filter(x => !inEU(x))), mk(PT.ii, all.imp.filter(inEU)));
  } else bars.push(mk(PT.e0, all.exp), mk(PT.i0, all.imp));
  const bb = bars.filter(Boolean); if (!bb.length) return null;
  return { id: 'partners', cc, title: PT.title, asOf: String(year), bars: bb, note: PT.note, source: { name: srcName, url: 'https://ec.europa.eu/eurostat/comext/newxtweb/' } };
}
const sec = J('data/trade-sections.json'), idx = { schemaVersion: 1, countries: {} };
const ccs = new Set(fs.readdirSync(path.join(ROOT, 'data/views/trade-products')).filter(f => /^[A-Z]{2}\.json$/.test(f)).map(f => f.slice(0, 2)));
if (sec && sec.meta) Object.keys(sec.meta).forEach(c => ccs.add(c));
fs.readdirSync(path.join(ROOT, 'data/series')).filter(c => fs.existsSync(path.join(ROOT, 'data/series', c, 'partners.json'))).forEach(c => ccs.add(c));
for (const cc of [...ccs].sort()) {
  const d = J('data/views/trade-products/' + cc + '.json');
  let b = d && d.years ? build(cc, d, { years: d.years, unit: d.unit, source: d.source }) : null;
  if (!b && sec && sec.meta && sec.meta[cc]) b = build(cc, sec, sec.meta[cc]);
  const pb = partnersBlock(cc), blocks = [b, pb].filter(Boolean);
  if (!blocks.length) continue;
  const doc = { schemaVersion: 1, country: cc, blocks }, txt = JSON.stringify(doc);
  fs.writeFileSync(path.join(OUT, cc + '.json'), txt);
  idx.countries[cc] = { hash: crypto.createHash('sha1').update(txt).digest('hex').slice(0, 12) };
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(idx));
console.log('app/v1/trade: ' + Object.keys(idx.countries).length + ' paises');
