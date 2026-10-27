/* Dehesa Index — Croacia por provincia (APPRRR): explotaciones, tierra ARKOD (tamaño y uso) y viñedo de las 21 provincias.
   data/hr-apprrr/counties.json (scripts/update-hr-apprrr.py). Bloque de la ficha de Croacia. ES5. window.DIHrApprrr. Usa window.ESUI (js/es-ui.js). */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Croacia por provincia (APPRRR)', tabs: { farms: 'Explotaciones', land: 'Tierra ARKOD', vines: 'Viñedo' },
      trend: 'Evolución por provincia', cAll: 'Toda Croacia', yrs: 'Años con dato', measure: 'Medida', view: 'Ver', type: 'Tipo de explotación', all: 'Todas', ha: 'Superficie (ha)', parcels: 'Parcelas', farmsN: 'Explotaciones', vinesN: 'Cepas', avg: 'Tamaño medio (ha por explotación)',
      national: 'Total Croacia', top: 'Provincia con más', share: 'del total', byCounty: 'Por provincia (župana)', byUse: 'Por tipo de uso', bySize: 'Por tamaño de explotación', use: 'Uso del suelo', size: 'Clase de tamaño',
      active: 'Viñedo en producción', cleared: 'Viñedo arrancado', mixed: 'Vid en plantaciones mixtas', density: 'Cepas por hectárea', asOf: 'Datos a', nodata: 'Sin datos por ahora.',
      nFarms: 'Registro de explotaciones agrarias (Upisnik) de la APPRRR. Una explotación con sede en una provincia cuenta en esa provincia.',
      nLand: 'ARKOD es el registro de parcelas agrarias de Croacia (equivalente al SIGPAC). Los totales provinciales son la suma de los asentamientos del fichero; el número de explotaciones no se suma porque una explotación con parcelas en varios asentamientos se repetiría. Las clases de tamaño son el tamaño total de la explotación en ha.',
      nVines: 'Registro vitivinícola (Vinogradarski registar) de la APPRRR. Una explotación con parcelas en varias provincias cuenta en cada una; la suma de provincias supera el número de explotaciones únicas.', src: 'Fuente:' },
    en: { h: 'Croatia by county (APPRRR)', tabs: { farms: 'Farms', land: 'ARKOD land', vines: 'Vineyards' },
      trend: 'Trend by county', cAll: 'All Croatia', yrs: 'Years with data', measure: 'Measure', view: 'View', type: 'Farm type', all: 'All', ha: 'Area (ha)', parcels: 'Parcels', farmsN: 'Farms', vinesN: 'Vines', avg: 'Average size (ha per farm)',
      national: 'Croatia total', top: 'Largest county', share: 'of the total', byCounty: 'By county (županija)', byUse: 'By land use', bySize: 'By farm size', use: 'Land use', size: 'Size class',
      active: 'Vineyard in production', cleared: 'Grubbed-up vineyard', mixed: 'Vines within mixed plantings', density: 'Vines per hectare', asOf: 'Data as of', nodata: 'No data yet.',
      nFarms: 'APPRRR register of agricultural holdings (Upisnik). A farm seated in a county counts in that county.',
      nLand: 'ARKOD is Croatia’s agricultural parcel register (the equivalent of the Spanish SIGPAC). County totals are the sum of the settlements in the file; the number of farms is not summed because a farm with parcels in several settlements would be counted twice. Size classes are the farm’s total area in ha.',
      nVines: 'APPRRR wine-growing register (Vinogradarski registar). A farm with parcels in several counties counts in each one, so the county sum exceeds the number of unique farms.', src: 'Source:' },
    fr: { h: 'Croatie par comitat (APPRRR)', tabs: { farms: 'Exploitations', land: 'Terres ARKOD', vines: 'Vignoble' },
      trend: 'Évolution par comitat', cAll: 'Toute la Croatie', yrs: 'Années disponibles', measure: 'Mesure', view: 'Voir', type: 'Type d’exploitation', all: 'Toutes', ha: 'Surface (ha)', parcels: 'Parcelles', farmsN: 'Exploitations', vinesN: 'Pieds de vigne', avg: 'Taille moyenne (ha par exploitation)',
      national: 'Total Croatie', top: 'Comitat le plus important', share: 'du total', byCounty: 'Par comitat (županija)', byUse: 'Par type d’usage', bySize: 'Par taille d’exploitation', use: 'Usage du sol', size: 'Classe de taille',
      active: 'Vignoble en production', cleared: 'Vignoble arraché', mixed: 'Vigne dans des plantations mixtes', density: 'Pieds par hectare', asOf: 'Données au', nodata: 'Pas encore de données.',
      nFarms: 'Registre des exploitations agricoles (Upisnik) de l’APPRRR. Une exploitation dont le siège est dans un comitat compte dans ce comitat.',
      nLand: 'L’ARKOD est le registre parcellaire agricole de la Croatie (équivalent du SIGPAC espagnol). Les totaux par comitat sont la somme des localités du fichier ; le nombre d’exploitations n’est pas additionné car une exploitation ayant des parcelles dans plusieurs localités serait comptée deux fois. Les classes de taille sont la surface totale de l’exploitation en ha.',
      nVines: 'Registre viticole (Vinogradarski registar) de l’APPRRR. Une exploitation ayant des parcelles dans plusieurs comitats compte dans chacun ; la somme dépasse donc le nombre d’exploitations uniques.', src: 'Source :' },
    it: { h: 'Croazia per contea (APPRRR)', tabs: { farms: 'Aziende', land: 'Terra ARKOD', vines: 'Vigneto' },
      trend: 'Andamento per contea', cAll: 'Tutta la Croazia', yrs: 'Anni disponibili', measure: 'Misura', view: 'Vista', type: 'Tipo di azienda', all: 'Tutte', ha: 'Superficie (ha)', parcels: 'Particelle', farmsN: 'Aziende', vinesN: 'Viti', avg: 'Dimensione media (ha per azienda)',
      national: 'Totale Croazia', top: 'Contea maggiore', share: 'del totale', byCounty: 'Per contea (županija)', byUse: 'Per uso del suolo', bySize: 'Per dimensione aziendale', use: 'Uso del suolo', size: 'Classe di dimensione',
      active: 'Vigneto in produzione', cleared: 'Vigneto estirpato', mixed: 'Vite in impianti misti', density: 'Viti per ettaro', asOf: 'Dati al', nodata: 'Ancora nessun dato.',
      nFarms: 'Registro delle aziende agricole (Upisnik) dell’APPRRR. Un’azienda con sede in una contea conta in quella contea.',
      nLand: 'L’ARKOD è il registro delle particelle agricole croate (equivalente dello SIGPAC spagnolo). I totali per contea sono la somma delle località del file; il numero di aziende non viene sommato perché un’azienda con particelle in più località sarebbe contata due volte. Le classi di dimensione sono la superficie totale dell’azienda in ha.',
      nVines: 'Registro viticolo (Vinogradarski registar) dell’APPRRR. Un’azienda con particelle in più contee conta in ciascuna, quindi la somma supera il numero di aziende uniche.', src: 'Fonte:' }
  };
  var LG = { es: 0, en: 1, fr: 2, it: 3 };
  var N = {
    'DRUGE PRAVNE OSOBE': 'Otras personas jurídicas|Other legal entities|Autres personnes morales|Altre persone giuridiche',
    'OBITELJSKO GOSPODARSTVO': 'Explotación familiar (OPG)|Family farm (OPG)|Exploitation familiale (OPG)|Azienda familiare (OPG)',
    'OBRT': 'Autónomo (obrt)|Sole trader (obrt)|Entreprise individuelle (obrt)|Ditta individuale (obrt)',
    'SAMOOPSKRBNO POLJOPRIVREDNO GOSPODARSTVO (SOPG)': 'Autoconsumo (SOPG)|Subsistence farm (SOPG)|Exploitation de subsistance (SOPG)|Azienda di autoconsumo (SOPG)',
    'TRGOVAČKO DRUŠTVO': 'Sociedad mercantil|Company|Société commerciale|Società commerciale',
    'ZADRUGA': 'Cooperativa|Cooperative|Coopérative|Cooperativa',
    'ORANICA': 'Tierra de cultivo|Arable land|Terres arables|Seminativi',
    'STAKLENICI NA ORANICI': 'Invernaderos sobre tierra de cultivo|Greenhouses on arable land|Serres sur terres arables|Serre su seminativi',
    'VIŠEGODIŠNJI NASADI NA ORANICI': 'Cultivos leñosos sobre tierra de cultivo|Perennial crops on arable land|Cultures pérennes sur terres arables|Colture perenni su seminativi',
    'LIVADA': 'Prado|Meadow|Prairie|Prato', 'PAŠNJAK': 'Pasto|Pasture|Pâturage|Pascolo', 'KRŠKI PAŠNJAK': 'Pasto kárstico|Karst pasture|Pâturage karstique|Pascolo carsico',
    'VINOGRAD': 'Viñedo|Vineyard|Vignoble|Vigneto', 'ISKRČENI VINOGRAD': 'Viñedo arrancado|Grubbed-up vineyard|Vignoble arraché|Vigneto estirpato',
    'MASLINIK': 'Olivar|Olive grove|Oliveraie|Oliveto', 'VOĆNJAK': 'Frutal|Orchard|Verger|Frutteto',
    'VOĆNJAK U STAKLENIKU ILI PLASTENIKU': 'Frutal en invernadero|Orchard under glass or plastic|Verger sous serre|Frutteto in serra',
    'KULTURE KRATKE OPHODNJE': 'Cultivos de rotación corta|Short-rotation crops|Cultures à courte rotation|Colture a rotazione breve',
    'RASADNIK': 'Vivero|Nursery|Pépinière|Vivaio', 'MATIČNJAK LOZNIH PODLOGA I PLEMKI': 'Plantas madre de portainjertos|Rootstock mother plants|Plants mères de porte-greffes|Piante madri di portinnesti',
    'MJEŠOVITI VIŠEGODIŠNJI NASADI': 'Plantaciones leñosas mixtas|Mixed perennial plantations|Plantations pérennes mixtes|Impianti perenni misti',
    'OSTALE VRSTE UPORABE ZEMLJIŠTA': 'Otros usos|Other land uses|Autres usages|Altri usi', 'PRIVREMENO NEODRŽAVANA PARCELA': 'Parcela temporalmente sin mantener|Temporarily unmaintained parcel|Parcelle temporairement non entretenue|Particella temporaneamente non mantenuta'
  };
  var SZ = { lt3: '< 3 ha', '3_20': '3 – 20 ha', '20_100': '20 – 100 ha', '100_1500': '100 – 1.500 ha', ge1500: '≥ 1.500 ha' };
  var U = global.ESUI, ST = { tab: 'farms', ft: 'total', fm: 'n', lv: 'use', lu: 'ORANICA', ls: 'lt3', lm: 'ha', vb: 'active', vm: 'ha', cc: 'all' }, D = null;
  function nm(raw, lg) { var s = N[raw]; return s ? (s.split('|')[LG[lg]] || raw) : raw; }
  function card(n, v, note) { return '<div class="di-card cof-card"><div class="cof-lbl">' + n + '</div><div class="cof-val">' + v + '</div>' + (note ? '<div class="cof-note" style="margin:2px 0 0">' + note + '</div>' : '') + '</div>'; }
  function note(t, k) { return '<p class="cof-note" style="margin:10px 0 0">' + U.esc(t[k]) + '</p>'; }
  function sum(o) { var s = 0, k; for (k in o) s += o[k]; return s; }
  function ranked(d, fn) { var r = []; d.counties.forEach(function (c) { var v = fn(c); if (v != null) r.push([c, v]); }); r.sort(function (a, b) { return b[1] - a[1]; }); return r; }
  function barsOf(list, tot, unit, dec) {
    var rows = list.map(function (x) { return [x[0], x[1], tot ? U.nf(x[1] / tot * 100, 1) + ' %' : '']; });
    return U.bars(rows, rows.length ? rows[0][1] || 1 : 1, dec, unit);
  }
  function asof(d, k, t) { return '<p class="cof-note" style="margin:6px 0 0">' + U.esc(t.asOf + ' ' + (d.asOf[k] || '')) + '</p>'; }
  function trend(d, lg, t, H, get, unit) {
    var ys = Object.keys(H || {}).sort(); if (ys.length < 2) return '';
    var cs = ST.cc !== 'all' && d.counties.indexOf(ST.cc) >= 0 ? [ST.cc] : d.counties, name = cs.length === 1 ? cs[0] : t.cAll;
    var v = ys.map(function (y) { var tot = 0, any = false; cs.forEach(function (c) { var x = get(H[y][c], y); if (x != null) { tot += x; any = true; } }); return any ? tot : null; });
    if (v.filter(function (x) { return x != null; }).length < 2) return '';
    var opts = U.opt('all', t.cAll, ST.cc) + d.counties.map(function (c) { return U.opt(c, c, ST.cc); }).join('');
    return '<h3 class="cof-h3">' + U.esc(t.trend) + '</h3>' + U.sel('hra-cc', t.byCounty, opts, ST.cc) + U.chart([{ name: name, v: v }], ys, unit, name, 0) + '<p class="cof-note" style="margin:4px 0 0">' + U.esc(t.yrs + ': ' + ys.join(', ')) + '</p>';
  }
  var VIEWS = {
    farms: function (d, lg, t) {
      var F = d.farms, types = F.types;
      var opts = U.opt('total', t.all, ST.ft) + types.map(function (k) { return U.opt(k, nm(k, lg), ST.ft); }).join('');
      if (ST.ft !== 'total' && types.indexOf(ST.ft) < 0) ST.ft = 'total';
      var key = ST.ft === 'total' ? 'total' : ST.ft;
      var list = ranked(d, function (c) { var r = F.rows[c]; return r ? r[key] : null; }), tot = sum(list.reduce(function (o, x) { o[x[0]] = x[1]; return o; }, {}));
      var fam = F.rows ? sum(d.counties.reduce(function (o, c) { o[c] = (F.rows[c] || {})['OBITELJSKO GOSPODARSTVO'] || 0; return o; }, {})) : 0;
      var out = U.sel('hra-ft', t.type, opts, ST.ft) + '<div class="cof-cards">' + card(U.esc(t.national), U.nf(tot, 0), U.esc(ST.ft === 'total' ? t.all : nm(ST.ft, lg)));
      if (list.length) out += card(U.esc(t.top), U.esc(list[0][0]), U.nf(list[0][1] / tot * 100, 1) + ' % ' + U.esc(t.share));
      if (ST.ft === 'total' && F.total) out += card(U.esc(nm('OBITELJSKO GOSPODARSTVO', lg)), U.nf(fam / F.total * 100, 1) + ' %', U.nf(fam, 0));
      out += '</div><h3 class="cof-h3">' + U.esc(t.byCounty) + '</h3>' + barsOf(list, tot, '', 0);
      out += trend(d, lg, t, d.history && d.history.farms, function (r) { return r ? r[key] : null; }, '');
      return out + asof(d, 'farms', t) + note(t, 'nFarms');
    },
    land: function (d, lg, t) {
      var S = d.size, Us = d.use, byUse = ST.lv === 'use';
      var out = U.sel('hra-lv', t.view, U.opt('use', t.byUse, ST.lv) + U.opt('size', t.bySize, ST.lv), ST.lv);
      if (byUse) {
        if (Us.uses.indexOf(ST.lu) < 0) ST.lu = Us.uses[0];
        out += U.sel('hra-lu', t.use, Us.uses.map(function (k) { return U.opt(k, nm(k, lg), ST.lu); }).join(''), ST.lu);
      } else out += U.sel('hra-ls', t.size, S.classes.map(function (k) { return U.opt(k, SZ[k] || k, ST.ls); }).join(''), ST.ls);
      out += U.sel('hra-lm', t.measure, U.opt('ha', t.ha, ST.lm) + U.opt('parcels', t.parcels, ST.lm), ST.lm);
      var m = ST.lm, get = function (c) { var r = byUse ? (Us.rows[c] || {})[ST.lu] : (S.rows[c] || {})[ST.ls]; return r ? r[m] : null; };
      var list = ranked(d, get), tot = list.reduce(function (s, x) { return s + x[1]; }, 0), unit = m === 'ha' ? 'ha' : '';
      var all = d.counties.reduce(function (s, c) { return s + sum(Object.keys(Us.rows[c] || {}).reduce(function (o, k) { o[k] = Us.rows[c][k].ha; return o; }, {})); }, 0);
      out += '<div class="cof-cards">' + card(U.esc(t.national), U.nf(tot, 0) + (unit ? ' ' + unit : ''), U.esc(byUse ? nm(ST.lu, lg) : SZ[ST.ls]));
      if (byUse && m === 'ha' && all) out += card(U.esc(t.share), U.nf(tot / all * 100, 1) + ' %', U.esc(t.national));
      if (list.length) out += card(U.esc(t.top), U.esc(list[0][0]), U.nf(list[0][1] / (tot || 1) * 100, 1) + ' % ' + U.esc(t.share));
      out += '</div><h3 class="cof-h3">' + U.esc(t.byCounty) + '</h3>' + barsOf(list, tot, unit, 0);
      if (byUse) {
        var nat = Us.uses.map(function (k) { return [nm(k, lg), d.counties.reduce(function (s, c) { return s + (((Us.rows[c] || {})[k] || {}).ha || 0); }, 0)]; }).filter(function (x) { return x[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; });
        out += '<h3 class="cof-h3">' + U.esc(t.byUse) + ' · ' + U.esc(t.national) + '</h3>' + barsOf(nat, all, 'ha', 0);
      }
      out += trend(d, lg, t, d.history && d.history[byUse ? 'use' : 'size'], function (r) { var x = r ? (byUse ? r[ST.lu] : r[ST.ls]) : null; return x ? x[m] : null; }, unit);
      return out + asof(d, byUse ? 'use' : 'size', t) + note(t, 'nLand');
    },
    vines: function (d, lg, t) {
      var V = d.vineyard, b = V[ST.vb] || V.active, hasV = ST.vb === 'active';
      var out = U.sel('hra-vb', t.view, ['active', 'cleared', 'mixed'].map(function (k) { return U.opt(k, t[k], ST.vb); }).join(''), ST.vb);
      var ms = U.opt('ha', t.ha, ST.vm) + U.opt('parcels', t.parcels, ST.vm) + U.opt('farms', t.farmsN, ST.vm) + (hasV ? U.opt('vines', t.vinesN, ST.vm) + U.opt('density', t.density, ST.vm) : '');
      if (!hasV && (ST.vm === 'vines' || ST.vm === 'density')) ST.vm = 'ha';
      out += U.sel('hra-vm', t.measure, ms, ST.vm);
      var m = ST.vm, dens = m === 'density';
      var list = ranked(d, function (c) { var r = b.rows[c]; if (!r) return null; return dens ? (r.ha >= 5 ? r.vines / r.ha : null) : r[m]; });
      var tot = dens ? (b.total.ha ? sum(d.counties.reduce(function (o, c) { o[c] = (b.rows[c] || {}).vines || 0; return o; }, {})) / b.total.ha : 0) : list.reduce(function (s, x) { return s + x[1]; }, 0);
      var unit = m === 'ha' ? 'ha' : dens ? '/ha' : '';
      out += '<div class="cof-cards">' + card(U.esc(t.national), U.nf(dens ? tot : (m === 'farms' ? sum(d.counties.reduce(function (o, c) { o[c] = (b.rows[c] || {}).farms || 0; return o; }, {})) : tot), 0) + (unit ? ' ' + unit : ''), U.esc(t[ST.vb]));
      if (list.length) out += card(U.esc(t.top), U.esc(list[0][0]), dens ? U.nf(list[0][1], 0) + ' /ha' : U.nf(list[0][1] / (tot || 1) * 100, 1) + ' % ' + U.esc(t.share));
      out += '</div><h3 class="cof-h3">' + U.esc(t.byCounty) + '</h3>' + barsOf(list, dens ? 0 : tot, unit, 0);
      if (hasV) out += trend(d, lg, t, d.history && d.history.vineyard, function (r) { return r && !dens ? r[m] : null; }, unit);
      return out + asof(d, 'vineyard', t) + note(t, 'nVines');
    }
  };
  function load() {
    if (D) return Promise.resolve(D);
    return U.json('data/hr-apprrr/counties.json').then(function (r) { D = r || false; return D; });
  }
  function mount(el, lg) {
    if (!el || !U) return Promise.resolve(false);
    lg = T[lg] ? lg : 'es';
    function draw(focus) {
      var t = T[lg];
      return load().then(function (d) {
        if (!d) { el.hidden = true; return false; }
        el.hidden = false;
        var chips = Object.keys(t.tabs).map(function (k) { return U.chip(k === ST.tab, 'hra-tab', 'data-tab="' + k + '"', t.tabs[k]); }).join(''), body;
        try { body = VIEWS[ST.tab](d, lg, t); } catch (e) { body = '<p class="cof-note">' + U.esc(t.nodata) + '</p>'; }
        el.innerHTML = '<section class="di-card cof" id="ps-hr-apprrr" style="max-width:none"><h2 class="cof-h2">' + U.esc(t.h) + '</h2><div style="margin:6px 0 10px">' + chips + '</div>' + body + U.cite('apprrr_hr') + '</section>';
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
        return true;
      });
    }
    if (!el.getAttribute('data-hra')) {
      el.setAttribute('data-hra', '1');
      el.addEventListener('click', function (ev) { var b = ev.target.closest ? ev.target.closest('.hra-tab') : null; if (b) { ST.tab = b.getAttribute('data-tab'); draw('.hra-tab[data-tab="' + ST.tab + '"]'); } });
      el.addEventListener('change', function (ev) {
        var id = ev.target.id || '', v = ev.target.value;
        if (id === 'hra-ft') ST.ft = v; else if (id === 'hra-lv') ST.lv = v; else if (id === 'hra-lu') ST.lu = v; else if (id === 'hra-ls') ST.ls = v; else if (id === 'hra-lm') ST.lm = v;
        else if (id === 'hra-vb') ST.vb = v; else if (id === 'hra-cc') ST.cc = v; else if (id === 'hra-vm') ST.vm = v;
        draw('#' + id);
      });
    }
    return Promise.all([global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null]).then(function () { return draw(); });
  }
  global.DIHrApprrr = { mount: mount };
})(window);
