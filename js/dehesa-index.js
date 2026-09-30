/* Dehesa Index (UE): tarjeta con el índice compuesto. Lee data/dehesa-index.json; sin datos, no pinta nada. */
(function () {
  'use strict';
  var T = {
    es: { title: 'Dehesa Index · UE', hint: 'Índice compuesto, base 100 = oct. 2024', mom: 'vs. mes anterior', yoy: 'vs. hace 12 meses', groups: 'Peso y evolución por grupo', names: { cereales: 'Cereales', ganaderia: 'Ganadería', lacteos: 'Lácteos', pienso: 'Pienso', fertilizantes: 'Fertilizantes', energia: 'Energía' }, note: 'Solo series verificadas. Mide evolución, no es un precio. Mercado UE: EE. UU. y Reino Unido se añadirán cuando tengan historia suficiente.', link: 'Cómo se calcula', period: 'Último mes cerrado: ' },
    en: { title: 'Dehesa Index · EU', hint: 'Composite index, base 100 = Oct 2024', mom: 'vs. previous month', yoy: 'vs. 12 months ago', groups: 'Weight and trend by group', names: { cereales: 'Cereals', ganaderia: 'Livestock', lacteos: 'Dairy', pienso: 'Feed', fertilizantes: 'Fertilisers', energia: 'Energy' }, note: 'Verified series only. It measures evolution, not a price. EU market: US and UK will be added once they have enough history.', link: 'How it is calculated', period: 'Last closed month: ' },
    fr: { title: 'Dehesa Index · UE', hint: 'Indice composite, base 100 = oct. 2024', mom: 'vs. mois précédent', yoy: 'vs. il y a 12 mois', groups: 'Poids et évolution par groupe', names: { cereales: 'Céréales', ganaderia: 'Élevage', lacteos: 'Produits laitiers', pienso: 'Aliments', fertilizantes: 'Engrais', energia: 'Énergie' }, note: 'Séries vérifiées uniquement. Il mesure une évolution, pas un prix. Marché UE : les États-Unis et le Royaume-Uni seront ajoutés avec assez d’historique.', link: 'Méthode de calcul', period: 'Dernier mois clos : ' },
    it: { title: 'Dehesa Index · UE', hint: 'Indice composito, base 100 = ott. 2024', mom: 'vs. mese precedente', yoy: 'vs. 12 mesi fa', groups: 'Peso e andamento per gruppo', names: { cereales: 'Cereali', ganaderia: 'Zootecnia', lacteos: 'Latticini', pienso: 'Mangimi', fertilizantes: 'Fertilizzanti', energia: 'Energia' }, note: 'Solo serie verificate. Misura un andamento, non un prezzo. Mercato UE: USA e Regno Unito saranno aggiunti con storico sufficiente.', link: 'Come si calcola', period: 'Ultimo mese chiuso: ' }
  };
  var DATA = null;
  function pct(v) { return (v > 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + ' %'; }
  function chart(series) {
    var w = 640, h = 180, p = 8, vals = series.map(function (s) { return s.value; });
    var min = Math.min.apply(null, vals) - 2, max = Math.max.apply(null, vals) + 2;
    var pts = series.map(function (s, i) { return (p + i * (w - 2 * p) / (series.length - 1)).toFixed(1) + ',' + (h - p - (s.value - min) / (max - min) * (h - 2 * p)).toFixed(1); }).join(' ');
    var y100 = (h - p - (100 - min) / (max - min) * (h - 2 * p)).toFixed(1);
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="Dehesa Index" style="display:block"><line x1="' + p + '" x2="' + (w - p) + '" y1="' + y100 + '" y2="' + y100 + '" stroke="currentColor" stroke-opacity=".2" stroke-dasharray="4 4"/><polyline fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" points="' + pts + '"/></svg>';
  }
  function render() {
    var el = document.getElementById('home-dehesa-index');
    if (!el || !DATA) return;
    var lang = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es';
    var t = T[lang] || T.es;
    var rows = DATA.groups.map(function (g) {
      var d = g.value - 100;
      return '<div style="display:grid;grid-template-columns:1.4fr .6fr .8fr;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px"><span>' + t.names[g.id] + '</span><span style="text-align:right;color:var(--text-muted)">' + g.weightPct + ' %</span><span style="text-align:right;font-weight:600">' + g.value.toFixed(1).replace('.', ',') + ' <small style="color:var(--text-muted)">(' + pct(d) + ')</small></span></div>';
    }).join('');
    el.innerHTML = '<div class="di-movers-head-row"><h2>' + t.title + '</h2><span class="di-movers-hint">' + t.hint + '</span></div>' +
      '<div class="di-card" style="padding:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px">' +
      '<div><div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap"><span class="di-stat-value" style="font-size:40px">' + DATA.value.toFixed(1).replace('.', ',') + '</span>' +
      '<span style="font-size:13px"><b>' + pct(DATA.changeMoMPct) + '</b> ' + t.mom + '<br><b>' + pct(DATA.changeYoYPct) + '</b> ' + t.yoy + '</span></div>' +
      chart(DATA.series) + '<div class="di-movers-hint" style="margin-top:6px">' + t.period + DATA.lastPeriod + '</div></div>' +
      '<div><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:6px">' + t.groups + '</div>' + rows + '</div></div>' +
      '<p class="di-movers-hint" style="margin-top:10px">' + t.note + ' <a href="data/dehesa-index.json">' + t.link + '</a></p>';
  }
  var box = document.getElementById('home-dehesa-index');
  if (!box) return;
  fetch('data/dehesa-index.json').then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }).then(function (d) {
    if (!d || !d.series || d.series.length < 2) return;
    DATA = d; render();
    var prev = window.DehesaShared.onLangChange;
    window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  }).catch(function () {});
})();
