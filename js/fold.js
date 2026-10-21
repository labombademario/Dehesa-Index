/* Dehesa Index — bloques plegados (regla de Mario: bloques de datos plegados por defecto, título + una línea). ES5.
   Uso en el HTML:
     <section data-fold>…</section>                      pliega ese bloque (su primer h2 o h3 es el título)
     <div data-fold-kids="#pac-eco, #pac-cal">…</div>     pliega esos descendientes cuando aparecen (contenido pintado por JS)
     data-fold-groups en el contenedor: agrupa un h2 suelto con lo que le sigue hasta el siguiente h2/bloque y lo pliega también.
   Cada bloque plegado muestra una barra (título + primera línea de su texto) que lo abre. Un enlace #ancla a un bloque plegado lo abre.
   Si la página vuelve a pintar el bloque, se recuerda si estaba abierto (por su título). Nada se borra: solo se oculta hasta que se abre. */
(function () {
  'use strict';
  var OPEN = {}, BUSY = false;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function head(el) { var h = el.querySelector('h2'); if (!h || !h.textContent.trim()) h = el.querySelector('h3'); return h && h.textContent.trim() ? h : null; }
  function firstLine(el, h) {
    var ps = el.querySelectorAll('p'); for (var i = 0; i < ps.length; i++) { var t = (ps[i].textContent || '').replace(/\s+/g, ' ').trim(); if (t.length > 20 && !(h.compareDocumentPosition(ps[i]) & 2)) return t.length > 140 ? t.slice(0, 137) + '…' : t; }
    return '';
  }
  function setOpen(el, o) {
    el.classList.toggle('df-closed', !o); var b = el.querySelector(':scope > .df-bar'); if (b) b.setAttribute('aria-expanded', String(o));
    if (el._dfk) OPEN[el._dfk] = o;
    if (o) { try { window.dispatchEvent(new Event('resize')); } catch (e) { } }
  }
  function fold(el) {
    var h = head(el); if (!h) return;
    var bar = el.querySelector(':scope > .df-bar'), key = h.textContent.replace(/\s+/g, ' ').trim();
    if (bar && el._dfk === key) return;
    if (bar) bar.parentNode.removeChild(bar);
    el._dfk = key; el.classList.add('df'); h.classList.add('df-h');
    bar = document.createElement('button'); bar.type = 'button'; bar.className = 'df-bar';
    var sub = firstLine(el, h);
    bar.innerHTML = '<span class="df-t">' + esc(key) + '</span>' + (sub ? '<span class="df-s">' + esc(sub) + '</span>' : '') + '<span class="df-i" aria-hidden="true"></span>';
    bar.onclick = function () { setOpen(el, el.classList.contains('df-closed')); };
    el.insertBefore(bar, el.firstChild);
    setOpen(el, !!OPEN[key]);
  }
  function groups(c) {   // un h2 suelto + lo que le sigue, hasta el siguiente bloque con titulo o con id
    var cur = null;
    Array.prototype.slice.call(c.children).forEach(function (k) {
      if (k.classList.contains('df-grp')) { cur = null; return; }
      if (k.tagName === 'H2') { cur = document.createElement('div'); cur.className = 'df-grp'; c.insertBefore(cur, k); cur.appendChild(k); return; }
      if (k.tagName === 'SECTION' || k.id || k.querySelector('h2')) { cur = null; return; }
      if (cur) cur.appendChild(k);
    });
  }
  function scan() {
    if (BUSY) return; BUSY = true;
    try {
      Array.prototype.forEach.call(document.querySelectorAll('[data-fold]'), fold);
      Array.prototype.forEach.call(document.querySelectorAll('[data-fold-kids]'), function (c) {
        if (c.hasAttribute('data-fold-groups')) groups(c);
        var sel = c.getAttribute('data-fold-kids') + (c.hasAttribute('data-fold-groups') ? ', .df-grp' : '');
        Array.prototype.forEach.call(c.querySelectorAll(sel), fold);
      });
    } finally { BUSY = false; }
  }
  var T = null; function later() { clearTimeout(T); T = setTimeout(scan, 60); }
  function openFor(target) { var el = target && target.closest ? target.closest('.df') : null; while (el) { if (el.classList.contains('df-closed')) setOpen(el, true); el = el.parentElement && el.parentElement.closest ? el.parentElement.closest('.df') : null; } }
  document.addEventListener('click', function (e) { var a = e.target.closest ? e.target.closest('a[href^="#"]') : null; if (!a) return; var id = a.getAttribute('href').slice(1); if (id) openFor(document.getElementById(id)); }, true);
  window.addEventListener('hashchange', function () { openFor(document.getElementById(location.hash.slice(1))); });
  new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true });
  scan(); if (location.hash) setTimeout(function () { openFor(document.getElementById(location.hash.slice(1))); }, 800);
  window.DIFold = { scan: scan, open: openFor };
})();
