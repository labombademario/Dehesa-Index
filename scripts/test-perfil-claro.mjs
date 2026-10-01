// Perfil de país en claro: traducción controlada de nombres de serie, resumen en lenguaje llano y rango de 5 años.
// Regla: nada inventado. Cada cifra de las frases debe salir de las series de entrada; lo que no se reconoce se deja tal cual.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const C = require('../js/perfil-claro.js');
let fail = 0; const bad = m => { fail++; console.log('FALLA', m); };
const eq = (a, b, m) => { if (a !== b) bad(m + ': «' + a + '» != «' + b + '»'); };
// traducción
eq(C.tl('Exports to France: agri-food, HS 01-24 (annual)', 'es'), 'Exportaciones a Francia: agroalimentario, HS 01-24 (anual)', 'es exp');
eq(C.tl('Exports to France: agri-food, HS 01-24 (annual)', 'fr'), 'Exportations vers France: agroalimentaire, HS 01-24 (annuel)', 'fr exp');
eq(C.tl('Producer price index: Vegetables (2020=100)', 'it'), 'Indice dei prezzi alla produzione: ortaggi (2020=100)', 'it ppi');
eq(C.tl('Barley: gross yield per ha', 'es'), 'Cebada: rendimiento bruto por ha', 'es cebada');
eq(C.tl('Trade balance: beverages (incl. wine) (monthly)', 'es'), 'Balanza comercial: bebidas (incl. vino) (mensual)', 'es bal');
eq(C.tl('Exports: agri-food total, HS 01-24', 'en'), 'Exports: agri-food total, HS 01-24', 'en intacto');
// lo desconocido no se toca
['Livestock on holdings: Other sheep 7 months to 1 year', 'Pig carcass, class E', 'Leche vaca', 'Exports to Atlantis: agri-food, HS 01-24', 'Producer price index: Quinoa-flavoured foam'].forEach(l => ['es', 'fr', 'it'].forEach(g => eq(C.tl(l, g), l, 'sin traducir ' + g + ' ' + l)));
// rango de 5 años
const pts = []; for (let i = 0; i < 72; i++) pts.push([(2021 + Math.floor(i / 12)) + '-' + String(i % 12 + 1).padStart(2, '0'), 100 + (i % 12)]);
const s1 = { points: pts }, c1 = C.ctx(s1); if (!c1 || c1.min !== 100 || c1.max !== 111) bad('ctx rango ' + JSON.stringify(c1));
if (C.ctx({ points: pts.slice(-4) })) bad('ctx con pocos datos debe ser null');
const up = pts.concat([['2027-01', 500]]); if (!C.ctx({ points: up }).isMax) bad('ctx máximo');
// resumen
const k = [{ id: 'es-perc-leche', label: 'Leche vaca', unit: '€/100 L', group: 'prices_lv', frequency: 'monthly', latestPeriod: '2026-07', latest: 46.6, changePct: -0.9 }];
const pt = [{ id: 'eu-es-x-exp-a', label: 'Exports to France: agri-food, HS 01-24 (annual)', unit: 'EUR million', frequency: 'annual', latestPeriod: '2025', latest: 12050 }, { id: 'eu-es-x-imp-a', label: 'Imports from Germany: agri-food, HS 01-24 (annual)', unit: 'EUR million', frequency: 'annual', latestPeriod: '2025', latest: 4504 }];
for (const lang of ['es', 'en', 'fr', 'it']) {
  const r = C.plain({ lang, kpis: k, partners: pt, unusual: [], plabel: p => p }), txt = r.sentences.join(' ');
  if (/undefined|NaN|\[object/.test(txt)) bad('plain ' + lang + ': ' + txt);
  const nums = (txt.replace(/(\d)[\s\u00a0\u202f](?=\d{3})/g, '$1').match(/\d[\d.,]*\d|\d/g) || []).map(x => x.replace(/[^\d]/g, ''));
  const allowed = ['466', '09', '9', '12050', '4504', '2026', '07', '2025', '100', '1', '01', '24'];
  nums.forEach(n => { if (allowed.indexOf(n) < 0) bad('cifra no procedente del dato en ' + lang + ': ' + n + ' en «' + txt + '»'); });
  if (txt.indexOf('Francia') < 0 && txt.indexOf('France') < 0) bad('plain ' + lang + ' sin destino');
}
// máximos y mínimos del histórico en el resumen: solo si el último dato lo es de verdad, y con los años reales de histórico
const mk = (vals, start) => vals.map((v, i) => [(start + Math.floor(i / 12)) + '-' + String(i % 12 + 1).padStart(2, '0'), v]);
const rising = mk(Array.from({ length: 72 }, (_, i) => 100 + i), 2021), flat = mk(Array.from({ length: 72 }, (_, i) => 100 + (i % 7)), 2021), short = mk(Array.from({ length: 40 }, (_, i) => 100 + i), 2023);
const mkS = (id, points, extra) => Object.assign({ id, label: 'Leche vaca', unit: '€/100 L', group: 'prices_lv', frequency: 'monthly', latestPeriod: points[points.length - 1][0], latest: points[points.length - 1][1], changePct: 1.2, points }, extra || {});
const tx = (lang, kp) => (C.plain({ lang, kpis: kp, partners: [], unusual: [], plabel: p => p }) || { sentences: [] }).sentences.join(' ');
if (!/máximo de los últimos 5 años/.test(tx('es', [mkS('a', rising)]))) bad('resumen: debía decir máximo de 5 años: ' + tx('es', [mkS('a', rising)]));
if (!/highest in 5 years/.test(tx('en', [mkS('a', rising)]))) bad('resumen en: máximo');
if (/máximo|mínimo/.test(tx('es', [mkS('a', flat)]))) bad('resumen: no debía decir máximo en una serie plana: ' + tx('es', [mkS('a', flat)]));
if (!/mínimo de los últimos 5 años/.test(tx('es', [mkS('a', rising.map(p => [p[0], 300 - p[1]]))]))) bad('resumen: mínimo');
const t3 = tx('es', [mkS('a', short)]); if (/de los últimos 5 años/.test(t3) || !/de los últimos [23] años/.test(t3)) bad('resumen: con ~3 años de histórico no puede decir 5: ' + t3);
if (/máximo|mínimo/.test(tx('es', [mkS('a', rising.slice(-4))]))) bad('resumen: sin histórico suficiente no se afirma máximo');
const two = tx('es', [mkS('a', rising), mkS('b', rising, { label: 'Trigo', unit: '€/t', group: 'quotes' }), mkS('c', rising, { label: 'Maíz', unit: '$/bu' })]); if (!/También en su máximo/.test(two) || !/Maíz/.test(two)) bad('resumen: faltan «también en su máximo»: ' + two);
// enlace de sección
const u = C.shareUrl({ href: 'https://dehesaindex.com/paises.html?c=ES&g=prices&s=x&r=5&zz=1#old' }, 'pp-kpi'); eq(u, 'https://dehesaindex.com/paises.html?c=ES#pp-kpi', 'shareUrl sección');
const u2 = C.shareUrl({ href: 'https://dehesaindex.com/paises.html?c=ES&g=prices&s=x&r=5&zz=1' }, 'ps-explorer'); eq(u2, 'https://dehesaindex.com/paises.html?c=ES&g=prices&s=x&r=5#ps-explorer', 'shareUrl explorador');
if (C.plain({ lang: 'es', kpis: [], partners: [], unusual: [], plabel: p => p })) bad('plain sin datos debe ser null');
// preguntas guía: solo con datos
const q = C.questions({ prices_lv: [1, 2], inputs_f: [1] }, 'es'); if (q.length !== 2 || q[0].group !== 'prices_lv') bad('preguntas ' + JSON.stringify(q));
if (C.questions({}, 'es').length) bad('preguntas sin datos');
console.log('perfil-claro: ' + (fail ? fail + ' fallos' : 'todo correcto')); process.exit(fail ? 1 : 0);
