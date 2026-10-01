/* Perfil de país: resumen de lo que tenemos de cada país (indicadores clave, categorías de datos, socios comerciales, cobertura).
   ES5, sin librerías. Uso: DIProfile.html(cc, country, ctx) devuelve el HTML; ctx = { lang, t, groups, esc, nf, dec, plabel }. */
(function () {
  var FLAG = { ES: '🇪🇸', FR: '🇫🇷', DE: '🇩🇪', BE: '🇧🇪', AT: '🇦🇹', PT: '🇵🇹', DK: '🇩🇰', NL: '🇳🇱', CA: '🇨🇦', AU: '🇦🇺' };
  var T = {
    es: { overview: 'Perfil del país', kpi: 'Indicadores clave', explore: 'Qué puedes explorar', go: 'Explorar', series: 'series', last: 'Último dato', dest: 'Principales destinos', orig: 'Principales orígenes', trade: 'Comercio agroalimentario', from: 'Datos desde', to: 'hasta', sources: 'Fuentes', cover: 'Cobertura', exploreTitle: 'Explorar los datos de', examples: 'Por ejemplo', freq: 'Frecuencias', total: 'series en', cats: 'categorías', yr: 'último año completo', since: 'desde', hint: 'Elige una categoría para filtrar el explorador de abajo.' },
    en: { overview: 'Country profile', kpi: 'Key indicators', explore: 'What you can explore', go: 'Explore', series: 'series', last: 'Latest', dest: 'Main destinations', orig: 'Main origins', trade: 'Agri-food trade', from: 'Data from', to: 'to', sources: 'Sources', cover: 'Coverage', exploreTitle: 'Explore the data for', examples: 'For example', freq: 'Frequencies', total: 'series in', cats: 'categories', yr: 'latest full year', since: 'since', hint: 'Pick a category to filter the explorer below.' },
    fr: { overview: 'Profil du pays', kpi: 'Indicateurs clés', explore: 'Ce que vous pouvez explorer', go: 'Explorer', series: 'séries', last: 'Dernière donnée', dest: 'Principales destinations', orig: 'Principales origines', trade: 'Commerce agroalimentaire', from: 'Données depuis', to: 'jusqu’à', sources: 'Sources', cover: 'Couverture', exploreTitle: 'Explorer les données :', examples: 'Par exemple', freq: 'Fréquences', total: 'séries dans', cats: 'catégories', yr: 'dernière année complète', since: 'depuis', hint: 'Choisissez une catégorie pour filtrer l’explorateur ci-dessous.' },
    it: { overview: 'Profilo del paese', kpi: 'Indicatori chiave', explore: 'Cosa puoi esplorare', go: 'Esplora', series: 'serie', last: 'Ultimo dato', dest: 'Principali destinazioni', orig: 'Principali origini', trade: 'Commercio agroalimentare', from: 'Dati dal', to: 'al', sources: 'Fonti', cover: 'Copertura', exploreTitle: 'Esplora i dati di', examples: 'Ad esempio', freq: 'Frequenze', total: 'serie in', cats: 'categorie', yr: 'ultimo anno completo', since: 'dal', hint: 'Scegli una categoria per filtrare l’esploratore qui sotto.' }
  };
  var KPI_ORDER = ['prices', 'quotes', 'milk', 'prices_lv', 'livestock', 'production', 'crops', 'trade', 'idx_perc', 'income', 'stocks', 'costs'];
  var KEY = /exports?: agri|total|milk|leche|lait|cattle|bovine|beef|wheat|cereal|all goods|agri-food|general|pig|hog/i;
  function yearOf(p) { return parseInt(String(p).slice(0, 4), 10) || 0; }
  function score(s) { return yearOf(s.latestPeriod) * 1000 + Math.min(s.points.length, 500) + (KEY.test(s.label) ? 5000 : 0) + (/^Exports?:? .*(agri-food|farm, fishing)/i.test(s.label) ? 8000 : 0) - (s.changePct == null ? 300 : 0); }
  function spark(s) {
    var pts = s.points.slice(-36).map(function (p) { return p[1]; }), mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts), w = 96, h = 28, rg = mx - mn || 1;
    var d = pts.map(function (v, i) { return (i / Math.max(pts.length - 1, 1) * w).toFixed(1) + ',' + (h - 2 - (v - mn) / rg * (h - 4)).toFixed(1); }).join(' ');
    var up = pts[pts.length - 1] >= pts[0];
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline fill="none" stroke="' + (up ? '#2f6b4a' : '#a33') + '" stroke-width="1.6" points="' + d + '"/></svg>';
  }
  function html(cc, c, x) {
    var t = T[x.lang] || T.es, esc = x.esc, nf = x.nf, S = c.series, groups = {}, i;
    S.forEach(function (s) { (groups[s.group] = groups[s.group] || []).push(s); });
    var gk = x.groups.filter(function (g) { return g !== 'all' && groups[g]; });
    var minP = null, maxP = null, freqs = {}, srcs = {};
    S.forEach(function (s) {
      var a = s.points[0][0], b = s.latestPeriod;
      if (minP == null || a < minP) minP = a; if (maxP == null || b > maxP) maxP = b;
      freqs[s.frequency] = (freqs[s.frequency] || 0) + 1;
    });
    var srcList = (c.sources || []).slice(0, 5);
    // cabecera
    var h = '<section class="di-card" style="padding:18px 20px;margin:0 0 18px"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span style="font-size:34px;line-height:1" aria-hidden="true">' + (FLAG[cc] || '') + '</span><div style="flex:1;min-width:200px"><div style="font-size:11px;font-weight:700;letter-spacing:.5px;color:var(--text-faint)">' + esc(t.overview.toUpperCase()) + '</div><h2 style="margin:2px 0 0;font-size:24px">' + esc(x.t.countries[cc] || c.name) + '</h2></div>' +
      '<div style="font-size:13px;color:var(--text-muted);text-align:right"><b>' + S.length + '</b> ' + t.total + ' <b>' + gk.length + '</b> ' + t.cats + '<br>' + esc(t.from) + ' ' + esc(x.plabel(minP, 'annual')) + ' ' + t.to + ' ' + esc(x.plabel(maxP, /^\d{4}-\d{2}$/.test(maxP) ? 'monthly' : 'annual')) + '</div></div>';
    h += '<div style="margin-top:10px;font-size:12.5px;color:var(--text-muted)">' + esc(t.freq) + ': ' + Object.keys(freqs).map(function (k) { return freqs[k] + ' ' + esc((x.t.freq && x.t.freq[k]) || k); }).join(' · ') + (srcList.length ? '<br>' + esc(t.sources) + ': ' + srcList.map(esc).join(' · ') : '') + '</div></section>';
    // KPIs
    var kp = [];
    KPI_ORDER.forEach(function (g) { if (kp.length < 6 && groups[g]) { var best = groups[g].filter(function (s) { return s.points.length >= 6; }).sort(function (a, b) { return score(b) - score(a); })[0]; if (best) kp.push(best); } });
    if (kp.length) {
      h += '<div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin:0 0 8px">' + esc(t.kpi.toUpperCase()) + '</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin-bottom:20px">';
      kp.forEach(function (s) {
        var ch = s.changePct, col = ch == null ? 'inherit' : ch >= 0 ? '#2f6b4a' : '#a33';
        h += '<button type="button" class="di-card" data-ps="' + esc(s.id) + '" style="text-align:left;padding:12px 14px;cursor:pointer;border:1px solid var(--border);font:inherit;color:inherit"><div style="font-size:11px;color:var(--text-faint);min-height:30px">' + esc((x.t[s.group] || s.group)) + '</div><div style="font-size:12.5px;font-weight:600;line-height:1.3;min-height:34px">' + esc(s.label.replace(/\s*\((monthly|quarterly|annual|weekly|half-year)[^)]*\)$/i, '')) + '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:6px"><div><div style="font-size:20px;font-weight:700;font-variant-numeric:tabular-nums">' + nf(s.latest, x.dec(s.latest)) + '</div><div style="font-size:11px;color:var(--text-muted)">' + esc(s.unit) + '</div></div>' + spark(s) + '</div>' +
          '<div style="font-size:11.5px;margin-top:4px;color:var(--text-muted)">' + esc(x.plabel(s.latestPeriod, s.frequency)) + (ch == null ? '' : ' · <span style="color:' + col + '">' + (ch > 0 ? '+' : ch < 0 ? '−' : '') + nf(Math.abs(ch), 1) + ' %</span>') + '</div></button>';
      });
      h += '</div>';
    }
    // comercio: socios
    var pt = groups.partners || [];
    if (pt.length) {
      var side = function (tag, title) {
        var l = pt.filter(function (s) { return s.id.indexOf('-' + tag + '-') > -1; }), an = l.filter(function (s) { return s.frequency === 'annual'; }); if (an.length) l = an;
        l = l.sort(function (a, b) { return b.latest - a.latest; }).slice(0, 4);
        if (!l.length) return '';
        var tot = l.reduce(function (m, s) { return Math.max(m, s.latest); }, 0);
        return '<div style="flex:1;min-width:230px"><div style="font-size:12px;font-weight:700;margin-bottom:6px">' + esc(title) + ' <span style="font-weight:500;color:var(--text-muted)">· ' + esc(l[0].unit) + ', ' + esc(x.plabel(l[0].latestPeriod, l[0].frequency)) + '</span></div>' +
          l.map(function (s) { var nm = s.label.replace(/^(Exports to|Imports from)\s+/i, '').replace(/:.*$/, ''); return '<div style="font-size:13px;margin:5px 0"><div style="display:flex;justify-content:space-between"><span>' + esc(nm) + '</span><b style="font-variant-numeric:tabular-nums">' + nf(s.latest, x.dec(s.latest)) + '</b></div><div style="height:4px;border-radius:3px;background:#2f6b4a;opacity:.75;width:' + Math.max(3, Math.round(s.latest / tot * 100)) + '%"></div></div>'; }).join('') + '</div>';
      };
      var a = side('exp', t.dest), b = side('imp', t.orig);
      if (a || b) h += '<div class="di-card" style="padding:14px 18px;margin-bottom:20px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:10px">' + esc(t.trade.toUpperCase()) + '</div><div style="display:flex;gap:26px;flex-wrap:wrap">' + a + b + '</div></div>';
    }
    // categorías
    h += '<div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin:0 0 4px">' + esc(t.explore.toUpperCase()) + '</div><div class="di-movers-hint" style="margin:0 0 8px">' + esc(t.hint) + '</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-bottom:22px">';
    gk.forEach(function (g) {
      var l = groups[g].slice().sort(function (a, b) { return score(b) - score(a); }), last = l.reduce(function (m, s) { return s.latestPeriod > m ? s.latestPeriod : m; }, '');
      var ex = l.slice(0, 2).map(function (s) { return s.label.replace(/\s*\((monthly|quarterly|annual|weekly|half-year)[^)]*\)$/i, ''); });
      h += '<button type="button" class="di-card" data-pg="' + esc(g) + '" style="text-align:left;padding:12px 14px;cursor:pointer;border:1px solid var(--border);font:inherit;color:inherit"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:14px">' + esc(x.t[g] || g) + '</b><span style="font-size:12px;color:var(--text-muted);white-space:nowrap">' + l.length + ' ' + t.series + '</span></div>' +
        '<div style="font-size:11.5px;color:var(--text-muted);margin:3px 0 6px">' + esc(t.last) + ': ' + esc(x.plabel(last, /^\d{4}-\d{2}$/.test(last) ? 'monthly' : 'annual')) + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);line-height:1.4">' + esc(t.examples) + ': ' + ex.map(function (e) { return esc(e.length > 46 ? e.slice(0, 44) + '…' : e); }).join(' · ') + '</div>' +
        '<div style="font-size:12px;font-weight:700;color:#2f6b4a;margin-top:8px">' + esc(t.go) + ' →</div></button>';
    });
    h += '</div><h2 id="ps-explorer" style="margin:6px 0 12px;font-size:19px">' + esc(t.exploreTitle) + ' ' + esc(x.t.countries[cc] || c.name) + '</h2>';
    return h;
  }
  window.DIProfile = { html: html };
})();
