/* Dehesa Index — página de Inicio */
(function () {
  'use strict';

  // Market Movers: mismos productos y misma cifra que el panel de precios en
  // este momento (Trigo/UE, Maíz/EE. UU., Leche/EE. UU., Urea/EE. UU.), para
  // que la home no invente números distintos a los de Precios. Es una
  // instantánea que hay que actualizar a mano si cambian mucho los precios
  // de referencia -- no se recalcula sola.
  var MOVERS_DATA = [];
  var HOME_DATA = { status: 'loading', rows: [], catalog: null };
  var PRODUCT_NAMES = { trigo: 'Trigo', maiz: 'Maíz', arroz: 'Arroz', leche: 'Leche', urea: 'Urea', diesel: 'Diésel' };
  function fmtMoverPrice(v) {
    var n = Number(v);
    if (!isFinite(n)) return '—';
    var decimals = Math.abs(n) >= 100 ? 1 : (Math.abs(n) >= 10 ? 2 : 3);
    return n.toFixed(decimals);
  }
  function productLabel(key) { return PRODUCT_NAMES[key] || String(key || '').replace(/-/g, ' '); }

  var STRINGS = {
    es: {
      h1: 'El pulso de la agricultura, en un solo panel',
      sub: 'Precios diarios y semanales de cereales, lácteos, ganado, pienso y fertilizantes en EE. UU. y Europa — comparables al instante en la misma moneda y la misma unidad.',
      ctaPrimary: 'Ver el panel de precios →',
      ctaSecondary: 'Cómo funciona',
      moversTitle: 'PANEL DE MERCADO',
      moversHint: 'Solo observaciones reales publicadas por la capa de datos',
      moversColProducto: 'Producto', moversColPrecio: 'Último', moversCol1D: 'Estado', moversCol1W: 'Fecha',
      moversCta: 'Abrir panel completo →',
      moversLabels: {
        trigo: { name: 'Trigo', unit: 'tonelada', market: 'Europa · Euronext (MATIF)' },
        maiz: { name: 'Maíz', unit: 'bushel', market: 'EE. UU. · USDA NASS' },
        leche: { name: 'Leche', unit: 'cwt', market: 'EE. UU. · USDA AMS (Class III)' },
        urea: { name: 'Urea', unit: 'ton corta', market: 'EE. UU. · DTN Fertilizer Index' }
      },
      stats: [
        { value: '11', label: 'categorías de producto' },
        { value: '18', label: 'mercados seguidos' },
        { value: '2', label: 'continentes — EE. UU. y Europa' },
        { value: 'Diario', label: 'ritmo de actualización' }
      ],
      coverTitle: 'Qué cubrimos',
      coverSub: 'Once categorías clave de la agricultura, con precios de referencia de ambos lados del Atlántico.',
      categories: [
        { label: 'Cereales', items: 'Maíz · Trigo · Arroz', desc: 'Futuros CBOT y contratos Euronext (MATIF), comparables en la misma unidad.' },
        { label: 'Lácteos', items: 'Leche', desc: 'Precios USDA AMS (Clase III) frente a referencias de la Comisión Europea.' },
        { label: 'Ganado', items: 'Vaca · Cabra', desc: 'Cotizaciones CME Group y lonjas europeas, en pie y en canal.' },
        { label: 'Porcino', items: 'Cerdo', desc: 'Referencia de porcino blanco de EE. UU. y la UE, más Mercolleida como lonja española.' },
        { label: 'Ovino', items: 'Cordero', desc: 'Precios de cordero en EE. UU. y referencias de canal en la Unión Europea.' },
        { label: 'Avicultura', items: 'Huevos · Pollo', desc: 'Precios de huevo y pollo en EE. UU. y la Unión Europea.' },
        { label: 'Pienso', items: 'Pienso compuesto · Harina de soja', desc: 'Índices de referencia de EE. UU. y la UE para el coste de alimentación.' },
        { label: 'Fertilizantes', items: 'Urea · DAP · Potasa', desc: 'DTN Fertilizer Index frente a referencias internacionales.' },
        { label: 'Azúcar', items: 'Azúcar', desc: 'Referencia USDA frente al precio del azúcar blanco en la Unión Europea.' },
        { label: 'Aceite de oliva', items: 'Aceite de oliva', desc: 'El dashboard semanal de la Comisión Europea, con España como referencia mundial.' },
        { label: 'Energía', items: 'Diésel agrícola', desc: 'Precio del gasóleo en EE. UU. (por región) y Europa (por país) — clave para el coste de la maquinaria.' }
      ],
      howTitle: 'Cómo funciona',
      howSub: 'Tres pasos para comparar precios de EE. UU. y Europa como si fueran uno solo.',
      steps: [
        { n: '01', title: 'Elige categoría y mercado', desc: 'Cereales, lácteos, ganado, pienso o fertilizantes — en EE. UU. o Europa.' },
        { n: '02', title: 'Compara en la misma base', desc: 'Cambia moneda (USD/EUR) y unidad (imperial/métrica) para comparar directamente.' },
        { n: '03', title: 'Sigue la tendencia', desc: 'Gráficos históricos y variación porcentual para ver hacia dónde se mueve el mercado.' }
      ],
      disclaimer: 'Las cifras del panel principal se muestran únicamente cuando existe una observación real normalizada. Cuando una fuente está pendiente o no es comparable, se indica explícitamente.',
      ctaTitle: 'Explora el panel completo de precios',
      ctaSub: 'Cereales, lácteos, ganado, pienso y fertilizantes — actualizados y listos para comparar.',
      ctaButton: 'Ver precios →'
    },
    en: {
      h1: 'The pulse of agriculture, in one dashboard',
      sub: 'Daily and weekly prices for grains, dairy, livestock, feed and fertilizer in the U.S. and Europe — instantly comparable in the same currency and the same unit.',
      ctaPrimary: 'View the price dashboard →',
      ctaSecondary: 'How it works',
      moversTitle: 'MARKET SNAPSHOT',
      moversHint: 'Only real observations published by the data layer',
      moversColProducto: 'Commodity', moversColPrecio: 'Latest', moversCol1D: 'Status', moversCol1W: 'Date',
      moversCta: 'Open full dashboard →',
      moversLabels: {
        trigo: { name: 'Wheat', unit: 'tonne', market: 'Europe · Euronext (MATIF)' },
        maiz: { name: 'Corn', unit: 'bushel', market: 'U.S. · USDA NASS' },
        leche: { name: 'Milk', unit: 'cwt', market: 'U.S. · USDA AMS (Class III)' },
        urea: { name: 'Urea', unit: 'short ton', market: 'U.S. · DTN Fertilizer Index' }
      },
      stats: [
        { value: '11', label: 'product categories' },
        { value: '18', label: 'markets tracked' },
        { value: '2', label: 'continents — U.S. and Europe' },
        { value: 'Daily', label: 'update pace' }
      ],
      coverTitle: 'What we cover',
      coverSub: 'Eleven key agricultural categories, with reference prices from both sides of the Atlantic.',
      categories: [
        { label: 'Grains', items: 'Corn · Wheat · Rice', desc: 'CBOT futures and Euronext (MATIF) contracts, comparable in the same unit.' },
        { label: 'Dairy', items: 'Milk', desc: 'USDA AMS (Class III) prices against European Commission references.' },
        { label: 'Livestock', items: 'Cattle · Goat', desc: 'CME Group quotes and European markets, live weight and carcass.' },
        { label: 'Pork', items: 'Pork', desc: 'Standard pork reference for the U.S. and EU, plus Mercolleida as a Spanish market.' },
        { label: 'Sheep & Lamb', items: 'Lamb', desc: 'U.S. lamb prices against EU carcass references.' },
        { label: 'Poultry & Eggs', items: 'Eggs · Chicken', desc: 'Egg and chicken prices in the U.S. and the EU.' },
        { label: 'Feed', items: 'Compound feed · Soybean meal', desc: 'U.S. and EU reference indices for feed costs.' },
        { label: 'Fertilizer', items: 'Urea · DAP · Potash', desc: 'DTN Fertilizer Index against international references.' },
        { label: 'Sugar', items: 'Sugar', desc: 'USDA reference against the EU white sugar price.' },
        { label: 'Olive Oil', items: 'Olive oil', desc: "The European Commission's weekly dashboard, with Spain as the world benchmark." },
        { label: 'Energy', items: 'Agricultural diesel', desc: 'Diesel prices in the U.S. (by region) and Europe (by country) — key to machinery running costs.' }
      ],
      howTitle: 'How it works',
      howSub: 'Three steps to compare U.S. and European prices as if they were one.',
      steps: [
        { n: '01', title: 'Choose category and market', desc: 'Grains, dairy, livestock, feed or fertilizer — in the U.S. or Europe.' },
        { n: '02', title: 'Compare on the same basis', desc: 'Switch currency (USD/EUR) and unit (imperial/metric) to compare directly.' },
        { n: '03', title: 'Follow the trend', desc: 'Historical charts and percentage change to see where the market is heading.' }
      ],
      disclaimer: 'Dashboard figures appear only when a real normalized observation exists. Pending or non-comparable sources are labeled explicitly.',
      ctaTitle: 'Explore the full price dashboard',
      ctaSub: 'Grains, dairy, livestock, feed and fertilizer — updated and ready to compare.',
      ctaButton: 'View prices →'
    },
    fr: {
      h1: "Le pouls de l'agriculture, en un seul tableau de bord",
      sub: "Prix quotidiens et hebdomadaires des céréales, produits laitiers, bétail, aliments pour animaux et engrais aux États-Unis et en Europe — comparables instantanément dans la même devise et la même unité.",
      ctaPrimary: 'Voir le tableau des prix →',
      ctaSecondary: 'Comment ça marche',
      moversTitle: 'LES MOUVEMENTS AGRICOLES DU JOUR',
      moversHint: 'Seules les observations réelles publiées par la couche de données',
      moversColProducto: 'Produit', moversColPrecio: 'Prix', moversCol1D: '1J', moversCol1W: '1S',
      moversCta: 'Voir tous les prix →',
      moversLabels: {
        trigo: { name: 'Blé', unit: 'tonne', market: 'Europe · Euronext (MATIF)' },
        maiz: { name: 'Maïs', unit: 'bushel', market: 'États-Unis · USDA NASS' },
        leche: { name: 'Lait', unit: 'cwt', market: 'États-Unis · USDA AMS (Class III)' },
        urea: { name: 'Urée', unit: 'tonne courte', market: 'États-Unis · DTN Fertilizer Index' }
      },
      stats: [
        { value: '11', label: 'catégories de produits' },
        { value: '18', label: 'marchés suivis' },
        { value: '2', label: 'continents — États-Unis et Europe' },
        { value: 'Quotidien', label: 'rythme de mise à jour' }
      ],
      coverTitle: 'Ce que nous couvrons',
      coverSub: "Onze catégories agricoles clés, avec des prix de référence des deux côtés de l'Atlantique.",
      categories: [
        { label: 'Céréales', items: 'Maïs · Blé · Riz', desc: 'Contrats à terme CBOT et contrats Euronext (MATIF), comparables dans la même unité.' },
        { label: 'Produits laitiers', items: 'Lait', desc: 'Prix USDA AMS (Classe III) face aux références de la Commission européenne.' },
        { label: 'Bétail', items: 'Bovins · Chèvre', desc: 'Cotations CME Group et marchés européens, sur pied et en carcasse.' },
        { label: 'Porc', items: 'Porc', desc: "Référence porc standard pour les États-Unis et l'UE, avec Mercolleida comme marché espagnol." },
        { label: 'Ovins', items: 'Agneau', desc: "Prix de l'agneau aux États-Unis face aux références carcasse dans l'UE." },
        { label: 'Volaille et œufs', items: 'Œufs · Poulet', desc: "Prix des œufs et du poulet aux États-Unis et dans l'UE." },
        { label: 'Aliments pour animaux', items: 'Aliment composé · Tourteau de soja', desc: "Indices de référence américains et européens pour le coût de l'alimentation animale." },
        { label: 'Engrais', items: 'Urée · DAP · Potasse', desc: 'DTN Fertilizer Index face aux références internationales.' },
        { label: 'Sucre', items: 'Sucre', desc: "Référence USDA face au prix du sucre blanc dans l'UE." },
        { label: "Huile d'olive", items: "Huile d'olive", desc: "Le tableau de bord hebdomadaire de la Commission européenne, avec l'Espagne comme référence mondiale." },
        { label: 'Énergie', items: 'Gazole agricole', desc: 'Prix du gazole aux États-Unis (par région) et en Europe (par pays) — un poste clé du coût de la machinerie.' }
      ],
      howTitle: 'Comment ça marche',
      howSub: "Trois étapes pour comparer les prix américains et européens comme s'ils n'en faisaient qu'un.",
      steps: [
        { n: '01', title: 'Choisissez catégorie et marché', desc: 'Céréales, produits laitiers, bétail, aliments ou engrais — aux États-Unis ou en Europe.' },
        { n: '02', title: 'Comparez sur la même base', desc: "Changez la devise (USD/EUR) et l'unité (impérial/métrique) pour comparer directement." },
        { n: '03', title: 'Suivez la tendance', desc: 'Graphiques historiques et variation en pourcentage pour voir où va le marché.' }
      ],
      disclaimer: 'Le tableau de bord affiche uniquement une observation réelle normalisée. Les sources en attente ou non comparables sont signalées explicitement.',
      ctaTitle: 'Explorez le tableau de bord complet des prix',
      ctaSub: 'Céréales, produits laitiers, bétail, aliments pour animaux et engrais — mis à jour et prêts à être comparés.',
      ctaButton: 'Voir les prix →'
    },
    it: {
      h1: "Il polso dell'agricoltura, in un unico pannello",
      sub: "Prezzi giornalieri e settimanali di cereali, lattiero-caseario, bestiame, mangimi e fertilizzanti negli Stati Uniti e in Europa — comparabili all'istante nella stessa valuta e nella stessa unità di misura.",
      ctaPrimary: 'Vedi il pannello dei prezzi →',
      ctaSecondary: 'Come funziona',
      moversTitle: 'I MOVIMENTI AGRICOLI DI OGGI',
      moversHint: 'Solo osservazioni reali pubblicate dal livello dati',
      moversColProducto: 'Prodotto', moversColPrecio: 'Prezzo', moversCol1D: '1G', moversCol1W: '1S',
      moversCta: 'Vedi tutti i prezzi →',
      moversLabels: {
        trigo: { name: 'Grano', unit: 'tonnellata', market: 'Europa · Euronext (MATIF)' },
        maiz: { name: 'Mais', unit: 'bushel', market: 'Stati Uniti · USDA NASS' },
        leche: { name: 'Latte', unit: 'cwt', market: 'Stati Uniti · USDA AMS (Class III)' },
        urea: { name: 'Urea', unit: 'tonnellata corta', market: 'Stati Uniti · DTN Fertilizer Index' }
      },
      stats: [
        { value: '11', label: 'categorie di prodotto' },
        { value: '18', label: 'mercati monitorati' },
        { value: '2', label: 'continenti — Stati Uniti ed Europa' },
        { value: 'Giornaliero', label: 'ritmo di aggiornamento' }
      ],
      coverTitle: 'Cosa copriamo',
      coverSub: "Undici categorie chiave dell'agricoltura, con prezzi di riferimento da entrambe le sponde dell'Atlantico.",
      categories: [
        { label: 'Cereali', items: 'Mais · Grano · Riso', desc: 'Futures CBOT e contratti Euronext (MATIF), comparabili nella stessa unità di misura.' },
        { label: 'Lattiero-caseario', items: 'Latte', desc: 'Prezzi USDA AMS (Classe III) a confronto con i riferimenti della Commissione europea.' },
        { label: 'Bestiame', items: 'Bovini · Capre', desc: 'Quotazioni CME Group e mercati europei, peso vivo e peso morto.' },
        { label: 'Suini', items: 'Maiale', desc: 'Riferimento del mercato suino standard per Stati Uniti e UE, più Mercolleida come mercato spagnolo.' },
        { label: 'Ovini', items: 'Agnello', desc: "Prezzi dell'agnello negli Stati Uniti a confronto con i riferimenti di peso morto nell'UE." },
        { label: 'Avicoltura', items: 'Uova · Pollo', desc: "Prezzi di uova e pollo negli Stati Uniti e nell'UE." },
        { label: 'Mangimi', items: 'Mangime composto · Farina di soia', desc: "Indici di riferimento statunitensi ed europei per il costo dell'alimentazione." },
        { label: 'Fertilizzanti', items: 'Urea · DAP · Potassa', desc: 'DTN Fertilizer Index a confronto con i riferimenti internazionali.' },
        { label: 'Zucchero', items: 'Zucchero', desc: "Riferimento USDA a confronto con il prezzo dello zucchero bianco nell'UE." },
        { label: "Olio d'oliva", items: "Olio d'oliva", desc: "Il dashboard settimanale della Commissione europea, con la Spagna come riferimento mondiale." },
        { label: 'Energia', items: 'Gasolio agricolo', desc: 'Prezzo del gasolio negli Stati Uniti (per regione) e in Europa (per paese) — una voce chiave nel costo dei macchinari.' }
      ],
      howTitle: 'Come funziona',
      howSub: 'Tre passi per confrontare i prezzi di Stati Uniti ed Europa come se fossero un unico mercato.',
      steps: [
        { n: '01', title: 'Scegli categoria e mercato', desc: 'Cereali, lattiero-caseario, bestiame, mangimi o fertilizzanti — negli Stati Uniti o in Europa.' },
        { n: '02', title: 'Confronta sulla stessa base', desc: 'Cambia valuta (USD/EUR) e unità di misura (imperiale/metrica) per confrontare direttamente.' },
        { n: '03', title: 'Segui la tendenza', desc: 'Grafici storici e variazione percentuale per vedere verso dove si muove il mercato.' }
      ],
      disclaimer: 'Il pannello mostra solo osservazioni reali normalizzate. Le fonti in attesa o non comparabili sono segnalate esplicitamente.',
      ctaTitle: 'Esplora il pannello completo dei prezzi',
      ctaSub: 'Cereali, lattiero-caseario, bestiame, mangimi e fertilizzanti — aggiornati e pronti per il confronto.',
      ctaButton: 'Vedi i prezzi →'
    }
  };

  function render() {
    var lang = window.DehesaShared.getLang();
    var esc = window.DehesaShared.esc;
    var t = STRINGS[lang] || STRINGS.es;
    document.title = 'Dehesa Index — ' + (lang === 'es' ? 'Inicio' : (lang === 'fr' ? 'Accueil' : (lang === 'it' ? 'Home' : 'Home')));
    document.getElementById('home-h1').textContent = t.h1;
    document.getElementById('home-sub').textContent = t.sub;
    document.getElementById('home-cta-primary').textContent = t.ctaPrimary;
    document.getElementById('home-cta-secondary').textContent = t.ctaSecondary;

    var realCount = HOME_DATA.rows.length;
    var sourceCount = HOME_DATA.catalog ? (HOME_DATA.catalog.sources || []).length : 0;
    var productCount = HOME_DATA.catalog ? (HOME_DATA.catalog.products || []).length : 0;
    var stats = [
      { value: String(productCount || '—'), label: lang === 'es' ? 'productos con datos' : 'products with data' },
      { value: String(realCount || '—'), label: lang === 'es' ? 'observaciones reales' : 'real observations' },
      { value: String(sourceCount || '—'), label: lang === 'es' ? 'fuentes conectadas' : 'connected sources' },
      { value: HOME_DATA.status === 'live' ? 'LIVE' : HOME_DATA.status === 'unavailable' ? 'OFFLINE' : '…', label: lang === 'es' ? 'estado de datos' : 'data status' }
    ];
    document.getElementById('home-stats').innerHTML = stats.map(function(s) {
      return '<div><div class="di-stat-value">' + esc(s.value) + '</div><div class="di-stat-label">' + esc(s.label) + '</div></div>';
    }).join('');

    document.getElementById('home-movers-title').textContent = t.moversTitle;
    document.getElementById('home-movers-hint').textContent = t.moversHint;
    document.getElementById('home-movers-cta').textContent = t.moversCta;

    var movers = HOME_DATA.rows.slice(0, 4).map(function(o) {
      var key = o.product;
      var label = (t.moversLabels && t.moversLabels[key]) || { name: productLabel(key), unit: o.unit || '', market: (o.region || '').toUpperCase() };
      var status = o.status === 'verified' ? (o.comparability === 'not_comparable' ? 'not-comparable' : 'real') : 'pending';
      var statusLabel = status === 'real' ? (lang === 'es' ? 'REAL' : lang === 'fr' ? 'RÉEL' : lang === 'it' ? 'REALE' : 'REAL') : status === 'not-comparable' ? (lang === 'es' ? 'NO COMPARABLE' : lang === 'fr' ? 'NON COMPARABLE' : lang === 'it' ? 'NON COMPARABILE' : 'NOT COMPARABLE') : (lang === 'es' ? 'PENDIENTE' : lang === 'fr' ? 'EN ATTENTE' : lang === 'it' ? 'IN ATTESA' : 'PENDING');
      return { name: label.name, market: label.market, source: o.sourceId || '—', price: status === 'real' ? fmtMoverPrice(o.value) + (o.currency ? ' ' + o.currency : '') + (o.unit ? '/' + o.unit : '') : '—', status: status, statusLabel: statusLabel, date: o.observationDate || '—' };
    });
    var headRow = '<div class="di-movers-row head"><span>' + esc(t.moversColProducto) + '</span><span class="num">' + esc(t.moversColPrecio) + '</span><span class="num">' + esc(t.moversCol1D) + '</span><span class="num">' + esc(t.moversCol1W) + '</span></div>';
    var bodyRows = movers.length ? movers.map(function(row, i) {
      var borderStyle = i === movers.length - 1 ? 'border-bottom:none;' : '';
      return '<div class="di-movers-row" style="' + borderStyle + '">' +
        '<div><div class="di-movers-name">' + esc(row.name) + '</div><div class="di-movers-market">' + esc(row.market) + '</div><div class="di-movers-source">' + esc(row.source) + '</div></div>' +
        '<div class="num">' + esc(row.price) + '</div>' +
        '<div class="num"><span class="di-home-status ' + row.status + '">' + esc(row.statusLabel) + '</span></div>' +
        '<div class="num">' + esc(row.date) + '</div></div>';
    }).join('') : '<div class="di-home-empty">Sin observaciones reales disponibles todavía.</div>';
    document.getElementById('home-movers-table').innerHTML = headRow + bodyRows;

    document.getElementById('home-cover-title').textContent = t.coverTitle;
    document.getElementById('home-cover-sub').textContent = t.coverSub;
    document.getElementById('home-cat-grid').innerHTML = t.categories.map(function(c) {
      return '<a class="di-cat-card" href="precios.html"><div class="di-cat-bar"></div><div class="di-cat-label serif">' + esc(c.label) + '</div><div class="di-cat-items">' + esc(c.items) + '</div><div class="di-cat-desc">' + esc(c.desc) + '</div></a>';
    }).join('');
    document.getElementById('home-how-title').textContent = t.howTitle;
    document.getElementById('home-how-sub').textContent = t.howSub;
    document.getElementById('home-steps-grid').innerHTML = t.steps.map(function(s) {
      return '<div class="di-step"><div class="di-step-n serif">' + esc(s.n) + '</div><div class="di-step-title">' + esc(s.title) + '</div><div class="di-step-desc">' + esc(s.desc) + '</div></div>';
    }).join('');
    document.getElementById('home-disclaimer').textContent = t.disclaimer;
    document.getElementById('home-cta-title').textContent = t.ctaTitle;
    document.getElementById('home-cta-sub').textContent = t.ctaSub;
    document.getElementById('home-cta-button').textContent = t.ctaButton;
  }

  function loadHomeData() {
    Promise.all([
      fetch('data/latest.json').then(function(r){ if(!r.ok) throw Error('latest'); return r.json(); }),
      fetch('data/catalog.json').then(function(r){ if(!r.ok) throw Error('catalog'); return r.json(); })
    ]).then(function(all) {
      HOME_DATA.rows = (all[0].observations || []).sort(function(a,b){ return String(b.observationDate).localeCompare(String(a.observationDate)); });
      HOME_DATA.catalog = all[1];
      HOME_DATA.loaded = true;
      render();
    }).catch(function(){ HOME_DATA.status = 'unavailable'; HOME_DATA.rows = []; HOME_DATA.catalog = null; render(); });
  }

  window.DehesaShared.init('home');
  window.DehesaShared.onLangChange = render;
  render();
  loadHomeData();
})();
