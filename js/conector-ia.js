/* Dehesa Index — Conector para IA (MCP): instrucciones de uso. El servidor esta en mcp/ (local) y mcp/worker.mjs (remoto, publicado en Cloudflare Workers). ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var TOOLS = [
    ['search_series', 'Buscar series', 'Search series', 'Chercher des séries', 'Cercare serie'],
    ['get_latest', 'Último dato', 'Latest value', 'Dernière valeur', 'Ultimo dato'],
    ['get_series', 'Histórico de una serie', 'Series history', 'Historique d’une série', 'Storico di una serie'],
    ['compare_markets', 'Un producto en varios mercados', 'One product across markets', 'Un produit sur plusieurs marchés', 'Un prodotto su più mercati'],
    ['price_moves', 'Mayores subidas y bajadas', 'Biggest rises and falls', 'Plus fortes hausses et baisses', 'Maggiori rialzi e ribassi'],
    ['list_baskets', 'Cestas disponibles', 'Available baskets', 'Paniers disponibles', 'Panieri disponibili'],
    ['get_basket', 'Una cesta con su metodología', 'A basket with its methodology', 'Un panier et sa méthodologie', 'Un paniere e la sua metodologia'],
    ['list_countries', 'Países y qué datos tiene cada uno', 'Countries and what data each has', 'Pays et données disponibles', 'Paesi e dati disponibili'],
    ['search_catalog', 'Buscar en el catálogo de un país', 'Search one country’s catalog', 'Chercher dans le catalogue d’un pays', 'Cercare nel catalogo di un paese'],
    ['get_catalog_series', 'Historial de una serie del catálogo', 'History of a catalog series', 'Historique d’une série du catalogue', 'Storico di una serie del catalogo']
  ];
  var T = {
    es: { h1: 'Conector para IA', sub: 'Pregunta por los precios desde tu asistente de IA y recibe cada dato con su fuente, su licencia y su fecha.',
      wT: 'Qué puedes preguntar', wP: 'Por ejemplo: «¿Cuánto ha subido el trigo en la UE en 12 meses?», «Compara el precio de la leche en EE. UU., UE, Reino Unido y Canadá» o «¿Qué precios se han movido más esta semana?». El asistente usa estas herramientas de solo lectura:',
      iT: 'Instalación en tu ordenador', iP: 'Funciona con cualquier cliente compatible con MCP, como Claude Desktop. Necesitas Node 18 o superior. Descarga el repositorio y añade esto a la configuración del cliente:',
      rT: 'Servidor remoto', rP: 'También hay un servidor remoto publicado, para clientes que admiten servidores MCP por HTTP: https://dehesa-index-mcp.dehesaindex.workers.dev. No necesita instalar nada, pero no está probado con todos los clientes; si el tuyo no lo admite, usa la instalación local. Es de solo lectura y no usa contraseña.',
      lT: 'Reglas de uso', lP: 'Los datos son de fuentes oficiales y cada uno mantiene su licencia. Las respuestas incluyen la atribución, que debes citar si reutilizas el dato. Nada se estima y el asistente no puede modificar nada.', lA: 'Condiciones de uso', lB: 'API de datos',
      fin: 'Información de fuentes oficiales, no asesoramiento financiero.' },
    en: { h1: 'AI connector', sub: 'Ask about prices from your AI assistant and get every figure with its source, licence and date.',
      wT: 'What you can ask', wP: 'For example: “How much has EU wheat risen in 12 months?”, “Compare milk prices in the US, EU, UK and Canada” or “Which prices moved most this week?”. The assistant uses these read-only tools:',
      iT: 'Install on your computer', iP: 'Works with any MCP-compatible client, such as Claude Desktop. You need Node 18 or later. Download the repository and add this to the client configuration:',
      rT: 'Remote server', rP: 'A remote server is also published, for clients that support MCP servers over HTTP: https://dehesa-index-mcp.dehesaindex.workers.dev. Nothing to install, but it has not been tested with every client; if yours does not support it, use the local install. It is read-only and needs no password.',
      lT: 'Terms of use', lP: 'The data comes from official sources and each keeps its licence. Answers include the attribution, which you must cite if you reuse a figure. Nothing is estimated and the assistant cannot change anything.', lA: 'Terms of use', lB: 'Data API',
      fin: 'Information from official sources, not financial advice.' },
    fr: { h1: 'Connecteur IA', sub: 'Interrogez les prix depuis votre assistant IA et obtenez chaque donnée avec sa source, sa licence et sa date.',
      wT: 'Ce que vous pouvez demander', wP: 'Par exemple : « De combien le blé de l’UE a-t-il augmenté en 12 mois ? », « Compare le prix du lait aux É.-U., dans l’UE, au Royaume-Uni et au Canada » ou « Quels prix ont le plus bougé cette semaine ? ». L’assistant utilise ces outils en lecture seule :',
      iT: 'Installation sur votre ordinateur', iP: 'Fonctionne avec tout client compatible MCP, comme Claude Desktop. Il faut Node 18 ou plus. Téléchargez le dépôt et ajoutez ceci à la configuration du client :',
      rT: 'Serveur distant', rP: 'Un serveur distant est aussi publié, pour les clients qui prennent en charge les serveurs MCP via HTTP : https://dehesa-index-mcp.dehesaindex.workers.dev. Rien à installer, mais il n’a pas été testé avec tous les clients ; si le vôtre ne le prend pas en charge, utilisez l’installation locale. Il est en lecture seule et sans mot de passe.',
      lT: 'Règles d’utilisation', lP: 'Les données viennent de sources officielles et chacune garde sa licence. Les réponses incluent l’attribution, à citer si vous réutilisez une donnée. Rien n’est estimé et l’assistant ne peut rien modifier.', lA: 'Conditions d’utilisation', lB: 'API de données',
      fin: 'Information issue de sources officielles, pas un conseil financier.' },
    it: { h1: 'Connettore per IA', sub: 'Chiedi i prezzi al tuo assistente IA e ricevi ogni dato con fonte, licenza e data.',
      wT: 'Cosa puoi chiedere', wP: 'Per esempio: «Di quanto è salito il grano UE in 12 mesi?», «Confronta il prezzo del latte in USA, UE, Regno Unito e Canada» o «Quali prezzi si sono mossi di più questa settimana?». L’assistente usa questi strumenti di sola lettura:',
      iT: 'Installazione sul tuo computer', iP: 'Funziona con qualsiasi client compatibile con MCP, come Claude Desktop. Serve Node 18 o superiore. Scarica il repository e aggiungi questo alla configurazione del client:',
      rT: 'Server remoto', rP: 'È pubblicato anche un server remoto, per i client che supportano server MCP via HTTP: https://dehesa-index-mcp.dehesaindex.workers.dev. Nulla da installare, ma non è stato provato con tutti i client; se il tuo non lo supporta, usa l’installazione locale. È in sola lettura e senza password.',
      lT: 'Regole d’uso', lP: 'I dati provengono da fonti ufficiali e ciascuna mantiene la propria licenza. Le risposte includono l’attribuzione, da citare se riutilizzi un dato. Nulla è stimato e l’assistente non può modificare nulla.', lA: 'Condizioni d’uso', lB: 'API dei dati',
      fin: 'Informazioni da fonti ufficiali, non consulenza finanziaria.' }
  };
  var CFG = '{\n  "mcpServers": {\n    "dehesa-index": {\n      "command": "node",\n      "args": ["/path/to/Dehesa-Index/mcp/server.mjs"]\n    }\n  }\n}';
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render() {
    var l = lang(), w = T[l] || T.es, ix = { es: 1, en: 2, fr: 3, it: 4 }[l] || 1, root = document.getElementById('ci-body'); if (!root) return;
    document.getElementById('ci-h1').textContent = w.h1; document.getElementById('ci-sub').textContent = w.sub; document.title = w.h1 + ' | Dehesa Index';
    var h = '<h2 style="margin:8px 0 6px;font-size:18px">' + esc(w.wT) + '</h2><p class="di-emp-p">' + esc(w.wP) + '</p><div class="di-card" style="padding:4px 14px"><ul style="list-style:none;margin:0;padding:0">';
    TOOLS.forEach(function (t, i) { h += '<li style="padding:8px 0;' + (i ? 'border-top:1px solid var(--border)' : '') + '"><code>' + esc(t[0]) + '</code> — ' + esc(t[ix]) + '</li>'; });
    h += '</ul></div><h2 style="margin:26px 0 6px;font-size:18px">' + esc(w.iT) + '</h2><p class="di-emp-p">' + esc(w.iP) + '</p>' +
      '<pre class="di-card" style="padding:12px 14px;overflow:auto;font-size:13px">git clone https://github.com/labombademario/Dehesa-Index.git</pre><pre class="di-card" style="padding:12px 14px;overflow:auto;font-size:13px">' + esc(CFG) + '</pre>' +
      '<h2 style="margin:26px 0 6px;font-size:18px">' + esc(w.rT) + '</h2><p class="di-emp-p">' + esc(w.rP) + '</p>' +
      '<h2 style="margin:26px 0 6px;font-size:18px">' + esc(w.lT) + '</h2><p class="di-emp-p">' + esc(w.lP) + '</p><p><a class="di-btn-sec" href="condiciones.html">' + esc(w.lA) + '</a> <a class="di-btn-sec" href="api.html">' + esc(w.lB) + '</a></p>' +
      '<p class="di-movers-hint">' + esc(w.fin) + '</p>';
    root.innerHTML = h;
  }
  S.init('data');
  S.onLangChange = render;
  render();
})();
