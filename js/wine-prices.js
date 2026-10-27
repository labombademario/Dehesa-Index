/* Dehesa Index — Precio del vino a granel: España (boletín semanal del MAPA) y Francia (FranceAgriMer), con histórico. data/wine-prices.json. ES5.
   Si el fichero no carga, la pestaña conserva las cifras puntuales de js/data.js. */
(function (global) {
  'use strict';
  var S = global.DehesaShared;
  var T = {
    es: { badge: 'DATOS OFICIALES REALES', es: 'España — MAPA', fr: 'Francia — FranceAgriMer', week: 'semana', month: 'mes', white: 'Vino blanco', red: 'Vino tinto', wBlanc: 'Blanco', wRouge: 'Tinto', unit: '€/hl', wow: 'Variación semanal', yoy: 'Variación interanual', yoyM: 'Variación interanual (mismo mes)', type: 'Tipo de vino', hist: 'Histórico', none: 'sin dato', since: 'desde',
      t: { vsig_var: 'Sin DOP/IGP, con variedad en la etiqueta', vsig: 'Sin DOP/IGP, sin variedad', igp: 'IGP', aop: 'DOP' }, noteEs: 'Precio medio semanal nacional del vino a granel. Las variaciones las calcula Dehesa Index con esos precios.', noteFr: 'Precio medio mensual de compra a granel comunicado a la Comisión Europea. FranceAgriMer lo publica con varios meses de retraso: el mes del título es el último que ha publicado.', cmp: 'No son comparables en cadencia ni en tipo de vino: España es semanal y sin detallar denominación; Francia es mensual y por tipo. El nivel de precio sí se puede leer lado a lado.', src: 'Fuente:', chart: 'Gráfico del precio histórico', hover: 'Pasa el cursor o toca el gráfico para ver cada dato.' },
    en: { badge: 'REAL OFFICIAL DATA', es: 'Spain — MAPA', fr: 'France — FranceAgriMer', week: 'week', month: 'month', white: 'White wine', red: 'Red wine', wBlanc: 'White', wRouge: 'Red', unit: '€/hl', wow: 'Weekly change', yoy: 'Year-on-year change', yoyM: 'Year-on-year change (same month)', type: 'Wine type', hist: 'History', none: 'n/a', since: 'since',
      t: { vsig_var: 'No PDO/PGI, grape variety on label', vsig: 'No PDO/PGI, no variety', igp: 'PGI', aop: 'PDO' }, noteEs: 'National weekly average bulk wine price. Changes are calculated by Dehesa Index from those prices.', noteFr: 'Monthly average bulk purchase price reported to the European Commission. FranceAgriMer publishes it several months late: the month in the title is the latest it has published.', cmp: 'Not comparable in frequency or wine type: Spain is weekly with no detail on designation; France is monthly and by type. The price level can still be read side by side.', src: 'Source:', chart: 'Historical price chart', hover: 'Hover or tap the chart to read each value.' },
    fr: { badge: 'DONNÉES OFFICIELLES RÉELLES', es: 'Espagne — MAPA', fr: 'France — FranceAgriMer', week: 'semaine', month: 'mois', white: 'Vin blanc', red: 'Vin rouge', wBlanc: 'Blanc', wRouge: 'Rouge', unit: '€/hl', wow: 'Variation hebdomadaire', yoy: 'Variation annuelle', yoyM: 'Variation annuelle (même mois)', type: 'Type de vin', hist: 'Historique', none: 'n.d.', since: 'depuis',
      t: { vsig_var: 'Sans AOP/IGP, avec mention de cépage', vsig: 'Sans AOP/IGP, sans mention de cépage', igp: 'IGP', aop: 'AOP' }, noteEs: 'Prix moyen hebdomadaire national du vin en vrac. Les variations sont calculées par Dehesa Index à partir de ces prix.', noteFr: 'Prix moyen mensuel d’achat en vrac communiqué à la Commission européenne. FranceAgriMer le publie avec plusieurs mois de décalage : le mois du titre est le dernier publié.', cmp: 'Non comparables en fréquence ni en type de vin : l’Espagne est hebdomadaire sans détail d’appellation ; la France est mensuelle et par type. Le niveau de prix se lit toutefois côte à côte.', src: 'Source :', chart: 'Graphique de l’historique des prix', hover: 'Survolez ou touchez le graphique pour lire chaque valeur.' },
    it: { badge: 'DATI UFFICIALI REALI', es: 'Spagna — MAPA', fr: 'Francia — FranceAgriMer', week: 'settimana', month: 'mese', white: 'Vino bianco', red: 'Vino rosso', wBlanc: 'Bianco', wRouge: 'Rosso', unit: '€/hl', wow: 'Variazione settimanale', yoy: 'Variazione annua', yoyM: 'Variazione annua (stesso mese)', type: 'Tipo di vino', hist: 'Storico', none: 'n.d.', since: 'dal',
      t: { vsig_var: 'Senza DOP/IGP, con vitigno in etichetta', vsig: 'Senza DOP/IGP, senza vitigno', igp: 'IGP', aop: 'DOP' }, noteEs: 'Prezzo medio settimanale nazionale del vino sfuso. Le variazioni sono calcolate da Dehesa Index con quei prezzi.', noteFr: 'Prezzo medio mensile di acquisto all’ingrosso comunicato alla Commissione europea. FranceAgriMer lo pubblica con diversi mesi di ritardo: il mese nel titolo è l’ultimo pubblicato.', cmp: 'Non comparabili per cadenza né per tipo di vino: la Spagna è settimanale senza dettaglio di denominazione; la Francia è mensile e per tipo. Il livello dei prezzi si può comunque leggere affiancato.', src: 'Fonte:', chart: 'Grafico dello storico dei prezzi', hover: 'Passa il cursore o tocca il grafico per leggere ogni valore.' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  var MON = { es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'], it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'] };
  var MFULL = { es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'], it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'] };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function lang() { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; }
  function n2(v, lg) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pct(v, lg) { if (v == null) return '—'; var s = v.toLocaleString(LOC[lg], { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' }); return s.replace('-', '−') + ' %'; }
  function dmy(iso, lg) { var p = iso.split('-'); return parseInt(p[2], 10) + ' ' + MON[lg][parseInt(p[1], 10) - 1] + ' ' + p[0]; }
  function ymLabel(ym, lg) { var p = ym.split('-'); return MFULL[lg][parseInt(p[1], 10) - 1] + ' ' + p[0]; }
  function chg(a, b) { return a == null || b == null || !b ? null : (a / b - 1) * 100; }
  function isoWeek(d) { var t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); var day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return [t.getUTCFullYear(), Math.ceil(((t - y0) / 86400000 + 1) / 7)]; }

  /* gráfico de líneas: dos series, etiquetas al final, lectura al pasar o tocar */
  function chart(id, pts, lg, o) { // pts: [{x: Date ms, label, a, b}]; a = blanco, b = tinto
    var W = 560, H = 210, L = 38, R = 8, Tp = 10, B = 24, i, vals = [];
    pts.forEach(function (p) { if (p.a != null) vals.push(p.a); if (p.b != null) vals.push(p.b); });
    var lo = Math.floor(Math.min.apply(null, vals) / 10) * 10, hi = Math.ceil(Math.max.apply(null, vals) / 10) * 10; if (hi - lo < 20) hi = lo + 20;
    var x0 = pts[0].x, x1 = pts[pts.length - 1].x;
    var X = function (x) { return L + (x - x0) / (x1 - x0 || 1) * (W - L - R); }, Y = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); };
    var grid = '', step = (hi - lo) / 4;
    for (i = 0; i <= 4; i++) { var gv = lo + step * i; grid += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(gv).toFixed(1) + '" y2="' + Y(gv).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(gv) + 3.5).toFixed(1) + '" text-anchor="end">' + Math.round(gv) + '</text>'; }
    var y0y = new Date(x0).getUTCFullYear(), y1y = new Date(x1).getUTCFullYear(), every = (y1y - y0y) > 9 ? 2 : 1, xt = '';
    for (var yy = y0y + 1; yy <= y1y; yy += every) { var tx = Date.UTC(yy, 0, 1); if (tx > x0 && tx < x1) xt += '<line class="wp-grid wp-grid-v" x1="' + X(tx).toFixed(1) + '" x2="' + X(tx).toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + X(tx).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + yy + '</text>'; }
    var line = function (k) { var d = '', open = false; pts.forEach(function (p) { if (p[k] == null) { open = false; return; } d += (open ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p[k]).toFixed(1); open = true; }); return d; };
    var last = function (k) { for (var j = pts.length - 1; j >= 0; j--) if (pts[j][k] != null) return pts[j]; return null; };
    var la = last('a'), lb = last('b');
    var T2 = T[lg];
    return '<div class="wp-chart" data-wp="' + id + '"><div class="wp-readout" aria-live="polite">' + esc(T2.hover) + '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(T2.chart) + '" class="wp-svg">' + grid + xt +
      '<path class="wp-line wp-line-w" d="' + line('a') + '"/><path class="wp-line wp-line-r" d="' + line('b') + '"/>' +
      (la ? '<circle class="wp-dot wp-dot-w" cx="' + X(la.x).toFixed(1) + '" cy="' + Y(la.a).toFixed(1) + '" r="3.5"/>' : '') + (lb ? '<circle class="wp-dot wp-dot-r" cx="' + X(lb.x).toFixed(1) + '" cy="' + Y(lb.b).toFixed(1) + '" r="3.5"/>' : '') +
      '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg>' +
      '<div class="wp-legend"><span><i class="wp-sw wp-sw-w"></i>' + esc(o.wLabel) + '</span><span><i class="wp-sw wp-sw-r"></i>' + esc(o.rLabel) + '</span><span class="wp-unit">' + esc(T2.unit) + '</span></div></div>';
  }
  function bindChart(root, pts, lg, o) {
    var box = root.querySelector('.wp-chart'); if (!box) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross'), T2 = T[lg], W = 560, L = 38, R = 8;
    var x0 = pts[0].x, x1 = pts[pts.length - 1].x;
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = (ev.touches ? ev.touches[0].clientX : ev.clientX), vx = (cx - r.left) / r.width * W;
      var t = x0 + (vx - L) / (W - L - R) * (x1 - x0), best = 0, bd = 1e18;
      for (var i = 0; i < pts.length; i++) { var d = Math.abs(pts[i].x - t); if (d < bd) { bd = d; best = i; } }
      var p = pts[best], px = L + (p.x - x0) / (x1 - x0 || 1) * (W - L - R);
      cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(p.label) + '</b> · ' + esc(o.wLabel) + ' <b>' + n2(p.a, lg) + '</b> · ' + esc(o.rLabel) + ' <b>' + n2(p.b, lg) + '</b> ' + esc(T2.unit);
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = T2.hover; });
  }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  var TRUST = {
    es: { mk: { es: 'Precio medio semanal nacional del vino blanco y del vino tinto a granel (el boletín no detalla denominación y cita el Informe Semanal de Coyuntura del MAPA)', fr: 'Precio medio mensual de compra a granel comunicado a la Comisión Europea, por tipo de vino' }, ty: { es: 'Precio medio semanal de mercado', fr: 'Precio medio mensual de compra' } },
    en: { mk: { es: 'National weekly average bulk price of white and red wine (the bulletin gives no designation detail and cites the MAPA Weekly Economic Report)', fr: 'Monthly average bulk purchase price reported to the European Commission, by wine type' }, ty: { es: 'Weekly average market price', fr: 'Monthly average purchase price' } },
    fr: { mk: { es: 'Prix moyen hebdomadaire national du vin blanc et du vin rouge en vrac (le bulletin ne détaille pas l’appellation et cite le rapport hebdomadaire de conjoncture du MAPA)', fr: 'Prix moyen mensuel d’achat en vrac communiqué à la Commission européenne, par type de vin' }, ty: { es: 'Prix moyen hebdomadaire de marché', fr: 'Prix moyen mensuel d’achat' } },
    it: { mk: { es: 'Prezzo medio settimanale nazionale del vino bianco e rosso sfuso (il bollettino non dettaglia la denominazione e cita il rapporto settimanale di congiuntura del MAPA)', fr: 'Prezzo medio mensile d’acquisto allo sfuso comunicato alla Commissione europea, per tipo di vino' }, ty: { es: 'Prezzo medio settimanale di mercato', fr: 'Prezzo medio mensile d’acquisto' } }
  };
  var METH = {
    es: { es: 'Dehesa Index lee cada boletín semanal del MAPA (PDF) y guarda el precio medio del vino blanco y del tinto en €/hl. Las variaciones semanal e interanual (mismo número de semana del año anterior) las calcula Dehesa Index con esos precios. La campaña va de agosto a julio.', fr: 'FranceAgriMer publica cada mes el precio medio de compra a granel que Francia comunica a la Comisión Europea, por color y tipo de vino. El mes más reciente llega con un mes de retraso. Lo que la fuente marca como no disponible o no significativo queda como hueco; un valor aislado incompatible con su entorno se descarta y se anota en el registro. La variación interanual la calcula Dehesa Index.' },
    en: { es: 'Dehesa Index reads each weekly MAPA bulletin (PDF) and keeps the average price of white and red wine in €/hl. Weekly and year-on-year changes (same week number of the previous year) are calculated by Dehesa Index from those prices. The campaign runs August to July.', fr: 'FranceAgriMer publishes each month the average bulk purchase price France reports to the European Commission, by colour and wine type. The latest month arrives one month late. Anything the source marks as unavailable or not significant is left as a gap; an isolated value inconsistent with its surroundings is discarded and noted in the log. Year-on-year change is calculated by Dehesa Index.' },
    fr: { es: 'Dehesa Index lit chaque bulletin hebdomadaire du MAPA (PDF) et conserve le prix moyen du vin blanc et du vin rouge en €/hl. Les variations hebdomadaire et annuelle (même numéro de semaine de l’année précédente) sont calculées par Dehesa Index à partir de ces prix. La campagne va d’août à juillet.', fr: 'FranceAgriMer publie chaque mois le prix moyen d’achat en vrac que la France communique à la Commission européenne, par couleur et type de vin. Le mois le plus récent arrive avec un mois de retard. Ce que la source marque comme indisponible ou non significatif reste vide ; une valeur isolée incompatible avec son environnement est écartée et consignée dans le journal. La variation annuelle est calculée par Dehesa Index.' },
    it: { es: 'Dehesa Index legge ogni bollettino settimanale del MAPA (PDF) e conserva il prezzo medio del vino bianco e rosso in €/hl. Le variazioni settimanale e annua (stesso numero di settimana dell’anno precedente) sono calcolate da Dehesa Index con quei prezzi. La campagna va da agosto a luglio.', fr: 'FranceAgriMer pubblica ogni mese il prezzo medio d’acquisto allo sfuso che la Francia comunica alla Commissione europea, per colore e tipo di vino. Il mese più recente esce con un mese di ritardo. Ciò che la fonte indica come non disponibile o non significativo resta vuoto; un valore isolato incompatibile con il contesto viene scartato e annotato nel registro. La variazione annua è calcolata da Dehesa Index.' }
  };
  function trust(cc, doc, lg, ob) {
    if (!global.DehesaDataTrust || !global.DehesaDataTrust.info) return '';
    return global.DehesaDataTrust.info({ src: doc.source.name, url: doc.source.url, fq: cc === 'es' ? 'weekly' : 'monthly', mk: TRUST[lg].mk[cc], ty: TRUST[lg].ty[cc], ob: ob, me: METH[lg][cc], st: 'official' }, lg);
  }
  function esCard(d, lg, st) {
    var t = T[lg], ws = d.es.weeks, n = ws.length, w = ws[n - 1], p = ws[n - 2], ly = null, wk = isoWeek(new Date(w.to + 'T00:00:00Z'));
    for (var i = n - 2; i >= 0; i--) { var q = isoWeek(new Date(ws[i].to + 'T00:00:00Z')); if (q[0] === wk[0] - 1 && q[1] === wk[1]) { ly = ws[i]; break; } }
    var cur = t.week + ' ' + w.week + ', ' + dmy(w.from, lg).replace(/ \d{4}$/, '') + ' – ' + dmy(w.to, lg);
    var pts = ws.map(function (x) { return { x: Date.parse(x.to + 'T00:00:00Z'), label: t.week + ' ' + x.week, a: x.white, b: x.red }; });
    var html = '<div class="di-card di-info-card wp-card"><div class="di-info-card-title">' + esc(t.es + ' (' + cur + ')') + '</div><div class="di-info-stat-list">' +
      row(t.white, '<span class="wp-num">' + n2(w.white, lg) + '</span> ' + t.unit) + row(t.red, '<span class="wp-num">' + n2(w.red, lg) + '</span> ' + t.unit) +
      row(t.wow + ' (' + t.wBlanc.toLowerCase() + ')', pct(p ? chg(w.white, p.white) : null, lg)) + row(t.wow + ' (' + t.wRouge.toLowerCase() + ')', pct(p ? chg(w.red, p.red) : null, lg)) +
      row(t.yoy + ' (' + t.wBlanc.toLowerCase() + ')', pct(ly ? chg(w.white, ly.white) : null, lg)) + row(t.yoy + ' (' + t.wRouge.toLowerCase() + ')', pct(ly ? chg(w.red, ly.red) : null, lg)) +
      '</div><div class="wp-h">' + esc(t.hist) + ' · ' + esc(t.since) + ' ' + dmy(ws[0].from, lg) + '</div>' + chart('es', pts, lg, { wLabel: t.white, rLabel: t.red }) +
      '<div class="di-info-sub">' + esc(t.noteEs) + '</div>' + trust('es', d.es, lg, cur) + '</div>';
    return { html: html, pts: pts, o: { wLabel: t.white, rLabel: t.red } };
  }
  function frPts(d, type, lg) {
    var s = d.fr.series, R = {}, W = {}, t = T[lg];
    (s['red.' + type] || []).forEach(function (x) { R[x[0]] = x[1]; }); (s['white.' + type] || []).forEach(function (x) { W[x[0]] = x[1]; });
    var ks = Object.keys(R).concat(Object.keys(W)).filter(function (k, i, a) { return a.indexOf(k) === i; }).sort();
    if (ks.length) { var all = [], yy = +ks[0].slice(0, 4), mm = +ks[0].slice(5), ey = +ks[ks.length - 1].slice(0, 4), em = +ks[ks.length - 1].slice(5); while (yy < ey || (yy === ey && mm <= em)) { all.push(yy + '-' + (mm < 10 ? '0' : '') + mm); if (++mm > 12) { mm = 1; yy++; } } ks = all; }   // meses sin dato quedan como hueco: la linea se corta
    return ks.map(function (k) { var p = k.split('-'); return { x: Date.UTC(+p[0], +p[1] - 1, 15), ym: k, label: ymLabel(k, lg), a: W[k] == null ? null : W[k], b: R[k] == null ? null : R[k] }; });
  }
  function frCard(d, lg, type) {
    var t = T[lg], pts = frPts(d, type, lg), last = pts[pts.length - 1];
    var lastW = null, lastR = null, i, p = pts.length;
    for (i = p - 1; i >= 0 && (lastW === null || lastR === null); i--) { if (lastW === null && pts[i].a != null) lastW = pts[i]; if (lastR === null && pts[i].b != null) lastR = pts[i]; }
    var yo = function (cur, k) { if (!cur) return null; var y = (+cur.ym.slice(0, 4) - 1) + cur.ym.slice(4); for (var j = 0; j < pts.length; j++) if (pts[j].ym === y) return pts[j][k]; return null; };
    var opts = ['vsig_var', 'vsig', 'igp', 'aop'].filter(function (k) { return d.fr.series['red.' + k] && d.fr.series['white.' + k]; });
    var sel = '<label class="wp-sel"><span>' + esc(t.type) + '</span><select class="di-compare-select wp-type" aria-label="' + esc(t.type) + '">' + opts.map(function (k) { return '<option value="' + k + '"' + (k === type ? ' selected' : '') + '>' + esc(t.t[k]) + '</option>'; }).join('') + '</select></label>';
    var cur = ymLabel(last.ym, lg);
    var html = '<div class="di-card di-info-card wp-card" data-wp-fr="1"><div class="di-info-card-title">' + esc(t.fr + ' (' + cur + ')') + '</div>' + sel + '<div class="di-info-stat-list">' +
      row(t.white + ' · ' + ymLabel(lastW.ym, lg), '<span class="wp-num">' + n2(lastW.a, lg) + '</span> ' + t.unit) + row(t.red + ' · ' + ymLabel(lastR.ym, lg), '<span class="wp-num">' + n2(lastR.b, lg) + '</span> ' + t.unit) +
      row(t.yoyM + ' (' + t.wBlanc.toLowerCase() + ')', pct(chg(lastW.a, yo(lastW, 'a')), lg)) + row(t.yoyM + ' (' + t.wRouge.toLowerCase() + ')', pct(chg(lastR.b, yo(lastR, 'b')), lg)) +
      '</div><div class="wp-h">' + esc(t.hist) + ' · ' + esc(t.since) + ' ' + ymLabel(pts[0].ym, lg) + '</div>' + chart('fr', pts, lg, { wLabel: t.white, rLabel: t.red }) +
      '<div class="di-info-sub">' + esc(t.noteFr) + '</div>' + trust('fr', d.fr, lg, cur) + '</div>';
    return { html: html, pts: pts, o: { wLabel: t.white, rLabel: t.red } };
  }
  var CACHE = null;
  function load() { return CACHE || (CACHE = fetch('data/wine-prices.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function render(el) {
    if (!el) return;
    load().then(function (d) {
      if (!d || !d.es || !d.fr || !d.es.weeks.length) {
        var w = el.querySelector('[data-wp-loading]');
        if (w) w.textContent = ({ es: 'No se han podido cargar los precios del vino. Vuelve a intentarlo más tarde.', en: 'Wine prices could not be loaded. Please try again later.', fr: 'Les prix du vin n’ont pas pu être chargés. Réessayez plus tard.', it: 'Non è stato possibile caricare i prezzi del vino. Riprova più tardi.' })[lang()] || '';
        return;
      }
      var lg = lang(), t = T[lg], state = { type: 'vsig_var' };
      var a = esCard(d, lg, state), f = frCard(d, lg, state.type);
      var src = '<div class="di-field-hint di-info-sources">' + esc(t.src) + ' <a href="' + esc(d.es.source.url) + '" target="_blank" rel="noopener noreferrer">MAPA</a> · <a href="' + esc(d.fr.source.url) + '" target="_blank" rel="noopener noreferrer">FranceAgriMer</a></div>';
      el.innerHTML = '<div class="di-badge di-badge-green di-info-badge">' + esc(t.badge) + '</div><div class="di-info-grid">' + a.html + f.html + '</div><div class="di-info-scope-note">' + esc(t.cmp) + '</div>' + src;
      bindChart(el.querySelector('.wp-card:not([data-wp-fr])'), a.pts, lg, a.o);
      var fc = el.querySelector('[data-wp-fr]'); bindChart(fc, f.pts, lg, f.o);
      el.addEventListener('change', function (ev) {
        if (!ev.target || ev.target.className.indexOf('wp-type') < 0) return;
        var c = frCard(d, lg, ev.target.value), tmp = document.createElement('div'); tmp.innerHTML = c.html;
        var old = el.querySelector('[data-wp-fr]'); old.parentNode.replaceChild(tmp.firstChild, old);
        bindChart(el.querySelector('[data-wp-fr]'), c.pts, lg, c.o);
        var s2 = el.querySelector('[data-wp-fr] .wp-type'); if (s2) s2.focus();
      });
    });
  }
  global.DehesaWine = { render: render };
})(window);
