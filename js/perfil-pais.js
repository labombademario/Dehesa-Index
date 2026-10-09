/* Perfil de país: resumen de lo que tenemos de cada país (indicadores clave, categorías de datos, socios comerciales, cobertura).
   ES5, sin librerías. Uso: DIProfile.html(cc, country, ctx) devuelve el HTML; ctx = { lang, t, groups, esc, nf, dec, plabel }. */
(function () {
  var NOTRADE = { es: 'Todavía no hay cifras de comercio exterior de este país en Dehesa Index.', en: 'Dehesa Index does not show foreign-trade figures for this country yet.', fr: 'Dehesa Index n’affiche pas encore de chiffres de commerce extérieur pour ce pays.', it: 'Dehesa Index non mostra ancora cifre del commercio estero per questo paese.' };
  var FLAG = { US: '🇺🇸', EU: '🇪🇺', ES: '🇪🇸', FR: '🇫🇷', DE: '🇩🇪', BE: '🇧🇪', AT: '🇦🇹', PT: '🇵🇹', IT: '🇮🇹', DK: '🇩🇰', NL: '🇳🇱', CA: '🇨🇦', AU: '🇦🇺' };
  var T = {
    es: { overview: 'Perfil del país', kpi: 'Indicadores clave', explore: 'Qué puedes explorar', go: 'Explorar', series: 'series', last: 'Último dato', dest: 'Principales destinos', orig: 'Principales orígenes', trade: 'Comercio agroalimentario', from: 'Datos desde', to: 'hasta', sources: 'Fuentes', cover: 'Cobertura', exploreTitle: 'Explorar los datos de', examples: 'Por ejemplo', freq: 'Frecuencias', total: 'series en', cats: 'categorías', yr: 'último año completo', since: 'desde', hint: 'Elige una categoría para filtrar el explorador de abajo.' },
    en: { overview: 'Country profile', kpi: 'Key indicators', explore: 'What you can explore', go: 'Explore', series: 'series', last: 'Latest', dest: 'Main destinations', orig: 'Main origins', trade: 'Agri-food trade', from: 'Data from', to: 'to', sources: 'Sources', cover: 'Coverage', exploreTitle: 'Explore the data for', examples: 'For example', freq: 'Frequencies', total: 'series in', cats: 'categories', yr: 'latest full year', since: 'since', hint: 'Pick a category to filter the explorer below.' },
    fr: { overview: 'Profil du pays', kpi: 'Indicateurs clés', explore: 'Ce que vous pouvez explorer', go: 'Explorer', series: 'séries', last: 'Dernière donnée', dest: 'Principales destinations', orig: 'Principales origines', trade: 'Commerce agroalimentaire', from: 'Données depuis', to: 'jusqu’à', sources: 'Sources', cover: 'Couverture', exploreTitle: 'Explorer les données :', examples: 'Par exemple', freq: 'Fréquences', total: 'séries dans', cats: 'catégories', yr: 'dernière année complète', since: 'depuis', hint: 'Choisissez une catégorie pour filtrer l’explorateur ci-dessous.' },
    it: { overview: 'Profilo del paese', kpi: 'Indicatori chiave', explore: 'Cosa puoi esplorare', go: 'Esplora', series: 'serie', last: 'Ultimo dato', dest: 'Principali destinazioni', orig: 'Principali origini', trade: 'Commercio agroalimentare', from: 'Dati dal', to: 'al', sources: 'Fonti', cover: 'Copertura', exploreTitle: 'Esplora i dati di', examples: 'Ad esempio', freq: 'Frequenze', total: 'serie in', cats: 'categorie', yr: 'ultimo anno completo', since: 'dal', hint: 'Scegli una categoria per filtrare l’esploratore qui sotto.' }
  };
  var KPI_ORDER = ['prices', 'quotes', 'milk', 'prices_lv', 'livestock', 'production', 'crops', 'trade', 'idx_perc', 'income', 'stocks', 'costs'];
  var KEY = /exports?: agri|total|milk|leche|lait|cattle|bovine|beef|wheat|cereal|all goods|agri-food|general|pig|hog/i;
  // series con puntos (paises.html) o solo metadatos del catalogo (perfiles.html: n, first)
  function TL(x, label) { return window.DIClear ? window.DIClear.tl(label, x.lang) : label; }
  function SHR(x, id) { return window.DIClear ? window.DIClear.share(id, x.lang, x.esc) : ''; }
  function HP(x, k) { return window.DIClear ? window.DIClear.help(k, x.lang, x.esc) : ''; }
  function plen(s) { return s.points ? s.points.length : (s.n || 0); }
  function pfirst(s) { return s.points ? s.points[0][0] : s.first; }
  function yearOf(p) { return parseInt(String(p).slice(0, 4), 10) || 0; }
  function score(s) { return yearOf(s.latestPeriod) * 1000 + Math.min(plen(s), 500) + (KEY.test(s.label) ? 5000 : 0) + (/^Exports?:? .*(agri-food|farm, fishing)/i.test(s.label) ? 8000 : 0) - (s.changePct == null ? 300 : 0); }
  // KPI elegidos a mano por país (expresiones sobre el id de la serie; se toma la de mayor puntuación que case).
  var PICKS = {
    US: ['^us-nass-corn-grain-production-m', '^us-nass-soybeans-production-m', '^us-nass-cattle-incl-calves-inventory-', '^us-nass-milk-production-m', '^us-nass-farm-sector-prices-paid-index', '^us-policy-rate$'],
    EU: ['^eu-policy-rate$'],
    ES: ['^es-perc-leche-vaca$', '^es-perc-trigo$', '^es-perc-aceite$', '^es-perc-(cerdo|porcino)', '^eu-es-trade-exp-agrifood$', '^eu-es-trade-bal-agrifood$'],
    FR: ['^fr-meat-porc-e$', '^fr-cot-soft-wheat-rouen-fcw-1-fob$', '^fr-meat-(jeune|vache|gros|bovin|jb)', '^eu-fr-trade-exp-agrifood$', '^eu-fr-trade-bal-agrifood$'],
    DE: ['^de-milk-abhof-std-bayern-konventionell$', '^de-.*(schwein|pig|hog)', '^de-.*(cattle|rind|bovine)', '^eu-de-trade-exp-agrifood$', '^eu-de-trade-bal-agrifood$'],
    BE: ['^be-out-cereals$', '^be-.*(pig|hog)', '^be-.*(milk|dairy)', '^eu-be-trade-exp-agrifood$', '^eu-be-trade-bal-agrifood$'],
    AT: ['^at-milk-D1110D$', '^at-milk-D7121$', '^at-milk-D6000$', '^eu-at-trade-exp-agrifood$', '^eu-at-trade-bal-agrifood$'],
    PT: ['^pt-es-milk-D1110D$', '^eu-pt-trade-exp-olive-oil$', '^eu-pt-trade-exp-agrifood$', '^eu-pt-trade-bal-agrifood$'],
    IT: ['^it-es-crop-c1120-production$', '^it-es-crop-w1100-production$', '^it-es-herd-a2000-m05_m06$', '^it-es-milk-a-d1110d$', '^eu-it-trade-exp-agrifood$', '^eu-it-trade-bal-agrifood$'],
    DK: ['^dk-milk-prod$', '^dk-pig-slaught$', '^dk-cattle-prod$', '^eu-dk-trade-exp-agrifood$', '^eu-dk-trade-bal-agrifood$'],
    NL: ['^nl-milk-supply$', '^eu-nl-trade-exp-agrifood$', '^eu-nl-trade-imp-agrifood$', '^eu-nl-trade-bal-agrifood$'],
    CA: ['^ca-policy-rate$', '^ca-fppi-total-index$', '^ca-milk-fluid-purposes$', '^ca-fppi-cattle-and-calves$', '^ca-fppi-hogs$', '^ca-fppi-grains$'],
    AU: ['^au-policy-rate$', '^au-exp-agrifood$', '^au-exp-beef$', '^au-exp-wheat$', '^au-exp-milk$', '^au-xpi-cereals$', '^au-bal-agrifood$']
  };
  function picked(cc, S) {
    var out = [], ids = {};
    (PICKS[cc] || []).forEach(function (re) {
      var r = new RegExp(re), m = S.filter(function (s) { return r.test(s.id) && plen(s) >= 6 && !ids[s.id]; }).sort(function (a, b) { return score(b) - score(a); })[0];
      if (m) { out.push(m); ids[m.id] = 1; }
    });
    return out;
  }
  /* El resumen en lenguaje claro es texto nuestro sobre cifras publicadas: cita las fuentes de las series que menciona. */
  function SUMCITE(kp, pt, x) {
    var Q = window.DICite; if (!Q) return '';
    var ids = []; kp.concat(pt.slice(0, 8)).forEach(function (s) { if (s.sourceId && ids.indexOf(s.sourceId) < 0) ids.push(s.sourceId); });
    return Q.derived(ids, { what: ({ es: 'Frases redactadas por Dehesa Index con las últimas cifras publicadas y su rango de los últimos 5 años.', en: 'Sentences written by Dehesa Index from the latest published figures and their 5-year range.', fr: 'Phrases rédigées par Dehesa Index à partir des derniers chiffres publiés et de leur fourchette sur 5 ans.', it: 'Frasi scritte da Dehesa Index con gli ultimi dati pubblicati e il loro intervallo degli ultimi 5 anni.' })[x.lang] });
  }
  function CITE(s) { var Q = window.DICite; return Q && s && s.sourceId ? Q.html(s.sourceId, { period: s.latestPeriod }) : ''; }
  function kpis(cc, S, groups) {
    // vista por sector (js/sector.js): con «Agricultura» o «Ganadería» las cifras clave salen de ese sector y de lo común; con «Ambos», como siempre
    var SEC = window.DehesaSector, sec = SEC ? SEC.get() : 'all', okS = function (s) { return sec === 'all' || SEC.visible(SEC.ofSeries(s)); }, mine = function (s) { return sec !== 'all' && SEC.ofSeries(s) === sec; };
    var kp = picked(cc, S).filter(okS);
    if (sec !== 'all') { var own = S.filter(function (s) { return mine(s) && plen(s) >= 6 && kp.indexOf(s) < 0; }).sort(function (a, b) { return score(b) - score(a); }), gseen = {};
      kp.forEach(function (s) { gseen[s.group] = (gseen[s.group] || 0) + 1; });
      own.forEach(function (s) { if (kp.length < 6 && (gseen[s.group] || 0) < 2) { kp.push(s); gseen[s.group] = (gseen[s.group] || 0) + 1; } });
      kp.sort(function (a, b) { return (mine(b) ? 1 : 0) - (mine(a) ? 1 : 0); }); }
    if (kp.length >= 4) return kp.slice(0, 6);
    KPI_ORDER.forEach(function (g) { if (kp.length < 6 && groups[g]) { var best = groups[g].filter(function (s) { return plen(s) >= 6 && kp.indexOf(s) < 0 && okS(s); }).sort(function (a, b) { return score(b) - score(a); })[0]; if (best) kp.push(best); } });
    return kp;
  }
  var M = {
    es: { wage: 'Sueldo mediano', wagem: 'Sueldo medio', wageh: 'Sueldo mediano por hora (UE, armonizado)', rate: 'Tipo de interés oficial', per: { year: 'año', month: 'mes', week: 'semana', hour: 'hora' }, gross: 'bruto', net: 'neto', histo: 'ver histórico', central: '* Deuda del gobierno central, no de todas las administraciones: no es directamente comparable con la de la UE.', gdp: 'PIB', gdppc: 'PIB per cápita', pop: 'Población', unemp: 'Paro', agri: 'Sector primario (% del PIB)', debt: 'Deuda pública / PIB', cur: 'Moneda', bn: ' mil M', tn: ' bil.', mn: ' M', note: 'Banco Mundial (PIB en USD corrientes, población, paro, valor añadido agrario) y Eurostat (deuda bruta de las administraciones públicas; en Canadá y Australia, Banco Mundial). Último año disponible entre paréntesis.', cn: { EUR: 'Euro (EUR)', DKK: 'Corona danesa (DKK)', CAD: 'Dólar canadiense (CAD)', AUD: 'Dólar australiano (AUD)' } },
    en: { wage: 'Median wage', wagem: 'Average wage', wageh: 'Median hourly wage (EU, harmonised)', rate: 'Policy interest rate', per: { year: 'year', month: 'month', week: 'week', hour: 'hour' }, gross: 'gross', net: 'net', histo: 'see history', central: '* Central government debt, not general government: not directly comparable with the EU figures.', gdp: 'GDP', gdppc: 'GDP per capita', pop: 'Population', unemp: 'Unemployment', agri: 'Primary sector (% of GDP)', debt: 'Public debt / GDP', cur: 'Currency', bn: ' bn', tn: ' tn', mn: ' m', note: 'World Bank (GDP in current USD, population, unemployment, agricultural value added) and Eurostat (general government gross debt; World Bank for Canada and Australia). Latest available year in brackets.', cn: { EUR: 'Euro (EUR)', DKK: 'Danish krone (DKK)', CAD: 'Canadian dollar (CAD)', AUD: 'Australian dollar (AUD)' } },
    fr: { wage: 'Salaire médian', wagem: 'Salaire moyen', wageh: 'Salaire horaire médian (UE, harmonisé)', rate: 'Taux directeur', per: { year: 'an', month: 'mois', week: 'semaine', hour: 'heure' }, gross: 'brut', net: 'net', histo: 'voir l’historique', central: '* Dette de l’administration centrale, non de l’ensemble des administrations publiques : pas directement comparable avec l’UE.', gdp: 'PIB', gdppc: 'PIB par habitant', pop: 'Population', unemp: 'Chômage', agri: 'Secteur primaire (% du PIB)', debt: 'Dette publique / PIB', cur: 'Monnaie', bn: ' Md', tn: ' billions', mn: ' M', note: 'Banque mondiale (PIB en USD courants, population, chômage, valeur ajoutée agricole) et Eurostat (dette brute des administrations publiques ; Banque mondiale pour le Canada et l’Australie). Dernière année disponible entre parenthèses.', cn: { EUR: 'Euro (EUR)', DKK: 'Couronne danoise (DKK)', CAD: 'Dollar canadien (CAD)', AUD: 'Dollar australien (AUD)' } },
    it: { wage: 'Salario mediano', wagem: 'Salario medio', wageh: 'Salario orario mediano (UE, armonizzato)', rate: 'Tasso ufficiale', per: { year: 'anno', month: 'mese', week: 'settimana', hour: 'ora' }, gross: 'lordo', net: 'netto', histo: 'vedi storico', central: '* Debito dell’amministrazione centrale, non di tutte le amministrazioni pubbliche: non direttamente confrontabile con quello UE.', gdp: 'PIL', gdppc: 'PIL pro capite', pop: 'Popolazione', unemp: 'Disoccupazione', agri: 'Settore primario (% del PIL)', debt: 'Debito pubblico / PIL', cur: 'Valuta', bn: ' mld', tn: ' mila mld', mn: ' mln', note: 'Banca mondiale (PIL in USD correnti, popolazione, disoccupazione, valore aggiunto agricolo) ed Eurostat (debito lordo delle amministrazioni pubbliche; Banca mondiale per Canada e Australia). Ultimo anno disponibile tra parentesi.', cn: { EUR: 'Euro (EUR)', DKK: 'Corona danese (DKK)', CAD: 'Dollaro canadese (CAD)', AUD: 'Dollaro australiano (AUD)' } }
  };
  function macroStrip(m, x) {
    if (!m) return '';
    var t = M[x.lang] || M.es, nf = x.nf, items = [];
    var yr = function (o) { return o ? ' <span style="font-weight:400;color:var(--text-faint)">(' + o.y + ')</span>' : ''; };
    var add = function (k, val, o) { items.push('<div style="min-width:120px"><div style="font-size:11px;color:var(--text-faint)">' + x.esc(t[k]) + '</div><div style="font-size:15px;font-weight:700;font-variant-numeric:tabular-nums">' + val + yr(o) + '</div></div>'); };
    if (m.gdp) { var g = m.gdp.v; add('gdp', g >= 1e12 ? '$' + nf(g / 1e12, 2) + t.tn : '$' + nf(g / 1e9, 0) + t.bn, m.gdp); }
    if (m.gdppc) add('gdppc', '$' + nf(m.gdppc.v, 0), m.gdppc);
    if (m.pop) add('pop', nf(m.pop.v / 1e6, m.pop.v >= 1e8 ? 0 : 1) + t.mn, m.pop);
    if (m.unemp) add('unemp', nf(m.unemp.v, 1) + ' %', m.unemp);
    if (m.agri) add('agri', nf(m.agri.v, 1) + ' %', m.agri);
    if (m.debt) add('debt', nf(m.debt.v, 0) + ' %' + (m.debt.src === 'wb-central' ? ' *' : ''), m.debt);
    var SY = { EUR: '€', USD: '$', CAD: 'C$', AUD: 'A$', DKK: 'kr', CHF: 'CHF' };
    var w = x.wage;
    if (w) items.push('<div style="min-width:150px" title="' + x.esc((w.scope && (w.scope[x.lang] || w.scope.es)) || '') + ' · ' + x.esc(w.src) + '"><div style="font-size:11px;color:var(--text-faint)">' + x.esc(w.basis === 'mean' ? t.wagem : t.wage) + '</div><div style="font-size:15px;font-weight:700;font-variant-numeric:tabular-nums">' + nf(w.v, w.v >= 1000 ? 0 : 2) + ' ' + (SY[w.cur] || w.cur) + ' <span style="font-weight:400;font-size:12px;color:var(--text-muted)">/ ' + x.esc(t.per[w.per]) + ' · ' + x.esc(t[w.tax]) + '</span> <span style="font-weight:400;color:var(--text-faint)">(' + x.esc(w.y) + ')</span></div></div>');
    else if (m.wageh) items.push('<div style="min-width:150px"><div style="font-size:11px;color:var(--text-faint)">' + x.esc(t.wageh) + '</div><div style="font-size:15px;font-weight:700;font-variant-numeric:tabular-nums">' + nf(m.wageh.v, 2) + ' € <span style="font-weight:400;font-size:12px;color:var(--text-muted)">/ ' + x.esc(t.per.hour) + '</span> <span style="font-weight:400;color:var(--text-faint)">(' + m.wageh.y + ')</span></div></div>');
    var rt = x.rate;
    if (rt) items.push('<button type="button" data-ps="' + x.esc(rt.id) + '" style="text-align:left;background:none;border:0;padding:0;cursor:pointer;font:inherit;color:inherit;min-width:140px"><div style="font-size:11px;color:var(--text-faint)">' + x.esc(t.rate) + '</div><div style="font-size:15px;font-weight:700;font-variant-numeric:tabular-nums">' + nf(rt.latest, 2) + ' % <span style="font-weight:400;font-size:12px;color:var(--text-muted)">(' + x.esc(x.plabel(rt.latestPeriod, rt.frequency)) + ')</span></div><div style="font-size:11px;color:#2f6b4a;font-weight:700">' + x.esc(t.histo) + ' →</div></button>');
    if (m.currency) items.push('<div style="min-width:120px"><div style="font-size:11px;color:var(--text-faint)">' + x.esc(t.cur) + '</div><div style="font-size:15px;font-weight:700">' + x.esc(t.cn[m.currency] || m.currency) + '</div></div>');
    return '<div style="display:flex;flex-wrap:wrap;gap:12px 22px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">' + items.join('') + '</div><div style="font-size:11px;color:var(--text-faint);margin-top:6px">' + x.esc(t.note) + (m.debt && m.debt.src === 'wb-central' ? ' ' + x.esc(t.central) : '') + '</div>' + macroCite(m, x);
  }
  /* Citas de la franja macro: cada indicador cita la fuente de la que sale (registro de licencias; los sueldos llevan la suya propia en country-wages.json). */
  function macroCite(m, x) {
    var Q = window.DICite; if (!Q) return '';
    var out = [], yrs = ['gdp', 'gdppc', 'pop', 'unemp', 'agri'].concat(m.debt && m.debt.src === 'wb-central' ? ['debt'] : []).filter(function (k) { return m[k]; }).map(function (k) { return m[k].y; });
    if (yrs.length) out.push(Q.html('world_bank_wdi', { period: String(Math.max.apply(null, yrs)) }));
    if ((m.debt && m.debt.src === 'eurostat') || m.wageh) out.push(Q.html('eurostat', { period: String(Math.max(m.debt && m.debt.src === 'eurostat' ? m.debt.y : 0, m.wageh ? m.wageh.y : 0)) }));
    if (x.wage && x.wage.src) out.push((x.wage.sourceId && Q.html(x.wage.sourceId, { period: x.wage.y, note: x.wage.url })) || Q.custom({ name: x.wage.src, url: x.wage.url, period: x.wage.y }));
    if (x.rate && x.rate.sourceId) out.push(Q.html(x.rate.sourceId, { period: x.rate.latestPeriod }));
    out = out.filter(Boolean); return out.length ? '<div class="pp-cites">' + out.join('') + '</div>' : '';
  }
  function rateOf(c) { var r = c && c.series.filter(function (s) { return /-policy-rate$/.test(s.id); })[0]; return r || null; }
  function spark(s) {
    if (!s.points) return '';
    var pts = s.points.slice(-36).map(function (p) { return p[1]; }), mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts), w = 96, h = 28, rg = mx - mn || 1;
    var d = pts.map(function (v, i) { return (i / Math.max(pts.length - 1, 1) * w).toFixed(1) + ',' + (h - 2 - (v - mn) / rg * (h - 4)).toFixed(1); }).join(' ');
    var up = pts[pts.length - 1] >= pts[0];
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline fill="none" stroke="' + (up ? '#2f6b4a' : '#a33') + '" stroke-width="1.6" points="' + d + '"/></svg>';
  }

  // Country Profile 2.0: resumen por bloques y "qué ha cambiado" (solo movimientos inusuales para cada serie)
  var W = {
    es: { blocks: 'Resumen', B: { markets: 'Mercados', production: 'Producción', trade: 'Comercio', inputs: 'Insumos y costes' }, ser: 'series', upto: 'hasta', changed: 'Qué ha cambiado', changedHint: 'Solo variaciones del último periodo que son inusualmente grandes para esa serie (más de 2,5 desviaciones típicas de su propio historial) y recientes.', none: 'Sin movimientos inusuales en los datos recientes.', vs: 'frente al periodo anterior', rare: 'x su variación habitual' },
    en: { blocks: 'Summary', B: { markets: 'Markets', production: 'Production', trade: 'Trade', inputs: 'Inputs and costs' }, ser: 'series', upto: 'to', changed: 'What changed', changedHint: 'Only last-period moves that are unusually large for that series (more than 2.5 standard deviations of its own history) and recent.', none: 'No unusual moves in recent data.', vs: 'vs. previous period', rare: 'x its usual move' },
    fr: { blocks: 'Résumé', B: { markets: 'Marchés', production: 'Production', trade: 'Commerce', inputs: 'Intrants et coûts' }, ser: 'séries', upto: 'jusqu’à', changed: 'Ce qui a changé', changedHint: 'Seulement les variations de la dernière période inhabituellement fortes pour la série (plus de 2,5 écarts-types de son propre historique) et récentes.', none: 'Aucun mouvement inhabituel dans les données récentes.', vs: 'vs. période précédente', rare: 'x sa variation habituelle' },
    it: { blocks: 'Riepilogo', B: { markets: 'Mercati', production: 'Produzione', trade: 'Commercio', inputs: 'Input e costi' }, ser: 'serie', upto: 'fino a', changed: 'Cosa è cambiato', changedHint: 'Solo variazioni dell’ultimo periodo insolitamente grandi per quella serie (oltre 2,5 deviazioni standard del suo storico) e recenti.', none: 'Nessun movimento insolito nei dati recenti.', vs: 'vs. periodo precedente', rare: 'x la sua variazione abituale' }
  };
  var BLK = { markets: ['quotes', 'prices', 'prices_lv', 'prices_fv', 'milk', 'milk_regions', 'meat_regions'], production: ['production', 'crops', 'crops_regions', 'livestock', 'stocks', 'environment', 'organic', 'climate'], trade: ['trade', 'partners'], inputs: ['inputs', 'inputs_f', 'inputs_a', 'costs', 'prices_paid', 'idx_perc', 'idx_pag', 'income'] };
  var MAXAGE = { daily: 10, weekly: 25, monthly: 80, quarterly: 160, semiannual: 220, annual: 520 };
  function pms(p) { var m = /^(\d{4})(?:-(\d{2}|Q[1-4]|S[12]))?(?:-(\d{2}))?$/.exec(p); if (!m) return NaN; var mo = 0; if (m[2]) mo = m[2][0] === 'Q' ? (+m[2][1] - 1) * 3 : m[2][0] === 'S' ? (+m[2][1] - 1) * 6 : +m[2] - 1; return Date.UTC(+m[1], mo, m[3] ? +m[3] : 1); }
  function unusual(S) {
    var out = [], now = Date.now();
    S.forEach(function (s) {
      if (s.group === 'rates' || s.group === 'partners' || !s.points || s.points.length < 24) return;
      var P = s.points, ch = [], i, a, b;
      for (i = 1; i < P.length; i++) { a = P[i - 1][1]; b = P[i][1]; if (a != null && b != null && a !== 0 && a > 0 && b >= 0) ch.push((b - a) / a * 100); }
      if (ch.length < 20) return;
      var last = ch[ch.length - 1], hist = ch.slice(0, -1), mu = 0, sd = 0; hist.forEach(function (v) { mu += v; }); mu /= hist.length; hist.forEach(function (v) { sd += (v - mu) * (v - mu); }); sd = Math.sqrt(sd / hist.length);
      if (!sd || Math.abs(last) < 2) return;
      var rv = P.slice(-24).map(function (q) { return Math.abs(q[1] || 0); }).sort(function (u, v) { return u - v; }), med = rv[rv.length >> 1], pv = P[P.length - 2][1];
      if (!(pv >= 0.1 * med) || med < 1e-9) return;  // base minúscula: el porcentaje engaña
      var age = (now - pms(s.latestPeriod)) / 864e5; if (!(age <= (MAXAGE[s.frequency] || 80))) return;
      var z = Math.abs(last - mu) / sd; if (z >= 2.5) out.push({ s: s, ch: last, z: z });
    });
    return out.sort(function (a, b) { return b.z - a.z; }).slice(0, 6);
  }

  // Coverage Score: 4 componentes observables (amplitud, frescura, profundidad, frecuencia). Mide cuánto cubrimos nosotros, no la calidad del mercado.
  var CV = {
    es: { t: 'Cobertura de datos', sc: 'Puntuación', b: 'Amplitud', f: 'Frescura', d: 'Profundidad', q: 'Frecuencia', bh: 'Bloques cubiertos (mercados, producción, comercio, insumos) de 4', fh: 'Series al día respecto a su frecuencia', dh: 'Años de histórico (mediana; tope 20)', qh: 'Series mensuales o más frecuentes', note: 'Mide cuánto cubrimos nosotros con datos oficiales, no lo importante o desarrollado que es el mercado de un país. Amplitud 30 %, frescura 30 %, profundidad 20 %, frecuencia 20 %.' },
    en: { t: 'Data coverage', sc: 'Score', b: 'Breadth', f: 'Freshness', d: 'Depth', q: 'Frequency', bh: 'Blocks covered (markets, production, trade, inputs) out of 4', fh: 'Series up to date for their frequency', dh: 'Years of history (median; capped at 20)', qh: 'Monthly or more frequent series', note: 'Measures how much we cover with official data, not how large or developed a country’s market is. Breadth 30%, freshness 30%, depth 20%, frequency 20%.' },
    fr: { t: 'Couverture des données', sc: 'Score', b: 'Étendue', f: 'Fraîcheur', d: 'Profondeur', q: 'Fréquence', bh: 'Blocs couverts (marchés, production, commerce, intrants) sur 4', fh: 'Séries à jour pour leur fréquence', dh: 'Années d’historique (médiane ; plafond 20)', qh: 'Séries mensuelles ou plus fréquentes', note: 'Mesure ce que nous couvrons avec des données officielles, pas la taille ou le développement du marché d’un pays. Étendue 30 %, fraîcheur 30 %, profondeur 20 %, fréquence 20 %.' },
    it: { t: 'Copertura dei dati', sc: 'Punteggio', b: 'Ampiezza', f: 'Freschezza', d: 'Profondità', q: 'Frequenza', bh: 'Blocchi coperti (mercati, produzione, commercio, input) su 4', fh: 'Serie aggiornate rispetto alla frequenza', dh: 'Anni di storico (mediana; tetto 20)', qh: 'Serie mensili o più frequenti', note: 'Misura quanto copriamo con dati ufficiali, non quanto è grande o sviluppato il mercato di un paese. Ampiezza 30%, freschezza 30%, profondità 20%, frequenza 20%.' }
  };
  function coverage(S) {
    var blocks = 0, fresh = 0, mo = 0, yrs = [], now = Date.now();
    ['markets', 'production', 'trade', 'inputs'].forEach(function (k) { if (S.some(function (s) { return BLK[k].indexOf(s.group) > -1; })) blocks++; });
    var n = 0, act = 0;
    S.forEach(function (s) {
      if (s.group === 'rates') return; n++; if (s.fs !== 'HISTORICAL' && s.fs !== 'DISCONTINUED') act++;  // historicas/discontinuadas: fuera del denominador de frescura
      var age = (now - pms(s.latestPeriod)) / 864e5; if (s.fs ? (s.fs === 'LIVE' || s.fs === 'FRESH' || s.fs === 'EXPECTED_DELAY') : age <= (MAXAGE[s.frequency] || 80) * 1.5) fresh++;  // fs: estado del Freshness Engine 2.0 precalculado en el catalogo
      if (s.frequency === 'monthly' || s.frequency === 'weekly' || s.frequency === 'daily') mo++;
      var a = pms(pfirst(s)), b = pms(s.latestPeriod); if (a === a && b === b) yrs.push((b - a) / (365.25 * 864e5));
    });
    if (!n) return null; yrs.sort(function (a, b) { return a - b; });
    var med = yrs.length ? yrs[yrs.length >> 1] : 0, c = { b: blocks / 4, f: (act ? fresh / act : 0), d: Math.min(med, 20) / 20, q: mo / n };
    c.score = Math.round(100 * (0.3 * c.b + 0.3 * c.f + 0.2 * c.d + 0.2 * c.q)); c.years = med; c.blocks = blocks; return c;
  }
  function coverageBox(S, x) {
    var c = coverage(S); if (!c) return ''; var w = CV[x.lang] || CV.es, esc = x.esc, col = c.score >= 75 ? '#2f6b4a' : c.score >= 50 ? '#b7791f' : '#a33';
    var bar = function (lab, v, hint, txt) { return '<div style="margin:5px 0" title="' + esc(hint) + '"><div style="display:flex;justify-content:space-between;font-size:12px"><span>' + esc(lab) + '</span><b>' + esc(txt) + '</b></div><div style="height:6px;background:var(--surface-alt);border-radius:3px"><div style="height:6px;width:' + Math.round(v * 100) + '%;background:' + col + ';border-radius:3px"></div></div></div>'; };
    return '<div class="di-card" style="padding:12px 16px;margin-bottom:18px;display:flex;gap:18px;flex-wrap:wrap;align-items:center"><div style="min-width:120px"><div style="font-size:11px;font-weight:700;letter-spacing:.4px;color:var(--text-faint)">' + esc(w.t.toUpperCase()) + '</div><div style="font-size:34px;font-weight:700;color:' + col + '">' + c.score + '<span style="font-size:14px;color:var(--text-muted)"> / 100</span></div></div>' +
      '<div style="flex:1;min-width:240px">' + bar(w.b, c.b, w.bh, c.blocks + '/4') + bar(w.f, c.f, w.fh, Math.round(c.f * 100) + ' %') + bar(w.d, c.d, w.dh, x.nf(c.years, 0)) + bar(w.q, c.q, w.qh, Math.round(c.q * 100) + ' %') + '</div><div class="di-movers-hint" style="flex-basis:100%;margin:0">' + esc(w.note) + ' ' + HP(x, 'coverage') + '</div></div>';
  }
  // «Qué ha cambiado» necesita el histórico completo de cada serie; la página solo baja el de los indicadores clave. Se descarga bajo demanda.
  function partial(S) { var n = 0; S.forEach(function (s) { if (s.points) n++; }); return n < S.length * 0.5; }
  var LD = { es: ['Para saber qué se ha movido más de lo habitual hay que descargar el histórico completo de este país.', 'Calcularlo ahora', 'Descargando…'], en: ['To find what moved more than usual, the full history of this country has to be downloaded.', 'Calculate it now', 'Downloading…'], fr: ['Pour savoir ce qui a bougé plus que d’habitude, il faut télécharger l’historique complet de ce pays.', 'Le calculer maintenant', 'Téléchargement…'], it: ['Per sapere cosa si è mosso più del solito bisogna scaricare lo storico completo di questo paese.', 'Calcolalo ora', 'Download…'] };
  function summary(S, x) {
    var w = W[x.lang] || W.es, esc = x.esc, h = '', tiles = '';
    ['markets', 'production', 'trade', 'inputs'].forEach(function (k) {
      var l = S.filter(function (s) { return BLK[k].indexOf(s.group) > -1; }); if (!l.length) return;
      var last = l.reduce(function (m, s) { return s.latestPeriod > m ? s.latestPeriod : m; }, '');
      tiles += '<div class="di-card" style="padding:10px 14px"><div style="font-size:11px;font-weight:700;color:var(--text-faint);letter-spacing:.4px">' + esc(w.B[k].toUpperCase()) + '</div><div style="font-size:20px;font-weight:700">' + l.length + ' <span style="font-size:12px;font-weight:500;color:var(--text-muted)">' + esc(w.ser) + '</span></div><div style="font-size:11.5px;color:var(--text-muted)">' + esc(w.upto) + ' ' + esc(x.plabel(last, /^\d{4}-\d{2}/.test(last) ? 'monthly' : 'annual')) + '</div></div>';
    });
    if (tiles) h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px">' + tiles + '</div>';
    var pa = partial(S), u = pa ? [] : unusual(S), ld = LD[x.lang] || LD.es;
    h += '<div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin:0 0 4px">' + esc(w.changed.toUpperCase()) + '</div><div class="di-movers-hint" style="margin:0 0 8px">' + esc(w.changedHint) + ' ' + HP(x, 'unusual') + '</div>';
    if (pa) h += '<div class="di-movers-hint" style="margin-bottom:20px">' + esc(ld[0]) + ' <button type="button" class="pp-load" data-unusual="1" data-busy="' + esc(ld[2]) + '">' + esc(ld[1]) + '</button></div>';
    else if (!u.length) h += '<div class="di-movers-hint" style="margin-bottom:20px">' + esc(w.none) + '</div>';
    else h += '<div class="di-card" style="padding:6px 16px;margin-bottom:20px">' + u.map(function (r) {
      var s = r.s, col = r.ch >= 0 ? '#2f6b4a' : '#a33';
      return '<button type="button" data-ps="' + esc(s.id) + '" style="display:flex;justify-content:space-between;gap:10px;width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--border);padding:8px 0;cursor:pointer;font:inherit;color:inherit"><span>' + esc(TL(x, s.label).length > 70 ? TL(x, s.label).slice(0, 68) + '…' : TL(x, s.label)) + '<span style="display:block;font-size:11.5px;color:var(--text-muted)">' + esc(x.plabel(s.latestPeriod, s.frequency)) + ' · ' + x.nf(s.latest, x.dec(s.latest)) + ' ' + esc(s.unit) + '</span></span><span style="white-space:nowrap;color:' + col + ';font-weight:700">' + (r.ch > 0 ? '+' : '−') + x.nf(Math.abs(r.ch), 1) + ' %<span style="display:block;font-size:11px;font-weight:400;color:var(--text-muted)">' + x.nf(r.z, 1) + ' ' + esc(w.rare) + '</span></span></button>';
    }).join('') + '</div>';
    return h;
  }

  function chainBox(x) {
    var d = document, run = function () { if (window.DIChChain) window.DIChChain.box(x); };
    if (window.DIChChain) setTimeout(run, 0); else { var sc = d.createElement('script'); sc.src = 'js/ch-chain.js'; sc.onload = run; d.head.appendChild(sc); }
    return '<div id="ch-chain-box"></div>';
  }

  /* ---------- Lo que más produce: tres medallas (oro, plata, bronce) con cultivos (toneladas) y ganado (cabezas) ----------
     Solo cuenta series reales del catálogo del país (Eurostat), con códigos de cultivo que no se solapan entre sí (sin subtotales como «cereales»). */
  var TOPC = { c1110: ['Common wheat', 'Trigo blando', 'Blé tendre', 'Frumento tenero'], c1120: ['Durum wheat', 'Trigo duro', 'Blé dur', 'Frumento duro'], c1210: ['Rye', 'Centeno', 'Seigle', 'Segale'], c1300: ['Barley', 'Cebada', 'Orge', 'Orzo'], c1410: ['Oats', 'Avena', 'Avoine', 'Avena'], c1500: ['Grain maize', 'Maíz grano', 'Maïs grain', 'Mais da granella'], c1600: ['Triticale', 'Triticale', 'Triticale', 'Triticale'], c1700: ['Sorghum', 'Sorgo', 'Sorgho', 'Sorgo'], c2000: ['Rice', 'Arroz', 'Riz', 'Riso'], i1110: ['Rapeseed', 'Colza', 'Colza', 'Colza'], i1120: ['Sunflower', 'Girasol', 'Tournesol', 'Girasole'], i1130: ['Soya', 'Soja', 'Soja', 'Soia'], r1000: ['Potatoes', 'Patata', 'Pomme de terre', 'Patata'], r2000: ['Sugar beet', 'Remolacha azucarera', 'Betterave sucrière', 'Barbabietola da zucchero'], o1000: ['Olives', 'Aceituna', 'Olives', 'Olive'], w1000: ['Grapes', 'Uva', 'Raisin', 'Uva'], f1110: ['Apples', 'Manzana', 'Pommes', 'Mele'], f1120: ['Pears', 'Pera', 'Poires', 'Pere'], t1000: ['Oranges', 'Naranja', 'Oranges', 'Arance'], v3100: ['Tomatoes', 'Tomate', 'Tomates', 'Pomodori'] };
  var TOPA = { a2000: ['Cattle', 'Vacuno', 'Bovins', 'Bovini'], a3100: ['Pigs', 'Porcino', 'Porcins', 'Suini'], a4100: ['Sheep', 'Ovino', 'Ovins', 'Ovini'], a4200: ['Goats', 'Caprino', 'Caprins', 'Caprini'] };
  var TOPW = { es: ['Lo que más produce', 'Cultivos por toneladas cosechadas y ganado por número de cabezas, último dato publicado (Eurostat). Las medallas marcan las tres primeras partidas de cada lista.', 'Cultivos', 'Ganado', 'mil t', 'mil cabezas', ['Oro', 'Plata', 'Bronce']], en: ['What it produces most', 'Crops by tonnes harvested and livestock by head count, latest published figure (Eurostat). Medals mark the top three items of each list.', 'Crops', 'Livestock', 'kt', 'thousand head', ['Gold', 'Silver', 'Bronze']], fr: ['Ce qu’il produit le plus', 'Cultures par tonnes récoltées et élevage par nombre de têtes, dernier chiffre publié (Eurostat). Les médailles marquent les trois premiers postes de chaque liste.', 'Cultures', 'Élevage', 'kt', 'milliers de têtes', ['Or', 'Argent', 'Bronze']], it: ['Cosa produce di più', 'Colture per tonnellate raccolte e allevamenti per numero di capi, ultimo dato pubblicato (Eurostat). Le medaglie segnano le prime tre voci di ogni elenco.', 'Colture', 'Allevamento', 'kt', 'migliaia di capi', ['Oro', 'Argento', 'Bronzo']] };
  var TOPI = { es: 0, en: 1, fr: 2, it: 3 }, MEDALS = ['🥇', '🥈', '🥉'];
  function topLists(S) {
    var cr = [], an = {}, m;
    S.forEach(function (s) {
      if (s.unit === 't' && (m = /-crop-([a-z0-9_]+)-production$/.exec(s.id)) && TOPC[m[1]] && s.latest > 0) cr.push({ k: m[1], v: s.latest, y: +String(s.latestPeriod).slice(0, 4) });
      else if (s.unit === 'head' && (m = /-herd-(a2000|a3100|a4100|a4200)-/.exec(s.id)) && s.latest > 0) { var y = +String(s.latestPeriod).slice(0, 4), o = an[m[1]]; if (!o || y > o.y || (y === o.y && /m11_m12/.test(s.id))) an[m[1]] = { k: m[1], v: s.latest, y: y }; }
    });
    var cut = function (l) { var mx = l.reduce(function (a, r) { return Math.max(a, r.y); }, 0); return l.filter(function (r) { return r.y >= mx - 2; }).sort(function (a, b) { return b.v - a.v; }); };
    return { crops: cut(cr), animals: cut(Object.keys(an).map(function (k) { return an[k]; })) };
  }
  function topCard(x, S) {
    var w = TOPW[x.lang] || TOPW.es, i = TOPI[x.lang] == null ? 1 : TOPI[x.lang], esc = x.esc, T = topLists(S);
    var list = function (title, rows, dict, unit, div) {
      if (rows.length < 3) return ''; // con menos de tres partidas no hay podio
      return '<div style="flex:1;min-width:240px"><div style="font-size:12px;font-weight:700;margin-bottom:6px">' + esc(title) + ' <span style="font-weight:500;color:var(--text-muted)">· ' + esc(unit) + ', ' + rows[0].y + '</span></div>' +
        rows.slice(0, 6).map(function (r, n) { return '<div style="display:flex;gap:8px;align-items:baseline;font-size:13px;margin:5px 0"><span style="width:22px;flex:none" role="img" title="' + esc(n < 3 ? w[6][n] : '') + '" aria-label="' + esc(n < 3 ? w[6][n] : '') + '">' + (n < 3 ? MEDALS[n] : '') + '</span><span style="flex:1">' + esc(dict[r.k][i]) + '</span><b style="font-variant-numeric:tabular-nums">' + x.nf(r.v / div, r.v / div < 100 ? 1 : 0) + '</b></div>'; }).join('') + '</div>';
    };
    var a = list(w[2], T.crops, TOPC, w[4], 1000), b = list(w[3], T.animals, TOPA, w[5], 1000);
    if (!a && !b) return '';
    return '<div id="pp-top" class="di-card pp-anchor" style="padding:14px 18px;margin-bottom:20px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:4px">' + esc(w[0].toUpperCase()) + '</div><div class="di-movers-hint" style="margin:0 0 10px">' + esc(w[1]) + '</div><div style="display:flex;gap:26px;flex-wrap:wrap">' + a + b + '</div></div>';
  }
  function html(cc, c, x) {
    var t = T[x.lang] || T.es, esc = x.esc, nf = x.nf, S = c.series, groups = {}, i;
    S.forEach(function (s) { (groups[s.group] = groups[s.group] || []).push(s); });
    var gk = x.groups.filter(function (g) { return g !== 'all' && groups[g]; });
    var minP = null, maxP = null, freqs = {}, srcs = {};
    S.forEach(function (s) {
      var a = pfirst(s), b = s.latestPeriod;
      if (minP == null || a < minP) minP = a; if (maxP == null || b > maxP) maxP = b;
      freqs[s.frequency] = (freqs[s.frequency] || 0) + 1;
    });
    var srcList = (c.sources || []).slice(0, 5);
    // cabecera
    var h = '<section class="di-card" style="padding:18px 20px;margin:0 0 18px"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span style="font-size:34px;line-height:1" aria-hidden="true">' + (FLAG[cc] || '') + '</span><div style="flex:1;min-width:200px"><div style="font-size:11px;font-weight:700;letter-spacing:.5px;color:var(--text-faint)">' + esc(t.overview.toUpperCase()) + '</div><h2 style="margin:2px 0 0;font-size:24px">' + esc(x.t.countries[cc] || c.name) + '</h2></div>' +
      '<div style="font-size:13px;color:var(--text-muted);text-align:right"><b>' + S.length + '</b> ' + t.total + ' <b>' + gk.length + '</b> ' + t.cats + '<br>' + esc(t.from) + ' ' + esc(x.plabel(minP, 'annual')) + ' ' + t.to + ' ' + esc(x.plabel(maxP, /^\d{4}-\d{2}$/.test(maxP) ? 'monthly' : 'annual')) + '</div></div>';
    h += macroStrip(x.macro, x);
    h += '<div style="margin-top:10px;font-size:12.5px;color:var(--text-muted)">' + esc(t.freq) + ': ' + Object.keys(freqs).map(function (k) { return freqs[k] + ' ' + esc((x.t.freq && x.t.freq[k]) || k); }).join(' · ') + (srcList.length ? '<br>' + esc(t.sources) + ': ' + srcList.map(esc).join(' · ') : '') + '</div></section>';
    if (x.afterHero) h += x.afterHero;   // mapa de regiones (paises.js), pegado a la cabecera con las cifras macro
    var kp = kpis(cc, S, groups), C = window.DIClear, present = { sum: true, kpi: kp.length > 0, trade: !!(groups.partners && groups.partners.length), exp: true };
    var qs = C ? C.questions(groups, x.lang) : []; present.ask = qs.length > 0;
    var pl = C ? C.plain({ lang: x.lang, kpis: kp, partners: groups.partners || [], unusual: partial(S) ? [] : unusual(S), plabel: x.plabel }) : null;
    if (C) h += C.nav(present, x.lang, esc);
    if (pl) h += '<section id="pp-sum" class="di-card pp-plain"><div class="pp-plain-h">' + esc(pl.head) + ' ' + SHR(x, 'pp-sum') + '</div><p>' + pl.sentences.map(esc).join(' ') + '</p><div class="di-movers-hint">' + esc(pl.note) + (/^(ES|FR|DE|BE|AT|PT|DK|NL|CA|AU)$/.test(cc) ? ' · <a href="perfiles.html?a=' + cc + '">' + esc({ es: 'Comparar con otro país', en: 'Compare with another country', fr: 'Comparer avec un autre pays', it: 'Confronta con un altro paese' }[x.lang] || '') + '</a>' : '') + '</div>' + SUMCITE(kp, groups.partners || [], x) + '</section>';
    else h += '<span id="pp-sum"></span>';
    h += coverageBox(S, x) + summary(S, x);
    // KPIs
    if (kp.length) {
      h += '<div id="pp-kpi" class="pp-anchor" style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin:0 0 8px">' + esc(t.kpi.toUpperCase()) + ' ' + HP(x, 'range') + ' ' + SHR(x, 'pp-kpi') + '</div><div class="pp-kgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin-bottom:20px">';
      kp.forEach(function (s) {
        var ch = s.changePct, col = ch == null ? 'inherit' : ch >= 0 ? '#2f6b4a' : '#a33';
        h += '<div class="pp-kc"><button type="button" class="di-card" data-ps="' + esc(s.id) + '" style="text-align:left;padding:12px 14px;cursor:pointer;border:1px solid var(--border);font:inherit;color:inherit"><div style="font-size:11px;color:var(--text-faint);min-height:30px">' + esc((x.t[s.group] || s.group)) + '</div><div style="font-size:12.5px;font-weight:600;line-height:1.3;min-height:34px">' + esc(TL(x, s.label.replace(/\s*\((monthly|quarterly|annual|weekly|half-year)[^)]*\)$/i, ''))) + '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:6px"><div><div style="font-size:20px;font-weight:700;font-variant-numeric:tabular-nums">' + nf(s.latest, x.dec(s.latest)) + '</div><div style="font-size:11px;color:var(--text-muted)">' + esc(s.unit) + '</div></div>' + spark(s) + '</div>' +
          '<div style="font-size:11.5px;margin-top:4px;color:var(--text-muted)">' + esc(x.plabel(s.latestPeriod, s.frequency)) + (ch == null ? '' : ' · <span style="color:' + col + '">' + (ch > 0 ? '+' : ch < 0 ? '−' : '') + nf(Math.abs(ch), 1) + ' %</span>') + '</div>' + (C ? C.ctxHtml(s, x.lang, esc) : '') + '</button>' + CITE(s) + '</div>';
      });
      h += '</div>';
    }
    h += topCard(x, S);
    // comercio: socios
    var pt = groups.partners || [];
    if (pt.length) {
      var side = function (tag, title) {
        var l = pt.filter(function (s) { return s.id.indexOf('-' + tag + '-') > -1; }), an = l.filter(function (s) { return s.frequency === 'annual'; }); if (an.length) l = an;
        l = l.sort(function (a, b) { return b.latest - a.latest; }).slice(0, 4);
        if (!l.length) return '';
        var tot = l.reduce(function (m, s) { return Math.max(m, s.latest); }, 0);
        var nmOf = function (s) { var n0 = s.label.replace(/^(Exports to|Imports from)\s+/i, '').replace(/:.*$/, ''); return (window.DIClear && window.DIClear._country(n0, x.lang)) || n0; };
        var PL = { es: ['Barras', 'Tarta', 'Reparto entre los 4 principales'], en: ['Bars', 'Pie', 'Split among the top 4'], fr: ['Barres', 'Camembert', 'Répartition entre les 4 premiers'], it: ['Barre', 'Torta', 'Ripartizione tra i primi 4'] }[x.lang] || [];
        var bars = l.map(function (s) { var nm = nmOf(s); return '<div style="font-size:13px;margin:5px 0"><div style="display:flex;justify-content:space-between"><span>' + esc(nm) + '</span><b style="font-variant-numeric:tabular-nums">' + nf(s.latest, x.dec(s.latest)) + '</b></div><div style="height:4px;border-radius:3px;background:#2f6b4a;opacity:.75;width:' + Math.max(3, Math.round(s.latest / tot * 100)) + '%"></div></div>'; }).join('');
        var pieH = window.DehesaChart && window.DehesaChart.pie ? window.DehesaChart.pie({ items: l.map(function (s) { return { name: nmOf(s), v: s.latest }; }), unit: l[0].unit, centerLabel: PL[2], maxN: 4, minShare: 0 }) : '';
        var body = pieH && window.DehesaChart.switcher ? window.DehesaChart.switcher({ line: bars, pie: pieH, lineLabel: PL[0], pieLabel: PL[1] }) : bars;
        return '<div style="flex:1;min-width:230px"><div style="font-size:12px;font-weight:700;margin-bottom:6px">' + esc(title) + ' <span style="font-weight:500;color:var(--text-muted)">· ' + esc(l[0].unit) + ', ' + esc(x.plabel(l[0].latestPeriod, l[0].frequency)) + '</span></div>' +
          body + CITE(l[0]) + '</div>';
      };
      var a = side('exp', t.dest), b = side('imp', t.orig);
      if (a || b) h += '<div id="pp-trade" class="di-card pp-anchor" style="padding:14px 18px;margin-bottom:20px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:10px">' + esc(t.trade.toUpperCase()) + ' ' + HP(x, 'hs') + ' ' + SHR(x, 'pp-trade') + '</div><div style="display:flex;gap:26px;flex-wrap:wrap">' + a + b + '</div></div>';
    }
    if (h.indexOf('id="pp-trade"') < 0) h += '<div id="pp-trade" class="di-card pp-anchor" style="padding:14px 18px;margin-bottom:20px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:6px">' + esc(t.trade.toUpperCase()) + '</div><div class="di-movers-hint" style="margin:0">' + esc(NOTRADE[x.lang] || NOTRADE.es) + '</div></div>';
    // categorías
    var QT = { es: ['Empieza por una pregunta', 'Cada botón te lleva al gráfico con los datos que responden.', 'Ver todas las categorías', 'series'], en: ['Start with a question', 'Each button takes you to the chart with the data that answers it.', 'See all categories', 'series'], fr: ['Commencez par une question', 'Chaque bouton vous mène au graphique avec les données qui y répondent.', 'Voir toutes les catégories', 'séries'], it: ['Inizia da una domanda', 'Ogni pulsante porta al grafico con i dati che rispondono.', 'Vedi tutte le categorie', 'serie'] }[x.lang] || [];
    if (qs.length) h += '<div id="pp-ask" class="pp-anchor" style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin:0 0 4px">' + esc(QT[0].toUpperCase()) + ' ' + SHR(x, 'pp-ask') + '</div><div class="di-movers-hint" style="margin:0 0 8px">' + esc(QT[1]) + '</div><div class="pp-qs">' + qs.map(function (q) { return '<button type="button" class="di-card pp-qb" data-pg="' + esc(q.group) + '"><span>' + esc(q.q) + '</span><small>' + esc(x.t[q.group] || q.group) + ' · ' + q.n + ' ' + esc(QT[3]) + ' →</small></button>'; }).join('') + '</div>';
    h += (qs.length ? '<details class="pp-all"><summary>' + esc(QT[2]) + ' (' + gk.length + ')</summary>' : '<div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin:0 0 4px">' + esc(t.explore.toUpperCase()) + '</div><div class="di-movers-hint" style="margin:0 0 8px">' + esc(t.hint) + '</div>') + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin:8px 0 22px">';
    gk.forEach(function (g) {
      var l = groups[g].slice().sort(function (a, b) { return score(b) - score(a); }), last = l.reduce(function (m, s) { return s.latestPeriod > m ? s.latestPeriod : m; }, '');
      var ex = l.slice(0, 2).map(function (s) { return TL(x, s.label.replace(/\s*\((monthly|quarterly|annual|weekly|half-year)[^)]*\)$/i, '')); });
      h += '<button type="button" class="di-card" data-pg="' + esc(g) + '" style="text-align:left;padding:12px 14px;cursor:pointer;border:1px solid var(--border);font:inherit;color:inherit"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:14px">' + esc(x.t[g] || g) + '</b><span style="font-size:12px;color:var(--text-muted);white-space:nowrap">' + l.length + ' ' + t.series + '</span></div>' +
        '<div style="font-size:11.5px;color:var(--text-muted);margin:3px 0 6px">' + esc(t.last) + ': ' + esc(x.plabel(last, /^\d{4}-\d{2}$/.test(last) ? 'monthly' : 'annual')) + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);line-height:1.4">' + esc(t.examples) + ': ' + ex.map(function (e) { return esc(e.length > 46 ? e.slice(0, 44) + '…' : e); }).join(' · ') + '</div>' +
        '<div style="font-size:12px;font-weight:700;color:#2f6b4a;margin-top:8px">' + esc(t.go) + ' →</div></button>';
    });
    h += '</div>' + (qs.length ? '</details>' : '') + '<h2 id="ps-explorer" class="pp-anchor" style="margin:6px 0 12px;font-size:19px">' + esc(t.exploreTitle) + ' ' + esc(x.t.countries[cc] || c.name) + ' ' + SHR(x, 'ps-explorer') + '</h2>';
    if (cc === 'CH') h += chainBox(x);
    return h;
  }
  window.DIProfile = { coverage: coverage, html: html, macroStrip: macroStrip, rateOf: rateOf, kpis: kpis, spark: spark, flag: function (cc) { return FLAG[cc] || ''; } };
})();
