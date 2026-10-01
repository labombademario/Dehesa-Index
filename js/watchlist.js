/* Dehesa Index — Lista de seguimiento local (localStorage, sin cuenta ni servidor). ES5.
   DIWatch.list() -> [{c:'ES', s:'es-perc-aceite'}]; has/toggle/remove. Todo en try/catch: sin almacenamiento la página sigue funcionando. */
(function () {
  'use strict';
  var KEY = 'di-watchlist-v1', MEM = [];
  function read() { try { var v = JSON.parse(window.localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return MEM.slice(); } }
  function write(l) { MEM = l.slice(); try { window.localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} }
  function idx(l, c, s) { for (var i = 0; i < l.length; i++) if (l[i].c === c && l[i].s === s) return i; return -1; }
  window.DIWatch = {
    list: read,
    has: function (c, s) { return idx(read(), c, s) > -1; },
    toggle: function (c, s) { var l = read(), i = idx(l, c, s); if (i > -1) l.splice(i, 1); else l.unshift({ c: c, s: s }); write(l.slice(0, 60)); return i === -1; },
    remove: function (c, s) { var l = read(), i = idx(l, c, s); if (i > -1) { l.splice(i, 1); write(l); } },
    labels: { es: { follow: '☆ Seguir', following: '★ Siguiendo', title: 'Mi lista de seguimiento', hint: 'Series que sigues en este navegador. Se guardan solo aquí (sin cuenta); si borras los datos del navegador se pierden.', empty: 'Aún no sigues ninguna serie. Abre un perfil de país y pulsa “☆ Seguir” en el gráfico.', remove: 'Quitar', open: 'Abrir' },
      en: { follow: '☆ Follow', following: '★ Following', title: 'My watchlist', hint: 'Series you follow in this browser. Stored only here (no account); clearing browser data removes them.', empty: 'You are not following any series yet. Open a country profile and press “☆ Follow” on the chart.', remove: 'Remove', open: 'Open' },
      fr: { follow: '☆ Suivre', following: '★ Suivi', title: 'Ma liste de suivi', hint: 'Séries suivies dans ce navigateur. Stockées uniquement ici (sans compte) ; effacer les données du navigateur les supprime.', empty: 'Vous ne suivez encore aucune série. Ouvrez un profil de pays et cliquez sur « ☆ Suivre » sur le graphique.', remove: 'Retirer', open: 'Ouvrir' },
      it: { follow: '☆ Segui', following: '★ Segui già', title: 'La mia lista', hint: 'Serie seguite in questo browser. Salvate solo qui (senza account); cancellando i dati del browser si perdono.', empty: 'Non segui ancora nessuna serie. Apri un profilo paese e premi “☆ Segui” sul grafico.', remove: 'Rimuovi', open: 'Apri' } }
  };
})();
