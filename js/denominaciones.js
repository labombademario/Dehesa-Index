/* Dehesa Index — Denominaciones de origen de vinos y quesos de un país (registro eAmbrosia de la Comisión Europea; data/gi/<CC>.json). ES5.
   Solo lo que publica el registro: nombre protegido, DOP/IGP, año de protección en la UE y enlace al texto legal. Sin región (la fuente no la da). */
(function () {
  'use strict';
  var T = {
    es: { h: 'Denominaciones de origen', sub: 'Vinos y quesos con nombre protegido en la UE (registradas y vigentes).', wine: 'Vinos', cheese: 'Quesos', all: 'Todas', PDO: 'DOP', PGI: 'IGP', GI: 'IG', more: 'Ver las {n}', less: 'Ver menos', none: 'Sin denominaciones registradas.', since: 'protegida desde', src: 'Fuente: © Unión Europea, eAmbrosia (registro de indicaciones geográficas de la UE), CC BY 4.0.', legal: 'Texto legal', hint: 'DOP: vínculo más estrecho con la zona (queso: todo el proceso; vino: toda la uva). IGP: vínculo más flexible (queso: al menos una fase; vino: al menos el 85 % de la uva).', search: 'Buscar' },
    en: { h: 'Designations of origin', sub: 'Wines and cheeses with a name protected in the EU (registered and in force).', wine: 'Wines', cheese: 'Cheeses', all: 'All', PDO: 'PDO', PGI: 'PGI', GI: 'GI', more: 'Show all {n}', less: 'Show less', none: 'No registered designations.', since: 'protected since', src: 'Source: © European Union, eAmbrosia (EU geographical indications register), CC BY 4.0.', legal: 'Legal text', hint: 'PDO: closest link to the area (cheese: the whole process; wine: all the grapes). PGI: looser link (cheese: at least one stage; wine: at least 85% of the grapes).', search: 'Search' },
    fr: { h: 'Appellations d’origine', sub: 'Vins et fromages dont le nom est protégé dans l’UE (enregistrés et en vigueur).', wine: 'Vins', cheese: 'Fromages', all: 'Toutes', PDO: 'AOP', PGI: 'IGP', GI: 'IG', more: 'Voir les {n}', less: 'Voir moins', none: 'Aucune appellation enregistrée.', since: 'protégée depuis', src: 'Source : © Union européenne, eAmbrosia (registre des indications géographiques de l’UE), CC BY 4.0.', legal: 'Texte juridique', hint: 'AOP : lien le plus étroit avec la zone (fromage : tout le processus ; vin : tout le raisin). IGP : lien plus souple (fromage : au moins une étape ; vin : au moins 85 % du raisin).', search: 'Rechercher' },
    it: { h: 'Denominazioni di origine', sub: 'Vini e formaggi con nome protetto nell’UE (registrate e in vigore).', wine: 'Vini', cheese: 'Formaggi', all: 'Tutte', PDO: 'DOP', PGI: 'IGP', GI: 'IG', more: 'Vedi tutte le {n}', less: 'Vedi meno', none: 'Nessuna denominazione registrata.', since: 'protetta dal', src: 'Fonte: © Unione europea, eAmbrosia (registro delle indicazioni geografiche dell’UE), CC BY 4.0.', legal: 'Testo giuridico', hint: 'DOP: legame più stretto con la zona (formaggio: tutto il processo; vino: tutte le uve). IGP: legame più flessibile (formaggio: almeno una fase; vino: almeno l’85 % delle uve).', search: 'Cerca' }
  };
  var SHOW = 24;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function norm(s) { return String(s).toLowerCase().normalize ? String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') : String(s).toLowerCase(); }
  function mount(el, cc, lg) {
    if (!el) return;
    var t = T[lg] || T.es;
    fetch('data/gi/' + cc + '.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) {
      if (!d || (!d.wine.length && !d.cheese.length)) { el.innerHTML = ''; return; }
      var st = { k: d.wine.length ? 'wine' : 'cheese', ty: 'all', q: '', open: false };
      function list() {
        var L = d[st.k].filter(function (e) { return (st.ty === 'all' || e.t === st.ty) && (!st.q || norm(e.n.join(' ') + ' ' + (e.tr || []).join(' ')).indexOf(norm(st.q)) > -1); });
        var shown = st.open ? L : L.slice(0, SHOW);
        var items = shown.map(function (e) {
          return '<li class="di-gi-item"><span class="di-gi-name">' + esc(e.n.join(' / ')) + '</span> <span class="di-gi-tag di-gi-' + esc(e.t) + '">' + esc(t[e.t] || e.t) + '</span>' +
            (e.y ? ' <span class="di-gi-year">' + esc(t.since) + ' ' + e.y + '</span>' : '') +
            (e.u ? ' <a class="di-gi-link" href="' + esc(e.u) + '" target="_blank" rel="noopener noreferrer">' + esc(t.legal) + '</a>' : '') + '</li>';
        }).join('');
        return '<ul class="di-gi-list">' + (items || '<li class="di-movers-hint">' + esc(t.none) + '</li>') + '</ul>' +
          (L.length > SHOW ? '<button type="button" class="di-gi-more" data-gi="more">' + esc(st.open ? t.less : t.more.replace('{n}', L.length)) + '</button>' : '');
      }
      function draw() {
        var tab = function (k) { return d[k].length ? '<button type="button" class="di-tab-btn' + (st.k === k ? ' active' : '') + '" data-gi-k="' + k + '">' + esc(t[k]) + ' (' + d[k].length + ')</button>' : ''; };
        var types = ['all'].concat(['PDO', 'PGI', 'GI'].filter(function (x) { return d[st.k].some(function (e) { return e.t === x; }); }));
        el.innerHTML = '<section class="di-card di-gi" style="padding:14px 18px;margin-bottom:20px"><h2 class="ps-rm-h" style="margin:0 0 4px">' + esc(t.h) + '</h2>' +
          '<p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.sub) + ' ' + esc(t.hint) + '</p>' +
          '<div class="di-gi-tabs">' + tab('wine') + tab('cheese') + '</div>' +
          '<div class="di-gi-filters">' + types.map(function (x) { var n = x === 'all' ? d[st.k].length : d[st.k].filter(function (e) { return e.t === x; }).length; return '<button type="button" class="di-gi-chip' + (st.ty === x ? ' active' : '') + '" data-gi-t="' + x + '">' + esc(x === 'all' ? t.all : t[x]) + ' · ' + n + '</button>'; }).join('') +
          '<input type="search" class="di-gi-q" placeholder="' + esc(t.search) + '" value="' + esc(st.q) + '" aria-label="' + esc(t.search) + '"></div>' +
          '<div class="di-gi-body">' + list() + '</div><p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.src) + '</p></section>';
      }
      draw();
      el.addEventListener('click', function (ev) {
        var b = ev.target.closest ? ev.target.closest('button') : null; if (!b || !el.contains(b)) return;
        if (b.getAttribute('data-gi-k')) { st.k = b.getAttribute('data-gi-k'); st.ty = 'all'; st.open = false; draw(); }
        else if (b.getAttribute('data-gi-t')) { st.ty = b.getAttribute('data-gi-t'); st.open = false; draw(); }
        else if (b.getAttribute('data-gi') === 'more') { st.open = !st.open; el.querySelector('.di-gi-body').innerHTML = list(); }
      });
      el.addEventListener('input', function (ev) { if (ev.target.className === 'di-gi-q') { st.q = ev.target.value; el.querySelector('.di-gi-body').innerHTML = list(); } });
    });
  }
  window.DIGI = { mount: mount };
})();
