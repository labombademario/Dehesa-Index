/* Dehesa Index — arranque de las paginas generadas (landings de datos, regiones, productos, blog, portadas en/fr/it). ES5.
   Sustituye a los <script> en linea, que la CSP bloquea (script-src 'self' solo admite los dos hashes de index.html y offline.html).
   Se incluye dos veces con atributos distintos:
     antes de shared.js:  <script src="js/boot.js" data-lang="en" data-lang-mode="default|force"></script>  (idioma por defecto de la pagina)
     despues de shared.js: <script src="js/boot.js" data-init="informacion" data-open-lang="en"></script>   (menu, pie y enlaces a la herramienta) */
(function () {
  var s = document.currentScript;
  if (!s) return;
  var LANGS = ['es', 'en', 'fr', 'it'];
  function setLang(L, force) {
    if (LANGS.indexOf(L) < 0) return;
    try { if (force || !localStorage.getItem('dehesaIndexLang')) localStorage.setItem('dehesaIndexLang', L); } catch (e) {}
  }
  var L = s.getAttribute('data-lang');
  if (L) setLang(L, s.getAttribute('data-lang-mode') === 'force');
  var page = s.getAttribute('data-init');
  if (page && window.DehesaShared && window.DehesaShared.init) window.DehesaShared.init(page);
  var ol = s.getAttribute('data-open-lang');
  if (ol) document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[data-open]') : null;
    if (a) setLang(ol, true);
  });
})();
