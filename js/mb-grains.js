/* Canadá: granos y oleaginosas en el elevador de Winnipeg (Manitoba Agriculture, informe semanal «Grain and Oilseed Prices» y su historia mensual; data/mb-markets/grains.json).
   ES5, sin librerías. Uso: MBGrains.mount(contenedor, lang); la cabecera desplegable la pinta js/paises.js para no descargar este módulo hasta abrirla.
   Nada se estima: C$/t y C$/bushel tal como los publica Manitoba (precio neto al agricultor); el cambio solo compara dos semanas publicadas de la misma serie (la anterior,
   a 10 días o menos, y la de hace 52 semanas exactas); las celdas en disputa quedan vacías. No incluye los futuros de ICE y Chicago del mismo informe (son de terceros). */
(function () {
  'use strict';
  var F = 'data/mb-markets/grains.json', D = null, LD = null, DAY = 86400000;
  var LIC = 'Contains information from the Government of Manitoba, licensed under the OpenMB Information and Data Use License (Manitoba.ca/OpenMB).';
  var T = {
    es: { crop: 'Cultivo', t: 'C$/t', bu: 'C$/bushel', wk: 'Semana del', chg: 'Vs. semana anterior', yoy: 'Vs. hace 52 semanas', na: 'sin dato', none: 'Sin precio publicado esta semana (celda en disputa o sin dato).', loading: 'Cargando…', err: 'No se han podido cargar los datos.',
      chartW: 'Evolución semanal', chartM: 'Media mensual publicada por Manitoba, desde', weeks: 'semanas', tbl: 'Todos los cultivos en la última semana', calc: 'Cálculo de Dehesa Index',
      wheat_wrs: 'Trigo Western Red Spring', wheat_nhr: 'Trigo Northern Hard Red', wheat_rw: 'Trigo Red Winter', wheat_sp: 'Trigo Special Purpose (Low Vomi)', barley: 'Cebada n.º 1 CW', flax: 'Lino n.º 1 CW', canola: 'Colza (canola) n.º 1 CR', peas: 'Guisantes amarillos n.º 2', corn: 'Maíz n.º 2', oats: 'Avena n.º 2 CW', soybeans: 'Soja', canola_meal: 'Harina de colza 34 % (Altona)',
      note: 'Precio neto en caja que recibe el agricultor en el elevador de Winnipeg (Manitoba Agriculture, informe semanal de los viernes), en C$ por tonelada y por bushel. No incluye los futuros de ICE y Chicago que el mismo informe reproduce (son de terceros). Los cambios los calcula Dehesa Index sobre semanas publicadas. Una celda en blanco es un dato que Manitoba no da o que contradice su propio cambio semanal: no se corrige ni se rellena. La historia mensual es la media que publica Manitoba (Excel de la misma página) hasta dic-2025; no hay informes semanales enlazados entre el 19-dic-2025 y el 9-ene-2026.',
      lic: LIC },
    en: { crop: 'Crop', t: 'C$/t', bu: 'C$/bushel', wk: 'Week of', chg: 'Vs. previous week', yoy: 'Vs. 52 weeks ago', na: 'no data', none: 'No price published this week (disputed cell or no data).', loading: 'Loading…', err: 'The data could not be loaded.',
      chartW: 'Weekly evolution', chartM: 'Monthly average published by Manitoba, since', weeks: 'weeks', tbl: 'All crops in the latest week', calc: 'Dehesa Index calculation',
      wheat_wrs: 'Wheat, Western Red Spring', wheat_nhr: 'Wheat, Northern Hard Red', wheat_rw: 'Wheat, Red Winter', wheat_sp: 'Wheat, Special Purpose (Low Vomi)', barley: 'Barley, #1 CW', flax: 'Flaxseed, #1 CW', canola: 'Canola, #1 CR', peas: 'Peas, #2 Yellow', corn: 'Corn, #2', oats: 'Oats, #2 CW', soybeans: 'Soybeans', canola_meal: 'Canola meal 34% (Altona)',
      note: 'Farmer\'s net cash return at the Winnipeg elevator (Manitoba Agriculture weekly Friday report), in C$ per tonne and per bushel. It does not include the ICE and Chicago futures that the same report reproduces (third-party data). Changes are calculated by Dehesa Index between published weeks. A blank cell is a figure Manitoba does not give or that contradicts its own weekly change: it is neither corrected nor filled. The monthly history is the average Manitoba publishes (Excel on the same page) up to Dec 2025; no weekly reports are linked between 19 Dec 2025 and 9 Jan 2026.',
      lic: LIC },
    fr: { crop: 'Culture', t: '$ CA/t', bu: '$ CA/boisseau', wk: 'Semaine du', chg: 'Vs. semaine préc.', yoy: 'Vs. il y a 52 semaines', na: 'pas de donnée', none: 'Aucun prix publié cette semaine (cellule contestée ou sans donnée).', loading: 'Chargement…', err: 'Impossible de charger les données.',
      chartW: 'Évolution hebdomadaire', chartM: 'Moyenne mensuelle publiée par le Manitoba, depuis', weeks: 'semaines', tbl: 'Toutes les cultures à la dernière semaine', calc: 'Calcul de Dehesa Index',
      wheat_wrs: 'Blé Western Red Spring', wheat_nhr: 'Blé Northern Hard Red', wheat_rw: 'Blé Red Winter', wheat_sp: 'Blé Special Purpose (Low Vomi)', barley: 'Orge n° 1 CW', flax: 'Lin n° 1 CW', canola: 'Canola n° 1 CR', peas: 'Pois jaunes n° 2', corn: 'Maïs n° 2', oats: 'Avoine n° 2 CW', soybeans: 'Soja', canola_meal: 'Tourteau de canola 34 % (Altona)',
      note: 'Rendement net au comptant de l\'agriculteur à l\'élévateur de Winnipeg (rapport hebdomadaire du vendredi de Manitoba Agriculture), en $ CA par tonne et par boisseau. Il n\'inclut pas les contrats à terme d\'ICE et de Chicago que le même rapport reproduit (données de tiers). Les variations sont calculées par Dehesa Index entre semaines publiées. Une cellule vide est une donnée que le Manitoba ne fournit pas ou qui contredit sa propre variation hebdomadaire : elle n\'est ni corrigée ni remplie. L\'historique mensuel est la moyenne publiée par le Manitoba (Excel de la même page) jusqu\'en déc. 2025 ; aucun rapport hebdomadaire n\'est lié entre le 19 déc. 2025 et le 9 janv. 2026.',
      lic: LIC },
    it: { crop: 'Coltura', t: 'C$/t', bu: 'C$/bushel', wk: 'Settimana del', chg: 'Vs. settimana prec.', yoy: 'Vs. 52 settimane fa', na: 'nessun dato', none: 'Nessun prezzo pubblicato questa settimana (cella contestata o senza dato).', loading: 'Caricamento…', err: 'Impossibile caricare i dati.',
      chartW: 'Andamento settimanale', chartM: 'Media mensile pubblicata dal Manitoba, dal', weeks: 'settimane', tbl: 'Tutte le colture all\'ultima settimana', calc: 'Calcolo di Dehesa Index',
      wheat_wrs: 'Frumento Western Red Spring', wheat_nhr: 'Frumento Northern Hard Red', wheat_rw: 'Frumento Red Winter', wheat_sp: 'Frumento Special Purpose (Low Vomi)', barley: 'Orzo n. 1 CW', flax: 'Lino n. 1 CW', canola: 'Colza (canola) n. 1 CR', peas: 'Piselli gialli n. 2', corn: 'Mais n. 2', oats: 'Avena n. 2 CW', soybeans: 'Soia', canola_meal: 'Farina di colza 34 % (Altona)',
      note: 'Rendimento netto in contanti dell\'agricoltore all\'elevatore di Winnipeg (rapporto settimanale del venerdì di Manitoba Agriculture), in C$ per tonnellata e per bushel. Non include i future di ICE e Chicago che lo stesso rapporto riproduce (dati di terzi). Le variazioni le calcola Dehesa Index tra settimane pubblicate. Una cella vuota è un dato che il Manitoba non fornisce o che contraddice la sua stessa variazione settimanale: non viene corretta né riempita. Lo storico mensile è la media pubblicata dal Manitoba (Excel della stessa pagina) fino a dic. 2025; non ci sono rapporti settimanali collegati tra il 19 dic. 2025 e il 9 gen. 2026.',
      lic: LIC }
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nf(v, d, lang) { try { return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); } catch (e) { return v.toFixed(d); } }
  function pc(v, lang) { return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1, lang) + ' %'; }
  function load() { if (D) return Promise.resolve(D); if (!LD) LD = fetch(F).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { D = d; return d; }); return LD; }
  function cite(period) { var Q = window.DICite; if (!Q) return ''; var c = Q.html('mb_agri', { period: String(period || '') }); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }
  function tile(lab, val, sub) { return '<div class="de-tile"><div class="de-tl">' + esc(lab) + '</div><div class="de-tv">' + val + '</div><div class="de-ts">' + sub + '</div></div>'; }
  function ms(k) { return Date.parse(k + 'T00:00:00Z'); }
  function val(k, i) { var w = D.weeks[k]; return w && w[i] ? w[i][0] : null; }
  /* semana publicada anterior (a 10 dias o menos) y semana de hace 52 semanas exactas (364 dias), solo si existen y llevan dato */
  function before(wk, last, i) { var j = wk.indexOf(last) - 1; if (j < 0) return null; var k = wk[j]; return (ms(last) - ms(k)) / DAY <= 10 && val(k, i) != null ? k : null; }
  function yearAgo(last, i) { var k = new Date(ms(last) - 364 * DAY).toISOString().slice(0, 10); return val(k, i) != null ? k : null; }

  function render(box, st, lang) {
    var t = T[lang], wk = Object.keys(D.weeks).sort(), last = wk[wk.length - 1], i = D.crops.indexOf(st.crop); if (i < 0) i = 0;
    var cur = val(last, i), opts = D.crops.map(function (k) { return '<option value="' + k + '"' + (k === D.crops[i] ? ' selected' : '') + '>' + esc(t[k]) + '</option>'; }).join('');
    var h = '<div class="de-ctl"><label>' + esc(t.crop) + '<br><select class="di-compare-select" data-mbg="crop" data-chips>' + opts + '</select></label></div>', tl = '';
    if (cur != null) {
      var bu = D.weeks[last][i][1], pk = before(wk, last, i), yk = yearAgo(last, i);
      tl += tile(t.t, nf(cur, 2, lang), bu != null ? esc(t.bu) + ': ' + nf(bu, 2, lang) : esc(t.na));
      tl += tile(t.chg, pk ? pc((cur / val(pk, i) - 1) * 100, lang) : '–', pk ? esc(pk) + ' · ' + esc(t.calc) : esc(t.na));
      tl += tile(t.yoy, yk ? pc((cur / val(yk, i) - 1) * 100, lang) : '–', yk ? esc(yk) + ' · ' + esc(t.calc) : esc(t.na));
    } else tl += tile(t.t, '–', esc(t.none));
    h += '<p class="di-movers-hint" style="margin:6px 0 0">' + esc(t.wk) + ' ' + esc(last) + '</p><div class="de-tiles">' + tl + '</div>';
    var pts = []; wk.forEach(function (k) { var v = val(k, i); if (v != null) pts.push({ x: ms(k), y: v, l: k }); });
    var xf = function (x) { var d = new Date(x); return (d.getUTCMonth() + 1) + '/' + String(d.getUTCFullYear()).slice(2); };
    if (pts.length > 1 && window.DehesaChart) h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + esc(t.chartW) + '</b> · ' + esc(t[D.crops[i]]) + ' · ' + wk.length + ' ' + esc(t.weeks) + '</p>' +
      window.DehesaChart.render({ series: [{ name: t[D.crops[i]], color: '#2f6b4a', pts: pts }], xMode: 'time', yTitle: 'C$/t', aria: t.chartW + ' ' + t[D.crops[i]], noLegend: true, vFmt: function (v) { return nf(v, 2, lang); }, yFmt: function (v) { return nf(v, 0, lang); }, xFmt: xf });
    var mm = D.monthly && D.monthly[D.crops[i]] || {}, mk = Object.keys(mm).sort(), mp = mk.map(function (k) { return { x: ms(k + '-01'), y: mm[k], l: k }; });
    if (mp.length > 1 && window.DehesaChart) h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + esc(t.chartM) + ' ' + esc(mk[0]) + '</b> · ' + esc(t[D.crops[i]]) + '</p>' +
      window.DehesaChart.render({ series: [{ name: t[D.crops[i]], color: '#8a5a1f', pts: mp }], xMode: 'time', yTitle: 'C$/t', aria: t.chartM + ' ' + mk[0] + ' ' + t[D.crops[i]], noLegend: true, vFmt: function (v) { return nf(v, 2, lang); }, yFmt: function (v) { return nf(v, 0, lang); }, xFmt: xf });
    h += '<details><summary style="cursor:pointer;font-size:13px">' + esc(t.tbl) + ' · ' + esc(last) + '</summary><div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(t.crop) + '</th><th scope="col" class="r">' + esc(t.t) + '</th><th scope="col" class="r">' + esc(t.bu) + '</th><th scope="col" class="r">' + esc(t.chg) + '</th></tr></thead><tbody>' +
      D.crops.map(function (k, j) { var v = val(last, j), b = D.weeks[last][j][1], p = before(wk, last, j); return '<tr><td>' + esc(t[k]) + '</td><td class="r">' + (v != null ? '<b>' + nf(v, 2, lang) + '</b>' : '–') + '</td><td class="r">' + (b != null ? nf(b, 2, lang) : '–') + '</td><td class="r">' + (v != null && p ? pc((v / val(p, j) - 1) * 100, lang) : '–') + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
    h += '<p class="di-movers-hint">' + esc(t.note) + '</p><p class="di-movers-hint">' + esc(t.lic) + '</p>' + cite(last);
    box.innerHTML = h;
  }

  function mount(body, lang) {
    lang = T[lang] ? lang : 'es'; var t = T[lang], st = { crop: 'canola' };
    body.innerHTML = '<p class="di-movers-hint">' + esc(t.loading) + '</p>';
    load().then(function () { render(body, st, lang); }).catch(function () { body.innerHTML = '<p class="di-movers-hint">' + esc(t.err) + '</p>'; });
    body.addEventListener('change', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-mbg'); if (!a || !D) return;
      st[a] = e.target.value; render(body, st, lang);
      var n = body.querySelector('[data-mbg="' + a + '"]'); if (n) n.focus();
    });
  }
  window.MBGrains = { mount: mount };
})();
