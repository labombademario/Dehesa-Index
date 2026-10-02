/* Renderizador común para páginas de texto (metodología, legal): recibe STRINGS por idioma. */
(function () {
  'use strict';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  window.DehesaTextPage = function (STRINGS, docTitle) {
    function render() {
      var lang = window.DehesaShared.getLang();
      var t = STRINGS[lang] || STRINGS.es;
      document.title = t.title + ' | Dehesa Index';
      document.getElementById('pg-h1').textContent = t.title;
      document.getElementById('pg-sub').textContent = t.sub;
      document.documentElement.lang = STRINGS[lang] ? lang : 'es';
      document.getElementById('pg-body').innerHTML = t.sections.map(function (s) {
        var h = '<section class="di-info-section"' + (s.id ? ' id="' + s.id + '"' : '') + '><h2>' + esc(s.h) + '</h2>';
        (s.p || []).forEach(function (p) { h += '<p>' + esc(p) + '</p>'; });
        if (s.ul) h += '<ul class="di-info-list">' + s.ul.map(function (x) { return '<li>' + (x.b ? '<strong>' + esc(x.b) + '</strong> ' : '') + esc(x.t) + (x.u ? ' <a href="' + esc(x.u) + '" target="_blank" rel="noopener">' + esc(x.ul || x.u) + '</a>' : '') + '</li>'; }).join('') + '</ul>';
        if (s.after) h += '<p>' + esc(s.after) + '</p>';
        return h + '</section>';
      }).join('') + (t.links ? '<p class="di-info-api-notice">' + t.links.map(function (l) { return '<a href="' + l.href + '">' + esc(l.t) + '</a>'; }).join(' · ') + '</p>' : '');
      if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }
    }
    window.DehesaShared.init(docTitle);
    window.DehesaShared.onLangChange = render;
    render();
  };
})();
