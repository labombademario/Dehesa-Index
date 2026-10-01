#!/usr/bin/env node
// Tests del Unit Engine: FX historico (exacto / previo con hueco limitado / null, nunca "el ultimo"), conversiones de unidad y de moneda, bushel por cultivo, ha<->acre.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const U = createRequire(import.meta.url)('../js/unit-engine.js');
let bad = 0, n = 0;
const eq = (name, a, b, tol = 1e-9) => { n++; const ok = (a === b) || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))); if (!ok) { bad++; console.error('FALLA', name, '->', a, 'esperado', b); } };
U.setFx({ currencies: { USD: [['2020-01', 1.10], ['2020-02', 1.20], ['2020-05', 1.50]], CAD: [['2020-01', 1.50], ['2020-02', 1.60]] } });
// FX historico
eq('mes exacto', U.getHistoricalFx('USD', '2020-02').rate, 1.2);
eq('mes exacto metodo', U.getHistoricalFx('USD', '2020-02').method, 'exact');
eq('hueco de 1 mes usa el anterior', U.getHistoricalFx('USD', '2020-03').rate, 1.2);
eq('hueco de 1 mes metodo', U.getHistoricalFx('USD', '2020-03').method, 'previous');
eq('hueco de 2 meses usa el anterior', U.getHistoricalFx('USD', '2020-04').rate, 1.2);
eq('el mes 05 existe (exacto, no arrastra)', U.getHistoricalFx('USD', '2020-05').rate, 1.5);
eq('hueco de 3 meses = null (no usa _last)', U.getHistoricalFx('CAD', '2020-05').rate, null);
eq('nunca un mes posterior', U.getHistoricalFx('USD', '2019-12').rate, null);
eq('moneda desconocida = null', U.getHistoricalFx('XXX', '2020-01').rate, null);
eq('EUR identidad', U.getHistoricalFx('EUR', '2020-01').rate, 1);
eq('mes invalido = null', U.getHistoricalFx('USD', 'x').rate, null);
eq('maxGap=0 solo exacto', U.getHistoricalFx('USD', '2020-03', 0).rate, null);
// conversiones
const s = { cur: 'USD', kg: 27.2155 };           // USD por bushel de trigo
const r = U.convert(6.0, s, '2020-02', 'eur', 1000);   // 6 USD/bu a 1.20 -> 5 EUR/bu -> 5/27.2155*1000 EUR/t
eq('USD/bu -> EUR/t', r.value, 5 / 27.2155 * 1000);
eq('USD/bu -> USD/t (ida y vuelta con el mismo FX)', U.convert(6.0, s, '2020-02', 'usd', 1000).value, 6 / 27.2155 * 1000);
eq('EUR/t -> USD/t', U.convert(200, { cur: 'EUR', kg: 1000 }, '2020-02', 'usd', 1000).value, 240);
eq('EUR/100kg -> EUR/t', U.convert(35, { cur: 'EUR', kg: 100 }, '2020-02', 'eur', 1000).value, 350);
eq('sin FX -> null con motivo', U.convert(6, s, '2020-04', 'eur', 1000).value !== null, true);   // hueco 2 meses: permitido
eq('sin FX (3 meses) -> null', U.convert(6, { cur: 'CAD', kg: 1000 }, '2020-06', 'eur', 1000).value, null);
eq('sin FX motivo', U.convert(6, { cur: 'CAD', kg: 1000 }, '2020-06', 'eur', 1000).reason, 'no_fx');
eq('sin kg -> null', U.convert(6, { cur: 'EUR' }, '2020-01', 'eur', 1000).reason, 'no_unit');
eq('orig no convierte', U.convert(6, s, '2020-06', 'orig', 1000).value, 6);
const cs = U.convertSeries([['2020-01', 1.1], ['2020-03', 1.2], ['2020-09', 5]], { cur: 'USD', kg: 1000 }, 'eur', 1000);
eq('serie: 3 puntos, 1 omitido, 1 con respaldo', cs.points.length + '/' + cs.skipped + '/' + cs.fallbacks, '2/1/1');
eq('isConvertible si', U.isConvertible({ cur: 'USD', kg: 1000 }, 'eur', '2020-01'), true);
eq('isConvertible no', U.isConvertible({ cur: 'USD', kg: 1000 }, 'eur', '2021-01'), false);
// unidades
eq('bushel trigo', U.mass.kgPer('bushel', 'trigo'), 27.2155);
eq('bushel maiz', U.mass.kgPer('bushel', 'maiz'), 25.4012);
eq('bushel sin cultivo = null', U.mass.kgPer('bushel', 'urea'), null);
eq('bushel sin producto = null', U.mass.kgPer('bushel'), null);
eq('cwt', U.mass.kgPer('cwt'), 45.359237);
eq('t', U.mass.kgPer('t'), 1000);
eq('1 t trigo = 36.7437 bu', U.mass.fromKg(1000, 'bushel', 'trigo'), 1000 / 27.2155);
eq('toKg desconocida = null', U.mass.toKg(3, 'zorro', 'trigo'), null);
eq('acre -> ha', U.area.acreToHa(1), 0.40468564224);
eq('ha -> acre (ida y vuelta)', U.area.haToAcre(U.area.acreToHa(7.3)), 7.3);
eq('100 ha = 247.105 acres', U.area.haToAcre(100), 247.10538146717, 1e-9);
eq('formatOriginal', U.formatOriginal(13.5, 'USD/bu', 'en'), '13.50 USD/bu');
eq('formatOriginal nulo', U.formatOriginal(null, 'x'), '–');
// datos reales: las series de product-compare se convierten sin huecos silenciosos
const D = JSON.parse(readFileSync('data/product-compare.json', 'utf8')), F = JSON.parse(readFileSync('data/fx-history.json', 'utf8')); U.setFx(F);
let pts = 0, skipped = 0, fb = 0;
for (const p of Object.values(D.products)) for (const se of p.series) { const c = U.convertSeries(se.points, { cur: se.cur, kg: se.kg }, 'usd', p.per); pts += c.points.length; skipped += c.skipped; fb += c.fallbacks; if (c.points.some(q => !(q[1] > 0))) { bad++; console.error('FALLA conversion no positiva', se.c); } }
n++; console.log('Unit Engine: ' + n + ' comprobaciones, ' + bad + ' fallos; datos reales: ' + pts + ' puntos convertidos, ' + skipped + ' omitidos (sin FX), ' + fb + ' con FX del mes previo');
process.exit(bad ? 1 : 0);
