/* Dehesa Index — Tierra agraria y regadío (Eurostat): precio de la tierra por región y % de superficie regada en FR, IT, PL, PT, DE, BE, HR y EL.
   data/eu-land/land.json (scripts/update-eu-land.py). Bloque de la ficha de país. ES5. window.DIEuLand. Usa window.ESUI (js/es-ui.js). */
(function (global) {
  'use strict';
  var U = global.ESUI, D = null, ST = { m: 'irr', r: '' };
  var T = {
    es: { h: 'Tierra agraria y regadío', m: { irr: '% de superficie regada', ara: 'Precio de la tierra arable', gra: 'Precio del pasto permanente', aib: 'Arable de regadio posible', axb: 'Arable de secano' },
      metric: 'Mostrar', reg: 'Región', nat: 'Total nacional', irrC: 'Superficie regada', of: 'de la superficie agraria útil ({y})', araC: 'Tierra arable', graC: 'Pasto permanente', perHa: '€/ha',
      cmpH: 'Regadío frente a secano (tierra arable)', cmpIr: 'Regadío posible', cmpDry: 'Secano', prem: 'El regadío vale {p} % más', less: 'El regadío figura {p} % por debajo del secano',
      byReg: 'Por región · {m} · {y}', none: 'Sin dato publicado para esta región.', ha: 'ha regadas',
      nIrr: 'Superficie regada en los últimos 12 meses sobre la superficie agraria útil, según la encuesta de estructura de las explotaciones de Eurostat. Año {y}: es el último que Eurostat publica para este país.',
      nPrice: 'Precios medios de venta de la tierra agraria libre de arrendamiento (Eurostat), en euros por hectárea. En cada vista se comparan regiones del mismo año.',
      nDE: 'Alemania no publica precio de la tierra en Eurostat: aquí solo se muestra el regadío.',
      nIT: 'Italia: Eurostat publica el arable de regadío posible y el de secano solo hasta 2020, y en 2019-2020 las dos series se cruzan (el de secano figura por encima). Se muestra tal como lo publican, sin corregir.',
      nEL: 'Grecia: Eurostat separa la tierra arable de regadío posible y de secano. Es una clasificación oficial, no una estimación.',
      nSplit: 'Francia, Portugal, Bélgica, Croacia y Alemania no separan el precio de regadío y secano en las estadísticas oficiales: solo se puede ver qué parte de la superficie se riega.', src: 'Fuente:' },
    en: { h: 'Farmland and irrigation', m: { irr: 'Irrigated share of land', ara: 'Arable land price', gra: 'Permanent grassland price', aib: 'Irrigable arable land', axb: 'Non-irrigable arable land' },
      metric: 'Show', reg: 'Region', nat: 'National total', irrC: 'Irrigated area', of: 'of utilised agricultural area ({y})', araC: 'Arable land', graC: 'Permanent grassland', perHa: '€/ha',
      cmpH: 'Irrigable vs non-irrigable (arable land)', cmpIr: 'Irrigable', cmpDry: 'Non-irrigable', prem: 'Irrigable land costs {p} % more', less: 'Irrigable land is listed {p} % below non-irrigable',
      byReg: 'By region · {m} · {y}', none: 'No published figure for this region.', ha: 'ha irrigated',
      nIrr: 'Area irrigated in the last 12 months over utilised agricultural area, from Eurostat’s farm structure survey. Year {y}: the latest Eurostat publishes for this country.',
      nPrice: 'Average selling prices of agricultural land free of lease (Eurostat), euro per hectare. Each view compares regions of the same year.',
      nDE: 'Germany does not publish land prices in Eurostat: only irrigation is shown here.',
      nIT: 'Italy: Eurostat publishes irrigable and non-irrigable arable land only up to 2020, and in 2019-2020 the two series cross (non-irrigable shows higher). Shown as published, uncorrected.',
      nEL: 'Greece: Eurostat separates irrigable from non-irrigable arable land. It is an official classification, not an estimate.',
      nSplit: 'France, Portugal, Belgium, Croatia and Germany do not split land prices into irrigated and dry in official statistics: only the irrigated share of land can be shown.', src: 'Source:' },
    fr: { h: 'Terres agricoles et irrigation', m: { irr: 'Part de surface irriguée', ara: 'Prix des terres arables', gra: 'Prix des prairies permanentes', aib: 'Terres arables irrigables', axb: 'Terres arables non irrigables' },
      metric: 'Afficher', reg: 'Région', nat: 'Total national', irrC: 'Surface irriguée', of: 'de la surface agricole utile ({y})', araC: 'Terres arables', graC: 'Prairies permanentes', perHa: '€/ha',
      cmpH: 'Irrigable et non irrigable (terres arables)', cmpIr: 'Irrigable', cmpDry: 'Non irrigable', prem: 'Le terrain irrigable vaut {p} % de plus', less: 'Le terrain irrigable est {p} % sous le non irrigable',
      byReg: 'Par région · {m} · {y}', none: 'Pas de chiffre publié pour cette région.', ha: 'ha irrigués',
      nIrr: 'Surface irriguée sur les 12 derniers mois rapportée à la surface agricole utile, d’après l’enquête sur la structure des exploitations d’Eurostat. Année {y} : la dernière publiée par Eurostat pour ce pays.',
      nPrice: 'Prix moyens de vente des terres agricoles libres de bail (Eurostat), en euros par hectare. Chaque vue compare des régions de la même année.',
      nDE: 'L’Allemagne ne publie pas de prix des terres dans Eurostat : seule l’irrigation est affichée ici.',
      nIT: 'Italie : Eurostat ne publie les terres arables irrigables et non irrigables que jusqu’en 2020, et en 2019-2020 les deux séries se croisent (le non irrigable passe au-dessus). Affiché tel que publié, sans correction.',
      nEL: 'Grèce : Eurostat distingue les terres arables irrigables et non irrigables. C’est une classification officielle, pas une estimation.',
      nSplit: 'La France, le Portugal, la Belgique, la Croatie et l’Allemagne ne séparent pas le prix irrigué et sec dans les statistiques officielles : on ne peut montrer que la part de surface irriguée.', src: 'Source :' },
    it: { h: 'Terreni agricoli e irrigazione', m: { irr: 'Quota di superficie irrigata', ara: 'Prezzo dei seminativi', gra: 'Prezzo dei prati permanenti', aib: 'Seminativi irrigabili', axb: 'Seminativi non irrigabili' },
      metric: 'Mostra', reg: 'Regione', nat: 'Totale nazionale', irrC: 'Superficie irrigata', of: 'della superficie agricola utilizzata ({y})', araC: 'Seminativi', graC: 'Prati permanenti', perHa: '€/ha',
      cmpH: 'Irrigabile e non irrigabile (seminativi)', cmpIr: 'Irrigabile', cmpDry: 'Non irrigabile', prem: 'Il terreno irrigabile vale il {p} % in più', less: 'Il terreno irrigabile risulta il {p} % sotto il non irrigabile',
      byReg: 'Per regione · {m} · {y}', none: 'Nessun dato pubblicato per questa regione.', ha: 'ha irrigati',
      nIrr: 'Superficie irrigata negli ultimi 12 mesi sulla superficie agricola utilizzata, dall’indagine Eurostat sulla struttura delle aziende. Anno {y}: l’ultimo che Eurostat pubblica per questo paese.',
      nPrice: 'Prezzi medi di vendita dei terreni agricoli liberi da affitto (Eurostat), euro per ettaro. Ogni vista confronta regioni dello stesso anno.',
      nDE: 'La Germania non pubblica prezzi dei terreni su Eurostat: qui si mostra solo l’irrigazione.',
      nIT: 'Italia: Eurostat pubblica seminativi irrigabili e non irrigabili solo fino al 2020, e nel 2019-2020 le due serie si incrociano (il non irrigabile risulta più alto). Mostrato come pubblicato, senza correzioni.',
      nEL: 'Grecia: Eurostat distingue i seminativi irrigabili e non irrigabili. È una classificazione ufficiale, non una stima.',
      nSplit: 'Francia, Portogallo, Belgio, Croazia e Germania non separano il prezzo di irriguo e asciutto nelle statistiche ufficiali: si può mostrare solo la quota di superficie irrigata.', src: 'Fonte:' }
  };
  var PM = { ara: 'ARA', gra: 'J0000', aib: 'ARAIB', axb: 'ARAXIB' };
  function last(pts) { return pts && pts.length ? pts[pts.length - 1] : null; }
  function yearOf(E, p) { var G = E.price[p] || {}, y = 0; Object.keys(G).forEach(function (g) { var l = last(G[g]); if (l && l[0] > y) y = l[0]; }); return y; }
  function val(E, p, g, y) { var s = (E.price[p] || {})[g]; if (!s) return null; for (var i = s.length - 1; i >= 0; i--) if (s[i][0] === y) return s[i][1]; return null; }
  function metrics(cc, E) {
    var l = ['irr'], k; ['ara', 'gra'].forEach(function (m) { if (E.price[PM[m]]) l.push(m); });
    if (cc === 'IT' || cc === 'EL') { l.push('aib'); l.push('axb'); }
    return l.filter(function (m, i) { return l.indexOf(m) === i; });
  }
  function card(t, v, s) { return '<div class="cof-card"><div class="cof-ct">' + t + '</div><div class="cof-cv">' + v + '</div>' + (s ? '<div class="cof-cs">' + s + '</div>' : '') + '</div>'; }
  function view(cc, E, lg, t) {
    var ms = metrics(cc, E), out = '', nat = E.irrigation.regions[cc], mL = t.m;
    if (ms.indexOf(ST.m) < 0) ST.m = ms[0];
    out += '<div class="cof-cards">';
    if (nat) out += card(U.esc(t.irrC), U.nf(nat.share, 1) + ' %', U.esc(t.of.replace('{y}', nat.year)));
    ['ara', 'gra'].forEach(function (m) { var y = yearOf(E, PM[m]), v = y ? val(E, PM[m], cc, y) : null; if (v != null) out += card(U.esc(t[m + 'C'] || t.araC) + ' · ' + y, U.nf(v, 0) + ' ' + t.perHa); });
    out += '</div>';
    if (cc === 'IT' || cc === 'EL') {
      var y = Math.min(yearOf(E, 'ARAIB'), yearOf(E, 'ARAXIB')), a = val(E, 'ARAIB', cc, y), b = val(E, 'ARAXIB', cc, y);
      if (a != null && b != null) { var p = (a / b - 1) * 100;
        out += '<h3 class="cof-h3">' + U.esc(t.cmpH + ' · ' + y) + '</h3><div class="cof-cards">' + card(U.esc(t.cmpIr), U.nf(a, 0) + ' ' + t.perHa) + card(U.esc(t.cmpDry), U.nf(b, 0) + ' ' + t.perHa, U.esc((p >= 0 ? t.prem : t.less).replace('{p}', U.nf(Math.abs(p), 0)))) + '</div>'; }
    }
    out += U.sel('eul-m', t.metric, ms.map(function (m) { return U.opt(m, mL[m], ST.m); }).join(''), ST.m);
    var lv = cc === 'DE' ? 1 : 2, rows = [], yy;
    if (ST.m === 'irr') {
      yy = nat ? nat.year : 0;
      Object.keys(E.irrigation.regions).forEach(function (g) { var r = E.regions[g], x = E.irrigation.regions[g]; if (r && r.level === lv && x.year === yy) rows.push([r.name, x.share, U.nf(x.irrigated, 0) + ' ' + t.ha]); });
    } else {
      yy = yearOf(E, PM[ST.m]);
      Object.keys(E.regions).forEach(function (g) { var r = E.regions[g]; if (r.level !== lv) return; var v = val(E, PM[ST.m], g, yy); if (v != null) rows.push([r.name, v, '']); });
    }
    rows.sort(function (p, q) { return q[1] - p[1]; });
    if (rows.length) out += '<h3 class="cof-h3">' + U.esc(t.byReg.replace('{m}', mL[ST.m]).replace('{y}', yy)) + '</h3>' + U.bars(rows, rows[0][1] || 1, ST.m === 'irr' ? 1 : 0, ST.m === 'irr' ? '%' : t.perHa);
    else out += '<p class="cof-note">' + U.esc(t.none) + '</p>';
    var n = (nat ? '<p class="cof-note">' + U.esc(t.nIrr.replace('{y}', nat.year)) + '</p>' : '');
    if (cc !== 'DE') n += '<p class="cof-note">' + U.esc(t.nPrice) + '</p>'; else n += '<p class="cof-note">' + U.esc(t.nDE) + '</p>';
    n += '<p class="cof-note">' + U.esc(cc === 'IT' ? t.nIT : cc === 'EL' ? t.nEL : t.nSplit) + '</p>';
    return out + n;
  }
  function load() { if (D) return Promise.resolve(D); return U.json('data/eu-land/land.json').then(function (d) { D = d; return d; }); }
  function mount(el, lg, cc) {
    if (!el || !U) return Promise.resolve(false);
    lg = T[lg] ? lg : 'es';
    function draw(focus) {
      var t = T[lg];
      return load().then(function (d) {
        var E = d && d.countries && d.countries[cc]; if (!E) { el.hidden = true; return false; }
        el.hidden = false; var body; try { body = view(cc, E, lg, t); } catch (e) { body = '<p class="cof-note">' + U.esc(t.none) + '</p>'; }
        el.innerHTML = '<section class="di-card cof" id="ps-eu-land" style="max-width:none"><h2 class="cof-h2">' + U.esc(t.h) + '</h2>' + body + U.cite('eurostat') + '</section>';
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
        return true;
      });
    }
    if (!el.getAttribute('data-eul')) {
      el.setAttribute('data-eul', '1');
      el.addEventListener('change', function (ev) { if (ev.target.id === 'eul-m') { ST.m = ev.target.value; draw('#eul-m'); } });
    }
    return Promise.all([global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null]).then(function () { return draw(); });
  }
  global.DIEuLand = { mount: mount };
})(window);
