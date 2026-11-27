/* Dehesa Index — «Todas las secciones»: indice de todas las paginas, generado desde los mismos grupos del menu (js/shared.js) para que no se desfase. ES5. */
(function () {
  'use strict';
  var T = {
    es: { title: 'Todas las secciones | Dehesa Index', h1: 'Todas las secciones', sub: 'Todas las páginas, agrupadas por lo que quieres hacer. Si buscas un dato concreto, pulsa / en cualquier página para abrir el buscador.', label: 'Filtrar esta lista', none: 'Ninguna sección coincide.', found: ' secciones' },
    en: { title: 'All sections | Dehesa Index', h1: 'All sections', sub: 'Every page, grouped by what you want to do. To look for a specific figure, press / on any page to open search.', label: 'Filter this list', none: 'No section matches.', found: ' sections' },
    fr: { title: 'Toutes les sections | Dehesa Index', h1: 'Toutes les sections', sub: 'Toutes les pages, regroupées selon ce que vous voulez faire. Pour une donnée précise, appuyez sur / sur n’importe quelle page pour ouvrir la recherche.', label: 'Filtrer cette liste', none: 'Aucune section ne correspond.', found: ' sections' },
    it: { title: 'Tutte le sezioni | Dehesa Index', h1: 'Tutte le sezioni', sub: 'Tutte le pagine, raggruppate per ciò che vuoi fare. Per un dato preciso, premi / in qualsiasi pagina per aprire la ricerca.', label: 'Filtra questo elenco', none: 'Nessuna sezione corrisponde.', found: ' sezioni' }
  };
  var ORDER = ['prices', 'compare', 'today', 'mine', 'tools', 'more', 'countries', 'production', 'trade', 'costs'];
  function $(id) { return document.getElementById(id); }
  function lang() { var l = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; return T[l] ? l : 'es'; }
  function esc(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function tx(o, l) { return o ? (o[l] || o.es || '') : ''; }
  function build(l) {
    var G = window.DehesaShared.navGroups(), seen = {}, out = [];
    function link(i) {
      var key = i.file + (i.query || '');
      if (i.chip || i.hash || !i.file || seen[key]) return null;
      seen[key] = 1;
      return '<li><a href="' + esc(window.DehesaShared.sitePath(i.file + (i.query || ''))) + '">' + esc(tx(i.label, l)) + '</a>' + (i.d ? '<span>' + esc(tx(i.d, l)) + '</span>' : '') + '</li>';
    }
    ORDER.forEach(function (k) {
      var g = G[k]; if (!g) return;
      var parts = [], loose = [];
      g.items.forEach(function (i) {
        if (i.items) { var sub = i.items.map(link).filter(Boolean); if (sub.length) parts.push({ h: tx(i.label, l), li: sub }); }
        else { var x = link(i); if (x) loose.push(x); }
      });
      if (loose.length) parts.unshift({ h: '', li: loose });
      if (!parts.length) return;
      out.push('<section class="di-sec"><h2>' + esc(tx(g.label, l)) + '</h2>' + parts.map(function (p) { return (p.h ? '<h3>' + esc(p.h) + '</h3>' : '') + '<ul>' + p.li.join('') + '</ul>'; }).join('') + '</section>');
    });
    return out.join('');
  }
  function filter() {
    var q = $('sc-q').value.trim().toLowerCase(), any = false;
    [].forEach.call(document.querySelectorAll('#sc-grid .di-sec'), function (sec) {
      var n = 0;
      [].forEach.call(sec.querySelectorAll('li'), function (li) { var on = !q || li.textContent.toLowerCase().indexOf(q) > -1 || sec.querySelector('h2').textContent.toLowerCase().indexOf(q) > -1; li.hidden = !on; if (on) n++; });
      [].forEach.call(sec.querySelectorAll('ul'), function (ul) { var vis = ul.querySelector('li:not([hidden])'); ul.hidden = !vis; if (ul.previousElementSibling && ul.previousElementSibling.tagName === 'H3') ul.previousElementSibling.hidden = !vis; });
      sec.hidden = !n; if (n) any = true;
    });
    $('sc-none').textContent = any ? '' : T[lang()].none;
  }
  function render() {
    var l = lang(), t = T[l];
    document.documentElement.lang = l; document.title = t.title;
    $('sc-h1').textContent = t.h1; $('sc-sub').textContent = t.sub; $('sc-label').textContent = t.label;
    $('sc-grid').innerHTML = build(l); filter();
  }
  if (window.DehesaShared && window.DehesaShared.init) window.DehesaShared.init('secciones');
  render();
  window.DehesaShared.onLangChange = render;
  $('sc-q').addEventListener('input', filter);
})();
