// Pruebas de la deflación con IPC (DehesaChart.real en js/chart.js): aritmética, frecuencias, huecos y moneda/país. Sin navegador: se carga chart.js con un window de pega.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const noop = () => {}; const el = new Proxy(function () {}, { get: () => el, apply: () => el, set: () => true });
const doc = { querySelectorAll: () => [], readyState: 'loading', addEventListener: noop, documentElement: { addEventListener: noop, lang: 'es' }, createElement: () => el, body: el };
const cpi = { countries: {
  XX: { m: { s: '2024-01', v: [100, 101, null, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113] , src: 'ons', name: 'n', base: '2015=100' }, a: { y0: 2022, v: [90, 95, 100], src: 'world_bank_wdi', name: 'wb', base: '2010=100' } },
  YY: { a: { y0: 2022, v: [90, 95, 100], src: 'world_bank_wdi', name: 'wb', base: '2010=100' } } } };
const win = { document: doc, addEventListener: noop, DehesaShared: { getLang: () => 'es' }, fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(cpi) }) };
const ctx = vm.createContext({ window: win, document: doc, fetch: win.fetch, Math, Object, JSON, String, Number, Array, Date, Promise, Map: Map, WeakMap, Set, setTimeout, clearTimeout, console, navigator: {}, getComputedStyle: () => ({}) });
vm.runInContext(readFileSync(new URL('../js/chart.js', import.meta.url), 'utf8'), ctx);
const R = win.DehesaChart.real; let bad = 0;
const t = (c, m) => { if (!c) { bad++; console.log('FALLA:', m); } };
const near = (a, b) => Math.abs(a - b) < 1e-9;
await R.load();
// moneda y país
t(R.can('ES', '€/100 kg') && R.can('DE', 'EUR per 100 kg') && R.can('US', 'USD/cwt') && R.can('UK', 'p/kg') && R.can('CA', 'CAD/tonne'), 'moneda propia');
t(!R.can('ES', 'USD/cwt') && !R.can('US', '€/t') && !R.can('ES', 'index (2020 = 100)') && !R.can('ES', '%'), 'moneda ajena / índices no se deflactan');
// anual con IPC anual: 100 de 2022 -> 100 * 100/90 en precios de 2024
let d = R.deflate('YY', [['2022', 100], ['2023', 100], ['2024', 100]], 'annual');
t(d && d.ref === '2024' && d.kind === 'a' && near(d.points[0][1], 100 * 100 / 90) && near(d.points[2][1], 100), 'anual con IPC anual');
// anual con IPC mensual solo si el año está completo: XX tiene 2024-01..2025-02, ningún año completo -> sin base; con a: usa a
d = R.deflate('XX', [['2022', 10], ['2023', 10], ['2024', 10]], 'annual'); t(d && d.kind === 'a', 'XX usa el anual');
// mensual: referencia = último mes; el mes sin dato (2024-03) se omite y se cuenta, no se rellena
d = R.deflate('XX', [['2024-01', 50], ['2024-02', 50], ['2024-03', 50], ['2024-04', 50]], 'monthly');
t(d && d.ref === '2025-02' && d.miss === 1 && d.points.length === 3 && near(d.points[0][1], 50 * 113 / 100) && near(d.points[2][1], 50 * 113 / 103), 'mensual con hueco: ' + JSON.stringify(d));
// trimestral = media de 3 meses (si falta alguno, se omite)
d = R.deflate('XX', [['2024-Q1', 10], ['2024-Q2', 10], ['2024-Q3', 10]], 'quarterly'); t(d && d.points.length === 2 && d.miss === 1 && d.points[0][0] === '2024-Q2', 'trimestre con mes sin dato se omite');
// semanal 'AAAA-MM-DD' toma el IPC de su mes
d = R.deflate('XX', [['2024-01-08', 10], ['2024-02-12', 10]], 'weekly'); t(d && near(d.points[0][1], 10 * 113 / 100) && near(d.points[1][1], 10 * 113 / 101), 'semanal por mes');
// sin IPC mensual no se deflactan series mensuales; país desconocido -> null
t(R.deflate('YY', [['2024-01', 1], ['2024-02', 1]], 'monthly') === null, 'mensual sin IPC mensual -> null');
t(R.deflate('ZZ', [['2022', 1], ['2023', 1]], 'annual') === null, 'país sin IPC -> null');
if (bad) { console.log(bad + ' fallos'); process.exit(1); }
console.log('test-real-prices: OK');
