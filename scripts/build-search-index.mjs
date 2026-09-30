#!/usr/bin/env node
/* Dehesa Index — genera data/search-index.json para el buscador global (js/search.js).
   Se ejecuta a mano cuando se añade un producto o una página (la prueba de QA avisa si el índice se queda atrás). */
import fs from 'node:fs';
import vm from 'node:vm';
const L = ['es', 'en', 'fr', 'it'];
const read = f => fs.readFileSync(f, 'utf8');
// --- datos de precios (js/data.js se carga igual que en el navegador)
const ctx = { console }; ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx); vm.runInContext(read('js/data.js'), ctx);
const D = ctx.DehesaData;
const out = [];
const add = e => out.push(e);
const tri = (es, en, fr, it) => ({ es, en, fr, it });

// --- productos de la página de precios
const SYN = {
  maiz: 'corn maize mais maïs cereal grano forraje', trigo: 'wheat blé ble frumento pan harina cereal candeal', arroz: 'rice riz riso paddy cereal',
  leche: 'milk lait latte lacteo lácteo dairy vaca cruda', vaca: 'vacuno beef cattle bovino bovins bovini ternera buey novillo carne res vitello manzo',
  cabra: 'goat chevre chèvre capra caprino', cerdo: 'pork hogs pig porcino cochino cochinillo porc maiale swine', cordero: 'lamb sheep ovino oveja agneau agnello mouton',
  huevos: 'eggs oeufs uova huevo gallina', pollo: 'chicken broiler poulet aves avicultura', pienso: 'feed mangime aliment compuesto racion ración',
  harina_soja: 'soja soy soybean meal tourteau farina soia proteina pienso feed', urea: 'fertilizer fertilizante abono nitrogeno nitrógeno nitrogen engrais azote',
  dap: 'fosfato fósforo phosphate phosphorus fertilizer abono engrais fosforo', potasa: 'potassium potash potasio kali fertilizer abono engrais',
  azucar: 'sugar sucre zucchero remolacha caña beet cane', oliva: 'olive oil aceite huile olio virgen extra', diesel: 'gasoil gasóleo gasoleo fuel carburante combustible energia energía energy gazole'
};
const catLabel = (l, id) => (D.CATS[l][id] || {}).label || id;
const seen = new Set();
for (const cat of D.RAW) for (const p of cat.products) {
  const key = cat.id + ':' + p.nameKey; seen.add(key);
  add({ t: 'product', u: 'precios.html?tab=' + cat.id + '&product=' + encodeURIComponent(key), n: Object.fromEntries(L.map(l => [l, D.NAMES[l][p.nameKey]])), s: Object.fromEntries(L.map(l => [l, catLabel(l, cat.id)])), k: SYN[p.nameKey] || '' });
}
add({ t: 'product', u: 'precios.html?tab=energia&product=' + encodeURIComponent('energia:diesel'), n: Object.fromEntries(L.map(l => [l, D.NAMES[l].diesel || 'Diesel'])), s: Object.fromEntries(L.map(l => [l, catLabel(l, 'energia')])), k: SYN.diesel });
for (const [id, kw] of [['seguro', 'insurance agroseguro assurance seguro agrario'], ['vino', 'wine vin vino granel'], ['madera', 'wood timber lumber bois legno'], ['energia', 'energy energia energía combustible']]) {
  add({ t: 'category', u: 'precios.html?tab=' + id, n: Object.fromEntries(L.map(l => [l, catLabel(l, id)])), s: tri('Precios', 'Prices', 'Prix', 'Prezzi'), k: kw });
}

