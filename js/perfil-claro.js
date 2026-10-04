/* Dehesa Index — perfiles de país explicados en claro. ES5, sin librerías; funciona en el navegador (window.DIClear) y en Node (module.exports).
   Todo sale de las series publicadas: ninguna cifra se estima ni se interpreta. Si falta un dato, la frase no se escribe.
   - tl(label, lang): traduce el nombre de una serie por plantillas controladas; lo que no reconoce lo deja tal cual (nunca se inventa).
   - plain(...): resumen de 2–3 frases con los datos del país.
   - ctx(series): dónde está el último dato dentro de su propio rango de 5 años.
   - help(key, lang): explicación breve de la jerga (botón «?»). - questions(...): preguntas guía. - nav(...): índice de secciones. */
(function (root) {
  'use strict';
  var L = ['es', 'en', 'fr', 'it'];
  function li(l) { return { es: 1, en: 0, fr: 2, it: 3 }[l] === undefined ? 1 : { es: 1, en: 0, fr: 2, it: 3 }[l]; } // columna en HEAD/TERM: [en, es, fr, it]

  // ---------- traducción de nombres de serie ----------
  // [en, es, fr, it]
  var HEAD = [
    ['Producer price index, annual', 'Índice de precios al productor, anual', 'Indice des prix à la production, annuel', 'Indice dei prezzi alla produzione, annuale'],
    ['Producer price index', 'Índice de precios al productor', 'Indice des prix à la production', 'Indice dei prezzi alla produzione'],
    ['Farm-gate output price index', 'Índice de precios de venta en explotación', 'Indice des prix de vente à la ferme', 'Indice dei prezzi alla produzione agricola'],
    ['Farm product price index', 'Índice de precios de productos agrarios', 'Indice des prix des produits agricoles', 'Indice dei prezzi dei prodotti agricoli'],
    ['Input price index (prices paid by farmers)', 'Índice de precios de insumos (pagados por los agricultores)', 'Indice des prix des intrants (payés par les agriculteurs)', 'Indice dei prezzi degli input (pagati dagli agricoltori)'],
    ['Farm input price index', 'Índice de precios de insumos agrarios', 'Indice des prix des intrants agricoles', 'Indice dei prezzi degli input agricoli'],
    ['Input price index', 'Índice de precios de insumos', 'Indice des prix des intrants', 'Indice dei prezzi degli input'],
    ['Trade balance', 'Balanza comercial', 'Balance commerciale', 'Bilancia commerciale'],
    ['Exports', 'Exportaciones', 'Exportations', 'Esportazioni'],
    ['Imports', 'Importaciones', 'Importations', 'Importazioni'],
    ['Poultry and rabbit slaughterings', 'Sacrificio de aves y conejos', 'Abattages de volailles et de lapins', 'Macellazioni di avicoli e conigli'],
    ['Slaughterings', 'Sacrificios', 'Abattages', 'Macellazioni'],
    ['Livestock on holdings', 'Ganado en explotaciones', 'Cheptel dans les exploitations', 'Bestiame nelle aziende'],
    ['Meat production', 'Producción de carne', 'Production de viande', 'Produzione di carne'],
    ['Organic production', 'Producción ecológica', 'Production biologique', 'Produzione biologica'],
    ['Farm cash receipts', 'Ingresos agrarios en efectivo', 'Recettes agricoles en espèces', 'Ricavi agricoli in contanti'],
    ['Cattle livestock', 'Ganado bovino', 'Cheptel bovin', 'Bestiame bovino'],
    ['Pig livestock', 'Ganado porcino', 'Cheptel porcin', 'Bestiame suino'],
    ['Production', 'Producción', 'Production', 'Produzione'],
    ['Area', 'Superficie', 'Superficie', 'Superficie'],
    ['Yield', 'Rendimiento', 'Rendement', 'Resa'],
    ['Farm operating expenses', 'Gastos de explotación agraria', 'Dépenses d’exploitation agricole', 'Spese di esercizio agricole'],
    ['Farm input price index', 'Índice de precios de insumos agrarios', 'Indice des prix des intrants agricoles', 'Indice dei prezzi degli input agricoli'],
    ['Farm product price index', 'Índice de precios de productos agrarios', 'Indice des prix des produits agricoles', 'Indice dei prezzi dei prodotti agricoli'],
    ['Fertilizer shipments to Canadian agriculture', 'Envíos de fertilizantes a la agricultura canadiense', 'Livraisons d’engrais à l’agriculture canadienne', 'Consegne di fertilizzanti all’agricoltura canadese'],
    ['Farm income', 'Renta agraria', 'Revenu agricole', 'Reddito agricolo'],
    ['Farm balance sheet, value at 1 July', 'Balance de las explotaciones, valor a 1 de julio', 'Bilan des exploitations, valeur au 1er juillet', 'Bilancio delle aziende, valore al 1° luglio'],
    ['Farm debt outstanding', 'Deuda agraria pendiente', 'Dette agricole en cours', 'Debito agricolo in essere'],
    ['Retail price', 'Precio al público', 'Prix de détail', 'Prezzo al pubblico']
  ];
  var TERM = [
    ['wheat', 'trigo', 'blé', 'grano'], ['durum wheat', 'trigo duro', 'blé dur', 'grano duro'], ['barley', 'cebada', 'orge', 'orzo'], ['oats', 'avena', 'avoine', 'avena'], ['rye', 'centeno', 'seigle', 'segale'],
    ['rye and meslin', 'centeno y morcajo', 'seigle et méteil', 'segale e frumento-segale'], ['grain maize', 'maíz grano', 'maïs grain', 'mais da granella'], ['maize', 'maíz', 'maïs', 'mais'], ['triticale', 'triticale', 'triticale', 'triticale'],
    ['potatoes', 'patata', 'pommes de terre', 'patate'], ['sugar beet', 'remolacha azucarera', 'betterave sucrière', 'barbabietola da zucchero'], ['sunflower seed', 'girasol', 'tournesol', 'girasole'], ['sunflower', 'girasol', 'tournesol', 'girasole'],
    ['rapeseed', 'colza', 'colza', 'colza'], ['soybeans', 'soja', 'soja', 'soia'], ['vegetables', 'hortalizas', 'légumes', 'ortaggi'], ['fruit', 'fruta', 'fruits', 'frutta'], ['fruit and vegetables', 'frutas y hortalizas', 'fruits et légumes', 'frutta e ortaggi'],
    ['fruit, nuts, vegetables and pulses', 'frutas, frutos secos, hortalizas y legumbres', 'fruits, noix, légumes et légumineuses', 'frutta, frutta a guscio, ortaggi e legumi'],
    ['cattle', 'vacuno', 'bovins', 'bovini'], ['pigs', 'porcino', 'porcs', 'suini'], ['pig', 'porcino', 'porc', 'suino'], ['sheep', 'ovino', 'ovins', 'ovini'], ['sheep and goats', 'ovino y caprino', 'ovins et caprins', 'ovini e caprini'], ['goats', 'caprino', 'caprins', 'caprini'],
    ['eggs', 'huevos', 'œufs', 'uova'], ['milk', 'leche', 'lait', 'latte'], ['poultry', 'aves', 'volailles', 'avicoli'], ['cows', 'vacas', 'vaches', 'vacche'], ['dairy cows', 'vacas lecheras', 'vaches laitières', 'vacche da latte'], ['heifers', 'novillas', 'génisses', 'manze'],
    ['calves', 'terneros', 'veaux', 'vitelli'], ['young bulls', 'toretes', 'jeunes bovins', 'giovani bovini'], ['beef', 'vacuno (carne)', 'bœuf', 'manzo'], ['pork', 'porcino (carne)', 'porc', 'carne suina'], ['lamb', 'cordero', 'agneau', 'agnello'], ['meat', 'carne', 'viande', 'carne'],
    ['cereals', 'cereales', 'céréales', 'cereali'], ['other cereals', 'otros cereales', 'autres céréales', 'altri cereali'], ['oilseeds', 'oleaginosas', 'oléagineux', 'semi oleosi'], ['fertilisers', 'fertilizantes', 'engrais', 'fertilizzanti'], ['fertilizers', 'fertilizantes', 'engrais', 'fertilizzanti'],
    ['fertilisers and soil improvers', 'fertilizantes y enmiendas', 'engrais et amendements', 'fertilizzanti e ammendanti'], ['compound feedingstuffs', 'piensos compuestos', 'aliments composés', 'mangimi composti'], ['energy', 'energía', 'énergie', 'energia'],
    ['agri-food total', 'total agroalimentario', 'total agroalimentaire', 'totale agroalimentare'], ['extra-EU', 'extra-UE', 'extra-UE', 'extra-UE'], ['agri-food', 'agroalimentario', 'agroalimentaire', 'agroalimentare'], ['farm and fishing products', 'productos agrarios y de la pesca', 'produits agricoles et de la pêche', 'prodotti agricoli e della pesca'], ['beverages (incl. wine)', 'bebidas (incl. vino)', 'boissons (y compris vin)', 'bevande (incl. vino)'],
    ['wine', 'vino', 'vin', 'vino'], ['olive oil', 'aceite de oliva', 'huile d’olive', 'olio d’oliva'], ['total', 'total', 'total', 'totale'], ['harvested area', 'superficie cosechada', 'superficie récoltée', 'superficie raccolta'], ['harvested production', 'producción cosechada', 'production récoltée', 'produzione raccolta'],
    ['yield', 'rendimiento', 'rendement', 'resa'], ['gross yield per ha', 'rendimiento bruto por ha', 'rendement brut par ha', 'resa lorda per ha'], ['seeds', 'semillas', 'semences', 'sementi'], ['sugar', 'azúcar', 'sucre', 'zucchero'], ['apples', 'manzanas', 'pommes', 'mele'], ['grapes', 'uva', 'raisin', 'uva'],
    ['total expenses', 'gastos totales', 'dépenses totales', 'spese totali'],
    ['operating expenses', 'gastos de explotación', 'dépenses d’exploitation', 'spese di esercizio'],
    ['property taxes', 'impuestos sobre la propiedad', 'taxes foncières', 'imposte sulla proprietà'],
    ['interest', 'intereses', 'intérêts', 'interessi'],
    ['electricity', 'electricidad', 'électricité', 'elettricità'],
    ['heating fuel', 'combustible de calefacción', 'combustible de chauffage', 'combustibile da riscaldamento'],
    ['machinery fuel', 'combustible de maquinaria', 'carburant des machines', 'carburante per macchine'],
    ['pesticides', 'plaguicidas', 'pesticides', 'pesticidi'],
    ['seed', 'semillas', 'semences', 'sementi'],
    ['feed', 'piensos', 'aliments du bétail', 'mangimi'],
    ['livestock purchases', 'compra de ganado', 'achats de bétail', 'acquisti di bestiame'],
    ['machinery repairs', 'reparación de maquinaria', 'réparation des machines', 'riparazione dei macchinari'],
    ['depreciation', 'amortización', 'amortissement', 'ammortamento'],
    ['wages', 'salarios', 'salaires', 'salari'],
    ['fertiliser and lime', 'fertilizantes y cal', 'engrais et chaux', 'fertilizzanti e calce'],
    ['farm input total', 'total de insumos agrarios', 'total des intrants agricoles', 'totale input agricoli'],
    ['buildings', 'edificios', 'bâtiments', 'edifici'],
    ['machinery and motor vehicles', 'maquinaria y vehículos', 'machines et véhicules automobiles', 'macchinari e veicoli'],
    ['crop production', 'producción vegetal', 'production végétale', 'produzione vegetale'],
    ['commercial seed and plant', 'semillas y plantas comerciales', 'semences et plants commerciaux', 'sementi e piante commerciali'],
    ['fertilizer', 'fertilizantes', 'engrais', 'fertilizzanti'],
    ['nitrogen fertilizers', 'fertilizantes nitrogenados', 'engrais azotés', 'fertilizzanti azotati'],
    ['production insurance', 'seguro de producción', 'assurance-production', 'assicurazione della produzione'],
    ['animal production', 'producción animal', 'production animale', 'produzione animale'],
    ['commercial feed', 'piensos comerciales', 'aliments commerciaux du bétail', 'mangimi commerciali'],
    ['ammonia (nh3)', 'amoníaco (NH3)', 'ammoniac (NH3)', 'ammoniaca (NH3)'],
    ['urea ammonium nitrate (uan)', 'nitrato de urea y amonio (UAN)', 'nitrate d’urée et d’ammonium (UAN)', 'nitrato di urea e ammonio (UAN)'],
    ['ammonium nitrate/calcium ammonium nitrate (an/can)', 'nitrato amónico / nitrato amónico cálcico (AN/CAN)', 'nitrate d’ammonium / nitrate d’ammonium et de calcium (AN/CAN)', 'nitrato di ammonio / nitrato di ammonio e calcio (AN/CAN)'],
    ['ammonium sulphate (as)', 'sulfato amónico (AS)', 'sulfate d’ammonium (AS)', 'solfato di ammonio (AS)'],
    ['monoammonium phosphate (map)', 'fosfato monoamónico (MAP)', 'phosphate monoammonique (MAP)', 'fosfato monoammonico (MAP)'],
    ['diammonium phosphate (dap)', 'fosfato diamónico (DAP)', 'phosphate diammonique (DAP)', 'fosfato diammonico (DAP)'],
    ['potash', 'potasa', 'potasse', 'potassa'],
    ['other fertilizer products', 'otros fertilizantes', 'autres produits d’engrais', 'altri prodotti fertilizzanti'],
    ['urea', 'urea', 'urée', 'urea'],
    ['realized net income', 'renta neta realizada', 'revenu net réalisé', 'reddito netto realizzato'],
    ['net income', 'renta neta', 'revenu net', 'reddito netto'],
    ['cash receipts', 'ingresos en caja', 'recettes monétaires', 'entrate monetarie'],
    ['net cash income', 'renta neta en caja', 'revenu net en espèces', 'reddito netto in contanti'],
    ['total farm capital', 'capital agrario total', 'capital agricole total', 'capitale agricolo totale'],
    ['livestock and poultry', 'ganado y aves', 'bétail et volaille', 'bestiame e pollame'],
    ['land and buildings', 'tierra y edificios', 'terres et bâtiments', 'terra ed edifici'],
    ['machinery and equipment', 'maquinaria y equipo', 'machines et matériel', 'macchinari e attrezzature'],
    ['chartered banks', 'bancos comerciales', 'banques à charte', 'banche commerciali'],
    ['federal agencies', 'organismos federales', 'organismes fédéraux', 'agenzie federali'],
    ['provincial agencies', 'organismos provinciales', 'organismes provinciaux', 'agenzie provinciali'],
    ['credit unions', 'cooperativas de crédito', 'caisses populaires', 'cooperative di credito'],
    ['private lenders and suppliers', 'prestamistas privados y proveedores', 'prêteurs privés et fournisseurs', 'prestatori privati e fornitori'],
    ['regular gasoline (self-service)', 'gasolina normal (autoservicio)', 'essence ordinaire (libre-service)', 'benzina normale (self-service)'],
    ['diesel (self-service)', 'gasóleo (autoservicio)', 'diesel (libre-service)', 'gasolio (self-service)'],
    ['crops', 'cultivos', 'cultures', 'colture'],
    ['livestock', 'ganadería', 'élevage', 'zootecnia'],
    ['canola', 'canola', 'canola', 'canola'],
    ['grain corn', 'maíz grano', 'maïs-grain', 'mais da granella'],
    ['hogs', 'cerdos', 'porcs', 'suini'],
    ['canada', 'Canadá', 'Canada', 'Canada'],
    ['saskatchewan', 'Saskatchewan', 'Saskatchewan', 'Saskatchewan'],
    ['alberta', 'Alberta', 'Alberta', 'Alberta'],
    ['manitoba', 'Manitoba', 'Manitoba', 'Manitoba'],
    ['ontario', 'Ontario', 'Ontario', 'Ontario'],
    ['quebec', 'Quebec', 'Québec', 'Québec'],
    ['calgary', 'Calgary', 'Calgary', 'Calgary'],
    ['edmonton', 'Edmonton', 'Edmonton', 'Edmonton'],
    ['regina', 'Regina', 'Regina', 'Regina'],
    ['saskatoon', 'Saskatoon', 'Saskatoon', 'Saskatoon'],
    ['winnipeg', 'Winnipeg', 'Winnipeg', 'Winnipeg'],
    ['toronto', 'Toronto', 'Toronto', 'Toronto'],
    ['montréal', 'Montreal', 'Montréal', 'Montréal'],
    ['vancouver', 'Vancouver', 'Vancouver', 'Vancouver']
  ];
  var FREQ = { monthly: ['mensual', 'monthly', 'mensuel', 'mensile'], annual: ['anual', 'annual', 'annuel', 'annuale'], weekly: ['semanal', 'weekly', 'hebdomadaire', 'settimanale'], quarterly: ['trimestral', 'quarterly', 'trimestriel', 'trimestrale'], 'half-year': ['semestral', 'half-year', 'semestriel', 'semestrale'] };
  var HM = {}, TM = {};
  HEAD.forEach(function (r) { HM[r[0].toLowerCase()] = r; }); TM = {}; TERM.forEach(function (r) { TM[r[0].toLowerCase()] = r; });
  var REG = null;
  function regionMap() { // nombre en inglés -> código ISO (Intl.DisplayNames del propio navegador, sin listas a mano)
    if (REG) return REG; REG = {};
    try {
      var dn = new Intl.DisplayNames(['en'], { type: 'region' }), A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', i, j, c, n;
      for (i = 0; i < 26; i++) for (j = 0; j < 26; j++) { c = A.charAt(i) + A.charAt(j); try { n = dn.of(c); } catch (e) { n = null; } if (n && n !== c) REG[n.toLowerCase()] = c; }
      REG['united states'] = 'US'; REG['united kingdom'] = 'GB'; REG['czech republic'] = 'CZ'; REG['türkiye'] = 'TR'; REG['turkey'] = 'TR'; REG['south korea'] = 'KR'; REG['korea, south'] = 'KR'; REG['russia'] = 'RU';
    } catch (e) { REG = {}; }
    return REG;
  }
  function country(name, lang) {
    var c = regionMap()[String(name).toLowerCase()]; if (!c) return null;
    try { var r = new Intl.DisplayNames([lang], { type: 'region' }).of(c); return r && r !== c ? r : null; } catch (e) { return null; }
  }
  function term(s, k) { var r = TM[s.toLowerCase()]; return r ? r[k] : null; }
  function termChain(s, k) { // «a, b» o «a and b»: cada parte debe conocerse; si no, se deja el original entero
    var whole = term(s, k); if (whole) return whole;
    var parts = s.split(/,\s+/); if (parts.length > 1) { var o = parts.map(function (p) { return term(p, k); }); if (o.every(Boolean)) return o.join(', '); }
    return null;
  }
  // ---------- Reino Unido (Defra): plantillas propias para scripts/update-uk-defra.py; [es, fr, it] ----------
  var UKC = {
    'Prime cattle (steers, heifers, young bulls)': ['Vacuno cebado (novillos, novillas y toretes)', 'Gros bovins finis (bœufs, génisses, jeunes taureaux)', 'Bovini da carne (manzi, giovenche, giovani tori)'],
    'Adult cattle (cows, adult bulls)': ['Vacuno adulto (vacas y toros)', 'Bovins adultes (vaches, taureaux)', 'Bovini adulti (vacche, tori)'],
    'Calves': ['Terneros', 'Veaux', 'Vitelli'], 'Steers': ['Novillos', 'Bœufs', 'Manzi'], 'Heifers': ['Novillas', 'Génisses', 'Giovenche'],
    'Young bulls': ['Toretes', 'Jeunes taureaux', 'Giovani tori'], 'Cows': ['Vacas', 'Vaches', 'Vacche'], 'Adult bulls': ['Toros adultos', 'Taureaux adultes', 'Tori adulti'],
    'Sheep and lambs': ['Ovino y corderos', 'Ovins et agneaux', 'Ovini e agnelli'], 'Ewes and rams': ['Ovejas y carneros', 'Brebis et béliers', 'Pecore e montoni'],
    'Clean pigs': ['Cerdos de cebo', 'Porcs charcutiers', 'Suini da macello'], 'Sows and boars': ['Cerdas y verracos', 'Truies et verrats', 'Scrofe e verri'],
    'Beef and veal': ['Vacuno y ternera', 'Viande bovine et veau', 'Carne bovina e vitello'], 'Mutton and lamb': ['Ovino (cordero y carnero)', 'Viande ovine', 'Carne ovina'], 'Pigmeat': ['Porcino', 'Viande porcine', 'Carne suina'],
    'Cattle and calves, total': ['Vacuno total (con terneros)', 'Bovins au total (avec veaux)', 'Bovini totali (con vitelli)'], 'Beef herd (breeding females)': ['Vacas nodrizas (hembras reproductoras de carne)', 'Vaches allaitantes', 'Vacche da carne'],
    'Dairy herd (breeding females)': ['Vacas lecheras', 'Vaches laitières', 'Vacche da latte'], 'Pigs, total': ['Cerdos, total', 'Porcins, total', 'Suini, totale'], 'Female breeding herd': ['Cerdas reproductoras', 'Truies reproductrices', 'Scrofe riproduttrici'],
    'Sheep and lambs, total': ['Ovino y corderos, total', 'Ovins et agneaux, total', 'Ovini e agnelli, totale'], 'Female breeding flock': ['Ovejas reproductoras', 'Brebis reproductrices', 'Pecore riproduttrici'],
    'Wheat': ['Trigo', 'Blé', 'Frumento'], 'Barley': ['Cebada', 'Orge', 'Orzo'], 'Oats': ['Avena', 'Avoine', 'Avena'], 'Oilseed rape': ['Colza', 'Colza', 'Colza'],
    'All Types': ['Todos los tipos', 'Tous types', 'Tutti i tipi'], 'Cereals': ['Cereales', 'Céréales', 'Cereali'], 'General cropping': ['Cultivos generales', 'Grandes cultures', 'Colture generali'], 'Dairy': ['Vacuno de leche', 'Lait', 'Latte'],
    'Lowland grazing livestock': ['Ganado de pasto en tierras bajas', 'Élevage en plaine', 'Allevamento in pianura'], 'LFA grazing livestock': ['Ganado de pasto en zonas desfavorecidas', 'Élevage en zones défavorisées', 'Allevamento in zone svantaggiate'],
    'Specialist pigs': ['Porcino especializado', 'Porcins spécialisés', 'Suini specializzati'], 'Specialist poultry': ['Avicultura especializada', 'Volailles spécialisées', 'Avicoltura specializzata'], 'Mixed': ['Mixtas', 'Mixtes', 'Miste'], 'Horticulture': ['Horticultura', 'Horticulture', 'Orticoltura'],
    'total': ['total', 'total', 'totale'], 'shell eggs': ['huevos con cáscara', 'œufs coquille', 'uova in guscio'], 'processed eggs': ['huevos para ovoproductos', 'œufs destinés à la transformation', 'uova destinate alla trasformazione'],
    'enriched cages': ['jaulas acondicionadas', 'cages aménagées', 'gabbie arricchite'], 'barn': ['suelo (granja cubierta)', 'élevage au sol', 'allevamento a terra'], 'free range': ['camperos', 'plein air', 'allevamento all’aperto'], 'organic': ['ecológicos', 'biologiques', 'biologiche'],
    'all systems': ['todos los sistemas', 'tous systèmes', 'tutti i sistemi'], 'all types': ['todos los tipos', 'tous types', 'tutti i tipi'],
    'broilers': ['pollos de engorde', 'poulets de chair', 'polli da carne'], 'boiling fowl': ['gallinas de desvieje', 'poules de réforme', 'galline a fine carriera'], 'turkeys': ['pavos', 'dindes', 'tacchini'], 'ducks': ['patos', 'canards', 'anatre'],
    'commercial broilers': ['pollos de engorde comerciales', 'poulets de chair commerciaux', 'polli da carne commerciali'], 'commercial layers': ['gallinas ponedoras comerciales', 'poules pondeuses commerciales', 'galline ovaiole commerciali'],
    'Winter barley': ['Cebada de invierno', 'Orge d’hiver', 'Orzo invernale'], 'Spring barley': ['Cebada de primavera', 'Orge de printemps', 'Orzo primaverile'],
    'UK eggs': ['huevos del Reino Unido', 'œufs du Royaume-Uni', 'uova del Regno Unito'], 'imported eggs': ['huevos importados', 'œufs importés', 'uova importate'], 'liquid egg': ['huevo líquido', 'œuf liquide', 'uovo liquido'],
    'other egg products': ['otros ovoproductos', 'autres ovoproduits', 'altri ovoprodotti'], 'egg products': ['ovoproductos', 'ovoproduits', 'ovoprodotti'], 'from or to the EU': ['con la UE', 'avec l’UE', 'con l’UE'],
    'from or to the rest of the world': ['con el resto del mundo', 'avec le reste du monde', 'con il resto del mondo'],
    'supply (million dozen)': ['oferta (millones de docenas)', 'disponibilités (millions de douzaines)', 'disponibilità (milioni di dozzine)'], 'domestic production as % of supply': ['producción nacional como % de la oferta', 'production nationale en % des disponibilités', 'produzione nazionale in % delle disponibilità'],
    'butter': ['Mantequilla', 'Beurre', 'Burro'], 'cheese': ['Queso', 'Fromage', 'Formaggio'], 'condensed milk': ['Leche condensada', 'Lait concentré', 'Latte condensato'], 'milk powders': ['Leche en polvo', 'Lait en poudre', 'Latte in polvere'], 'yoghurt': ['Yogur', 'Yaourt', 'Yogurt'],
    'production': ['producción', 'production', 'produzione'], 'imports': ['importaciones', 'importations', 'importazioni'], 'exports': ['exportaciones', 'exportations', 'esportazioni'], 'supplies': ['oferta total', 'disponibilités totales', 'disponibilità totali'],
    'cheddar production': ['producción de cheddar', 'production de cheddar', 'produzione di cheddar'],
    'Sugar beet': ['Remolacha azucarera', 'Betterave sucrière', 'Barbabietola da zucchero'], 'Potatoes': ['Patatas', 'Pommes de terre', 'Patate'],
    'cattle': ['vacuno', 'bovins', 'bovini'], 'pigs': ['porcino', 'porcins', 'suini'], 'sheep': ['ovino', 'ovins', 'ovini'], 'poultry': ['aves', 'volailles', 'avicoli'], 'livestock, total': ['ganadería, total', 'élevage, total', 'zootecnia, totale'],
    'eggs for human consumption': ['huevos para consumo', 'œufs de consommation', 'uova da consumo'], 'milk': ['leche', 'lait', 'latte'],
    'Milling wheat': ['Trigo panificable', 'Blé meunier', 'Frumento da macina'], 'Feed wheat': ['Trigo forrajero', 'Blé fourrager', 'Frumento da mangime'], 'Malting barley': ['Cebada cervecera', 'Orge de brasserie', 'Orzo da birra'], 'Feed barley': ['Cebada forrajera', 'Orge fourragère', 'Orzo da mangime'],
    'Milling oats': ['Avena para consumo humano', 'Avoine meunière', 'Avena da macina'], 'Feed oats': ['Avena forrajera', 'Avoine fourragère', 'Avena da mangime'], 'Early and maincrop potatoes': ['Patata temprana y de media estación', 'Pommes de terre primeurs et de saison', 'Patate precoci e di stagione'], 'Seed potatoes': ['Patata de siembra', 'Plants de pommes de terre', 'Patate da semina'],
    'prime cattle': ['vacuno cebado', 'gros bovins finis', 'bovini da carne'], 'clean pigs': ['cerdos de cebo', 'porcs charcutiers', 'suini da macello'], 'finished sheep (Great Britain)': ['ovino cebado (Gran Bretaña)', 'ovins finis (Grande-Bretagne)', 'ovini da macello (Gran Bretagna)'],
    'table chickens': ['pollos de engorde', 'poulets de chair', 'polli da carne'], 'boiling fowls': ['gallinas de desvieje', 'poules de réforme', 'galline a fine carriera'], 'geese': ['ocas', 'oies', 'oche'],
    'poultry meat': ['carne de ave', 'viande de volaille', 'carne avicola'], 'poultry meat products': ['productos de carne de ave', 'produits à base de volaille', 'prodotti a base di carne avicola'], 'beef and veal': ['vacuno y ternera', 'viande bovine et veau', 'carne bovina e vitello'],
    'wheat (unmilled)': ['trigo sin moler', 'blé non moulu', 'frumento non macinato'], 'lamb and mutton': ['cordero y carnero', 'agneau et mouton', 'agnello e montone'], 'pork': ['cerdo', 'porc', 'carne suina'], 'breakfast cereals': ['cereales de desayuno', 'céréales pour petit-déjeuner', 'cereali per la colazione'],
    'milk and cream': ['leche y nata', 'lait et crème', 'latte e panna'], 'bacon and ham': ['bacon y jamón', 'bacon et jambon', 'bacon e prosciutto'], 'eggs and egg products': ['huevos y ovoproductos', 'œufs et ovoproduits', 'uova e ovoprodotti'], 'fresh vegetables': ['hortalizas frescas', 'légumes frais', 'ortaggi freschi'],
    'fresh fruit': ['fruta fresca', 'fruits frais', 'frutta fresca'], 'salmon (including smoked)': ['salmón (también ahumado)', 'saumon (y compris fumé)', 'salmone (anche affumicato)'],
    'Meat & meat preps': ['Carne y preparados de carne', 'Viande et préparations', 'Carne e preparazioni'], 'Dairy & eggs': ['Lácteos y huevos', 'Produits laitiers et œufs', 'Latticini e uova'], 'Fish & fish preps': ['Pescado y preparados', 'Poisson et préparations', 'Pesce e preparazioni'],
    'Cereals & cereal preps': ['Cereales y preparados', 'Céréales et préparations', 'Cereali e preparazioni'], 'Fruit and veg & preps': ['Fruta y hortalizas y preparados', 'Fruits et légumes et préparations', 'Frutta e ortaggi e preparazioni'], 'Sugar & sugar preps': ['Azúcar y preparados', 'Sucre et préparations', 'Zucchero e preparazioni'],
    'Coffee, tea, etc.': ['Café, té y similares', 'Café, thé, etc.', 'Caffè, tè e simili'], 'Animal feed': ['Piensos', 'Aliments pour animaux', 'Mangimi'], 'Misc. edible preps': ['Preparados alimenticios diversos', 'Préparations alimentaires diverses', 'Preparazioni alimentari varie'],
    'Beverages': ['Bebidas', 'Boissons', 'Bevande'], 'Oils/fats & oilseeds': ['Aceites, grasas y oleaginosas', 'Huiles, graisses et oléagineux', 'Oli, grassi e semi oleosi'],
    'North East': ['Noreste', 'Nord-Est', 'Nord-Est'], 'North West and Merseyside': ['Noroeste y Merseyside', 'Nord-Ouest et Merseyside', 'Nord-Ovest e Merseyside'], 'Yorkshire & The Humber': ['Yorkshire y Humber', 'Yorkshire et Humber', 'Yorkshire e Humber'],
    'East Midlands': ['Midlands del Este', 'Midlands de l’Est', 'Midlands orientali'], 'West Midlands': ['Midlands del Oeste', 'Midlands de l’Ouest', 'Midlands occidentali'], 'Eastern': ['Este de Inglaterra', 'Est de l’Angleterre', 'Inghilterra orientale'],
    'South East and London': ['Sudeste y Londres', 'Sud-Est et Londres', 'Sud-Est e Londra'], 'South West': ['Suroeste', 'Sud-Ouest', 'Sud-Ovest'], 'England': ['Inglaterra', 'Angleterre', 'Inghilterra'], 'Wales': ['Gales', 'Pays de Galles', 'Galles'],
    'Scotland': ['Escocia', 'Écosse', 'Scozia'], 'Northern Ireland': ['Irlanda del Norte', 'Irlande du Nord', 'Irlanda del Nord'], 'United Kingdom': ['Reino Unido', 'Royaume-Uni', 'Regno Unito'],
    'Milk sold to UK dairies': ['Leche vendida a las lecherías del Reino Unido', 'Lait vendu aux laiteries du Royaume-Uni', 'Latte venduto ai caseifici del Regno Unito'], 'Availability of raw milk': ['Disponibilidad de leche cruda', 'Disponibilité de lait cru', 'Disponibilità di latte crudo'],
    'Milk used for liquid milk': ['Leche destinada a leche líquida', 'Lait destiné au lait liquide', 'Latte destinato a latte alimentare'], 'Milk used for cheese': ['Leche destinada a queso', 'Lait destiné au fromage', 'Latte destinato a formaggio'],
    'Milk used for manufacturing': ['Leche destinada a transformación', 'Lait destiné à la transformation', 'Latte destinato alla trasformazione'], 'Liquid milk production': ['Producción de leche líquida', 'Production de lait liquide', 'Produzione di latte alimentare'],
    'Cream production': ['Producción de nata', 'Production de crème', 'Produzione di panna'], 'Butter production': ['Producción de mantequilla', 'Production de beurre', 'Produzione di burro'], 'Cheese production, total': ['Producción de queso, total', 'Production de fromage, total', 'Produzione di formaggio, totale'],
    'Cheddar production': ['Producción de queso cheddar', 'Production de cheddar', 'Produzione di cheddar'], 'Yoghurt production': ['Producción de yogur', 'Production de yaourt', 'Produzione di yogurt'], 'Condensed milk production': ['Producción de leche condensada', 'Production de lait concentré', 'Produzione di latte condensato']
  };
  var UKD = {
    'output of cereals': ['producción de cereales', 'production de céréales', 'produzione di cereali'], 'output of industrial crops': ['producción de cultivos industriales', 'production de cultures industrielles', 'produzione di colture industriali'], 'output of forage plants': ['producción de plantas forrajeras', 'production de plantes fourragères', 'produzione di piante foraggere'],
    'output of vegetables and horticultural products': ['producción de hortalizas y productos hortícolas', 'production de légumes et de produits horticoles', 'produzione di ortaggi e prodotti orticoli'], 'output of potatoes': ['producción de patata', 'production de pommes de terre', 'produzione di patate'], 'output of fruit': ['producción de fruta', 'production de fruits', 'produzione di frutta'],
    'total crop output': ['producción vegetal total', 'production végétale totale', 'produzione vegetale totale'], 'output of livestock': ['producción de ganado', 'production d’animaux', 'produzione di bestiame'], 'output of livestock products': ['producción de productos animales', 'production de produits animaux', 'produzione di prodotti animali'],
    'total livestock output': ['producción animal total', 'production animale totale', 'produzione animale totale'], 'other agricultural activities': ['otras actividades agrarias', 'autres activités agricoles', 'altre attività agricole'], 'diversification': ['diversificación', 'diversification', 'diversificazione'], 'total output at market prices': ['producción total a precios de mercado', 'production totale aux prix du marché', 'produzione totale ai prezzi di mercato'],
    'seeds': ['semillas', 'semences', 'sementi'], 'energy': ['energía', 'énergie', 'energia'], 'fertilisers': ['fertilizantes', 'engrais', 'fertilizzanti'], 'fertiliser': ['fertilizantes', 'engrais', 'fertilizzanti'], 'plant protection products': ['productos fitosanitarios', 'produits phytosanitaires', 'prodotti fitosanitari'], 'veterinary expenses': ['gastos veterinarios', 'frais vétérinaires', 'spese veterinarie'],
    'animal feed': ['piensos', 'aliments pour animaux', 'mangimi'], 'maintenance': ['mantenimiento', 'entretien', 'manutenzione'], 'agricultural services': ['servicios agrarios', 'services agricoles', 'servizi agricoli'], 'bank charges': ['gastos bancarios', 'frais bancaires', 'spese bancarie'], 'other goods and services': ['otros bienes y servicios', 'autres biens et services', 'altri beni e servizi'],
    'total intermediate consumption': ['consumos intermedios totales', 'consommations intermédiaires totales', 'consumi intermedi totali'], 'gross value added at market prices': ['valor añadido bruto a precios de mercado', 'valeur ajoutée brute aux prix du marché', 'valore aggiunto lordo ai prezzi di mercato'], 'consumption of fixed capital': ['consumo de capital fijo', 'consommation de capital fixe', 'consumo di capitale fisso'],
    'net value added at market prices': ['valor añadido neto a precios de mercado', 'valeur ajoutée nette aux prix du marché', 'valore aggiunto netto ai prezzi di mercato'], 'compensation of employees': ['remuneración de asalariados', 'rémunération des salariés', 'redditi da lavoro dipendente'], 'rent': ['arrendamientos', 'fermages', 'affitti'],
    'interest': ['intereses', 'intérêts', 'interessi'], 'subsidies not linked to production': ['subvenciones no vinculadas a la producción', 'subventions non liées à la production', 'sovvenzioni non legate alla produzione'], 'Total Income from Farming': ['Renta agraria total (Total Income from Farming)', 'Revenu agricole total (Total Income from Farming)', 'Reddito agricolo totale (Total Income from Farming)'],
    'Total Income from Farming per annual work unit': ['Renta agraria total por unidad de trabajo anual', 'Revenu agricole total par unité de travail annuelle', 'Reddito agricolo totale per unità di lavoro annuale'], 'croppable area': ['superficie cultivable', 'surface cultivable', 'superficie coltivabile'], 'oilseeds': ['oleaginosas', 'oléagineux', 'semi oleosi'],
    'potatoes': ['patatas', 'pommes de terre', 'patate'], 'other arable crops': ['otros cultivos herbáceos', 'autres cultures arables', 'altre colture arabili'], 'horticultural crops': ['cultivos hortícolas', 'cultures horticoles', 'colture orticole'], 'uncropped arable land': ['tierra de cultivo sin sembrar', 'terres arables non cultivées', 'seminativi non coltivati'],
    'temporary grass': ['prados temporales', 'prairies temporaires', 'prati temporanei'], 'permanent grassland': ['pastos permanentes', 'prairies permanentes', 'prati permanenti'], 'woodland on agricultural holdings': ['bosque en explotaciones agrarias', 'bois dans les exploitations agricoles', 'boschi nelle aziende agricole'], 'utilised agricultural area': ['superficie agraria utilizada', 'surface agricole utilisée', 'superficie agricola utilizzata'],
    'cereals': ['cereales', 'céréales', 'cereali'], 'employees, managers and casual workers': ['asalariados, directivos y temporeros', 'salariés, gérants et saisonniers', 'dipendenti, dirigenti e stagionali'], 'farmers, partners and spouses': ['agricultores, socios y cónyuges', 'agriculteurs, associés et conjoints', 'agricoltori, soci e coniugi'],
    'fully organic': ['plenamente ecológica', 'entièrement biologique', 'pienamente biologica'], 'in-conversion': ['en conversión', 'en conversion', 'in conversione'], 'operators': ['operadores', 'opérateurs', 'operatori'], 'dairy cows': ['vacas lecheras', 'vaches laitières', 'vacche da latte'], 'laying hens': ['gallinas ponedoras', 'poules pondeuses', 'galline ovaiole'],
    'agriculture (excluding fishing)': ['agricultura (sin pesca)', 'agriculture (hors pêche)', 'agricoltura (esclusa la pesca)'], 'food and drink catering': ['restauración y hostelería', 'restauration', 'ristorazione'], 'food and drink manufacturing': ['industria de alimentación y bebidas', 'industrie alimentaire et des boissons', 'industria alimentare e delle bevande'],
    'food and drink retail': ['comercio minorista de alimentación y bebidas', 'commerce de détail alimentaire', 'commercio al dettaglio di alimenti e bevande'], 'food and drink wholesale': ['comercio mayorista de alimentación y bebidas', 'commerce de gros alimentaire', 'commercio all’ingrosso di alimenti e bevande'], 'total food': ['alimentación, total', 'alimentation, total', 'alimentare, totale'],
    'total agri-food': ['sector agroalimentario, total', 'secteur agroalimentaire, total', 'settore agroalimentare, totale'], 'agri-food sector, total': ['sector agroalimentario, total', 'secteur agroalimentaire, total', 'settore agroalimentare, totale'], 'alcoholic drinks (off-licence only)': ['bebidas alcohólicas (solo comercio minorista)', 'boissons alcoolisées (vente à emporter uniquement)', 'bevande alcoliche (solo vendita al dettaglio)'],
    'food and drink eaten out': ['alimentos y bebidas fuera del hogar', 'repas et boissons hors domicile', 'alimenti e bevande fuori casa'], 'household food and non-alcoholic beverages': ['alimentos y bebidas no alcohólicas en el hogar', 'alimentation et boissons non alcoolisées à domicile', 'alimenti e bevande analcoliche in casa'],
    'food': ['alimentos', 'alimentation', 'alimenti'], 'overall': ['general', 'ensemble', 'complessivo'], 'all inputs': ['todos los insumos', 'tous les intrants', 'tutti i fattori produttivi'], 'compound feedingstuffs': ['piensos compuestos', 'aliments composés', 'mangimi composti'], 'goods and services currently consumed': ['bienes y servicios de consumo corriente', 'biens et services de consommation courante', 'beni e servizi di consumo corrente'],
    'energy and lubricants': ['energía y lubricantes', 'énergie et lubrifiants', 'energia e lubrificanti'], 'animal feedingstuffs': ['alimentos para animales', 'aliments pour animaux', 'alimenti per animali'], 'fertilisers and soil improvers': ['fertilizantes y enmiendas del suelo', 'engrais et amendements du sol', 'fertilizzanti e ammendanti'],
    'maintenance of buildings': ['mantenimiento de edificios', 'entretien des bâtiments', 'manutenzione degli edifici'], 'maintenance of materials': ['mantenimiento de materiales', 'entretien du matériel', 'manutenzione dei materiali'], 'straight feedingstuffs': ['piensos simples', 'aliments simples', 'mangimi semplici'], 'veterinary services': ['servicios veterinarios', 'services vétérinaires', 'servizi veterinari'],
    'all outputs': ['todos los productos', 'tous les produits', 'tutti i prodotti'], 'animal products': ['productos animales', 'produits animaux', 'prodotti animali'], 'animals and animal products': ['animales y productos animales', 'animaux et produits animaux', 'animali e prodotti animali'], 'barley': ['cebada', 'orge', 'orzo'], 'cattle and calves': ['vacuno y terneros', 'bovins et veaux', 'bovini e vitelli'],
    'crop products': ['productos vegetales', 'produits végétaux', 'prodotti vegetali'], 'eggs': ['huevos', 'œufs', 'uova'], 'industrial crops': ['cultivos industriales', 'cultures industrielles', 'colture industriali'], 'oats': ['avena', 'avoine', 'avena'], 'oilseed rape': ['colza', 'colza', 'colza'], 'sheep and lambs': ['ovino y corderos', 'ovins et agneaux', 'ovini e agnelli'],
    'animals for slaughter and export': ['animales para sacrificio y exportación', 'animaux pour l’abattage et l’exportation', 'animali da macello e per l’esportazione'], 'sugar beet': ['remolacha azucarera', 'betterave sucrière', 'barbabietola da zucchero'], 'wheat': ['trigo', 'blé', 'frumento'], 'by capital consumption': ['por consumo de capital', 'par consommation de capital', 'per consumo di capitale'],
    'by intermediate consumption': ['por consumo intermedio', 'par consommation intermédiaire', 'per consumo intermedio'], 'by labour': ['por trabajo', 'par travail', 'per lavoro'], 'by land': ['por tierra', 'par terre', 'per terra'], 'all inputs and entrepreneurial labour': ['todos los insumos y trabajo empresarial', 'tous les intrants et le travail de l’exploitant', 'tutti i fattori produttivi e il lavoro imprenditoriale'],
    'total factor productivity': ['productividad total de los factores', 'productivité globale des facteurs', 'produttività totale dei fattori'], 'agri-environment schemes': ['programas agroambientales', 'programmes agroenvironnementaux', 'programmi agroambientali'], 'basic and delinked payment schemes': ['pago básico y pagos desacoplados', 'paiement de base et paiements découplés', 'pagamento di base e pagamenti disaccoppiati'],
    'general services support': ['apoyo a servicios generales', 'soutien aux services généraux', 'sostegno ai servizi generali'], 'other schemes': ['otros programas', 'autres programmes', 'altri programmi'], 'red diesel': ['gasóleo bonificado (red diesel)', 'gazole détaxé (red diesel)', 'gasolio agevolato (red diesel)'], 'total purchased animal feed': ['total de piensos comprados', 'total des aliments achetés', 'totale dei mangimi acquistati'],
    'value of purchased animal feed': ['valor de los piensos comprados', 'valeur des aliments achetés', 'valore dei mangimi acquistati'], 'cabbages': ['coles', 'choux', 'cavoli'], 'calabrese': ['brécol (calabrese)', 'brocoli (calabrese)', 'broccoli (calabrese)'], 'carrots': ['zanahorias', 'carottes', 'carote'], 'cauliflowers': ['coliflores', 'choux-fleurs', 'cavolfiori'],
    'culinary apples': ['manzanas de cocina', 'pommes à cuire', 'mele da cucina'], 'dessert apples': ['manzanas de mesa', 'pommes de table', 'mele da tavola'], 'orchard fruit': ['fruta de huerto (árboles frutales)', 'fruits de verger', 'frutta da frutteto'], 'pears': ['peras', 'poires', 'pere'], 'raspberries': ['frambuesas', 'framboises', 'lamponi'],
    'soft fruit': ['frutos del bosque y bayas', 'fruits rouges', 'piccoli frutti'], 'strawberries': ['fresas', 'fraises', 'fragole'], 'lettuces': ['lechugas', 'laitues', 'lattughe'], 'mushrooms': ['champiñones', 'champignons', 'funghi'], 'hardy ornamental nursery stock': ['planta ornamental de vivero (resistente)', 'pépinières ornementales rustiques', 'vivaio ornamentale rustico'],
    'onions': ['cebollas', 'oignons', 'cipolle'], 'dry peas (for harvesting dry)': ['guisantes secos', 'pois secs', 'piselli secchi'], 'plants and flowers': ['plantas y flores', 'plantes et fleurs', 'piante e fiori'], 'pot plants': ['plantas de maceta', 'plantes en pot', 'piante in vaso'], 'tomatoes': ['tomates', 'tomates', 'pomodori'],
    'fresh vegetables grown in the open': ['hortalizas frescas al aire libre', 'légumes frais de plein champ', 'ortaggi freschi in pieno campo'], 'protected fresh vegetables': ['hortalizas frescas bajo cubierta', 'légumes frais sous abri', 'ortaggi freschi in coltura protetta'], 'Culinary apples': ['Manzanas de cocina', 'Pommes à cuire', 'Mele da cucina'],
    'Dessert apples': ['Manzanas de mesa', 'Pommes de table', 'Mele da tavola'], 'Pears': ['Peras', 'Poires', 'Pere'], 'Raspberries': ['Frambuesas', 'Framboises', 'Lamponi'], 'Strawberries': ['Fresas', 'Fraises', 'Fragole'], 'Cauliflowers': ['Coliflores', 'Choux-fleurs', 'Cavolfiori'], 'Tomatoes': ['Tomates', 'Tomates', 'Pomodori']
  };
  for (var uq in UKD) if (!UKC[uq]) UKC[uq] = UKD[uq];
  var UKT = [
    [/^Slaughterings: (.+) \(head\)$/, ['Sacrificios: {c} (cabezas)', 'Abattages : {c} (têtes)', 'Macellazioni: {c} (capi)']],
    [/^Average dressed carcase weight: (.+) \(kg per head\)$/, ['Peso medio de la canal: {c} (kg por cabeza)', 'Poids moyen de carcasse : {c} (kg par tête)', 'Peso medio della carcassa: {c} (kg a capo)']],
    [/^Meat production: (.+) \(tonnes\)$/, ['Producción de carne: {c} (toneladas)', 'Production de viande : {c} (tonnes)', 'Produzione di carne: {c} (tonnellate)']],
    [/^Farm Business Income, England: (.+) \(GBP per farm, current prices\)$/, ['Renta de la explotación (Farm Business Income), Inglaterra: {c} (GBP por explotación, precios corrientes)', 'Revenu de l’exploitation (Farm Business Income), Angleterre : {c} (GBP par exploitation, prix courants)', 'Reddito aziendale (Farm Business Income), Inghilterra: {c} (GBP per azienda, prezzi correnti)']],
    [/^Livestock on holdings at 1 June: (.+) \(head\)$/, ['Ganado en explotaciones a 1 de junio: {c} (cabezas)', 'Cheptel dans les exploitations au 1er juin : {c} (têtes)', 'Capi nelle aziende al 1° giugno: {c} (capi)']],
    [/^Yield: (.+), United Kingdom \(t\/ha\)$/, ['Rendimiento: {c}, Reino Unido (t/ha)', 'Rendement : {c}, Royaume-Uni (t/ha)', 'Resa: {c}, Regno Unito (t/ha)']],
    [/^Area: (.+), United Kingdom \(hectares\)$/, ['Superficie: {c}, Reino Unido (hectáreas)', 'Superficie : {c}, Royaume-Uni (hectares)', 'Superficie: {c}, Regno Unito (ettari)']],
    [/^Egg production for human consumption, United Kingdom: (.+) \(million dozen\)$/, ['Producción de huevos para consumo, Reino Unido: {c} (millones de docenas)', 'Production d’œufs de consommation, Royaume-Uni : {c} (millions de douzaines)', 'Produzione di uova da consumo, Regno Unito: {c} (milioni di dozzine)']],
    [/^Egg packers intake, United Kingdom: (.+) \(million dozen\)$/, ['Entradas en centros de embalaje de huevos, Reino Unido: {c} (millones de docenas)', 'Entrées des centres de conditionnement d’œufs, Royaume-Uni : {c} (millions de douzaines)', 'Ingressi nei centri di imballaggio delle uova, Regno Unito: {c} (milioni di dozzine)']],
    [/^Average packer-to-producer egg price, United Kingdom: (.+) \(pence per dozen\)$/, ['Precio medio del huevo del centro de embalaje al productor, Reino Unido: {c} (peniques por docena)', 'Prix moyen de l’œuf du centre de conditionnement au producteur, Royaume-Uni : {c} (pence par douzaine)', 'Prezzo medio delle uova dal centro di imballaggio al produttore, Regno Unito: {c} (penny per dozzina)']],
    [/^Poultry slaughterings, United Kingdom: (.+) \(birds\)$/, ['Sacrificio de aves, Reino Unido: {c} (aves)', 'Abattages de volailles, Royaume-Uni : {c} (oiseaux)', 'Macellazioni di avicoli, Regno Unito: {c} (capi)']],
    [/^Poultrymeat production, United Kingdom: (.+) \(tonnes carcase weight\)$/, ['Producción de carne de ave, Reino Unido: {c} (toneladas en canal)', 'Production de viande de volaille, Royaume-Uni : {c} (tonnes de carcasse)', 'Produzione di carne avicola, Regno Unito: {c} (tonnellate a carcassa)']],
    [/^Hatchery eggs set, United Kingdom: (.+) \(eggs\)$/, ['Huevos puestos a incubar, Reino Unido: {c} (huevos)', 'Œufs mis en incubation, Royaume-Uni : {c} (œufs)', 'Uova messe in incubazione, Regno Unito: {c} (uova)']],
    [/^Chicks and poults placed, United Kingdom: (.+) \(birds\)$/, ['Pollitos y pavitos colocados, Reino Unido: {c} (aves)', 'Poussins et dindonneaux mis en place, Royaume-Uni : {c} (oiseaux)', 'Pulcini e tacchinotti collocati, Regno Unito: {c} (capi)']],
    [/^(Area|Yield|Production): (.+), (.+) \((hectares|t\/ha|tonnes)\)$/, ['{k}: {c}, {d} ({u})', '{k} : {c}, {d} ({u})', '{k}: {c}, {d} ({u})']],
    [/^United Kingdom milk: (.+) \((million litres|tonnes)\)$/, ['Leche del Reino Unido: {c} ({u})', 'Lait du Royaume-Uni : {c} ({u})', 'Latte del Regno Unito: {c} ({u})']],
    [/^Egg processors intake, United Kingdom: (.+) \(million dozen\)$/, ['Entradas en la industria de ovoproductos, Reino Unido: {c} (millones de docenas)', 'Entrées dans l’industrie des ovoproduits, Royaume-Uni : {c} (millions de douzaines)', 'Ingressi nell’industria degli ovoprodotti, Regno Unito: {c} (milioni di dozzine)']],
    [/^Egg processors output, United Kingdom: (.+) \(tonnes\)$/, ['Producción de la industria de ovoproductos, Reino Unido: {c} (toneladas)', 'Production de l’industrie des ovoproduits, Royaume-Uni : {c} (tonnes)', 'Produzione dell’industria degli ovoprodotti, Regno Unito: {c} (tonnellate)']],
    [/^UK egg imports: (.+) \(million dozen\)$/, ['Importaciones de huevos del Reino Unido: {c} (millones de docenas)', 'Importations d’œufs du Royaume-Uni : {c} (millions de douzaines)', 'Importazioni di uova del Regno Unito: {c} (milioni di dozzine)']],
    [/^UK egg exports: (.+) \(million dozen\)$/, ['Exportaciones de huevos del Reino Unido: {c} (millones de docenas)', 'Exportations d’œufs du Royaume-Uni : {c} (millions de douzaines)', 'Esportazioni di uova del Regno Unito: {c} (milioni di dozzine)']],
    [/^UK egg balance: (.+)$/, ['Balance de huevos del Reino Unido: {c}', 'Bilan des œufs du Royaume-Uni : {c}', 'Bilancio delle uova del Regno Unito: {c}']],
    [/^UK (butter|cheese|condensed milk|milk powders|yoghurt): (.+) \(tonnes\)$/, ['{c} del Reino Unido: {d} (toneladas)', '{c} du Royaume-Uni : {d} (tonnes)', '{c} del Regno Unito: {d} (tonnellate)']],
    [/^Value of production, United Kingdom: (.+) \(GBP million\)$/, ['Valor de la producción, Reino Unido: {c} (millones de GBP)', 'Valeur de la production, Royaume-Uni : {c} (millions de GBP)', 'Valore della produzione, Regno Unito: {c} (milioni di GBP)']],
    [/^Farm-gate price, United Kingdom: (.+) \(GBP per tonne\)$/, ['Precio en origen, Reino Unido: {c} (GBP por tonelada)', 'Prix départ ferme, Royaume-Uni : {c} (GBP par tonne)', 'Prezzo alla produzione, Regno Unito: {c} (GBP per tonnellata)']],
    [/^Producer price, United Kingdom: (.+) \(pence per kg deadweight\)$/, ['Precio al productor, Reino Unido: {c} (peniques por kg canal)', 'Prix producteur, Royaume-Uni : {c} (pence par kg de carcasse)', 'Prezzo al produttore, Regno Unito: {c} (penny per kg a carcassa)']],
    [/^Farm Business Income, (Wales|Scotland|Northern Ireland|United Kingdom): (.+) \(GBP per farm, current prices\)$/, ['Renta de la explotación (Farm Business Income), {c}: {d} (GBP por explotación, precios corrientes)', 'Revenu de l’exploitation (Farm Business Income), {c} : {d} (GBP par exploitation, prix courants)', 'Reddito aziendale (Farm Business Income), {c}: {d} (GBP per azienda, prezzi correnti)']],
    [/^UK (exports|imports) of key commodities: (.+) \(tonnes\)$/, ['{c} del Reino Unido, productos clave: {d} (toneladas)', '{c} du Royaume-Uni, produits clés : {d} (tonnes)', '{c} del Regno Unito, prodotti chiave: {d} (tonnellate)']],
    [/^UK (exports|imports) of food, feed and drink: (.+) \(GBP million, 2025 prices\)$/, ['{c} del Reino Unido de alimentos, piensos y bebidas: {d} (millones de GBP, precios de 2025)', '{c} du Royaume-Uni de produits alimentaires, aliments pour animaux et boissons : {d} (millions de GBP, prix de 2025)', '{c} del Regno Unito di alimenti, mangimi e bevande: {d} (milioni di GBP, prezzi 2025)']],
    [/^Agricultural account, United Kingdom: (.+) \(GBP million, current prices\)$/, ['Cuentas agrarias, Reino Unido: {c} (millones de GBP, precios corrientes)', 'Comptes de l’agriculture, Royaume-Uni : {c} (millions de GBP, prix courants)', 'Conti dell’agricoltura, Regno Unito: {c} (milioni di GBP, prezzi correnti)']],
    [/^Agricultural account, United Kingdom, real terms: (.+) \(GBP million, (\d{4}) prices\)$/, ['Cuentas agrarias, Reino Unido, en términos reales: {c} (millones de GBP, precios de {y})', 'Comptes de l’agriculture, Royaume-Uni, en termes réels : {c} (millions de GBP, prix de {y})', 'Conti dell’agricoltura, Regno Unito, in termini reali: {c} (milioni di GBP, prezzi {y})']],
    [/^Agricultural account, United Kingdom, real terms: (.+) \(GBP per annual work unit\)$/, ['Cuentas agrarias, Reino Unido, en términos reales: {c} (GBP)', 'Comptes de l’agriculture, Royaume-Uni, en termes réels : {c} (GBP)', 'Conti dell’agricoltura, Regno Unito, in termini reali: {c} (GBP)']],
    [/^Agricultural land use, United Kingdom: (.+) \(hectares\)$/, ['Uso del suelo agrario, Reino Unido: {c} (hectáreas)', 'Utilisation des terres agricoles, Royaume-Uni : {c} (hectares)', 'Uso del suolo agricolo, Regno Unito: {c} (ettari)']],
    [/^Agricultural workforce, United Kingdom: (.+) \(people\)$/, ['Mano de obra agraria, Reino Unido: {c} (personas)', 'Main-d’œuvre agricole, Royaume-Uni : {c} (personnes)', 'Manodopera agricola, Regno Unito: {c} (persone)']],
    [/^Agricultural product price index, United Kingdom: (.+) \((\d{4}) = 100\)$/, ['Índice de precios de los productos agrarios, Reino Unido: {c} (base {y} = 100)', 'Indice des prix des produits agricoles, Royaume-Uni : {c} (base {y} = 100)', 'Indice dei prezzi dei prodotti agricoli, Regno Unito: {c} (base {y} = 100)']],
    [/^Agricultural input price index, United Kingdom: (.+) \((\d{4}) = 100\)$/, ['Índice de precios de los insumos agrarios, Reino Unido: {c} (base {y} = 100)', 'Indice des prix des intrants agricoles, Royaume-Uni : {c} (base {y} = 100)', 'Indice dei prezzi dei fattori produttivi agricoli, Regno Unito: {c} (base {y} = 100)']],
    [/^Productivity index, United Kingdom: (.+) \((\d{4}) = 100\)$/, ['Índice de productividad agraria, Reino Unido: {c} (base {y} = 100)', 'Indice de productivité agricole, Royaume-Uni : {c} (base {y} = 100)', 'Indice di produttività agricola, Regno Unito: {c} (base {y} = 100)']],
    [/^Value of (energy|fertiliser) inputs, United Kingdom, real terms \(GBP million, (\d{4}) prices\)$/, ['Valor de los insumos de {c}, Reino Unido, en términos reales (millones de GBP, precios de {y})', 'Valeur des intrants {c}, Royaume-Uni, en termes réels (millions de GBP, prix de {y})', 'Valore dei fattori produttivi {c}, Regno Unito, in termini reali (milioni di GBP, prezzi {y})']],
    [/^Purchased animal feed, United Kingdom: (total purchased animal feed) \(tonnes\)$/, ['Piensos comprados, Reino Unido: {c} (toneladas)', 'Aliments achetés, Royaume-Uni : {c} (tonnes)', 'Mangimi acquistati, Regno Unito: {c} (tonnellate)']],
    [/^Purchased animal feed, United Kingdom: (value of purchased animal feed) \(GBP million, current prices\)$/, ['Piensos comprados, Reino Unido: {c} (millones de GBP, precios corrientes)', 'Aliments achetés, Royaume-Uni : {c} (millions de GBP, prix courants)', 'Mangimi acquistati, Regno Unito: {c} (milioni di GBP, prezzi correnti)']],
    [/^Agricultural support payments: (.+) \(GBP million\)$/, ['Pagos de ayuda agraria: {c} (millones de GBP)', 'Aides agricoles versées : {c} (millions de GBP)', 'Pagamenti di sostegno agricolo: {c} (milioni di GBP)']],
    [/^Agricultural support payments, United Kingdom, by category: (.+) \(GBP million\)$/, ['Pagos de ayuda agraria, Reino Unido, por categoría: {c} (millones de GBP)', 'Aides agricoles versées, Royaume-Uni, par catégorie : {c} (millions de GBP)', 'Pagamenti di sostegno agricolo, Regno Unito, per categoria: {c} (milioni di GBP)']],
    [/^Area under agri-environment schemes: (.+) \(hectares\)$/, ['Superficie en programas agroambientales: {c} (hectáreas)', 'Superficie sous programmes agroenvironnementaux : {c} (hectares)', 'Superficie nei programmi agroambientali: {c} (ettari)']],
    [/^Agri-environment scheme agreements: (.+) \(agreements, rounded to the nearest hundred\)$/, ['Contratos de programas agroambientales: {c} (contratos, redondeados a la centena)', 'Contrats agroenvironnementaux : {c} (contrats, arrondis à la centaine)', 'Contratti dei programmi agroambientali: {c} (contratti, arrotondati alle centinaia)']],
    [/^Organic land area, (.+): (.+) \(hectares\)$/, ['Superficie ecológica, {c}: {d} (hectáreas)', 'Surface biologique, {c} : {d} (hectares)', 'Superficie biologica, {c}: {d} (ettari)']],
    [/^Organic operators, (.+): (.+) \(operators\)$/, ['Operadores ecológicos, {c}: {d}', 'Opérateurs biologiques, {c} : {d}', 'Operatori biologici, {c}: {d}']],
    [/^Organic livestock, United Kingdom: (.+) \(head\)$/, ['Ganadería ecológica, Reino Unido: {c} (cabezas)', 'Élevage biologique, Royaume-Uni : {c} (têtes)', 'Allevamento biologico, Regno Unito: {c} (capi)']],
    [/^Food chain workforce, Great Britain: (.+) \(people\)$/, ['Empleo en la cadena alimentaria, Gran Bretaña: {c} (personas)', 'Emploi dans la chaîne alimentaire, Grande-Bretagne : {c} (personnes)', 'Occupazione nella filiera alimentare, Gran Bretagna: {c} (persone)']],
    [/^Gross value added, United Kingdom: (.+) \(GBP million, current prices\)$/, ['Valor añadido bruto, Reino Unido: {c} (millones de GBP, precios corrientes)', 'Valeur ajoutée brute, Royaume-Uni : {c} (millions de GBP, prix courants)', 'Valore aggiunto lordo, Regno Unito: {c} (milioni di GBP, prezzi correnti)']],
    [/^Household expenditure on food and drink, United Kingdom: (.+) \(GBP million, current prices\)$/, ['Gasto de los hogares en alimentos y bebidas, Reino Unido: {c} (millones de GBP, precios corrientes)', 'Dépenses des ménages en alimentation et boissons, Royaume-Uni : {c} (millions de GBP, prix courants)', 'Spesa delle famiglie per alimenti e bevande, Regno Unito: {c} (milioni di GBP, prezzi correnti)']],
    [/^Consumer price inflation \(CPIH\), United Kingdom: (.+) \(annual change, %\)$/, ['Inflación de precios al consumo (CPIH), Reino Unido: {c} (variación anual, %)', 'Inflation des prix à la consommation (CPIH), Royaume-Uni : {c} (variation annuelle, %)', 'Inflazione dei prezzi al consumo (CPIH), Regno Unito: {c} (variazione annua, %)']]
  ];
  var UKX = {
    'Area of fresh vegetables, United Kingdom (hectares)': ['Superficie de hortalizas frescas, Reino Unido (hectáreas)', 'Superficie de légumes frais, Royaume-Uni (hectares)', 'Superficie di ortaggi freschi, Regno Unito (ettari)'],
    'Dairy herd, annual average, United Kingdom (head)': ['Vacas lecheras (media anual), Reino Unido (cabezas)', 'Vaches laitières (moyenne annuelle), Royaume-Uni (têtes)', 'Vacche da latte (media annua), Regno Unito (capi)'],
    'Milk yield per dairy cow, United Kingdom (litres per year)': ['Rendimiento lechero por vaca, Reino Unido (litros al año)', 'Rendement laitier par vache, Royaume-Uni (litres par an)', 'Resa di latte per vacca, Regno Unito (litri all’anno)'],
    'Milk from the dairy herd, United Kingdom, annual (million litres)': ['Leche de la cabaña lechera, Reino Unido, anual (millones de litros)', 'Lait du troupeau laitier, Royaume-Uni, annuel (millions de litres)', 'Latte del patrimonio lattiero, Regno Unito, annuale (milioni di litri)'],
    'Farm-gate milk price, United Kingdom: excluding bonus payments (pence per litre)': ['Precio de la leche en origen, Reino Unido: sin primas (peniques por litro)', 'Prix du lait départ ferme, Royaume-Uni : hors primes (pence par litre)', 'Prezzo del latte alla stalla, Regno Unito: premi esclusi (penny per litro)'],
    'Farm-gate milk price, United Kingdom: including bonus payments (pence per litre)': ['Precio de la leche en origen, Reino Unido: con primas (peniques por litro)', 'Prix du lait départ ferme, Royaume-Uni : primes incluses (pence par litre)', 'Prezzo del latte alla stalla, Regno Unito: premi inclusi (penny per litro)'],
    'Laying fowl, United Kingdom (birds)': ['Gallinas ponedoras, Reino Unido (aves)', 'Poules pondeuses, Royaume-Uni (oiseaux)', 'Galline ovaiole, Regno Unito (capi)']
  };
  var UKK = { Area: ['Superficie', 'Superficie', 'Superficie'], Yield: ['Rendimiento', 'Rendement', 'Resa'], Production: ['Producción', 'Production', 'Produzione'] };
  var UKU = { hectares: ['hectáreas', 'hectares', 'ettari'], 't/ha': ['t/ha', 't/ha', 't/ha'], tonnes: ['toneladas', 'tonnes', 'tonnellate'], 'million litres': ['millones de litros', 'millions de litres', 'milioni di litri'] };
  function ukTl(label, k) { // k: 1=es, 2=fr, 3=it
    if (UKX[label]) return UKX[label][k - 1];
    for (var i = 0; i < UKT.length; i++) {
      var m = UKT[i][0].exec(label); if (!m) continue;
      var out = UKT[i][1][k - 1];
      if (UKK[m[1]]) { // «Area/Yield/Production: cultivo, región (unidad)»
        var cc = UKC[m[2]], dd = UKC[m[3]]; if (!cc || !dd) return null;
        return out.replace('{k}', UKK[m[1]][k - 1]).replace('{c}', cc[k - 1]).replace('{d}', dd[k - 1]).replace('{u}', UKU[m[4]][k - 1]);
      }
      var c = UKC[m[1]]; if (!c) return null;
      if (out.indexOf('{d}') > -1) { var d2 = UKC[m[2]]; if (!d2) return null; var o2 = out.replace('{c}', c[k - 1]).replace('{d}', d2[k - 1]); return o2.charAt(0).toUpperCase() + o2.slice(1); } // «producto: medida (toneladas)»
      var res = out.replace('{c}', c[k - 1]).replace('{u}', m[2] && UKU[m[2]] ? UKU[m[2]][k - 1] : '');
      return res.replace('{y}', m[m.length - 1]);
    }
    return null;
  }
  function tl(label, lang) {
    var k = li(lang); if (!label || k === 0) return label;
    var uk = ukTl(String(label), k); if (uk) return uk;
    var s = String(label), tail = '', m;
    m = /\s+\((monthly|annual|weekly|quarterly|half-year)\)$/.exec(s); if (m) { tail = ' (' + FREQ[m[1]][L.indexOf(lang)] + ')'; s = s.slice(0, m.index); }
    var idx = s.indexOf(': '), head = idx > -1 ? s.slice(0, idx) : s, rest = idx > -1 ? s.slice(idx + 2) : '', h;
    var rm = /^(Exports to|Imports from) (.+)$/.exec(head);
    if (rm) { var cn = country(rm[2], lang); if (!cn) return label; h = (rm[1] === 'Exports to' ? ['', 'Exportaciones a ', 'Exportations vers ', 'Esportazioni verso '] : ['', 'Importaciones desde ', 'Importations depuis ', 'Importazioni da '])[k] + cn; }
    else { var r = HM[head.toLowerCase()]; if (r) h = r[k]; else { var ch = term(head, k); if (!ch || !rest) return label; h = ch.charAt(0).toUpperCase() + ch.slice(1); } }
    if (!rest) return h + tail;
    // resto: «agri-food, HS 01-24», «Vegetables (2020=100)», «Wheat»…
    var suffix = '', sm = /\s*(\(2\d{3}=100\)|\(price paid\)|\(producer price\)|\(Jul-Jun year\))$/.exec(rest);
    if (sm) { suffix = ' ' + sm[1].replace('(price paid)', '(' + ['', 'precio pagado', 'prix payé', 'prezzo pagato'][k] + ')').replace('(Jul-Jun year)', '(' + ['', 'campaña jul-jun', 'campagne juil.-juin', 'campagna lug-giu'][k] + ')').replace('(producer price)', '(' + ['', 'precio al productor', 'prix à la production', 'prezzo alla produzione'][k] + ')'); rest = rest.slice(0, sm.index); }
    var hs = /,?\s*((?:HS|SITC)\s[\d\- ]+\d|SITC \d)$/.exec(rest), code = '';
    if (hs) { code = ', ' + hs[1]; rest = rest.slice(0, hs.index); }
    var tr = termChain(rest, k); if (!tr) return label;
    return h + ': ' + tr + code + suffix + tail;
  }

  // ---------- números ----------
  function nfmt(v, d, lang) { try { return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dec(v) { var a = Math.abs(v); return a >= 100 ? 0 : a >= 10 ? 1 : 2; }
  function unitTxt(v, u, lang) { // «EUR million» se lee mejor como «12.050 millones de EUR»
    var m = /^(\S+) million(?: \(.*\))?$/.exec(u), n = nfmt(v, dec(v), lang); if (!m) return n + ' ' + u;
    return { es: n + ' millones de ' + m[1], en: m[1] + ' ' + n + ' million', fr: n + ' millions de ' + m[1], it: n + ' milioni di ' + m[1] }[lang] || n + ' ' + u;
  }
  function pct(v, lang) { return (v > 0 ? '+' : v < 0 ? '−' : '') + nfmt(Math.abs(v), 1, lang) + ' %'; }
  function ts(p) { var m; if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p))) return Date.UTC(+m[1], +m[2] - 1, +m[3]); if ((m = /^(\d{4})-(\d{2})$/.exec(p))) return Date.UTC(+m[1], +m[2] - 1, 1); if ((m = /^(\d{4})-Q(\d)$/.exec(p))) return Date.UTC(+m[1], (+m[2] - 1) * 3, 1); if ((m = /^(\d{4})$/.exec(p))) return Date.UTC(+m[1], 0, 1); return NaN; }

  // ---------- contexto del indicador: último dato dentro de su rango de 5 años ----------
  function ctx(s) {
    var P = s && s.points; if (!P || P.length < 6) return null;
    var last = P[P.length - 1], t1 = ts(last[0]); if (t1 !== t1 || last[1] == null) return null;
    var from = t1 - 5 * 365.25 * 864e5, W = P.filter(function (p) { return p[1] != null && ts(p[0]) >= from; });
    if (W.length < 5) return null;
    if ((t1 - ts(W[0][0])) / (365.25 * 864e5) < 2.5) return null; // menos de ~3 años de histórico: no hay rango que mostrar
    var mn = Infinity, mx = -Infinity, prior = W.slice(0, -1);
    prior.forEach(function (p) { if (p[1] < mn) mn = p[1]; if (p[1] > mx) mx = p[1]; });
    var v = last[1], lo = Math.min(mn, v), hi = Math.max(mx, v), pos = hi > lo ? (v - lo) / (hi - lo) : 0.5;
    return { min: lo, max: hi, v: v, pos: pos, n: W.length, isMax: v >= mx && v > mn, isMin: v <= mn && v < mx, years: Math.round((t1 - ts(W[0][0])) / (365.25 * 864e5) * 10) / 10, yrs: Math.min(5, (t1 - ts(W[0][0])) / (365.25 * 864e5) >= 4.75 ? 5 : Math.floor((t1 - ts(W[0][0])) / (365.25 * 864e5))) };
  }
  var CT = {
    es: { range: 'Rango de {n} años', max: 'Máximo de {n} años', min: 'Mínimo de {n} años', to: 'a', aria: function (a) { return 'Último dato dentro del rango de los últimos ' + a.n + ' años, de ' + a.lo + ' a ' + a.hi; } },
    en: { range: '{n}-year range', max: '{n}-year high', min: '{n}-year low', to: 'to', aria: function (a) { return 'Latest value within its last ' + a.n + '-year range, from ' + a.lo + ' to ' + a.hi; } },
    fr: { range: 'Plage sur {n} ans', max: 'Plus haut sur {n} ans', min: 'Plus bas sur {n} ans', to: 'à', aria: function (a) { return 'Dernière donnée dans sa plage des ' + a.n + ' dernières années, de ' + a.lo + ' à ' + a.hi; } },
    it: { range: 'Intervallo a {n} anni', max: 'Massimo a {n} anni', min: 'Minimo a {n} anni', to: 'a', aria: function (a) { return 'Ultimo dato nell’intervallo degli ultimi ' + a.n + ' anni, da ' + a.lo + ' a ' + a.hi; } }
  };
  function ctxHtml(s, lang, esc) {
    var c = ctx(s); if (!c) return ''; var t = CT[lang] || CT.es, d = dec(Math.max(Math.abs(c.min), Math.abs(c.max))), lo = nfmt(c.min, d, lang), hi = nfmt(c.max, d, lang);
    var tag = (c.isMax ? t.max : c.isMin ? t.min : '').replace('{n}', c.yrs);
    t = { range: t.range.replace('{n}', c.yrs), aria: t.aria };
    return '<div class="pp-rng" role="img" aria-label="' + esc(t.aria({ lo: lo, hi: hi, n: c.yrs })) + '"><div class="pp-rng-t"><span class="pp-rng-d" style="left:' + Math.round(c.pos * 100) + '%"></span></div>' +
      '<div class="pp-rng-l"><span>' + esc(lo) + '</span>' + (tag ? '<b>' + esc(tag) + '</b>' : '<span>' + esc(t.range) + '</span>') + '<span>' + esc(hi) + '</span></div></div>';
  }

  // ---------- resumen en lenguaje llano ----------
  var PR = {
    es: { cmp: { daily: 'frente al día anterior', weekly: 'frente a la semana anterior', monthly: 'frente al mes anterior', quarterly: 'frente al trimestre anterior', 'half-year': 'frente al semestre anterior', annual: 'frente al año anterior' }, same: 'sin cambio ', hi: 'su máximo de los últimos {n} años', lo: 'su mínimo de los últimos {n} años', alsoHi: 'También en su máximo de los últimos {n} años: ', alsoLo: 'También en su mínimo de los últimos {n} años: ', dst: 'Principal destino agroalimentario', org: 'Principal origen', unusual: 'Lo que más se ha movido de lo habitual', head: 'En pocas palabras', note: 'Resumen automático de los últimos datos publicados; no es una previsión.' },
    en: { cmp: { daily: 'from the previous day', weekly: 'from the previous week', monthly: 'from the previous month', quarterly: 'from the previous quarter', 'half-year': 'from the previous half-year', annual: 'from the previous year' }, same: 'unchanged ', hi: 'its highest in {n} years', lo: 'its lowest in {n} years', alsoHi: 'Also at a {n}-year high: ', alsoLo: 'Also at a {n}-year low: ', dst: 'Largest agri-food destination', org: 'Largest source', unusual: 'The biggest move beyond what is usual', head: 'In a nutshell', note: 'Automatic summary of the latest published data; not a forecast.' },
    fr: { cmp: { daily: 'par rapport à la veille', weekly: 'par rapport à la semaine précédente', monthly: 'par rapport au mois précédent', quarterly: 'par rapport au trimestre précédent', 'half-year': 'par rapport au semestre précédent', annual: 'par rapport à l’année précédente' }, same: 'sans changement ', hi: 'son plus haut niveau depuis {n} ans', lo: 'son plus bas niveau depuis {n} ans', alsoHi: 'Aussi à leur plus haut depuis {n} ans : ', alsoLo: 'Aussi à leur plus bas depuis {n} ans : ', dst: 'Première destination agroalimentaire', org: 'Première origine', unusual: 'Ce qui a le plus bougé par rapport à l’habitude', head: 'En bref', note: 'Résumé automatique des dernières données publiées ; ce n’est pas une prévision.' },
    it: { cmp: { daily: 'rispetto al giorno precedente', weekly: 'rispetto alla settimana precedente', monthly: 'rispetto al mese precedente', quarterly: 'rispetto al trimestre precedente', 'half-year': 'rispetto al semestre precedente', annual: 'rispetto all’anno precedente' }, same: 'invariato ', hi: 'il suo massimo degli ultimi {n} anni', lo: 'il suo minimo degli ultimi {n} anni', alsoHi: 'Anche al massimo degli ultimi {n} anni: ', alsoLo: 'Anche al minimo degli ultimi {n} anni: ', dst: 'Prima destinazione agroalimentare', org: 'Prima origine', unusual: 'Ciò che si è mosso di più rispetto al solito', head: 'In breve', note: 'Riepilogo automatico degli ultimi dati pubblicati; non è una previsione.' }
  };
  // in: { lang, kpis:[series], partners:[series], unusual:[{s,ch}], plabel(p,freq) }  -> { head, sentences:[], note } | null
  function plain(inp) {
    var lang = inp.lang, t = PR[lang] || PR.es, out = [], k = (inp.kpis || []).filter(function (s) { return s && s.latest != null && s.latestPeriod; });
    var lead = k.filter(function (s) { return /^(prices|quotes|milk|prices_lv|prices_fv|idx_perc)$/.test(s.group); })[0] || k[0], second = k.filter(function (s) { return s !== lead && s.unit !== (lead && lead.unit); })[0];
    var clean = function (l) { return tl(String(l).replace(/\s*\((monthly|quarterly|annual|weekly|half-year)[^)]*\)$/i, ''), lang); };
    var done = {};
    [lead, second].forEach(function (s) {
      if (!s) return;
      var txt = clean(s.label) + ' — ' + unitTxt(s.latest, s.unit, lang) + ' (' + inp.plabel(s.latestPeriod, s.frequency) + ')';
      if (s.changePct != null) { var c = Math.abs(s.changePct) < 0.05; txt += ', ' + (c ? t.same : pct(s.changePct, lang) + ' ') + (t.cmp[s.frequency] || t.cmp.monthly); }
      var cx = ctx(s); if (cx && (cx.isMax || cx.isMin)) txt += ', ' + (cx.isMax ? t.hi : t.lo).replace('{n}', cx.yrs);
      out.push(txt + '.'); done[s.id] = 1;
    });
    // otros indicadores clave que también están en su máximo o mínimo del periodo
    var ext = { hi: [], lo: [] }; k.forEach(function (s) { if (done[s.id]) return; var cx = ctx(s); if (!cx) return; if (cx.isMax) ext.hi.push({ s: s, n: cx.yrs }); else if (cx.isMin) ext.lo.push({ s: s, n: cx.yrs }); });
    ['hi', 'lo'].forEach(function (w) { if (ext[w].length) out.push(t[w === 'hi' ? 'alsoHi' : 'alsoLo'].replace('{n}', ext[w][0].n) + ext[w].slice(0, 3).map(function (e) { return clean(e.s.label); }).join('; ') + '.'); });
    var side = function (tag, lab) {
      var l = (inp.partners || []).filter(function (s) { return s.id.indexOf('-' + tag + '-') > -1; }), an = l.filter(function (s) { return s.frequency === 'annual'; }); if (an.length) l = an;
      l = l.filter(function (s) { return s.latest != null; }).sort(function (a, b) { return b.latest - a.latest; });
      if (!l.length) return null; var s = l[0], raw = s.label.replace(/^(Exports to|Imports from)\s+/i, '').replace(/:.*$/, '');
      return lab + ': ' + (country(raw, lang) || raw) + ', ' + unitTxt(s.latest, s.unit, lang) + ' (' + inp.plabel(s.latestPeriod, s.frequency) + ').';
    };
    var d = side('exp', t.dst), o = side('imp', t.org); if (d) out.push(d); if (o) out.push(o);
    var u = (inp.unusual || [])[0]; if (u) out.push(t.unusual + ': ' + clean(u.s.label) + ', ' + pct(u.ch, lang) + '.');
    if (!out.length) return null;
    return { head: t.head, sentences: out, note: t.note };
  }

  // ---------- ayudas «?» ----------
  var HP = {
    coverage: {
      es: ['Qué mide esta puntuación', 'Mide cuántos datos oficiales tenemos de este país, no lo importante o desarrollado que sea su mercado. Amplitud: cuántos de los 4 bloques (mercados, producción, comercio, insumos) tienen series. Frescura: qué parte de las series está al día para su frecuencia. Profundidad: años de histórico (mediana, hasta 20). Frecuencia: qué parte de las series se publica cada mes, semana o día.'],
      en: ['What this score measures', 'It measures how much official data we hold for this country, not how large or developed its market is. Breadth: how many of the 4 blocks (markets, production, trade, inputs) have series. Freshness: share of series up to date for their frequency. Depth: years of history (median, capped at 20). Frequency: share of series published monthly, weekly or daily.'],
      fr: ['Ce que mesure ce score', 'Il mesure la quantité de données officielles que nous avons pour ce pays, pas l’importance de son marché. Étendue : combien des 4 blocs (marchés, production, commerce, intrants) ont des séries. Fraîcheur : part des séries à jour pour leur fréquence. Profondeur : années d’historique (médiane, plafonnée à 20). Fréquence : part des séries publiées chaque mois, semaine ou jour.'],
      it: ['Cosa misura questo punteggio', 'Misura quanti dati ufficiali abbiamo per questo paese, non l’importanza del suo mercato. Ampiezza: quanti dei 4 blocchi (mercati, produzione, commercio, input) hanno serie. Freschezza: quota di serie aggiornate per la loro frequenza. Profondità: anni di storico (mediana, massimo 20). Frequenza: quota di serie pubblicate ogni mese, settimana o giorno.']
    },
    unusual: {
      es: ['Qué es un movimiento inusual', 'Comparamos el cambio del último periodo con los cambios que esa misma serie ha tenido antes. Solo aparece si es mucho mayor de lo habitual para ella (más de 2,5 desviaciones típicas, es decir, algo que ocurre muy pocas veces). No significa que sea bueno o malo.'],
      en: ['What an unusual move is', 'We compare the latest change with the changes that same series has had before. It only appears if it is much larger than usual for that series (more than 2.5 standard deviations, i.e. something that rarely happens). It does not mean good or bad.'],
      fr: ['Ce qu’est un mouvement inhabituel', 'Nous comparons la variation de la dernière période avec les variations passées de la même série. Elle n’apparaît que si elle est bien plus grande que d’habitude pour cette série (plus de 2,5 écarts-types, donc rare). Cela ne veut pas dire bon ou mauvais.'],
      it: ['Cos’è un movimento insolito', 'Confrontiamo la variazione dell’ultimo periodo con quelle che la stessa serie ha avuto in passato. Compare solo se è molto più grande del solito per quella serie (oltre 2,5 deviazioni standard, cioè raro). Non significa né bene né male.']
    },
    range: {
      es: ['Cómo leer el rango de 5 años', 'La barra va del valor más bajo al más alto de esa serie en los últimos 5 años; el punto marca dónde está el último dato. Sirve para situarlo, no para predecir nada.'],
      en: ['How to read the 5-year range', 'The bar runs from the lowest to the highest value of that series in the last 5 years; the dot marks the latest figure. It places the figure in context; it predicts nothing.'],
      fr: ['Comment lire la plage sur 5 ans', 'La barre va de la valeur la plus basse à la plus haute de cette série sur 5 ans ; le point marque la dernière donnée. Elle situe la valeur, elle ne prédit rien.'],
      it: ['Come leggere l’intervallo a 5 anni', 'La barra va dal valore più basso al più alto di quella serie negli ultimi 5 anni; il punto indica l’ultimo dato. Serve a collocarlo, non a prevedere nulla.']
    },
    hs: {
      es: ['Qué es HS 01-24', 'El Sistema Armonizado (HS) es el código internacional de las mercancías en el comercio exterior. Los capítulos 01 a 24 son los productos agroalimentarios (animales vivos, carne, lácteos, cereales, frutas, aceites, bebidas…). SITC es una clasificación equivalente más antigua.'],
      en: ['What HS 01-24 means', 'The Harmonized System (HS) is the international code for goods in foreign trade. Chapters 01 to 24 are agri-food products (live animals, meat, dairy, cereals, fruit, oils, beverages…). SITC is an older, equivalent classification.'],
      fr: ['Que signifie HS 01-24', 'Le Système harmonisé (SH, « HS ») est le code international des marchandises dans le commerce extérieur. Les chapitres 01 à 24 sont les produits agroalimentaires (animaux vivants, viande, produits laitiers, céréales, fruits, huiles, boissons…). SITC est une classification équivalente plus ancienne.'],
      it: ['Cosa significa HS 01-24', 'Il Sistema armonizzato (HS) è il codice internazionale delle merci nel commercio estero. I capitoli da 01 a 24 sono i prodotti agroalimentari (animali vivi, carne, latticini, cereali, frutta, oli, bevande…). SITC è una classificazione equivalente più vecchia.']
    },
    hhi: {
      es: ['Qué es el índice HHI', 'Mide cuánto se concentra el comercio en pocos socios: suma los cuadrados de la cuota de cada uno (de 0 a 10.000). Por debajo de 1.500 se considera concentración baja, hasta 2.500 moderada y por encima, alta. Aquí solo se usan los 10 mayores socios, así que es un mínimo.'],
      en: ['What the HHI is', 'It measures how concentrated trade is among a few partners: the sum of each partner’s squared share (0 to 10,000). Below 1,500 is considered low concentration, up to 2,500 moderate, above that high. Only the 10 largest partners are used here, so it is a minimum.'],
      fr: ['Qu’est-ce que l’indice HHI', 'Il mesure la concentration du commerce sur quelques partenaires : somme des carrés de la part de chacun (de 0 à 10 000). Sous 1 500, concentration faible ; jusqu’à 2 500, modérée ; au-delà, élevée. Seuls les 10 premiers partenaires sont utilisés : c’est un minimum.'],
      it: ['Cos’è l’indice HHI', 'Misura quanto il commercio è concentrato in pochi partner: somma dei quadrati della quota di ciascuno (da 0 a 10.000). Sotto 1.500 la concentrazione è bassa, fino a 2.500 moderata, oltre alta. Qui si usano solo i 10 maggiori partner, quindi è un minimo.']
    }
  };
  function help(key, lang, esc) {
    var h = HP[key]; if (!h) return ''; var r = h[lang] || h.es, id = 'pp-tip-' + key + '-' + Math.floor(Math.random() * 1e6);
    return '<span class="pp-qw"><button type="button" class="pp-q" aria-expanded="false" aria-controls="' + id + '" aria-label="' + esc(r[0]) + '">?</button></span><div class="pp-tip" id="' + id + '" role="note" hidden><b>' + esc(r[0]) + '.</b> ' + esc(r[1]) + '</div>';
  }
  function bindHelp() {
    if (root.__ppHelp || typeof document === 'undefined') return; root.__ppHelp = 1;
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.pp-q') : null; if (!b) return;
      var tip = document.getElementById(b.getAttribute('aria-controls')); if (!tip) return;
      var open = tip.hasAttribute('hidden'); if (open) tip.removeAttribute('hidden'); else tip.setAttribute('hidden', ''); b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ---------- preguntas guía ----------
  var Q = [
    { id: 'prices', groups: ['prices_lv', 'prices', 'milk', 'idx_perc', 'prices_fv', 'prices_paid'], q: ['¿Cuánto cobra el agricultor o ganadero?', 'How much do farmers get paid?', 'Combien touchent les agriculteurs ?', 'Quanto incassano gli agricoltori?'] },
    { id: 'inputs', groups: ['inputs_f', 'inputs', 'inputs_a', 'idx_pag', 'costs'], q: ['¿Cuánto cuestan los piensos y fertilizantes?', 'How much do feed and fertiliser cost?', 'Combien coûtent les aliments et les engrais ?', 'Quanto costano mangimi e fertilizzanti?'] },
    { id: 'trade', groups: ['partners', 'trade'], q: ['¿A quién vende y de quién compra?', 'Who does it sell to and buy from?', 'À qui vend-il et à qui achète-t-il ?', 'A chi vende e da chi compra?'] },
    { id: 'prod', groups: ['production', 'crops', 'livestock', 'stocks'], q: ['¿Cuánto se produce y qué hay almacenado?', 'How much is produced and stored?', 'Combien produit-on et que stocke-t-on ?', 'Quanto si produce e cosa c’è in magazzino?'] },
    { id: 'quotes', groups: ['quotes'], q: ['¿Qué cotiza en el mercado?', 'What is quoted on the market?', 'Que cote-t-on sur le marché ?', 'Cosa quota sul mercato?'] },
    { id: 'rates', groups: ['rates'], q: ['¿Cómo van los tipos de interés?', 'Where are interest rates?', 'Où en sont les taux d’intérêt ?', 'Come vanno i tassi di interesse?'] }
  ];
  // groups: { grupo: [series] } -> [{id, q, group, n}] (solo preguntas con datos; el grupo con más series de cada tema)
  function questions(groups, lang) {
    var k = L.indexOf(lang); if (k < 0) k = 0; var out = [];
    Q.forEach(function (q) {
      var best = null, tot = 0; // el primer grupo existente de la lista es el más representativo del tema
      q.groups.forEach(function (g) { var n = groups[g] ? groups[g].length : 0; tot += n; if (n && !best) best = { g: g, n: n }; });
      if (best) out.push({ id: q.id, q: q.q[k], group: best.g, n: tot });
    });
    return out;
  }

  // ---------- índice de secciones ----------
  var NV = { es: { sum: 'Resumen', kpi: 'Indicadores', trade: 'Comercio', ask: 'Preguntas', exp: 'Explorar', label: 'Secciones de la página' }, en: { sum: 'Summary', kpi: 'Indicators', trade: 'Trade', ask: 'Questions', exp: 'Explore', label: 'Page sections' }, fr: { sum: 'Résumé', kpi: 'Indicateurs', trade: 'Commerce', ask: 'Questions', exp: 'Explorer', label: 'Sections de la page' }, it: { sum: 'Riepilogo', kpi: 'Indicatori', trade: 'Commercio', ask: 'Domande', exp: 'Esplora', label: 'Sezioni della pagina' } };
  function nav(present, lang, esc) {
    var t = NV[lang] || NV.es, order = [['sum', 'pp-sum'], ['kpi', 'pp-kpi'], ['trade', 'pp-trade'], ['ask', 'pp-ask'], ['exp', 'ps-explorer']];
    var items = order.filter(function (o) { return present[o[0]]; });
    if (items.length < 2) return '';
    return '<nav class="pp-nav" aria-label="' + esc(t.label) + '">' + items.map(function (o) { return '<a href="#' + o[1] + '" data-pp="' + o[1] + '">' + esc(t[o[0]]) + '</a>'; }).join('') + '</nav>';
  }
  function bindNav() {
    if (typeof document === 'undefined') return;
    var n = document.querySelector('.pp-nav'); if (!n) return;
    var hd = document.querySelector('.di-header'); n.style.top = (hd ? hd.offsetHeight : 0) + 'px';
    var links = Array.prototype.slice.call(n.querySelectorAll('a'));
    links.forEach(function (a) { a.addEventListener('click', function (e) { var el = document.getElementById(a.getAttribute('data-pp')); if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); try { history.replaceState(null, '', '#' + el.id); } catch (x) {} } }); });
    if (!('IntersectionObserver' in root)) return;
    var cur = null, io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) cur = en.target.id; });
      links.forEach(function (a) { var on = a.getAttribute('data-pp') === cur; if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }, { rootMargin: '-25% 0px -65% 0px' });
    links.forEach(function (a) { var el = document.getElementById(a.getAttribute('data-pp')); if (el) io.observe(el); });
  }

  // ---------- compartir: copiar el enlace a una sección ----------
  var SH = { es: ['Copiar el enlace a esta sección', 'Enlace copiado', 'No se pudo copiar'], en: ['Copy link to this section', 'Link copied', 'Could not copy'], fr: ['Copier le lien vers cette section', 'Lien copié', 'Copie impossible'], it: ['Copia il link a questa sezione', 'Link copiato', 'Copia non riuscita'] };
  function share(id, lang, esc) {
    var t = SH[lang] || SH.es;
    return '<button type="button" class="pp-share" data-share="' + esc(id) + '" data-ok="' + esc(t[1]) + '" data-err="' + esc(t[2]) + '" aria-label="' + esc(t[0]) + '" title="' + esc(t[0]) + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg></button>';
  }
  // enlace a una sección: el país (y, en el explorador, también la serie y el periodo elegidos) + ancla
  function shareUrl(loc, id) {
    var u = new URL(loc.href), q = new URLSearchParams(u.search), keep = new URLSearchParams();
    if (q.get('c')) keep.set('c', q.get('c'));
    if (id === 'ps-explorer') ['g', 's', 'r', 'fx'].forEach(function (k) { if (q.get(k)) keep.set(k, q.get(k)); });
    u.search = keep.toString() ? '?' + keep.toString() : ''; u.hash = '#' + id; return u.toString();
  }
  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    return new Promise(function (res, rej) { try { var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); document.body.removeChild(ta); ok ? res() : rej(); } catch (e) { rej(e); } });
  }
  function bindShare() {
    if (root.__ppShare || typeof document === 'undefined') return; root.__ppShare = 1;
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.pp-share') : null; if (!b) return;
      var live = document.getElementById('pp-live'); if (!live) { live = document.createElement('div'); live.id = 'pp-live'; live.className = 'pp-live'; live.setAttribute('role', 'status'); document.body.appendChild(live); }
      var done = function (msg, bad) { live.textContent = msg; live.className = 'pp-live is-on' + (bad ? ' is-bad' : ''); clearTimeout(live._t); live._t = setTimeout(function () { live.className = 'pp-live'; }, 2200); };
      copyText(shareUrl(location, b.getAttribute('data-share'))).then(function () { done(b.getAttribute('data-ok')); }, function () { done(b.getAttribute('data-err'), true); });
    });
  }

  var API = { share: share, shareUrl: shareUrl, bindShare: bindShare, tl: tl, ctx: ctx, ctxHtml: ctxHtml, plain: plain, help: help, bindHelp: bindHelp, questions: questions, nav: nav, bindNav: bindNav, _country: country };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.DIClear = API;
})(typeof window !== 'undefined' ? window : globalThis);
