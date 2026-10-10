/* Dehesa Index — nombres de series legibles en el idioma elegido (resumen diario y portada).
   Traduce SOLO nombres que siguen un patrón conocido («Tipo: producto, región (unidad)») y cuyas piezas están todas en el diccionario;
   si falta alguna pieza se devuelve el nombre original sin tocar (no se adivina). El original se conserva en el atributo title.
   DILabel.t(label) -> { text, orig, changed }. */
(function (g) {
  'use strict';
  var L = { es: 0, en: 1, fr: 2, it: 3 };
  function lang() { var l = g.DehesaShared && g.DehesaShared.getLang ? g.DehesaShared.getLang() : 'es'; return L[l] != null ? l : 'es'; }
  /* [es, en, fr, it] */
  var KIND = {
    'Production': ['Producción', 'Production', 'Production', 'Produzione'],
    'Area': ['Superficie', 'Area', 'Superficie', 'Superficie'],
    'Yield': ['Rendimiento', 'Yield', 'Rendement', 'Resa'],
    'Farm-gate output price index': ['Índice de precios en origen', 'Farm-gate output price index', 'Indice des prix à la production', 'Indice dei prezzi alla produzione'],
    'Input price index (prices paid by farmers)': ['Índice de precios de insumos (pagados por los agricultores)', 'Input price index (prices paid by farmers)', 'Indice des prix des intrants (payés par les agriculteurs)', 'Indice dei prezzi degli input (pagati dagli agricoltori)']
  };
  var ITEM = {
    'Barley': ['Cebada', 'Barley', 'Orge', 'Orzo'], 'Spring barley': ['Cebada de primavera', 'Spring barley', 'Orge de printemps', 'Orzo primaverile'], 'Winter barley': ['Cebada de invierno', 'Winter barley', 'Orge d’hiver', 'Orzo invernale'],
    'Oats': ['Avena', 'Oats', 'Avoine', 'Avena'], 'Oilseed rape': ['Colza', 'Oilseed rape', 'Colza', 'Colza'], 'Wheat': ['Trigo', 'Wheat', 'Blé', 'Frumento'],
    'Apples': ['Manzanas', 'Apples', 'Pommes', 'Mele'], 'Pears': ['Peras', 'Pears', 'Poires', 'Pere'], 'Brussels sprouts': ['Coles de Bruselas', 'Brussels sprouts', 'Choux de Bruxelles', 'Cavoletti di Bruxelles'],
    'Cabbage lettuce - glasshouse': ['Lechuga redonda (invernadero)', 'Cabbage lettuce - glasshouse', 'Laitue pommée (serre)', 'Lattuga cappuccia (serra)'], 'Cabbage lettuce - open air': ['Lechuga redonda (aire libre)', 'Cabbage lettuce - open air', 'Laitue pommée (plein air)', 'Lattuga cappuccia (pieno campo)'],
    'Cauliflower': ['Coliflor', 'Cauliflower', 'Chou-fleur', 'Cavolfiore'], 'Chicory': ['Achicoria', 'Chicory', 'Chicorée', 'Cicoria'], 'Eggs': ['Huevos', 'Eggs', 'Œufs', 'Uova'],
    'Fresh vegetables': ['Hortalizas frescas', 'Fresh vegetables', 'Légumes frais', 'Ortaggi freschi'], 'Fruit': ['Fruta', 'Fruit', 'Fruits', 'Frutta'], 'Horticultural products': ['Productos hortícolas', 'Horticultural products', 'Produits horticoles', 'Prodotti orticoli'],
    'Leeks': ['Puerros', 'Leeks', 'Poireaux', 'Porri'], 'Other arable crops': ['Otros cultivos herbáceos', 'Other arable crops', 'Autres cultures arables', 'Altre colture erbacee'], 'Other cereals': ['Otros cereales', 'Other cereals', 'Autres céréales', 'Altri cereali'],
    'Peppers': ['Pimientos', 'Peppers', 'Poivrons', 'Peperoni'], 'Pigs': ['Porcino', 'Pigs', 'Porcs', 'Suini'], 'Plants and flowers': ['Plantas y flores', 'Plants and flowers', 'Plantes et fleurs', 'Piante e fiori'],
    'Potatoes': ['Patatas', 'Potatoes', 'Pommes de terre', 'Patate'], 'Red cabbage': ['Lombarda', 'Red cabbage', 'Chou rouge', 'Cavolo rosso'], 'Savoy cabbage': ['Berza rizada', 'Savoy cabbage', 'Chou de Milan', 'Verza'],
    'Sheep': ['Ovino', 'Sheep', 'Ovins', 'Ovini'], 'Tomatoes': ['Tomates', 'Tomatoes', 'Tomates', 'Pomodori'], 'White cabbage': ['Repollo blanco', 'White cabbage', 'Chou blanc', 'Cavolo bianco'],
    'Total crop': ['Total cultivos', 'Total crop', 'Total des cultures', 'Totale colture'], 'TOTAL CROP, excluding horticulture': ['Total cultivos, sin horticultura', 'Total crop, excluding horticulture', 'Total des cultures, hors horticulture', 'Totale colture, escluso orticoltura'],
    'TOTAL AGRICULTURAL GOODS, excluding fruit and vegetables': ['Total bienes agrarios, sin frutas ni hortalizas', 'Total agricultural goods, excluding fruit and vegetables', 'Total des biens agricoles, hors fruits et légumes', 'Totale beni agricoli, esclusi frutta e ortaggi'],
    'TOTAL AGRICULTURAL GOODS, including fruit and vegetables': ['Total bienes agrarios, con frutas y hortalizas', 'Total agricultural goods, including fruit and vegetables', 'Total des biens agricoles, y compris fruits et légumes', 'Totale beni agricoli, inclusi frutta e ortaggi'],
    'Compound feedingstuffs': ['Piensos compuestos', 'Compound feedingstuffs', 'Aliments composés', 'Mangimi composti'], 'Compound feedingstuffs for calves': ['Piensos compuestos para terneros', 'Compound feedingstuffs for calves', 'Aliments composés pour veaux', 'Mangimi composti per vitelli'],
    'Compound feedingstuffs for pigs': ['Piensos compuestos para porcino', 'Compound feedingstuffs for pigs', 'Aliments composés pour porcs', 'Mangimi composti per suini'], 'Other compound feedingstuffs': ['Otros piensos compuestos', 'Other compound feedingstuffs', 'Autres aliments composés', 'Altri mangimi composti'],
    'Energy': ['Energía', 'Energy', 'Énergie', 'Energia']
  };
  var REG = {
    'East Midlands': ['East Midlands', 'East Midlands', 'East Midlands', 'East Midlands'], 'Eastern': ['Este de Inglaterra', 'Eastern England', 'Est de l’Angleterre', 'Inghilterra orientale'], 'England': ['Inglaterra', 'England', 'Angleterre', 'Inghilterra'],
    'North East': ['Noreste de Inglaterra', 'North East England', 'Nord-Est de l’Angleterre', 'Inghilterra nord-orientale'], 'North West and Merseyside': ['Noroeste de Inglaterra y Merseyside', 'North West England and Merseyside', 'Nord-Ouest de l’Angleterre et Merseyside', 'Inghilterra nord-occidentale e Merseyside'],
    'South East and London': ['Sureste de Inglaterra y Londres', 'South East England and London', 'Sud-Est de l’Angleterre et Londres', 'Inghilterra sud-orientale e Londra'], 'South West': ['Suroeste de Inglaterra', 'South West England', 'Sud-Ouest de l’Angleterre', 'Inghilterra sud-occidentale'],
    'West Midlands': ['West Midlands', 'West Midlands', 'West Midlands', 'West Midlands'], 'Yorkshire & The Humber': ['Yorkshire y Humber', 'Yorkshire & The Humber', 'Yorkshire et Humber', 'Yorkshire e Humber']
  };
  var UNIT = { 'hectares': ['hectáreas', 'hectares', 'hectares', 'ettari'], 'tonnes': ['toneladas', 'tonnes', 'tonnes', 'tonnellate'], 't/ha': ['t/ha', 't/ha', 't/ha', 't/ha'], '2020=100': ['2020=100', '2020=100', '2020=100', '2020=100'] };
  function pick(d, k, i) { return Object.prototype.hasOwnProperty.call(d, k) ? d[k][i] : null; }
  function tr(label, lg) {
    var i = L[lg], m = /^([^:]+): (.+)$/.exec(label || ''); if (!m || i == null) return null;
    var kind = pick(KIND, m[1], i); if (kind == null) return null;
    var rest = m[2], u = /^(.*) \(([^()]+)\)$/.exec(rest), unit = null;
    if (u) { unit = pick(UNIT, u[2], i); if (unit == null) return null; rest = u[1]; }
    var item = pick(ITEM, rest, i), out;
    if (item != null) out = item;
    else { var c = rest.indexOf(', '); if (c < 0) return null; var a = pick(ITEM, rest.slice(0, c), i), r = pick(REG, rest.slice(c + 2), i); if (a == null || r == null) return null; out = a + ' · ' + r; }
    return kind + ': ' + out + (unit ? ' (' + unit + ')' : '');
  }
  g.DILabel = { t: function (label) { var lg = lang(), x = lg === 'en' ? null : tr(label, lg); return { text: x || label, orig: label, changed: !!x }; } };
})(window);
