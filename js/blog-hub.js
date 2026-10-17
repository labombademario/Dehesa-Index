/* Dehesa Index — Resumen semanal + Blog en una sola página. ES5, sin librerías.
   Al entrar se elige entre «Resumen semanal» y «Blog» y se muestra solo lo elegido. Dentro del resumen: General (js/blog-weekly.js) o un país (js/semana.js).
   Direcciones: blog.html#resumen, #resumen-ES|FR|IT|DE|US, #blog; una semana (#2026-W41) abre el resumen general. Sin contenido propio: solo organiza lo que ya existe. */
(function () {
  'use strict';
  var S = window.DehesaShared; if (!S) return;
  var $ = function (id) { return document.getElementById(id); }, esc = S.esc;
  var T = {
    es: { h: 'Resumen semanal y blog', sub: 'Elige qué quieres leer.', rh: 'Resumen semanal', rsub: 'Lo más importante de la semana, con sus datos: el resumen general y el de cada país.', bh: 'Blog', bsub: 'Notas con contexto sobre qué mueve estos mercados, con cifras y fuentes reales.',
      rd: 'Lo más importante de la semana, con sus datos: el resumen general y el de España, Francia, Italia, Alemania, EE. UU. y Canadá.', bd: 'Notas con contexto sobre qué mueve estos mercados, con cifras y fuentes.', gen: 'General', sw: 'Ver otra opción', aria: 'Elegir vista' },
    en: { h: 'Weekly summary and blog', sub: 'Choose what you want to read.', rh: 'Weekly summary', rsub: 'The week’s most important points, with their data: the general summary and one for each country.', bh: 'Blog', bsub: 'Notes with context on what moves these markets, with real figures and sources.',
      rd: 'The week’s most important points, with their data: the general summary and the ones for Spain, France, Italy, Germany, the US and Canada.', bd: 'Notes with context on what moves these markets, with figures and sources.', gen: 'General', sw: 'Other view', aria: 'Choose a view' },
    fr: { h: 'Résumé hebdomadaire et blog', sub: 'Choisissez ce que vous voulez lire.', rh: 'Résumé hebdomadaire', rsub: 'L’essentiel de la semaine, avec ses données : le résumé général et celui de chaque pays.', bh: 'Blog', bsub: 'Notes de contexte sur ce qui fait bouger ces marchés, avec des chiffres et des sources réels.',
      rd: 'L’essentiel de la semaine, avec ses données : le résumé général et ceux de l’Espagne, la France, l’Italie, l’Allemagne, les États-Unis et le Canada.', bd: 'Notes de contexte sur ce qui fait bouger ces marchés, avec chiffres et sources.', gen: 'Général', sw: 'Autre vue', aria: 'Choisir une vue' },
    it: { h: 'Riepilogo settimanale e blog', sub: 'Scegli cosa vuoi leggere.', rh: 'Riepilogo settimanale', rsub: 'Il più importante della settimana, con i suoi dati: il riepilogo generale e quello di ogni paese.', bh: 'Blog', bsub: 'Note di contesto su cosa muove questi mercati, con cifre e fonti reali.',
      rd: 'Il più importante della settimana, con i suoi dati: il riepilogo generale e quelli di Spagna, Francia, Italia, Germania, Stati Uniti e Canada.', bd: 'Note di contesto su cosa muove questi mercati, con cifre e fonti.', gen: 'Generale', sw: 'Altra vista', aria: 'Scegli una vista' }
  };
  var CCS = ['ES', 'FR', 'IT', 'DE', 'US', 'CA'];
  function lg() { var l = S.getLang(); return T[l] ? l : 'es'; }
  function parse() {
    var h = (location.hash || '').replace('#', '');
    if (h === 'blog') return { v: 'blog' };
    var m = /^resumen(?:-([A-Z]{2}))?$/.exec(h); if (m) return { v: 'resumen', c: CCS.indexOf(m[1]) > -1 ? m[1] : '' };
    if (/^\d{4}-W\d\d$/.test(h)) return { v: 'resumen', c: '' };
    return { v: '' };
  }
  function go(h) { if (location.hash === '#' + h) apply(); else location.hash = h; }
  function btn(label, on, attrs) { return '<button type="button" class="di-chip" ' + attrs + ' aria-pressed="' + on + '" style="min-height:36px;padding:6px 14px;border-radius:18px;border:1px solid var(--border,#d8d2c0);background:' + (on ? 'var(--accent,#2f5d3a);color:#fff' : 'transparent;color:inherit') + ';font:inherit;font-size:14px;cursor:pointer">' + esc(label) + '</button>'; }
  function apply() {
    var t = T[lg()], st = parse(), h1 = $('bl-h1'), sub = $('bl-sub'), ch = $('bl-hub-choose'), bar = $('bl-hub-bar'), sw = window.DehesaSemana;
    $('bl-view-resumen').hidden = st.v !== 'resumen'; $('bl-view-blog').hidden = st.v !== 'blog';
    ch.hidden = !!st.v; bar.hidden = !st.v;
    if (!st.v) {
      h1.textContent = t.h; sub.textContent = t.sub;
      ch.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin:6px 0 20px" role="group" aria-label="' + esc(t.aria) + '">' +
        [['resumen', t.rh, t.rd], ['blog', t.bh, t.bd]].map(function (o) { return '<button type="button" class="di-card" data-go="' + o[0] + '" style="text-align:left;padding:20px 22px;cursor:pointer;font:inherit;color:inherit"><h2 style="margin:0 0 6px;font-size:22px">' + esc(o[1]) + '</h2><p class="di-movers-hint" style="margin:0;line-height:1.5">' + esc(o[2]) + '</p></button>'; }).join('') + '</div>';
      return;
    }
    h1.textContent = st.v === 'resumen' ? t.rh : t.bh; sub.textContent = st.v === 'resumen' ? t.rsub : t.bsub;
    bar.innerHTML = '<div role="group" aria-label="' + esc(t.aria) + '" style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px">' + btn(t.rh, st.v === 'resumen', 'data-go="resumen"') + btn(t.bh, st.v === 'blog', 'data-go="blog"') + '</div>';
    if (st.v !== 'resumen') return;
    var cc = $('bl-cc'), swr = $('sw-root');
    cc.innerHTML = '<div role="group" aria-label="' + esc(t.rh) + '" style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px">' + btn(t.gen, !st.c, 'data-go="resumen"') + CCS.map(function (c) { return btn(sw ? sw.label(c) : c, st.c === c, 'data-go="resumen-' + c + '"'); }).join('') + '</div>';
    $('bl-weekly').hidden = !!st.c; swr.hidden = !st.c; $('sw-note').hidden = !st.c;
    if (st.c && sw) sw.show(st.c);
  }
  document.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('[data-go]') : null; if (!b || !$('bl-hub-choose').contains(b) && !$('bl-hub-bar').contains(b) && !$('bl-cc').contains(b)) return; e.preventDefault(); go(b.getAttribute('data-go')); });
  window.addEventListener('hashchange', apply);
  var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); apply(); };
  apply();
})();
