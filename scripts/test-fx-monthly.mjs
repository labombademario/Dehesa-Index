// Prueba offline: la web convierte cada dato con la media mensual del BCE de SU mes (js/data.js, FXM), no con el cambio de hoy.
import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert/strict';
const ctx = { console }; ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/data.js', 'utf8'), ctx);
const D = ctx.DehesaData || ctx.D || Object.values(ctx).find(v => v && v.buildRegion);
const hist = JSON.parse(fs.readFileSync('data/fx-history.json', 'utf8')).currencies;
const usd = Object.fromEntries(hist.USD), gbp = Object.fromEntries(hist.GBP);
const ts = (y, m) => Date.UTC(y, m - 1, 1);
const near = (a, b, e = 2e-5) => assert.ok(Math.abs(a - b) <= e * Math.max(1, Math.abs(b)), a + ' != ' + b);
// 1) tabla = fx-history.json
near(D.fxAt('EUR', ts(2026, 9)), usd['2026-09']); near(D.fxAt('GBP', ts(2020, 3)), usd['2020-03'] / gbp['2020-03']);
near(D.fxAt('USD', ts(2020, 3)), 1);
// 2) mes sin media publicada y sin fecha: cambio de hoy; antes de 1999: sin cambio (null)
near(D.fxAt('EUR', ts(2026, 12)), D.FX.EUR); near(D.fxAt('EUR', null), D.FX.EUR); assert.equal(D.fxAt('EUR', ts(1985, 5)), null); near(D.fxAt('EUR', ts(1999, 1)), usd['1999-01']);
// 3) gas TTF: 25,42 USD de septiembre de 2026 -> EUR con el cambio de septiembre
const reg = { price: 25.42, changePct: 20, history: [20, 25.42], currency: 'USD', kgPerUnit: 1, histGran: 'month', histPts: [{ ts: ts(2026, 8), value: 21.1 }, { ts: ts(2026, 9), value: 25.42 }] };
const T = { up: '#0a0', down: '#a00', flat: '#888' };
const b = D.buildRegion(reg, 'x', 'EUR', 1, 'MMBtu', D.FX, T);
near(b.priceValue, 25.42 / usd['2026-09']);
const old = 25.42 / D.FX.EUR; assert.ok(Math.abs(b.priceValue - old) > 0.3, 'debe diferir del cambio de hoy');
// 4) histórico: cada punto con el cambio de su mes
const rh = D.realHistory(reg, 'EUR', 1, D.FX);
near(rh.pts[0].y, 21.1 / usd['2026-08']); near(rh.pts[1].y, 25.42 / usd['2026-09']);
// 5) sin fecha en la región: cambio de hoy; mismo cambio indicado por quien llama: se respeta
const nd = Object.assign({}, reg, { histPts: null });
near(D.buildRegion(nd, 'x', 'EUR', 1, 'u', D.FX, T).priceValue, 25.42 / D.FX.EUR);
near(D.buildRegion(reg, 'x', 'EUR', 1, 'u', { USD: 1, EUR: 2 }, T).priceValue, 25.42 / 2);
// 5b) antes de 1999 los puntos se omiten (no se inventa un cambio); en USD (sin conversion) se mantienen
const old2 = { price: 3, changePct: 0, history: [1, 3], currency: 'USD', kgPerUnit: 1, histGran: 'month', histPts: [{ ts: ts(1990, 1), value: 1 }, { ts: ts(1998, 12), value: 2 }, { ts: ts(1999, 1), value: 2.5 }, { ts: ts(1999, 2), value: 3 }] };
const r2 = D.realHistory(old2, 'EUR', 1, D.FX); assert.equal(r2.pts.length, 2); assert.equal(r2.pts[0].ts, ts(1999, 1));
assert.equal(D.realHistory(old2, 'USD', 1, D.FX).pts.length, 4);
assert.equal(D.realHistory(Object.assign({}, old2, { histPts: old2.histPts.slice(0, 2) }), 'EUR', 1, D.FX), null);
// 6) misma moneda: factor 1
near(D.buildRegion({ price: 5, changePct: 0, history: [5, 5], currency: 'EUR', kgPerUnit: 1 }, 'x', 'EUR', 1, 'u', D.FX, T).priceValue, 5);
// 7) TTF: dato del Banco Mundial (USD/MMBtu) -> EUR/MWh con el cambio del mes; contraste con la Comision Europea (TTF day-ahead anual: 2022 132, 2023 41, 2024 35 EUR/MWh)
const gas = D.RAW.flatMap(c => c.products).find(p => p.nameKey === 'gas_natural');
assert.equal(gas.metricUnitKey, 'mwh'); near(gas.metricKgPerUnit, 3.412142);
const wb = JSON.parse(fs.readFileSync(fs.readdirSync('data/snapshots').sort().reverse().map(f => 'data/snapshots/' + f).find(f => JSON.parse(fs.readFileSync(f, 'utf8')).observations.some(o => o.product === 'gas_natural' && o.region === 'eu' && o.history)), 'utf8')).observations.find(o => o.product === 'gas_natural' && o.region === 'eu' && o.history);
const ann = {};
wb.history.filter(q => q.year >= 2022 && q.year <= 2024).forEach(q => { const m = q.year + '-' + String(q.period).padStart(2, '0'); (ann[q.year] = ann[q.year] || []).push(q.value * gas.metricKgPerUnit / usd[m]); });
const avg = y => ann[y].reduce((a, b) => a + b, 0) / ann[y].length;
[[2022, 132], [2023, 41], [2024, 35]].forEach(([y, ref]) => assert.ok(Math.abs(avg(y) - ref) < 1.2, y + ': ' + avg(y).toFixed(1) + ' vs ' + ref));
console.log('test-fx-monthly: OK');
