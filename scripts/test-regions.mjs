// Prueba de los perfiles de region: cada contorno del mapa tiene nombre en 4 idiomas (donde aplica) y cada nombre tiene contorno; los datos de que depende cada bloque existen.
import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
for (const f of ['vendor/us-states.js', 'vendor/ca-provinces.js', 'vendor/es-ccaa.js', 'vendor/fr-regions.js', 'vendor/it-regions.js', 'vendor/de-laender.js', 'vendor/au-states.js', 'vendor/nl-provinces.js', 'vendor/at-laender.js', 'js/region-names.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx);
const w = ctx.window; let fail = 0; const ok = (n, c) => { console.log((c ? 'OK    ' : 'FALLO ') + n); if (!c) fail++; };
for (const [cc, key, np] of [['NL', 'DEHESA_NL_PROVINCES', 4], ['AT', 'DEHESA_AT_LAENDER', 4], ['US', 'DEHESA_US_STATES', 4], ['CA', 'DEHESA_CA_PROVINCES', 4], ['ES', 'DEHESA_ES_CCAA', 4], ['FR', 'DEHESA_FR_REGIONS', 4], ['IT', 'DEHESA_IT_REGIONS', 4], ['DE', 'DEHESA_DE_LAENDER', 4], ['AU', 'DEHESA_AU_STATES', 4]]) {
  const M = w[key], N = w.DehesaRegionNames[cc], ids = M.states.map(s => s.id);
  ok(cc + ': cada contorno tiene nombre', ids.every(i => N[i]));
  ok(cc + ': cada nombre tiene contorno', Object.keys(N).every(i => ids.includes(i)));
  ok(cc + ': nombres con ' + np + ' variantes', Object.values(N).every(v => v.split('|').length === np && v.split('|').every(x => x.length > 0)));
  ok(cc + ': contornos con trazado', M.states.every(s => s.d.length > 50));
}
ok('EE. UU.: 50 estados + DC', w.DehesaRegionNames.US && Object.keys(w.DehesaRegionNames.US).length === 51);
ok('Canadá: 13 provincias y territorios', Object.keys(w.DehesaRegionNames.CA).length === 13);
ok('España: 17 comunidades autónomas', Object.keys(w.DehesaRegionNames.ES).length === 17);
ok('Francia 13 regiones, Italia 20 y Alemania 16 Länder', [['FR', 13], ['IT', 20], ['DE', 16]].every(([c, n]) => Object.keys(w.DehesaRegionNames[c]).length === n));
for (const c of ['es', 'fr', 'it', 'de', 'be', 'dk', 'pl']) { const j = JSON.parse(fs.readFileSync('data/eu-regions-' + c + '.json', 'utf8')); const ids = Object.keys(w.DehesaRegionNames[c.toUpperCase()]); ok(c.toUpperCase() + ': Eurostat trae datos de todas las regiones del mapa', ids.every(i => j.regions[i] && j.regions[i].eaa && j.regions[i].crops && j.regions[i].animals && j.regions[i].farms) && Object.keys(j.regions).length === ids.length); }
const au = JSON.parse(fs.readFileSync('data/au-states.json', 'utf8'));
ok('Australia: 8 estados y territorios con exportaciones (ACT sin dato publicado)', Object.keys(w.DehesaRegionNames.AU).length === 8 && Object.keys(w.DehesaRegionNames.AU).every(i => au.states[i]) && ['NSW', 'VIC', 'QLD', 'WA', 'SA'].every(i => au.states[i].agrifood));
const need = ['data/au-states.json', 'data/eu-regions-es.json', 'data/eu-regions-fr.json', 'data/eu-regions-it.json', 'data/eu-regions-de.json', 'data/eu-regions-nl.json', 'data/eu-regions-at.json', 'data/eu-regions-be.json', 'data/eu-regions-dk.json', 'data/eu-regions-pl.json', 'data/germany-stats.json', 'data/recan.json', 'data/drought.json', 'data/nass-crops.json', 'data/cattle-on-feed.json', 'data/us-cash-bids/manifest.json', 'data/us-fertilizers.json', 'data/other-tax.json', 'data/canada-drought.json', 'data/canada-stats.json', 'data/canada-provinces.json', 'data/latest.json'];
ok('existen los ficheros de datos que leen los bloques', need.every(f => fs.existsSync(f)));
const dr = JSON.parse(fs.readFileSync('data/drought.json', 'utf8')), cd = JSON.parse(fs.readFileSync('data/canada-drought.json', 'utf8'));
ok('sequia EE. UU.: hay datos de todos los estados con contorno', Object.keys(w.DehesaRegionNames.US).filter(i => i !== 'DC' && !dr.states[i]).length === 0);
ok('sequia Canadá: todas las provincias', Object.keys(w.DehesaRegionNames.CA).every(i => cd.provinces[i]));
const rc = JSON.parse(fs.readFileSync('data/recan.json', 'utf8')), RCN = ['Andalucía', 'Aragón', 'Principado de Asturias', 'Canarias', 'Cantabria', 'Castilla y León', 'Castilla-La Mancha', 'Cataluña', 'Extremadura', 'Galicia', 'Islas Baleares', 'La Rioja', 'Comunidad de Madrid', 'Región de Murcia', 'Comunidad Foral de Navarra', 'País Vasco', 'Comunidad Valenciana'];
ok('RECAN: las 17 comunidades del mapa existen en el dato', RCN.every(n => rc.ccaa.includes(n)) && rc.ccaa.length === 17);
const cnt = d => fs.existsSync(d) ? fs.readdirSync(d).filter(x => fs.existsSync(d + '/' + x + '/index.html')).length : 0;
ok('paginas estaticas por region (es): EE. UU. 51, Canadá 13, España 17, Francia 13, Italia 20, Alemania 16, Países Bajos 12, Austria 9, Australia 7 (ACT sin dato)', [['estados-unidos', 51], ['canada', 13], ['espana', 17], ['francia', 13], ['italia', 20], ['alemania', 16], ['paises-bajos', 12], ['austria', 9], ['australia', 7]].every(z => cnt('regiones/' + z[0]) === z[1]));
ok('paginas estaticas por region en los 4 idiomas con el mismo numero (es/en/fr/it)', [['en/regions/spain', 'it/regioni/spagna', 'fr/regions/espagne'], ['en/regions/united-states', 'it/regioni/stati-uniti', 'fr/regions/etats-unis']].every((g, i) => g.every(d => cnt(d) === (i ? 51 : 17))));
const pg = fs.existsSync('regiones/espana/andalucia/index.html') ? fs.readFileSync('regiones/espana/andalucia/index.html', 'utf8') : '';
ok('pagina de region: titulo de hasta 65 caracteres, cifra real en la descripcion, canonical, hreflang x-default y enlace al perfil interactivo', /<title>[^<]{10,65}<\/title>/.test(pg) && /<meta name="description" content="[^"]*\d[^"]*"/.test(pg) && pg.includes('rel="canonical" href="https://dehesaindex.com/regiones/espana/andalucia/"') && pg.includes('hreflang="x-default"') && pg.includes('region.html?c=ES&amp;r=AN'));
// enlaces a las paginas estaticas: el JS (DehesaRegionUrls) y el generador usan las mismas direcciones y cada una existe
{ const w2 = {}; vm.runInNewContext(fs.readFileSync('js/region-names.js', 'utf8'), { window: w2 }); const U = w2.DehesaRegionUrls; let bad = [], n = 0;
  for (const c of Object.keys(w2.DehesaRegionNames)) for (const r of Object.keys(w2.DehesaRegionNames[c])) for (const lg of ['es', 'en', 'fr', 'it']) { const u = U.page(c, r, lg), hub = U.hub(c, lg); n++;
    if (!fs.existsSync('.' + hub + 'index.html')) bad.push(hub); if (!(c === 'AU' && r === 'ACT') && !fs.existsSync('.' + u + 'index.html')) bad.push(u); }
  ok('enlaces a paginas estaticas de region: ' + n + ' combinaciones, todas existen', bad.length === 0); if (bad.length) console.log(bad.slice(0, 5)); }
ok('region-metrics.js: cada metrica lee un fichero que existe', fs.existsSync('js/region-metrics.js') && ['data/drought.json', 'data/cattle-on-feed.json', 'data/other-tax.json', 'data/canada-drought.json', 'data/canada-provinces.json', 'data/au-states.json'].every(f => fs.existsSync(f)));
const src = fs.readFileSync('js/region.js', 'utf8');
ok('region.js no usa promesas sin captura de errores en los bloques', /m\[1\]\(x\)\.catch/.test(src));
console.log('\n' + fail + ' fallos'); process.exit(fail ? 1 : 0);
