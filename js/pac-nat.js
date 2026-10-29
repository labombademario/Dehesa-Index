/* Dehesa Index — PAC de Francia, Italia y Polonia: reglas, intervenciones, plazos, tasas (PL) y vigilancia de cambios.
   Datos: data/cap/<cc>/rules.json (escrito a mano de la norma oficial), data/cap/<cc>/watch.json (vigilancia semanal) y, para Polonia, data/cap/pl/amounts.json.
   js/pac-eu.js crea el contenedor #pac-nat y llama a DehesaPacNat.render(). Resumen propio de Dehesa Index, no el texto legal ni consejo jurídico. ES5, sin librerías. */
(function () {
  'use strict';
  var T = {
    es: { wOff: 'Todavía no hay vigilancia automática de cambios para este país: no se ha podido probar la lectura de la fuente oficial desde nuestros servidores. Las reglas se revisaron a mano en la fecha indicada.', scope: 'Solo pagos directos: el desarrollo rural y las ayudas sectoriales no se han leído. Resumen de Dehesa Index de la norma oficial; manda el texto publicado.', verified: 'Reglas revisadas el {d}',
      datesH: 'Plazos importantes', next: 'Próxima fecha general', ovrH: 'Excepciones por campaña', ovrC: 'Campaña {c}', rulesH: 'Reglas', intH: 'Intervenciones', legal: 'Base legal', official: 'Texto oficial',
      watchH: 'Vigilancia de cambios', wOK: 'Comprobado el {d}: sin textos nuevos pendientes de revisar.', wRev: 'Comprobado el {d}: hay {n} elemento(s) por revisar.', wNone: 'La vigilancia está configurada y todavía no ha hecho su primera lectura.', wBad: 'La última lectura no llegó a la fuente oficial; se conserva la anterior.',
      wNote: 'Son candidatos: títulos o huellas que cambian en la fuente oficial. Dehesa Index no sabe si afectan a las reglas hasta que alguien los lee.',
      ratesH: 'Tasas oficiales por campaña (reglamentos del Dziennik Ustaw)', estH: 'Anticipos 2026: tasas estimadas', estNote: 'Estas tasas sirven para pagar el {s} % del anticipo desde el {d}. No son las tasas definitivas de 2026, que se fijan por reglamento (todavía no publicado).',
      itH: 'Importes en Italia', itNote: 'El decreto ministerial no fija importes por hectárea: los calcula AGEA cada campaña. Las circulares de AGEA no se pueden leer desde nuestros servidores, así que no se muestran importes de Italia (no se estiman).',
      item: 'Ayuda', unit: 'Unidad', ha: 'PLN/ha', head: 'PLN/animal', point: 'PLN/punto', g_coupled_plant: 'Ayudas acopladas: cultivos', g_coupled_animal: 'Ayudas acopladas: ganadería', g_eco: 'Ecoesquemas', g_welfare: 'Bienestar animal', g_basic: 'Pagos básicos (estimación de anticipos)',
      pn: 'Las tasas básica, redistributiva y de jóvenes definitivas no figuran en el Dziennik Ustaw: no se completan.',
      tp_farmer: 'Agricultor activo', tp_young: 'Jóvenes agricultores', tp_calendar: 'Calendario', tp_penalties: 'Sanciones', tp_eco: 'Ecoesquemas', tp_payments: 'Pagos', tp_controls: 'Controles', tp_amounts: 'Importes', tp_abrs: 'Derechos de pago', tp_redistributive: 'Pago redistributivo', tp_associated: 'Ayudas asociadas', tp_basic: 'Ayuda básica' },
    en: { wOff: 'There is no automatic change watch for this country yet: we could not test reading the official source from our servers. The rules were reviewed by hand on the date shown.', scope: 'Direct payments only: rural development and sector aid have not been read. Dehesa Index summary of the official text; the published text prevails.', verified: 'Rules reviewed on {d}',
      datesH: 'Key dates', next: 'Next general date', ovrH: 'Exceptions by campaign', ovrC: 'Campaign {c}', rulesH: 'Rules', intH: 'Interventions', legal: 'Legal basis', official: 'Official text',
      watchH: 'Change watch', wOK: 'Checked on {d}: no new texts waiting for review.', wRev: 'Checked on {d}: {n} item(s) to review.', wNone: 'The watch is set up and has not made its first read yet.', wBad: 'The last read could not reach the official source; the previous one is kept.',
      wNote: 'These are candidates: titles or fingerprints that change at the official source. Dehesa Index cannot tell whether they affect the rules until someone reads them.',
      ratesH: 'Official rates by campaign (Dziennik Ustaw regulations)', estH: '2026 advances: estimated rates', estNote: 'These rates are used to pay {s} % of the advance from {d}. They are not the final 2026 rates, which are set by a regulation not yet published.',
      itH: 'Amounts in Italy', itNote: 'The ministerial decree does not set per-hectare amounts: AGEA calculates them each campaign. AGEA circulars cannot be read from our servers, so no Italian amounts are shown (none are estimated).',
      item: 'Aid', unit: 'Unit', ha: 'PLN/ha', head: 'PLN/head', point: 'PLN/point', g_coupled_plant: 'Coupled support: crops', g_coupled_animal: 'Coupled support: livestock', g_eco: 'Eco-schemes', g_welfare: 'Animal welfare', g_basic: 'Basic payments (advance estimates)',
      pn: 'The final basic, redistributive and young-farmer rates are not in the Dziennik Ustaw: they are not filled in.',
      tp_farmer: 'Active farmer', tp_young: 'Young farmers', tp_calendar: 'Calendar', tp_penalties: 'Penalties', tp_eco: 'Eco-schemes', tp_payments: 'Payments', tp_controls: 'Controls', tp_amounts: 'Amounts', tp_abrs: 'Payment entitlements', tp_redistributive: 'Redistributive payment', tp_associated: 'Coupled support', tp_basic: 'Basic support' },
    fr: { wOff: 'Il n’y a pas encore de veille automatique des changements pour ce pays : nous n’avons pas pu tester la lecture de la source officielle depuis nos serveurs. Les règles ont été revues à la main à la date indiquée.', scope: 'Paiements directs uniquement : le développement rural et les aides sectorielles n’ont pas été lus. Résumé de Dehesa Index du texte officiel ; le texte publié fait foi.', verified: 'Règles revues le {d}',
      datesH: 'Dates importantes', next: 'Prochaine date générale', ovrH: 'Exceptions par campagne', ovrC: 'Campagne {c}', rulesH: 'Règles', intH: 'Interventions', legal: 'Base légale', official: 'Texte officiel',
      watchH: 'Veille des changements', wOK: 'Vérifié le {d} : aucun nouveau texte à examiner.', wRev: 'Vérifié le {d} : {n} élément(s) à examiner.', wNone: 'La veille est configurée et n’a pas encore fait sa première lecture.', wBad: 'La dernière lecture n’a pas atteint la source officielle ; la précédente est conservée.',
      wNote: 'Ce sont des candidats : titres ou empreintes qui changent à la source officielle. Dehesa Index ne sait pas s’ils touchent les règles tant que personne ne les lit.',
      ratesH: 'Taux officiels par campagne (règlements du Dziennik Ustaw)', estH: 'Avances 2026 : taux estimés', estNote: 'Ces taux servent à payer {s} % de l’avance à partir du {d}. Ce ne sont pas les taux définitifs de 2026, fixés par un règlement pas encore publié.',
      itH: 'Montants en Italie', itNote: 'Le décret ministériel ne fixe pas de montants à l’hectare : l’AGEA les calcule chaque campagne. Les circulaires de l’AGEA ne sont pas lisibles depuis nos serveurs ; aucun montant italien n’est donc affiché (rien n’est estimé).',
      item: 'Aide', unit: 'Unité', ha: 'PLN/ha', head: 'PLN/animal', point: 'PLN/point', g_coupled_plant: 'Aides couplées : cultures', g_coupled_animal: 'Aides couplées : élevage', g_eco: 'Écorégimes', g_welfare: 'Bien-être animal', g_basic: 'Paiements de base (estimation des avances)',
      pn: 'Les taux définitifs de base, redistributif et jeunes ne figurent pas au Dziennik Ustaw : ils ne sont pas complétés.',
      tp_farmer: 'Agriculteur actif', tp_young: 'Jeunes agriculteurs', tp_calendar: 'Calendrier', tp_penalties: 'Sanctions', tp_eco: 'Écorégimes', tp_payments: 'Paiements', tp_controls: 'Contrôles', tp_amounts: 'Montants', tp_abrs: 'Droits au paiement', tp_redistributive: 'Paiement redistributif', tp_associated: 'Aides couplées', tp_basic: 'Aide de base' },
    it: { wOff: 'Per questo paese non c’è ancora un monitoraggio automatico delle modifiche: non siamo riusciti a provare la lettura della fonte ufficiale dai nostri server. Le regole sono state riviste a mano alla data indicata.', scope: 'Solo pagamenti diretti: lo sviluppo rurale e gli aiuti settoriali non sono stati letti. Sintesi di Dehesa Index del testo ufficiale; fa fede il testo pubblicato.', verified: 'Regole riviste il {d}',
      datesH: 'Scadenze importanti', next: 'Prossima data generale', ovrH: 'Eccezioni per campagna', ovrC: 'Campagna {c}', rulesH: 'Regole', intH: 'Interventi', legal: 'Base giuridica', official: 'Testo ufficiale',
      watchH: 'Monitoraggio delle modifiche', wOK: 'Verificato il {d}: nessun nuovo testo da esaminare.', wRev: 'Verificato il {d}: {n} elemento/i da esaminare.', wNone: 'Il monitoraggio è configurato e non ha ancora fatto la prima lettura.', wBad: 'L’ultima lettura non ha raggiunto la fonte ufficiale; si conserva la precedente.',
      wNote: 'Sono candidati: titoli o impronte che cambiano nella fonte ufficiale. Dehesa Index non sa se incidono sulle regole finché qualcuno non li legge.',
      ratesH: 'Tassi ufficiali per campagna (regolamenti del Dziennik Ustaw)', estH: 'Anticipi 2026: tassi stimati', estNote: 'Questi tassi servono a pagare il {s} % dell’anticipo dal {d}. Non sono i tassi definitivi del 2026, fissati da un regolamento non ancora pubblicato.',
      itH: 'Importi in Italia', itNote: 'Il decreto ministeriale non fissa importi per ettaro: li calcola AGEA ogni campagna. Le circolari AGEA non sono leggibili dai nostri server, quindi non mostriamo importi italiani (nessuna stima).',
      item: 'Aiuto', unit: 'Unità', ha: 'PLN/ha', head: 'PLN/capo', point: 'PLN/punto', g_coupled_plant: 'Sostegno accoppiato: colture', g_coupled_animal: 'Sostegno accoppiato: allevamento', g_eco: 'Ecoschemi', g_welfare: 'Benessere animale', g_basic: 'Pagamenti di base (stima degli anticipi)',
      pn: 'I tassi definitivi di base, redistributivo e giovani non figurano nel Dziennik Ustaw: non vengono completati.',
      tp_farmer: 'Agricoltore attivo', tp_young: 'Giovani agricoltori', tp_calendar: 'Calendario', tp_penalties: 'Sanzioni', tp_eco: 'Ecoschemi', tp_payments: 'Pagamenti', tp_controls: 'Controlli', tp_amounts: 'Importi', tp_abrs: 'Titoli di pagamento', tp_redistributive: 'Pagamento redistributivo', tp_associated: 'Sostegno accoppiato', tp_basic: 'Sostegno di base' }
  };
  var D = { FR: null, IT: null, PL: null }, loaded = {};
  /* Las citas legales (legalBasis) llevan el título de la norma en su idioma original y palabras de enlace en español: se traducen solo esas palabras (las normas no se tocan). */
  var MONTHS = { es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'], it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'] };
  var LBR = [  // [expresión española, en, fr, it]
    [/\bcopia consolidada de (\d)/g, 'consolidated copy of $1', 'copie consolidée du $1', 'copia consolidata del $1'],
    [/\bcon reformas hasta\b/g, 'with amendments up to', 'avec modifications jusqu’au', 'con modifiche fino a'],
    [/\(hasta /g, '(up to ', '(jusqu’au ', '(fino a '],
    [/\btexto unificado\b/g, 'consolidated text', 'texte consolidé', 'testo unificato'],
    [/\btexto consolidado\b/g, 'consolidated text', 'texte consolidé', 'testo consolidato'],
    [/\bleído en copia de\b/g, 'read in a copy from', 'lu dans une copie de', 'letto in una copia di'],
    [/\bdel ministro de Agricultura\b/g, 'of the Minister of Agriculture', 'du ministre de l’Agriculture', 'del ministro dell’Agricoltura'],
    [/\bnotas de prensa sobre campañas e importes\b/g, 'press releases on campaigns and amounts', 'communiqués de presse sur les campagnes et les montants', 'comunicati stampa su campagne e importi'],
    [/\bnotas? de prensa\b/g, 'press release', 'communiqué de presse', 'comunicato stampa'],
    [/\bque modifica el\b/g, 'amending', 'modifiant l’', 'che modifica l’'],
    [/\(versión de (\d)/g, '(version of $1', '(version du $1', '(versione del $1'],
    [/\bversión oficial\b/g, 'official version', 'version officielle', 'versione ufficiale'],
    [/\btraducción inglesa oficial desactualizada\b/g, 'official English translation, out of date', 'traduction anglaise officielle obsolète', 'traduzione inglese ufficiale non aggiornata'],
    [/\bsistemas de sanciones\b/g, 'penalty systems', 'régimes de sanctions', 'sistemi di sanzioni'],
    [/\bfichas y guías de\b/g, 'fact sheets and guides of', 'fiches et guides de', 'schede e guide del'],
    [/\bla norma que fija el plazo no se pudo leer\b/g, 'the rule setting the deadline could not be read', 'le texte fixant le délai n’a pas pu être lu', 'la norma che fissa il termine non è stata letta'],
    [/\bdisposición transitoria primera\b/g, 'first transitional provision', 'première disposition transitoire', 'prima disposizione transitoria'],
    [/\bdisposición transitoria\b/g, 'transitional provision', 'disposition transitoire', 'disposizione transitoria'],
    [/\bReglamento \(UE\)/g, 'Regulation (EU)', 'Règlement (UE)', 'Regolamento (UE)'],
    [/\bReglamento Delegado\b/g, 'Delegated Regulation', 'Règlement délégué', 'Regolamento delegato'],
    [/\bReglamento de Ejecución\b/g, 'Implementing Regulation', 'Règlement d’exécution', 'Regolamento di esecuzione'],
    [/\bReal Decreto\b/g, 'Royal Decree', 'Décret royal', 'Regio decreto'],
    [/\bapdo\. /g, 'para. ', 'al. ', 'par. '],
    [/\bpuntos (\d)/g, 'points $1', 'points $1', 'punti $1'], [/\bpunto (\d)/g, 'point $1', 'point $1', 'punto $1'],
    [/\banexas? (\d)/g, 'annexes $1', 'annexes $1', 'allegati $1'], [/\banexo (\d)/g, 'annex $1', 'annexe $1', 'allegato $1'],
    [/\b(arts?\.? [\d.]+(?:-\d+)?) a (\d)/g, '$1 to $2', '$1 à $2', '$1 a $2'],
    [/ y (?=[\dA-Za-zÀ-ÿΑ-Ωа-яА-Я§])/g, ' and ', ' et ', ' e ']
  ];
  function lb(s) {
    var lg = lang(); if (lg === 'es' || !s) return s; var i = { en: 1, fr: 2, it: 3 }[lg]; if (!i) return s;
    LBR.forEach(function (r) { s = s.replace(r[0], r[i]); });
    s = s.replace(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de (\d{4})/g, function (m, mo, y) { return MONTHS[lg][MONTHS.es.indexOf(mo)] + ' ' + y; });
    return s;
  }
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dt(iso) { try { var p = String(iso).slice(0, 10).split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function cite(id) { var Q = window.DICite; if (!Q) return ''; var c = Q.html(id, {}); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }
  function tr(r, grp, key, fallback) { var m = r.i18n && r.i18n[grp] && r.i18n[grp][key]; var L = lang(); return (L !== 'es' && m && m[L]) ? m[L] : fallback; }
  function next(cal, today) {
    var w = cal.when, best = null, y, d;
    for (y = today.getUTCFullYear() - 1; y <= today.getUTCFullYear() + 1; y++) { d = new Date(Date.UTC(y + (w.yearOffset || 0), w.month - 1, w.day)); if (d.getUTCMonth() === w.month - 1 && d >= today && (!best || d < best)) best = d; }
    return best;
  }
  function today() { var n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); }
  function datesHtml(r) {
    var x = t(), now = today(), rows = r.calendar.map(function (c) { return { c: c, d: next(c, now) }; }).filter(function (o) { return o.d; }).sort(function (a, b) { return a.d - b.d; });
    var h = !rows.length ? '' : '<h3 class="pac-eu-h2">' + esc(x.datesH) + '</h3><div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(x.next) + '</th><th scope="col">' + esc(x.legal) + '</th></tr></thead><tbody>' + rows.map(function (o) {
      return '<tr><td><b>' + esc(dt(o.d.toISOString())) + '</b><br>' + esc(tr(r, 'calendar', o.c.id, o.c.text)) + '</td><td class="di-movers-hint">' + esc(lb(o.c.legalBasis)) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    if (r.campaignOverrides.length) {
      h += '<details class="pac-eu-all"><summary>' + esc(x.ovrH) + ' (' + r.campaignOverrides.length + ')</summary><ul>' + r.campaignOverrides.slice().sort(function (a, b) { return b.campaign - a.campaign; }).map(function (o) {
        return '<li><b>' + esc(fill(x.ovrC, { c: o.campaign })) + '</b> · ' + esc(dt(o.date)) + ': ' + esc(tr(r, 'overrides', o.campaign + ':' + o.calendarId, o.text)) + ' <span class="di-movers-hint">(' + esc(lb(o.legalBasis)) + ')</span></li>';
      }).join('') + '</ul></details>';
    }
    return h;
  }
  function rulesHtml(r) {
    var x = t();
    return '<h3 class="pac-eu-h2">' + esc(x.rulesH) + '</h3>' + r.rules.map(function (u) {
      var tx = tr(r, 'rules', u.id, u.text), fs = (tx.match(/^.*?[.;](?=\s|$)/) || [tx])[0]; if (fs.length > 110) fs = fs.slice(0, 107).replace(/\s+\S*$/, '') + '…';
      var lab = x['tp_' + u.topic] || u.topic; if (fs.toLowerCase().indexOf(lab.toLowerCase()) === 0 && /^\s?:/.test(fs.slice(lab.length))) fs = fs.slice(lab.length).replace(/^\s?:\s*/, '');
      return '<details class="pac-eu-all"><summary>' + esc(lab) + ': ' + esc(fs) + '</summary><p>' + esc(tx) + ' <span class="di-movers-hint">(' + esc(lb(u.legalBasis)) + ')</span></p><p><a class="di-link-btn" href="' + esc(u.officialUrl) + '" rel="noopener" target="_blank">' + esc(x.official) + '</a></p></details>';
    }).join('');
  }
  function intHtml(r) {
    var x = t();
    return '<h3 class="pac-eu-h2">' + esc(x.intH) + '</h3><ul>' + r.interventions.map(function (i) { return '<li><span lang="' + esc(i.nameLang) + '">' + esc(i.name) + '</span> · <span class="di-movers-hint">' + esc(lb(i.legalBasis)) + '</span></li>'; }).join('') + '</ul>';
  }
  function watchHtml(w) {
    var x = t(), h = '<h3 class="pac-eu-h2">' + esc(x.watchH) + '</h3>';
    if (!w) return h + '<p class="di-movers-hint">' + esc(x.wOff) + '</p>';
    if (w.status === 'NOT_YET_RUN') h += '<p class="di-movers-hint">' + esc(x.wNone) + '</p>';
    else {
      h += '<p class="di-movers-hint" role="status">' + esc(w.reviewNeeded.length ? fill(x.wRev, { d: dt(w.checkedAt), n: w.reviewNeeded.length }) : fill(x.wOK, { d: dt(w.checkedAt) })) + (w.status === 'UNREACHABLE' ? ' ' + esc(x.wBad) : '') + '</p>';
      if (w.reviewNeeded.length) h += '<ul>' + w.reviewNeeded.slice(0, 8).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul><p class="di-movers-hint">' + esc(x.wNote) + '</p>';
    }
    return h;
  }
  function plTable(items, cols) {
    var x = t(), u = function (s) { return s === 'PLN/head' ? x.head : s === 'PLN/point' ? x.point : x.ha; };
    return '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(x.item) + '</th>' + cols.map(function (y) { return '<th scope="col" class="r">' + y + '</th>'; }).join('') + '<th scope="col" class="r">' + esc(x.unit) + '</th></tr></thead><tbody>' + items.map(function (i) {
      return '<tr><td lang="pl">' + esc(i.label) + '</td>' + cols.map(function (y) { var v = i.values && i.values[y]; return '<td class="r">' + (v ? nf(v.value, 2) : '–') + '</td>'; }).join('') + '<td class="r">' + esc(u(i.unit)) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function plHtml(a) {
    var x = t(), cols = ['2023', '2024', '2025'], e = a.estimates2026, h = '<p class="di-movers-hint"><b>' + esc(x.ratesH) + '</b></p>';
    ['coupled-plant', 'coupled-animal', 'eco', 'welfare'].forEach(function (g) { var l = a.items.filter(function (i) { return i.group === g; }); if (l.length) h += '<h3 class="pac-eu-h2">' + esc(x['g_' + g.replace('-', '_')]) + '</h3>' + plTable(l, cols); });
    var est = e.items.filter(function (i) { return i.group === 'basic'; });
    h += '<h3 class="pac-eu-h2">' + esc(x.estH) + '</h3><p class="di-movers-hint">' + esc(fill(x.estNote, { s: Math.round(e.advanceShare * 100), d: dt(e.advanceFrom) })) + '</p><div class="de-sc"><table class="de-t" data-no-cards><tbody>' + est.map(function (i) {
      return '<tr><td lang="pl">' + esc(i.label) + '</td><td class="r"><i>' + nf(i.value, 2) + '</i></td><td class="r">' + esc(i.unit === 'PLN/kg' ? 'PLN/kg' : x.ha) + '</td></tr>';
    }).join('') + '</tbody></table></div><p class="di-movers-hint">' + esc(x.pn) + '</p>' + cite('sejm_eli');
    return h;
  }
  function html(cc) {
    var x = t(), r = D[cc] && D[cc].rules, h = '';
    if (!r) return '';
    if (cc === 'PL' && D.PL.amounts) h += plHtml(D.PL.amounts);
    if (cc === 'IT') h += '<h3 class="pac-eu-h2">' + esc(x.itH) + '</h3><p class="di-movers-hint">' + esc(x.itNote) + '</p>';
    h += datesHtml(r) + rulesHtml(r) + intHtml(r) + watchHtml(D[cc].watch) + '<p class="di-movers-hint">' + esc(x.scope) + ' ' + esc(fill(x.verified, { d: dt(r.verifiedAt) })) + '.</p>' + cite(r.source.id);
    return h;
  }
  function get(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(function () { return null; }); }
  function render() {
    var host = document.getElementById('pac-nat'); if (!host) return;
    var cc = host.getAttribute('data-cc');
    if (D[cc]) { host.innerHTML = html(cc); return; }
    if (loaded[cc]) return; loaded[cc] = true;
    var lc = cc.toLowerCase();
    Promise.all([get('data/cap/' + lc + '/rules.json'), (/^(FR|IT|PL|NL|PT|EL|BG|LV|EE|FI|SK|SI)$/.test(cc) ? get('data/cap/' + lc + '/watch.json') : null), cc === 'PL' ? get('data/cap/pl/amounts.json') : null]).then(function (r) {
      D[cc] = { rules: r[0], watch: r[1], amounts: r[2] }; host.innerHTML = html(cc);
    });
  }
  window.DehesaPacNat = { render: render };
})();
