/* Dehesa Index — Italia: Borsa Merci di Foggia, precios semanales de trigo duro, sémolas y aceite de oliva (mínimo y máximo de cada sesión).
   data/italy-foggia.json (scripts/update-it-foggia.py; Camera di Commercio di Foggia, CC BY 4.0). Bloque de la ficha de Italia (paises.js itUp). ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Borsa Merci di Foggia: trigo duro y aceite', sub: 'Precios al por mayor de cada sesión de los miércoles (mínimo y máximo), sin IVA, tal como los publica la Cámara de Comercio de Foggia.', grano: 'Trigo duro y sémolas', olio: 'Aceite de oliva',
      last: 'Última sesión', range: 'Mínimo – máximo', vs: 'Hace un año', prod: 'Producto', min: 'Mínimo', max: 'Máximo', none: 'sin cotización desde el {d}', old: 'especificación anterior, hasta el {d}',
      lag: 'La Cámara publica los listados por meses, con uno a tres meses de retraso: la última sesión disponible es del {d}. En verano no cotiza el trigo duro convencional.', spec: 'El trigo duro se separa por su peso específico mínimo: la Borsa cambió las especificaciones en junio de 2024 y no se unen precios de calidades distintas.',
      drop: '{n} valores descartados por erratas evidentes de la fuente (un mínimo mayor que el máximo o un precio muy lejos de las sesiones vecinas).', src: 'Fuente:', srcN: 'Camera di Commercio di Foggia, Borsa Merci (dati.gov.it)', alt: '{n}: mínimo y máximo por sesión' },
    en: { h: 'Borsa Merci di Foggia: durum wheat and olive oil', sub: 'Wholesale prices at each Wednesday session (minimum and maximum), excluding VAT, as published by the Foggia Chamber of Commerce.', grano: 'Durum wheat and semolina', olio: 'Olive oil',
      last: 'Latest session', range: 'Minimum – maximum', vs: 'A year earlier', prod: 'Product', min: 'Minimum', max: 'Maximum', none: 'not quoted since {d}', old: 'previous specification, until {d}',
      lag: 'The Chamber publishes the lists by month, one to three months late: the latest session available is {d}. Conventional durum wheat is not quoted in summer.', spec: 'Durum wheat is split by its minimum specific weight: the exchange changed the specifications in June 2024 and prices of different grades are not joined.',
      drop: '{n} values dropped as obvious source typos (a minimum above the maximum, or a price far from the neighbouring sessions).', src: 'Source:', srcN: 'Camera di Commercio di Foggia, Borsa Merci (dati.gov.it)', alt: '{n}: minimum and maximum per session' },
    fr: { h: 'Borsa Merci de Foggia : blé dur et huile d’olive', sub: 'Prix de gros de chaque séance du mercredi (minimum et maximum), hors TVA, tels que publiés par la Chambre de commerce de Foggia.', grano: 'Blé dur et semoules', olio: 'Huile d’olive',
      last: 'Dernière séance', range: 'Minimum – maximum', vs: 'Il y a un an', prod: 'Produit', min: 'Minimum', max: 'Maximum', none: 'pas de cotation depuis le {d}', old: 'spécification précédente, jusqu’au {d}',
      lag: 'La Chambre publie les cotations par mois, avec un à trois mois de retard : la dernière séance disponible est celle du {d}. Le blé dur conventionnel n’est pas coté l’été.', spec: 'Le blé dur est séparé selon son poids spécifique minimal : la Borsa a changé les spécifications en juin 2024 et on ne raccorde pas des qualités différentes.',
      drop: '{n} valeurs écartées pour coquilles évidentes de la source (un minimum supérieur au maximum ou un prix très éloigné des séances voisines).', src: 'Source :', srcN: 'Camera di Commercio di Foggia, Borsa Merci (dati.gov.it)', alt: '{n} : minimum et maximum par séance' },
    it: { h: 'Borsa Merci di Foggia: grano duro e olio', sub: 'Prezzi all’ingrosso di ogni seduta del mercoledì (minimo e massimo), IVA esclusa, come li pubblica la Camera di Commercio di Foggia.', grano: 'Grano duro e semole', olio: 'Olio d’oliva',
      last: 'Ultima seduta', range: 'Minimo – massimo', vs: 'Un anno prima', prod: 'Prodotto', min: 'Minimo', max: 'Massimo', none: 'non quotato dal {d}', old: 'caratteristiche precedenti, fino al {d}',
      lag: 'La Camera pubblica i listini per mese, con uno-tre mesi di ritardo: l’ultima seduta disponibile è del {d}. D’estate il grano duro convenzionale non è quotato.', spec: 'Il grano duro è distinto per peso specifico minimo: la Borsa ha cambiato le caratteristiche a giugno 2024 e non si uniscono prezzi di qualità diverse.',
      drop: '{n} valori scartati per refusi evidenti della fonte (minimo superiore al massimo o prezzo molto lontano dalle sedute vicine).', src: 'Fonte:', srcN: 'Camera di Commercio di Foggia, Borsa Merci (dati.gov.it)', alt: '{n}: minimo e massimo per seduta' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, CACHE = null, ST = { g: 'grano', sel: null };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, lg, u) { if (v == null) return '—'; var d = u === '€/kg' ? 2 : 0; return v.toLocaleString(LOC[lg], { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function day(d, lg) { try { return new Date(d + 'T00:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return d; } }
  function ago(s, d) { var t = Date.parse(d + 'T00:00:00Z') - 365 * 864e5, best = null, bd = 1e18; s.points.forEach(function (p) { var x = Math.abs(Date.parse(p[0] + 'T00:00:00Z') - t); if (x < bd && x < 21 * 864e5) { bd = x; best = p; } }); return best; }
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/italy-foggia.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE.then(function (D) {
      if (!D || !D.series || !D.series.length) { el.innerHTML = ''; return false; }
      var t = T[lg], S = D.series.filter(function (s) { return s.group === ST.g; });
      var age = function (s) { return (Date.parse(D.lastDate) - Date.parse(s.points[s.points.length - 1][0])) / 864e5; }, state = function (s) { var g = age(s); return g < 40 ? 0 : g < 365 ? 1 : 2; };   /* 0 al día, 1 sin cotización reciente (fuera de campaña), 2 especificación anterior */
      S.sort(function (a, b) { return (state(a) - state(b)) || (a.name < b.name ? -1 : 1); });
      var cur = S.filter(function (s) { return s.id === ST.sel; })[0] || S[0];
      var chip = function (on, g, txt) { return '<button type="button" class="esp-chip' + (on ? ' on' : '') + '" data-fg="' + g + '" aria-pressed="' + on + '">' + esc(txt) + '</button>'; };
      var th = 'padding:6px;font-size:11px;font-weight:700;color:var(--text-faint);text-align:right', td = 'padding:6px;border-top:1px solid var(--border);text-align:right;font-variant-numeric:tabular-nums';
      var rows = S.map(function (s) { var l = s.points[s.points.length - 1], a = ago(s, l[0]), on = s === cur;
        return '<tr data-fs="' + esc(s.id) + '" style="cursor:pointer' + (on ? ';background:var(--surface-2,rgba(0,0,0,.04))' : '') + '"><td style="' + td + ';text-align:left">' + (on ? '▸ ' : '') + esc(s.name) + (state(s) ? ' <span style="color:var(--text-faint);font-size:12px">(' + esc((state(s) === 2 ? t.old : t.none).replace('{d}', day(l[0], lg))) + ')</span>' : '') + '</td><td style="' + td + '">' + esc(day(l[0], lg)) + '</td><td style="' + td + '"><b>' + nf(l[1], lg, s.unit) + ' – ' + nf(l[2], lg, s.unit) + '</b> ' + esc(s.unit) + '</td><td style="' + td + '">' + (a ? nf(a[1], lg, s.unit) + ' – ' + nf(a[2], lg, s.unit) : '—') + '</td></tr>'; }).join('');
      var chart = '';
      if (cur && global.DehesaChart && global.DehesaChart.render) {
        var mk = function (k) { return cur.points.filter(function (p) { return p[k] != null; }).map(function (p) { return { x: Date.parse(p[0] + 'T00:00:00Z'), y: p[k] }; }); };
        chart = global.DehesaChart.render({ series: [{ name: t.max, color: '#8a5a2b', pts: mk(2) }, { name: t.min, color: '#3f6f8f', pts: mk(1) }], xMode: 'time', yTitle: cur.unit, aria: t.alt.replace('{n}', cur.name), zero: false, vFmt: function (v) { return nf(v, lg, cur.unit); } });
      }
      el.innerHTML = '<section class="di-card ps-rm" id="ps-it-foggia" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.sub) + '</p>' +
        '<div class="esp-tabs" role="group" style="margin:0 0 10px">' + chip(ST.g === 'grano', 'grano', '🌾 ' + t.grano) + chip(ST.g === 'olio', 'olio', '🫒 ' + t.olio) + '</div>' +
        '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:520px;font-size:13.5px"><thead><tr><th scope="col" style="' + th + ';text-align:left">' + esc(t.prod) + '</th><th scope="col" style="' + th + '">' + esc(t.last) + '</th><th scope="col" style="' + th + '">' + esc(t.range) + '</th><th scope="col" style="' + th + '">' + esc(t.vs) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        (cur ? '<h3 style="margin:14px 0 4px;font-size:14px">' + esc(cur.name) + ' · ' + esc(cur.unit) + '</h3>' + chart : '') +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.lag.replace('{d}', day(D.lastDate, lg))) + ' ' + esc(t.spec) + (D.dropped && D.dropped.length ? ' ' + esc(t.drop.replace('{n}', D.dropped.length)) : '') + '</p>' +
        '<p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcN) + '</a> (CC BY 4.0)</p></section>';
      Array.prototype.forEach.call(el.querySelectorAll('[data-fg]'), function (b) { b.onclick = function () { ST.g = b.getAttribute('data-fg'); ST.sel = null; mount(el, lg); }; });
      Array.prototype.forEach.call(el.querySelectorAll('[data-fs]'), function (r) { r.onclick = function () { ST.sel = r.getAttribute('data-fs'); mount(el, lg); }; });
      return true;
    });
  }
  global.DIItFoggia = { mount: mount };
})(window);
