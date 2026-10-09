/* Dehesa Index — PAC en la UE: barra de países y, fuera de España, la vista europea.
   Datos: data/cap/eu/allocations.json (Reglamento (UE) 2021/2115, anexos V y XI, versión consolidada de EUR-Lex; scripts/update-eu-cap.py) y, para Dinamarca,
   data/cap/dk/amounts.json (decretos daneses) y, para Alemania, data/cap/de/amounts.json (Bundesanzeiger y GAPDZV). España usa la herramienta completa de js/pac.js. Son asignaciones del reglamento: ni pagos ejecutados ni importes por hectárea.
   La cuota sobre la UE-27 y las variaciones son cálculos de Dehesa Index sobre esas cifras. ES5, sin librerías. */
(function () {
  'use strict';
  var WORK = ['ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'DK', 'NL'];   // países europeos con los que trabaja la web
  var CSP = { ES: ['spain'], FR: ['france'], DE: ['germany'], BE: ['belgium-flanders', 'belgium-wallonia'], AT: ['austria'], PT: ['portugal'], DK: ['denmark'], NL: ['netherlands'] };
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var N = {
    EU: ['Unión Europea', 'European Union', 'Union européenne', 'Unione Europea'], ES: ['España', 'Spain', 'Espagne', 'Spagna'], FR: ['Francia', 'France', 'France', 'Francia'], DE: ['Alemania', 'Germany', 'Allemagne', 'Germania'],
    BE: ['Bélgica', 'Belgium', 'Belgique', 'Belgio'], AT: ['Austria', 'Austria', 'Autriche', 'Austria'], PT: ['Portugal', 'Portugal', 'Portugal', 'Portogallo'], DK: ['Dinamarca', 'Denmark', 'Danemark', 'Danimarca'], NL: ['Países Bajos', 'Netherlands', 'Pays-Bas', 'Paesi Bassi']
  };
  var T = {
    es: { bar: 'PAC por país', eu: 'UE', h1EU: 'PAC en la Unión Europea: asignaciones por país (2023-2027)', h1C: 'PAC en {c}: asignaciones de la UE (2023-2027)',
      sub: 'La PAC es común a toda la UE: cada país la aplica con su plan estratégico. Aquí, lo que el Reglamento (UE) 2021/2115 asigna a cada Estado miembro y, cuando lo tenemos verificado, el detalle nacional.',
      dp: 'Pagos directos', rd: 'Desarrollo rural (FEADER)', tot: 'Total', share: 'Cuota de la UE-27', ch: 'Variación 2023-2027', year: 'Año', country: 'País',
      dpH: 'Asignación para pagos directos', rdH: 'Ayuda de la Unión para desarrollo rural', y26: '{y}', calc: 'Cálculo de Dehesa Index sobre las cifras del reglamento',
      all27: 'Ver los 27 Estados miembros', tbl: 'Asignaciones por año (EUR, precios corrientes)', natH: 'Detalle nacional', esGo: 'Ver la herramienta de la PAC de España: importes por hectárea, calculadora, calendario y reglas',
      deCondH: 'Condiciones de las Öko-Regelungen', deCondNote: 'Resumen de Dehesa Index de la GAPDZV Anlage 5, leída el 8 de octubre de 2026. Cada Land fija además sus propias listas y métodos (por ejemplo, las especies indicadoras de la ÖR 5). Vale el texto oficial.',
      deH: 'Importes por unidad en Alemania (Bundesanzeiger)', deEcoH: 'Öko-Regelungen: importe por hectárea', deAct: 'real', dePlan: 'planificado', perHa: '€/ha', perHead: '€/animal', deNote: 'Importes reales: los fija el ministerio federal tras cada campaña (Bekanntmachung del Bundesanzeiger). 2026 solo tiene el importe planificado de la GAPDZV; el real se publica en noviembre-diciembre. Los importes planificados de la prima básica, la redistributiva y jóvenes no figuran en la ley y no se muestran. Transcritos de los textos oficiales, sin actualización automática.', deName: 'Nombre oficial en alemán; ÖR = Öko-Regelung (ecorrégimen)', deItem: 'Concepto', deUnit: 'Unidad',
      frH: 'Importes unitarios en Francia, campaña 2025 (arrêtés del Ministerio de Agricultura)', frCur: 'Vigente', frHist: 'Versiones (arrêté inicial → modificaciones)', frDocs: 'Arrêtés del Journal officiel que sustentan estas cifras', frG_direct: 'Pagos directos', frG_eco: 'Écorégime (ecorrégimen)', 'frG_coupled-animal': 'Ayudas acopladas animales (ovino, caprino y Corse)', 'frG_coupled-plant': 'Ayudas acopladas vegetales', frNote: 'Importes que fija el ministerio para la campaña 2025; el vigente es el del último arrêté (5 de junio de 2026 en casi todos), tras las modificaciones de noviembre de 2025 y de marzo y junio de 2026. Las ayudas acopladas vegetales aparecen en el texto oficial en «euros», sin unidad: no se completa. Falta el importe unitario de la ayuda de base (no se ha encontrado su arrêté) y todavía no hay arrêtés de la campaña 2026. Leído del volcado de datos abiertos de la DILA; vale el Journal officiel.',
      dkH: 'Importes por hectárea de 2026 en Dinamarca (decretos daneses)', dkMore: 'Ver todos los importes y umbrales en la ficha de Dinamarca', natNone: 'Todavía no tenemos verificados los importes nacionales por hectárea de este país: no se rellenan con los de otro país.',
      csp: 'Plan estratégico de la PAC de este país (Comisión Europea)', note: 'Asignaciones fijadas en el reglamento (anexos V y XI), en euros a precios corrientes: no son pagos realizados ni importes por hectárea. Pueden cambiar con transferencias entre pilares y modificaciones del reglamento: se usa la versión consolidada {v}.',
      beNote: 'Bélgica tiene dos planes estratégicos (Flandes y Valonia).', loading: 'Cargando…', err: 'No se pudieron cargar las asignaciones de la PAC.', esBox: 'Asignaciones de la UE a España' },
    en: { bar: 'CAP by country', eu: 'EU', h1EU: 'CAP in the European Union: allocations by country (2023-2027)', h1C: 'CAP in {c}: EU allocations (2023-2027)',
      sub: 'The CAP is common to the whole EU: each country applies it through its strategic plan. Here, what Regulation (EU) 2021/2115 allocates to each Member State and, where we have verified it, the national detail.',
      dp: 'Direct payments', rd: 'Rural development (EAFRD)', tot: 'Total', share: 'Share of EU-27', ch: 'Change 2023-2027', year: 'Year', country: 'Country',
      dpH: 'Allocation for direct payments', rdH: 'Union support for rural development', y26: '{y}', calc: 'Dehesa Index calculation on the Regulation’s figures',
      all27: 'See all 27 Member States', tbl: 'Allocations by year (EUR, current prices)', natH: 'National detail', esGo: 'Open Spain’s CAP tool: amounts per hectare, calculator, calendar and rules',
      deCondH: 'Conditions of the Öko-Regelungen', deCondNote: 'Dehesa Index summary of GAPDZV annex 5, read on 8 October 2026. Each Land also sets its own lists and methods (for example the indicator species for ÖR 5). The official text prevails.',
      deH: 'Amounts per unit in Germany (Bundesanzeiger)', deEcoH: 'Öko-Regelungen (eco-schemes): amount per hectare', deAct: 'actual', dePlan: 'planned', perHa: '€/ha', perHead: '€/head', deNote: 'Actual amounts: set by the federal ministry after each campaign (Bekanntmachung in the Bundesanzeiger). 2026 only has the planned amount from the GAPDZV; the actual one is published in November-December. Planned amounts for the basic, redistributive and young-farmer payments are not in the law and are not shown. Transcribed from the official texts, no automatic refresh.', deName: 'Official German name; ÖR = Öko-Regelung (eco-scheme)', deItem: 'Item', deUnit: 'Unit',
      frH: 'Amounts per unit in France, 2025 campaign (Ministry of Agriculture orders)', frCur: 'Current', frHist: 'Versions (original order → amendments)', frDocs: 'Journal officiel orders behind these figures', frG_direct: 'Direct payments', frG_eco: 'Écorégime (eco-scheme)', 'frG_coupled-animal': 'Coupled support for animals (sheep, goats and Corsica)', 'frG_coupled-plant': 'Coupled support for crops', frNote: 'Amounts set by the ministry for the 2025 campaign; the current one is from the latest order (5 June 2026 for almost all), after the amendments of November 2025 and March and June 2026. The official text gives the crop coupled payments in “euros” with no unit: we do not fill it in. The unit amount of the basic income support is missing (its order was not found) and there are no 2026-campaign orders yet. Read from the DILA open-data dump; the Journal officiel prevails.',
      dkH: '2026 amounts per hectare in Denmark (Danish orders)', dkMore: 'See all amounts and thresholds in the Denmark profile', natNone: 'We have not yet verified this country’s national amounts per hectare: they are not filled in with another country’s.',
      csp: 'This country’s CAP Strategic Plan (European Commission)', note: 'Allocations set in the Regulation (annexes V and XI), in euros at current prices: not payments made and not amounts per hectare. They can change with transfers between pillars and amendments: the consolidated version {v} is used.',
      beNote: 'Belgium has two strategic plans (Flanders and Wallonia).', loading: 'Loading…', err: 'The CAP allocations could not be loaded.', esBox: 'EU allocations to Spain' },
    fr: { bar: 'PAC par pays', eu: 'UE', h1EU: 'PAC dans l’Union européenne : dotations par pays (2023-2027)', h1C: 'PAC en {c} : dotations de l’UE (2023-2027)',
      sub: 'La PAC est commune à toute l’UE : chaque pays l’applique avec son plan stratégique. Ici, ce que le règlement (UE) 2021/2115 attribue à chaque État membre et, quand nous l’avons vérifié, le détail national.',
      dp: 'Paiements directs', rd: 'Développement rural (Feader)', tot: 'Total', share: 'Part de l’UE-27', ch: 'Variation 2023-2027', year: 'Année', country: 'Pays',
      dpH: 'Dotation pour les paiements directs', rdH: 'Soutien de l’Union au développement rural', y26: '{y}', calc: 'Calcul de Dehesa Index sur les chiffres du règlement',
      all27: 'Voir les 27 États membres', tbl: 'Dotations par année (EUR, prix courants)', natH: 'Détail national', esGo: 'Ouvrir l’outil PAC de l’Espagne : montants à l’hectare, calculateur, calendrier et règles',
      deCondH: 'Conditions des Öko-Regelungen', deCondNote: 'Résumé de Dehesa Index de l’annexe 5 de la GAPDZV, lue le 8 octobre 2026. Chaque Land fixe aussi ses propres listes et méthodes (par exemple les espèces indicatrices de l’ÖR 5). Le texte officiel fait foi.',
      deH: 'Montants unitaires en Allemagne (Bundesanzeiger)', deEcoH: 'Öko-Regelungen (écorégimes) : montant à l’hectare', deAct: 'réel', dePlan: 'prévu', perHa: '€/ha', perHead: '€/animal', deNote: 'Montants réels : fixés par le ministère fédéral après chaque campagne (Bekanntmachung au Bundesanzeiger). 2026 n’a que le montant prévu de la GAPDZV ; le réel est publié en novembre-décembre. Les montants prévus du paiement de base, redistributif et jeunes agriculteurs ne figurent pas dans la loi et ne sont pas affichés. Transcrits des textes officiels, sans mise à jour automatique.', deName: 'Nom officiel en allemand ; ÖR = Öko-Regelung (écorégime)', deItem: 'Poste', deUnit: 'Unité',
      frH: 'Montants unitaires en France, campagne 2025 (arrêtés du ministère de l’Agriculture)', frCur: 'En vigueur', frHist: 'Versions (arrêté initial → modifications)', frDocs: 'Arrêtés du Journal officiel à l’origine de ces chiffres', frG_direct: 'Paiements directs', frG_eco: 'Écorégime', 'frG_coupled-animal': 'Aides couplées animales (ovins, caprins et Corse)', 'frG_coupled-plant': 'Aides couplées végétales', frNote: 'Montants fixés par le ministère pour la campagne 2025 ; le montant en vigueur est celui du dernier arrêté (5 juin 2026 pour presque tous), après les modifications de novembre 2025 et de mars et juin 2026. Le texte officiel indique les aides couplées végétales en « euros », sans unité : nous ne la complétons pas. Le montant unitaire de l’aide de base manque (son arrêté n’a pas été trouvé) et il n’y a pas encore d’arrêtés pour la campagne 2026. Lu dans le jeu de données ouvertes de la DILA ; le Journal officiel fait foi.',
      dkH: 'Montants 2026 à l’hectare au Danemark (arrêtés danois)', dkMore: 'Voir tous les montants et seuils dans la fiche Danemark', natNone: 'Nous n’avons pas encore vérifié les montants nationaux à l’hectare de ce pays : ils ne sont pas complétés avec ceux d’un autre pays.',
      csp: 'Plan stratégique PAC de ce pays (Commission européenne)', note: 'Dotations fixées par le règlement (annexes V et XI), en euros courants : ni paiements effectués ni montants à l’hectare. Elles peuvent changer avec les transferts entre piliers et les modifications : version consolidée {v}.',
      beNote: 'La Belgique a deux plans stratégiques (Flandre et Wallonie).', loading: 'Chargement…', err: 'Impossible de charger les dotations PAC.', esBox: 'Dotations de l’UE à l’Espagne' },
    it: { bar: 'PAC per paese', eu: 'UE', h1EU: 'PAC nell’Unione europea: dotazioni per paese (2023-2027)', h1C: 'PAC in {c}: dotazioni dell’UE (2023-2027)',
      sub: 'La PAC è comune a tutta l’UE: ogni paese la applica con il suo piano strategico. Qui, ciò che il regolamento (UE) 2021/2115 assegna a ogni Stato membro e, quando lo abbiamo verificato, il dettaglio nazionale.',
      dp: 'Pagamenti diretti', rd: 'Sviluppo rurale (FEASR)', tot: 'Totale', share: 'Quota dell’UE-27', ch: 'Variazione 2023-2027', year: 'Anno', country: 'Paese',
      dpH: 'Dotazione per i pagamenti diretti', rdH: 'Sostegno dell’Unione allo sviluppo rurale', y26: '{y}', calc: 'Calcolo di Dehesa Index sulle cifre del regolamento',
      all27: 'Vedi tutti i 27 Stati membri', tbl: 'Dotazioni per anno (EUR, prezzi correnti)', natH: 'Dettaglio nazionale', esGo: 'Apri lo strumento PAC della Spagna: importi per ettaro, calcolatore, calendario e regole',
      deCondH: 'Condizioni delle Öko-Regelungen', deCondNote: 'Sintesi di Dehesa Index dell’allegato 5 della GAPDZV, letto l’8 ottobre 2026. Ogni Land fissa inoltre liste e metodi propri (per esempio le specie indicatrici dell’ÖR 5). Fa fede il testo ufficiale.',
      deH: 'Importi unitari in Germania (Bundesanzeiger)', deEcoH: 'Öko-Regelungen (ecoregimi): importo per ettaro', deAct: 'effettivo', dePlan: 'previsto', perHa: '€/ha', perHead: '€/capo', deNote: 'Importi effettivi: fissati dal ministero federale dopo ogni campagna (Bekanntmachung nel Bundesanzeiger). Il 2026 ha solo l’importo previsto della GAPDZV; quello effettivo esce a novembre-dicembre. Gli importi previsti del pagamento di base, redistributivo e giovani non sono nella legge e non vengono mostrati. Trascritti dai testi ufficiali, senza aggiornamento automatico.', deName: 'Nome ufficiale in tedesco; ÖR = Öko-Regelung (ecoregime)', deItem: 'Voce', deUnit: 'Unità',
      frH: 'Importi unitari in Francia, campagna 2025 (decreti del ministero dell’Agricoltura)', frCur: 'In vigore', frHist: 'Versioni (decreto iniziale → modifiche)', frDocs: 'Decreti del Journal officiel alla base di queste cifre', frG_direct: 'Pagamenti diretti', frG_eco: 'Écorégime (ecoregime)', 'frG_coupled-animal': 'Aiuti accoppiati animali (ovini, caprini e Corsica)', 'frG_coupled-plant': 'Aiuti accoppiati vegetali', frNote: 'Importi fissati dal ministero per la campagna 2025; quello in vigore è dell’ultimo decreto (5 giugno 2026 per quasi tutti), dopo le modifiche di novembre 2025 e di marzo e giugno 2026. Il testo ufficiale indica gli aiuti accoppiati vegetali in «euro», senza unità: non la completiamo. Manca l’importo unitario del sostegno di base (non è stato trovato il suo decreto) e non ci sono ancora decreti per la campagna 2026. Letto dal set di dati aperti della DILA; fa fede il Journal officiel.',
      dkH: 'Importi 2026 per ettaro in Danimarca (decreti danesi)', dkMore: 'Vedi tutti gli importi e le soglie nella scheda Danimarca', natNone: 'Non abbiamo ancora verificato gli importi nazionali per ettaro di questo paese: non vengono riempiti con quelli di un altro paese.',
      csp: 'Piano strategico PAC di questo paese (Commissione europea)', note: 'Dotazioni fissate dal regolamento (allegati V e XI), in euro a prezzi correnti: non sono pagamenti effettuati né importi per ettaro. Possono cambiare con trasferimenti tra pilastri e modifiche: versione consolidata {v}.',
      beNote: 'Il Belgio ha due piani strategici (Fiandre e Vallonia).', loading: 'Caricamento…', err: 'Impossibile caricare le dotazioni PAC.', esBox: 'Dotazioni dell’UE alla Spagna' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function nm(c) { return (N[c] || [c])[LI[lang()] || 0] || c; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function meur(v) { return nf(v / 1e6, v >= 1e9 ? 0 : 1) + ' M€'; }
  function pc(v) { return v == null || !isFinite(v) ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + ' %'; }
  function param() { try { var c = (new URLSearchParams(window.location.search).get('c') || '').toUpperCase(); return c === 'EU' || WORK.indexOf(c) >= 0 ? c : 'ES'; } catch (e) { return 'ES'; } }
  function cite(id, p) { var Q = window.DICite; if (!Q) return ''; var c = Q.html(id, { period: p || '' }); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }
  function citeCalc(ids, what) { var Q = window.DICite; if (!Q || !Q.derived) return ''; var c = Q.derived(ids, { what: what }); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }
  var C = param(), A = null, DK = null, DE = null, FR = null;
  var bar = document.getElementById('pac-eu-bar'), host = document.getElementById('pac-eu'), body = document.getElementById('pac-body');
  function barHtml() {
    var x = t();
    return '<nav class="pac-eu-bar" aria-label="' + esc(x.bar) + '"><span class="pac-eu-bl">' + esc(x.bar) + '</span>' + ['EU'].concat(WORK).map(function (c) {
      var on = c === C; return '<a class="di-src-tab" href="pac.html?c=' + c + '"' + (on ? ' aria-current="page"' : '') + '>' + esc(c === 'EU' ? x.eu : nm(c)) + '</a>';
    }).join('') + '</nav>';
  }
  function yr(i) { return A.directPayments.years[i]; }
  function euTot(blk, i) { var s = 0, k; for (k in blk.countries) s += blk.countries[k][i]; return s; }
  function tile(l, v, s) { return '<div class="de-tile"><div class="de-tl">' + esc(l) + '</div><div class="de-tv">' + v + '</div><div class="de-ts">' + (s || '&nbsp;') + '</div></div>'; }
  function noteHtml() { var x = t(); return '<p class="di-movers-hint">' + esc(fill(x.note, { v: A.source.consolidatedVersion })) + '</p>' + cite('eur_lex', A.source.consolidatedVersion) + citeCalc(['eur_lex'], 'share of EU-27; change 2023-2027'); }
  function rowsTable(list, iy) {
    var x = t(), dpT = euTot(A.directPayments, iy), max = 0;
    list.forEach(function (c) { max = Math.max(max, A.directPayments.countries[c][iy] + A.ruralDevelopment.countries[c][iy]); });
    return '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(x.country) + '</th><th scope="col" class="r">' + esc(x.dp) + ' ' + yr(iy) + '</th><th scope="col" class="r">' + esc(x.rd) + ' ' + yr(iy) + '</th><th scope="col" class="r">' + esc(x.share) + '</th><th scope="col" class="r">' + esc(x.ch) + '</th><th scope="col" aria-hidden="true"></th></tr></thead><tbody>' +
      list.map(function (c) {
        var d = A.directPayments.countries[c], r = A.ruralDevelopment.countries[c], w = Math.round((d[iy] + r[iy]) / max * 100);
        var link = WORK.indexOf(c) >= 0 ? '<a href="pac.html?c=' + c + '">' + esc(nm(c)) + '</a>' : esc(nm(c) || c);
        return '<tr><td>' + link + '</td><td class="r">' + meur(d[iy]) + '</td><td class="r">' + meur(r[iy]) + '</td><td class="r">' + nf(d[iy] / dpT * 100, 1) + ' %</td><td class="r">' + pc((d[4] / d[0] - 1) * 100) + '</td><td class="pac-bar-c"><span class="pac-bar" style="width:' + w + '%"></span></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function euView() {
    var x = t(), iy = A.directPayments.years.indexOf('2026'); if (iy < 0) iy = 3;
    var all = Object.keys(A.directPayments.countries).sort(function (a, b) { return A.directPayments.countries[b][iy] - A.directPayments.countries[a][iy]; });
    var mine = WORK.slice().sort(function (a, b) { return A.directPayments.countries[b][iy] - A.directPayments.countries[a][iy]; });
    var h = '<div class="de-tiles">' + tile(x.dpH + ' · UE-27 · ' + yr(iy), meur(euTot(A.directPayments, iy))) + tile(x.rdH + ' · UE-27 · ' + yr(iy), meur(euTot(A.ruralDevelopment, iy))) + '</div>';
    h += rowsTable(mine, iy) + '<details class="pac-eu-all"><summary>' + esc(x.all27) + '</summary>' + rowsTable(all, iy) + '</details>' + noteHtml();
    return h;
  }
  function yearTable(c) {
    var x = t(), d = A.directPayments.countries[c], r = A.ruralDevelopment.countries[c];
    return '<h2 class="pac-eu-h2">' + esc(x.tbl) + '</h2><div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(x.year) + '</th><th scope="col" class="r">' + esc(x.dp) + '</th><th scope="col" class="r">' + esc(x.rd) + '</th><th scope="col" class="r">' + esc(x.tot) + '</th></tr></thead><tbody>' +
      A.directPayments.years.map(function (y, i) { return '<tr><td>' + y + (i === 4 ? ' →' : '') + '</td><td class="r">' + nf(d[i], 0) + ' €</td><td class="r">' + nf(r[i], 0) + ' €</td><td class="r">' + nf(d[i] + r[i], 0) + ' €</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function countryBox(c, full) {
    var x = t(), iy = A.directPayments.years.indexOf('2026'); if (iy < 0) iy = 3;
    var d = A.directPayments.countries[c], r = A.ruralDevelopment.countries[c];
    var h = '<div class="de-tiles">' + tile(x.dpH + ' · ' + yr(iy), meur(d[iy]), esc(x.share) + ': ' + nf(d[iy] / euTot(A.directPayments, iy) * 100, 1) + ' %') + tile(x.rdH + ' · ' + yr(iy), meur(r[iy]), esc(x.share) + ': ' + nf(r[iy] / euTot(A.ruralDevelopment, iy) * 100, 1) + ' %') + tile(x.ch + ' · ' + x.dp, pc((d[4] / d[0] - 1) * 100), meur(d[0]) + ' → ' + meur(d[4])) + '</div>';
    if (full) h += yearTable(c);
    return h;
  }
  function deRow(it, cols) {
    var x = t(), u = it.unit === 'EUR/head' ? x.perHead : x.perHa;
    return '<tr><td><span class="de-code">' + esc(it.code) + '</span> <span lang="de">' + esc(it.label) + '</span></td>' + cols.map(function (y) {
      var a = it.actual && it.actual[y], p = it.planned && it.planned[y];
      if (a != null) return '<td class="r">' + nf(a, 2) + '</td>';
      if (p != null) return '<td class="r"><i>' + nf(p, 2) + '</i> <span class="di-movers-hint">(' + esc(x.dePlan) + ')</span></td>';
      return '<td class="r">–</td>';
    }).join('') + '<td class="r">' + esc(u) + '</td></tr>';
  }
  function deTable(items, cols) {
    return '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(t().deItem) + '</th>' + cols.map(function (y) { return '<th scope="col" class="r">' + y + '</th>'; }).join('') + '<th scope="col" class="r">' + esc(t().deUnit) + '</th></tr></thead><tbody>' + items.map(function (it) { return deRow(it, cols); }).join('') + '</tbody></table></div>';
  }
  function deCond() {
    var x = t(), L = lang(); if (!DE.conditions) return '';
    return '<h3 class="pac-eu-h2">' + esc(x.deCondH) + '</h3><p class="di-movers-hint">' + esc(x.deCondNote) + '</p>' + DE.conditions.map(function (c) {
      var pts = (c.text[L] || c.text.es || []);
      return '<details class="pac-eu-all"><summary>' + esc(c.code) + ' · <span class="di-movers-hint">' + esc(c.ref) + '</span></summary><ul>' + pts.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></details>';
    }).join('');
  }
  function deHtml() {
    var x = t(), main = DE.items.filter(function (i) { return i.group !== 'eco'; }), eco = DE.items.filter(function (i) { return i.group === 'eco'; });
    return '<p class="di-movers-hint"><b>' + esc(x.deH) + '</b> · ' + esc(x.deAct) + ' 2023-2025</p>' + deTable(main, ['2023', '2024', '2025']) +
      '<p class="di-movers-hint"><b>' + esc(x.deEcoH) + '</b> · ' + esc(x.deAct) + ' 2023-2025, 2026 ' + esc(x.dePlan) + '</p>' + deTable(eco, ['2023', '2024', '2025', '2026']) +
      deCond() + '<p class="di-movers-hint">' + esc(x.deNote) + ' ' + esc(x.deName) + '.</p>' + cite('bundesanzeiger', '2025') + cite('gesetze_im_internet', '2026');
  }
  function frUnit(u) { var x = t(); return u === 'EUR/ha' ? x.perHa : u === 'EUR/head' ? x.perHead : u === 'PCT' ? '%' : '€'; }
  function frTable(items) {
    var x = t(), nd = function (v) { return nf(v, v === Math.floor(v) && Math.abs(v) >= 100 ? 0 : (Math.abs(v) < 10 && String(v).split('.')[1] && String(v).split('.')[1].length > 2 ? 4 : 2)); };
    return '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(x.deItem) + '</th><th scope="col" class="r">' + esc(x.frCur) + '</th><th scope="col" class="r">' + esc(x.deUnit) + '</th><th scope="col" class="r">' + esc(x.frHist) + '</th></tr></thead><tbody>' + items.map(function (it) {
      return '<tr><td lang="fr">' + esc(it.label) + '</td><td class="r"><b>' + nd(it.current) + '</b></td><td class="r">' + esc(frUnit(it.unit)) + '</td><td class="r di-movers-hint">' + it.versions.map(function (v) { return nd(v.value); }).join(' → ') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function frDocs() {
    var x = t(); return '<details class="pac-eu-all"><summary>' + esc(x.frDocs) + ' (' + FR.documents.length + ')</summary><ul>' + FR.documents.map(function (d) {
      return '<li><a href="' + esc(d.url) + '" rel="noopener" target="_blank" lang="fr">' + esc(d.title) + '</a> · <span class="di-movers-hint">JORF ' + esc(d.published) + ' · ' + esc(d.nor) + '</span></li>';
    }).join('') + '</ul></details>';
  }
  function frHtml() {
    var x = t(), g = function (k) { return FR.items.filter(function (i) { return i.group === k; }); };
    return '<p class="di-movers-hint"><b>' + esc(x.frH) + '</b></p>' + ['direct', 'eco', 'coupled-animal', 'coupled-plant'].map(function (k) {
      return '<h3 class="pac-eu-h2">' + esc(x['frG_' + k]) + '</h3>' + frTable(g(k));
    }).join('') + frDocs() + '<p class="di-movers-hint">' + esc(x.frNote) + '</p>' + cite('dila_jorf', '2026');
  }
  function natHtml(c) {
    var x = t(), h = '<h2 class="pac-eu-h2">' + esc(x.natH) + '</h2>';
    if (c === 'DK' && DK && DK.schemes) {
      var items = []; DK.schemes.forEach(function (s) { (s.items || []).forEach(function (it) { if (items.length < 14) items.push([it.label || s.name, it.amount, it.unit]); }); });
      h += '<p class="di-movers-hint"><b>' + esc(x.dkH) + '</b></p><div class="de-sc"><table class="de-t" data-no-cards><tbody>' + items.map(function (i) { return '<tr><td lang="da">' + esc(i[0]) + '</td><td class="r">' + nf(i[1], 2) + ' ' + esc(i[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<p><a class="di-link-btn" href="paises.html?c=DK">' + esc(x.dkMore) + '</a></p>' + cite('retsinformation', String(DK.campaign || ''));
    } else if (c === 'DE' && DE && DE.items) h += deHtml();
    else if (c === 'FR' && FR && FR.items) h += frHtml();
    else h += '<p class="di-movers-hint">' + esc(x.natNone) + '</p>';
    h += '<p>' + (CSP[c] || []).map(function (s) { return '<a class="di-link-btn" href="https://agriculture.ec.europa.eu/cap-my-country/cap-strategic-plans/' + s + '_en" rel="noopener" target="_blank">' + esc(x.csp) + (CSP[c].length > 1 ? ' (' + (s.indexOf('flanders') > 0 ? 'Vlaanderen' : 'Wallonie') + ')' : '') + '</a> '; }).join('') + '</p>' + (c === 'BE' ? '<p class="di-movers-hint">' + esc(x.beNote) + '</p>' : '');
    return h;
  }
  function draw() {
    var x = t(); if (bar) bar.innerHTML = barHtml();
    if (C === 'ES') {   // España: herramienta completa (js/pac.js) y, encima, sus asignaciones de la UE
      if (host) host.innerHTML = A ? '<details class="di-card pac-eu-esbox"><summary>' + esc(x.esBox) + '</summary>' + countryBox('ES', true) + noteHtml() + '</details>' : '';
      return;
    }
    if (body) body.style.display = 'none';
    var h1 = document.getElementById('pac-h1'), sub = document.getElementById('pac-sub');
    var title = C === 'EU' ? x.h1EU : fill(x.h1C, { c: nm(C) });
    if (h1) h1.textContent = title; if (sub) sub.textContent = x.sub; document.title = title + ' | Dehesa Index';
    if (!host) return;
    if (!A) { host.innerHTML = '<p class="di-movers-hint" role="status">' + esc(A === false ? x.err : x.loading) + '</p>'; return; }
    host.innerHTML = C === 'EU' ? euView() : countryBox(C, true) + noteHtml() + natHtml(C);
  }
  window.DehesaPacEU = { country: C };   // js/pac.js no arranca fuera de España
  function get(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  draw();
  Promise.all([get('data/cap/eu/allocations.json'), C === 'DK' ? get('data/cap/dk/amounts.json').catch(function () { return null; }) : null, C === 'DE' ? get('data/cap/de/amounts.json').catch(function () { return null; }) : null, C === 'FR' ? get('data/cap/fr/amounts.json').catch(function () { return null; }) : null, window.DICite ? window.DICite.load() : null])
    .then(function (r) { A = r[0]; DK = r[1]; DE = r[2]; FR = r[3]; draw(); }, function () { A = false; draw(); });
  var prev = window.DehesaShared && window.DehesaShared.onLangChange;
  if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); draw(); };
})();
