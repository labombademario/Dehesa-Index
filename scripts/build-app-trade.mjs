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
function build(cc, d, meta) {
  const pr = d.reporters && d.reporters[cc]; if (!pr) return null;
  const years = meta.years, i = years.length - 1, ys = String(years[i]);
  let keys = Object.keys(pr).filter(k => k !== '0');
  keys = keys.filter(k => !keys.some(j => j.length < k.length && k.indexOf(j) === 0));
  const lab = k => { const p = pr[k], o = {}; for (const l of LG) o[l] = ((p.nm && p.nm[l]) || (PL && PL(k, l)) || cap(p.name)).replace(/\s*\(HS \d+\)$/, ''); return o; };
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
const sec = J('data/trade-sections.json'), idx = { schemaVersion: 1, countries: {} };
const ccs = new Set(fs.readdirSync(path.join(ROOT, 'data/views/trade-products')).filter(f => /^[A-Z]{2}\.json$/.test(f)).map(f => f.slice(0, 2)));
if (sec && sec.meta) Object.keys(sec.meta).forEach(c => ccs.add(c));
for (const cc of [...ccs].sort()) {
  const d = J('data/views/trade-products/' + cc + '.json');
  let b = d && d.years ? build(cc, d, { years: d.years, unit: d.unit, source: d.source }) : null;
  if (!b && sec && sec.meta && sec.meta[cc]) b = build(cc, sec, sec.meta[cc]);
  if (!b) continue;
  const doc = { schemaVersion: 1, country: cc, blocks: [b] }, txt = JSON.stringify(doc);
  fs.writeFileSync(path.join(OUT, cc + '.json'), txt);
  idx.countries[cc] = { hash: crypto.createHash('sha1').update(txt).digest('hex').slice(0, 12) };
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(idx));
console.log('app/v1/trade: ' + Object.keys(idx.countries).length + ' paises');
