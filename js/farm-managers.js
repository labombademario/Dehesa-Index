/* Dehesa Index — Edad de los jefes de explotación en la ficha de país (26 países de la UE).
   Datos: data/views/farm-managers.json (scripts/build-views.py, desde Eurostat ef_fsi_agesex: número de explotaciones según la edad y el sexo de su jefe).
   Los porcentajes los calcula esta ficha (franja / total de jefes del mismo año) y se rotulan como cálculo de Dehesa Index. ES5. */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, IX = { es: 0, en: 1, fr: 2, it: 3 };
  function L(es, en, fr, it) { return [es, en, fr, it]; }
  var BANDS = [['y_lt25', L('Menos de 25 años', 'Under 25', 'Moins de 25 ans', 'Meno di 25 anni')], ['y25-34', L('25 a 34 años', '25 to 34', '25 à 34 ans', '25-34 anni')], ['y35-39', L('35 a 39 años', '35 to 39', '35 à 39 ans', '35-39 anni')],
    ['y40-44', L('40 a 44 años', '40 to 44', '40 à 44 ans', '40-44 anni')], ['y35-44', L('35 a 44 años', '35 to 44', '35 à 44 ans', '35-44 anni')], ['y45-54', L('45 a 54 años', '45 to 54', '45 à 54 ans', '45-54 anni')], ['y55-64', L('55 a 64 años', '55 to 64', '55 à 64 ans', '55-64 anni')],
    ['y_ge65', L('65 años o más', '65 or over', '65 ans ou plus', '65 anni o più')]];
  var T = {
    h: L('Edad de los jefes de explotación', 'Age of farm managers', 'Âge des chefs d’exploitation', 'Età dei capi azienda'),
    sub: L('Explotaciones según la edad de quien las dirige, en el último censo o encuesta de estructura publicado.', 'Holdings by the age of the person who manages them, in the latest published census or farm structure survey.', 'Exploitations selon l’âge de la personne qui les dirige, dans le dernier recensement ou enquête sur la structure publié.', 'Aziende secondo l’età di chi le dirige, nell’ultimo censimento o indagine sulla struttura pubblicato.'),
    yrs: L('años', 'years', 'ans', 'anni'),
    old: L('Jefes de 65 años o más', 'Managers aged 65 or over', 'Chefs de 65 ans ou plus', 'Capi azienda di 65 anni o più'),
    young: L('Jefes menores de 40 años', 'Managers under 40', 'Chefs de moins de 40 ans', 'Capi azienda con meno di 40 anni'),
    women: L('Explotaciones dirigidas por mujeres', 'Holdings managed by women', 'Exploitations dirigées par des femmes', 'Aziende dirette da donne'),
    total: L('Jefes de explotación (explotaciones)', 'Farm managers (holdings)', 'Chefs d’exploitation (exploitations)', 'Capi azienda (aziende)'),
    in: L('en', 'in', 'en', 'nel'),
    cmp: L('Comparar con los demás países de la UE', 'Compare with the other EU countries', 'Comparer avec les autres pays de l’UE', 'Confronta con gli altri paesi dell’UE'),
    cc: L('País', 'Country', 'Pays', 'Paese'), yr: L('Año', 'Year', 'Année', 'Anno'),
    note: L('Porcentajes calculados por Dehesa Index con las cifras de Eurostat (número de explotaciones según la edad y el sexo de su jefe; el total incluye todas las edades). La encuesta es periódica: 2010, 2013, 2016, 2020 (censo agrario) y 2023. En 2010 y 2013 Eurostat agrupa 35 a 44 años; desde 2016 lo parte en 35-39 y 40-44, por eso los menores de 40 solo se pueden contar desde 2016.',
            'Percentages calculated by Dehesa Index from Eurostat figures (number of holdings by age and sex of the manager; the total covers all ages). The survey is periodic: 2010, 2013, 2016, 2020 (agricultural census) and 2023. In 2010 and 2013 Eurostat groups 35 to 44; from 2016 it splits it into 35-39 and 40-44, so managers under 40 can only be counted from 2016.',
            'Pourcentages calculés par Dehesa Index à partir des chiffres d’Eurostat (nombre d’exploitations selon l’âge et le sexe du chef ; le total couvre tous les âges). L’enquête est périodique : 2010, 2013, 2016, 2020 (recensement agricole) et 2023. En 2010 et 2013, Eurostat regroupe les 35-44 ans ; depuis 2016 il les sépare en 35-39 et 40-44, d’où les moins de 40 ans comptés seulement depuis 2016.',
            'Percentuali calcolate da Dehesa Index sui dati Eurostat (numero di aziende secondo età e sesso del capo azienda; il totale comprende tutte le età). L’indagine è periodica: 2010, 2013, 2016, 2020 (censimento agricolo) e 2023. Nel 2010 e nel 2013 Eurostat raggruppa 35-44 anni; dal 2016 li divide in 35-39 e 40-44, per cui i minori di 40 anni si contano solo dal 2016.'),
    src: L('Fuente:', 'Source:', 'Source :', 'Fonte:'),
    srcA: L('Eurostat, ef_fsi_agesex (reutilización según la Decisión 2011/833/UE)', 'Eurostat, ef_fsi_agesex (reuse under Decision 2011/833/EU)', 'Eurostat, ef_fsi_agesex (réutilisation selon la décision 2011/833/UE)', 'Eurostat, ef_fsi_agesex (riutilizzo secondo la decisione 2011/833/UE)')
  };
  var N = { ES: L('España', 'Spain', 'Espagne', 'Spagna'), FR: L('Francia', 'France', 'France', 'Francia'), DE: L('Alemania', 'Germany', 'Allemagne', 'Germania'), BE: L('Bélgica', 'Belgium', 'Belgique', 'Belgio'),
    AT: L('Austria', 'Austria', 'Autriche', 'Austria'), PT: L('Portugal', 'Portugal', 'Portugal', 'Portogallo'), IT: L('Italia', 'Italy', 'Italie', 'Italia'), DK: L('Dinamarca', 'Denmark', 'Danemark', 'Danimarca'),
    NL: L('Países Bajos', 'Netherlands', 'Pays-Bas', 'Paesi Bassi'), PL: L('Polonia', 'Poland', 'Pologne', 'Polonia'), EL: L('Grecia', 'Greece', 'Grèce', 'Grecia'), IE: L('Irlanda', 'Ireland', 'Irlande', 'Irlanda'),
    FI: L('Finlandia', 'Finland', 'Finlande', 'Finlandia'), BG: L('Bulgaria', 'Bulgaria', 'Bulgarie', 'Bulgaria'), HR: L('Croacia', 'Croatia', 'Croatie', 'Croazia'), LT: L('Lituania', 'Lithuania', 'Lituanie', 'Lituania'),
    SK: L('Eslovaquia', 'Slovakia', 'Slovaquie', 'Slovacchia'), CZ: L('Chequia', 'Czechia', 'Tchéquie', 'Cechia'), EE: L('Estonia', 'Estonia', 'Estonie', 'Estonia'), HU: L('Hungría', 'Hungary', 'Hongrie', 'Ungheria'),
    LV: L('Letonia', 'Latvia', 'Lettonie', 'Lettonia'), RO: L('Rumanía', 'Romania', 'Roumanie', 'Romania'), SE: L('Suecia', 'Sweden', 'Suède', 'Svezia'), SI: L('Eslovenia', 'Slovenia', 'Slovénie', 'Slovenia'),
    CY: L('Chipre', 'Cyprus', 'Chypre', 'Cipro'), LU: L('Luxemburgo', 'Luxembourg', 'Luxembourg', 'Lussemburgo'), MT: L('Malta', 'Malta', 'Malte', 'Malta') };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function at(a, y) { for (var i = 0; a && i < a.length; i++) if (a[i][0] === y) return a[i][1]; return null; }
  function stats(o, y) {
    var tot = at(o.total, y); if (!tot) return null;
    var g = function (k) { return at(o[k], y); }, young = null;
    if (g('y35-39') != null && g('y_lt25') != null && g('y25-34') != null) young = (g('y_lt25') + g('y25-34') + g('y35-39')) / tot * 100;
    return { y: y, tot: tot, old: g('y_ge65') != null ? g('y_ge65') / tot * 100 : null, young: young, women: at(o.women, y) != null ? at(o.women, y) / tot * 100 : null };
  }
  var DOC = null;
  function mount(el, lg, cc) {
    if (!el) return Promise.resolve(false); lg = LOC[lg] ? lg : 'es'; var i = IX[lg];
    var nf = function (v, d) { return v == null ? '—' : (+v).toLocaleString(LOC[lg], { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
    var sp = global.DehesaShared && global.DehesaShared.sitePath ? global.DehesaShared.sitePath : function (u) { return u; };
    DOC = DOC || fetch(sp('data/views/farm-managers.json')).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return DOC.then(function (d) {
      var o = d && d.countries && d.countries[cc]; if (!o || !o.total || !o.total.length) return false;
      var y = o.total[o.total.length - 1][0], s = stats(o, y), y0 = o.total[0][0], s0 = y0 !== y ? stats(o, y0) : null;
      var bands = BANDS.filter(function (b) { return at(o[b[0]], y) != null; });
      var mx = Math.max.apply(null, bands.map(function (b) { return at(o[b[0]], y) / s.tot * 100; })) || 1;
      var bars = bands.map(function (b) { var v = at(o[b[0]], y), p = v / s.tot * 100;
        return '<div class="fsh-age-r"><span>' + esc(b[1][i]) + '</span><span class="fsh-bar wide"><i style="width:' + (p / mx * 100).toFixed(1) + '%"></i></span><b>' + nf(p, 1) + ' %</b><span class="fsh-m" style="min-width:80px;text-align:right">' + nf(v, 0) + '</span></div>'; }).join('');
      var kp = function (lab, v, extra) { return '<div class="fsh-kpi"><div class="fsh-kl">' + esc(lab) + '</div><div class="fsh-kv">' + v + '</div><div class="fsh-kp">' + esc(extra || '') + '</div></div>'; };
      var kpis = kp(T.old[i], s.old != null ? nf(s.old, 1) + ' %' : '—', y + (s0 && s0.old != null ? ' · ' + y0 + ': ' + nf(s0.old, 1) + ' %' : '')) +
        (s.young != null ? kp(T.young[i], nf(s.young, 1) + ' %', y) : '') +
        (s.women != null ? kp(T.women[i], nf(s.women, 1) + ' %', y + (s0 && s0.women != null ? ' · ' + y0 + ': ' + nf(s0.women, 1) + ' %' : '')) : '') +
        kp(T.total[i], nf(s.tot, 0), y + (s0 ? ' · ' + y0 + ': ' + nf(s0.tot, 0) : ''));
      var rows = Object.keys(d.countries).map(function (k) { var c = d.countries[k], yy = c.total[c.total.length - 1][0]; return { cc: k, s: stats(c, yy) }; }).filter(function (r) { return r.s; })
        .sort(function (a, b) { return (b.s.old || 0) - (a.s.old || 0); });
      var cmp = '<details class="sec-fold" style="margin-top:10px"><summary>' + esc(T.cmp[i]) + '</summary><div class="di-table-wrap"><table class="di-table fsh-tbl"><thead><tr><th>' + esc(T.cc[i]) + '</th><th class="num">' + esc(T.old[i]) + '</th><th class="num">' + esc(T.young[i]) + '</th><th class="num">' + esc(T.women[i]) + '</th><th class="num">' + esc(T.yr[i]) + '</th></tr></thead><tbody>' +
        rows.map(function (r) { return '<tr' + (r.cc === cc ? ' class="on"' : '') + '><td>' + esc((N[r.cc] || [r.cc, r.cc, r.cc, r.cc])[i]) + '</td><td class="num">' + (r.s.old != null ? nf(r.s.old, 1) + ' %' : '—') + '</td><td class="num">' + (r.s.young != null ? nf(r.s.young, 1) + ' %' : '—') + '</td><td class="num">' + (r.s.women != null ? nf(r.s.women, 1) + ' %' : '—') + '</td><td class="num">' + esc(r.s.y) + '</td></tr>'; }).join('') +
        '</tbody></table></div></details>';
      el.innerHTML = '<section class="di-card ps-rm gb-card" id="ps-farm-managers" style="max-width:none"><h2 class="ps-rm-h">' + esc(T.h[i]) + ' · ' + esc(y) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(T.sub[i]) + '</p>' +
        '<div class="fsh-kpis">' + kpis + '</div><div class="fsh-age">' + bars + '</div>' + cmp +
        '<p class="di-movers-hint" style="margin:10px 0 0;max-width:860px">' + esc(T.note[i]) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(T.src[i]) + ' <a href="https://ec.europa.eu/eurostat/databrowser/view/ef_fsi_agesex/default/table" target="_blank" rel="noopener noreferrer">' + esc(T.srcA[i]) + '</a></p></section>';
      return true;
    });
  }
  global.DIFarmManagers = { mount: mount };
})(window);
