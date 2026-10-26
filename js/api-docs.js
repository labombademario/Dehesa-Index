/* Dehesa Index — API de datos: documentación de data/api/v1 (scripts/build-api.py). JSON estático, sin clave, con CORS abierto.
   Solo series del paquete descargable (licencia apta o apta con condiciones). ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var T = {
    es: {
      title: 'API de datos', h1: 'API de datos',
      sub: 'Los mismos precios del paquete descargable, como JSON estático para leerlos desde tu hoja de cálculo, tu web o tu programa. Gratis, sin clave y sin registro. Cada serie lleva su fuente, licencia y texto de atribución.',
      loading: 'Cargando…', kS: 'Series', kR: 'Puntos de datos', kD: 'Datos a fecha de',
      eT: 'Direcciones', eH: ['Qué devuelve', 'Dirección'],
      eR: [['Catálogo de series con fuente, licencia, atribución, rango y enlaces', '/data/api/v1/index.json'], ['Último valor, valor anterior y variación de todas las series', '/data/api/v1/latest.json'], ['Todo el histórico de una serie (región y producto del catálogo)', '/data/api/v1/series/{región}/{producto}.json'], ['Descripción OpenAPI 3.1', '/data/api/v1/openapi.json'], ['Agua: catálogo de ríos y sequía con fuente, licencia y atribución', '/data/api/v1/water/index.json'], ['Agua: estaciones de ríos de un país (de, nl, fr, be, ca, us) con nivel, caudal, estado, percentil frente al histórico y 30 días de puntos', '/data/api/v1/water/rivers/{país}.json'], ['Agua: Indicador Combinado de Sequía de la UE por país (últimos 13 periodos)', '/data/api/v1/water/drought/eu.json']],
      pqT: 'Excel y Power Query', pqP: ['En Excel: Datos > Obtener datos > De otros orígenes > En blanco (consulta en blanco) > Editor avanzado, y pega este código. Cambia la dirección por la serie que quieras (la lista está en index.json).', 'Carga la tabla en una hoja. Con «Actualizar todo» se vuelve a leer la API. Cada fila es una fecha y su precio; la fuente y la atribución van en la consulta de abajo, que debes mantener junto al dato.', 'Si prefieres no usar código, el paquete de datos descargables trae los mismos datos en CSV y Excel.'], pqN: 'La estructura del JSON está comprobada con los datos reales; el código de Power Query no lo he podido ejecutar en Excel desde aquí, así que si te da un error avísanos.', xT: 'Ejemplos', xN: 'El ejemplo usa el trigo de la UE; cambia la región (us, eu, uk, ca) y el producto por los del catálogo.',
      fT: 'Cómo es una serie',
      fP: ['«points» son pares [fecha, valor], del más antiguo al más reciente. Las fechas son AAAA-MM, AAAA-MM-DD o AAAA-Qn.', '«note» explica qué mide exactamente la serie (mercado, calidad, si es nacional); léela antes de comparar dos series.', 'Los valores son los de la fuente: sin estimaciones ni relleno de huecos. Si falta un mes, falta.'],
      rT: 'Reglas de uso',
      rP: ['Solo hay series cuya fuente permite el uso comercial (apto) o lo permite con condiciones. Si una fuente deja de permitirlo, su serie desaparece de la API en la siguiente actualización.', 'Cita la fuente con el campo «attribution» de cada serie. Esto no es asesoramiento jurídico: manda la licencia de cada fuente.', 'Son ficheros estáticos con caché de cinco minutos. Descarga lo que necesites una vez y guárdalo; no hace falta preguntar cada segundo. Los datos se actualizan como mucho una vez al día.', 'La API v1 no cambia de forma: si hace falta romper algo, saldrá una v2 y la v1 seguirá un tiempo.'],
      links: 'Ver también', ld: 'Descargas en CSV y Excel', lc: 'Condiciones de uso comercial',
      cta: '¿Necesitas otra serie, más frecuencia o un acuerdo de uso? Cuéntanos qué te hace falta.', ctaBtn: 'Escríbenos'
    },
    en: {
      title: 'Data API', h1: 'Data API',
      sub: 'The same prices as the downloadable pack, as static JSON you can read from a spreadsheet, a website or a program. Free, no key and no sign-up. Every series carries its source, licence and attribution text.',
      loading: 'Loading…', kS: 'Series', kR: 'Data points', kD: 'Data as of',
      eT: 'Endpoints', eH: ['What it returns', 'Address'],
      eR: [['Catalogue of series with source, licence, attribution, range and links', '/data/api/v1/index.json'], ['Latest value, previous value and change of every series', '/data/api/v1/latest.json'], ['Full history of one series (region and product from the catalogue)', '/data/api/v1/series/{region}/{product}.json'], ['OpenAPI 3.1 description', '/data/api/v1/openapi.json'], ['Water: catalogue of rivers and drought with source, licence and attribution', '/data/api/v1/water/index.json'], ['Water: river stations of one country (de, nl, fr, be, ca, us) with level, discharge, state, percentile against history and 30 days of points', '/data/api/v1/water/rivers/{country}.json'], ['Water: EU Combined Drought Indicator by country (last 13 periods)', '/data/api/v1/water/drought/eu.json']],
      pqT: 'Excel and Power Query', pqP: ['In Excel: Data > Get Data > From Other Sources > Blank Query > Advanced Editor, and paste this code. Change the address for the series you want (the list is in index.json).', 'Load the table into a sheet. “Refresh All” reads the API again. Each row is a date and its price; the source and attribution are in the query below, which you should keep next to the data.', 'If you prefer no code, the downloadable data package has the same data as CSV and Excel.'], pqN: 'The JSON structure is checked against the real data; I could not run the Power Query code in Excel from here, so if it gives you an error, let us know.', xT: 'Examples', xN: 'The example uses EU wheat; swap the region (us, eu, uk, ca) and product for those in the catalogue.',
      fT: 'What a series looks like',
      fP: ['“points” are [date, value] pairs, oldest first. Dates are YYYY-MM, YYYY-MM-DD or YYYY-Qn.', '“note” says exactly what the series measures (market, grade, national or not); read it before comparing two series.', 'Values are the source’s own: no estimates and no gap filling. If a month is missing, it is missing.'],
      rT: 'Terms of use',
      rP: ['Only series whose source allows commercial use (fit) or allows it with conditions are included. If a source stops allowing it, its series disappears from the API at the next update.', 'Credit the source with each series’ “attribution” field. This is not legal advice: each source’s licence prevails.', 'These are static files with a five-minute cache. Download what you need once and keep it; there is no need to poll every second. Data update at most once a day.', 'API v1 keeps its shape: if something has to break, a v2 will appear and v1 will stay for a while.'],
      links: 'See also', ld: 'CSV and Excel downloads', lc: 'Commercial-use terms',
      cta: 'Need another series, higher frequency or a usage agreement? Tell us what you need.', ctaBtn: 'Contact us'
    },
    fr: {
      title: 'API de données', h1: 'API de données',
      sub: 'Les mêmes prix que le pack téléchargeable, en JSON statique à lire depuis un tableur, un site ou un programme. Gratuit, sans clé ni inscription. Chaque série porte sa source, sa licence et son texte d’attribution.',
      loading: 'Chargement…', kS: 'Séries', kR: 'Points de données', kD: 'Données au',
      eT: 'Adresses', eH: ['Ce qu’elle renvoie', 'Adresse'],
      eR: [['Catalogue des séries avec source, licence, attribution, période et liens', '/data/api/v1/index.json'], ['Dernière valeur, valeur précédente et variation de toutes les séries', '/data/api/v1/latest.json'], ['Tout l’historique d’une série (région et produit du catalogue)', '/data/api/v1/series/{région}/{produit}.json'], ['Description OpenAPI 3.1', '/data/api/v1/openapi.json'], ['Eau : catalogue des cours d’eau et de la sécheresse avec source, licence et attribution', '/data/api/v1/water/index.json'], ['Eau : stations d’un pays (de, nl, fr, be, ca, us) avec niveau, débit, état, percentile par rapport à l’historique et 30 jours de points', '/data/api/v1/water/rivers/{pays}.json'], ['Eau : indicateur combiné de sécheresse de l’UE par pays (13 dernières périodes)', '/data/api/v1/water/drought/eu.json']],
      pqT: 'Excel et Power Query', pqP: ['Dans Excel : Données > Obtenir des données > À partir d’autres sources > Requête vide > Éditeur avancé, et collez ce code. Changez l’adresse pour la série voulue (la liste est dans index.json).', 'Chargez le tableau dans une feuille. « Actualiser tout » relit l’API. Chaque ligne est une date et son prix ; la source et l’attribution sont dans la requête ci-dessous, à garder avec la donnée.', 'Si vous préférez sans code, le paquet de données téléchargeables contient les mêmes données en CSV et Excel.'], pqN: 'La structure du JSON est vérifiée sur les données réelles ; je n’ai pas pu exécuter le code Power Query dans Excel d’ici, donc en cas d’erreur, signalez-le-nous.', xT: 'Exemples', xN: 'L’exemple utilise le blé de l’UE ; remplacez la région (us, eu, uk, ca) et le produit par ceux du catalogue.',
      fT: 'À quoi ressemble une série',
      fP: ['« points » sont des paires [date, valeur], de la plus ancienne à la plus récente. Dates : AAAA-MM, AAAA-MM-JJ ou AAAA-Qn.', '« note » dit précisément ce que mesure la série (marché, qualité, national ou non) ; lisez-la avant de comparer deux séries.', 'Les valeurs sont celles de la source : ni estimation ni comblement des trous. Si un mois manque, il manque.'],
      rT: 'Conditions d’utilisation',
      rP: ['Seules figurent les séries dont la source autorise l’usage commercial (apte) ou l’autorise sous conditions. Si une source ne l’autorise plus, sa série disparaît de l’API à la mise à jour suivante.', 'Citez la source avec le champ « attribution » de chaque série. Ceci n’est pas un conseil juridique : la licence de chaque source prévaut.', 'Ce sont des fichiers statiques avec cache de cinq minutes. Téléchargez ce qu’il vous faut une fois et gardez-le ; inutile d’interroger chaque seconde. Les données sont mises à jour au plus une fois par jour.', 'L’API v1 garde sa forme : s’il faut casser quelque chose, une v2 sortira et la v1 restera un temps.'],
      links: 'Voir aussi', ld: 'Téléchargements CSV et Excel', lc: 'Conditions d’usage commercial',
      cta: 'Besoin d’une autre série, d’une fréquence plus élevée ou d’un accord d’usage ? Dites-nous ce qu’il vous faut.', ctaBtn: 'Nous écrire'
    },
    it: {
      title: 'API dei dati', h1: 'API dei dati',
      sub: 'Gli stessi prezzi del pacchetto scaricabile, come JSON statico da leggere da un foglio di calcolo, un sito o un programma. Gratis, senza chiave né registrazione. Ogni serie riporta fonte, licenza e testo di attribuzione.',
      loading: 'Caricamento…', kS: 'Serie', kR: 'Punti dati', kD: 'Dati al',
      eT: 'Indirizzi', eH: ['Cosa restituisce', 'Indirizzo'],
      eR: [['Catalogo delle serie con fonte, licenza, attribuzione, periodo e link', '/data/api/v1/index.json'], ['Ultimo valore, valore precedente e variazione di tutte le serie', '/data/api/v1/latest.json'], ['Tutto lo storico di una serie (regione e prodotto dal catalogo)', '/data/api/v1/series/{regione}/{prodotto}.json'], ['Descrizione OpenAPI 3.1', '/data/api/v1/openapi.json'], ['Acqua: catalogo di fiumi e siccità con fonte, licenza e attribuzione', '/data/api/v1/water/index.json'], ['Acqua: stazioni fluviali di un paese (de, nl, fr, be, ca, us) con livello, portata, stato, percentile rispetto allo storico e 30 giorni di punti', '/data/api/v1/water/rivers/{paese}.json'], ['Acqua: indicatore combinato di siccità dell’UE per paese (ultimi 13 periodi)', '/data/api/v1/water/drought/eu.json']],
      pqT: 'Excel e Power Query', pqP: ['In Excel: Dati > Recupera dati > Da altre origini > Query vuota > Editor avanzato, e incolla questo codice. Cambia l’indirizzo con la serie che vuoi (l’elenco è in index.json).', 'Carica la tabella in un foglio. «Aggiorna tutto» rilegge l’API. Ogni riga è una data e il suo prezzo; fonte e attribuzione sono nella query qui sotto, da tenere accanto al dato.', 'Se preferisci senza codice, il pacchetto di dati scaricabili contiene gli stessi dati in CSV ed Excel.'], pqN: 'La struttura del JSON è verificata sui dati reali; non ho potuto eseguire il codice Power Query in Excel da qui, quindi se dà un errore, segnalacelo.', xT: 'Esempi', xN: 'L’esempio usa il grano dell’UE; cambia la regione (us, eu, uk, ca) e il prodotto con quelli del catalogo.',
      fT: 'Com’è fatta una serie',
      fP: ['«points» sono coppie [data, valore], dalla più vecchia alla più recente. Date: AAAA-MM, AAAA-MM-GG o AAAA-Qn.', '«note» dice esattamente cosa misura la serie (mercato, qualità, nazionale o no); leggila prima di confrontare due serie.', 'I valori sono quelli della fonte: nessuna stima né riempimento dei vuoti. Se manca un mese, manca.'],
      rT: 'Condizioni d’uso',
      rP: ['Ci sono solo serie la cui fonte consente l’uso commerciale (idoneo) o lo consente con condizioni. Se una fonte smette di consentirlo, la sua serie sparisce dall’API al successivo aggiornamento.', 'Cita la fonte con il campo «attribution» di ogni serie. Questa non è consulenza legale: prevale la licenza di ogni fonte.', 'Sono file statici con cache di cinque minuti. Scarica ciò che ti serve una volta e conservalo; non serve interrogare ogni secondo. I dati si aggiornano al massimo una volta al giorno.', 'L’API v1 mantiene la sua forma: se qualcosa deve cambiare uscirà una v2 e la v1 resterà per un po’.'],
      links: 'Vedi anche', ld: 'Download CSV ed Excel', lc: 'Condizioni d’uso commerciale',
      cta: 'Ti serve un’altra serie, una frequenza maggiore o un accordo d’uso? Raccontaci di cosa hai bisogno.', ctaBtn: 'Scrivici'
    }
  };
  var DOC = null;
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(n) { try { return Number(n).toLocaleString(lang()); } catch (e) { return String(n); } }
  function card(k, v) { return '<div class="di-card" style="padding:12px 16px"><div style="font-size:12px;color:var(--text-muted)">' + esc(k) + '</div><div style="font-size:22px;font-weight:700;margin-top:2px">' + esc(v) + '</div></div>'; }
  function code(s) { return '<pre class="di-card" style="padding:12px 14px;overflow-x:auto;font-size:12.5px;margin:8px 0"><code>' + esc(s) + '</code></pre>'; }
  var EX = {
    curl: 'curl https://dehesaindex.com/data/api/v1/series/eu/trigo.json',
    js: 'fetch("https://dehesaindex.com/data/api/v1/series/eu/trigo.json")\n  .then(function (r) { return r.json(); })\n  .then(function (s) {\n    var last = s.points[s.points.length - 1];\n    console.log(s.sourceName, last[0], last[1], s.unit);\n    console.log(s.attribution);\n  });',
    py: 'import json, urllib.request\nu = "https://dehesaindex.com/data/api/v1/series/eu/trigo.json"\ns = json.load(urllib.request.urlopen(u))\nprint(s["sourceName"], s["points"][-1], s["unit"])\nprint(s["attribution"])',
  };
  var PQN = { es: ['Origen', 'Tabla', 'Fecha', 'Precio', 'Fuente', 'Licencia', 'Atribución', 'Unidad'], en: ['Source', 'Rows', 'Date', 'Price', 'Source', 'Licence', 'Attribution', 'Unit'],
    fr: ['Source', 'Lignes', 'Date', 'Prix', 'Source', 'Licence', 'Attribution', 'Unité'], it: ['Origine', 'Righe', 'Data', 'Prezzo', 'Fonte', 'Licenza', 'Attribuzione', 'Unità'] };
  function pq1(l) {
    var n = PQN[l] || PQN.es;
    return 'let\n    ' + n[0] + ' = Json.Document(Web.Contents("https://dehesaindex.com/data/api/v1/series/eu/trigo.json")),\n    ' + n[1] + ' = Table.FromList(' + n[0] + '[points], Splitter.SplitByNothing(), {"par"}),\n    ' + n[2] + ' = Table.AddColumn(' + n[1] + ', "' + n[2] + '", each [par]{0}, type text),\n    ' + n[3] + ' = Table.AddColumn(' + n[2] + ', "' + n[3] + '", each [par]{1}, type number)\nin\n    Table.SelectColumns(' + n[3] + ', {"' + n[2] + '", "' + n[3] + '"})';
  }
  function pq2(l) {
    var n = PQN[l] || PQN.es;
    return 'let\n    ' + n[0] + ' = Json.Document(Web.Contents("https://dehesaindex.com/data/api/v1/series/eu/trigo.json"))\nin\n    #table({"' + n[4] + '", "' + n[5] + '", "' + n[6] + '", "' + n[7] + '"}, {{' + n[0] + '[sourceName], ' + n[0] + '[license], ' + n[0] + '[attribution], ' + n[0] + '[currency] & "/" & ' + n[0] + '[unit]}})';
  }
  function render() {
    var w = t(), root = document.getElementById('ap-body'); if (!root) return;
    document.getElementById('ap-h1').textContent = w.h1; document.getElementById('ap-sub').textContent = w.sub; document.title = w.title + ' | Dehesa Index';
    var h = '';
    if (DOC) h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px">' + card(w.kS, nf(DOC.summary.series)) + card(w.kR, nf(DOC.summary.rows)) + card(w.kD, S.fmtDate ? S.fmtDate(DOC.generatedAt) : DOC.generatedAt) + '</div>';
    h += '<h2 style="margin:20px 0 8px;font-size:18px">' + esc(w.eT) + '</h2><div class="di-card" style="padding:4px 14px;overflow-x:auto"><table data-no-rows style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr>' +
      w.eH.map(function (c) { return '<th style="padding:8px 6px;text-align:left;font-size:12px;color:var(--text-muted);font-weight:600">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      w.eR.map(function (r) { return '<tr style="border-top:1px solid var(--border)"><td style="padding:8px 6px">' + esc(r[0]) + '</td><td style="padding:8px 6px;white-space:nowrap"><code>' + esc(r[1]) + '</code></td></tr>'; }).join('') + '</tbody></table></div>';
    h += '<h2 style="margin:26px 0 8px;font-size:18px">' + esc(w.xT) + '</h2><p class="di-emp-p">' + esc(w.xN) + '</p>' + code(EX.curl) + code(EX.js) + code(EX.py);
    h += '<h2 style="margin:26px 0 8px;font-size:18px">' + esc(w.pqT) + '</h2>' + w.pqP.slice(0, 2).map(function (p) { return '<p class="di-emp-p">' + esc(p) + '</p>'; }).join('') + code(pq1(lang())) + code(pq2(lang())) + '<p class="di-emp-p">' + esc(w.pqP[2]) + '</p><p class="di-movers-hint">' + esc(w.pqN) + '</p>';
    h += '<h2 style="margin:26px 0 8px;font-size:18px">' + esc(w.fT) + '</h2>' + w.fP.map(function (p) { return '<p class="di-emp-p">' + esc(p) + '</p>'; }).join('');
    h += '<h2 style="margin:26px 0 8px;font-size:18px">' + esc(w.rT) + '</h2>' + w.rP.map(function (p) { return '<p class="di-emp-p">' + esc(p) + '</p>'; }).join('');
    h += '<p class="di-movers-hint">' + esc(w.links) + ': <a href="datos-descargables.html">' + esc(w.ld) + '</a> · <a href="condiciones.html">' + esc(w.lc) + '</a> · <a href="' + esc(S.sitePath('data/api/v1/openapi.json')) + '">OpenAPI</a></p>';
    h += '<section class="di-card di-emp-cta" style="margin-top:16px"><p class="di-emp-cta-body" style="margin:0 0 12px">' + esc(w.cta) + '</p><a class="di-btn-gold-solid" href="empresas.html#contacto">' + esc(w.ctaBtn) + '</a></section>';
    root.innerHTML = h;
  }
  S.init('data');
  S.onLangChange = render;
  render();
  fetch(S.sitePath('data/api/v1/index.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) { DOC = d; render(); }).catch(function () {});
})();
