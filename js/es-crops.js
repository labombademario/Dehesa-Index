/* España: superficies, producciones y rendimientos de cultivos por provincia (MAPA, «Superficies y producciones anuales de cultivos»).
   Datos: data/spain-crops/index.json + <grupo>.json (scripts/update-spain-crops.py). ES5, sin librerías. Uso: ESCrops.mount(contenedor, lang); la cabecera desplegable la pinta js/paises.js para no descargar este módulo hasta abrirla.
   Nada se estima: el rendimiento es produccion / superficie cosechada calculado aqui y se rotula como tal; los nombres de cultivo se muestran como los publica el MAPA (en español). */
(function () {
  'use strict';
  var BASE = 'data/spain-crops/', IDX = null, LI = null, GR = {}, ML = {};
  var T = {
    es: { title: 'España: cultivos por provincia (superficie, producción y rendimiento)', open: 'Ver qué se cultiva y cuánto se produce en cada provincia', hint: 'Ministerio de Agricultura, Pesca y Alimentación (MAPA). Los datos se cargan al abrir.',
      group: 'Grupo', crop: 'Cultivo', camp: 'Campaña', meas: { area: 'Superficie', prod: 'Producción', yld: 'Rendimiento' }, prov: 'Provincia', nat: 'Total España', share: 'Peso en España', all: 'Ver todas las provincias', top: 'Mayores provincias',
      area: 'Superficie total', irr: 'Regadío', dry: 'Secano', harv: 'Superficie cosechada', prd: 'Producción', yl: 'Rendimiento', vsPrev: 'Vs. campaña', ha: 'ha', t: 't', th: 't/ha',
      provisional: 'Datos provisionales', loading: 'Cargando…', err: 'No se han podido cargar los datos.', none: 'Sin dato publicado para este cultivo.',
      note: 'Datos provisionales de la campaña indicada, tal como los publica el MAPA (Reglamento CE 543/2009); pueden cambiar. Es la estadística de superficies y producciones anuales de cultivos, no el recuento de ESYRCE. Los nombres de cultivo son los del MAPA, en español. Cada cultivo se muestra por separado: los resúmenes ya incluyen a sus variedades, así que no se pueden sumar entre filas.',
      yNote: 'Rendimiento = producción ÷ superficie cosechada, calculado por Dehesa Index. En frutales y leñosos la superficie «cosechada» es la superficie en producción. Donde el MAPA no publica la superficie cosechada no se calcula.',
      grp: { cereales: 'Cereales', leguminosas: 'Leguminosas', tuberculos: 'Tubérculos', industriales: 'Cultivos industriales', hortalizas: 'Hortalizas', citricos: 'Cítricos', frutales: 'Frutales no cítricos', olivar: 'Olivar', vinedo: 'Viñedo', otros_lenosos: 'Otros leñosos' },
      upd: 'Última comprobación', a11: 'Tabla de provincias' },
    en: { title: 'Spain: crops by province (area, production and yield)', open: 'See what is grown, and how much, in each province', hint: 'Ministry of Agriculture, Fisheries and Food (MAPA). Data load when opened.',
      group: 'Group', crop: 'Crop', camp: 'Campaign', meas: { area: 'Area', prod: 'Production', yld: 'Yield' }, prov: 'Province', nat: 'Spain total', share: 'Share of Spain', all: 'Show all provinces', top: 'Largest provinces',
      area: 'Total area', irr: 'Irrigated', dry: 'Rain-fed', harv: 'Harvested area', prd: 'Production', yl: 'Yield', vsPrev: 'Vs. campaign', ha: 'ha', t: 't', th: 't/ha',
      provisional: 'Provisional data', loading: 'Loading…', err: 'The data could not be loaded.', none: 'No published figure for this crop.',
      note: 'Provisional data for the campaign shown, as published by MAPA (Regulation (EC) 543/2009); they may change. This is the annual crop area and production statistic, not the ESYRCE land survey. Crop names are MAPA\'s own, in Spanish. Each crop is shown on its own: summary rows already include their varieties, so rows cannot be added together.',
      yNote: 'Yield = production ÷ harvested area, calculated by Dehesa Index. For fruit trees and other woody crops, "harvested" area is area in production. Where MAPA does not publish harvested area, no yield is calculated.',
      grp: { cereales: 'Cereals', leguminosas: 'Pulses', tuberculos: 'Tubers', industriales: 'Industrial crops', hortalizas: 'Vegetables', citricos: 'Citrus', frutales: 'Other fruit trees', olivar: 'Olive groves', vinedo: 'Vineyards', otros_lenosos: 'Other woody crops' },
      upd: 'Last checked', a11: 'Province table' },
    fr: { title: 'Espagne : cultures par province (surface, production et rendement)', open: 'Voir ce qui est cultivé, et en quelle quantité, dans chaque province', hint: 'Ministère de l\'Agriculture, de la Pêche et de l\'Alimentation (MAPA). Les données se chargent à l\'ouverture.',
      group: 'Groupe', crop: 'Culture', camp: 'Campagne', meas: { area: 'Surface', prod: 'Production', yld: 'Rendement' }, prov: 'Province', nat: 'Total Espagne', share: 'Part de l\'Espagne', all: 'Afficher toutes les provinces', top: 'Plus grandes provinces',
      area: 'Surface totale', irr: 'Irrigué', dry: 'Pluvial', harv: 'Surface récoltée', prd: 'Production', yl: 'Rendement', vsPrev: 'Vs. campagne', ha: 'ha', t: 't', th: 't/ha',
      provisional: 'Données provisoires', loading: 'Chargement…', err: 'Impossible de charger les données.', none: 'Aucune donnée publiée pour cette culture.',
      note: 'Données provisoires de la campagne indiquée, telles que publiées par le MAPA (règlement (CE) 543/2009) ; elles peuvent changer. Il s\'agit de la statistique annuelle des surfaces et productions de cultures, pas de l\'enquête ESYRCE. Les noms de cultures sont ceux du MAPA, en espagnol. Chaque culture est présentée séparément : les lignes de synthèse incluent déjà leurs variétés et ne peuvent donc pas être additionnées.',
      yNote: 'Rendement = production ÷ surface récoltée, calculé par Dehesa Index. Pour les arbres fruitiers et autres cultures ligneuses, la surface « récoltée » est la surface en production. Quand le MAPA ne publie pas la surface récoltée, aucun rendement n\'est calculé.',
      grp: { cereales: 'Céréales', leguminosas: 'Légumineuses', tuberculos: 'Tubercules', industriales: 'Cultures industrielles', hortalizas: 'Légumes', citricos: 'Agrumes', frutales: 'Autres arbres fruitiers', olivar: 'Oliveraies', vinedo: 'Vignobles', otros_lenosos: 'Autres cultures ligneuses' },
      upd: 'Dernière vérification', a11: 'Tableau des provinces' },
    it: { title: 'Spagna: colture per provincia (superficie, produzione e resa)', open: 'Vedi cosa si coltiva, e quanto, in ogni provincia', hint: 'Ministero dell\'Agricoltura, della Pesca e dell\'Alimentazione (MAPA). I dati si caricano all\'apertura.',
      group: 'Gruppo', crop: 'Coltura', camp: 'Campagna', meas: { area: 'Superficie', prod: 'Produzione', yld: 'Resa' }, prov: 'Provincia', nat: 'Totale Spagna', share: 'Peso sulla Spagna', all: 'Mostra tutte le province', top: 'Province maggiori',
      area: 'Superficie totale', irr: 'Irrigua', dry: 'Asciutta', harv: 'Superficie raccolta', prd: 'Produzione', yl: 'Resa', vsPrev: 'Vs. campagna', ha: 'ha', t: 't', th: 't/ha',
      provisional: 'Dati provvisori', loading: 'Caricamento…', err: 'Impossibile caricare i dati.', none: 'Nessun dato pubblicato per questa coltura.',
      note: 'Dati provvisori della campagna indicata, come pubblicati dal MAPA (Regolamento (CE) 543/2009); possono cambiare. È la statistica annuale su superfici e produzioni delle colture, non il rilevamento ESYRCE. I nomi delle colture sono quelli del MAPA, in spagnolo. Ogni coltura è mostrata a parte: le righe di sintesi includono già le varietà, quindi le righe non si possono sommare.',
      yNote: 'Resa = produzione ÷ superficie raccolta, calcolata da Dehesa Index. Per alberi da frutto e altre colture legnose la superficie «raccolta» è quella in produzione. Dove il MAPA non pubblica la superficie raccolta, la resa non viene calcolata.',
      grp: { cereales: 'Cereali', leguminosas: 'Leguminose', tuberculos: 'Tuberi', industriales: 'Colture industriali', hortalizas: 'Ortaggi', citricos: 'Agrumi', frutales: 'Altra frutta da albero', olivar: 'Oliveti', vinedo: 'Vigneti', otros_lenosos: 'Altre colture legnose' },
      upd: 'Ultima verifica', a11: 'Tabella delle province' }
  };
  var GORDER = ['cereales', 'leguminosas', 'tuberculos', 'industriales', 'hortalizas', 'citricos', 'frutales', 'olivar', 'vinedo', 'otros_lenosos'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nf(v, d, lang) { try { return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); } catch (e) { return v.toFixed(d); } }
  function pc(v, lang) { return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1, lang) + ' %'; }
  function get(f) { if (!ML[f]) ML[f] = fetch(BASE + f).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); return ML[f]; }
  function yl(a) { return a && a[3] > 0 && a[4] != null ? a[4] / a[3] : null; }
  function big(v, unit, lang) { return v == null ? '–' : (v >= 1e6 ? nf(v / 1e6, 2, lang) + ' M ' : nf(v, 0, lang) + ' ') + unit; }
  function cite(id, period, what) { var Q = window.DICite; if (!Q) return ''; var c = what ? Q.derived([id], { what: what }) : Q.html(id, { period: String(period || '') }); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }

  function render(box, st, lang) {
    var t = T[lang], g = GR[st.g];
    if (!g) { box.innerHTML = '<p class="di-movers-hint">' + esc(t.loading) + '</p>'; return; }
    var camps = Object.keys(g.campaigns).sort(), camp = camps.indexOf(st.camp) >= 0 ? st.camp : camps[camps.length - 1];
    st.camp = camp;
    var crops = g.campaigns[camp].crops, code = st.crop;
    var cur = crops.filter(function (x) { return x.c === code; })[0] || crops[0]; st.crop = cur.c;
    var gi = IDX.groups;
    var h = '<div class="de-ctl"><label>' + esc(t.group) + '<br><select class="di-compare-select" data-ec="g">' + GORDER.filter(function (k) { return gi[k]; }).map(function (k) { return '<option value="' + k + '"' + (k === st.g ? ' selected' : '') + '>' + esc(t.grp[k]) + '</option>'; }).join('') + '</select></label>' +
      '<label>' + esc(t.crop) + '<br><select class="di-compare-select" data-ec="crop">' + crops.map(function (x) { var pad = ''; for (var i = 0; i < x.l; i++) pad += '  '; return '<option value="' + esc(x.c) + '"' + (x.c === cur.c ? ' selected' : '') + '>' + pad + esc(x.n) + '</option>'; }).join('') + '</select></label>';
    if (camps.length > 1) h += '<span><span class="di-movers-hint">' + esc(t.camp) + '</span><br><span class="di-src-tabs" role="group">' + camps.map(function (c) { return '<button type="button" class="di-src-tab" data-ec="camp" data-v="' + c + '" aria-pressed="' + (c === camp) + '">' + c + '</button>'; }).join('') + '</span></span>';
    h += '</div>';
    var tt = cur.t, prevC = camps[camps.indexOf(camp) - 1], pv = prevC && g.campaigns[prevC].crops.filter(function (x) { return x.c === cur.c; })[0];
    var tile = function (lab, val, sub) { return '<div class="de-tile"><div class="de-tl">' + esc(lab) + '</div><div class="de-tv">' + val + '</div><div class="de-ts">' + sub + '</div></div>'; };
    var dv = function (a, b) { return a != null && b != null && b > 0 ? esc(t.vsPrev + ' ' + prevC) + ': ' + pc((a / b - 1) * 100, lang) : ''; };
    var tl = '';
    tl += tile(t.area + ' · ' + camp, big(tt[0], t.ha, lang), pv ? dv(tt[0], pv.t[0]) : '&nbsp;');
    if (tt[1] != null && tt[2] != null && tt[0] > 0) tl += tile(t.irr, nf(tt[2] / tt[0] * 100, 0, lang) + ' %', big(tt[2], t.ha, lang) + ' · ' + esc(t.dry) + ' ' + big(tt[1], t.ha, lang));
    tl += tile(t.prd, big(tt[4], t.t, lang), pv ? dv(tt[4], pv.t[4]) : '&nbsp;');
    var y0 = yl(tt), y1 = pv ? yl(pv.t) : null;
    if (y0 != null) tl += tile(t.yl, nf(y0, y0 < 10 ? 2 : 1, lang) + ' ' + t.th, y1 != null ? dv(y0, y1) : '&nbsp;');
    h += '<div class="de-tiles">' + tl + '</div>';
    h += '<span class="di-src-tabs" role="group">' + ['area', 'prod', 'yld'].map(function (m) { return '<button type="button" class="di-src-tab" data-ec="meas" data-v="' + m + '" aria-pressed="' + (m === st.m) + '">' + esc(t.meas[m]) + '</button>'; }).join('') + '</span>';
    var m = st.m, rows = [], tot = m === 'area' ? tt[0] : m === 'prod' ? tt[4] : y0;
    Object.keys(cur.v).forEach(function (p) { var a = cur.v[p], v = m === 'area' ? a[0] : m === 'prod' ? a[4] : yl(a); if (v != null && v > 0) rows.push({ p: p, v: v, a: a }); });
    rows.sort(function (a, b) { return b.v - a.v; });
    if (!rows.length) { h += '<p class="di-movers-hint">' + esc(t.none) + '</p>'; }
    else {
      var mx = rows[0].v, fmtv = function (v) { return m === 'yld' ? nf(v, v < 10 ? 2 : 1, lang) + ' ' + t.th : m === 'prod' ? big(v, t.t, lang) : big(v, t.ha, lang); };
      var tr = function (r) {
        return '<tr><td>' + esc(g.provinces[r.p]) + '</td><td class="r">' + fmtv(r.v) + '</td><td class="r">' + (m === 'yld' ? '' : (tot ? nf(r.v / tot * 100, 1, lang) + ' %' : '')) + '</td><td aria-hidden="true" style="width:30%"><div style="height:8px;border-radius:2px;background:var(--accent,#2f6f4f);width:' + Math.max(1, Math.round(r.v / mx * 100)) + '%"></div></td></tr>';
      };
      var head = '<thead><tr><th scope="col">' + esc(t.prov) + '</th><th scope="col" class="r">' + esc(t.meas[m]) + ' (' + camp + ')</th><th scope="col" class="r">' + (m === 'yld' ? '' : esc(t.share)) + '</th><th scope="col" class="es-bar"><span class="visually-hidden">' + esc(t.a11) + '</span></th></tr></thead>';
      h += '<div class="de-sc"><table class="de-t" data-no-cards>' + head + '<tbody>' + rows.slice(0, 10).map(tr).join('') + '</tbody></table></div>';
      if (rows.length > 10) h += '<details><summary style="cursor:pointer;font-size:13px">' + esc(t.all) + ' (' + rows.length + ')</summary><div class="de-sc"><table class="de-t" data-no-cards>' + head + '<tbody>' + rows.slice(10).map(tr).join('') + '</tbody></table></div></details>';
    }
    h += '<p class="di-movers-hint"><b>' + esc(t.provisional) + ' ' + camp + '.</b> ' + esc(t.note) + '</p>' + (m === 'yld' || y0 != null ? '<p class="di-movers-hint">' + esc(t.yNote) + '</p>' : '');
    h += cite('mapa_es', camp);
    if (y0 != null) h += cite('mapa_es', '', 'production ÷ harvested area (MAPA)');
    h += '<p class="di-movers-hint">' + esc(t.upd) + ': ' + esc((IDX.checkedAt || '').slice(0, 10)) + '</p>';
    box.innerHTML = h;
  }

  function mount(body, lang) {
    lang = T[lang] ? lang : 'es'; var t = T[lang], st = { g: 'cereales', crop: null, camp: null, m: 'area' };
    function draw() { render(body, st, lang); }
    function loadG(k) { return get(IDX.groups[k].file).then(function (d) { GR[k] = d; }); }
    body.innerHTML = '<p class="di-movers-hint">' + esc(t.hint) + ' ' + esc(t.loading) + '</p>';
    get('index.json').then(function (ix) { IDX = ix; if (!ix.groups[st.g]) st.g = GORDER.filter(function (k) { return ix.groups[k]; })[0]; return loadG(st.g); }).then(draw)
      .catch(function () { body.innerHTML = '<p class="di-movers-hint">' + esc(t.err) + '</p>'; });
    body.addEventListener('change', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-ec'); if (!a) return;
      if (a === 'crop') { st.crop = e.target.value; draw(); }
      else if (a === 'g') { st.g = e.target.value; st.crop = null; st.camp = null; (GR[st.g] ? Promise.resolve() : loadG(st.g)).then(draw).catch(function () { body.innerHTML = '<p class="di-movers-hint">' + esc(t.err) + '</p>'; }); }
    });
    body.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-ec]') : null; if (!b || b.tagName !== 'BUTTON') return;
      var a = b.getAttribute('data-ec'), v = b.getAttribute('data-v');
      if (a === 'camp') st.camp = v; else if (a === 'meas') st.m = v; draw();
    });
  }
  window.ESCrops = { mount: mount };
})();
