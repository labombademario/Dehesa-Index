/* Dehesa Index — respuestas directas del buscador (fase 1). ES5, funciona en el navegador y en Node (pruebas).
   Entiende una pregunta con REGLAS (producto, región, estado de EE. UU., qué se pregunta) y la resuelve leyendo los ficheros de data/.
   No usa ningún modelo ni servidor y NUNCA calcula nada que no esté en los datos: cada cifra sale de una observación publicada,
   con su unidad y moneda originales, su fecha y su fuente. Si no sabe responder, devuelve null y el buscador sigue como siempre.

   DehesaAnswers.answer(query, lang, env) -> Promise<respuesta | null>
     env = { products: [{slug, names:{es,en,fr,it}, kw, u}], tokScore(q, w), provider: { json(rutaRelativaADatos) -> Promise }, href(u), identity? }
   DehesaAnswers.parse(query, lang, env) -> intención (sin leer datos)
   DehesaAnswers.render(respuesta, lang, esc) -> HTML */
(function (root) {
  'use strict';
  var LANGS = ['es', 'en', 'fr', 'it'];

  /* ---------- textos ---------- */
  var T = {
    es: { head: 'Respuesta', price: 'Último dato publicado', since: 'vs dato anterior', y12: 'en 12 meses', noY12: 'sin 12 meses de histórico', date: 'Dato de', src: 'Fuente', open: 'Abrir la ficha', directional: 'Orientativa',
      notComp: 'Cada precio va en la unidad y la moneda de su fuente: no se comparan entre regiones.', none: 'No tenemos ese dato publicado', noneReg: 'No tenemos {p} publicado para {r}.', noneProd: 'Tenemos {p} en: {r}.',
      localHead: 'Precios locales (cash bids)', range: 'Rango entre mercados', markets: 'mercados', on: 'el', localLink: 'Ver todos los mercados', noLocal: 'No hay precios locales publicados de {p} en {s}.', localNoProd: 'Precios locales de grano en {s}',
      localNote: 'Precio al contado de compradores locales; no se calcula una media del estado.', premHead: 'Prima orgánica frente a convencional', prem: 'Orgánico', conv: 'Convencional', premium: 'Prima', sample: 'series', premNote: 'Comparación indicativa entre dos informes USDA (cobertura geográfica distinta); no es un precio oficial.', premNone: 'Todavía no hay datos suficientes para calcular la prima orgánica de {p}.',
      costHead: 'Coste de producción (USDA ERS, EE. UU., media nacional)', costTotal: 'Total de costes listados', perAcre: 'USD por acre sembrado', imputed: 'Imputados (tierra y mano de obra no remunerada)', yld: 'rendimiento', costNote: 'Es una referencia nacional, no el coste de tu explotación. Puedes cargarla en la calculadora.', costLink: 'Abrir la calculadora',
      calHead: 'Calendario de publicaciones', calText: 'Las fechas de los informes oficiales están en el calendario.', calLink: 'Abrir el calendario', countryHead: 'Perfil de país', countryText: 'Producción, comercio, costes y precios de {c}.', countryLink: 'Abrir el perfil', month: 'Datos mensuales', multi: 'Dos productos distintos: pregunta por uno cada vez.' },
    en: { head: 'Answer', price: 'Latest published figure', since: 'vs previous reading', y12: 'over 12 months', noY12: 'less than 12 months of history', date: 'Data from', src: 'Source', open: 'Open the product page', directional: 'Indicative',
      notComp: 'Each price is in the unit and currency of its source: they are not compared across regions.', none: 'We do not have that figure published', noneReg: 'We have no published {p} for {r}.', noneProd: 'We have {p} for: {r}.',
      localHead: 'Local prices (cash bids)', range: 'Range across markets', markets: 'markets', on: 'on', localLink: 'See all markets', noLocal: 'No local prices published for {p} in {s}.', localNoProd: 'Local grain prices in {s}',
      localNote: 'Spot prices from local buyers; no state average is computed.', premHead: 'Organic premium over conventional', prem: 'Organic', conv: 'Conventional', premium: 'Premium', sample: 'series', premNote: 'Indicative comparison between two USDA reports (different geographic coverage); not an official price.', premNone: 'There is not yet enough data to compute the organic premium for {p}.',
      costHead: 'Production cost (USDA ERS, U.S., national average)', costTotal: 'Total costs listed', perAcre: 'USD per planted acre', imputed: 'Imputed (land and unpaid labour)', yld: 'yield', costNote: 'A national reference, not the cost of any particular farm. You can load it in the calculator.', costLink: 'Open the calculator',
      calHead: 'Release calendar', calText: 'The dates of official reports are in the calendar.', calLink: 'Open the calendar', countryHead: 'Country profile', countryText: 'Production, trade, costs and prices for {c}.', countryLink: 'Open the profile', month: 'Monthly data', multi: 'Two different products: ask about one at a time.' },
    fr: { head: 'Réponse', price: 'Dernière donnée publiée', since: 'vs donnée précédente', y12: 'sur 12 mois', noY12: 'moins de 12 mois d’historique', date: 'Donnée :', src: 'Source', open: 'Ouvrir la fiche', directional: 'Indicative',
      notComp: 'Chaque prix est dans l’unité et la devise de sa source : ils ne sont pas comparés entre régions.', none: 'Nous n’avons pas cette donnée', noneReg: 'Nous n’avons pas de {p} publié pour {r}.', noneProd: 'Nous avons {p} pour : {r}.',
      localHead: 'Prix locaux (cash bids)', range: 'Fourchette entre marchés', markets: 'marchés', on: 'le', localLink: 'Voir tous les marchés', noLocal: 'Pas de prix locaux publiés pour {p} en {s}.', localNoProd: 'Prix locaux des grains : {s}',
      localNote: 'Prix comptant d’acheteurs locaux ; aucune moyenne de l’État n’est calculée.', premHead: 'Prime bio par rapport au conventionnel', prem: 'Bio', conv: 'Conventionnel', premium: 'Prime', sample: 'séries', premNote: 'Comparaison indicative entre deux rapports de l’USDA (couverture géographique différente) ; ce n’est pas un prix officiel.', premNone: 'Pas encore assez de données pour calculer la prime bio de {p}.',
      costHead: 'Coût de production (USDA ERS, États-Unis, moyenne nationale)', costTotal: 'Total des coûts listés', perAcre: 'USD par acre semé', imputed: 'Imputés (terre et travail non rémunéré)', yld: 'rendement', costNote: 'Une référence nationale, pas le coût d’une exploitation précise. Vous pouvez la charger dans le calculateur.', costLink: 'Ouvrir le calculateur',
      calHead: 'Calendrier des publications', calText: 'Les dates des rapports officiels sont dans le calendrier.', calLink: 'Ouvrir le calendrier', countryHead: 'Profil de pays', countryText: 'Production, commerce, coûts et prix : {c}.', countryLink: 'Ouvrir le profil', month: 'Données mensuelles', multi: 'Deux produits différents : posez la question pour un seul à la fois.' },
    it: { head: 'Risposta', price: 'Ultimo dato pubblicato', since: 'vs dato precedente', y12: 'in 12 mesi', noY12: 'meno di 12 mesi di storico', date: 'Dato:', src: 'Fonte', open: 'Apri la scheda', directional: 'Indicativa',
      notComp: 'Ogni prezzo è nell’unità e nella valuta della sua fonte: non si confrontano tra regioni.', none: 'Non abbiamo questo dato', noneReg: 'Non abbiamo {p} pubblicato per {r}.', noneProd: 'Abbiamo {p} per: {r}.',
      localHead: 'Prezzi locali (cash bids)', range: 'Intervallo tra mercati', markets: 'mercati', on: 'il', localLink: 'Vedi tutti i mercati', noLocal: 'Nessun prezzo locale pubblicato per {p} in {s}.', localNoProd: 'Prezzi locali dei cereali: {s}',
      localNote: 'Prezzo a pronti di acquirenti locali; nessuna media dello stato viene calcolata.', premHead: 'Premio biologico rispetto al convenzionale', prem: 'Biologico', conv: 'Convenzionale', premium: 'Premio', sample: 'serie', premNote: 'Confronto indicativo tra due rapporti USDA (copertura geografica diversa); non è un prezzo ufficiale.', premNone: 'Non ci sono ancora dati sufficienti per calcolare il premio biologico di {p}.',
      costHead: 'Costo di produzione (USDA ERS, USA, media nazionale)', costTotal: 'Totale dei costi elencati', perAcre: 'USD per acro seminato', imputed: 'Imputati (terra e lavoro non retribuito)', yld: 'resa', costNote: 'Un riferimento nazionale, non il costo di una specifica azienda. Puoi caricarlo nel calcolatore.', costLink: 'Apri il calcolatore',
      calHead: 'Calendario delle pubblicazioni', calText: 'Le date dei rapporti ufficiali sono nel calendario.', calLink: 'Apri il calendario', countryHead: 'Profilo paese', countryText: 'Produzione, commercio, costi e prezzi: {c}.', countryLink: 'Apri il profilo', month: 'Dati mensili', multi: 'Due prodotti diversi: chiedi di uno alla volta.' }
  };
  var REGN = { eu: { es: 'Unión Europea', en: 'European Union', fr: 'Union européenne', it: 'Unione europea' }, us: { es: 'EE. UU.', en: 'United States', fr: 'États-Unis', it: 'Stati Uniti' }, ca: { es: 'Canadá', en: 'Canada', fr: 'Canada', it: 'Canada' }, uk: { es: 'Reino Unido', en: 'United Kingdom', fr: 'Royaume-Uni', it: 'Regno Unito' } };
  var UNIT = { tonelada: 't', bushel: 'bu', cwt: 'cwt', '100kg': '100 kg', kg: 'kg', litro: 'L', mmbtu: 'MMBtu', barril: 'bbl', docena: { es: 'docena', en: 'dozen', fr: 'douzaine', it: 'dozzina' }, lb: 'lb', gal: 'gal', ton_corta: 'short ton', index_2020_100: '2020 = 100' };
  var SRC = { eu_agrifood: 'Comisión Europea · Agri-food Data Portal', usda_nass: 'USDA NASS (Quick Stats)', statcan: 'Statistics Canada', defra: 'DEFRA', eurostat: 'Eurostat', world_bank: 'Banco Mundial', usda_ams_mars: 'USDA AMS', european_commission: 'Comisión Europea', eu_oil_bulletin: 'Boletín Petrolero de la UE', eia: 'U.S. EIA', usda_ers: 'USDA ERS' };

  /* ---------- léxicos (texto normalizado: minúsculas, sin acentos) ---------- */
  var REGION_WORDS = [
    ['eu', ['union europea', 'european union', 'union europeenne', 'unione europea', 'europa', 'europe', 'europea', 'europeo', 'europeenne', 'europeen', 'ue', 'eu', 'ue 27']],
    ['us', ['estados unidos', 'united states', 'etats unis', 'stati uniti', 'ee uu', 'eeuu', 'usa', 'us', 'u s', 'americano', 'estadounidense', 'american', 'americain', 'americana']],
    ['ca', ['canada', 'canadian', 'canadiense', 'canadese', 'canadien']],
    ['uk', ['reino unido', 'united kingdom', 'royaume uni', 'regno unito', 'gran bretana', 'great britain', 'britain', 'british', 'uk', 'britanico']]
  ];
  var COUNTRY_WORDS = [ // país con perfil propio (no es una región de precios)
    ['ES', { es: 'España', en: 'Spain', fr: 'Espagne', it: 'Spagna' }, ['espana', 'spain', 'espagne', 'spagna', 'espanol', 'spanish']], ['FR', { es: 'Francia', en: 'France', fr: 'France', it: 'Francia' }, ['francia', 'france', 'frances', 'french', 'francais']],
    ['DE', { es: 'Alemania', en: 'Germany', fr: 'Allemagne', it: 'Germania' }, ['alemania', 'germany', 'allemagne', 'germania', 'aleman', 'german']], ['PT', { es: 'Portugal', en: 'Portugal', fr: 'Portugal', it: 'Portogallo' }, ['portugal', 'portogallo', 'portugues']],
    ['NL', { es: 'Países Bajos', en: 'Netherlands', fr: 'Pays-Bas', it: 'Paesi Bassi' }, ['paises bajos', 'netherlands', 'pays bas', 'paesi bassi', 'holanda', 'holland']], ['BE', { es: 'Bélgica', en: 'Belgium', fr: 'Belgique', it: 'Belgio' }, ['belgica', 'belgium', 'belgique', 'belgio']],
    ['AT', { es: 'Austria', en: 'Austria', fr: 'Autriche', it: 'Austria' }, ['austria', 'autriche']], ['DK', { es: 'Dinamarca', en: 'Denmark', fr: 'Danemark', it: 'Danimarca' }, ['dinamarca', 'denmark', 'danemark', 'danimarca']],
    ['AU', { es: 'Australia', en: 'Australia', fr: 'Australie', it: 'Australia' }, ['australia', 'australie', 'australiano']], ['IT', { es: 'Italia', en: 'Italy', fr: 'Italie', it: 'Italia' }, ['italia', 'italy', 'italie', 'italiano']]
  ];
  var STATES = [ // [código, [nombres normalizados]]
    ['AR', ['arkansas']], ['CA', ['california']], ['CO', ['colorado']], ['IA', ['iowa']], ['IL', ['illinois']], ['IN', ['indiana']], ['KS', ['kansas']], ['KY', ['kentucky']], ['MD', ['maryland']], ['MN', ['minnesota']], ['MO', ['missouri']], ['MS', ['mississippi']],
    ['MT', ['montana']], ['NC', ['carolina del norte', 'north carolina', 'caroline du nord', 'carolina del nord']], ['ND', ['dakota del norte', 'north dakota', 'dakota du nord', 'dakota del nord']], ['NE', ['nebraska']], ['OH', ['ohio']], ['OK', ['oklahoma']],
    ['PA', ['pensilvania', 'pennsylvania', 'pennsylvanie', 'pennsylvania']], ['SC', ['carolina del sur', 'south carolina', 'caroline du sud', 'carolina del sud']], ['SD', ['dakota del sur', 'south dakota', 'dakota du sud', 'dakota del sud']], ['TN', ['tennessee']], ['TX', ['texas']], ['VA', ['virginia']], ['WY', ['wyoming']]
  ];
  var STATE_NAME = { AR: 'Arkansas', CA: 'California', CO: 'Colorado', IA: 'Iowa', IL: 'Illinois', IN: 'Indiana', KS: 'Kansas', KY: 'Kentucky', MD: 'Maryland', MN: 'Minnesota', MO: 'Missouri', MS: 'Mississippi', MT: 'Montana', NC: 'North Carolina', ND: 'North Dakota', NE: 'Nebraska', OH: 'Ohio', OK: 'Oklahoma', PA: 'Pennsylvania', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', VA: 'Virginia', WY: 'Wyoming' };
  var CASH = { maiz: 'corn', soja_grano: 'soybeans', trigo: 'wheat', sorgo: 'sorghum', cebada: 'barley', avena: 'oats' };
  var CASH_NAME = { corn: { es: 'maíz', en: 'corn', fr: 'maïs', it: 'mais' }, soybeans: { es: 'soja', en: 'soybeans', fr: 'soja', it: 'soia' }, wheat: { es: 'trigo', en: 'wheat', fr: 'blé', it: 'frumento' }, sorghum: { es: 'sorgo', en: 'sorghum', fr: 'sorgho', it: 'sorgo' }, barley: { es: 'cebada', en: 'barley', fr: 'orge', it: 'orzo' }, oats: { es: 'avena', en: 'oats', fr: 'avoine', it: 'avena' } };
  var ERS = { maiz: 'maiz', soja_grano: 'soja', trigo: 'trigo', cebada: 'cebada', avena: 'avena' };
  var PREM = { maiz: ['corn-yellow'], soja_grano: ['soybeans'], trigo: ['wheat-hrw', 'wheat-srw'] };
  var KIND_WORDS = {
    change: 'subido sube subir subida sube bajado baja bajar bajada caido caida cae variacion variaciones cambio cambios evolucion evoluciono tendencia rose rise risen rising rises up down fell fall falling drop dropped change changes changed trend moved movement evolution gain gained loss lost augmente augmenter baisse baisser hausse variation variations tendance evolue evolution monte descendu aumentato aumento aumentare sceso scendere salito salita calo variazione variazioni cambiamento tendenza ano anos year years annee annees anno anni mes meses month months mois mese mesi semana semanas week weeks ytd',
    premium: 'organico organicos organica organic organique organiques biologico biologici bio premium prima primas',
    cost: 'coste costes costo costos costi costs cout couts',
    calendar: 'cuando sale salen publica publican publicacion publicaciones calendario informe informes wasde release releases publie publient quand uscita esce calendrier calendar report reports'
  };
  var FILLER = 'an ans locales local locali locaux perfil perfiles profile profil profilo does do did sur sul sulla sullo nel nella nello negli dans au aux pour avec con per at from durante en el sobre hace precio precios price prices prix prezzo prezzi cuanto cuesta cuestan vale valen costar cost costa combien coute quanto how much is are what whats the cual cuales que quel quelle quali che es son hoy actual actuales ultimo ultima ultimos ultimas reciente recientes latest current now today aujourd hui dernier derniere derniers attuale oggi dato datos data dame dime muestrame muestra show me tell give donne dimmi mostrami ahora del de la el los las en of in for por para al y and et e le les du des di il lo da un una un l a to el cuando sale when what\'s del sobre about on a ver vs versus frente contra entre between con with compara comparar compare comparer confronta confronto'.split(' ');

  var PW = toSet0('producir produccion production producing produce produire produrre produzione produrre growing cultivar');
  function toSet0(s) { var o = {}; s.split(' ').forEach(function (w) { if (w) o[w] = 1; }); return o; }
  function toSet(s) { var o = {}; s.split(' ').forEach(function (w) { if (w) o[w] = 1; }); return o; }
  var KW = {}; Object.keys(KIND_WORDS).forEach(function (k) { KW[k] = toSet(KIND_WORDS[k]); });
  var FILL = {}; FILLER.forEach(function (w) { if (w) FILL[w] = 1; });

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function toks(s) { var n = norm(s); return n ? n.split(' ') : []; }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; }); }
  function tx(lang) { return T[lang] || T.es; }

  /* ---------- formato ---------- */
  function nf(v, lang, d) { try { return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function numFmt(v, lang) { var a = Math.abs(v); return nf(v, lang, a >= 1000 ? 0 : a >= 100 ? 1 : 2); }
  function pct(v, lang) { return (v > 0.0001 ? '+' : v < -0.0001 ? '−' : '') + nf(Math.abs(v), lang, 1) + ' %'; }
  function dateTxt(s, lang) {
    var p = String(s || '').split('-'); if (p.length < 2) return String(s || '');
    try { return new Date(Date.UTC(+p[0], +p[1] - 1, p[2] ? +p[2] : 1)).toLocaleDateString(lang, p[2] ? { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' } : { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return s; }
  }
  function unitTxt(u, lang) { var x = UNIT[u]; if (x && typeof x === 'object') return x[lang] || x.es; return x || u; }
  function money(v, cur, lang, d) { var s = nf(v, lang, d === undefined ? 2 : d); return cur === 'USD' ? '$' + s : cur === 'EUR' ? s + ' €' : s + ' ' + cur; }

  /* ---------- análisis de la pregunta ---------- */
  function takePhrases(n, table, lenientCodes) {
    var found = [];
    table.forEach(function (row) {
      var code = row[0], words = row[row.length - 1];
      words.slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (w) {
        var re = ' ' + w + ' ';
        if (n.indexOf(re) >= 0) { if (found.indexOf(code) < 0) found.push(code); n = n.split(re).join(' '); }
      });
    });
    return { n: n, found: found };
  }
  function bestProduct(pt, env) {
    var best = null;
    (env.products || []).forEach(function (p) {
      if (!p._w) { p._w = []; LANGS.forEach(function (l) { p._w = p._w.concat(toks(p.names[l])); }); p._w = p._w.concat(toks(p.kw || '')); p._t = {}; LANGS.forEach(function (l) { p._t[l] = toks(p.names[l]).length; }); }
      var tot = 0, ok = true;
      for (var i = 0; i < pt.length; i++) {
        var b = 0; for (var j = 0; j < p._w.length; j++) { var s = env.tokScore(pt[i], p._w[j]); if (s > b) b = s; if (b === 1) break; }
        if (b < 0.6) { ok = false; break; } tot += b;
      }
      if (!ok) return;
      var sc = tot / pt.length - Math.min(p._t.es + p._t.en, 12) / 200;
      if (!best || sc > best.sc) best = { p: p, sc: sc };
    });
    return best && best.sc >= 0.55 ? best.p : null;
  }
  function parse(query, lang, env) {
    var raw = String(query || ''), n = ' ' + norm(raw) + ' ';
    if (n.trim().length < 2) return null;
    var states = [], m;
    var up = raw.match(/\b[A-Z]{2}\b/g) || [];
    up.forEach(function (c) { if (STATE_NAME[c] && c !== 'CA' && c !== 'IN' && c !== 'OK' && c !== 'US' && c !== 'EU' && c !== 'UK') n = n.split(' ' + c.toLowerCase() + ' ').join(' '); });
    up.forEach(function (c) { if (c !== 'CA' && c !== 'IN' && c !== 'OK' && c !== 'US' && c !== 'EU' && c !== 'UK' && STATE_NAME[c] && states.indexOf(c) < 0) states.push(c); });
    m = takePhrases(n, STATES); n = m.n; m.found.forEach(function (c) { if (states.indexOf(c) < 0) states.push(c); });
    m = takePhrases(n, REGION_WORDS); n = m.n; var regions = m.found;
    var cm = takePhrases(n, COUNTRY_WORDS.map(function (c) { return [c[0], c[2]]; })); n = cm.n; var countries = cm.found;
    var words = n.trim() ? n.trim().split(' ') : [], kinds = {}, rest = [], prodW = false, weakCost = false;
    words.forEach(function (w) {
      if (PW[w]) { prodW = true; return; }
      if (w === 'cost' || w === 'costa') weakCost = true;
      var hit = false; Object.keys(KW).forEach(function (k) { if (KW[k][w]) { kinds[k] = 1; hit = true; } });
      if (hit || FILL[w] || /^\d+$/.test(w) || w.length < 2) return;
      rest.push(w);
    });
    if (weakCost && prodW) kinds.cost = 1;
    var product = rest.length ? bestProduct(rest, env) : null;
    if (rest.length && !product) return null; // palabras que no entendemos: mejor no responder
    var kind = null;
    if (states.length) kind = 'local';
    else if (kinds.premium && product && PREM[product.slug]) kind = 'premium';
    else if (kinds.cost && product && ERS[product.slug]) kind = 'cost';
    else if (kinds.calendar && !product) kind = 'calendar';
    else if (product && kinds.change) kind = 'change';
    else if (product) kind = 'price';
    else if (countries.length && !regions.length) kind = 'country';
    else if (kinds.calendar) kind = 'calendar';
    if (!kind) return null;
    if (kind === 'price' && countries.length && !regions.length) kind = 'country';
    return { kind: kind, product: product, regions: regions, states: states, countries: countries };
  }

  /* ---------- lectura de datos ---------- */
  function J(env, p) { return env.provider.json(p).catch(function () { return null; }); }
  function obsFor(env, slug, regions) {
    var rs = regions && regions.length ? regions : ['eu', 'us', 'ca', 'uk'];
    return Promise.all(rs.map(function (r) { return J(env, 'prices/latest/' + r + '.json'); })).then(function (docs) {
      var out = []; docs.forEach(function (d) { (d && d.observations || []).forEach(function (o) { if (o.product === slug) out.push(o); }); });
      return out;
    });
  }
  function identityLine(env, o, lang) {
    var I = root.DIIdentity; if (!I || !env.identityData) return '';
    try { I.data(env.identityData); var e = I.get(o.id); return e ? I.line(e, lang) : ''; } catch (e) { return ''; }
  }
  var MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
  function histDate(h) {
    var p = String(h.period), mo, d = 1;
    if (MONTHS[p]) mo = MONTHS[p]; else if (/^\d{1,2}-\d{1,2}$/.test(p)) { mo = +p.split('-')[0]; d = +p.split('-')[1]; } else if (/^\d{1,2}$/.test(p)) mo = +p; else return null;
    return Date.UTC(h.year, mo - 1, d);
  }
  function yoy(hist, o) { // variación a 12 meses SOLO si existe un dato del año anterior (±21 días); nada se interpola
    var pts = (hist && hist.history || []).map(function (h) { return { t: histDate(h), v: h.value }; }).filter(function (x) { return x.t && typeof x.v === 'number'; });
    if (!pts.length) return null;
    var last = pts[pts.length - 1], target = last.t - 365 * 86400000, best = null;
    pts.forEach(function (x) { var dd = Math.abs(x.t - target); if (dd <= 21 * 86400000 && (!best || dd < best.dd)) best = { dd: dd, v: x.v }; });
    if (!best || !best.v) return null;
    if (o && typeof o.value === 'number' && Math.abs(last.v - o.value) > Math.abs(o.value) * 0.001 + 1e-9) return null; // el histórico no cuadra con el último dato: no se calcula
    return (last.v / best.v - 1) * 100;
  }
  function card(env, o, lang, withY12) {
    var t = tx(lang), idl = identityLine(env, o, lang);
    var c = { region: o.region, regionName: REGN[o.region] ? REGN[o.region][lang] : o.region, ident: idl, value: o.value, valueTxt: unitCurrency(o, lang), date: o.observationDate, dateTxt: dateTxt(o.observationDate, lang), changePct: typeof o.changePct === 'number' ? o.changePct : null,
      directional: o.comparability === 'directional', source: SRC[o.sourceId] || o.sourceId, href: env.href('producto.html?p=' + encodeURIComponent(o.product)), y12: null, y12Known: false, id: o.id, product: o.product };
    return c;
  }
  function unitCurrency(o, lang) {
    if (o.unit === 'index_2020_100') return numFmt(o.value, lang) + ' (2020 = 100)';
    return numFmt(o.value, lang) + ' ' + o.currency + '/' + unitTxt(o.unit, lang);
  }
  function pname(p, lang) { return p.names[lang] || p.names.es; }

  /* ---------- resolutores ---------- */
  function rPrice(intent, lang, env, wantY12) {
    var t = tx(lang), slug = intent.product.slug, pn = pname(intent.product, lang);
    return obsFor(env, slug, intent.regions).then(function (obs) {
      if (!obs.length) {
        if (intent.regions.length) return obsFor(env, slug, null).then(function (all) {
          var where = all.map(function (o) { return REGN[o.region][lang]; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ');
          return { kind: 'price', heading: pn, cards: [], notes: [fmt(t.noneReg, { p: pn, r: intent.regions.map(function (r) { return REGN[r][lang]; }).join(', ') }) + (where ? ' ' + fmt(t.noneProd, { p: pn, r: where }) : '')], link: { href: env.href('producto.html?p=' + encodeURIComponent(slug)), label: t.open } };
        });
        return { kind: 'price', heading: pn, cards: [], notes: [t.none + ': ' + pn + '.'], link: null };
      }
      return J(env, 'instrument-identity.json').then(function (d) { env.identityData = d; }).then(function () {
        var cards = obs.map(function (o) { return card(env, o, lang); });
        var done = Promise.resolve();
        if (wantY12) done = Promise.all(obs.map(function (o, i) { return J(env, 'prices/history/' + o.region + '/' + o.product + '.json').then(function (h) { var y = yoy(h, o); cards[i].y12 = y; cards[i].y12Known = y !== null; }); }));
        return done.then(function () {
          return { kind: wantY12 ? 'change' : 'price', heading: pn, cards: cards, notes: cards.length > 1 ? [t.notComp] : [], link: { href: env.href('producto.html?p=' + encodeURIComponent(slug)), label: t.open }, y12: !!wantY12 };
        });
      });
    });
  }
  function rLocal(intent, lang, env) {
    var t = tx(lang), st = intent.states[0], sn = STATE_NAME[st], slug = intent.product && intent.product.slug, com = slug && CASH[slug];
    var base = 'precios-locales.html?s=' + st + (com ? '&c=' + com : '');
    if (!intent.product) return Promise.resolve({ kind: 'local', heading: fmt(t.localNoProd, { s: sn }), cards: [], notes: [], link: { href: env.href('precios-locales.html?s=' + st), label: t.localLink } });
    var pn = pname(intent.product, lang);
    if (!com) return Promise.resolve({ kind: 'local', heading: t.localHead, cards: [], notes: [fmt(t.noLocal, { p: pn, s: sn })], link: { href: env.href('precios-locales.html?s=' + st), label: t.localLink } });
    return J(env, 'us-cash-bids/' + st + '/' + com + '.json').then(function (d) {
      if (!d || !d.series || !d.series.length) return { kind: 'local', heading: t.localHead, cards: [], notes: [fmt(t.noLocal, { p: pn, s: sn })], link: { href: env.href('precios-locales.html?s=' + st), label: t.localLink } };
      var latest = d.series.reduce(function (m, s) { return s.date && s.date > m ? s.date : m; }, '');
      var cur = d.series.filter(function (s) { return s.date === latest && typeof s.avg === 'number'; });
      // misma especificación: la más frecuente (clase, grado, comprador); no se mezclan especificaciones distintas
      var cnt = {}; cur.forEach(function (s) { var k = [s.commodityClass, s.grade, s.deliveryPoint, s.unit].join('|'); cnt[k] = (cnt[k] || 0) + 1; });
      var key = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
      var grp = cur.filter(function (s) { return [s.commodityClass, s.grade, s.deliveryPoint, s.unit].join('|') === key; });
      if (!grp.length) return { kind: 'local', heading: t.localHead, cards: [], notes: [fmt(t.noLocal, { p: pn, s: sn })], link: { href: env.href(base), label: t.localLink } };
      var avgs = grp.map(function (s) { return s.avg; }), lo = Math.min.apply(null, avgs), hi = Math.max.apply(null, avgs), s0 = grp[0];
      var spec = [s0.commodityClass, s0.grade, s0.deliveryPoint].filter(Boolean).join(' · ');
      return { kind: 'local', heading: sn + ' · ' + (CASH_NAME[com] ? CASH_NAME[com][lang] : com), cards: [{ localRange: true, lo: lo, hi: hi, n: grp.length, cur: s0.currency, unit: s0.unit, date: latest, dateTxt: dateTxt(latest, lang), spec: spec, loTxt: money(lo, s0.currency, lang), hiTxt: money(hi, s0.currency, lang), unitTxt: unitTxt(s0.unit, lang), source: SRC.usda_ams_mars, href: env.href(base) }],
        notes: [t.localNote], link: { href: env.href(base), label: t.localLink } };
    });
  }
  function rPremium(intent, lang, env) {
    var t = tx(lang), pn = pname(intent.product, lang);
    return J(env, 'premium-tracker.json').then(function (d) {
      var ids = PREM[intent.product.slug], cells = d && d.cells ? d.cells.filter(function (c) { return ids.indexOf(c.id) >= 0; }) : [];
      var link = { href: env.href('producto.html?p=' + encodeURIComponent(intent.product.slug)), label: t.open };
      if (!cells.length) return { kind: 'premium', heading: t.premHead, cards: [], notes: [fmt(t.premNone, { p: pn })], link: link };
      var cards = [], notes = [];
      cells.forEach(function (c) {
        if (c.premium === null) { notes.push(fmt(t.premNone, { p: pn + (c['class'] ? ' ' + c['class'] : '') })); return; }
        cards.push({ premium: true, name: pn + (c['class'] ? ' · ' + c['class'] : ''), orgTxt: money(c.organic.median, 'USD', lang) + '/' + unitTxt(c.unit === 'bu' ? 'bushel' : c.unit, lang), convTxt: money(c.conventional.median, 'USD', lang) + '/' + unitTxt(c.unit === 'bu' ? 'bushel' : c.unit, lang), diffTxt: (c.premium >= 0 ? '+' : '−') + money(Math.abs(c.premium), 'USD', lang), pctTxt: pct(c.premiumPct, lang), nOrg: c.organic.n, nConv: c.conventional.n, dateTxt: dateTxt(c.date, lang), source: SRC.usda_ams_mars, href: link.href });
      });
      notes.unshift(t.premNote);
      return { kind: 'premium', heading: t.premHead, cards: cards, notes: notes, link: link };
    });
  }
  function rCost(intent, lang, env) {
    var t = tx(lang), pn = pname(intent.product, lang);
    return J(env, 'ers-cost-reference.json').then(function (d) {
      var c = d && d.crops && d.crops[ERS[intent.product.slug]];
      if (!c) return null;
      return { kind: 'cost', heading: t.costHead, cards: [{ cost: true, name: pn, year: c.year, totalTxt: '$' + nf(c.totalCostsListed, lang, 0), unitTxt: t.perAcre, imputedTxt: '$' + nf(c.imputed, lang, 0), yieldTxt: c.yieldBuPerAcre ? nf(c.yieldBuPerAcre, lang, 0) + ' bu/ac' : null, source: SRC.usda_ers, href: env.href('calculadora.html') }],
        notes: [t.costNote], link: { href: env.href('calculadora.html'), label: t.costLink } };
    });
  }
  function rCalendar(intent, lang, env) { var t = tx(lang); return Promise.resolve({ kind: 'calendar', heading: t.calHead, cards: [], notes: [t.calText], link: { href: env.href('calendario.html'), label: t.calLink } }); }
  function rCountry(intent, lang, env) {
    var t = tx(lang), cc = intent.countries[0], row = COUNTRY_WORDS.filter(function (c) { return c[0] === cc; })[0], name = row[1][lang];
    return Promise.resolve({ kind: 'country', heading: t.countryHead + ' · ' + name, cards: [], notes: [fmt(t.countryText, { c: name })], link: { href: env.href('paises.html?c=' + cc), label: t.countryLink } });
  }

  function answer(query, lang, env) {
    lang = LANGS.indexOf(lang) >= 0 ? lang : 'es';
    var intent; try { intent = parse(query, lang, env); } catch (e) { return Promise.resolve(null); }
    if (!intent) return Promise.resolve(null);
    var p;
    switch (intent.kind) {
      case 'price': p = rPrice(intent, lang, env, false); break;
      case 'change': p = rPrice(intent, lang, env, true); break;
      case 'local': p = rLocal(intent, lang, env); break;
      case 'premium': p = rPremium(intent, lang, env); break;
      case 'cost': p = rCost(intent, lang, env); break;
      case 'calendar': p = rCalendar(intent, lang, env); break;
      case 'country': p = rCountry(intent, lang, env); break;
      default: p = Promise.resolve(null);
    }
    return p.then(function (a) { if (a) a.intent = { kind: intent.kind, product: intent.product && intent.product.slug, regions: intent.regions, states: intent.states, countries: intent.countries }; return a; }, function () { return null; });
  }

  /* ---------- HTML ---------- */
  function render(a, lang, esc) {
    if (!a) return '';
    var t = tx(lang), h = '<div class="ds-ans" role="region" aria-label="' + esc(t.head) + '"><div class="ds-ans-h">' + esc(a.heading || t.head) + '</div>';
    (a.cards || []).forEach(function (c) {
      if (c.localRange) {
        h += '<a class="ds-card" href="' + esc(c.href) + '"><div class="ds-c-v">' + esc(c.loTxt) + ' — ' + esc(c.hiTxt) + '<small>/' + esc(c.unitTxt) + '</small></div><div class="ds-c-s">' + esc(t.range) + ' · ' + c.n + ' ' + esc(t.markets) + ' ' + esc(t.on) + ' ' + esc(c.dateTxt) + '</div><div class="ds-c-s">' + esc(c.spec) + ' · ' + esc(t.src) + ': ' + esc(c.source) + '</div></a>';
      } else if (c.premium) {
        h += '<a class="ds-card" href="' + esc(c.href) + '"><div class="ds-c-r">' + esc(c.name) + '</div><div class="ds-c-v">' + esc(c.pctTxt) + ' <small>' + esc(t.premium) + ' (' + esc(c.diffTxt) + ')</small></div><div class="ds-c-s">' + esc(t.prem) + ' ' + esc(c.orgTxt) + ' (' + c.nOrg + ' ' + esc(t.sample) + ') · ' + esc(t.conv) + ' ' + esc(c.convTxt) + ' (' + c.nConv + ')</div><div class="ds-c-s">' + esc(t.date) + ' ' + esc(c.dateTxt) + ' · ' + esc(t.src) + ': ' + esc(c.source) + '</div></a>';
      } else if (c.cost) {
        h += '<a class="ds-card" href="' + esc(c.href) + '"><div class="ds-c-r">' + esc(c.name) + ' · ' + c.year + '</div><div class="ds-c-v">' + esc(c.totalTxt) + ' <small>' + esc(c.unitTxt) + '</small></div><div class="ds-c-s">' + esc(t.costTotal) + ' · ' + esc(t.imputed) + ': ' + esc(c.imputedTxt) + (c.yieldTxt ? ' · ' + esc(t.yld) + ' ' + esc(c.yieldTxt) : '') + '</div><div class="ds-c-s">' + esc(t.src) + ': ' + esc(c.source) + '</div></a>';
      } else {
        var ch = c.changePct === null ? '' : ' <span class="ds-chg ' + (c.changePct > 0 ? 'up' : c.changePct < 0 ? 'dn' : '') + '">' + esc(pct(c.changePct, lang)) + '</span> <span class="ds-c-s2">' + esc(t.since) + '</span>';
        var y = a.y12 ? '<div class="ds-c-s">' + (c.y12Known ? '<span class="ds-chg ' + (c.y12 > 0 ? 'up' : c.y12 < 0 ? 'dn' : '') + '">' + esc(pct(c.y12, lang)) + '</span> ' + esc(t.y12) : esc(t.noY12)) + '</div>' : '';
        h += '<a class="ds-card" href="' + esc(c.href) + '"><div class="ds-c-r">' + esc(c.regionName) + (c.directional ? ' <em>' + esc(t.directional) + '</em>' : '') + '</div>' + (c.ident ? '<div class="ds-c-id">' + esc(c.ident) + '</div>' : '') + '<div class="ds-c-v">' + esc(c.valueTxt) + ch + '</div>' + y + '<div class="ds-c-s">' + esc(t.date) + ' ' + esc(c.dateTxt) + ' · ' + esc(t.src) + ': ' + esc(c.source) + '</div></a>';
      }
    });
    (a.notes || []).forEach(function (n) { h += '<div class="ds-ans-n">' + esc(n) + '</div>'; });
    if (a.link) h += '<a class="ds-ans-l" href="' + esc(a.link.href) + '">' + esc(a.link.label) + ' →</a>';
    return h + '</div>';
  }

  var API = { answer: answer, parse: parse, render: render, _norm: norm, _yoy: yoy };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.DehesaAnswers = API;
})(typeof window !== 'undefined' ? window : globalThis);
