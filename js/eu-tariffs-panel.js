/* Dehesa Index — Medidas arancelarias en vigor, para la ficha de la UE. ES5.
   Lee data/eu-tariff-measures.json (capa manual con fecha). La tabla completa sigue en aranceles.html. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Medidas arancelarias en vigor', sub: 'Lo que cambia por reglamento y no sale en la tabla base de aranceles. Capa manual con fecha.', act: 'En vigor', oth: 'No vigente', since: 'desde', asof: 'Actualizado', all: 'Ver la tabla completa de aranceles', none: 'Sin medidas cargadas ahora mismo.' },
    en: { h: 'Tariff measures in force', sub: 'What changes by regulation and does not show in the base tariff table. Dated manual layer.', act: 'In force', oth: 'Not in force', since: 'since', asof: 'Updated', all: 'See the full tariff table', none: 'No measures loaded right now.' },
    fr: { h: 'Mesures tarifaires en vigueur', sub: 'Ce qui change par règlement et n’apparaît pas dans le tableau de base des tarifs. Couche manuelle datée.', act: 'En vigueur', oth: 'Hors vigueur', since: 'depuis', asof: 'Mis à jour', all: 'Voir le tableau complet des tarifs', none: 'Aucune mesure chargée pour le moment.' },
    it: { h: 'Misure tariffarie in vigore', sub: 'Ciò che cambia per regolamento e non compare nella tabella base dei dazi. Livello manuale datato.', act: 'In vigore', oth: 'Non in vigore', since: 'dal', asof: 'Aggiornato', all: 'Vedi la tabella completa dei dazi', none: 'Nessuna misura caricata al momento.' }
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mount(el, lg) {
    var t = T[lg] || T.es;
    return fetch('data/eu-tariff-measures.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.items || !d.items.length) { el.hidden = true; return false; }
      var rows = d.items.map(function (m) {
        var on = m.status === 'active';
        return '<li class="eutm-i"><span class="eutm-b' + (on ? ' on' : '') + '">' + esc(on ? t.act : t.oth) + '</span><div><strong>' + esc((m.title && (m.title[lg] || m.title.es)) || m.id) + '</strong>' + (m.from ? ' <span class="cof-lbl">' + esc(t.since) + ' ' + esc(m.from) + '</span>' : '') + '<p class="di-movers-hint" style="margin:4px 0 0">' + esc((m.text && (m.text[lg] || m.text.es)) || '') + '</p></div></li>';
      }).join('');
      el.innerHTML = '<section class="cof" style="margin-top:28px"><h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + '</p><ul class="eutm">' + rows + '</ul><p class="cof-note">' + (d.asOf ? esc(t.asof) + ': ' + esc(d.asOf) + '. ' : '') + '<a href="aranceles.html">' + esc(t.all) + '</a></p></section>';
      return true;
    }).catch(function () { el.hidden = true; return false; });
  }
  global.DIEuTariffs = { mount: mount };
})(window);