// --- oferta y demanda (USDA PSD) y capas del mapa
const PSD = {
  trigo: tri('Trigo', 'Wheat', 'Blé', 'Grano'), maiz: tri('Maíz', 'Corn', 'Maïs', 'Mais'), arroz: tri('Arroz', 'Rice', 'Riz', 'Riso'), cebada: tri('Cebada', 'Barley', 'Orge', 'Orzo'),
  soja: tri('Soja', 'Soybeans', 'Soja', 'Soia'), harina_soja: tri('Harina de soja', 'Soybean meal', 'Tourteau de soja', 'Farina di soia'), colza: tri('Colza', 'Rapeseed', 'Colza', 'Colza'),
  oliva: tri('Aceite de oliva', 'Olive oil', 'Huile d’olive', 'Olio d’oliva'), cerdo: tri('Cerdo', 'Pork', 'Porc', 'Maiale'), vacuno: tri('Vacuno', 'Beef', 'Bœuf', 'Bovino'), pollo: tri('Pollo', 'Chicken', 'Poulet', 'Pollo'),
  leche: tri('Leche', 'Milk', 'Lait', 'Latte'), azucar: tri('Azúcar', 'Sugar', 'Sucre', 'Zucchero')
};
const PSDK = { trigo: 'wheat blé grano', maiz: 'corn maize mais maïs', arroz: 'rice riz riso', cebada: 'barley orge orzo', soja: 'soy soya soybean soja oilseed oleaginosa', harina_soja: 'soybean meal tourteau farina soia', colza: 'rapeseed canola oilseed', oliva: 'olive oil aceite huile olio', cerdo: 'pork porc maiale swine porcino', vacuno: 'beef bovino ternera', pollo: 'chicken poulet', leche: 'milk lait latte dairy', azucar: 'sugar sucre zucchero' };
const LAYERS = {
  prod: { n: tri('Producción', 'Production', 'Production', 'Produzione'), k: 'produccion cosecha production output harvest production produzione' },
  exp: { n: tri('Exportaciones', 'Exports', 'Exportations', 'Esportazioni'), k: 'exportacion exportaciones exports exportations esportazioni vender comercio trade' },
  imp: { n: tri('Importaciones', 'Imports', 'Importations', 'Importazioni'), k: 'importacion importaciones imports importations importazioni comprar comercio trade' },
  stock: { n: tri('Existencias', 'Stocks', 'Stocks', 'Scorte'), k: 'existencias stocks reservas inventario scorte stock' }
};
const OD = tri('Oferta y demanda', 'Supply and demand', 'Offre et demande', 'Offerta e domanda'), MAPW = tri('Mapa', 'Map', 'Carte', 'Mappa');
for (const [id, nm] of Object.entries(PSD)) {
  add({ t: 'supply', u: 'oferta-demanda.html?c=' + id, n: Object.fromEntries(L.map(l => [l, OD[l] + ' · ' + nm[l]])), s: tri('USDA PSD · balance mundial, países, existencias', 'USDA PSD · world balance, countries, stocks', 'USDA PSD · bilan mondial, pays, stocks', 'USDA PSD · bilancio mondiale, paesi, scorte'), k: PSDK[id] + ' oferta demanda supply demand balance consumo consumption existencias stocks exportaciones exports exportations esportazioni importaciones imports importations importazioni produccion production wasde psd usda' });
  for (const [ly, lv] of Object.entries(LAYERS)) add({ t: 'map', u: 'mapa.html?layer=' + ly + '&sd=' + id, n: Object.fromEntries(L.map(l => [l, MAPW[l] + ' · ' + lv.n[l] + ' · ' + nm[l]])), s: tri('Mapa mundial · USDA PSD', 'World map · USDA PSD', 'Carte mondiale · USDA PSD', 'Mappa mondiale · USDA PSD'), k: PSDK[id] + ' ' + lv.k + ' mapa map carte mappa paises countries' });
}
// --- cultivos (NASS Crop Progress)
const CROPS = { corn: tri('Maíz', 'Corn', 'Maïs', 'Mais'), soybeans: tri('Soja', 'Soybeans', 'Soja', 'Soia'), wheat_winter: tri('Trigo de invierno', 'Winter wheat', 'Blé d’hiver', 'Grano invernale'), wheat_spring: tri('Trigo de primavera', 'Spring wheat', 'Blé de printemps', 'Grano primaverile'), cotton: tri('Algodón', 'Cotton', 'Coton', 'Cotone') };
const CROPK = { corn: 'maiz corn maize mais', soybeans: 'soja soy soybean soia', wheat_winter: 'trigo wheat blé grano invierno winter', wheat_spring: 'trigo wheat blé grano primavera spring', cotton: 'algodon cotton coton cotone' };
const CS = tri('Estado de los cultivos', 'Crop conditions', 'État des cultures', 'Stato delle colture');
for (const [id, nm] of Object.entries(CROPS)) {
  add({ t: 'crop', u: 'cultivos.html?crop=' + id, n: Object.fromEntries(L.map(l => [l, CS[l] + ' · ' + nm[l]])), s: tri('EE. UU. · USDA NASS Crop Progress', 'U.S. · USDA NASS Crop Progress', 'États-Unis · USDA NASS Crop Progress', 'USA · USDA NASS Crop Progress'), k: CROPK[id] + ' cultivo crop condicion condición valoracion siembra cosecha planting harvest progress buena excelente good excellent semis récolte semina raccolta' });
  add({ t: 'map', u: 'mapa.html?layer=crops&crop=' + id, n: Object.fromEntries(L.map(l => [l, MAPW[l] + ' · ' + CS[l] + ' · ' + nm[l]])), s: tri('Mapa de EE. UU. por estados', 'U.S. state map', 'Carte des États-Unis', 'Mappa degli Stati USA'), k: CROPK[id] + ' estados states mapa map cultivo crop' });
}
// --- clima
const clim = JSON.parse(read('data/climate.json'));
const CL = tri('Clima', 'Climate', 'Climat', 'Clima');
for (const loc of clim.locations) add({ t: 'climate', u: 'clima.html?loc=' + loc.id, n: Object.fromEntries(L.map(l => [l, CL[l] + ' · ' + loc.name])), s: tri('Lluvia y temperatura, histórico desde 2000', 'Rainfall and temperature, history since 2000', 'Pluie et température, historique depuis 2000', 'Pioggia e temperatura, storico dal 2000'), k: 'clima climate climat lluvia rain pluie pioggia temperatura temperature sequia sequía drought secheresse siccità calor nasa power ' + loc.id.replace(/-/g, ' ') });
add({ t: 'map', u: 'mapa.html?layer=precip', n: tri('Mapa · Lluvia', 'Map · Rainfall', 'Carte · Pluie', 'Mappa · Pioggia'), s: tri('Desviación frente a la media 2001-2020', 'Deviation from the 2001-2020 average', 'Écart à la moyenne 2001-2020', 'Scostamento dalla media 2001-2020'), k: 'lluvia rain pluie pioggia sequia sequía clima mapa map' });
add({ t: 'map', u: 'mapa.html?layer=temp', n: tri('Mapa · Temperatura', 'Map · Temperature', 'Carte · Température', 'Mappa · Temperatura'), s: tri('Desviación frente a la media 2001-2020', 'Deviation from the 2001-2020 average', 'Écart à la moyenne 2001-2020', 'Scostamento dalla media 2001-2020'), k: 'temperatura temperature calor frio heat cold clima mapa map' });
// --- mapa de precios por producto
for (const id of ['trigo', 'maiz', 'arroz', 'cerdo', 'cordero', 'harina_soja', 'huevos', 'leche', 'oliva', 'pollo', 'vaca', 'azucar', 'dap', 'potasa', 'diesel']) {
  const nm = D.NAMES; const key = id === 'vaca' ? 'vaca' : id;
  add({ t: 'map', u: 'mapa.html?layer=price&product=' + id, n: Object.fromEntries(L.map(l => [l, MAPW[l] + ' · ' + tri('Precios', 'Prices', 'Prix', 'Prezzi')[l] + ' · ' + (nm[l][key] || nm[l][id] || id)])), s: tri('Precio verificado por país', 'Verified price by country', 'Prix vérifié par pays', 'Prezzo verificato per paese'), k: (SYN[id] || '') + ' mapa map carte mappa precio price prix prezzo' });
}
// --- páginas y secciones
const PAGES = [
  ['index.html', tri('Inicio', 'Home', 'Accueil', 'Home'), 'portada home dehesa index indice índice resumen movers'],
  ['precios.html', tri('Precios', 'Prices', 'Prix', 'Prezzi'), 'precios prices prix prezzi cotizaciones cotizacion mercado lonja'],
  ['noticias.html', tri('Noticias', 'News', 'Actualités', 'Notizie'), 'noticias news actualites actualités notizie titulares'],
  ['calendario.html', tri('Calendario', 'Calendar', 'Calendrier', 'Calendario'), 'calendario calendar calendrier informes fechas publicacion wasde'],
  ['informacion.html', tri('Información y fuentes', 'Information and sources', 'Informations et sources', 'Informazioni e fonti'), 'informacion información fuentes sources quienes somos about acerca'],
  ['blog.html', tri('Blog', 'Blog', 'Blog', 'Blog'), 'blog notas analisis análisis articulos'],
  ['empresas.html', tri('Empresas', 'Business', 'Entreprises', 'Aziende'), 'empresas business companies profesionales datos api'],
  ['contacto.html', tri('Contacto', 'Contact', 'Contact', 'Contatti'), 'contacto contact contatti email correo escribir'],
  ['metodologia.html', tri('Metodología', 'Methodology', 'Méthodologie', 'Metodologia'), 'metodologia methodology méthodologie como se calcula how calculated fuentes verificacion'],
  ['legal.html', tri('Aviso legal y privacidad', 'Legal notice and privacy', 'Mentions légales et confidentialité', 'Note legali e privacy'), 'legal privacidad privacy cookies terminos terms rgpd gdpr aviso'],
  ['clima.html', tri('Clima agrícola', 'Agricultural climate', 'Climat agricole', 'Clima agricolo'), 'clima climate lluvia rain temperatura sequia nasa'],
  ['mapa.html', tri('Mapa agrícola', 'Agricultural map', 'Carte agricole', 'Mappa agricola'), 'mapa map carte mappa paises countries geografico'],
  ['oferta-demanda.html', OD, 'oferta demanda supply demand balance produccion consumo exportaciones importaciones existencias usda psd wasde'],
  ['cultivos.html', CS, 'cultivos crops condicion valoracion siembra cosecha progress nass estados unidos']
];
for (const [u, n, k] of PAGES) add({ t: 'page', u, n, s: tri('Página', 'Page', 'Page', 'Page'), k });
function sections(file, page, pageName) {
  const src = read(file), re = /\{ h: '((?:[^'\\]|\\.)*)', id: '([a-z0-9-]+)'/g, by = {}; let m;
  while ((m = re.exec(src))) (by[m[2]] = by[m[2]] || []).push(m[1].replace(/\\'/g, '’'));
  for (const [id, hs] of Object.entries(by)) if (hs.length === 4) add({ t: 'section', u: page + '#' + id, n: Object.fromEntries(L.map((l, i) => [l, hs[i]])), s: pageName, k: id.replace(/-/g, ' ') });
}
sections('js/metodologia.js', 'metodologia.html', tri('Metodología', 'Methodology', 'Méthodologie', 'Metodologia'));
sections('js/legal.js', 'legal.html', tri('Aviso legal', 'Legal notice', 'Mentions légales', 'Note legali'));
// --- conceptos
const CON = [
  ['metodologia.html#etiquetas', tri('REAL, NO COMPARABLE y PENDIENTE', 'REAL, NOT COMPARABLE and PENDING', 'RÉEL, NON COMPARABLE et EN ATTENTE', 'REALE, NON COMPARABILE e IN ATTESA'), 'etiquetas labels verificado pendiente comparable real estado'],
  ['metodologia.html#indice', tri('Dehesa Index: el índice compuesto', 'Dehesa Index: the composite index', 'Dehesa Index : l’indice composite', 'Dehesa Index: l’indice composito'), 'indice índice index composite base 100 crea tu propio indice personalizado']
];
for (const [u, n, k] of CON) add({ t: 'concept', u, n, s: tri('Cómo se calcula', 'How it works', 'Comment ça marche', 'Come funziona'), k });
fs.writeFileSync('data/search-index.json', JSON.stringify({ schemaVersion: '1.0', generatedAt: new Date().toISOString().slice(0, 10), entries: out.map((e, i) => ({ i, ...e })) }) + '\n');
console.log('entradas', out.length, Object.entries(out.reduce((a, e) => (a[e.t] = (a[e.t] || 0) + 1, a), {})).map(x => x.join(':')).join(' '));
