/* Dehesa Index — Alemania: nivel del agua de los rios de navegacion (Rin, Meno, Elba y Danubio), PEGELONLINE de la WSV (DL-DE-Zero-2.0).
   data/de-rivers.json (scripts/update-de-rivers.py). En la pestaña «Sequía» de la ficha de Alemania (js/country-drought.js). Lo mostrado es la lectura actual, el estado
   y las referencias oficiales de la WSV; la media diaria y la serie propia son calculo de Dehesa Index. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Ríos alemanes: nivel del agua', s: 'Nivel en centímetros sobre el cero de cada escala (no es la profundidad del cauce) y caudal en metros cúbicos por segundo. Con el río bajo las barcazas cargan menos y el flete de cereal y abonos sube.',
      cols: ['Río y estación', 'Nivel ahora (cm)', 'Estado', 'Media (cm)', 'Mínimo medio (cm)', 'Caudal (m³/s)'], lv: { low: 'bajo', normal: 'normal', high: 'alto' }, at: 'Última lectura {t} (hora de Alemania)',
      pick: 'Estación', daily: 'Nivel, media diaria', mw: 'Media {a}–{b}', mnw: 'Mínimo medio {a}–{b}', ax: 'cm', glw: 'En el Rin, el nivel equivalente de aguas bajas (GlW) de Kaub es {v} cm.',
      since: 'La serie diaria empieza el {d} y crece cada día: la API solo ofrece los últimos 30 días.',
      note: 'Datos brutos de la Administración federal de vías navegables (WSV), sin revisar. «Estado» es el que publica la WSV: bajo = por debajo de la media de los niveles mínimos (MNW), alto = por encima de la media de los máximos (MHW). La media y el mínimo medio son valores de referencia oficiales de cada estación para el periodo indicado. La media diaria es cálculo de Dehesa Index (días con al menos el 80 % de las lecturas). Un nivel puede quedar por debajo del mínimo medio e incluso del mínimo de referencia; no es un aviso de navegación.' },
    en: { h: 'German rivers: water level', s: 'Level in centimetres above each gauge’s zero (not the depth of the channel) and discharge in cubic metres per second. At low water barges load less and freight for grain and fertiliser rises.',
      cols: ['River and gauge', 'Level now (cm)', 'Status', 'Mean (cm)', 'Mean low (cm)', 'Discharge (m³/s)'], lv: { low: 'low', normal: 'normal', high: 'high' }, at: 'Latest reading {t} (German time)',
      pick: 'Gauge', daily: 'Level, daily mean', mw: 'Mean {a}–{b}', mnw: 'Mean low {a}–{b}', ax: 'cm', glw: 'On the Rhine, the equivalent low-water level (GlW) at Kaub is {v} cm.',
      since: 'The daily series starts on {d} and grows every day: the API only offers the last 30 days.',
      note: 'Raw, unrevised data from Germany’s Federal Waterways and Shipping Administration (WSV). “Status” is the one WSV publishes: low = below the mean of the low-water levels (MNW), high = above the mean of the high-water levels (MHW). The mean and the mean low are official reference values for each gauge over the period shown. The daily mean is a Dehesa Index calculation (days with at least 80% of the readings). A level can fall below the mean low and even below the reference minimum; this is not a navigation warning.' },
    fr: { h: 'Fleuves allemands : niveau de l’eau', s: 'Niveau en centimètres au-dessus du zéro de chaque échelle (pas la profondeur du chenal) et débit en mètres cubes par seconde. À l’étiage, les barges chargent moins et le fret de céréales et d’engrais monte.',
      cols: ['Fleuve et station', 'Niveau actuel (cm)', 'État', 'Moyenne (cm)', 'Minimum moyen (cm)', 'Débit (m³/s)'], lv: { low: 'bas', normal: 'normal', high: 'haut' }, at: 'Dernière mesure {t} (heure allemande)',
      pick: 'Station', daily: 'Niveau, moyenne journalière', mw: 'Moyenne {a}–{b}', mnw: 'Minimum moyen {a}–{b}', ax: 'cm', glw: 'Sur le Rhin, le niveau équivalent d’étiage (GlW) de Kaub est de {v} cm.',
      since: 'La série journalière commence le {d} et s’allonge chaque jour : l’API ne donne que les 30 derniers jours.',
      note: 'Données brutes de l’Administration fédérale des voies navigables (WSV), non révisées. L’« état » est celui que publie la WSV : bas = sous la moyenne des niveaux minimaux (MNW), haut = au-dessus de la moyenne des maximaux (MHW). La moyenne et le minimum moyen sont des valeurs de référence officielles de chaque station pour la période indiquée. La moyenne journalière est un calcul de Dehesa Index (jours avec au moins 80 % des mesures). Un niveau peut passer sous le minimum moyen, voire sous le minimum de référence ; ce n’est pas un avis à la batellerie.' },
    it: { h: 'Fiumi tedeschi: livello dell’acqua', s: 'Livello in centimetri sopra lo zero di ogni asta (non la profondità dell’alveo) e portata in metri cubi al secondo. Con il fiume basso le chiatte caricano meno e il nolo di cereali e concimi sale.',
      cols: ['Fiume e stazione', 'Livello ora (cm)', 'Stato', 'Media (cm)', 'Minimo medio (cm)', 'Portata (m³/s)'], lv: { low: 'basso', normal: 'normale', high: 'alto' }, at: 'Ultima lettura {t} (ora tedesca)',
      pick: 'Stazione', daily: 'Livello, media giornaliera', mw: 'Media {a}–{b}', mnw: 'Minimo medio {a}–{b}', ax: 'cm', glw: 'Sul Reno, il livello equivalente di magra (GlW) a Kaub è {v} cm.',
      since: 'La serie giornaliera inizia il {d} e cresce ogni giorno: l’API offre solo gli ultimi 30 giorni.',
      note: 'Dati grezzi dell’Amministrazione federale delle vie navigabili (WSV), non rivisti. Lo «stato» è quello pubblicato dalla WSV: basso = sotto la media dei livelli minimi (MNW), alto = sopra la media dei massimi (MHW). La media e il minimo medio sono valori di riferimento ufficiali di ogni stazione per il periodo indicato. La media giornaliera è un calcolo di Dehesa Index (giorni con almeno l’80 % delle letture). Un livello può scendere sotto il minimo medio e perfino sotto il minimo di riferimento; non è un avviso alla navigazione.' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, CACHE = null, SEL = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d, lg) { try { return Number(v).toLocaleString(LOC[lg], { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return Number(v).toFixed(d); } }
  function day(s, lg) { var q = String(s).slice(0, 10).split('-'); try { return new Intl.DateTimeFormat(LOC[lg], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+q[0], +q[1] - 1, +q[2]))); } catch (e) { return s; } }
  function when(s, lg) { return day(s, lg) + ', ' + String(s).slice(11, 16); }
  function ts(s) { var q = String(s).split('-'); return Date.UTC(+q[0], +q[1] - 1, +q[2]); }
  var RN = { es: { Rhein: 'Rin', Main: 'Meno', Elbe: 'Elba', Donau: 'Danubio', Mosel: 'Mosela', Neckar: 'Neckar', Weser: 'Weser' }, en: { Rhein: 'Rhine', Main: 'Main', Elbe: 'Elbe', Donau: 'Danube', Mosel: 'Moselle', Neckar: 'Neckar', Weser: 'Weser' }, fr: { Rhein: 'Rhin', Main: 'Main', Elbe: 'Elbe', Donau: 'Danube', Mosel: 'Moselle', Neckar: 'Neckar', Weser: 'Weser' }, it: { Rhein: 'Reno', Main: 'Meno', Elbe: 'Elba', Donau: 'Danubio', Mosel: 'Mosella', Neckar: 'Neckar', Weser: 'Weser' } };
  function rn(s, lg) { return (RN[lg] && RN[lg][s.river]) || s.river; }
  function stName(s, lg) { return rn(s, lg) + ' · ' + s.name; }
  function pr(x) { return x.ref.period ? ' <span style="color:var(--text-faint);font-size:11px;white-space:nowrap">' + esc(x.ref.period[0] + '–' + String(x.ref.period[1]).slice(2)) + '</span>' : ''; }
  function render(el, D, lg) {
    var t = T[lg], S = D.stations, st = S.filter(function (x) { return x.id === SEL; })[0];
    if (!st) { st = S.filter(function (x) { return x.id === 'kaub'; })[0] || S[0]; SEL = st.id; }
    var per = function (x) { var p = x.ref.period; return p ? [p[0], p[1]] : ['', '']; };
    var rows = S.map(function (x) {
      var lv = x.w.state, col = lv === 'low' ? '#b3261e' : lv === 'high' ? '#1d4f91' : '';
      return '<tr><th scope="row" style="text-align:left;padding:7px 6px;border-top:1px solid var(--border);font-weight:400"><strong>' + esc(rn(x, lg)) + '</strong> · ' + esc(x.name) + '</th>' +
        '<td class="cof-n"><b>' + nf(x.w.value, 0, lg) + '</b></td><td class="cof-n">' + (lv ? '<span style="font-weight:600' + (col ? ';color:' + col : '') + '">' + esc(t.lv[lv]) + '</span>' : '—') + '</td>' +
        '<td class="cof-n">' + (x.ref.MW != null ? nf(x.ref.MW, 0, lg) + pr(x) : '—') + '</td><td class="cof-n">' + (x.ref.MNW != null ? nf(x.ref.MNW, 0, lg) + pr(x) : '—') + '</td><td class="cof-n">' + (x.q ? nf(x.q.value, 0, lg) : '—') + '</td></tr>';
    }).join('');
    var head = t.cols.map(function (c, i) { return '<th scope="col" class="' + (i ? 'cof-n' : '') + '" style="' + (i ? '' : 'text-align:left;') + 'padding:8px 6px;font-size:11px;font-weight:700;color:var(--text-faint)">' + esc(c.replace(' {a}–{b}', '')) + '</th>'; }).join('');
    var opts = S.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === st.id ? ' selected' : '') + '>' + esc(stName(x, lg)) + '</option>'; }).join('');
    var pts = st.points.map(function (p) { return { x: ts(p[0]), y: p[1], l: day(p[0], lg) }; }), pp = per(st), ser = [{ name: t.daily, color: '#1d4f91', pts: pts }], x0 = pts.length ? pts[0].x : 0, x1 = pts.length ? pts[pts.length - 1].x : 0;
    if (pts.length > 1) {
      if (st.ref.MW != null) ser.push({ name: t.mw.replace('{a}', pp[0]).replace('{b}', pp[1]), color: '#7a7a7a', dash: true, pts: [{ x: x0, y: st.ref.MW, l: '' }, { x: x1, y: st.ref.MW, l: '' }] });
      if (st.ref.MNW != null) ser.push({ name: t.mnw.replace('{a}', pp[0]).replace('{b}', pp[1]), color: '#c9a227', dash: true, pts: [{ x: x0, y: st.ref.MNW, l: '' }, { x: x1, y: st.ref.MNW, l: '' }] });
    }
    var ch = pts.length > 1 && global.DehesaChart && global.DehesaChart.render ? '<div style="margin-top:12px">' + global.DehesaChart.render({ series: ser, xMode: 'time', yTitle: t.ax, aria: t.daily + ' · ' + stName(st, lg), noLegend: false, legend: true, vFmt: function (v) { return nf(v, 0, lg); } }) + '</div>' : '';
    var kaub = S.filter(function (x) { return x.id === 'kaub'; })[0], glw = kaub && kaub.ref.GlW != null ? '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.glw.replace('{v}', nf(kaub.ref.GlW, 0, lg))) + '</p>' : '';
    var since = st.first ? '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.since.replace('{d}', day(st.first, lg))) + '</p>' : '';
    var cite = global.DICite && global.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + global.DICite.html('pegelonline', D.latestTime.slice(0, 10)) + '</div>' : '';
    el.innerHTML = '<section class="di-card ps-rm" id="de-rivers" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 6px">' + esc(t.s) + '</p>' +
      '<p class="di-movers-hint" style="margin:0 0 8px"><b>' + esc(t.at.replace('{t}', when(D.latestTime, lg))) + '</b></p>' +
      '<div style="overflow-x:auto"><table class="cof-tbl" style="min-width:560px"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<label class="usm-sel" style="display:block;margin-top:14px">' + esc(t.pick) + ' <select id="der-sel" class="di-compare-select">' + opts + '</select></label>' + ch + glw + since +
      '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p>' + cite + '</section>';
    var sel = el.querySelector('#der-sel');
    if (sel) sel.addEventListener('change', function () { SEL = sel.value; render(el, D, lg); var n = el.querySelector('#der-sel'); if (n) n.focus(); });
  }
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/de-rivers.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE.then(function (D) { if (!D || !D.stations || D.stations.length < 3) return false; render(el, D, lg); return true; });
  }
  global.DIDeRivers = { mount: mount };
})(window);
