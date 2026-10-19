/* Dehesa Index — cargador del widget. Se pega en la web de la cooperativa:
   <div data-dehesa="eu/trigo" data-lang="es" data-org="Mi cooperativa" data-color="2f6b3f" data-theme="light" data-years="3"></div>
   <script async src="https://dehesaindex.com/js/embed.js"></script>
   Crea un iframe por cada div y ajusta su alto. No guarda cookies ni lee nada de la pagina que lo aloja. ES5. */
(function () {
  'use strict';
  var me = document.currentScript || (function () { var s = document.getElementsByTagName('script'); for (var i = s.length - 1; i >= 0; i--) if (/\/js\/embed\.js/.test(s[i].src)) return s[i]; return null; })();
  var base = me && me.src ? me.src.replace(/\/js\/embed\.js.*$/, '/') : 'https://dehesaindex.com/';
  var origin = base.replace(/^(https?:\/\/[^\/]+).*$/, '$1');
  var frames = [];
  function q(k, v) { return v ? '&' + k + '=' + encodeURIComponent(v) : ''; }
  function build(el) {
    if (el.getAttribute('data-dehesa-ready')) return;
    var s = el.getAttribute('data-dehesa'); if (!/^[a-z]{2}\/[a-z0-9_-]+$/.test(s || '')) return;
    el.setAttribute('data-dehesa-ready', '1');
    var f = document.createElement('iframe');
    f.src = base + 'embed.html?s=' + encodeURIComponent(s) + q('lang', el.getAttribute('data-lang')) + q('org', el.getAttribute('data-org')) + q('c', el.getAttribute('data-color')) + q('t', el.getAttribute('data-theme')) + q('y', el.getAttribute('data-years'));
    f.title = 'Dehesa Index: ' + s; f.loading = 'lazy'; f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    f.style.cssText = 'width:100%;max-width:' + (parseInt(el.getAttribute('data-width'), 10) || 460) + 'px;height:' + (parseInt(el.getAttribute('data-height'), 10) || 400) + 'px;border:0;display:block;overflow:hidden';
    f.setAttribute('scrolling', 'no'); el.appendChild(f); frames.push({ f: f, s: s });
  }
  function scan() { var n = document.querySelectorAll('[data-dehesa]'), i; for (i = 0; i < n.length; i++) build(n[i]); }
  window.addEventListener('message', function (e) {
    if (e.origin !== origin || !e.data || e.data.type !== 'dehesa-embed-height') return;
    frames.forEach(function (x) { if (x.f.contentWindow === e.source && e.data.h > 0 && e.data.h < 2000) x.f.style.height = e.data.h + 'px'; });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  window.DehesaWidgets = { scan: scan };
})();
