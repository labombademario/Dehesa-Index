/* Dehesa Index — Sacrificio diario de EE. UU. (USDA AMS, informe MARS 3208 «Daily Livestock and Poultry Slaughter»). ES5.
   Lee data/us-markets/slaughter.json (scripts/update-us-slaughter.py): cabezas sacrificadas por día bajo inspección federal (vacuno, terneros, cerdo, ovino, pollo joven).
   Es una ESTIMACIÓN del día que el informe revisa al día siguiente. Las comparaciones con hace una semana y hace un año usan las cifras que publica el informe y se calculan aquí
   (se dice en la nota); el acumulado anual y su variación son los del informe. Solo cabezas: el informe no trae pesos ni producción de carne. */
(function () {
  'use strict';
  var D = null, SEL = 'cattle';
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var KEYS = ['cattle', 'calves', 'hogs', 'sheep', 'chicken'];
  var N = { cattle: ['Vacuno', 'Cattle', 'Bovins', 'Bovini'], calves: ['Terneros', 'Calves', 'Veaux', 'Vitelli'], hogs: ['Cerdos', 'Hogs', 'Porcs', 'Suini'], sheep: ['Ovino', 'Sheep and lambs', 'Ovins', 'Ovini'], chicken: ['Pollo (joven)', 'Young chickens', 'Poulets (jeunes)', 'Polli (giovani)'] };
  var T = {
    es: { h: 'Sacrificio diario en EE. UU.', sub: 'Animales sacrificados cada día en mataderos con inspección federal, según el informe diario de USDA AMS. Es una estimación del propio día; el informe la revisa al día siguiente.', day: 'Último día', wk: 'vs. hace una semana', yr: 'vs. hace un año', wtd: 'Semana en curso', ytd: 'Año hasta hoy', ytdS: 'vs. mismo periodo del año anterior (cifra del informe)', date: 'Día', head: 'Cabezas', rev: 'revisado', revT: 'Cifra revisada respecto a la del día anterior',
      chartH: 'Últimos 90 días hábiles: este año y el mismo día de la semana del año anterior', ty: 'Este año', ly: 'Año anterior', unit: 'cabezas', tab: 'Últimos días', cls: 'Vacuno por clase (día anterior)', sh: 'Novillos y novillas', cb: 'Vacas y toros', cn: 'El informe da el desglose por clase del día anterior.',
      note: 'Solo cabezas: el informe no incluye pesos ni producción de carne. Las variaciones frente a hace una semana y un año las calcula Dehesa Index con las cifras del informe; el acumulado anual es el que publica el informe. Incluye el sábado cuando hay sacrificio. Pollo: solo pollo joven.', src: 'Fuente: USDA AMS, Daily Livestock and Poultry Slaughter (informe 3208). Estimación del día; se revisa al día siguiente.', alt: 'Cabezas sacrificadas por día, {n}: este año frente al año anterior', open: 'Ver el informe original' },
    en: { h: 'U.S. daily slaughter', sub: 'Animals slaughtered each day at federally inspected plants, from the daily USDA AMS report. It is an estimate for the day itself, which the report revises the next day.', day: 'Latest day', wk: 'vs. a week ago', yr: 'vs. a year ago', wtd: 'Week to date', ytd: 'Year to date', ytdS: 'vs. same period last year (report figure)', date: 'Day', head: 'Head', rev: 'revised', revT: 'Figure revised from the previous day’s report',
      chartH: 'Last 90 working days: this year and the same weekday a year earlier', ty: 'This year', ly: 'Year earlier', unit: 'head', tab: 'Recent days', cls: 'Cattle by class (previous day)', sh: 'Steers and heifers', cb: 'Cows and bulls', cn: 'The report splits cattle by class for the previous day.',
      note: 'Head counts only: the report has no weights or meat production. Changes against a week and a year ago are calculated by Dehesa Index from the report’s figures; the year-to-date change is the one the report publishes. Saturday is included when there is slaughter. Chicken: young chickens only.', src: 'Source: USDA AMS, Daily Livestock and Poultry Slaughter (report 3208). Estimate for the day; revised the next day.', alt: 'Head slaughtered per day, {n}: this year versus a year earlier', open: 'See the original report' },
    fr: { h: 'Abattages quotidiens aux États-Unis', sub: 'Animaux abattus chaque jour dans les abattoirs sous inspection fédérale, d’après le rapport quotidien de l’USDA AMS. C’est une estimation du jour même, que le rapport révise le lendemain.', day: 'Dernier jour', wk: 'vs. il y a une semaine', yr: 'vs. il y a un an', wtd: 'Semaine en cours', ytd: 'Depuis le début de l’année', ytdS: 'vs. même période de l’an dernier (chiffre du rapport)', date: 'Jour', head: 'Têtes', rev: 'révisé', revT: 'Chiffre révisé par rapport à celui de la veille',
      chartH: '90 derniers jours ouvrés : cette année et le même jour de la semaine un an plus tôt', ty: 'Cette année', ly: 'Année précédente', unit: 'têtes', tab: 'Derniers jours', cls: 'Bovins par catégorie (veille)', sh: 'Bouvillons et génisses', cb: 'Vaches et taureaux', cn: 'Le rapport détaille les bovins par catégorie pour la veille.',
      note: 'Nombre de têtes uniquement : le rapport ne donne ni poids ni production de viande. Les variations par rapport à il y a une semaine et un an sont calculées par Dehesa Index à partir des chiffres du rapport ; la variation depuis le début de l’année est celle du rapport. Le samedi est inclus quand il y a des abattages. Poulet : poulets jeunes seulement.', src: 'Source : USDA AMS, Daily Livestock and Poultry Slaughter (rapport 3208). Estimation du jour ; révisée le lendemain.', alt: 'Têtes abattues par jour, {n} : cette année contre l’an dernier', open: 'Voir le rapport d’origine' },
    it: { h: 'Macellazioni giornaliere negli USA', sub: 'Animali macellati ogni giorno negli impianti sotto ispezione federale, dal rapporto giornaliero dell’USDA AMS. È una stima del giorno stesso, che il rapporto rivede il giorno dopo.', day: 'Ultimo giorno', wk: 'vs. una settimana fa', yr: 'vs. un anno fa', wtd: 'Settimana in corso', ytd: 'Da inizio anno', ytdS: 'vs. stesso periodo dell’anno scorso (dato del rapporto)', date: 'Giorno', head: 'Capi', rev: 'rivisto', revT: 'Dato rivisto rispetto a quello del giorno prima',
      chartH: 'Ultimi 90 giorni lavorativi: quest’anno e lo stesso giorno della settimana un anno prima', ty: 'Quest’anno', ly: 'Anno precedente', unit: 'capi', tab: 'Ultimi giorni', cls: 'Bovini per categoria (giorno prima)', sh: 'Manzi e manze', cb: 'Vacche e tori', cn: 'Il rapporto divide i bovini per categoria per il giorno precedente.',
      note: 'Solo numero di capi: il rapporto non include pesi né produzione di carne. Le variazioni rispetto a una settimana e a un anno fa sono calcolate da Dehesa Index con i dati del rapporto; la variazione da inizio anno è quella pubblicata nel rapporto. Il sabato è incluso quando ci sono macellazioni. Pollo: solo polli giovani.', src: 'Fonte: USDA AMS, Daily Livestock and Poultry Slaughter (rapporto 3208). Stima del giorno; rivista il giorno dopo.', alt: 'Capi macellati al giorno, {n}: quest’anno contro l’anno scorso', open: 'Vedi il rapporto originale' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); } catch (e) { return v.toFixed(d); } }
  function day(iso) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function dshort(iso) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function pc(a, b) { if (a == null || !b) return null; return (a / b - 1) * 100; }
  function fp(v) { return v == null || !isFinite(v) ? '—' : (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + nf(Math.abs(v), 1) + ' %'; }
  function col(v) { return v == null ? 'inherit' : v > 0.05 ? 'var(--up, #2c6e49)' : v < -0.05 ? 'var(--down, #a33)' : 'inherit'; }
  function big(v) { return v == null ? '—' : nf(v, 0); }
  function chart(rows, t, label) {
    if (!window.DehesaChart || !window.DehesaChart.render) return '';
    var wk = rows.filter(function (r) { var d = new Date(r[0] + 'T00:00:00Z').getUTCDay(); return d > 0 && d < 6; }).slice(-90);
    if (wk.length < 10) return '';
    function ts(s) { var q = s.split('-'); return Date.UTC(+q[0], +q[1] - 1, +q[2]); }
    var a = wk.map(function (r) { return { x: ts(r[0]), y: r[1], l: dshort(r[0]) }; }), b = wk.filter(function (r) { return r[3] != null; }).map(function (r) { return { x: ts(r[0]), y: r[3], l: dshort(r[0]) }; });
    return '<div style="margin-top:12px">' + window.DehesaChart.render({ series: [{ name: t.ty, color: '#1d5178', pts: a }, { name: t.ly, color: '#b58a5b', pts: b }], xMode: 'time', yTitle: t.unit, aria: t.alt.replace('{n}', label), zero: false, noLegend: false, vFmt: function (v) { return nf(v, 0); } }) + '</div>';
  }
  function render() {
    var root = document.getElementById('nsl'); if (!root || !D) return;
    var t = T[lang()] || T.es, P = LI[lang()] || 0, S = D.species, cards = KEYS.map(function (k) {
      var rs = S[k].rows, l = rs[rs.length - 1], on = k === SEL;
      return '<button type="button" class="di-card cof-card nsl-card" data-k="' + k + '" aria-pressed="' + on + '" style="text-align:left;cursor:pointer;font:inherit;color:inherit' + (on ? ';outline:2px solid var(--accent)' : '') + '"><div class="cof-n">' + esc(N[k][P]) + '</div><div class="cof-v" style="font-size:22px;font-weight:700;font-variant-numeric:tabular-nums">' + esc(big(l[1])) + '</div><div class="di-movers-hint" style="margin:0">' + esc(day(l[0])) + '</div>' +
        '<div class="cof-chg" style="color:' + col(pc(l[1], l[2])) + '">' + esc(fp(pc(l[1], l[2]))) + ' <span>' + esc(t.wk) + '</span></div><div class="cof-chg" style="color:' + col(pc(l[1], l[3])) + '">' + esc(fp(pc(l[1], l[3]))) + ' <span>' + esc(t.yr) + '</span></div>' +
        '<div class="cof-chg" style="color:' + col(l[9]) + '">' + esc(fp(l[9])) + ' <span>' + esc(t.ytd) + '</span></div></button>';
    }).join('');
    var rows = S[SEL].rows, l = rows[rows.length - 1], last = rows.slice(-10).reverse();
    var th = 'padding:8px 6px;font-size:11px;font-weight:700;color:var(--text-faint);', td = 'padding:7px 6px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums;text-align:right;';
    var tab = '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:520px;font-size:13.5px"><thead><tr><th scope="col" style="' + th + 'text-align:left">' + esc(t.date) + '</th><th scope="col" style="' + th + 'text-align:right">' + esc(t.head) + '</th><th scope="col" style="' + th + 'text-align:right">' + esc(t.wk) + '</th><th scope="col" style="' + th + 'text-align:right">' + esc(t.yr) + '</th></tr></thead><tbody>' +
      last.map(function (r) { return '<tr><td style="' + td + 'text-align:left">' + esc(day(r[0])) + (r[10] ? ' <span class="di-movers-hint" title="' + esc(t.revT) + '">· ' + esc(t.rev) + '</span>' : '') + '</td><td style="' + td + '">' + esc(big(r[1])) + '</td><td style="' + td + 'color:' + col(pc(r[1], r[2])) + '">' + esc(fp(pc(r[1], r[2]))) + '</td><td style="' + td + 'color:' + col(pc(r[1], r[3])) + '">' + esc(fp(pc(r[1], r[3]))) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var sum = '<p class="cof-note" style="margin-top:10px"><b>' + esc(t.wtd) + ':</b> ' + esc(big(l[4])) + ' (' + esc(fp(pc(l[4], l[6]))) + ' ' + esc(t.yr) + ') · <b>' + esc(t.ytd) + ':</b> ' + esc(big(l[7])) + ' (' + esc(fp(l[9])) + ', ' + esc(t.ytdS) + ')</p>';
    var cl = '';
    if (SEL === 'cattle') {
      var cc = D.cattleClasses, ks = Object.keys(cc).sort().slice(-10).reverse();
      cl = '<details class="usm-more"><summary>' + esc(t.cls) + '</summary><p class="di-movers-hint">' + esc(t.cn) + '</p><div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:420px;font-size:13.5px"><thead><tr><th scope="col" style="' + th + 'text-align:left">' + esc(t.date) + '</th><th scope="col" style="' + th + 'text-align:right">' + esc(t.sh) + '</th><th scope="col" style="' + th + 'text-align:right">' + esc(t.cb) + '</th></tr></thead><tbody>' +
        ks.map(function (k) { return '<tr><td style="' + td + 'text-align:left">' + esc(day(k)) + '</td><td style="' + td + '">' + esc(big(cc[k].steersHeifers)) + '</td><td style="' + td + '">' + esc(big(cc[k].cowsBulls)) + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
    }
    var cite = window.DICite && window.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + window.DICite.html('usda_ams_mars', { period: day(l[0]) }) + '</div>' : '';
    root.innerHTML = '<h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + '</p><div class="cof-cards">' + cards + '</div><h3 class="cof-h3">' + esc(N[SEL][P]) + ' · ' + esc(t.chartH) + '</h3>' + chart(rows, t, N[SEL][P]) + sum +
      '<h3 class="cof-h3">' + esc(N[SEL][P]) + ' · ' + esc(t.tab) + '</h3>' + tab + cl + '<p class="cof-note">' + esc(t.note) + ' ' + esc(t.src) + ' <a href="' + esc(D.report.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.open) + '</a></p>' + cite;
    Array.prototype.forEach.call(root.querySelectorAll('.nsl-card'), function (b) { b.onclick = function () { SEL = b.getAttribute('data-k'); render(); }; });
  }
  function boot() {
    if (!document.getElementById('nsl')) return;
    Promise.all([fetch('data/us-markets/slaughter.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DICite ? window.DICite.load().catch(function () { return null; }) : Promise.resolve(null)]).then(function (a) {
      D = a[0] && a[0].species && a[0].species.cattle && a[0].species.cattle.rows.length > 20 ? a[0] : null; render();
    });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
