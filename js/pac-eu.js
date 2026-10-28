/* Dehesa Index — PAC en la UE: barra de países y, fuera de España, la vista europea.
   Datos: data/cap/eu/allocations.json (Reglamento (UE) 2021/2115, anexos V y XI, versión consolidada de EUR-Lex; scripts/update-eu-cap.py) y, para Dinamarca,
   data/cap/dk/amounts.json (decretos daneses) y, para Alemania, data/cap/de/amounts.json (Bundesanzeiger y GAPDZV). España usa la herramienta completa de js/pac.js. Son asignaciones del reglamento: ni pagos ejecutados ni importes por hectárea.
   La cuota sobre la UE-27 y las variaciones son cálculos de Dehesa Index sobre esas cifras. ES5, sin librerías. */
(function () {
  'use strict';
  var WORK = ['ES', 'FR', 'IT', 'PL', 'DE', 'BE', 'AT', 'PT', 'DK', 'NL', 'HR', 'EL', 'IE', 'RO', 'HU', 'CZ', 'SE', 'FI', 'SK', 'SI', 'EE', 'BG', 'LV'];   // países europeos con los que trabaja la web
  var CSP = { ES: ['spain'], FR: ['france'], IT: ['italy'], PL: ['poland'], DE: ['germany'], BE: ['belgium-flanders', 'belgium-wallonia'], AT: ['austria'], PT: ['portugal'], HR: ['croatia'], EL: ['greece'], IE: ['ireland'], RO: ['romania'], HU: ['hungary'], CZ: ['czechia'], SE: ['sweden'], DK: ['denmark'], NL: ['netherlands'] , FI: ['finland'], SK: ['slovakia'], SI: ['slovenia'], EE: ['estonia'], BG: ['bulgaria'], LV: ['latvia']};
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var N = {
    EU: ['Unión Europea', 'European Union', 'Union européenne', 'Unione Europea'], ES: ['España', 'Spain', 'Espagne', 'Spagna'], FR: ['Francia', 'France', 'France', 'Francia'], DE: ['Alemania', 'Germany', 'Allemagne', 'Germania'], IT: ['Italia', 'Italy', 'Italie', 'Italia'], PL: ['Polonia', 'Poland', 'Pologne', 'Polonia'],
    BE: ['Bélgica', 'Belgium', 'Belgique', 'Belgio'], HR: ['Croacia', 'Croatia', 'Croatie', 'Croazia'], EL: ['Grecia', 'Greece', 'Grèce', 'Grecia'], IE: ['Irlanda', 'Ireland', 'Irlande', 'Irlanda'], RO: ['Rumanía', 'Romania', 'Roumanie', 'Romania'], HU: ['Hungría', 'Hungary', 'Hongrie', 'Ungheria'], CZ: ['Chequia', 'Czechia', 'Tchéquie', 'Cechia'], SE: ['Suecia', 'Sweden', 'Suède', 'Svezia'], AT: ['Austria', 'Austria', 'Autriche', 'Austria'], PT: ['Portugal', 'Portugal', 'Portugal', 'Portogallo'], DK: ['Dinamarca', 'Denmark', 'Danemark', 'Danimarca'], NL: ['Países Bajos', 'Netherlands', 'Pays-Bas', 'Paesi Bassi'], LV: ['Letonia', 'Latvia', 'Lettonie', 'Lettonia'], BG: ['Bulgaria', 'Bulgaria', 'Bulgarie', 'Bulgaria'], EE: ['Estonia', 'Estonia', 'Estonie', 'Estonia'], SI: ['Eslovenia', 'Slovenia', 'Slovénie', 'Slovenia'], SK: ['Eslovaquia', 'Slovakia', 'Slovaquie', 'Slovacchia'], FI: ['Finlandia', 'Finland', 'Finlande', 'Finlandia']
  };
  var T = {
    es: { bar: 'PAC por país', eu: 'UE', h1EU: 'PAC en la Unión Europea: asignaciones por país (2023-2027)', h1C: 'PAC en {c}: asignaciones de la UE (2023-2027)',
      sub: 'La PAC es común a toda la UE: cada país la aplica con su plan estratégico. Aquí, lo que el Reglamento (UE) 2021/2115 asigna a cada Estado miembro y, cuando lo tenemos verificado, el detalle nacional.',
      dp: 'Pagos directos', rd: 'Desarrollo rural (FEADER)', tot: 'Total', share: 'Cuota de la UE-27', ch: 'Variación 2023-2027', year: 'Año', country: 'País',
      dpH: 'Asignación para pagos directos', rdH: 'Ayuda de la Unión para desarrollo rural', y26: '{y}', calc: 'Cálculo de Dehesa Index sobre las cifras del reglamento',
      all27: 'Ver los 27 Estados miembros', tbl: 'Asignaciones por año (EUR, precios corrientes)', natH: 'Detalle nacional', esGo: 'Ver la herramienta de la PAC de España: importes por hectárea, calculadora, calendario y reglas',
      deCondH: 'Condiciones de las Öko-Regelungen', deCondNote: 'Resumen de Dehesa Index de la GAPDZV Anlage 5, leída el 8 de octubre de 2026. Cada Land fija además sus propias listas y métodos (por ejemplo, las especies indicadoras de la ÖR 5). Vale el texto oficial.',
      deH: 'Importes por unidad en Alemania (Bundesanzeiger)', deEcoH: 'Öko-Regelungen: importe por hectárea', deAct: 'real', dePlan: 'planificado', perHa: '€/ha', perHead: '€/animal', deNote: 'Importes reales: los fija el ministerio federal tras cada campaña (Bekanntmachung del Bundesanzeiger). 2026 solo tiene el importe planificado de la GAPDZV; el real se publica en noviembre-diciembre. Los importes planificados de la prima básica, la redistributiva y jóvenes no figuran en la ley y no se muestran. Transcritos de los textos oficiales, sin actualización automática.', deName: 'Nombre oficial en alemán; ÖR = Öko-Regelung (ecorrégimen)', deItem: 'Concepto', deUnit: 'Unidad',
      frCamp: 'Campaña',
      frH: 'Importes unitarios en Francia, campañas 2025 y 2026 (arrêtés del Ministerio de Agricultura)', frCur: 'Vigente', frHist: 'Versiones (arrêté inicial → modificaciones)', frDocs: 'Arrêtés del Journal officiel que sustentan estas cifras (títulos oficiales, en francés)', frG_direct: 'Pagos directos', frG_eco: 'Écorégime (ecorrégimen)', 'frG_coupled-animal': 'Ayudas acopladas animales (ovino, caprino y Corse)', 'frG_coupled-plant': 'Ayudas acopladas vegetales', frNote: 'Importes que fija el ministerio para las campañas 2025 y 2026; el vigente es el del último arrêté de cada campaña (2025: tras las modificaciones de noviembre de 2025 y de marzo y junio de 2026; 2026: arrêtés del 16 de septiembre de 2026). Las ayudas acopladas vegetales aparecen en el texto oficial en «euros», sin unidad: no se completa. Falta el importe unitario de la ayuda de base y, en 2026, todavía no hay arrêtés del ecorrégimen ni de las ayudas acopladas vegetales. Leído del volcado de datos abiertos de la DILA; vale el Journal officiel.',
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
      frCamp: 'Campaign',
      frH: 'Amounts per unit in France, 2025 and 2026 campaigns (Ministry of Agriculture orders)', frCur: 'Current', frHist: 'Versions (original order → amendments)', frDocs: 'Journal officiel orders behind these figures (official titles, in French)', frG_direct: 'Direct payments', frG_eco: 'Écorégime (eco-scheme)', 'frG_coupled-animal': 'Coupled support for animals (sheep, goats and Corsica)', 'frG_coupled-plant': 'Coupled support for crops', frNote: 'Amounts set by the ministry for the 2025 and 2026 campaigns; the current one is from the latest order of each campaign (2025: after the amendments of November 2025 and March and June 2026; 2026: orders of 16 September 2026). The official text gives the crop coupled payments in “euros” with no unit: we do not fill it in. The unit amount of the basic income support is missing and, for 2026, there are no eco-scheme or crop coupled-payment orders yet. Read from the DILA open-data dump; the Journal officiel prevails.',
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
      frCamp: 'Campagne',
      frH: 'Montants unitaires en France, campagnes 2025 et 2026 (arrêtés du ministère de l’Agriculture)', frCur: 'En vigueur', frHist: 'Versions (arrêté initial → modifications)', frDocs: 'Arrêtés du Journal officiel à l’origine de ces chiffres (titres officiels)', frG_direct: 'Paiements directs', frG_eco: 'Écorégime', 'frG_coupled-animal': 'Aides couplées animales (ovins, caprins et Corse)', 'frG_coupled-plant': 'Aides couplées végétales', frNote: 'Montants fixés par le ministère pour les campagnes 2025 et 2026 ; le montant en vigueur est celui du dernier arrêté de chaque campagne (2025 : après les modifications de novembre 2025 et de mars et juin 2026 ; 2026 : arrêtés du 16 septembre 2026). Le texte officiel indique les aides couplées végétales en « euros », sans unité : nous ne la complétons pas. Le montant unitaire de l’aide de base manque et, pour 2026, il n’y a pas encore d’arrêtés sur l’écorégime ni sur les aides couplées végétales. Lu dans le jeu de données ouvertes de la DILA ; le Journal officiel fait foi.',
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
      frCamp: 'Campagna',
      frH: 'Importi unitari in Francia, campagne 2025 e 2026 (decreti del ministero dell’Agricoltura)', frCur: 'In vigore', frHist: 'Versioni (decreto iniziale → modifiche)', frDocs: 'Decreti del Journal officiel alla base di queste cifre (titoli ufficiali, in francese)', frG_direct: 'Pagamenti diretti', frG_eco: 'Écorégime (ecoregime)', 'frG_coupled-animal': 'Aiuti accoppiati animali (ovini, caprini e Corsica)', 'frG_coupled-plant': 'Aiuti accoppiati vegetali', frNote: 'Importi fissati dal ministero per le campagne 2025 e 2026; quello in vigore è dell’ultimo decreto di ogni campagna (2025: dopo le modifiche di novembre 2025 e di marzo e giugno 2026; 2026: decreti del 16 settembre 2026). Il testo ufficiale indica gli aiuti accoppiati vegetali in «euro», senza unità: non la completiamo. Manca l’importo unitario del sostegno di base e, per il 2026, non ci sono ancora decreti sull’ecoregime né sugli aiuti accoppiati vegetali. Letto dal set di dati aperti della DILA; fa fede il Journal officiel.',
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
  var C = param(), A = null, DK = null, DE = null, FR = null, DEW = null;
  var bar = document.getElementById('pac-eu-bar'), host = document.getElementById('pac-eu'), body = document.getElementById('pac-body');
  function fl(c) { if (c === 'EU') return '\uD83C\uDDEA\uD83C\uDDFA '; var i = c === 'EL' ? 'GR' : c === 'UK' ? 'GB' : c; return /^[A-Z]{2}$/.test(i) ? String.fromCodePoint(127397 + i.charCodeAt(0), 127397 + i.charCodeAt(1)) + ' ' : ''; }
  function barHtml() {
    var x = t();
    return '<nav class="pac-eu-bar" aria-label="' + esc(x.bar) + '"><span class="pac-eu-bl">' + esc(x.bar) + '</span>' + ['EU'].concat(WORK).map(function (c) {
      var on = c === C; return '<a class="di-src-tab" href="pac.html?c=' + c + '"' + (on ? ' aria-current="page"' : '') + '>' + '<span aria-hidden="true">' + fl(c) + '</span>' + esc(c === 'EU' ? x.eu : nm(c)) + '</a>';
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
  // Vigilancia del BMLEH (data/cap/de/watch.json, lunes): huella de tres paginas del BMLEH sobre la GAP
  var WT = { es: { h: 'Vigilancia de cambios', ok: 'Comprobado el {d}: ninguna de las páginas vigiladas ha cambiado.', rev: 'Comprobado el {d}: hay {n} cambio(s) por revisar.', bad: 'La última lectura no llegó a la fuente oficial; se conserva la anterior.', none: 'La vigilancia está configurada y todavía no ha hecho su primera lectura.', last: 'Última modificación publicada: {a}' },
    en: { h: 'Change watch', ok: 'Checked on {d}: none of the watched pages has changed.', rev: 'Checked on {d}: {n} change(s) to review.', bad: 'The last read could not reach the official source; the previous one is kept.', none: 'The watch is set up and has not made its first read yet.', last: 'Latest amendment published: {a}' },
    fr: { h: 'Veille des changements', ok: 'Vérifié le {d} : aucune des pages surveillées n’a changé.', rev: 'Vérifié le {d} : {n} changement(s) à examiner.', bad: 'La dernière lecture n’a pas atteint la source officielle ; la précédente est conservée.', none: 'La veille est configurée et n’a pas encore fait sa première lecture.', last: 'Dernière modification publiée : {a}' },
    it: { h: 'Monitoraggio delle modifiche', ok: 'Verificato il {d}: nessuna delle pagine monitorate è cambiata.', rev: 'Verificato il {d}: {n} modifica/he da esaminare.', bad: 'L’ultima lettura non ha raggiunto la fonte ufficiale; si conserva la precedente.', none: 'Il monitoraggio è configurato e non ha ancora fatto la prima lettura.', last: 'Ultima modifica pubblicata: {a}' } };
  function dWatchHtml() {
    var w = DEW; if (!w) return ''; var x = WT[lang()] || WT.es, d = '';
    try { var p = String(w.checkedAt).slice(0, 10).split('-'); d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { d = w.checkedAt || ''; }
    var h = '<h3 class="pac-eu-h2">' + esc(x.h) + '</h3>';
    if (w.status === 'NOT_YET_RUN') return h + '<p class="di-movers-hint">' + esc(x.none) + '</p>';
    h += '<p class="di-movers-hint" role="status">' + esc(w.reviewNeeded.length ? fill(x.rev, { d: d, n: w.reviewNeeded.length }) : fill(x.ok, { d: d })) + (w.status === 'UNREACHABLE' ? ' ' + esc(x.bad) : '') + '</p>';
    if (w.reviewNeeded.length) h += '<ul>' + w.reviewNeeded.slice(0, 6).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>';
    var am = Object.keys(w.current.fingerprints || {}).map(function (k) { return w.current.fingerprints[k].amendedBy; }).filter(Boolean)[0];
    if (am) h += '<p class="di-movers-hint">' + esc(fill(x.last, { a: am })) + '</p>';
    return h;
  }
  // Ultimas novedades de la PAC: los 8 titulares mas recientes con la etiqueta PAC (data/views/news-product.json, se renueva con las noticias cada pocas horas)
  var NT = { es: { h: 'Últimas novedades de la PAC en Europa', n: 'Titulares de la Comisión Europea, ministerios y prensa agraria recogidos automáticamente. Cada uno enlaza a su fuente; no los hemos verificado ni resumido.', none: 'No hay titulares de la PAC en las últimas semanas.', all: 'Ver todas las noticias de la PAC' },
    en: { h: 'Latest CAP news in Europe', n: 'Headlines from the European Commission, ministries and the farm press, collected automatically. Each links to its source; we have not verified or summarised them.', none: 'No CAP headlines in the last few weeks.', all: 'See all CAP news' },
    fr: { h: 'Dernières nouvelles de la PAC en Europe', n: 'Titres de la Commission européenne, des ministères et de la presse agricole, collectés automatiquement. Chacun renvoie à sa source ; nous ne les avons ni vérifiés ni résumés.', none: 'Aucun titre sur la PAC ces dernières semaines.', all: 'Voir toutes les actualités de la PAC' },
    it: { h: 'Ultime novità della PAC in Europa', n: 'Titoli della Commissione europea, dei ministeri e della stampa agricola, raccolti automaticamente. Ognuno rimanda alla sua fonte; non li abbiamo verificati né riassunti.', none: 'Nessun titolo sulla PAC nelle ultime settimane.', all: 'Vedi tutte le notizie sulla PAC' } };
  var PN = null, PNT = {};
  function newsHtml() {
    var x = NT[lang()] || NT.es, h = '<section class="pac-news" aria-labelledby="pac-news-h"><h2 class="pac-eu-h2" id="pac-news-h">' + esc(x.h) + '</h2>';
    if (PN === null) return '';
    if (!PN.length) return h + '<p class="di-movers-hint">' + esc(x.none) + '</p></section>';
    h += '<ul class="pac-news-l">' + PN.map(function (n) {
      var tr = PNT[n.id], title = (tr && tr[0]) || n.headline.es, u = /^https?:\/\//i.test(n.url) ? n.url : '#', d = String(n.date || '').slice(0, 10);
      return '<li><a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(title) + '</a> <span class="di-movers-hint">' + esc(n.source) + (d ? ' · ' + esc(d) : '') + '</span></li>';
    }).join('') + '</ul><p class="di-movers-hint">' + esc(x.n) + '</p><p><a class="di-link-btn" href="noticias.html?product=pac">' + esc(x.all) + '</a></p></section>';
    return h;
  }
  function drawNews() { var host = document.getElementById('pac-news'); if (host) host.innerHTML = newsHtml(); }
  function loadNews() {
    if (!window.DINews) return;
    window.DINews.product().then(function (items) {
      PN = (items || []).filter(function (n) { return n.products.indexOf('pac') >= 0; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 8);
      return window.DINews.tr(lang()).then(function (t) { PNT = t || {}; });
    }).then(drawNews, function () { PN = []; drawNews(); });
  }
  function deHtml() {
    var x = t(), main = DE.items.filter(function (i) { return i.group !== 'eco'; }), eco = DE.items.filter(function (i) { return i.group === 'eco'; });
    return '<p class="di-movers-hint"><b>' + esc(x.deH) + '</b> · ' + esc(x.deAct) + ' 2023-2025</p>' + deTable(main, ['2023', '2024', '2025']) +
      '<p class="di-movers-hint"><b>' + esc(x.deEcoH) + '</b> · ' + esc(x.deAct) + ' 2023-2025, 2026 ' + esc(x.dePlan) + '</p>' + deTable(eco, ['2023', '2024', '2025', '2026']) +
      deCond() + '<p class="di-movers-hint">' + esc(x.deNote) + ' ' + esc(x.deName) + '.</p>' + cite('bundesanzeiger', '2025') + cite('gesetze_im_internet', '2026');
  }
  var FRL = {"Aide redistributive complémentaire au revenu pour un développement durable (CRISS)":{"es":"Ayuda redistributiva complementaria a la renta para la sostenibilidad (CRISS)","en":"Complementary redistributive income support for sustainability (CRISS)","it":"Sostegno redistributivo complementare al reddito per la sostenibilità (CRISS)"},"Aide complémentaire au revenu pour les jeunes agriculteurs (montant forfaitaire)":{"es":"Ayuda complementaria a la renta para jóvenes agricultores (importe a tanto alzado)","en":"Complementary income support for young farmers (flat amount)","it":"Sostegno complementare al reddito per i giovani agricoltori (importo forfettario)"},"Taux de réduction (art. D. 614-67 du code rural)":{"es":"Tasa de reducción (art. D. 614-67 del código rural)","en":"Reduction rate (art. D. 614-67 of the Rural Code)","it":"Tasso di riduzione (art. D. 614-67 del codice rurale)"},"Taux de réduction (art. D. 614-67), groupe Hexagone":{"es":"Tasa de reducción (art. D. 614-67), grupo Francia continental","en":"Reduction rate (art. D. 614-67), mainland France group","it":"Tasso di riduzione (art. D. 614-67), gruppo Francia continentale"},"Taux de réduction (art. D. 614-67), groupe Corse":{"es":"Tasa de reducción (art. D. 614-67), grupo Córcega","en":"Reduction rate (art. D. 614-67), Corsica group","it":"Tasso di riduzione (art. D. 614-67), gruppo Corsica"},"Écorégime, niveau de base":{"es":"Ecorrégimen, nivel básico","en":"Eco-scheme, basic level","it":"Ecoregime, livello di base"},"Écorégime, niveau supérieur":{"es":"Ecorrégimen, nivel superior","en":"Eco-scheme, higher level","it":"Ecoregime, livello superiore"},"Écorégime, niveau spécifique à l'agriculture biologique":{"es":"Ecorrégimen, nivel específico de agricultura ecológica","en":"Eco-scheme, organic-farming level","it":"Ecoregime, livello specifico per l’agricoltura biologica"},"Écorégime, bonus haies":{"es":"Ecorrégimen, bonificación por setos","en":"Eco-scheme, hedgerow bonus","it":"Ecoregime, bonus per le siepi"},"Aide ovine de base (hors Corse)":{"es":"Ayuda básica al ovino (excepto Córcega)","en":"Basic sheep aid (excluding Corsica)","it":"Aiuto di base agli ovini (esclusa la Corsica)"},"Majoration pour les 500 premières brebis primées (hors Corse)":{"es":"Incremento para las primeras 500 ovejas primadas (excepto Córcega)","en":"Supplement for the first 500 premium-eligible ewes (excluding Corsica)","it":"Maggiorazione per le prime 500 pecore premiate (esclusa la Corsica)"},"Aide ovine complémentaire, nouveaux producteurs (hors Corse)":{"es":"Ayuda complementaria al ovino, nuevos productores (excepto Córcega)","en":"Complementary sheep aid, new producers (excluding Corsica)","it":"Aiuto complementare agli ovini, nuovi produttori (esclusa la Corsica)"},"Aide caprine (hors Corse)":{"es":"Ayuda al caprino (excepto Córcega)","en":"Goat aid (excluding Corsica)","it":"Aiuto ai caprini (esclusa la Corsica)"},"Corse, montant de base, femelles ovines":{"es":"Córcega, importe básico, hembras ovinas","en":"Corsica, basic amount, ewes","it":"Corsica, importo di base, femmine ovine"},"Corse, montant de base, femelles caprines":{"es":"Córcega, importe básico, hembras caprinas","en":"Corsica, basic amount, female goats","it":"Corsica, importo di base, femmine caprine"},"Corse, montant supérieur, femelles ovines":{"es":"Córcega, importe superior, hembras ovinas","en":"Corsica, higher amount, ewes","it":"Corsica, importo superiore, femmine ovine"},"Corse, montant supérieur, femelles caprines":{"es":"Córcega, importe superior, hembras caprinas","en":"Corsica, higher amount, female goats","it":"Corsica, importo superiore, femmine caprine"},"Légumineuses à graines et légumineuses fourragères déshydratées ou destinées à la production de semences":{"es":"Leguminosas de grano y leguminosas forrajeras deshidratadas o destinadas a la producción de semillas","en":"Grain legumes and dehydrated forage legumes or those for seed production","it":"Leguminose da granella e foraggere disidratate o destinate alla produzione di sementi"},"Légumineuses fourragères en zones de montagne":{"es":"Leguminosas forrajeras en zonas de montaña","en":"Forage legumes in mountain areas","it":"Leguminose foraggere nelle zone montane"},"Légumineuses fourragères hors zones de montagne":{"es":"Leguminosas forrajeras fuera de zonas de montaña","en":"Forage legumes outside mountain areas","it":"Leguminose foraggere fuori dalle zone montane"},"Blé dur":{"es":"Trigo duro","en":"Durum wheat","it":"Grano duro"},"Pommes de terre féculières":{"es":"Patata para fécula","en":"Starch potatoes","it":"Patate da fecola"},"Riz":{"es":"Arroz","en":"Rice","it":"Riso"},"Houblon":{"es":"Lúpulo","en":"Hops","it":"Luppolo"},"Chanvre":{"es":"Cáñamo","en":"Hemp","it":"Canapa"},"Semences de graminées prairiales":{"es":"Semillas de gramíneas pratenses","en":"Grassland grass seeds","it":"Sementi di graminacee da prato"},"Prunes d'Ente destinées à la transformation":{"es":"Ciruelas de Ente para transformación","en":"Ente plums for processing","it":"Prugne d’Ente per la trasformazione"},"Tomates destinées à la transformation":{"es":"Tomates para transformación","en":"Tomatoes for processing","it":"Pomodori per la trasformazione"},"Cerises Bigarreau destinées à la transformation":{"es":"Cerezas Bigarreau para transformación","en":"Bigarreau cherries for processing","it":"Ciliegie Bigarreau per la trasformazione"},"Pêches Pavie destinées à la transformation":{"es":"Melocotones Pavía para transformación","en":"Pavie peaches for processing","it":"Pesche Pavie per la trasformazione"},"Maraîchage":{"es":"Horticultura (cultivos de huerta)","en":"Market gardening","it":"Orticoltura"},"Poires Williams destinées à la transformation":{"es":"Peras Williams para transformación","en":"Williams pears for processing","it":"Pere Williams per la trasformazione"},"Valeur unitaire des nouveaux droits au paiement, groupe Hexagone":{"es":"Valor unitario de los nuevos derechos de pago, grupo Francia continental","en":"Unit value of new payment entitlements, mainland France group","it":"Valore unitario dei nuovi diritti al pagamento, gruppo Francia continentale"},"Valeur unitaire des droits au paiement, groupe Corse":{"es":"Valor unitario de los derechos de pago, grupo Córcega","en":"Unit value of payment entitlements, Corsica group","it":"Valore unitario dei diritti al pagamento, gruppo Corsica"},"Valeur unitaire des nouveaux droits au paiement, groupe Corse":{"es":"Valor unitario de los nuevos derechos de pago, grupo Córcega","en":"Unit value of new payment entitlements, Corsica group","it":"Valore unitario dei nuovi diritti al pagamento, gruppo Corsica"},"Réduction linéaire de la valeur des droits à paiement, groupe Hexagone":{"es":"Reducción lineal del valor de los derechos de pago, grupo Francia continental","en":"Linear reduction of the value of payment entitlements, mainland France group","it":"Riduzione lineare del valore dei diritti al pagamento, gruppo Francia continentale"},"Réduction linéaire de la valeur des droits à paiement, groupe Corse":{"es":"Reducción lineal del valor de los derechos de pago, grupo Córcega","en":"Linear reduction of the value of payment entitlements, Corsica group","it":"Riduzione lineare del valore dei diritti al pagamento, gruppo Corsica"},"Aide aux bovins de plus de 16 mois, montant supérieur (hors Corse), par UGB":{"es":"Ayuda a bovinos de más de 16 meses, importe superior (excepto Córcega), por UGM","en":"Aid for cattle over 16 months, higher amount (excluding Corsica), per LU","it":"Aiuto ai bovini di oltre 16 mesi, importo superiore (esclusa la Corsica), per UBA"},"Aide aux bovins de plus de 16 mois, montant de base (hors Corse), par UGB":{"es":"Ayuda a bovinos de más de 16 meses, importe básico (excepto Córcega), por UGM","en":"Aid for cattle over 16 months, basic amount (excluding Corsica), per LU","it":"Aiuto ai bovini di oltre 16 mesi, importo di base (esclusa la Corsica), per UBA"},"Aide aux bovins de plus de 16 mois en Corse, montant supérieur, par UGB":{"es":"Ayuda a bovinos de más de 16 meses en Córcega, importe superior, por UGM","en":"Aid for cattle over 16 months in Corsica, higher amount, per LU","it":"Aiuto ai bovini di oltre 16 mesi in Corsica, importo superiore, per UBA"},"Aide aux bovins de plus de 16 mois en Corse, montant de base, par UGB":{"es":"Ayuda a bovinos de más de 16 meses en Córcega, importe básico, por UGM","en":"Aid for cattle over 16 months in Corsica, basic amount, per LU","it":"Aiuto ai bovini di oltre 16 mesi in Corsica, importo di base, per UBA"},"Aide aux veaux sous la mère et aux veaux issus de l'agriculture biologique, par veau éligible":{"es":"Ayuda a terneros criados bajo la madre y a terneros de agricultura ecológica, por ternero admisible","en":"Aid for suckler calves and organic-farming calves, per eligible calf","it":"Aiuto ai vitelli allattati dalla madre e ai vitelli da agricoltura biologica, per vitello ammissibile"}};
  function frLab(l) { var L = lang(), t = FRL[l] && FRL[l][L]; return t || l; }
  function frUnit(u) { var x = t(); return u === 'EUR/ha' ? x.perHa : u === 'EUR/head' ? x.perHead : u === 'PCT' ? '%' : '€'; }
  function frTable(items) {
    var x = t(), nd = function (v) { return nf(v, v === Math.floor(v) && Math.abs(v) >= 100 ? 0 : (Math.abs(v) < 10 && String(v).split('.')[1] && String(v).split('.')[1].length > 2 ? 4 : 2)); };
    return '<div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(x.deItem) + '</th><th scope="col" class="r">' + esc(x.frCur) + '</th><th scope="col" class="r">' + esc(x.deUnit) + '</th><th scope="col" class="r">' + esc(x.frHist) + '</th></tr></thead><tbody>' + items.map(function (it) {
      return '<tr><td' + (frLab(it.label) === it.label ? ' lang="fr"' : ' title="' + esc(it.label) + '"') + '>' + esc(frLab(it.label)) + '</td><td class="r"><b>' + nd(it.current) + '</b></td><td class="r">' + esc(frUnit(it.unit)) + '</td><td class="r di-movers-hint">' + it.versions.map(function (v) { return nd(v.value); }).join(' → ') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function frDocs() {
    var x = t(); return '<details class="pac-eu-all"><summary>' + esc(x.frDocs) + ' (' + FR.documents.length + ')</summary><ul>' + FR.documents.map(function (d) {
      return '<li><a href="' + esc(d.url) + '" rel="noopener" target="_blank" lang="fr">' + esc(d.title) + '</a> · <span class="di-movers-hint">JORF ' + esc(d.published) + ' · ' + esc(d.nor) + '</span></li>';
    }).join('') + '</ul></details>';
  }
  function frHtml() {
    var x = t(), camps = (FR.campaigns || []).slice().sort(function (p, q) { return q - p; });
    return '<p class="di-movers-hint"><b>' + esc(x.frH) + '</b></p>' + camps.map(function (cp) {
      var g = function (k) { return FR.items.filter(function (i) { return i.campaign === cp && i.group === k; }); };
      return '<h3 class="pac-eu-h2">' + esc(x.frCamp) + ' ' + cp + '</h3>' + ['direct', 'eco', 'coupled-animal', 'coupled-plant'].map(function (k) {
        var l = g(k); return l.length ? '<h4 class="pac-eu-h2">' + esc(x['frG_' + k]) + '</h4>' + frTable(l) : '';
      }).join('');
    }).join('') + frDocs() + '<p class="di-movers-hint">' + esc(x.frNote) + '</p>' + cite('dila_jorf', '2026');
  }
  function natHtml(c) {
    var x = t(), h = '<h2 class="pac-eu-h2">' + esc(x.natH) + '</h2>';
    if (c === 'DK' && DK && DK.schemes) {
      var items = []; DK.schemes.forEach(function (s) { (s.items || []).forEach(function (it) { if (items.length < 14) items.push([it.label || s.name, it.amount, it.unit]); }); });
      h += '<p class="di-movers-hint"><b>' + esc(x.dkH) + '</b></p><div class="de-sc"><table class="de-t" data-no-cards><tbody>' + items.map(function (i) { return '<tr><td lang="da">' + esc(i[0]) + '</td><td class="r">' + nf(i[1], 2) + ' ' + esc(i[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<p><a class="di-link-btn" href="paises.html?c=DK">' + esc(x.dkMore) + '</a></p>' + cite('retsinformation', String(DK.campaign || ''));
    } else if (c === 'DE' && DE && DE.items) h += deHtml() + dWatchHtml();
    else if (c === 'FR' && FR && FR.items) h += frHtml();
    else if (c === 'IT' || c === 'PL' || c === 'FR' || c === 'PT' || c === 'BE' || c === 'HR' || c === 'EL' || c === 'NL' || c === 'AT' || c === 'IE' || c === 'RO' || c === 'HU' || c === 'CZ' || c === 'SE' || c === 'FI' || c === 'SK' || c === 'SI' || c === 'EE' || c === 'BG' || c === 'LV') h += '';
    else h += '<p class="di-movers-hint">' + esc(x.natNone) + '</p>';
    if (c === 'FR' || c === 'IT' || c === 'PL' || c === 'PT' || c === 'BE' || c === 'HR' || c === 'EL' || c === 'NL' || c === 'AT' || c === 'IE' || c === 'RO' || c === 'HU' || c === 'CZ' || c === 'SE' || c === 'FI' || c === 'SK' || c === 'SI' || c === 'EE' || c === 'BG' || c === 'LV') h += '<div id="pac-nat" data-cc="' + c + '"></div>';
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
    if (window.DehesaPacNat) window.DehesaPacNat.render();
  }
  window.DehesaPacEU = { country: C };   // js/pac.js no arranca fuera de España
  function get(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  draw();
  Promise.all([get('data/cap/eu/allocations.json'), C === 'DK' ? get('data/cap/dk/amounts.json').catch(function () { return null; }) : null, C === 'DE' ? get('data/cap/de/amounts.json').catch(function () { return null; }) : null, C === 'FR' ? get('data/cap/fr/amounts.json').catch(function () { return null; }) : null, window.DICite ? window.DICite.load() : null, C === 'DE' ? get('data/cap/de/watch.json').catch(function () { return null; }) : null])
    .then(function (r) { A = r[0]; DK = r[1]; DE = r[2]; FR = r[3]; DEW = r[5]; draw(); }, function () { A = false; draw(); });
  loadNews();
  var prev = window.DehesaShared && window.DehesaShared.onLangChange;
  if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); draw(); loadNews(); };
})();
