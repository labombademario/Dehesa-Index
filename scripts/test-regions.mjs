// Prueba de los perfiles de region: cada contorno del mapa tiene nombre en 4 idiomas (donde aplica) y cada nombre tiene contorno; los datos de que depende cada bloque existen.
import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
for (const f of ['vendor/us-states.js', 'vendor/ca-provinces.js', 'vendor/es-ccaa.js', 'js/region-names.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx);
const w = ctx.window; let fail = 0; const ok = (n, c) => { console.log((c ? 'OK    ' : 'FALLO ') + n); if (!c) fail++; };
for (const [cc, key, np] of [['US', 'DEHESA_US_STATES', 2], ['CA', 'DEHESA_CA_PROVINCES', 4], ['ES', 'DEHESA_ES_CCAA', 4]]) {
  const M = w[key], N = w.DehesaRegionNames[cc], ids = M.states.map(s => s.id);
  ok(cc + ': cada contorno tiene nombre', ids.every(i => N[i]));
  ok(cc + ': cada nombre tiene contorno', Object.keys(N).every(i => ids.includes(i)));
  ok(cc + ': nombres con ' + np + ' variantes', Object.values(N).every(v => v.split('|').length === np && v.split('|').every(x => x.length > 0)));
  ok(cc + ': contornos con trazado', M.states.every(s => s.d.length > 50));
}
ok('EE. UU.: 50 estados + DC', w.DehesaRegionNames.US && Object.keys(w.DehesaRegionNames.US).length === 51);
ok('Canadá: 13 provincias y territorios', Object.keys(w.DehesaRegionNames.CA).length === 13);
ok('España: 17 comunidades autónomas', Object.keys(w.DehesaRegionNames.ES).length === 17);
const need = ['data/recan.json', 'data/drought.json', 'data/nass-crops.json', 'data/cattle-on-feed.json', 'data/us-cash-bids/manifest.json', 'data/us-fertilizers.json', 'data/other-tax.json', 'data/canada-drought.json', 'data/canada-stats.json', 'data/canada-provinces.json', 'data/latest.json'];
ok('existen los ficheros de datos que leen los bloques', need.every(f => fs.existsSync(f)));
const dr = JSON.parse(fs.readFileSync('data/drought.json', 'utf8')), cd = JSON.parse(fs.readFileSync('data/canada-drought.json', 'utf8'));
ok('sequia EE. UU.: hay datos de todos los estados con contorno', Object.keys(w.DehesaRegionNames.US).filter(i => i !== 'DC' && !dr.states[i]).length === 0);
ok('sequia Canadá: todas las provincias', Object.keys(w.DehesaRegionNames.CA).every(i => cd.provinces[i]));
const rc = JSON.parse(fs.readFileSync('data/recan.json', 'utf8')), RCN = ['Andalucía', 'Aragón', 'Principado de Asturias', 'Canarias', 'Cantabria', 'Castilla y León', 'Castilla-La Mancha', 'Cataluña', 'Extremadura', 'Galicia', 'Islas Baleares', 'La Rioja', 'Comunidad de Madrid', 'Región de Murcia', 'Comunidad Foral de Navarra', 'País Vasco', 'Comunidad Valenciana'];
ok('RECAN: las 17 comunidades del mapa existen en el dato', RCN.every(n => rc.ccaa.includes(n)) && rc.ccaa.length === 17);
const src = fs.readFileSync('js/region.js', 'utf8');
ok('region.js no usa promesas sin captura de errores en los bloques', /m\[1\]\(x\)\.catch/.test(src));
console.log('\n' + fail + ' fallos'); process.exit(fail ? 1 : 0);
