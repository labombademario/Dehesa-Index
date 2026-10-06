#!/usr/bin/env node
// Etiquetas de USDA NASS traducidas (es/fr/it): todas las series de NASS de los catalogos deben traducirse completas, y ninguna traduccion puede dejar palabras inglesas sueltas.
// Si NASS publica una serie con un producto o una medida nuevos, esta prueba falla y hay que anadirlos a NASS_P / NASS_M de js/perfil-claro.js (nunca se traduce a ojo). Uso: node scripts/test-nass-labels.mjs
import fs from 'node:fs'; import vm from 'node:vm';
const w = { addEventListener() {}, location: { search: '' }, localStorage: { getItem() { return null; } } }; w.window = w;
w.document = { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; }, createElement() { return { style: {} }; } };
vm.createContext(w); vm.runInContext(fs.readFileSync('js/perfil-claro.js', 'utf8'), w);
const C = w.DIClear; let fail = 0; const bad = m => { fail++; console.log('FALLA', m); };
if (!C || !C.tl) { bad('DIClear.tl no existe'); process.exit(1); }
const labs = new Set();
for (const f of fs.readdirSync('data/catalog').filter(f => /^[A-Z]{2}\.json$/.test(f))) for (const s of JSON.parse(fs.readFileSync('data/catalog/' + f, 'utf8')).series) if (/nass/i.test(s.sourceId || '') && s.group !== 'product') labs.add(s.label);
const EN = /\b(area|harvested|planted|production|yield|cold storage|stocks|inventory|frozen|cattle|hogs|wheat|corn|paid|whole|other|milk|cows|boneless|supplies)\b/i;
for (const lg of ['es', 'fr', 'it']) {
  let un = 0;
  for (const l of labs) { const t = C.tl(l, lg); if (t === l) { un++; if (un <= 5) console.log('  sin traducir (' + lg + '):', l); } else if (lg === 'es' && EN.test(t.replace(/\((hard|soft)\)/g, ''))) bad('palabra inglesa en «' + t + '»'); }
  if (un) bad(lg + ': ' + un + ' etiquetas de NASS sin traducir');
}
const eq = (l, lg, e) => { const t = C.tl(l, lg); if (t !== e) bad('«' + l + '» (' + lg + ') = «' + t + '», esperado «' + e + '»'); };
eq('Barley: area harvested', 'es', 'Cebada: superficie cosechada'); eq('Corn, grain: production value', 'fr', 'Maïs, grain: valeur de la production');
eq('Turkeys, whole, hens, cold storage, frozen: cold storage stocks', 'es', 'Pavos, entero, gallinas, congelado: existencias en cámara frigorífica');
eq('Butter, cold storage: cold storage stocks', 'it', 'Burro: scorte in magazzino frigorifero'); eq('Wheat, winter, red, hard: yield', 'es', 'Trigo, de invierno, rojo, duro (hard): rendimiento');
eq('Cattle, cows, beef: inventory', 'es', 'Ganado vacuno, vacas, de carne: censo'); eq('Cattle, cows, milk: inventory', 'fr', 'Bovins, vaches, laitières: effectif'); eq('Beef, cold storage, frozen: cold storage stocks', 'es', 'Vacuno, congelado: existencias en cámara frigorífica');
eq('Barley: area harvested (annual)', 'es', 'Cebada: superficie cosechada (anual)');
eq('Barley: algo nuevo', 'es', 'Barley: algo nuevo'); eq('Producto raro, cold storage: production', 'es', 'Producto raro, cold storage: production');
console.log(fail ? 'FALLOS: ' + fail : 'test-nass-labels: OK (' + labs.size + ' etiquetas de NASS en es/fr/it)'); process.exit(fail ? 1 : 0);
