/* Dehesa Index (UE): tarjeta con el índice compuesto. Lee data/dehesa-index.json; sin datos, no pinta nada. */
(function () {
  'use strict';
  var T = {
    es: { regions: { eu: 'UE', us: 'EE. UU.', ca: 'Canadá' }, pick: 'Mercado', caNote: 'Canadá: sin grupos de pienso, fertilizantes ni energía (no hay series verificadas con historia suficiente), por eso el resto de pesos se reescala. Los precios son al productor, en dólares canadienses, de Statistics Canada, que publica con unos dos meses de retraso: el último mes es el último con dato de todas las series.', usNote: 'EE. UU.: sin grupo de fertilizantes (no hay serie verificada y la urea de DTN no tiene licencia pública), por eso el resto de pesos se reescala. Cordero no tiene serie mensual de NASS y se usa petróleo WTI en lugar de Brent. Fuentes: USDA NASS, USDA AMS y EIA.', yTitle: 'Índice (base 100)', xTitle: 'Mes', title: 'Dehesa Index · UE', hint: 'Índice compuesto, base 100 = oct. 2024', mom: 'vs. mes anterior', yoy: 'vs. hace 12 meses', groups: 'Peso y evolución por grupo', names: { cereales: 'Cereales', ganaderia: 'Ganadería', lacteos: 'Lácteos', pienso: 'Pienso', fertilizantes: 'Fertilizantes', energia: 'Energía' }, note: 'Solo series verificadas. Mide evolución, no es un precio. Hay un índice por mercado (UE, EE. UU. y Canadá); el Reino Unido se añadirá cuando tenga historia suficiente.', link: 'Cómo se calcula', custom: 'Crea tu propio índice', customHint: 'Ajusta el peso de cada grupo (0 lo excluye). Se compara con el índice oficial.', mine: 'Tu índice', official: 'Oficial', reset: 'Restablecer', allZero: 'Pon peso a al menos un grupo.', period: 'Último mes cerrado: ' },
    en: { regions: { eu: 'EU', us: 'US', ca: 'Canada' }, pick: 'Market', caNote: 'Canada: no feed, fertiliser or energy groups (there are no verified series with enough history), so the other weights are rescaled. Prices are farm-gate, in Canadian dollars, from Statistics Canada, which publishes about two months late: the last month is the latest with data for every series.', usNote: 'US: no fertiliser group (there is no verified series and DTN urea has no public licence), so the other weights are rescaled. Lamb has no monthly NASS series and WTI crude replaces Brent. Sources: USDA NASS, USDA AMS and EIA.', yTitle: 'Index (base 100)', xTitle: 'Month', title: 'Dehesa Index · EU', hint: 'Composite index, base 100 = Oct 2024', mom: 'vs. previous month', yoy: 'vs. 12 months ago', groups: 'Weight and trend by group', names: { cereales: 'Cereals', ganaderia: 'Livestock', lacteos: 'Dairy', pienso: 'Feed', fertilizantes: 'Fertilisers', energia: 'Energy' }, note: 'Verified series only. It measures evolution, not a price. There is one index per market (EU, US and Canada); the UK will be added once it has enough history.', link: 'How it is calculated', custom: 'Build your own index', customHint: 'Adjust each group weight (0 excludes it). Compared with the official index.', mine: 'Your index', official: 'Official', reset: 'Reset', allZero: 'Give weight to at least one group.', period: 'Last closed month: ' },
    fr: { regions: { eu: 'UE', us: 'États-Unis', ca: 'Canada' }, pick: 'Marché', caNote: 'Canada : pas de groupes aliments du bétail, engrais ni énergie (aucune série vérifiée avec assez d’historique), les autres pondérations sont donc rééchelonnées. Les prix sont départ ferme, en dollars canadiens, de Statistique Canada, qui publie avec environ deux mois de retard : le dernier mois est le dernier disposant de données pour toutes les séries.', usNote: 'États-Unis : pas de groupe engrais (aucune série vérifiée et l’urée DTN n’a pas de licence publique), les autres poids sont donc redimensionnés. L’agneau n’a pas de série mensuelle NASS et le WTI remplace le Brent. Sources : USDA NASS, USDA AMS et EIA.', yTitle: 'Indice (base 100)', xTitle: 'Mois', title: 'Dehesa Index · UE', hint: 'Indice composite, base 100 = oct. 2024', mom: 'vs. mois précédent', yoy: 'vs. il y a 12 mois', groups: 'Poids et évolution par groupe', names: { cereales: 'Céréales', ganaderia: 'Élevage', lacteos: 'Produits laitiers', pienso: 'Aliments', fertilizantes: 'Engrais', energia: 'Énergie' }, note: 'Séries vérifiées uniquement. Il mesure une évolution, pas un prix. Un indice par marché (UE, États-Unis et Canada) ; le Royaume-Uni sera ajouté avec assez d’historique.', link: 'Méthode de calcul', custom: 'Créez votre indice', customHint: 'Réglez le poids de chaque groupe (0 l’exclut). Comparé à l’indice officiel.', mine: 'Votre indice', official: 'Officiel', reset: 'Réinitialiser', allZero: 'Donnez du poids à au moins un groupe.', period: 'Dernier mois clos : ' },
    it: { regions: { eu: 'UE', us: 'Stati Uniti', ca: 'Canada' }, pick: 'Mercato', caNote: 'Canada: nessun gruppo mangimi, fertilizzanti o energia (nessuna serie verificata con storia sufficiente), quindi gli altri pesi sono riscalati. I prezzi sono alla produzione, in dollari canadesi, di Statistics Canada, che pubblica con circa due mesi di ritardo: l’ultimo mese è l’ultimo con dati per tutte le serie.', usNote: 'Stati Uniti: nessun gruppo fertilizzanti (nessuna serie verificata e l’urea DTN non ha licenza pubblica), quindi gli altri pesi sono riscalati. L’agnello non ha serie mensile NASS e il WTI sostituisce il Brent. Fonti: USDA NASS, USDA AMS ed EIA.', yTitle: 'Indice (base 100)', xTitle: 'Mese', title: 'Dehesa Index · UE', hint: 'Indice composito, base 100 = ott. 2024', mom: 'vs. mese precedente', yoy: 'vs. 12 mesi fa', groups: 'Peso e andamento per gruppo', names: { cereales: 'Cereali', ganaderia: 'Zootecnia', lacteos: 'Latticini', pienso: 'Mangimi', fertilizantes: 'Fertilizzanti', energia: 'Energia' }, note: 'Solo serie verificate. Misura un andamento, non un prezzo. Un indice per mercato (UE, Stati Uniti e Canada); il Regno Unito sarà aggiunto con storico sufficiente.', link: 'Come si calcola', custom: 'Crea il tuo indice', customHint: 'Regola il peso di ogni gruppo (0 lo esclude). Confrontato con l’indice ufficiale.', mine: 'Il tuo indice', official: 'Ufficiale', reset: 'Ripristina', allZero: 'Assegna peso ad almeno un gruppo.', period: 'Ultimo mese chiuso: ' }
  };
  var DATA = null, DS = {}, REG = 'eu';
  function pct(v) { return (v > 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + ' %'; }
  function chart(series, other) {
    var lg = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es', t = T[lg] || T.es;
    var w = 640, h = 230, L = 62, R = 14, Tp = 10, B = 48, n = series.length;
    var vals = series.map(function (s) { return s.value; }).concat(other ? other.map(function (s) { return s.value; }) : []);
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var steps = [0.5, 1, 2, 5, 10, 20, 50], step = 50, i;
    for (i = 0; i < steps.length; i++) { if ((max - min) / steps[i] <= 4) { step = steps[i]; break; } }
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    var dec = step < 1 ? 1 : 0;
    function nf(v, d) { try { return v.toLocaleString(lg, { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d).replace('.', ','); } }
    function X(k) { return L + k * (w - L - R) / (n - 1); }
    function Y(v) { return Tp + (hi - v) / (hi - lo) * (h - Tp - B); }
    function mon(period) { var m = /^(\d{4})-(\d\d)$/.exec(period); return m ? (window.DehesaChart ? window.DehesaChart.fmtMonth(Date.UTC(+m[1], +m[2] - 1, 1)) : period) : period; }
    var TX = 'font-size="11.5" fill="currentColor" fill-opacity=".65"', g = '', v;
    for (v = lo; v <= hi + step / 1000; v += step) g += '<line x1="' + L + '" x2="' + (w - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="currentColor" stroke-opacity=".1"/><text x="' + (L - 7) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" ' + TX + '>' + nf(v, dec) + '</text>';
    var y100 = Y(100).toFixed(1);
    g += '<line x1="' + L + '" x2="' + (w - R) + '" y1="' + y100 + '" y2="' + y100 + '" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="4 4"/>';
    var seen = {};
    [0, 1, 2, 3, 4].forEach(function (j) {
      var k = Math.round(j * (n - 1) / 4); if (seen[k]) return; seen[k] = 1;
      g += '<line x1="' + X(k).toFixed(1) + '" x2="' + X(k).toFixed(1) + '" y1="' + (h - B) + '" y2="' + (h - B + 4) + '" stroke="currentColor" stroke-opacity=".3"/><text x="' + X(k).toFixed(1) + '" y="' + (h - B + 17) + '" text-anchor="' + (j === 0 ? 'start' : j === 4 ? 'end' : 'middle') + '" ' + TX + '>' + mon(series[k].period) + '</text>';
    });
    g += '<text x="' + ((L + w - R) / 2) + '" y="' + (h - 6) + '" text-anchor="middle" ' + TX + ' font-weight="600">' + t.xTitle + '</text><text transform="translate(13 ' + ((Tp + h - B) / 2) + ') rotate(-90)" text-anchor="middle" ' + TX + ' font-weight="600">' + t.yTitle + '</text>';
    function line(arr) { return arr.map(function (s, k) { return X(k).toFixed(1) + ',' + Y(s.value).toFixed(1); }).join(' '); }
    function ser(arr, name, c) { return { n: name, c: c, p: arr.map(function (s, k) { return [+X(k).toFixed(1), +Y(s.value).toFixed(1), nf(s.value, 1), mon(s.period), s.value]; }) }; }
    var spec = { L: L, R: w - R, T: Tp, B: h - B, s: other ? [ser(series, t.official, '#8a8578'), ser(other, t.mine, 'var(--accent)')] : [ser(series, 'Dehesa Index', 'var(--accent)')] };
    var dh = window.DehesaChart ? window.DehesaChart.attr(spec) : '';
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="Dehesa Index" style="display:block;touch-action:pan-y"' + dh.replace(' style="touch-action:pan-y"', '') + '>' + g + '<polyline fill="none" stroke="' + (other ? 'currentColor' : 'var(--accent)') + '" stroke-opacity="' + (other ? '.45' : '1') + '" stroke-width="2" stroke-linejoin="round" points="' + line(series) + '"/>' + (other ? '<polyline fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" points="' + line(other) + '"/>' : '') + '</svg>';
  }
  function derivedCite() {
    var Q = window.DICite; if (!Q || !DATA || !DATA.included) return '';
    var seen = {}, ids = []; DATA.included.forEach(function (x) { if (x.sourceId && !seen[x.sourceId]) { seen[x.sourceId] = 1; ids.push(x.sourceId); } });
    return Q.derived(ids, { what: DATA.methodology ? (DATA.methodology[window.DehesaShared.getLang()] || DATA.methodology.es || '') : '' });
  }
  function render() {
    var el = document.getElementById('home-dehesa-index');
    if (!el || !DATA) return;
    var lang = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es';
    var t = T[lang] || T.es;
    var rows = DATA.groups.map(function (g) {
      var d = g.value - 100;
      return '<div style="display:grid;grid-template-columns:1.4fr .6fr .8fr;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px"><span>' + t.names[g.id] + '</span><span style="text-align:right;color:var(--text-muted)">' + String(Math.round(g.weightPct * 10) / 10).replace('.', ',') + ' %</span><span style="text-align:right;font-weight:600">' + g.value.toFixed(1).replace('.', ',') + ' <small style="color:var(--text-muted)">(' + pct(d) + ')</small></span></div>';
    }).join('');
    el.innerHTML = '<div class="di-movers-head-row"><h2>Dehesa Index · ' + t.regions[REG] + '</h2><label style="font-size:13px;margin-left:12px"><span class="di-sr-only" style="position:absolute;left:-9999px">' + t.pick + '</span><select id="dix-region" class="di-compare-select" aria-label="' + t.pick + '" style="min-width:120px">' + Object.keys(DS).map(function (k) { return '<option value="' + k + '"' + (k === REG ? ' selected' : '') + '>' + t.regions[k] + '</option>'; }).join('') + '</select></label><span class="di-movers-hint">' + t.hint + '</span></div>' +
      '<div class="di-card" style="padding:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px">' +
      '<div><div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap"><span class="di-stat-value" style="font-size:40px">' + DATA.value.toFixed(1).replace('.', ',') + '</span>' +
      '<span style="font-size:13px"><b>' + pct(DATA.changeMoMPct) + '</b> ' + t.mom + '<br><b>' + pct(DATA.changeYoYPct) + '</b> ' + t.yoy + '</span></div>' +
      chart(DATA.series) + '<div class="di-movers-hint" style="margin-top:6px">' + t.period + DATA.lastPeriod + '</div></div>' +
      '<div><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:6px">' + t.groups + '</div>' + rows + '</div></div>' +
      '<p class="di-movers-hint" style="margin-top:10px">' + (REG === 'us' ? t.usNote + ' ' : REG === 'ca' ? t.caNote + ' ' : '') + t.note + ' <a href="metodologia.html#indice">' + t.link + '</a></p>' + derivedCite() +
      '<details id="dix-custom" style="margin-top:18px"' + (document.getElementById('dix-custom') && document.getElementById('dix-custom').open ? ' open' : '') + '><summary style="cursor:pointer;font-weight:600">' + t.custom + '</summary><p class="di-movers-hint" style="margin:8px 0 12px">' + t.customHint + '</p><div class="di-card" style="padding:20px" id="dix-custom-body"></div></details>';
    var rs = document.getElementById('dix-region'); if (rs) rs.onchange = function () { REG = rs.value; DATA = DS[REG]; W = null; try { var u = new URL(location.href); if (REG === 'eu') u.searchParams.delete('ix'); else u.searchParams.set('ix', REG); history.replaceState(null, '', u.toString()); } catch (e) {} render(); };
    renderCustom();
  }
  var W = null;
  function customSeries() {
    var sum = 0; Object.keys(W).forEach(function (k) { sum += W[k]; });
    if (!sum) return null;
    return DATA.series.map(function (s) { var v = 0; Object.keys(W).forEach(function (k) { v += W[k] * s.groups[k]; }); return { period: s.period, value: v / sum }; });
  }
  function fmt(v) { return v.toFixed(1).replace('.', ','); }
  function resultHtml(t) {
    var cs = customSeries();
    if (!cs) return '<p class="di-movers-hint">' + t.allZero + '</p>';
    var c = cs[cs.length - 1].value, pv = cs[cs.length - 2].value, yv = cs[cs.length - 13];
    return '<div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap"><span class="di-stat-value" style="font-size:32px">' + fmt(c) + '</span><span style="font-size:13px"><b>' + pct(100 * (c / pv - 1)) + '</b> ' + t.mom + (yv ? '<br><b>' + pct(100 * (c / yv.value - 1)) + '</b> ' + t.yoy : '') + '</span></div>' + chart(DATA.series, cs) +
      '<div class="di-movers-hint" style="margin-top:6px"><b style="color:var(--accent)">━</b> ' + t.mine + ' &nbsp; <b style="opacity:.45">━</b> ' + t.official + '</div>';
  }
  function renderCustom() {
    var host = document.getElementById('dix-custom-body'); if (!host || !DATA) return;
    var lang = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es';
    var t = T[lang] || T.es;
    if (!W) { W = {}; DATA.groups.forEach(function (g) { W[g.id] = g.weightPct; }); }
    var inputs = DATA.groups.map(function (g) {
      return '<label style="display:grid;grid-template-columns:1.2fr 2fr 40px;gap:8px;align-items:center;font-size:13px;padding:4px 0"><span>' + t.names[g.id] + '</span><input type="range" min="0" max="100" step="5" data-g="' + g.id + '" value="' + W[g.id] + '"><span style="text-align:right;font-weight:600">' + W[g.id] + '</span></label>';
    }).join('');
    var res = resultHtml(t);
    host.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px"><div>' + inputs + '<button type="button" id="dix-reset" class="di-link-btn" style="margin-top:8px">' + t.reset + '</button></div><div id="dix-res">' + res + '</div></div>';
    Array.prototype.forEach.call(host.querySelectorAll('input[data-g]'), function (i) { i.oninput = function () { W[i.getAttribute('data-g')] = Number(i.value); i.nextSibling.textContent = i.value; var r = document.getElementById('dix-res'); if (r) r.innerHTML = resultHtml(t); }; });
    var rb = document.getElementById('dix-reset'); if (rb) rb.onclick = function () { W = null; renderCustom(); };
  }
  var box = document.getElementById('home-dehesa-index');
  if (!box) return;
  function load(f) { return fetch(f).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  Promise.all([load('data/dehesa-index.json'), load('data/dehesa-index-us.json'), load('data/dehesa-index-ca.json'), (window.DICite ? window.DICite.load() : null)]).then(function (a) {
    [['eu', a[0]], ['us', a[1]], ['ca', a[2]]].forEach(function (x) { if (x[1] && x[1].series && x[1].series.length > 1) DS[x[0]] = x[1]; });
    if (!DS.eu) return;
    var q = ''; try { q = new URLSearchParams(location.search).get('ix') || ''; } catch (e) {}
    REG = DS[q] ? q : 'eu'; DATA = DS[REG]; render();
    var prev = window.DehesaShared.onLangChange;
    window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  });
})();
