/* Dehesa Index — Mi mercado en la portada. ES5, sin librerías.
   Si la persona ya eligió lugar y producto en «Mi mercado» (localStorage di-mi-mercado-v1), carga el módulo de Mi mercado en modo compacto
   (precio local, producción, seguro y sequía de su zona, con las mismas cifras y fuentes que la página completa); si no, ofrece empezar.
   El módulo solo se descarga cuando hay una elección guardada. No se inventa nada: sin elección no hay cifras. */
(function () {
  'use strict';
  var wrap = document.getElementById('home-mi-mercado'), box = document.getElementById('home-mm'), src = document.getElementById('home-mm-src');
  if (!wrap || !box) return;
  var TX = {
    es: { h: 'Mi mercado', p: 'Elige dónde estás y qué produces: precio local, rendimientos, seguro y sequía de tu zona en una sola vista.', start: 'Empezar', ex: 'Ejemplos' },
    en: { h: 'My market', p: 'Pick where you are and what you produce: local price, yields, insurance and drought for your area in one view.', start: 'Start', ex: 'Examples' },
    fr: { h: 'Mon marché', p: 'Choisissez où vous êtes et ce que vous produisez : prix local, rendements, assurance et sécheresse de votre zone en une vue.', start: 'Commencer', ex: 'Exemples' },
    it: { h: 'Il mio mercato', p: 'Scegli dove sei e cosa produci: prezzo locale, rese, assicurazione e siccità della tua zona in un’unica vista.', start: 'Inizia', ex: 'Esempi' }
  };
  var EX = [['US', 'KS', 'cattle', { es: 'Kansas · Vacuno', en: 'Kansas · Cattle', fr: 'Kansas · Bovins', it: 'Kansas · Bovini' }],
    ['US', 'IA', 'corn', { es: 'Iowa · Maíz', en: 'Iowa · Corn', fr: 'Iowa · Maïs', it: 'Iowa · Mais' }],
    ['CA', 'MB', 'hogs', { es: 'Manitoba · Porcino', en: 'Manitoba · Hogs', fr: 'Manitoba · Porcs', it: 'Manitoba · Suini' }],
    ['ES', '47', 'cereales', { es: 'Valladolid · Cereales', en: 'Valladolid · Cereals', fr: 'Valladolid · Céréales', it: 'Valladolid · Cereali' }],
    ['DE', 'BY', 'wheat', { es: 'Baviera · Trigo', en: 'Bavaria · Wheat', fr: 'Bavière · Blé', it: 'Baviera · Frumento' }],
    ['UK', 'eastern', 'wheat', { es: 'Eastern (Reino Unido) · Trigo', en: 'Eastern (UK) · Wheat', fr: 'Eastern (Royaume-Uni) · Blé', it: 'Eastern (Regno Unito) · Frumento' }]];
  function lang() { var l = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; return TX[l] ? l : 'es'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var saved = null;
  try { var o = JSON.parse(window.localStorage.getItem('di-mi-mercado-v1') || 'null'); if (o && /^(US|CA|ES|DE|UK)$/.test(o.c) && o.r && o.p) saved = o; } catch (e) { saved = null; }
  function prompt() {
    var l = lang(), t = TX[l];
    wrap.className = 'di-home-section'; box.innerHTML = '<div class="di-card" style="padding:14px 16px"><h2 style="font-size:20px;margin:0 0 4px">' + esc(t.h) + '</h2><p style="margin:0 0 12px">' + esc(t.p) + '</p><div class="di-hmm-row"><a class="di-btn-gold" href="mi-mercado.html">' + esc(t.start) + '</a>' +
      EX.map(function (e) { return '<a class="di-src-tab" href="mi-mercado.html?c=' + e[0] + '&amp;r=' + e[1] + '&amp;p=' + e[2] + '">' + esc(e[3][l]) + '</a>'; }).join('') + '</div></div>';
  }
  if (!saved) {
    prompt();
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); prompt(); };
    return;
  }
  if (!src) return;
  function add(u, cb) { var s = document.createElement('script'); s.src = u; if (cb) s.onload = cb; document.body.appendChild(s); }
  var dep = document.getElementById('home-mm-deps');
  if (window.DehesaRegionNames || !dep) add(src.getAttribute('src')); else add(dep.getAttribute('src'), function () { add(src.getAttribute('src')); });
})();
