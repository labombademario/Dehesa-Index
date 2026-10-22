/* Dehesa Index — Edad de los titulares de explotación del Reino Unido (solo Inglaterra) en la ficha de país.
   Datos: data/uk-farmers-age.json (scripts/update-uk-farmers-age.py, Defra «Agricultural workforce in England at 1 June», OGL v3.0).
   Defra publica proporciones por tramo de edad (no recuentos): se muestran tal cual. ES5. */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, IX = { es: 0, en: 1, fr: 2, it: 3 };
  function L(es, en, fr, it) { return [es, en, fr, it]; }
  var BANDS = [['u35', L('Menos de 35 años', 'Under 35', 'Moins de 35 ans', 'Meno di 35 anni')], ['a35', L('35 a 44 años', '35 to 44', '35 à 44 ans', '35-44 anni')], ['a45', L('45 a 54 años', '45 to 54', '45 à 54 ans', '45-54 anni')],
    ['a55', L('55 a 64 años', '55 to 64', '55 à 64 ans', '55-64 anni')], ['o65', L('65 años o más', '65 or over', '65 ans ou plus', '65 anni o più')]];
  var T = {
    h: L('Edad de los titulares de explotación · Inglaterra', 'Age of farm holders · England', 'Âge des exploitants · Angleterre', 'Età dei titolari di azienda · Inghilterra'),
    sub: L('Solo Inglaterra: el Reino Unido en conjunto no publica este dato (Escocia, Gales e Irlanda del Norte lo recogen por separado).', 'England only: the United Kingdom as a whole does not publish this figure (Scotland, Wales and Northern Ireland collect it separately).',
           'Angleterre uniquement : le Royaume-Uni dans son ensemble ne publie pas ce chiffre (l’Écosse, le pays de Galles et l’Irlande du Nord le recueillent séparément).', 'Solo Inghilterra: il Regno Unito nel suo insieme non pubblica questo dato (Scozia, Galles e Irlanda del Nord lo raccolgono a parte).'),
    old: L('Titulares de 65 años o más', 'Holders aged 65 or over', 'Exploitants de 65 ans ou plus', 'Titolari di 65 anni o più'), young: L('Titulares menores de 35 años', 'Holders under 35', 'Exploitants de moins de 35 ans', 'Titolari con meno di 35 anni'),
    women: L('Titulares mujeres', 'Female holders', 'Exploitantes (femmes)', 'Titolari donne'), med: L('Edad mediana', 'Median age', 'Âge médian', 'Età mediana'),
    ys: L('años', 'years', 'ans', 'anni'), hist: L('Evolución desde 1990', 'Trend since 1990', 'Évolution depuis 1990', 'Andamento dal 1990'), yr: L('Año', 'Year', 'Année', 'Anno'),
    note: L('Porcentajes de titulares según su edad, tal como los publica Defra (no son recuentos). Las respuestas son voluntarias. Hasta 2007 la encuesta recogía solo explotaciones principales y desde 2010 todas las comerciales, y en 2021 la edad se preguntó de otra forma (tramos de tamaño y edad media calculada), por eso 2021 no es estrictamente comparable. Años con dato: censo o encuesta de estructura y los anuales recientes.',
            'Percentages of holders by age, as published by Defra (not counts). Responses are voluntary. Up to 2007 the survey covered main holdings only and from 2010 all commercial holdings, and in 2021 age was collected differently (size bands and a calculated average age), so 2021 is not strictly comparable. Years shown: census or structure survey years and the recent annual ones.',
            'Pourcentages d’exploitants selon l’âge, tels que publiés par Defra (pas des effectifs). Les réponses sont facultatives. Jusqu’en 2007 l’enquête ne couvrait que les exploitations principales, puis toutes les exploitations commerciales dès 2010, et en 2021 l’âge a été recueilli autrement (tranches de taille et âge moyen calculé) : 2021 n’est donc pas strictement comparable.',
            'Percentuali di titolari per età, come pubblicate da Defra (non sono conteggi). Le risposte sono facoltative. Fino al 2007 l’indagine copriva solo le aziende principali e dal 2010 tutte quelle commerciali; nel 2021 l’età è stata rilevata in altro modo (fasce di dimensione ed età media calcolata), quindi il 2021 non è del tutto comparabile.'),
    src: L('Fuente:', 'Source:', 'Source :', 'Fonte:'), srcA: L('Defra, Agricultural workforce in England at 1 June (OGL v3.0)', 'Defra, Agricultural workforce in England at 1 June (OGL v3.0)', 'Defra, Agricultural workforce in England at 1 June (OGL v3.0)', 'Defra, Agricultural workforce in England at 1 June (OGL v3.0)')
  };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var DOC = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = LOC[lg] ? lg : 'es'; var i = IX[lg];
    var nf = function (v, d) { return v == null ? '—' : (+v).toLocaleString(LOC[lg], { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
    var sp = global.DehesaShared && global.DehesaShared.sitePath ? global.DehesaShared.sitePath : function (u) { return u; };
    DOC = DOC || fetch(sp('data/uk-farmers-age.json')).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return DOC.then(function (d) {
      if (!d || !d.years || !d.all || !d.all.o65) return false;
      var n = d.years.length - 1, y = d.years[n], A = d.all, v = function (k) { return A[k][n]; };
      var mx = Math.max.apply(null, BANDS.map(function (b) { return v(b[0]) || 0; })) || 1;
      var bars = BANDS.map(function (b) { var p = v(b[0]); return '<div class="fsh-age-r"><span>' + esc(b[1][i]) + '</span><span class="fsh-bar wide"><i style="width:' + (p / mx * 100).toFixed(1) + '%"></i></span><b>' + nf(p, 1) + ' %</b></div>'; }).join('');
      var kp = function (lab, val, extra) { return '<div class="fsh-kpi"><div class="fsh-kl">' + esc(lab) + '</div><div class="fsh-kv">' + val + '</div><div class="fsh-kp">' + esc(extra || '') + '</div></div>'; };
      var first = d.years.indexOf(2000) > -1 ? d.years.indexOf(2000) : 0, md = d.medianAge && d.medianAge.all ? d.medianAge.all[n] : null, fem = d.sex && d.sex.female ? d.sex.female[n] : null;
      var kpis = kp(T.old[i], nf(v('o65'), 1) + ' %', y + ' · ' + d.years[first] + ': ' + nf(A.o65[first], 1) + ' %') + kp(T.young[i], nf(v('u35'), 1) + ' %', y + ' · ' + d.years[first] + ': ' + nf(A.u35[first], 1) + ' %') +
        (fem != null ? kp(T.women[i], nf(fem, 1) + ' %', String(y)) : '') + (md != null ? kp(T.med[i], nf(md, 0) + ' ' + T.ys[i], String(y)) : '');
      var rows = d.years.map(function (yy, k) { return '<tr' + (k === n ? ' class="on"' : '') + '><td>' + esc(yy) + (yy === 2021 ? ' *' : '') + '</td>' + BANDS.map(function (b) { return '<td class="num">' + nf(A[b[0]][k], 1) + '</td>'; }).join('') + '</tr>'; }).reverse().join('');
      var tbl = '<details class="sec-fold" style="margin-top:10px"><summary>' + esc(T.hist[i]) + '</summary><div class="di-table-wrap"><table class="di-table fsh-tbl"><thead><tr><th>' + esc(T.yr[i]) + '</th>' + BANDS.map(function (b) { return '<th class="num">' + esc(b[1][i]) + ' (%)</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></details>';
      el.innerHTML = '<section class="di-card ps-rm gb-card" id="ps-uk-farmers-age" style="max-width:none"><h2 class="ps-rm-h">' + esc(T.h[i]) + ' · ' + esc(y) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(T.sub[i]) + '</p>' +
        '<div class="fsh-kpis">' + kpis + '</div><div class="fsh-mgr-two"><div class="fsh-age">' + bars + '</div></div>' + tbl +
        '<p class="di-movers-hint" style="margin:10px 0 0;max-width:860px">' + esc(T.note[i]) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(T.src[i]) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(T.srcA[i]) + '</a></p></section>';
      return true;
    });
  }
  global.DIUkFarmersAge = { mount: mount };
})(window);
