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
// 2) mes sin media publicada y sin fecha: cambio de hoy; antes de 1999: enero de 1999
near(D.fxAt('EUR', ts(2026, 12)), D.FX.EUR); near(D.fxAt('EUR', null), D.FX.EUR); near(D.fxAt('EUR', ts(1985, 5)), usd['1999-01']);
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
// 6) misma moneda: factor 1
near(D.buildRegion({ price: 5, changePct: 0, history: [5, 5], currency: 'EUR', kgPerUnit: 1 }, 'x', 'EUR', 1, 'u', D.FX, T).priceValue, 5);
console.log('test-fx-monthly: OK');
