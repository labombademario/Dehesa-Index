// Margen España: la PAC solo sale de la estimación guardada por la persona; ningún importe PAC en el código; pacHtml suma con lo que dice.
import fs from 'fs'; import vm from 'vm';
const src = fs.readFileSync('js/margen-es.js', 'utf8'); let fails = 0;
const ok = (c, m) => { if (!c) { console.log('FAIL', m); fails++; } };
ok(!/\b\d{2,3}[.,]?\d*\s*(€|eur)\s*\/\s*ha/i.test(src.replace(/\{[a-z]+\}/g, '')), 'importe €/ha escrito en el código');
const store = {};
const win = { localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } }, DehesaShared: { getLang: () => 'es' } };
vm.runInNewContext(src, { window: win, document: {}, fetch: () => {}, console, Math, JSON, Object, String, Number });
const M = win.DIMargenES;
ok(M && !M.hasPac(), 'sin estimación no hay PAC');
ok(/pac\.html/.test(M.pacHtml({ cur: 'EUR', areaHa: 10, margin: 100 })), 'sin estimación enlaza a pac.html');
store['di-pac-est-v1'] = JSON.stringify({ y: 2026, r: 'r1', ha: 10, mid: 1000, lo: 800, hi: 1200 });
let h = M.pacHtml({ cur: 'EUR', areaHa: 10, margin: 500 }); ok(/1\.?500/.test(h), 'suma margen+PAC = 1500: ' + h);
h = M.pacHtml({ cur: 'EUR', areaHa: 12, margin: 500 }); ok(!/1\.?500/.test(h), 'no suma si las hectáreas no coinciden');
h = M.pacHtml({ cur: 'USD', areaHa: 10, margin: 500 }); ok(!/1\.?500/.test(h), 'no suma si la moneda no es EUR');
console.log(fails ? 'FIN fail=' + fails : 'margen-es OK'); process.exit(fails ? 1 : 0);
