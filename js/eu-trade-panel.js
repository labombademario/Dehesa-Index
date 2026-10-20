/* Dehesa Index — panel de comercio agroalimentario de la ficha de país (js/perfil-pais.js): cifras clave, 10 principales destinos y orígenes con variación,
   y gráfico completo del socio elegido. UE: data/eu-extra-trade-stats.json (Eurostat Comext, fuera de la UE). Resto de países: sus series de socios ('partners'). ES5. window.DIEuTrade. */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  var T = {
    es: { h2: 'Comercio agroalimentario: socios principales', sub2: 'Principales destinos y orígenes del comercio agroalimentario. Valores en {u}.', ttm: 'suma de los 12 meses hasta {p}', calc: 'Cálculo de Dehesa Index con las series mensuales de la fuente.', h: 'Comercio agroalimentario con el resto del mundo', sub: 'Productos agroalimentarios (capítulos 01 a 24 del Sistema Armonizado), fuera de la UE. Millones de euros salvo indicación.', exp: 'Exportaciones', imp: 'Importaciones', bal: 'Saldo comercial', bn: 'mil millones de €', yoy: 'frente al año anterior', was: 'en', dest: 'A quién vendemos', orig: 'De quién compramos', hint: 'Pulsa un país para ver su gráfico completo.', top: 'Los 10 principales', of: 'de {a} en {y0} a {b} en {y1}', toE: 'Exportaciones a {c}', fromE: 'Importaciones desde {c}', unit: 'millones de €', src: 'Eurostat · Comext', dl: 'Año', val: 'Valor' },
    en: { h2: 'Agri-food trade: main partners', sub2: 'Main destinations and origins of agri-food trade. Values in {u}.', ttm: 'sum of the 12 months to {p}', calc: 'Calculated by Dehesa Index from the source’s monthly series.', h: 'Agri-food trade with the rest of the world', sub: 'Agri-food products (Harmonised System chapters 01 to 24), outside the EU. Million euro unless stated.', exp: 'Exports', imp: 'Imports', bal: 'Trade balance', bn: 'billion €', yoy: 'versus the previous year', was: 'in', dest: 'Who we sell to', orig: 'Who we buy from', hint: 'Tap a country to see its full chart.', top: 'Top 10', of: 'from {a} in {y0} to {b} in {y1}', toE: 'Exports to {c}', fromE: 'Imports from {c}', unit: 'million €', src: 'Eurostat · Comext', dl: 'Year', val: 'Value' },
    fr: { h2: 'Commerce agroalimentaire : principaux partenaires', sub2: 'Principales destinations et origines du commerce agroalimentaire. Valeurs en {u}.', ttm: 'somme des 12 mois jusqu’à {p}', calc: 'Calcul de Dehesa Index à partir des séries mensuelles de la source.', h: 'Commerce agroalimentaire avec le reste du monde', sub: 'Produits agroalimentaires (chapitres 01 à 24 du Système harmonisé), hors UE. Millions d’euros sauf mention contraire.', exp: 'Exportations', imp: 'Importations', bal: 'Solde commercial', bn: 'milliards d’€', yoy: 'par rapport à l’année précédente', was: 'en', dest: 'À qui nous vendons', orig: 'À qui nous achetons', hint: 'Touchez un pays pour voir son graphique complet.', top: 'Les 10 principaux', of: 'de {a} en {y0} à {b} en {y1}', toE: 'Exportations vers {c}', fromE: 'Importations depuis {c}', unit: 'millions d’€', src: 'Eurostat · Comext', dl: 'Année', val: 'Valeur' },
    it: { h2: 'Commercio agroalimentare: partner principali', sub2: 'Principali destinazioni e origini del commercio agroalimentare. Valori in {u}.', ttm: 'somma dei 12 mesi fino a {p}', calc: 'Calcolo di Dehesa Index dalle serie mensili della fonte.', h: 'Commercio agroalimentare con il resto del mondo', sub: 'Prodotti agroalimentari (capitoli da 01 a 24 del Sistema armonizzato), fuori dall’UE. Milioni di euro salvo diversa indicazione.', exp: 'Esportazioni', imp: 'Importazioni', bal: 'Saldo commerciale', bn: 'miliardi di €', yoy: 'rispetto all’anno prima', was: 'nel', dest: 'A chi vendiamo', orig: 'Da chi compriamo', hint: 'Tocca un paese per vedere il suo grafico completo.', top: 'I primi 10', of: 'da {a} nel {y0} a {b} nel {y1}', toE: 'Esportazioni verso {c}', fromE: 'Importazioni da {c}', unit: 'milioni di €', src: 'Eurostat · Comext', dl: 'Anno', val: 'Valore' }
  };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var DATA = null;
  function load() { if (DATA) return Promise.resolve(DATA); return fetch('data/eu-extra-trade-stats.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { DATA = d && d.countries && d.countries.EU ? d.countries.EU.series : null; return DATA; }).catch(function () { return null; }); }
  function pts(s, cc) { if (s.points) return Promise.resolve(s); if (!global.DISeries || !global.DISeries.series) return Promise.resolve(s); return global.DISeries.series(s.cc || cc, s.id).then(function (f) { s.points = f.points; return s; }).catch(function () { return s; }); }
  function mount(el, lg, o) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es'; o = o || {}; var t = T[lg], cc = o.cc || 'EU', isEU = cc === 'EU';
    return (isEU ? load() : Promise.resolve(o.series || null)).then(function (S) {
      if (!S) return false;
      var by = {}; S.forEach(function (s) { by[s.id] = s; });
      var ptn = function (tag) {
        var l = S.filter(function (s) { return s.group === 'partners' && s.id.indexOf('-' + tag + '-') > -1; }), an = l.filter(function (s) { return s.frequency === 'annual'; }); if (an.length) l = an;
        return l.sort(function (a, b) { return b.latest - a.latest; }).slice(0, 10);
      };
      var rows = { exp: ptn('exp'), imp: ptn('imp') }; if (!rows.exp.length && !rows.imp.length) return false;
      var monthly = !(rows.exp[0] || rows.imp[0]).frequency || (rows.exp[0] || rows.imp[0]).frequency !== 'annual';
      var unit = (rows.exp[0] || rows.imp[0]).unit || '';
      var tot = function (re) { return S.filter(function (s) { return s.group === 'trade' && s.frequency === 'monthly' && re.test(s.label); })[0]; };
      var tE = isEU ? null : tot(/^Exports: agri-food total/i), tI = isEU ? null : tot(/^Imports: agri-food total/i);
      var nf = function (v, d) { return v.toLocaleString(LOC[lg], { minimumFractionDigits: d, maximumFractionDigits: d }); };
      var base = function (s) { return s.label.replace(/^(Exports to|Imports from)\s+/i, '').replace(/:.*$/, ''); };
      var D = global.DIClear;
      var nm = function (s) { var n0 = base(s); return (D && D._country && D._country(n0, lg)) || n0; };
      var fl = function (s) { var f = D && D.flagOf ? D.flagOf(base(s)) : ''; return f ? '<span aria-hidden="true">' + f + '</span> ' : ''; };
      var sel = rows.exp[0] ? 'exp:' + rows.exp[0].id : 'imp:' + rows.imp[0].id;
      var find = function (key) { var p = key.split(':'); return { kind: p[0], s: by[p[1]] }; };
      var chg = function (c) { if (c == null) return ''; var up = c >= 0; return '<span style="color:' + (up ? '#2f6b4a' : '#a8481f') + '">' + (up ? '+' : '−') + nf(Math.abs(c), 1) + ' %</span>'; };
      // cifras clave: UE desde el fichero extra-UE; resto de países, suma de los últimos 12 meses de la serie mensual (con 24 meses de histórico)
      var K = { exp: null, imp: null, bal: null };
      function sum12(s) { var p = s && s.points; if (!p || p.length < 24 || s.unit !== 'EUR million') return null; var n = p.length, a = 0, b = 0, i; for (i = n - 12; i < n; i++) a += p[i][1]; for (i = n - 24; i < n - 12; i++) b += p[i][1]; return { v: a, prev: b, period: p[n - 1][0] }; }
      if (isEU) {
        ['exp', 'imp', 'bal'].forEach(function (k) { var s = by['eu-extra-trade-' + k + '-agrifood']; if (s) K[k] = { v: s.latest, ch: s.changePct, note: null, p20: (s.points.filter(function (q) { return q[0] === '2020'; })[0] || [])[1] }; });
      }
      function kpi(label, k, color, signed) {
        if (!k) return '';
        var v = k.v / 1000, sub = esc(t.bn) + (k.ch != null ? ' · ' + chg(k.ch) + ' ' + esc(t.yoy) : (k.p20 != null ? ' · ' + esc(t.was) + ' 2020: ' + nf(k.p20 / 1000, 1) : '')) + (k.note ? '<br>' + esc(k.note) : '');
        return '<div class="di-card" style="flex:1 1 200px;padding:14px 16px;margin:0"><div style="font-size:13px;color:var(--text-muted)">' + esc(label) + '</div><div style="font-size:28px;font-weight:700;font-variant-numeric:tabular-nums;color:' + color + '">' + (signed && v > 0 ? '+' : '') + nf(v, 1) + '</div><div style="font-size:12.5px;color:var(--text-muted)">' + sub + '</div></div>';
      }
      function list(kind, title, color, track) {
        var l = rows[kind]; if (!l.length) return '';
        var mx = l[0].latest;
        return '<div style="flex:1 1 360px;min-width:0"><div style="font-size:15px;font-weight:700;color:' + color + ';margin-bottom:6px">' + esc(title) + ' <span style="font-weight:500;color:var(--text-muted);font-size:12.5px">· ' + esc(t.top) + ', ' + esc(o.plabel ? o.plabel(l[0].latestPeriod, l[0].frequency) : l[0].latestPeriod) + '</span></div>' + l.map(function (s) {
          var key = kind + ':' + s.id, on = key === sel;
          return '<button type="button" data-et="' + esc(key) + '" aria-pressed="' + (on ? 'true' : 'false') + '" style="display:grid;grid-template-columns:minmax(110px,1.1fr) minmax(60px,2fr) 70px 58px;align-items:center;gap:8px;width:100%;text-align:left;margin:3px 0;padding:6px 8px;min-height:40px;border-radius:8px;cursor:pointer;font:inherit;color:inherit;border:1px solid ' + (on ? 'var(--text)' : 'var(--border)') + ';background:' + (on ? 'var(--surface-2,rgba(0,0,0,.04))' : 'transparent') + '"><span style="font-size:13.5px;font-weight:600">' + fl(s) + esc(nm(s)) + '</span><span style="display:block;height:10px;border-radius:3px;background:' + track + '"><span style="display:block;height:10px;border-radius:3px;background:' + color + ';width:' + Math.max(3, Math.round(s.latest / mx * 100)) + '%"></span></span><b style="font-size:13px;text-align:right;font-variant-numeric:tabular-nums">' + nf(s.latest, s.latest >= 100 ? 0 : 1) + '</b><span style="font-size:12.5px;text-align:right;font-variant-numeric:tabular-nums">' + (monthly ? '' : chg(s.changePct)) + '</span></button>';
        }).join('') + '</div>';
      }
      function chart(key) {
        var f = find(key), s = f.s; if (!s || !s.points || s.points.length < 2) return '';
        var color = f.kind === 'exp' ? '#2f6b4a' : '#a8481f', p = s.points, W = 1000, H = 250, L = 64, R = 12, T0 = 12, B = 28, n = p.length, mx = 0, i;
        p.forEach(function (q) { mx = Math.max(mx, q[1]); }); if (!(mx > 0)) return '';
        var u = Math.pow(10, Math.floor(Math.log(mx) / Math.LN10)), ns = u, ci, cs = [1, 2, 2.5, 5, 10]; for (ci = 0; ci < cs.length; ci++) { ns = cs[ci] * u / 2; if (mx * 1.05 / ns <= 5) break; } var nt = Math.ceil(mx * 1.05 / ns), top = nt * ns;
        var X = function (k) { return L + (W - L - R) * k / (n - 1); }, Y = function (v) { return T0 + (H - T0 - B) * (1 - v / top); };
        var g = '', d = '', st = Math.max(1, Math.ceil(n / 7));
        for (i = 0; i <= nt; i++) { var yv = ns * i, yy = Y(yv); g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '" stroke="currentColor" stroke-opacity=".14"/><text x="' + (L - 6) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".7">' + nf(yv, 0) + '</text>'; }
        for (i = 0; i < n; i++) { d += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p[i][1]).toFixed(1); if ((n - 1 - i) % st === 0) g += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".7">' + esc(monthly ? p[i][0].slice(0, 7) : p[i][0]) + '</text>'; }
        var dots = p.map(function (q, k) { return '<circle cx="' + X(k).toFixed(1) + '" cy="' + Y(q[1]).toFixed(1) + '" r="9" fill="transparent"><title>' + esc(q[0] + ': ' + nf(q[1], 0) + ' ' + (s.unit || unit)) + '</title></circle>'; }).join('');
        var title = (f.kind === 'exp' ? t.toE : t.fromE).replace('{c}', nm(s)), a = p[0], b = p[n - 1];
        return '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;align-items:baseline;margin-bottom:6px"><div style="font-size:16px;font-weight:700">' + esc(title) + '</div><div style="font-size:12.5px;color:var(--text-muted)">' + esc(s.unit || unit) + ' · ' + esc(t.of.replace('{a}', nf(a[1], 0)).replace('{y0}', a[0]).replace('{b}', nf(b[1], 0)).replace('{y1}', b[0])) + '</div></div>' +
          '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(title) + '" style="width:100%;height:auto;display:block">' + g + '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linejoin="round"/>' + dots + '<circle cx="' + X(n - 1).toFixed(1) + '" cy="' + Y(b[1]).toFixed(1) + '" r="5" fill="' + color + '"/></svg>';
      }
      function draw() {
        var kp = kpi(t.exp, K.exp, '#2f6b4a', false) + kpi(t.imp, K.imp, '#a8481f', false) + kpi(t.bal, K.bal, 'inherit', true);
        var f0 = rows.exp[0] || rows.imp[0];
        el.innerHTML = '<div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:4px">' + esc((isEU ? t.h : t.h2).toUpperCase()) + (o.head || '') + '</div><p class="di-movers-hint" style="margin:0 0 12px">' + esc(isEU ? t.sub : t.sub2.replace('{u}', unit)) + '</p>' +
          (kp ? '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:' + (K.exp && !isEU ? '4px' : '16px') + '">' + kp + '</div>' + (!isEU ? '<p class="di-field-hint" style="margin:0 0 14px">' + esc(t.calc) + '</p>' : '') : '') +
          '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(t.hint) + '</p>' +
          '<div style="display:flex;flex-wrap:wrap;gap:22px;align-items:flex-start;margin-bottom:16px">' + list('exp', t.dest, '#2f6b4a', 'rgba(47,107,74,.12)') + list('imp', t.orig, '#a8481f', 'rgba(168,72,31,.12)') + '</div>' +
          '<div class="et-chart">' + chart(sel) + '</div>' + (o.note ? o.note(f0) : '') + '<div class="di-field-hint" style="margin-top:6px">' + (o.cite ? (rows.exp[0] ? o.cite(rows.exp[0]) : '') + (rows.imp[0] && (!rows.exp[0] || rows.imp[0].sourceId !== rows.exp[0].sourceId) ? o.cite(rows.imp[0]) : '') : esc(t.src)) + '</div>';
        var bs = el.querySelectorAll('[data-et]'), i;
        for (i = 0; i < bs.length; i++) bs[i].addEventListener('click', function () { var k = this.getAttribute('data-et'), f = find(k); pts(f.s, cc).then(function () { sel = k; draw(); var nb = el.querySelector('[data-et="' + sel + '"]'); if (nb) nb.focus(); }); });
      }
      var need = [find(sel).s]; if (tE) need.push(tE); if (tI) need.push(tI);
      return Promise.all(need.map(function (s) { return pts(s, cc); })).then(function () {
        if (tE && tI) { var e = sum12(tE), im = sum12(tI); if (e && im) { var note = t.ttm.replace('{p}', e.period); K.exp = { v: e.v, ch: 100 * (e.v / e.prev - 1), note: note }; K.imp = { v: im.v, ch: 100 * (im.v / im.prev - 1), note: note }; K.bal = { v: e.v - im.v, ch: null, p20: null, note: note }; } }
        draw(); return true;
      });
    });
  }
  global.DIEuTrade = { mount: mount };
})(window);
