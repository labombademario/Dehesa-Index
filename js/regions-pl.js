/* Dehesa Index — Polonia por voivodía: cultivos, ganado, carne y leche (GUS, Banco de Datos Locales, nivel 2).
   data/poland-regions/regions.json (scripts/update-poland-regions.py). Se monta en la ficha de Polonia (paises.js): DIRegionsPl.mount(el, lang).
   El mapa y su leyenda vienen de js/fr-dept-map.js (vendor/pl-voivodeships.js, cargados a petición). Si el fichero no existe el bloque no se dibuja. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: {
      h: 'Polonia por voivodía: cultivos, ganado, carne y leche', badge: 'DATOS OFICIALES REALES', meas: 'Indicador', year: 'Año',
      natRow: 'Polonia, total', vsPrev: 'Frente al año anterior', hi: 'Mayor', lo: 'Menor', share: 'Parte del total',
      map: 'Por voivodía', all: 'Ver todas las voivodías', reg: 'Voivodía', val: 'Valor', chg: 'Variación anual', evo: 'Evolución', evoIn: 'Evolución en', poland: 'Polonia (total)',
      hover: 'Pasa el cursor o toca la gráfica para ver cada año', hoverMap: 'Pasa el cursor o toca una voivodía para ver su dato', noData: 'sin dato', head: 'cabezas',
      note: 'Superficie sembrada, rendimiento, cosecha, censos de ganado, carne producida y leche de vaca producida, por voivodía, según la Oficina Central de Estadística (GUS) en su Banco de Datos Locales. Valores definitivos; la cosecha y el rendimiento se convierten de quintales (dt) a toneladas. En los indicadores que se suman, la suma de las 16 voivodías se comprueba contra el total nacional de GUS. Las voivodías en gris no tienen dato ese año.',
      src: 'Fuente:', srcN: 'GUS, Banco de Datos Locales: producción vegetal, ganado y producción animal por voivodía', cite: 'Variaciones, máximos, mínimos y partes del total: cálculo de Dehesa Index.',
      mk: 'Cultivos, ganado, carne y leche por voivodía, desde 1999 (la leche y el maíz grano desde 2004)', ty: 'Valor por voivodía y año', ob: 'Un dato por voivodía, año e indicador; GUS deja huecos que aquí se muestran como «sin dato», nunca como cero',
      m: { area: 'superficie sembrada', yield: 'rendimiento', harvest: 'cosecha' },
      c: { 'cereals-total': 'Cereales (total)', wheat: 'Trigo', rye: 'Centeno', barley: 'Cebada', oats: 'Avena', triticale: 'Triticale', 'maize-for-grain': 'Maíz grano', potatoes: 'Patata', 'sugar-beets': 'Remolacha azucarera', 'rape-and-turnip-rape': 'Colza' },
      o: { 'herd-cattle': 'Vacuno: censo total', 'herd-dairy-cows': 'Vacas lecheras: censo', 'herd-pigs': 'Porcino: censo total', 'herd-sheep': 'Ovino: censo', 'herd-poultry': 'Aves de corral: censo total', 'herd-laying-hens': 'Gallinas ponedoras: censo',
            'slaughter-total': 'Carne producida (animales de abasto), total', 'slaughter-beef': 'Carne de vacuno producida', 'slaughter-pork': 'Carne de porcino producida', 'slaughter-poultry': 'Carne de aves producida', 'milk-production': 'Leche de vaca producida' },
      g: { crops: 'Cultivos', livestock: 'Ganado', production: 'Carne', milk: 'Leche', census: 'Censo agrario 2020 y agricultura de precisión' }, farms: 'explotaciones', pcs: 'uds.'
    },
    en: {
      h: 'Poland by voivodeship: crops, livestock, meat and milk', badge: 'REAL OFFICIAL DATA', meas: 'Indicator', year: 'Year',
      natRow: 'Poland, total', vsPrev: 'Versus previous year', hi: 'Highest', lo: 'Lowest', share: 'Share of total',
      map: 'By voivodeship', all: 'Show all voivodeships', reg: 'Voivodeship', val: 'Value', chg: 'Annual change', evo: 'Trend', evoIn: 'Trend in', poland: 'Poland (total)',
      hover: 'Hover or tap the chart to see each year', hoverMap: 'Hover or tap a voivodeship to see its figure', noData: 'no figure', head: 'head',
      note: 'Sown area, yield, harvest, livestock numbers, meat produced and cow’s milk produced, by voivodeship, from Statistics Poland (GUS) in its Local Data Bank. Final values only; harvest and yield are converted from quintals (dt) to tonnes. For the indicators that add up, the sum of the 16 voivodeships is checked against GUS’s national total. Voivodeships in grey have no figure that year.',
      src: 'Source:', srcN: 'GUS, Local Data Bank: crop production, livestock population and animal production by voivodeship', cite: 'Changes, highs, lows and shares of the total: calculated by Dehesa Index.',
      mk: 'Crops, livestock, meat and milk by voivodeship, since 1999 (milk and grain maize since 2004)', ty: 'Value by voivodeship and year', ob: 'One figure per voivodeship, year and indicator; GUS leaves gaps that are shown here as “no figure”, never as zero',
      m: { area: 'sown area', yield: 'yield', harvest: 'harvest' },
      c: { 'cereals-total': 'Cereals (total)', wheat: 'Wheat', rye: 'Rye', barley: 'Barley', oats: 'Oats', triticale: 'Triticale', 'maize-for-grain': 'Grain maize', potatoes: 'Potatoes', 'sugar-beets': 'Sugar beet', 'rape-and-turnip-rape': 'Rapeseed' },
      o: { 'herd-cattle': 'Cattle: total herd', 'herd-dairy-cows': 'Dairy cows: herd', 'herd-pigs': 'Pigs: total herd', 'herd-sheep': 'Sheep: flock', 'herd-poultry': 'Poultry: total', 'herd-laying-hens': 'Laying hens: flock',
            'slaughter-total': 'Meat produced (animals for slaughter), total', 'slaughter-beef': 'Beef produced', 'slaughter-pork': 'Pork produced', 'slaughter-poultry': 'Poultry meat produced', 'milk-production': 'Cow’s milk produced' },
      g: { crops: 'Crops', livestock: 'Livestock', production: 'Meat', milk: 'Milk', census: 'Farm census 2020 and precision farming' }, farms: 'farms', pcs: 'pcs'
    },
    fr: {
      h: 'Pologne par voïvodie : cultures, élevage, viande et lait', badge: 'DONNÉES OFFICIELLES RÉELLES', meas: 'Indicateur', year: 'Année',
      natRow: 'Pologne, total', vsPrev: 'Par rapport à l’année précédente', hi: 'Maximum', lo: 'Minimum', share: 'Part du total',
      map: 'Par voïvodie', all: 'Voir toutes les voïvodies', reg: 'Voïvodie', val: 'Valeur', chg: 'Variation annuelle', evo: 'Évolution', evoIn: 'Évolution en', poland: 'Pologne (total)',
      hover: 'Survolez ou touchez le graphique pour voir chaque année', hoverMap: 'Survolez ou touchez une voïvodie pour voir son chiffre', noData: 'pas de chiffre', head: 'têtes',
      note: 'Surface semée, rendement, récolte, effectifs d’élevage, viande produite et lait de vache produit, par voïvodie, selon l’Office central de statistique (GUS) dans sa Banque de données locales. Valeurs définitives ; la récolte et le rendement sont convertis des quintaux (dt) en tonnes. Pour les indicateurs additifs, la somme des 16 voïvodies est vérifiée par rapport au total national de GUS. Les voïvodies en gris n’ont pas de chiffre cette année-là.',
      src: 'Source :', srcN: 'GUS, Banque de données locales : production végétale, effectifs et production animale par voïvodie', cite: 'Variations, maxima, minima et parts du total : calcul de Dehesa Index.',
      mk: 'Cultures, élevage, viande et lait par voïvodie, depuis 1999 (lait et maïs grain depuis 2004)', ty: 'Valeur par voïvodie et par année', ob: 'Un chiffre par voïvodie, année et indicateur ; GUS laisse des trous, affichés ici comme « pas de chiffre », jamais comme zéro',
      m: { area: 'surface semée', yield: 'rendement', harvest: 'récolte' },
      c: { 'cereals-total': 'Céréales (total)', wheat: 'Blé', rye: 'Seigle', barley: 'Orge', oats: 'Avoine', triticale: 'Triticale', 'maize-for-grain': 'Maïs grain', potatoes: 'Pommes de terre', 'sugar-beets': 'Betterave sucrière', 'rape-and-turnip-rape': 'Colza' },
      o: { 'herd-cattle': 'Bovins : effectif total', 'herd-dairy-cows': 'Vaches laitières : effectif', 'herd-pigs': 'Porcins : effectif total', 'herd-sheep': 'Ovins : effectif', 'herd-poultry': 'Volailles : effectif total', 'herd-laying-hens': 'Poules pondeuses : effectif',
            'slaughter-total': 'Viande produite (animaux d’abattage), total', 'slaughter-beef': 'Viande bovine produite', 'slaughter-pork': 'Viande porcine produite', 'slaughter-poultry': 'Viande de volaille produite', 'milk-production': 'Lait de vache produit' },
      g: { crops: 'Cultures', livestock: 'Élevage', production: 'Viande', milk: 'Lait', census: 'Recensement agricole 2020 et agriculture de précision' }, farms: 'exploitations', pcs: 'unités'
    },
    it: {
      h: 'Polonia per voivodato: colture, allevamento, carne e latte', badge: 'DATI UFFICIALI REALI', meas: 'Indicatore', year: 'Anno',
      natRow: 'Polonia, totale', vsPrev: 'Rispetto all’anno precedente', hi: 'Massimo', lo: 'Minimo', share: 'Quota del totale',
      map: 'Per voivodato', all: 'Vedi tutti i voivodati', reg: 'Voivodato', val: 'Valore', chg: 'Variazione annua', evo: 'Andamento', evoIn: 'Andamento in', poland: 'Polonia (totale)',
      hover: 'Passa il cursore o tocca il grafico per vedere ogni anno', hoverMap: 'Passa il cursore o tocca un voivodato per vedere il suo dato', noData: 'nessun dato', head: 'capi',
      note: 'Superficie seminata, resa, raccolto, consistenza del bestiame, carne prodotta e latte vaccino prodotto, per voivodato, secondo l’Ufficio centrale di statistica (GUS) nella sua Banca dati locale. Solo valori definitivi; raccolto e resa sono convertiti da quintali (dt) a tonnellate. Per gli indicatori sommabili, la somma dei 16 voivodati è controllata rispetto al totale nazionale di GUS. I voivodati in grigio non hanno dato in quell’anno.',
      src: 'Fonte:', srcN: 'GUS, Banca dati locale: produzione vegetale, consistenza e produzione animale per voivodato', cite: 'Variazioni, massimi, minimi e quote del totale: calcolo di Dehesa Index.',
      mk: 'Colture, allevamento, carne e latte per voivodato, dal 1999 (latte e mais da granella dal 2004)', ty: 'Valore per voivodato e anno', ob: 'Un dato per voivodato, anno e indicatore; GUS lascia dei vuoti, mostrati qui come «nessun dato», mai come zero',
      m: { area: 'superficie seminata', yield: 'resa', harvest: 'raccolto' },
      c: { 'cereals-total': 'Cereali (totale)', wheat: 'Frumento', rye: 'Segale', barley: 'Orzo', oats: 'Avena', triticale: 'Triticale', 'maize-for-grain': 'Mais da granella', potatoes: 'Patate', 'sugar-beets': 'Barbabietola da zucchero', 'rape-and-turnip-rape': 'Colza' },
      o: { 'herd-cattle': 'Bovini: consistenza totale', 'herd-dairy-cows': 'Vacche da latte: consistenza', 'herd-pigs': 'Suini: consistenza totale', 'herd-sheep': 'Ovini: consistenza', 'herd-poultry': 'Pollame: consistenza totale', 'herd-laying-hens': 'Galline ovaiole: consistenza',
            'slaughter-total': 'Carne prodotta (animali da macello), totale', 'slaughter-beef': 'Carne bovina prodotta', 'slaughter-pork': 'Carne suina prodotta', 'slaughter-poultry': 'Carne di pollame prodotta', 'milk-production': 'Latte vaccino prodotto' },
      g: { crops: 'Colture', livestock: 'Allevamento', production: 'Carne', milk: 'Latte', census: 'Censimento agricolo 2020 e agricoltura di precisione' }, farms: 'aziende', pcs: 'pz.'
    }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, LX = { en: 0, es: 1, fr: 2, it: 3 };
  var ST = { c: 'crop-harvest-wheat', year: null, reg: 'PL' }, SCR = {}, CACHE = null;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var CL = {"census-farms-size-total": {"es": "Censo 2020: explotaciones agrarias, total", "en": "Census 2020: agricultural holdings, total", "fr": "Recensement 2020 : exploitations agricoles, total", "it": "Censimento 2020: aziende agricole, totale"}, "census-farms-size-up-to-1-ha": {"es": "Censo 2020: explotaciones de hasta 1 ha", "en": "Census 2020: holdings up to 1 ha", "fr": "Recensement 2020 : exploitations jusqu’à 1 ha", "it": "Censimento 2020: aziende fino a 1 ha"}, "census-farms-size-1-5-ha": {"es": "Censo 2020: explotaciones de 1 a 5 ha", "en": "Census 2020: holdings of 1-5 ha", "fr": "Recensement 2020 : exploitations de 1 à 5 ha", "it": "Censimento 2020: aziende da 1 a 5 ha"}, "census-farms-size-5-10-ha": {"es": "Censo 2020: explotaciones de 5 a 10 ha", "en": "Census 2020: holdings of 5-10 ha", "fr": "Recensement 2020 : exploitations de 5 à 10 ha", "it": "Censimento 2020: aziende da 5 a 10 ha"}, "census-farms-size-10-15-ha": {"es": "Censo 2020: explotaciones de 10 a 15 ha", "en": "Census 2020: holdings of 10-15 ha", "fr": "Recensement 2020 : exploitations de 10 à 15 ha", "it": "Censimento 2020: aziende da 10 a 15 ha"}, "census-farms-size-15-ha-plus": {"es": "Censo 2020: explotaciones de 15 ha o más", "en": "Census 2020: holdings of 15 ha and more", "fr": "Recensement 2020 : exploitations de 15 ha et plus", "it": "Censimento 2020: aziende da 15 ha in su"}, "census-treatments-cereal": {"es": "Censo 2020: tratamientos fitosanitarios en cereales", "en": "Census 2020: plant protection treatments, cereals", "fr": "Recensement 2020 : traitements phytosanitaires, céréales", "it": "Censimento 2020: trattamenti fitosanitari, cereali"}, "census-treatments-vegetables": {"es": "Censo 2020: tratamientos fitosanitarios en hortalizas", "en": "Census 2020: plant protection treatments, vegetables", "fr": "Recensement 2020 : traitements phytosanitaires, légumes", "it": "Censimento 2020: trattamenti fitosanitari, ortaggi"}, "census-treatments-other-crops": {"es": "Censo 2020: tratamientos fitosanitarios en otros cultivos", "en": "Census 2020: plant protection treatments, other crops", "fr": "Recensement 2020 : traitements phytosanitaires, autres cultures", "it": "Censimento 2020: trattamenti fitosanitari, altre colture"}, "census-treatments-farms-cereal": {"es": "Censo 2020: explotaciones que tratan cereales", "en": "Census 2020: farms treating cereals", "fr": "Recensement 2020 : exploitations traitant les céréales", "it": "Censimento 2020: aziende che trattano cereali"}, "census-treatments-farms-vegetables": {"es": "Censo 2020: explotaciones que tratan hortalizas", "en": "Census 2020: farms treating vegetables", "fr": "Recensement 2020 : exploitations traitant les légumes", "it": "Censimento 2020: aziende che trattano ortaggi"}, "census-treatments-farms-other-crops": {"es": "Censo 2020: explotaciones que tratan otros cultivos", "en": "Census 2020: farms treating other crops", "fr": "Recensement 2020 : exploitations traitant d’autres cultures", "it": "Censimento 2020: aziende che trattano altre colture"}, "census-machines-tractors": {"es": "Censo 2020: tractores", "en": "Census 2020: tractors", "fr": "Recensement 2020 : tracteurs", "it": "Censimento 2020: trattori"}, "census-machines-combine-harvesters-cereals": {"es": "Censo 2020: cosechadoras de cereales", "en": "Census 2020: cereal combine harvesters", "fr": "Recensement 2020 : moissonneuses-batteuses", "it": "Censimento 2020: mietitrebbie per cereali"}, "census-machines-field-crop-sprayers": {"es": "Censo 2020: pulverizadores de cultivos extensivos", "en": "Census 2020: field crop sprayers", "fr": "Recensement 2020 : pulvérisateurs de grandes cultures", "it": "Censimento 2020: irroratrici per colture di pieno campo"}, "census-machines-farms-tractors": {"es": "Censo 2020: explotaciones con tractor", "en": "Census 2020: farms using tractors", "fr": "Recensement 2020 : exploitations avec tracteur", "it": "Censimento 2020: aziende con trattore"}, "census-machines-farms-combine-harvesters-cereals": {"es": "Censo 2020: explotaciones con cosechadora de cereales", "en": "Census 2020: farms using cereal combine harvesters", "fr": "Recensement 2020 : exploitations avec moissonneuse-batteuse", "it": "Censimento 2020: aziende con mietitrebbia"}, "census-machines-farms-field-crop-sprayers": {"es": "Censo 2020: explotaciones con pulverizador de cultivos extensivos", "en": "Census 2020: farms using field crop sprayers", "fr": "Recensement 2020 : exploitations avec pulvérisateur", "it": "Censimento 2020: aziende con irroratrice"}, "census-manure-solid-manure": {"es": "Censo 2020: estiércol sólido aplicado", "en": "Census 2020: solid manure applied", "fr": "Recensement 2020 : fumier solide épandu", "it": "Censimento 2020: letame solido distribuito"}, "census-manure-poultry-manure": {"es": "Censo 2020: gallinaza aplicada", "en": "Census 2020: poultry manure applied", "fr": "Recensement 2020 : fumier de volaille épandu", "it": "Censimento 2020: pollina distribuita"}, "census-manure-liquid-manure": {"es": "Censo 2020: purín líquido (estiércol líquido) aplicado", "en": "Census 2020: liquid manure applied", "fr": "Recensement 2020 : lisier liquide épandu", "it": "Censimento 2020: liquame distribuito"}, "census-manure-slurry": {"es": "Censo 2020: purines (slurry) aplicados", "en": "Census 2020: slurry applied", "fr": "Recensement 2020 : lisier (slurry) épandu", "it": "Censimento 2020: slurry distribuito"}, "census-manure-farms-solid-manure": {"es": "Censo 2020: explotaciones que aplican estiércol sólido", "en": "Census 2020: farms using solid manure", "fr": "Recensement 2020 : exploitations utilisant du fumier solide", "it": "Censimento 2020: aziende che usano letame solido"}, "census-manure-farms-poultry-manure": {"es": "Censo 2020: explotaciones que aplican gallinaza", "en": "Census 2020: farms using poultry manure", "fr": "Recensement 2020 : exploitations utilisant du fumier de volaille", "it": "Censimento 2020: aziende che usano pollina"}, "census-manure-farms-liquid-manure": {"es": "Censo 2020: explotaciones que aplican purín líquido", "en": "Census 2020: farms using liquid manure", "fr": "Recensement 2020 : exploitations utilisant du lisier liquide", "it": "Censimento 2020: aziende che usano liquame"}, "census-manure-farms-slurry": {"es": "Censo 2020: explotaciones que aplican slurry", "en": "Census 2020: farms using slurry", "fr": "Recensement 2020 : exploitations utilisant du slurry", "it": "Censimento 2020: aziende che usano slurry"}, "precision-robots": {"es": "Agricultura de precisión: explotaciones con robots o máquinas autónomas", "en": "Precision farming: farms with robots or autonomous machines", "fr": "Agriculture de précision : exploitations avec robots ou machines autonomes", "it": "Agricoltura di precisione: aziende con robot o macchine autonome"}, "precision-gps-sprayers": {"es": "Agricultura de precisión: explotaciones con pulverizador guiado por GPS", "en": "Precision farming: farms with GPS-guided sprayers", "fr": "Agriculture de précision : exploitations avec pulvérisateur guidé par GPS", "it": "Agricoltura di precisione: aziende con irroratrice con GPS"}, "precision-band-sprayers": {"es": "Agricultura de precisión: explotaciones con pulverización en bandas", "en": "Precision farming: farms with band sprayers", "fr": "Agriculture de précision : exploitations avec pulvérisation en bandes", "it": "Agricoltura di precisione: aziende con irrorazione a bande"}, "precision-variable-rate": {"es": "Agricultura de precisión: explotaciones con dosis variable, riego o escarda de precisión", "en": "Precision farming: farms using variable-rate application, precision irrigation or weeding", "fr": "Agriculture de précision : exploitations à dose variable, irrigation ou désherbage de précision", "it": "Agricoltura di precisione: aziende con dose variabile, irrigazione o diserbo di precisione"}, "precision-crop-monitoring": {"es": "Agricultura de precisión: explotaciones con seguimiento preciso del cultivo", "en": "Precision farming: farms with precise crop monitoring", "fr": "Agriculture de précision : exploitations avec suivi précis des cultures", "it": "Agricoltura di precisione: aziende con monitoraggio preciso delle colture"}, "precision-soil-samples": {"es": "Agricultura de precisión: explotaciones con análisis de suelo", "en": "Precision farming: farms with soil samples analysed", "fr": "Agriculture de précision : exploitations avec analyses de sol", "it": "Agricoltura di precisione: aziende con analisi del suolo"}, "precision-software": {"es": "Digital: explotaciones con programas informáticos o aplicaciones móviles", "en": "Digital: farms using software or mobile apps", "fr": "Numérique : exploitations utilisant logiciels ou applications mobiles", "it": "Digitale: aziende che usano software o app"}, "precision-internet": {"es": "Digital: explotaciones con acceso a internet", "en": "Digital: farms with internet access", "fr": "Numérique : exploitations avec accès à internet", "it": "Digitale: aziende con accesso a internet"}};
  function fmt(v, lg, dec) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0, useGrouping: 'always' }); }
  function unitTxt(x, lg) { return x.unit === 'head' ? T[lg].head : x.unit === 'farms' ? T[lg].farms : x.unit === 'pcs' ? T[lg].pcs : x.unit === 'm3' ? 'm³' : x.unit; }
  function val(v, x, lg) { return v == null ? '—' : fmt(v, lg, x.unit === 't/ha' ? 2 : 0) + ' ' + unitTxt(x, lg); }
  function pct(v, lg) { if (v == null || !isFinite(v)) return '—'; return (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function shr(v, lg) { return v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function script(src, have) {
    if (have()) return Promise.resolve();
    return SCR[src] || (SCR[src] = new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ok; document.head.appendChild(s); }));
  }
  function load() { return CACHE || (CACHE = fetch('data/poland-regions/regions.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function rname(id, lg, map) {
    var N = global.DehesaRegionNames && global.DehesaRegionNames.PL, v = N && N[id];
    if (v) { var p = v.split('|'); return p[LX[lg]] || p[0]; }
    for (var i = 0; map && i < map.states.length; i++) if (map.states[i].id === id) return map.states[i].name;
    return id;
  }
  function label(x, lg) {
    var t = T[lg], m = /^crop-(area|yield|harvest)-(.+)$/.exec(x.id);
    if (CL[x.id]) return CL[x.id][lg] + ' (' + unitTxt(x, lg) + ')';
    if (m) return (t.c[m[2]] || m[2]) + ': ' + t.m[m[1]] + ' (' + unitTxt(x, lg) + ')';
    return (t.o[x.id] || x.label) + ' (' + unitTxt(x, lg) + ')';
  }
  function chart(x, lg, MAP) {
    var t = T[lg], Y = x.years, s = ST.reg === 'PL' ? x.national : (x.regions[ST.reg] || []), pts = [], i;
    for (i = 0; i < Y.length; i++) if (s[i] != null) pts.push([Y[i], s[i]]);
    var ids = Object.keys(x.regions).sort(function (a, b) { return rname(a, lg, MAP).localeCompare(rname(b, lg, MAP), LOC[lg]); });
    var opts = [['PL', t.poland]].concat(ids.map(function (k) { return [k, rname(k, lg, MAP)]; }));
    var selr = '<label class="wp-sel"><span>' + esc(t.evoIn) + '</span><select class="di-compare-select ll-reg" aria-label="' + esc(t.evoIn) + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === ST.reg ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
    var head = '<div class="di-info-card-title gb-sub">' + esc(t.evo) + '</div><div class="wd-sels">' + selr + '</div>';
    if (pts.length < 2) return { html: '' };   // censo / encuesta de una sola foto: no hay serie que dibujar
    var W = 560, H = 200, L = 62, R = 14, Tp = 16, B = 24, lo = 1e18, hi = 0, dec = x.unit === 't/ha' ? 1 : 0;
    for (i = 0; i < pts.length; i++) { lo = Math.min(lo, pts[i][1]); hi = Math.max(hi, pts[i][1]); }
    var rg = (hi - lo) || hi * 0.2, raw = rg / 3, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / mag, stp = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
    lo = Math.max(0, Math.floor(lo / stp) * stp); hi = Math.ceil(hi / stp) * stp; if (hi - lo < stp) hi = lo + stp;
    var y0 = Y[0], y1 = Y[Y.length - 1];
    var X = function (y) { return L + (y - y0) / Math.max(1, y1 - y0) * (W - L - R); }, Yy = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); };
    var grid = '', gv;
    for (gv = lo; gv <= hi + 1e-9; gv += stp) grid += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Yy(gv).toFixed(1) + '" y2="' + Yy(gv).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Yy(gv) + 3).toFixed(1) + '" text-anchor="end">' + esc(fmt(gv, lg, stp < 1 ? 1 : dec)) + '</text>';
    for (i = 0; i < Y.length; i++) if (Y[i] % 5 === 0 || i === Y.length - 1) grid += '<text class="wp-tick" x="' + X(Y[i]).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + Y[i] + '</text>';
    var path = '', dots = '';
    for (i = 0; i < pts.length; i++) { path += (i ? 'L' : 'M') + X(pts[i][0]).toFixed(1) + ' ' + Yy(pts[i][1]).toFixed(1); if (i === pts.length - 1) dots += '<circle class="wp-dot wp-dot-t" cx="' + X(pts[i][0]).toFixed(1) + '" cy="' + Yy(pts[i][1]).toFixed(1) + '" r="3.5"/>'; }
    var nm = ST.reg === 'PL' ? t.poland : rname(ST.reg, lg, MAP);
    return { html: head + '<div class="wp-chart gb-chart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t.evo + ' · ' + nm + ' · ' + label(x, lg)) + '">' + grid +
      '<path class="wp-line wp-line-t" d="' + path + '"/>' + dots + '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg></div>', pts: pts, X: X, W: W, name: nm, x: x };
  }
  function bindChart(root, c, lg) {
    var box = root.querySelector('.gb-chart'); if (!box || !c.pts) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross'), t = T[lg];
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, best = 0, bd = 1e9;
      for (var j = 0; j < c.pts.length; j++) { var dd = Math.abs(c.X(c.pts[j][0]) - vx); if (dd < bd) { bd = dd; best = j; } }
      var p = c.pts[best], px = c.X(p[0]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + p[0] + '</b> · ' + esc(c.name) + ' <b>' + val(p[1], c.x, lg) + '</b>';
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  function sel(label, cls, arr, cur) {
    return '<label class="wp-sel"><span>' + esc(label) + '</span><select class="di-compare-select ' + cls + '" aria-label="' + esc(label) + '">' + arr.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
  }
  function mount(el, lg) {
    if (!el) return Promise.resolve(false);
    lg = T[lg] ? lg : 'es';
    return Promise.all([load(), script('js/fr-dept-map.js', function () { return !!global.DIFrDeptMap; }), script('js/region-names.js', function () { return !!global.DehesaRegionNames; })]).then(function (r) {
      var d = r[0], M = global.DIFrDeptMap; if (!d || !d.indicators || !d.indicators.length || !M) { el.hidden = true; return false; }
      var byId = {}; d.indicators.forEach(function (x) { byId[x.id] = x; });
      return M.load('DEHESA_PL_VOIVODESHIPS', 'vendor/pl-voivodeships.js').then(function (MAP) {
        var t = T[lg];
        function draw(focus) {
          if (!byId[ST.c]) ST.c = d.indicators[0].id;
          var x = byId[ST.c], Y = x.years, last = Y.length - 1;
          if (ST.year == null || Y.indexOf(ST.year) < 0) ST.year = Y[last];
          var yi = Y.indexOf(ST.year), vals = {}, prevVals = {}, id, list = [], i;
          for (id in x.regions) if (x.regions.hasOwnProperty(id)) { vals[id] = x.regions[id][yi]; prevVals[id] = yi > 0 ? x.regions[id][yi - 1] : null; }
          for (id in vals) if (vals.hasOwnProperty(id) && vals[id] != null) list.push([id, rname(id, lg, MAP), vals[id], prevVals[id]]);
          var mx = null, mn = null;
          for (i = 0; i < list.length; i++) { if (!mx || list[i][2] > mx[2]) mx = list[i]; if (!mn || list[i][2] < mn[2]) mn = list[i]; }
          var nat = x.national[yi], pv = yi > 0 ? x.national[yi - 1] : null;
          var stat = row(t.natRow + ' · ' + ST.year, nat != null ? '<b>' + val(nat, x, lg) + '</b>' : esc(t.noData)) + (pv && nat ? row(t.vsPrev, pct((nat / pv - 1) * 100, lg) + ' · ' + val(pv, x, lg)) : '') +
            (mx && mn ? row(t.hi, esc(mx[1]) + ' · <b>' + val(mx[2], x, lg) + '</b>' + (x.additive && nat ? ' · ' + shr(mx[2] / nat * 100, lg) : '')) + row(t.lo, esc(mn[1]) + ' · <b>' + val(mn[2], x, lg) + '</b>' + (x.additive && nat ? ' · ' + shr(mn[2] / nat * 100, lg) : '')) : '');
          var groups = ['crops', 'livestock', 'production', 'milk', 'census'], opts = '';
          groups.forEach(function (g) {
            var items = d.indicators.filter(function (z) { return z.group === g; }); if (!items.length) return;
            opts += '<optgroup label="' + esc(t.g[g]) + '">' + items.map(function (z) { return '<option value="' + esc(z.id) + '"' + (z.id === ST.c ? ' selected' : '') + '>' + esc(label(z, lg)) + '</option>'; }).join('') + '</optgroup>';
          });
          var head = '<label class="wp-sel"><span>' + esc(t.meas) + '</span><select class="di-compare-select ll-m" aria-label="' + esc(t.meas) + '">' + opts + '</select></label>' + sel(t.year, 'll-year', Y.slice().reverse().map(function (y) { return [y, String(y)]; }), ST.year);
          var mp = '';
          if (MAP && list.length) {
            var m = M.html(MAP, { values: vals, fmt: function (v, short) { return short ? fmt(v, lg, x.unit === 't/ha' ? 1 : 0) : val(v, x, lg); }, label: t.map + ' · ' + ST.year, none: t.noData });
            mp = '<div class="di-info-card-title gb-sub">' + esc(t.map + ' · ' + ST.year + ' · ' + label(x, lg)) + '</div><div class="wp-readout ll-tip" aria-live="polite">' + esc(t.hoverMap) + '</div>' + m.html;
          }
          var rows = list.slice().sort(function (a, b) { return a[1].localeCompare(b[1], LOC[lg]); });
          var tbl = '<details class="gb-all"><summary>' + esc(t.all) + '</summary><div class="gb-tw"><table class="di-table"><thead><tr><th>' + esc(t.reg) + '</th><th>' + esc(t.val) + '</th>' + (x.additive ? '<th>' + esc(t.share) + '</th>' : '') + '<th>' + esc(t.chg) + '</th></tr></thead><tbody>' +
            rows.map(function (c) { return '<tr><td>' + esc(c[1]) + '</td><td>' + val(c[2], x, lg) + '</td>' + (x.additive ? '<td>' + (nat ? shr(c[2] / nat * 100, lg) : '—') + '</td>' : '') + '<td>' + (c[3] ? pct((c[2] / c[3] - 1) * 100, lg) : '—') + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
          var c = chart(x, lg, MAP);
          var trust = global.DehesaDataTrust ? global.DehesaDataTrust.info({ src: t.srcN, url: d.source.url, fq: 'annual', mk: t.mk, ty: t.ty, ob: t.ob, me: t.note, st: 'official' }, lg) : '';
          el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-regions-pl" style="max-width:none"><div class="di-badge di-badge-green di-info-badge">' + esc(t.badge) + '</div><h2 class="ps-rm-h">' + esc(t.h) + '</h2>' +
            '<div class="wd-sels">' + head + '</div><div class="di-info-stat-list" style="max-width:640px">' + stat + '</div>' + mp + tbl + c.html + trust +
            '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcN) + '</a>. ' + esc(t.cite) + '</p></section>';
          el.hidden = false;
          if (MAP && list.length) M.bind(el, el.querySelector('.ll-tip'), t.hoverMap, function (zid) {
            var v = vals[zid], p = prevVals[zid];
            return '<b>' + esc(rname(zid, lg, MAP)) + '</b> · ' + (v != null ? '<b>' + val(v, x, lg) + '</b>' + (x.additive && nat ? ' · ' + shr(v / nat * 100, lg) : '') + (p ? ' · ' + esc(t.vsPrev) + ' ' + pct((v / p - 1) * 100, lg) : '') : esc(t.noData));
          });
          bindChart(el, c, lg);
          if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
        }
        draw();
        if (!el.getAttribute('data-ll')) {
          el.setAttribute('data-ll', '1');
          el.addEventListener('change', function (ev) {
            var cl = ' ' + (ev.target.className || '') + ' ', v = ev.target.value;
            if (cl.indexOf(' ll-m ') >= 0) { ST.c = v; draw('.ll-m'); }
            else if (cl.indexOf(' ll-year ') >= 0) { ST.year = parseInt(v, 10); draw('.ll-year'); }
            else if (cl.indexOf(' ll-reg ') >= 0) { ST.reg = v; draw('.ll-reg'); }
          });
        }
        return true;
      });
    });
  }
  global.DIRegionsPl = { mount: mount };
})(window);
