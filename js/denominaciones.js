/* Dehesa Index — Denominaciones de origen de vinos y quesos de un país (registro eAmbrosia de la Comisión Europea; data/gi/<CC>.json). ES5.
   Solo lo que publica el registro: nombre protegido, DOP/IGP, año de protección en la UE y enlace al texto legal. Sin región (la fuente no la da). */
(function () {
  'use strict';
  var T = {
    es: { sum: '{w} vinos · {c} quesos', mapH: 'Dónde está cada región', mapN: 'Nº de denominaciones por región; pulsa una para filtrar.', noMap: 'La fuente (registro de la UE) no publica la zona geográfica de cada denominación; el mapa solo existe para los países con zonas publicadas por su organismo oficial.', reg: 'Región', allr: 'Todas las regiones', regNote: 'Región según: ', partial: 'Solo hay región para las zonas con listado abierto; una denominación puede tener zona también en otras regiones.', h: 'Denominaciones de origen', sub: 'Vinos y quesos con nombre protegido en la UE (registradas y vigentes).', wine: 'Vinos', cheese: 'Quesos', all: 'Todas', PDO: 'DOP', PGI: 'IGP', GI: 'IG', more: 'Ver las {n}', less: 'Ver menos', none: 'Sin denominaciones registradas.', since: 'protegida desde', src: 'Fuente: © Unión Europea, eAmbrosia (registro de indicaciones geográficas de la UE), CC BY 4.0.', legal: 'Texto legal', hint: 'DOP: vínculo más estrecho con la zona (queso: todo el proceso; vino: toda la uva). IGP: vínculo más flexible (queso: al menos una fase; vino: al menos el 85 % de la uva).', search: 'Buscar' },
    en: { sum: '{w} wines · {c} cheeses', mapH: 'Where each region is', mapN: 'Number of designations per region; click one to filter.', noMap: 'The source (EU register) does not publish the geographic area of each designation; the map only exists for countries whose official body publishes areas.', reg: 'Region', allr: 'All regions', regNote: 'Region according to: ', partial: 'Regions are only shown where an open list exists; a designation can also have area in other regions.', h: 'Designations of origin', sub: 'Wines and cheeses with a name protected in the EU (registered and in force).', wine: 'Wines', cheese: 'Cheeses', all: 'All', PDO: 'PDO', PGI: 'PGI', GI: 'GI', more: 'Show all {n}', less: 'Show less', none: 'No registered designations.', since: 'protected since', src: 'Source: © European Union, eAmbrosia (EU geographical indications register), CC BY 4.0.', legal: 'Legal text', hint: 'PDO: closest link to the area (cheese: the whole process; wine: all the grapes). PGI: looser link (cheese: at least one stage; wine: at least 85% of the grapes).', search: 'Search' },
    fr: { sum: '{w} vins · {c} fromages', mapH: 'Où se trouve chaque région', mapN: 'Nombre d’appellations par région ; cliquez pour filtrer.', noMap: 'La source (registre de l’UE) ne publie pas l’aire géographique de chaque appellation ; la carte n’existe que pour les pays dont l’organisme officiel publie les aires.', reg: 'Région', allr: 'Toutes les régions', regNote: 'Région selon : ', partial: 'La région n’est indiquée que là où une liste ouverte existe ; une appellation peut aussi avoir une aire dans d’autres régions.', h: 'Appellations d’origine', sub: 'Vins et fromages dont le nom est protégé dans l’UE (enregistrés et en vigueur).', wine: 'Vins', cheese: 'Fromages', all: 'Toutes', PDO: 'AOP', PGI: 'IGP', GI: 'IG', more: 'Voir les {n}', less: 'Voir moins', none: 'Aucune appellation enregistrée.', since: 'protégée depuis', src: 'Source : © Union européenne, eAmbrosia (registre des indications géographiques de l’UE), CC BY 4.0.', legal: 'Texte juridique', hint: 'AOP : lien le plus étroit avec la zone (fromage : tout le processus ; vin : tout le raisin). IGP : lien plus souple (fromage : au moins une étape ; vin : au moins 85 % du raisin).', search: 'Rechercher' },
    it: { sum: '{w} vini · {c} formaggi', mapH: 'Dove si trova ogni regione', mapN: 'Numero di denominazioni per regione; clicca per filtrare.', noMap: 'La fonte (registro UE) non pubblica la zona geografica di ogni denominazione; la mappa esiste solo per i paesi il cui ente ufficiale pubblica le aree.', reg: 'Regione', allr: 'Tutte le regioni', regNote: 'Regione secondo: ', partial: 'La regione è indicata solo dove esiste un elenco aperto; una denominazione può avere zona anche in altre regioni.', h: 'Denominazioni di origine', sub: 'Vini e formaggi con nome protetto nell’UE (registrate e in vigore).', wine: 'Vini', cheese: 'Formaggi', all: 'Tutte', PDO: 'DOP', PGI: 'IGP', GI: 'IG', more: 'Vedi tutte le {n}', less: 'Vedi meno', none: 'Nessuna denominazione registrata.', since: 'protetta dal', src: 'Fonte: © Unione europea, eAmbrosia (registro delle indicazioni geografiche dell’UE), CC BY 4.0.', legal: 'Testo giuridico', hint: 'DOP: legame più stretto con la zona (formaggio: tutto il processo; vino: tutte le uve). IGP: legame più flessibile (formaggio: almeno una fase; vino: almeno l’85 % delle uve).', search: 'Cerca' }
  };
  var SHOW = 24;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function norm(s) { return String(s).toLowerCase().normalize ? String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') : String(s).toLowerCase(); }
  function mount(el, cc, lg) {
    if (!el) return;
    var t = T[lg] || T.es;
    var GEOCC = { ES: 1, PT: 1, UK: 1, CZ: 1, AT: 1, BE: 1, BG: 1, HR: 1, DE: 1, EL: 1, HU: 1, NL: 1, RO: 1, SK: 1, SI: 1 };
    var pre = cc === 'FR' || GEOCC[cc] ? new Promise(function (ok) { var sc = document.createElement('script'); sc.src = 'js/gi-zone.js?v=20261015'; sc.onload = function () { (cc === 'FR' ? window.GIZ.info() : window.GIZ.geoInfo(cc)).then(ok); }; sc.onerror = function () { ok(null); }; document.head.appendChild(sc); }) : Promise.resolve(null);
    // primero el indice: solo se pide el fichero del pais si existe (sin 404 para AR, AU, CA, CH, CL, EU, FI...)
    var IDX = window.__giIdx || (window.__giIdx = fetch('data/gi/index.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }));
    Promise.all([IDX.then(function (ix) { if (ix && ix.countries && !ix.countries[cc]) return null; return fetch('data/gi/' + cc + '.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }), pre]).then(function (rr) {
      var d = rr[0], inao = rr[1], zset = {}; if (inao && inao.z) inao.z.forEach(function (f) { zset[f] = 1; });
      if (!d || (!d.wine.length && !d.cheese.length)) { el.innerHTML = ''; return; }
      var st = { k: d.wine.length ? 'wine' : 'cheese', ty: 'all', q: '', open: false, r: '', det: false, zf: '' }, gnames = {}; d.wine.forEach(function (e) { gnames[e.f] = e.n.join(' / '); });
      var N3 = !!(d.regionSource && d.regionSource.map === 'nuts3'), MAPK = N3 ? 'DEHESA_NUTS3_' + cc : 'DEHESA_' + cc + '_REGIONS';
      var hasR = d.wine.concat(d.cheese).some(function (e) { return e.r && e.r.length; });
      var RN = function (r) { if (N3) { var M3 = window[MAPK], x3 = M3 && M3.states.filter(function (z) { return z.id === r; })[0]; return x3 ? x3.name : r; } var N = window.DehesaRegionNames && window.DehesaRegionNames[cc], v = N && N[r]; return v ? v.split('|')[{ en: 0, es: 1, fr: 2, it: 3 }[lg] || 0] : r; };
      function list() {
        var L = d[st.k].filter(function (e) { return (st.ty === 'all' || e.t === st.ty) && (!st.zf || e.f === st.zf) && (!st.r || (e.r && e.r.indexOf(st.r) > -1)) && (!st.q || norm(e.n.join(' ') + ' ' + (e.tr || []).join(' ')).indexOf(norm(st.q)) > -1); });
        var shown = st.open ? L : L.slice(0, SHOW);
        var items = shown.map(function (e) {
          return '<li class="di-gi-item"><span class="di-gi-name">' + esc(e.n.join(' / ')) + '</span> <span class="di-gi-tag di-gi-' + esc(e.t) + '">' + esc(t[e.t] || e.t) + '</span>' +
            (e.y ? ' <span class="di-gi-year">' + esc(t.since) + ' ' + e.y + '</span>' : '') +
            (inao && inao.e && inao.e[e.f] ? ' <span class="di-gi-year">· ' + esc(inao.e[e.f].map(function (i) { return window.GIZ.cat(inao.cats[i], lg); }).join(', ')) + '</span>' : '') +
            (zset[e.f] ? window.GIZ.btn(e.f, lg) : '') +
            (e.u ? ' <a class="di-gi-link" href="' + esc(e.u) + '" target="_blank" rel="noopener noreferrer">' + esc(t.legal) + '</a>' : '') + '</li>';
        }).join('');
        return '<ul class="di-gi-list">' + (items || '<li class="di-movers-hint">' + esc(t.none) + '</li>') + '</ul>' +
          (L.length > SHOW ? '<button type="button" class="di-gi-more" data-gi="more">' + esc(st.open ? t.less : t.more.replace('{n}', L.length)) + '</button>' : '');
      }
      function regs() { var o = {}; d[st.k].forEach(function (e) { (e.r || []).forEach(function (r) { o[r] = 1; }); }); return Object.keys(o).sort(function (a, b) { return RN(a).localeCompare(RN(b)); }); }
      function mapHtml() {
        var M = window[MAPK]; if (!M || !hasR || !d[st.k].some(function (e) { return e.r && e.r.length; })) return '';
        var cnt = {}, mx = 0; d[st.k].forEach(function (e) { if (st.ty !== 'all' && e.t !== st.ty) return; (e.r || []).forEach(function (r) { cnt[r] = (cnt[r] || 0) + 1; if (cnt[r] > mx) mx = cnt[r]; }); });
        var paths = M.states.map(function (x) {
          var n = cnt[x.id] || 0, f = n && mx ? Math.sqrt(n / mx) : 0, a = [226, 221, 205], z = [47, 107, 74];
          var fill = n ? 'rgb(' + a.map(function (c, j) { return Math.round(c + (z[j] - c) * f); }).join(',') + ')' : '#ece8da';
          return '<path d="' + x.d + '" fill="' + fill + '" stroke="' + (st.r === x.id ? '#a9491f' : '#c8c3b4') + '" stroke-width="' + (st.r === x.id ? 3 : 0.8) + '"' + (n ? ' data-gi-reg="' + esc(x.id) + '" tabindex="0" role="button" style="cursor:pointer"' : '') + ' aria-label="' + esc(RN(x.id) + ': ' + n) + '"><title>' + esc(RN(x.id) + ': ' + n) + '</title></path>';
        }).join('');
        return '<div class="di-gi-map" style="flex:0 0 280px;max-width:100%"><div style="font-size:12px;font-weight:700;margin:0 0 4px">' + esc(t.mapH) + '</div><svg viewBox="' + M.viewBox + '" style="width:100%;height:auto;max-height:340px" role="group" aria-label="' + esc(t.mapH) + '">' + paths + '</svg><div class="di-movers-hint" style="margin:4px 0 0">' + esc(t.mapN) + '</div></div>';
      }
      function draw() {
        var tab = function (k) { return d[k].length ? '<button type="button" class="di-tab-btn' + (st.k === k ? ' active' : '') + '" data-gi-k="' + k + '">' + esc(t[k]) + ' (' + d[k].length + ')</button>' : ''; };
        var types = ['all'].concat(['PDO', 'PGI', 'GI'].filter(function (x) { return d[st.k].some(function (e) { return e.t === x; }); }));
        el.innerHTML = '<details class="di-card di-gi" id="ps-gi"' + (st.det ? ' open' : '') + ' style="padding:14px 18px;margin-bottom:20px"><summary style="cursor:pointer;list-style:revert"><h2 class="ps-rm-h" style="display:inline;margin:0">' + esc(t.h) + '</h2> <span class="di-movers-hint" style="margin-left:8px">' + esc(t.sum.replace('{w}', d.wine.length).replace('{c}', d.cheese.length)) + '</span></summary><div style="height:8px"></div>' +
          '<p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.sub) + ' ' + esc(t.hint) + '</p>' +
          '<div class="di-gi-tabs">' + tab('wine') + tab('cheese') + '</div>' +
          '<div class="di-gi-filters">' + types.map(function (x) { var n = x === 'all' ? d[st.k].length : d[st.k].filter(function (e) { return e.t === x; }).length; return '<button type="button" class="di-gi-chip' + (st.ty === x ? ' active' : '') + '" data-gi-t="' + x + '">' + esc(x === 'all' ? t.all : t[x]) + ' · ' + n + '</button>'; }).join('') +
          (hasR ? '<select class="di-gi-r di-compare-select" aria-label="' + esc(t.reg) + '" style="max-width:220px"><option value="">' + esc(t.allr) + '</option>' + regs().map(function (r) { return '<option value="' + esc(r) + '"' + (st.r === r ? ' selected' : '') + '>' + esc(RN(r)) + '</option>'; }).join('') + '</select>' : '') +
          '<input type="search" class="di-gi-q" placeholder="' + esc(t.search) + '" value="' + esc(st.q) + '" aria-label="' + esc(t.search) + '"></div>' +
          '<div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start">' + (mapHtml() || (inao && inao.geo && st.k === 'wine' && window.GIZ ? window.GIZ.zoneMap(inao.geo, gnames, st.zf, lg) : '')) + '<div class="di-gi-body" style="flex:1;min-width:260px">' + list() + '</div></div>' + (!window[MAPK] && !(hasR) && !(inao && inao.geo) ? '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.noMap) + '</p>' : '') + '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.src) + (hasR && d.regionSource ? ' ' + esc(t.regNote) + esc(d.regionSource.name) + ' (' + esc(d.regionSource.license) + ').' + (d.regionSource.partial ? ' ' + esc(t.partial) : '') : '') + '</p></details>';
      }
      draw();
      el.addEventListener('toggle', function (ev) { if (ev.target && ev.target.id === 'ps-gi') st.det = ev.target.open; }, true);
      el.addEventListener('click', function (ev) {
        var zn = ev.target.closest ? ev.target.closest('[data-gi-zn],[data-gi-zclr]') : null;
        if (zn && el.contains(zn)) { st.zf = zn.getAttribute('data-gi-zclr') ? '' : (st.zf === zn.getAttribute('data-gi-zn') ? '' : zn.getAttribute('data-gi-zn')); st.open = false; draw(); return; }
        var rg = ev.target.closest ? ev.target.closest('[data-gi-reg]') : null;
        if (rg && el.contains(rg)) { var id = rg.getAttribute('data-gi-reg'); st.r = st.r === id ? '' : id; st.open = false; draw(); return; }
        var b = ev.target.closest ? ev.target.closest('button') : null; if (!b || !el.contains(b)) return;
        if (b.getAttribute('data-gi-k')) { st.k = b.getAttribute('data-gi-k'); st.ty = 'all'; st.open = false; draw(); }
        else if (b.getAttribute('data-gi-t')) { st.ty = b.getAttribute('data-gi-t'); st.open = false; draw(); }
        else if (b.getAttribute('data-gi') === 'more') { st.open = !st.open; el.querySelector('.di-gi-body').innerHTML = list(); }
      });
      el.addEventListener('keydown', function (ev) { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.getAttribute && ev.target.getAttribute('data-gi-zn')) { ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
      el.addEventListener('change', function (ev) { if (ev.target.className.indexOf('di-gi-r') > -1) { st.r = ev.target.value; st.open = false; draw(); } });
      if (hasR && !window[MAPK]) { var sm = document.createElement('script'); sm.src = N3 ? 'vendor/nuts3/' + cc.toLowerCase() + '.js' : 'vendor/' + cc.toLowerCase() + '-regions.js'; sm.onload = draw; document.head.appendChild(sm); }
      if (hasR && !N3 && !window.DehesaRegionNames) { var sc = document.createElement('script'); sc.src = 'js/region-names.js?v=20261012'; sc.onload = draw; document.head.appendChild(sc); }
      el.addEventListener('input', function (ev) { if (ev.target.className === 'di-gi-q') { st.q = ev.target.value; el.querySelector('.di-gi-body').innerHTML = list(); } });
    });
  }
  window.DIGI = { mount: mount };
})();
