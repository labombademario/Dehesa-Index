/* Dehesa Index — ESYRCE: superficie por cultivo específico, provincia y comunidad de España (MAPA). ES5.
   data/spain-esyrce/index.json + esyrce-<año>.json (scripts/update-es-esyrce.py). Hectáreas tal como las publica el MAPA; Dehesa Index no calcula nada salvo ordenar.
   Se muestra bajo la pestaña «España» de rendimientos.html (el bloque sigue la visibilidad de #rd-es). */
(function (global) {
  'use strict';
  var S = global.DehesaShared, IDX = null, DOC = {}, Y = null, M = 'total', TER = 'espana', CROP = null, drawn = false;
  var T = {
    es: { h: 'Qué se cultiva en España: superficie por cultivo (ESYRCE)', sub: 'La encuesta de campo del Ministerio de Agricultura (ESYRCE) mide la superficie real de cada cultivo en cada provincia y comunidad. Hectáreas.', year: 'Año', ter: 'Territorio', meas: { total: 'Total', secano: 'Secano', regadio: 'Regadío' }, top: 'Los cultivos con más superficie en {t}', ha: 'ha', crop: 'Cultivo', where: 'Dónde se cultiva', whereSub: 'Provincias y comunidades con más superficie de este cultivo', all: 'España', ccaa: 'Comunidades autónomas', prov: 'Provincias', pick: 'Elige un cultivo', grp: 'Grupo', evo: 'España por año (solo total)', none: 'Sin superficie registrada',
      note: 'Las categorías «Total» (suma de varios cultivos) no entran en el ranking. Un territorio sin cifra significa que el ministerio no registra ese cultivo allí. El último año es un avance provisional y puede cambiar. Secano y regadío solo se publican para el año más reciente. Los nombres de cultivo son los del ministerio.', src: 'Fuente:', open: 'Ver la fuente original', alt: '{n}: superficie por territorio' },
    en: { h: 'What Spain grows: area by crop (ESYRCE)', sub: 'The Ministry of Agriculture’s field survey (ESYRCE) measures the actual area of each crop in each province and region. Hectares.', year: 'Year', ter: 'Territory', meas: { total: 'Total', secano: 'Rainfed', regadio: 'Irrigated' }, top: 'Crops with the most area in {t}', ha: 'ha', crop: 'Crop', where: 'Where it is grown', whereSub: 'Provinces and regions with the most area of this crop', all: 'Spain', ccaa: 'Regions (autonomous communities)', prov: 'Provinces', pick: 'Pick a crop', grp: 'Group', evo: 'Spain by year (total only)', none: 'No area recorded',
      note: '«Total» categories (sums of several crops) are left out of the ranking. A territory without a figure means the ministry records none of that crop there. The latest year is a provisional advance and may change. Rainfed and irrigated are published only for the latest year. Crop names are the ministry’s own (in Spanish).', src: 'Source:', open: 'See the original source', alt: '{n}: area by territory' },
    fr: { h: 'Ce que cultive l’Espagne : surface par culture (ESYRCE)', sub: 'L’enquête de terrain du ministère de l’Agriculture (ESYRCE) mesure la surface réelle de chaque culture par province et par région. Hectares.', year: 'Année', ter: 'Territoire', meas: { total: 'Total', secano: 'Sec (pluvial)', regadio: 'Irrigué' }, top: 'Cultures les plus étendues : {t}', ha: 'ha', crop: 'Culture', where: 'Où elle est cultivée', whereSub: 'Provinces et régions où cette culture couvre le plus de surface', all: 'Espagne', ccaa: 'Communautés autonomes', prov: 'Provinces', pick: 'Choisir une culture', grp: 'Groupe', evo: 'Espagne par année (total seulement)', none: 'Aucune surface enregistrée',
      note: 'Les catégories « Total » (sommes de plusieurs cultures) sont exclues du classement. Un territoire sans chiffre signifie que le ministère n’y enregistre pas cette culture. La dernière année est une avance provisoire. Sec et irrigué ne sont publiés que pour la dernière année. Les noms de culture sont ceux du ministère (en espagnol).', src: 'Source :', open: 'Voir la source d’origine', alt: '{n} : surface par territoire' },
    it: { h: 'Cosa coltiva la Spagna: superficie per coltura (ESYRCE)', sub: 'L’indagine di campo del Ministero dell’Agricoltura (ESYRCE) misura la superficie reale di ogni coltura in ogni provincia e regione. Ettari.', year: 'Anno', ter: 'Territorio', meas: { total: 'Totale', secano: 'Asciutto', regadio: 'Irriguo' }, top: 'Colture con più superficie: {t}', ha: 'ha', crop: 'Coltura', where: 'Dove si coltiva', whereSub: 'Province e regioni con più superficie di questa coltura', all: 'Spagna', ccaa: 'Comunità autonome', prov: 'Province', pick: 'Scegli una coltura', grp: 'Gruppo', evo: 'Spagna per anno (solo totale)', none: 'Nessuna superficie registrata',
      note: 'Le categorie «Totale» (somme di più colture) sono escluse dalla classifica. Un territorio senza cifra significa che il ministero non registra lì quella coltura. L’ultimo anno è un avanzamento provvisorio. Asciutto e irriguo solo per l’anno più recente. I nomi delle colture sono quelli del ministero (in spagnolo).', src: 'Fonte:', open: 'Vedi la fonte originale', alt: '{n}: superficie per territorio' }
  };
  function lang() { return S && S.getLang ? S.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function chip(on, cls, data, label) { return '<button type="button" class="' + cls + '" ' + data + ' aria-pressed="' + on + '" style="font:inherit;cursor:pointer;padding:6px 11px;margin:0 6px 6px 0;border:1px solid var(--border);border-radius:16px;background:' + (on ? 'var(--accent)' : 'transparent') + ';color:' + (on ? '#fff' : 'inherit') + '">' + esc(label) + '</button>'; }
  var th = 'padding:8px 6px;font-size:11px;font-weight:700;color:var(--text-faint);', td = 'padding:7px 6px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums;text-align:right;';
  function bars(rows, mx) { return '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:300px;font-size:13.5px"><tbody>' + rows.map(function (r) { return '<tr><td style="' + td + 'text-align:left">' + esc(r[0]) + (r[2] ? ' <span class="di-movers-hint">· ' + esc(r[2]) + '</span>' : '') + '</td><td style="' + td + 'width:46%"><span style="display:inline-block;height:8px;border-radius:4px;background:var(--accent);opacity:.55;width:' + Math.max(2, Math.round(r[1] / mx * 100)) + '%;vertical-align:middle;margin-right:8px"></span>' + esc(nf(r[1], 0)) + '</td></tr>'; }).join('') + '</tbody></table></div>'; }
  function key(c) { return c.group + '|' + c.name; }
  function lookup(d, m) { var o = {}; (d.measures[m] || []).forEach(function (c) { o[key(c)] = c; }); return o; }
  function render(el) {
    var t = T[lang()] || T.es, d = DOC[Y]; if (!d) { return; }
    var ms = Object.keys(d.measures); if (ms.indexOf(M) < 0) M = 'total';
    var ti = -1, i; d.territories.forEach(function (x, k) { if (x.id === TER) ti = k; }); if (ti < 0) { TER = 'espana'; d.territories.forEach(function (x, k) { if (x.id === TER) ti = k; }); }
    var yrs = Object.keys(IDX.years).sort().reverse();
    var ysel = '<label class="di-movers-hint" style="display:inline-block;margin:0 14px 8px 0">' + esc(t.year) + '<select id="ese-y" style="display:block;margin-top:4px;font:inherit">' + yrs.map(function (y) { return '<option' + (String(y) === String(Y) ? ' selected' : '') + '>' + esc(y) + '</option>'; }).join('') + '</select></label>';
    var tsel = '<label class="di-movers-hint" style="display:inline-block;margin:0 14px 8px 0">' + esc(t.ter) + '<select data-chips id="ese-t" style="display:block;margin-top:4px;font:inherit;max-width:100%">' +
      d.territories.filter(function (x) { return x.kind === 'country'; }).map(function (x) { return '<option value="' + x.id + '"' + (x.id === TER ? ' selected' : '') + '>' + esc(t.all) + '</option>'; }).join('') +
      '<optgroup label="' + esc(t.ccaa) + '">' + d.territories.filter(function (x) { return x.kind === 'ccaa'; }).map(function (x) { return '<option value="' + x.id + '"' + (x.id === TER ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</optgroup>' +
      '<optgroup label="' + esc(t.prov) + '">' + d.territories.filter(function (x) { return x.kind === 'province'; }).map(function (x) { return '<option value="' + x.id + '"' + (x.id === TER ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</optgroup></select></label>';
    var mch = ms.length > 1 ? '<div role="group">' + ['total', 'secano', 'regadio'].filter(function (m) { return ms.indexOf(m) >= 0; }).map(function (m) { return chip(m === M, 'ese-m', 'data-m="' + m + '"', t.meas[m]); }).join('') + '</div>' : '';
    var crops = d.measures[M], rows = crops.filter(function (c) { return !/total/i.test(c.name) && c.v[ti] != null && c.v[ti] > 0; }).map(function (c) { return [c.name, c.v[ti], c.group]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 25);
    var topH = rows.length ? bars(rows, rows[0][1]) : '<p class="cof-sub">' + esc(t.none) + '</p>';
    var tn = d.territories[ti].kind === 'country' ? t.all : d.territories[ti].name;
    // dónde se cultiva
    var all = crops.filter(function (c) { return !/total/i.test(c.name) && c.v[d.territories.length - 1] != null; }).sort(function (a, b) { return a.name.localeCompare(b.name, 'es'); });
    var byG = {}; all.forEach(function (c) { (byG[c.group] = byG[c.group] || []).push(c); });
    if (!CROP || !all.some(function (c) { return key(c) === CROP; })) { var wh = all.filter(function (c) { return c.name === 'Olivar Aceituna de Aceite' || c.name === 'Trigo Blando'; })[0] || all[0]; CROP = wh ? key(wh) : null; }
    var cs = '<label class="di-movers-hint" style="display:block;margin:8px 0 4px">' + esc(t.pick) + '<select data-chips id="ese-c" style="display:block;margin-top:4px;font:inherit;max-width:100%">' + Object.keys(byG).map(function (g) { return '<optgroup label="' + esc(g) + '">' + byG[g].map(function (c) { return '<option value="' + esc(key(c)) + '"' + (key(c) === CROP ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select></label>';
    var where = '', cc = all.filter(function (c) { return key(c) === CROP; })[0];
    if (cc) {
      var tr = d.territories.map(function (x, k) { return [x.name, cc.v[k], x.kind === 'ccaa' ? t.ccaa.split(' (')[0] : '', x.kind]; }).filter(function (r) { return r[1] != null && r[1] > 0 && r[3] !== 'country'; });
      var ca = tr.filter(function (r) { return r[3] === 'ccaa'; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8), pr = tr.filter(function (r) { return r[3] === 'province'; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 10);
      var es = cc.v[d.territories.length - 1];
      where = '<h3 class="cof-h3">' + esc(cc.name) + ' · ' + esc(t.meas[M]) + (es != null ? ' · ' + esc(nf(es, 0)) + ' ' + esc(t.ha) + ' (' + esc(t.all) + ')' : '') + '</h3><p class="cof-sub">' + esc(t.whereSub) + '</p>' + (ca.length ? '<h4 class="cof-h3" style="font-size:.95em">' + esc(t.ccaa) + '</h4>' + bars(ca.map(function (r) { return [r[0], r[1], '']; }), ca[0][1]) : '') + (pr.length ? '<h4 class="cof-h3" style="font-size:.95em">' + esc(t.prov) + '</h4>' + bars(pr.map(function (r) { return [r[0], r[1], '']; }), pr[0][1]) : '');
    }
    var cite = global.DICite && global.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + global.DICite.html('mapa_es', {}) + '</div>' : '';
    el.innerHTML = '<section class="cof"><h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + '</p>' + ysel + tsel + mch + '<h3 class="cof-h3">' + esc(t.top.replace('{t}', tn)) + ' · ' + esc(Y) + '</h3>' + topH + '<hr style="border:0;border-top:1px solid var(--border);margin:18px 0">' + cs + where +
      '<p class="cof-note">' + esc(t.note) + ' ' + esc(t.src) + ' <a href="' + esc(IDX.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.open) + '</a></p>' + cite + '</section>';
    var q = function (s) { return el.querySelector(s); };
    var y = q('#ese-y'); if (y) y.onchange = function () { load(y.value, el); };
    var te = q('#ese-t'); if (te) te.onchange = function () { TER = te.value; render(el); };
    var ce = q('#ese-c'); if (ce) ce.onchange = function () { CROP = ce.value; render(el); };
    Array.prototype.forEach.call(el.querySelectorAll('.ese-m'), function (b) { b.onclick = function () { M = b.getAttribute('data-m'); render(el); }; });
  }
  function j(u) { return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function load(y, el) { if (DOC[y]) { Y = y; render(el); return; } j('data/spain-esyrce/' + IDX.years[y].file).then(function (d) { if (d && d.territories) { DOC[y] = d; Y = y; render(el); } }); }
  function boot() {
    var tab = document.getElementById('rd-es'), el = document.getElementById('rd-es-esyrce'); if (!tab || !el) return;
    function sync() { el.hidden = tab.hidden; if (!tab.hidden && !drawn) { drawn = true; Promise.all([j('data/spain-esyrce/index.json'), global.DICite ? global.DICite.load().catch(function () { return null; }) : null]).then(function (a) { if (!a[0] || !a[0].years) { el.hidden = true; return; } IDX = a[0]; var ys = Object.keys(IDX.years).sort(); load(ys[ys.length - 1], el); }); } }
    sync(); if (global.MutationObserver) new MutationObserver(sync).observe(tab, { attributes: true, attributeFilter: ['hidden'] });
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); if (drawn && DOC[Y]) render(el); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
