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
  maiz: 'corn maize mais maïs cereal grano forraje', trigo: 'wheat blé ble frumento pan harina cereal candeal', arroz: 'rice riz riso paddy cereal', mantequilla: 'butter beurre burro lacteo lácteo', leche_polvo: 'skim milk powder smp lait poudre latte polvere desnatada', colza: 'rapeseed canola colza oleaginosa oilseed', centeno: 'rye seigle segale cereal', cebada: 'barley orge orzo cereal cerveza malta pienso', avena: 'oats avoine avena cereal pienso', sorgo: 'sorghum sorgho milo cereal grano forraje',
  leche: 'milk lait latte lacteo lácteo dairy vaca cruda', vaca: 'vacuno beef cattle bovino bovins bovini ternera buey novillo carne res vitello manzo',
  cabra: 'goat chevre chèvre capra caprino', cerdo: 'pork hogs pig porcino cochino cochinillo porc maiale swine', cordero: 'lamb sheep ovino oveja agneau agnello mouton',
  huevos: 'eggs oeufs uova huevo gallina', pollo: 'chicken broiler poulet aves avicultura', pienso: 'feed mangime aliment compuesto racion ración',
  harina_soja: 'soja soy soybean meal tourteau farina soia proteina pienso feed', urea: 'fertilizer fertilizante abono nitrogeno nitrógeno nitrogen engrais azote',
  dap: 'fosfato fósforo phosphate phosphorus fertilizer abono engrais fosforo', potasa: 'potassium potash potasio kali fertilizer abono engrais',
  soja_grano: 'soybean soja soy soia grano grain oilseed oleaginosa',
  lenteja: 'lentil lenteja lentille lenticchia pulse legumbre',
  guisante_seco: 'peas pea guisante pois piselli pulse legumbre proteaginosa',
  lino: 'flax flaxseed linseed lino linaza lin oilseed oleaginosa',
  canola_elevador: 'canola colza rapeseed elevator bid alberta semanal weekly',
  trigo_pienso_ab: 'feed wheat trigo forrajero pienso alberta weekly',
  cebada_pienso_ab: 'feed barley cebada forrajera pienso alberta weekly',
  avena_pienso_ab: 'feed oats avena forrajera pienso alberta weekly',
  trigo_cwrs_ab: 'cwrs wheat trigo panadero red spring alberta weekly',
  lenteja_laird_ab: 'lentil laird lenteja pulse alberta weekly',
  guisante_verde_ab: 'green pea guisante verde pulse alberta weekly',
  novillo_ab: 'steers novillos cattle vacuno alberta canfax weekly',
  cerdo_ab: 'hog pig cerdo porcino cash index 100 alberta weekly',
  gas_natural: 'natural gas gas natural henry hub ttf gaz naturel gas naturale lng energia energy', petroleo_wti: 'oil crude wti texas petróleo petroleo petrole petrolio barril barrel baril energia energy', petroleo_brent: 'oil crude brent petróleo petroleo petrole petrolio barril barrel baril energia energy',
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
const CROPS = { corn: tri('Maíz', 'Corn', 'Maïs', 'Mais'), soybeans: tri('Soja', 'Soybeans', 'Soja', 'Soia'), wheat_winter: tri('Trigo de invierno', 'Winter wheat', 'Blé d’hiver', 'Grano invernale'), wheat_spring: tri('Trigo de primavera', 'Spring wheat', 'Blé de printemps', 'Grano primaverile'), cotton: tri('Algodón', 'Cotton', 'Coton', 'Cotone'), sorghum: tri('Sorgo', 'Sorghum', 'Sorgho', 'Sorgo'), barley: tri('Cebada', 'Barley', 'Orge', 'Orzo'), rice: tri('Arroz', 'Rice', 'Riz', 'Riso'), oats: tri('Avena', 'Oats', 'Avoine', 'Avena'), peanuts: tri('Cacahuete', 'Peanuts', 'Arachide', 'Arachide') };
const CROPK = { corn: 'maiz corn maize mais', soybeans: 'soja soy soybean soia', wheat_winter: 'trigo wheat blé grano invierno winter', wheat_spring: 'trigo wheat blé grano primavera spring', cotton: 'algodon cotton coton cotone', sorghum: 'sorgo sorghum sorgho milo cereal', barley: 'cebada barley orge orzo cereal malta', rice: 'arroz rice riz riso', oats: 'avena oats avoine cereal', peanuts: 'cacahuete cacahuate mani maní peanut peanuts groundnut arachide arachidi' };
const CS = tri('Estado de los cultivos', 'Crop conditions', 'État des cultures', 'Stato delle colture');
for (const [id, nm] of Object.entries(CROPS)) {
  add({ t: 'crop', u: 'cultivos.html?crop=' + id, n: Object.fromEntries(L.map(l => [l, CS[l] + ' · ' + nm[l]])), s: tri('EE. UU. · USDA NASS Crop Progress', 'U.S. · USDA NASS Crop Progress', 'États-Unis · USDA NASS Crop Progress', 'USA · USDA NASS Crop Progress'), k: CROPK[id] + ' cultivo crop condicion condición valoracion siembra cosecha planting harvest progress buena excelente good excellent semis récolte semina raccolta' });
  add({ t: 'map', u: 'mapa.html?layer=crops&crop=' + id, n: Object.fromEntries(L.map(l => [l, MAPW[l] + ' · ' + CS[l] + ' · ' + nm[l]])), s: tri('Mapa de EE. UU. por estados', 'U.S. state map', 'Carte des États-Unis', 'Mappa degli Stati USA'), k: CROPK[id] + ' estados states mapa map cultivo crop' });
}
// --- Exportaciones de EE. UU. (FAS ESR y GATS)
{
  const EXS = tri('Ventas de exportación de EE. UU.', 'U.S. export sales', 'Ventes à l’exportation des États-Unis', 'Vendite all’esportazione USA');
  const GTS = tri('Comercio de EE. UU. por país', 'U.S. trade by country', 'Commerce des États-Unis par pays', 'Commercio USA per paese');
  const EN = { 107: ['Trigo', 'Wheat', 'Blé', 'Grano', 'trigo wheat blé grano'], 401: ['Maíz', 'Corn', 'Maïs', 'Mais', 'maiz corn maize'], 701: ['Sorgo', 'Sorghum', 'Sorgho', 'Sorgo', 'sorgo sorghum'], 301: ['Cebada', 'Barley', 'Orge', 'Orzo', 'cebada barley'], 801: ['Soja', 'Soybeans', 'Soja', 'Soia', 'soja soy soybeans'], 901: ['Harina de soja', 'Soybean meal', 'Tourteau de soja', 'Farina di soia', 'harina soja soybean meal'], 902: ['Aceite de soja', 'Soybean oil', 'Huile de soja', 'Olio di soia', 'aceite soja oil'], 1404: ['Algodón', 'Cotton', 'Coton', 'Cotone', 'algodon cotton'], 1505: ['Arroz', 'Rice', 'Riz', 'Riso', 'arroz rice'], 1701: ['Vacuno', 'Beef', 'Bœuf', 'Manzo', 'vacuno beef carne'], 1702: ['Cerdo', 'Pork', 'Porc', 'Maiale', 'cerdo pork carne'] };
  for (const [code, v] of Object.entries(EN)) {
    add({ t: 'supply', u: 'exportaciones.html?code=' + code, n: Object.fromEntries(L.map((l, i) => [l, EXS[l] + ' · ' + v[i]])), s: tri('EE. UU. · USDA FAS Export Sales (semanal)', 'U.S. · USDA FAS Export Sales (weekly)', 'États-Unis · USDA FAS Export Sales (hebdomadaire)', 'USA · USDA FAS Export Sales (settimanale)'), k: v[4] + ' exportaciones exports ventas sales compradores buyers pendientes outstanding embarques shipments' });
    add({ t: 'map', u: 'mapa.html?layer=buyers&code=' + code, n: Object.fromEntries(L.map((l, i) => [l, MAPW[l] + ' · ' + tri('Compradores', 'Buyers', 'Acheteurs', 'Acquirenti')[l] + ' · ' + v[i]])), s: tri('Mapa mundial', 'World map', 'Carte du monde', 'Mappa del mondo'), k: v[4] + ' compradores buyers exportaciones exports mapa map' });
  }
  add({ t: 'supply', u: 'exportaciones.html?tab=gats', n: GTS, s: tri('EE. UU. · USDA FAS GATS (mensual)', 'U.S. · USDA FAS GATS (monthly)', 'États-Unis · USDA FAS GATS (mensuel)', 'USA · USDA FAS GATS (mensile)'), k: 'comercio trade importaciones importations exportaciones exports pais country socios partners census gats mensual monthly china mexico canada japon' });
  add({ t: 'map', u: 'mapa.html?layer=trade', n: Object.fromEntries(L.map(l => [l, MAPW[l] + ' · ' + GTS[l]])), s: tri('Mapa mundial', 'World map', 'Carte du monde', 'Mappa del mondo'), k: 'comercio trade importaciones exportaciones exports imports socios partners mapa map gats' });
}
// --- NASS ganadería y lácteo, precios pagados; monitor de sequía
{
  const GS = tri('Ganadería de EE. UU.', 'U.S. livestock', 'Élevage aux États-Unis', 'Zootecnia USA');
  const GN = { hogs: [['Censo de cerdos (Hogs and Pigs)', 'Hog inventory (Hogs and Pigs)', 'Inventaire porcin (Hogs and Pigs)', 'Inventario suini (Hogs and Pigs)'], 'cerdos cerdo porcino hogs pigs pork inventario censo lechones porcs suini'], cattle: [['Censo de vacuno y vacas', 'Cattle and cow inventory', 'Inventaire bovin et vaches', 'Inventario bovini e vacche'], 'vacuno vacas terneros cattle cows calves beef cebadero on feed bovins bovini censo inventario'], dairy: [['Producción de leche por estado', 'Milk production by state', 'Production de lait par État', 'Produzione di latte per Stato'], 'leche lechero lacteo milk dairy produccion production precio price lait latte vacas lecheras'], cold: [['Existencias en frío de carne y lácteos', 'Cold storage of meat and dairy', 'Stocks frigorifiques de viande et produits laitiers', 'Scorte in frigo di carne e latticini'], 'existencias frio camaras cold storage stocks beef pork chicken turkey cheese butter eggs vacuno cerdo pollo pavo queso mantequilla huevos'] };
  for (const [tab, [nm, kw]] of Object.entries(GN)) add({ t: 'supply', u: 'ganaderia.html?tab=' + tab, n: Object.fromEntries(L.map((l, i) => [l, nm[i]])), s: tri('EE. UU. · USDA NASS', 'U.S. · USDA NASS', 'États-Unis · USDA NASS', 'USA · USDA NASS'), k: kw + ' nass estados unidos usa' });
  add({ t: 'map', u: 'mapa.html?layer=drought', n: Object.fromEntries(L.map(l => [l, MAPW[l] + ' · ' + tri('Sequía EE. UU.', 'U.S. drought', 'Sécheresse USA', 'Siccità USA')[l]])), s: tri('Mapa de EE. UU. por estados', 'U.S. state map', 'Carte des États-Unis', 'Mappa degli Stati USA'), k: 'sequia sequía drought seca estados states mapa map monitor' });
  const IN = { NITROGEN: [['Precio del nitrógeno (fertilizante)', 'Nitrogen fertilizer price', 'Prix de l’azote (engrais)', 'Prezzo dell’azoto (fertilizzante)'], 'nitrogeno urea amoniaco fertilizante fertilizer nitrogen azote azoto'], 'POTASH & PHOSPHATE': [['Precio de potasa y fosfato', 'Potash and phosphate price', 'Prix de la potasse et du phosphate', 'Prezzo di potassio e fosfato'], 'potasa fosfato fertilizante potash phosphate dap fertilizer'], 'FUELS, DIESEL': [['Precio del gasóleo agrícola', 'Farm diesel price', 'Prix du gazole agricole', 'Prezzo del gasolio agricolo'], 'gasoleo diesel combustible fuel gasoil carburante'], FEED: [['Precio de los piensos', 'Feed prices', 'Prix des aliments du bétail', 'Prezzo dei mangimi'], 'piensos pienso feed alimentacion animal mangimi aliments'], 'CHEMICAL TOTALS': [['Precio de los agroquímicos', 'Agrochemical prices', 'Prix des produits agrochimiques', 'Prezzo degli agrochimici'], 'agroquimicos herbicidas insecticidas fungicidas pesticidas chemicals herbicides'] };
  for (const [k, [nm, kw]] of Object.entries(IN)) add({ t: 'supply', u: 'insumos.html?k=' + encodeURIComponent(k), n: Object.fromEntries(L.map((l, i) => [l, nm[i]])), s: tri('EE. UU. · USDA NASS, precios pagados (índice)', 'U.S. · USDA NASS, prices paid (index)', 'États-Unis · USDA NASS, prix payés (indice)', 'USA · USDA NASS, prezzi pagati (indice)'), k: kw + ' costes insumos inputs precios pagados prices paid nass' });
}
// --- Mercados USDA (AMS): un resultado por informe, con las palabras de sus productos
import { existsSync } from 'node:fs';
if (existsSync(new URL('../data/ams/index.json', import.meta.url))) {
  const ams = JSON.parse(read('data/ams/index.json'));
  const MK = tri('Mercados USDA', 'USDA markets', 'Marchés USDA', 'Mercati USDA');
  const FAMK = { feed: 'piensos feed subproductos byproducts', bio: 'etanol ethanol ddgs destilados distillers', grain: 'granos grains cereales bids ofertas', oilseed: 'oleaginosas girasol sunflower canola', pulse: 'legumbres pulses beans lentejas lentils', rice: 'arroz rice', poultry: 'aves pollo pavo chicken turkey huevos eggs', meat: 'carne meat subproductos cerdo pork beef', pig: 'cerdos recria feeder pigs ovino sheep lana wool', cattle: 'ganado cattle terneros feeder vacuno', hay: 'heno hay alfalfa forraje', dairy: 'lacteos dairy leche milk mantequilla butter queso cheese suero whey', auction: 'subastas auctions ganado cattle terneros feeder', costs: 'costes produccion production costs', fv: 'frutas hortalizas verduras fruits vegetables produce patatas potatoes cebollas onions tomates tomatoes', retail: 'supermercado ofertas retail grocery feature pollo chicken huevos eggs cerdo pork vacuno beef' };
  for (const r of ams.reports) {
    let words = '';
    try { const d = JSON.parse(read('data/ams/' + r.id + '.json')); const seen = new Set(); for (let i = 0; i < Math.min(2, d.dn.length); i++) for (const sr of d.series) if (sr.v[i]) seen.add(sr.v[i]); words = [...seen].slice(0, 60).join(' '); } catch (e) {}
    add({ t: 'market', u: 'mercados.html?r=' + r.id, n: Object.fromEntries(L.map(l => [l, MK[l] + ' · ' + r.title])), s: tri('EE. UU. · USDA AMS Market News', 'U.S. · USDA AMS Market News', 'États-Unis · USDA AMS Market News', 'USA · USDA AMS Market News'), k: (FAMK[r.fam] || '') + ' ' + r.title + ' ' + words });
  }
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
  ['paises.html?c=FR', tri('Datos de Francia', 'Data for France', 'Données : France', 'Dati per Francia'), 'francia france francés francais franceagrimer cotizaciones cotations quotations trigo blé wheat cebada orge barley maiz maïs maize vacuno bovins cattle cerdo porc pork cordero agneau lamb precios pagados productor prix payés paises country pais datos data'],
  ['paises.html?c=DE', tri('Datos de Alemania', 'Data for Germany', 'Données : Allemagne', 'Dati per Germania'), 'alemania germany allemagne germania deutschland ble destatis milch leche milk lait schlachtpreise sacrificio slaughter obst gemüse fruta hortalizas fruit vegetables erzeugerpreise indices bundesländer paises country pais datos data'],
  ['paises.html?c=BE', tri('Datos de Bélgica', 'Data for Belgium', 'Données : Belgique', 'Dati per Belgio'), 'belgica belgium belgique belgio belgië statbel leche milk lait sacrificio slaughter abattages indices precios agricolas prix agricoles porcino cerdo vacuno flandes flanders wallonie paises country pais datos data'],
  ['paises.html?c=AT', tri('Datos de Austria', 'Data for Austria', 'Données : Autriche', 'Dati per Austria'), 'austria autriche österreich eurostat statistik ama agrarmarkt milch leche milk precios productor trigo weizen maiz mais cerdo schwein vacuno rind sacrificio cultivos paises country pais datos data'],
  ['paises.html?c=PT', tri('Datos de Portugal', 'Data for Portugal', 'Données : Portugal', 'Dati per Portogallo'), 'portugal portugués portugais portoghese ine azeite aceite oliva olive oil leche leite milk carne vacuno bovino suino cerdo ovino caprino cereales trigo milho cortiça corcho cork montado alentejo ifap isip parcelas parcelle parcels mapa map cultivos declarados crop map eurostat censo ganadero cultivos precios paises country pais datos data'],
  ['paises.html?c=CA', tri('Datos de Canadá', 'Data for Canada', 'Données : Canada', 'Dati per Canada'), 'canada canadá canadien canadese statistics canada statcan trigo wheat canola colza cebada barley avena oats lentejas lentils guisantes peas lino flax soja soybeans maiz corn existencias stocks cosecha harvest produccion production vacuno cattle cerdo hogs pork leche milk dairy huevos eggs aves poultry ingresos agrarios farm income receipts net farm income costes input price index fertilizantes fertilizer potash saskatchewan alberta manitoba ontario quebec paises country pais datos data'],
  ['paises.html?c=ES', tri('Datos de España', 'Data for Spain', 'Données : Espagne', 'Dati per Spagna'), 'españa spain espagne spagna mapa siar recan precios percibidos pagados índices leche cereales fertilizantes piensos paises country pais datos data'],
  ['paises.html?c=DK', tri('Datos de Dinamarca', 'Data for Denmark', 'Données : Danemark', 'Dati per Danimarca'), 'dinamarca denmark danemark danimarca statistics denmark dst cerdo porc pork leche trigo cebada paises country pais datos data'],
  ['paises.html?c=NL', tri('Datos de Países Bajos', 'Data for Netherlands', 'Données : Pays-Bas', 'Dati per Paesi Bassi'), 'paises bajos netherlands holanda pays-bas olanda cbs leche ganado cultivos estiércol paises country pais datos data'],
  ['paises.html?c=AU', tri('Datos de Australia', 'Data for Australia', 'Données : Australie', 'Dati per Australia'), 'australia abs sacrificio exportaciones trigo cebada carne índices precios exportación paises country pais datos data'],
  ['paises.html', tri('Datos por país: España, Francia, Alemania, Bélgica, Austria, Portugal, Dinamarca, Países Bajos y Australia', 'Data by country: Spain, France, Germany, Belgium, Austria, Portugal, Denmark, the Netherlands and Australia', 'Données par pays : Espagne, France, Allemagne, Belgique, Autriche, Portugal, Danemark, Pays-Bas et Australie', 'Dati per paese: Spagna, Francia, Germania, Belgio, Austria, Portogallo, Danimarca, Paesi Bassi e Australia'), 'paises country pais alemania germany allemagne deutschland ble destatis leche milk lait schlachtpreise obst gemuse francia france francais franceagrimer cotizaciones cotations quotations trigo blé wheat cebada barley maiz maize vacuno bovins cattle cerdo porc pork cordero agneaux lamb produccion production leche milk carne meat sacrificio slaughter exportaciones exports dinamarca denmark paises bajos netherlands holanda australia cbs abs statistics'],
  ['region.html?c=US&r=IA', tri('Perfil por estado de EE. UU.', 'U.S. state profile', 'Profil par État américain', 'Profilo per Stato USA'), 'estado state iowa texas kansas nebraska illinois perfil profile region mapa sequia drought cultivos crops cattle precios locales fertilizantes'],
  ['region.html?c=ES&r=AN', tri('Perfil por comunidad autónoma de España', 'Spanish autonomous community profile', 'Profil par communauté autonome espagnole', 'Profilo per comunità autonoma spagnola'), 'comunidad autonoma andalucia castilla cataluña galicia extremadura aragon españa spain perfil profile region mapa recan renta costes explotaciones'],
  ['region.html?c=FR&r=BRE', tri('Perfil por región de Francia', 'French region profile', 'Profil par région française', 'Profilo per regione francese'), 'region francia france bretagne occitanie normandie nouvelle-aquitaine perfil profile mapa produccion renta cultivos ganado leche explotaciones'],
  ['region.html?c=IT&r=LOM', tri('Perfil por región de Italia', 'Italian region profile', 'Profil par région italienne', 'Profilo per regione italiana'), 'region italia italy lombardia veneto emilia-romagna sicilia puglia perfil profile mapa produccion renta cultivos ganado leche explotaciones'],
  ['region.html?c=DE&r=NI', tri('Perfil por Land de Alemania', 'German state (Land) profile', 'Profil par Land allemand', 'Profilo per Land tedesco'), 'land länder alemania germany bayern niedersachsen nordrhein-westfalen perfil profile mapa produccion renta cultivos ganado leche precios ble'],
  ['region.html?c=AU&r=NSW', tri('Perfil por estado de Australia', 'Australian state profile', 'Profil par État australien', 'Profilo per stato australiano'), 'australia estado state new south wales victoria queensland western australia perfil profile mapa exportaciones carne trigo lana'],
  ['region.html?c=NL&r=NB', tri('Perfil por provincia de los Países Bajos', 'Dutch province profile', 'Profil par province néerlandaise', 'Profilo per provincia olandese'), 'paises bajos netherlands holanda provincia province brabante gelderland friesland perfil profile mapa leche cerdo'],
  ['region.html?c=AT&r=ST', tri('Perfil por estado federado de Austria', 'Austrian state (Land) profile', 'Profil par Land autrichien', 'Profilo per Land austriaco'), 'austria land estado federado niederösterreich steiermark tirol perfil profile mapa leche bosque'],
  ['region.html?c=BE&r=VWV', tri('Perfil por provincia de Bélgica', 'Belgian province profile', 'Profil par province belge', 'Profilo per provincia belga'), 'belgica belgium belgique provincia province flandes flanders vlaanderen valonia wallonie wallonia amberes antwerpen lieja liege henao hainaut perfil profile mapa leche patata'],
  ['region.html?c=DK&r=MID', tri('Perfil por región de Dinamarca', 'Danish region profile', 'Profil par région danoise', 'Profilo per regione danese'), 'dinamarca denmark danemark region jutlandia jylland selandia sjaelland hovedstaden syddanmark perfil profile mapa cerdo leche'],
  ['region.html?c=CA&r=SK', tri('Perfil por provincia de Canadá', 'Canadian province profile', 'Profil par province canadienne', 'Profilo per provincia canadese'), 'provincia province saskatchewan alberta manitoba ontario quebec canada canadá perfil profile region mapa sequia drought costes precios combustible'],
  ['canada-granos.html', tri('Granos de Canadá: exportaciones, entregas y existencias semanales', 'Canadian grain: weekly exports, deliveries and stocks', 'Céréales du Canada : exportations, livraisons et stocks hebdomadaires', 'Cereali del Canada: esportazioni, consegne e scorte settimanali'), 'canada canadá granos grain trigo wheat canola cebada barley durum avena oats lentejas lentils guisantes peas exportaciones exports entregas deliveries existencias stocks cgc canadian grain commission'],
  ['recan.html', tri('Costes y rentas de las explotaciones agrarias de España (RECAN)', 'Farm costs and incomes in Spain (RECAN)', 'Coûts et revenus des exploitations en Espagne (RECAN)', 'Costi e redditi delle aziende agricole in Spagna (RECAN)'), 'recan costes costs rentas renta income explotaciones farms subvenciones subsidies espana spain comunidad autonoma ccaa mapa produccion bruta margen beneficio'],
  ['clima.html', tri('Clima agrícola', 'Agricultural climate', 'Climat agricole', 'Clima agricolo'), 'clima climate lluvia rain temperatura sequia nasa'],
  ['mapa.html', tri('Mapa agrícola', 'Agricultural map', 'Carte agricole', 'Mappa agricola'), 'mapa map carte mappa paises countries geografico'],
  ['oferta-demanda.html', OD, 'oferta demanda supply demand balance produccion consumo exportaciones importaciones existencias usda psd wasde'],
  ['mercados.html', tri('Mercados USDA', 'USDA markets', 'Marchés USDA', 'Mercati USDA'), 'mercados usda ams market news precios prices piensos feed etanol ethanol granos grains legumbres pulses aves poultry huevos eggs ganado cattle heno hay lacteos dairy'],
  ['exportaciones.html', tri('Exportaciones de EE. UU.', 'U.S. exports', 'Exportations américaines', 'Esportazioni USA'), 'exportaciones exports ventas sales compradores buyers comercio trade fas gats census importaciones paises countries'],
  ['europa.html', tri('Precios de la UE: cereales, oleaginosas, lácteos, carne, huevos, aceite, azúcar, vino, fruta y hortaliza y fertilizantes por país', 'EU prices: cereals, oilseeds, dairy, meat, eggs, olive oil, sugar, wine, fruit and vegetables and fertilisers by country', 'Prix de l’UE : céréales, oléagineux, produits laitiers, viande, œufs, huile d’olive, sucre, vin et engrais par pays', 'Prezzi UE: cereali, semi oleosi, latticini, carne, uova, olio, zucchero, vino e fertilizzanti per paese'), 'precios ue europa europe eu prices comision europea agri-food cebada barley colza rapeseed girasol sunflower mantequilla butter leche polvo smp wmp queso cheese cheddar gouda edam vacuno ternera vaca novilla cerdo lechon pollo huevos cordero arroz aceite oliva azucar vino fruta hortaliza manzana tomate naranja melocotón pera patata fresa cebolla lechuga pimiento fruit vegetables apples tomatoes oranges peaches fertilizantes nitrogeno fosforo potasa alemania francia italia polonia paises pais'],
  ['producto.html', tri('Ficha de producto: trigo, maíz, cebada, avena, arroz, soja, colza, leche, vacuno, cerdo, huevos, urea, fertilizantes, diésel y aceite de oliva', 'Product profile: wheat, corn, barley, oats, rice, soybeans, rapeseed, milk, beef, pork, eggs, urea, fertiliser, diesel and olive oil', 'Fiche produit : blé, maïs, orge, avoine, riz, soja, colza, lait, bœuf, porc, œufs, urée, engrais, diesel et huile d’olive', 'Scheda prodotto: grano, mais, orzo, avena, riso, soia, colza, latte, bovino, suino, uova, urea, fertilizzanti, diesel e olio d’oliva'), 'ficha producto terminal commodity page trigo maiz cebada avena vacuno cerdo huevos urea fertilizantes diesel gasoleo oliva wheat corn barley oats soja arroz colza leche pollo soybeans rice rapeseed milk chicken beef pork cattle hogs eggs fertiliser precio comparacion historico oferta demanda comercio aranceles costes exportaciones sequia'],
  ['rendimientos.html', tri('Rendimientos y superficie por estado de EE. UU.', 'U.S. yields and acreage by state', 'Rendements et surfaces par État américain', 'Rese e superfici per Stato USA'), 'rendimientos rendimiento yield superficie acres area sembrada cosechada produccion production estados states maiz soja trigo algodon corn soybeans wheat cotton nass'],
  ['ganaderia.html', tri('Ganadería y lácteo de EE. UU.', 'U.S. livestock and dairy', 'Élevage et lait aux États-Unis', 'Zootecnia e latte USA'), 'ganaderia ganado cerdos vacuno leche existencias frio cold storage hogs cattle milk dairy nass estados'],
  ['insumos.html', tri('Costes de los insumos agrarios de EE. UU.', 'U.S. farm input costs', 'Coûts des intrants agricoles aux États-Unis', 'Costi degli input agricoli USA'), 'insumos inputs costes fertilizantes combustibles piensos precios pagados prices paid fertilizer fuel feed nass'],
  ['costes.html', tri('Alimentos, costes de producción y renta agraria de EE. UU.', 'U.S. food prices, production costs and farm income', 'Prix alimentaires, coûts de production et revenu agricole aux États-Unis', 'Prezzi alimentari, costi di produzione e reddito agricolo USA'), 'ers precios alimentos food price outlook inflacion cpi costes produccion rentabilidad renta agraria farm income costs returns break-even'],
  ['sequia.html', tri('Monitor de sequía de EE. UU.', 'U.S. Drought Monitor', 'Moniteur de sécheresse américain', 'Monitor della siccità USA'), 'sequia sequía drought monitor seca sequedad clima estados superficie usdm noaa sécheresse siccità'],
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

// --- país × categoría (perfiles de país: paises.html?c=XX&g=grupo) y páginas nuevas
{
  const pl = read('js/paises.js').split('\n'), GL = {};
  L.forEach((l, i) => { const ln = pl.find(x => /^\s+country: '/.test(x) && x.indexOf('production: \'') > -1 && pl.indexOf(x) === [9, 13, 17, 21][i]) || pl[[9, 13, 17, 21][i]]; const seg = ln.slice(ln.indexOf("production: '")), re = /(\w+): '((?:[^'\\]|\\.)*)'/g; let m; while ((m = re.exec(seg))) { if (m[1] === 'latest') break; (GL[m[1]] = GL[m[1]] || {})[l] = m[2].replace(/\\'/g, '’'); } });
  const CN = { ES: ['España', 'Spain', 'Espagne', 'Spagna', 'spain españa espanol'], FR: ['Francia', 'France', 'France', 'Francia', 'francia france'], DE: ['Alemania', 'Germany', 'Allemagne', 'Germania', 'alemania germany deutschland'], BE: ['Bélgica', 'Belgium', 'Belgique', 'Belgio', 'belgica belgium belgique'], AT: ['Austria', 'Austria', 'Autriche', 'Austria', 'austria osterreich'], PT: ['Portugal', 'Portugal', 'Portugal', 'Portogallo', 'portugal'], DK: ['Dinamarca', 'Denmark', 'Danemark', 'Danimarca', 'dinamarca denmark'], NL: ['Países Bajos', 'Netherlands', 'Pays-Bas', 'Paesi Bassi', 'paises bajos netherlands holanda'], CA: ['Canadá', 'Canada', 'Canada', 'Canada', 'canada canadá'], AU: ['Australia', 'Australia', 'Australie', 'Australia', 'australia'], US: ['EE. UU.', 'United States', 'États-Unis', 'Stati Uniti', 'eeuu usa united states estados unidos'], EU: ['Unión Europea', 'European Union', 'Union européenne', 'Unione europea', 'ue eu union europea european union europe'] };
  const files = ['country-stats', 'spain-stats', 'france-stats', 'germany-stats', 'belgium-stats', 'austria-stats', 'uk-stats', 'portugal-stats', 'portugal-eurostat-stats', 'italy-eurostat-stats', 'eurostat-depth-stats', 'uk-trade-stats', 'chile-stats', 'argentina-stats', 'poland-eurostat-stats', 'poland-stats', 'eu-gapfill-stats', 'canada-stats', 'us-stats', 'australia-trade-stats', 'eu-trade-stats', 'interest-rates-stats'];
  const acc = {};
  for (const f of files) { let d; try { d = JSON.parse(read('data/' + f + '.json')); } catch (e) { continue; } for (const [cc, c] of Object.entries(d.countries || {})) for (const sr of c.series) { const k = cc + '|' + sr.group; (acc[k] = acc[k] || []).push(sr.label); } }
  for (const [k, labels] of Object.entries(acc)) {
    const [cc, g] = k.split('|'); if (!CN[cc] || !GL[g]) continue;
    const n = Object.fromEntries(L.map((l, i) => [l, CN[cc][i] + ' · ' + GL[g][l]]));
    const kw = CN[cc][4] + ' ' + g.replace(/_/g, ' ') + ' ' + L.map(l => GL[g][l]).join(' ') + ' ' + [...new Set(labels.slice(0, 40).map(x => x.replace(/[()·:,]/g, ' ').toLowerCase()))].join(' ').slice(0, 600);
    add({ t: 'country', u: 'paises.html?c=' + cc + '&g=' + g, n, s: tri('Datos por país', 'Country data', 'Données par pays', 'Dati per paese'), k: kw });
  }
  const P2 = [
    ['perfiles.html', tri('Perfiles de país y comparador', 'Country profiles and comparison', 'Profils de pays et comparateur', 'Profili paese e confronto'), 'perfiles perfil profile profiles comparar compare comparador comparison paises countries ue eu union europea'],
    ['aranceles.html', tri('Aranceles agroalimentarios (EE. UU., UE, Canadá, México)', 'Agri-food tariffs (US, EU, Canada, Mexico)', 'Droits de douane agroalimentaires (États-Unis, UE, Canada, Mexique)', 'Dazi agroalimentari (USA, UE, Canada, Messico)'), 'aranceles arancel tariff tariffs duties derechos aduana customs hts taric usitc cbsa mexico canada ue eu usa trump seccion 122 301 ieepa'],
    ['catalogo.html', tri('Catálogo de datos', 'Data catalogue', 'Catalogue de données', 'Catalogo dei dati'), 'catalogo catalogue catalog manifiesto manifest series registro registry datos data descargar download json api abiertos open data paises metricas'],
    ['comparador.html', tri('Comparador por producto y país', 'Product and country comparator', 'Comparateur par produit et pays', 'Confronto per prodotto e paese'), 'comparador comparar comparador unidades unit engine moneda euros dolares indice 100 trigo maiz cebada avena colza leche paises compare wheat corn barley milk currency units precios por pais'],
    ['insumos.html#usm-cot', tri('Mercado e insumos de EE. UU.: fondos (CFTC), fletes del grano y gasóleo', 'U.S. markets and inputs: funds (CFTC), grain freight and diesel', 'Marchés et intrants des États-Unis : fonds (CFTC), fret du grain et gazole', 'Mercati e input degli USA: fondi (CFTC), noli del grano e gasolio'), 'cftc cot commitments of traders posiciones fondos managed money gestores de dinero especuladores maiz soja trigo vacuno porcino corn soybeans wheat cattle hogs barcaza barge flete freight misisipi mississippi tren lanzadera shuttle train ferrocarril rail transporte grano grain transportation agtransport base basis gasoleo diesel padd medio oeste midwest propano propane secado calefaccion eia fonds gazole fret fondi gasolio nolo etanol ethanol eia inspecciones exportacion export inspections fgis embarques cargamentos puertos demanda maiz soja precios referencia ganado carne cutout boxed beef vacuno en caja novillo steers pork cerdo base hogs lmr notificacion obligatoria de precios'],
    ['pac.html?c=EU', tri('PAC en la UE: asignaciones por país 2023-2027', 'EU CAP: allocations by country 2023-2027', 'PAC dans l’UE : dotations par pays 2023-2027', 'PAC nell’UE: dotazioni per paese 2023-2027'), 'pac cap politica agricola comun union europea ue eu-27 reglamento 2021/2115 anexo v anexo xi pagos directos desarrollo rural feader eafrd asignaciones allocations dotations dotazioni plan estrategico strategic plan francia alemania belgica austria portugal dinamarca paises bajos france germany belgium austria denmark netherlands'],
    ['pac.html', tri('PAC España: ayudas por hectárea, calendario y reglas', 'Spain CAP: payments per hectare, calendar and rules', 'PAC Espagne : aides par hectare, calendrier et règles', 'PAC Spagna: aiuti per ettaro, calendario e regole'), 'pac politica agricola comun ayudas directas ecorregimenes ayuda basica renta redistributiva joven agricultor solicitud unica fega boe real decreto 1048/2022 hectarea calendario cap common agricultural policy eco-schemes direct payments basic income support young farmer single application spain pac espagne ecoregimes aides directes demande unique pac spagna ecoschemi pagamenti diretti domanda unica'],
    ['mi-mercado.html', tri('Mi mercado: tu zona y tu producto', 'My market: your area and your product', 'Mon marché : votre zone et votre produit', 'Il mio mercato: la tua zona e il tuo prodotto'), 'mi mercado mi zona mi producto agricultor precio local seguro sequia estado provincia kansas iowa texas valladolid cultivo ganado heno maiz soja trigo my market local price crop insurance drought state province farmer mon marche prix local assurance secheresse il mio mercato prezzo locale assicurazione siccita'],
    ['mi-seguimiento.html', tri('Mi seguimiento', 'My watchlist', 'Mon suivi', 'Il mio seguito'), 'mi seguimiento lista de seguimiento avisos alertas reglas seguir series productos exportar importar json watchlist alerts rules follow my watchlist suivi alertes liste seguito avvisi'],
    ['observatorio.html', tri('Observatorio de datos', 'Data observatory', 'Observatoire des données', 'Osservatorio dei dati'), 'observatorio datos novedades nuevas observaciones mayores movimientos frescura revisiones cobertura calidad pipelines salud actualizado observatory new observations biggest moves freshness revisions coverage quality pipeline health observatoire nouveautés osservatorio novità'],
    ['relaciones.html', tri('Relaciones entre mercados', 'Cross-market relationships', 'Relations entre marchés', 'Relazioni tra mercati'), 'relaciones entre mercados correlacion insumos fertilizante energia pienso diesel urea rezago hipotesis descriptivo cross market relationship correlation lag input fertiliser energy feed corrélation relation intrants correlazione relazione input'],
    ['calculadora.html', tri('Calculadora de margen y precio de equilibrio', 'Margin and break-even calculator', 'Calculateur de marge et de prix d’équilibre', 'Calcolatore di margine e prezzo di pareggio'), 'calculadora margen break even equilibrio coste por hectarea tonelada acre bushel rentabilidad agricultor calculator margin cost per hectare breakeven farmer profit calculateur marge cout calcolatore margine costo'],
    ['brief.html', tri('Qué ha cambiado hoy', 'What changed today', 'Ce qui a changé aujourd’hui', 'Cosa è cambiato oggi'), 'brief resumen diario que ha cambiado hoy cambios novedades avisos alertas lista seguimiento watchlist daily what changed alerts revisiones nuevos datos'],
    ['status.html', tri('Estado de los datos', 'Data status', 'État des données', 'Stato dei dati'), 'estado status pipeline pipelines actualizacion update datos data calidad quality workflow errores']
  ];
  for (const [u, n, k] of P2) add({ t: 'page', u, n, s: tri('Página', 'Page', 'Page', 'Page'), k });
}
// --- notas del blog: titulares de js/blog.js (STRINGS.<lg>.posts[].title), una entrada por nota apuntando a blog.html
{
  const bsrc = fs.readFileSync('js/blog.js', 'utf8');
  const per = {};
  for (const lg of ['es', 'en', 'fr', 'it']) {
    const a = bsrc.indexOf('STRINGS.' + lg + ' = {');
    const b = bsrc.indexOf('STRINGS.', a + 10);
    const seg = bsrc.slice(a, b > 0 ? b : undefined);
    const ps = seg.indexOf('posts: [');
    per[lg] = [...seg.slice(ps).matchAll(/\n\s+title: '((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'"));
  }
  const n = per.es.length;
  if (!n || ['en', 'fr', 'it'].some(l => per[l].length !== n)) throw new Error('blog.js: numero de notas distinto por idioma');
  for (let i = 0; i < n; i++) add({ t: 'page', u: 'blog.html', n: { es: per.es[i], en: per.en[i], fr: per.fr[i], it: per.it[i] }, s: tri('Blog', 'Blog', 'Blog', 'Blog'), k: 'blog nota analisis análisis' });
}
fs.writeFileSync('data/search-index.json', JSON.stringify({ schemaVersion: '1.0', generatedAt: new Date().toISOString().slice(0, 10), entries: out.map((e, i) => ({ i, ...e })) }) + '\n');
console.log('entradas', out.length, Object.entries(out.reduce((a, e) => (a[e.t] = (a[e.t] || 0) + 1, a), {})).map(x => x.join(':')).join(' '));
