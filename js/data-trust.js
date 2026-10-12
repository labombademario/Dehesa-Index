/* Dehesa Index — Data Trust layer
   Makes provenance and comparability explicit without changing the underlying
   price dataset. Current RAW observations remain marked as SAMPLE until each
   source/observation is validated by the automated data pipeline.
*/
(function (global) {
  'use strict';
  var D = global.DehesaData;
  var S = global.DehesaShared;
  var I18N = {
    es:{summary:'Ver procedencia y metodología',status:'Estado del dato',sample:'Pendiente de verificación',source:'Fuente',market:'Mercado / referencia',type:'Tipo de cotización',frequency:'Frecuencia',frequencyUnknown:'Pendiente de verificación',observation:'Fecha de observación',notDeclared:'No declarada en el dataset',detected:'Detectada por Dehesa',officialPub:'Fecha oficial de publicación',notAvailable:'no disponible',publication:'Fecha de publicación',comparability:'Comparabilidad',review:'Revisión necesaria',conditional:'Condicional',direct:'Directa',directional:'Direccional',note:'Nota',compareNote:'La comparación depende de que unidad, mercado, base de medición y frecuencia sean equivalentes.'},
    en:{summary:'View provenance & methodology',status:'Data status',sample:'Pending verification',source:'Source',market:'Market / benchmark',type:'Quote type',frequency:'Frequency',frequencyUnknown:'Pending verification',observation:'Observation date',notDeclared:'Not declared in dataset',detected:'Detected by Dehesa',officialPub:'Official publication date',notAvailable:'not available',publication:'Publication date',comparability:'Comparability',review:'Review required',conditional:'Conditional',direct:'Direct',directional:'Directional',note:'Note',compareNote:'Comparison depends on equivalent unit, market, measurement basis and frequency.'},
    fr:{summary:'Voir provenance et méthodologie',status:'Statut de la donnée',sample:'Vérification en attente',source:'Source',market:'Marché / référence',type:'Type de cotation',frequency:'Fréquence',frequencyUnknown:'Vérification en attente',observation:'Date d’observation',notDeclared:'Non déclarée dans le dataset',detected:'Détectée par Dehesa',officialPub:'Date officielle de publication',notAvailable:'non disponible',publication:'Date de publication',comparability:'Comparabilité',review:'Révision nécessaire',conditional:'Conditionnelle',direct:'Directe',directional:'Directionnelle',note:'Note',compareNote:'La comparaison dépend d’une unité, d’un marché, d’une base de mesure et d’une fréquence équivalents.'},
    it:{summary:'Vedi provenienza e metodologia',status:'Stato del dato',sample:'Verifica in corso',source:'Fonte',market:'Mercato / riferimento',type:'Tipo di quotazione',frequency:'Frequenza',frequencyUnknown:'Verifica in corso',observation:'Data di osservazione',notDeclared:'Non dichiarata nel dataset',detected:'Rilevata da Dehesa',officialPub:'Data ufficiale di pubblicazione',notAvailable:'non disponibile',publication:'Data di pubblicazione',comparability:'Comparabilità',review:'Revisione necessaria',conditional:'Condizionale',direct:'Diretta',directional:'Direzionale',note:'Nota',compareNote:'Il confronto dipende da unità, mercato, base di misurazione e frequenza equivalenti.'}
  };
  function esc(v){return S&&S.esc?S.esc(v):String(v==null?'':v);}
  function frequencyFor(market){
    var m=String(market||'').toLowerCase();
    if(/nass/.test(m))return'monthly';
    if(/cme|euronext/.test(m))return'daily';
    if(/ams|ahdb|mercolleida|farmers weekly|rac fuel/.test(m))return'weekly / source-dependent';
    if(/world bank/.test(m))return'monthly';
    if(/eia|dtn/.test(m))return'weekly';
    if(/comisión europea|european commission|commission européenne|commissione europea/.test(m))return'source-dependent';
    return'source-dependent';
  }
  function frequencyLabel(freq,t){
    var l={
      monthly:{es:'Mensual',en:'Monthly',fr:'Mensuelle',it:'Mensile'},
      daily:{es:'Diaria',en:'Daily',fr:'Quotidienne',it:'Giornaliera'},
      'weekly / source-dependent':{es:'Semanal / según fuente',en:'Weekly / source-dependent',fr:'Hebdomadaire / selon la source',it:'Settimanale / secondo la fonte'},
      'source-dependent':{es:t.frequencyUnknown,en:t.frequencyUnknown,fr:t.frequencyUnknown,it:t.frequencyUnknown}
    };
    var lang=S.getLang?S.getLang():'es';
    return(l[freq]&&l[freq][lang])||t.frequencyUnknown;
  }
  function sourceFor(entry,qt){
    var lang=S.getLang?S.getLang():'es';
    var cat=(D.CATS[lang]||D.CATS.es)[entry.catId];
    var market=String(qt&&qt.market||'').toLowerCase();
    var sources=cat&&cat.sources?cat.sources:[];
    for(var i=0;i<sources.length;i++){
      var n=String(sources[i].name||'').toLowerCase();
      if(market.indexOf(n)>-1||n.indexOf(market)>-1)return sources[i];
      var w=n.split(' ')[0];
      if(w&&market.indexOf(w)>-1)return sources[i];
    }
    return sources[0]||null;
  }
  function comparability(entry){
    var p=entry.product||{},q=p.quoteTypes||{};
    if(p.footnoteKey)return'conditional';
    var us=q.us&&q.us.type,eu=q.eu&&q.eu.type;
    if(us&&eu&&us!==eu)return'directional';
    return'review';
  }
  function compLabel(v,t){return v==='conditional'?t.conditional:v==='directional'?t.directional:v==='direct'?t.direct:t.review;}

  /* Ventana de procedencia y metodología: se abre con el botón de cada tarjeta, se cierra con ×, Esc o clic fuera; el foco vuelve al botón */
  var CLOSE={es:'Cerrar',en:'Close',fr:'Fermer',it:'Chiudi'},KICK={es:'Procedencia y metodología',en:'Provenance and methodology',fr:'Provenance et méthodologie',it:'Provenienza e metodologia'};
  function openTrust(btn){
    var box=btn.closest('.di-data-trust'),tpl=box&&box.querySelector('template.di-dt-body');if(!tpl)return;
    var lang=S.getLang?S.getLang():'es',t=I18N[lang]||I18N.es;
    var card=btn.closest('.di-product-card,.di-info-card'),h=card&&card.querySelector('.di-product-name,.di-info-card-title'),title=h?h.textContent.replace(/^[^\p{L}]+/u,'').trim():'';
    var ov=document.createElement('div');ov.className='di-dt-overlay';
    ov.innerHTML='<div class="di-dt-modal" role="dialog" aria-modal="true" aria-labelledby="di-dt-h"><div class="di-dt-head"><div><span class="di-dt-kicker">'+esc(KICK[lang]||KICK.es)+'</span><h2 id="di-dt-h">'+esc(title)+'</h2></div><button type="button" class="di-dt-close" aria-label="'+esc(CLOSE[lang]||CLOSE.es)+'">×</button></div><div class="di-dt-content"></div></div>';
    ov.querySelector('.di-dt-content').appendChild(tpl.content.cloneNode(true));
    var close=function(){document.removeEventListener('keydown',key);if(ov.parentNode)ov.parentNode.removeChild(ov);document.body.style.overflow='';try{btn.focus();}catch(e){}};
    var key=function(e){if(e.key==='Escape')close();};
    ov.addEventListener('click',function(e){if(e.target===ov||(e.target.closest&&e.target.closest('.di-dt-close')))close();});
    document.addEventListener('keydown',key);document.body.appendChild(ov);document.body.style.overflow='hidden';
    ov.querySelector('.di-dt-close').focus();
  }
  if(document&&document.addEventListener)document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('.di-dt-open'):null;if(b){e.preventDefault();openTrust(b);}});
  function render(entry,disp){
    if(!entry||!disp||!disp.quoteType||disp.unverified)return'';
    var lang=S.getLang?S.getLang():'es',t=I18N[lang]||I18N.es;
    var region=disp.regionCode||disp.region||disp.quoteType.region||null;
    var productId=entry.catId+'-'+entry.product.nameKey;
    var key=productId+'-'+(region||'');
    var observation=D.DATA_TRUST&&D.DATA_TRUST[key];
    if(!observation){
      var fallbackRegion=region==='uk'?'uk':region==='ca'?'ca':region==='eu'?'eu':'us';
      observation=D.DATA_TRUST&&D.DATA_TRUST[productId+'-'+fallbackRegion];
    }
    if(!observation){
      return '';
    }

    var typeDef=(D.QUOTE_TYPES[lang]||D.QUOTE_TYPES.es)[observation.quoteType];
    var statusLabel=observation.status==='verified'?(lang==='es'?'Real':lang==='fr'?'Réel':lang==='it'?'Reale':'Real'):t.sample;
    var frequencyLabels={
      monthly:{es:'Mensual',en:'Monthly',fr:'Mensuelle',it:'Mensile'},
      weekly:{es:'Semanal',en:'Weekly',fr:'Hebdomadaire',it:'Settimanale'},
      daily:{es:'Diaria',en:'Daily',fr:'Quotidienne',it:'Giornaliera'},
      'source-dependent':{es:t.frequencyUnknown,en:t.frequencyUnknown,fr:t.frequencyUnknown,it:t.frequencyUnknown}
    };
    var frequency=(frequencyLabels[observation.frequency]&&frequencyLabels[observation.frequency][lang])||t.frequencyUnknown;
    var compLabel={
      conditional:t.conditional,
      directional:t.directional,
      direct:t.direct,
      not_comparable:lang==='es'?'No directamente comparable':lang==='fr'?'Pas directement comparable':lang==='it'?'Non direttamente comparabile':'Not directly comparable',
      review:t.review
    }[observation.comparability]||t.review;
    var statusClass=observation.status==='verified'?'verified':'sample';
    if(disp.derived){statusLabel=lang==='es'?'Estimado':lang==='fr'?'Estimé':lang==='it'?'Stimato':'Estimated';statusClass='sample';}
    var observationDate=observation.observationDate||t.notDeclared;
    var publicationDate=observation.publicationDate||t.notDeclared;
    // estas fuentes no publican fecha: el dato es el día en que Dehesa lo recuperó por primera vez (no una fecha oficial)
    var detectedPub=!!observation.publicationDate&&/^(eu_agrifood|eu_oil_bulletin)$/.test(observation.sourceId||'');
    var sourceHtml=observation.sourceUrl
      ? '<a href="'+esc(observation.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(observation.source)+'</a>'
      : esc(observation.source||'—');

    var fd=function(v){return /^\d{4}-\d{2}/.test(String(v))&&S.fmtDate?S.fmtDate(v,lang):v;};
    var row=function(l,v,html){return '<div class="di-dt-row"><dt>'+esc(l)+'</dt><dd>'+(html?v:esc(v))+'</dd></div>';};
    var body='<dl class="di-dt-list">'+
      row(t.status,'<span class="di-dt-status di-data-trust-'+statusClass+'">'+esc(statusLabel)+'</span>',true)+
      row(t.source,sourceHtml,true)+
      row(t.market,observation.market||'—')+
      row(t.type,typeDef?typeDef.label:(observation.quoteType||'—'))+
      row(t.frequency,frequency)+
      row(t.observation,fd(observationDate))+
      (detectedPub?row(t.detected,fd(publicationDate))+row(t.officialPub,t.notAvailable):row(t.publication,fd(publicationDate)))+
      row(t.comparability,compLabel)+
      '</dl><div class="di-dt-note"><b>'+esc(t.note)+'</b><p>'+esc(observation.methodology||t.compareNote)+'</p></div><p class="di-dt-id">ID: '+esc(observation.id)+'</p>';
    return '<div class="di-data-trust di-data-trust-'+statusClass+'">'+
      '<button type="button" class="di-dt-open" aria-haspopup="dialog"><span class="di-data-trust-dot"></span>'+esc(t.summary)+'</button>'+
      '<template class="di-dt-body">'+body+'</template></div>';
  }

  function renderHealth(){
    var h=D.DATA_TRUST_HEALTH||{observations:0,warnings:[],errors:[]},lang=S.getLang?S.getLang():'es';
    var labels={
      es:{stReal:'Dato oficial',stPend:'Pendiente',stNc:'No comparable',title:'Salud de los datos',obs:'observaciones documentadas',pending:'fechas pendientes',status:'Estado',ready:'Esquema válido',review:'Revisión requerida',sample:'muestras',verified:'verificadas'},
      en:{stReal:'Official data',stPend:'Pending',stNc:'Not comparable',title:'Data health',obs:'documented observations',pending:'pending dates',status:'Status',ready:'Schema valid',review:'Review required',sample:'samples',verified:'verified'},
      fr:{stReal:'Donnée officielle',stPend:'En attente',stNc:'Non comparable',title:'Santé des données',obs:'observations documentées',pending:'dates en attente',status:'Statut',ready:'Schéma valide',review:'Révision requise',sample:'échantillons',verified:'vérifiées'},
      it:{stReal:'Dato ufficiale',stPend:'In attesa',stNc:'Non comparabile',title:'Salute dei dati',obs:'osservazioni documentate',pending:'date in attesa',status:'Stato',ready:'Schema valido',review:'Revisione richiesta',sample:'campioni',verified:'verificate'}
    };
    var t=labels[lang]||labels.es,ids=Object.keys(D.DATA_TRUST||{}),verified=0,samples=0,notComparable=0;
    for(var i=0;i<ids.length;i++){
      var o=D.DATA_TRUST[ids[i]]||{};
      if(o.status==='verified')verified++;else samples++;
      if(o.comparability==='not_comparable')notComparable++;
    }
    var status=h.errors&&h.errors.length?t.review:t.ready;
    var extra={
      es:{notComparable:'no comparables directos',schema:'esquema',pendingStatus:'pendientes de verificación'},
      en:{notComparable:'not directly comparable',schema:'schema',pendingStatus:'pending verification'},
      fr:{notComparable:'non directement comparables',schema:'schéma',pendingStatus:'en attente de vérification'},
      it:{notComparable:'non direttamente comparabili',schema:'schema',pendingStatus:'in attesa di verifica'}
    }[lang]||{notComparable:'not directly comparable',schema:'schema',pendingStatus:'pending verification'};
    return '<section class="di-data-health" aria-label="'+esc(t.title)+'">'+
      '<div class="di-data-health-head"><div><span class="di-data-health-kicker">'+esc(t.title)+'</span><strong>'+esc(status)+'</strong></div><div class="di-data-state-legend"><span class="di-data-state-chip real">'+esc(t.stReal)+' <b>'+esc(verified)+'</b></span><span class="di-data-state-chip pending">'+esc(t.stPend)+' <b>'+esc(samples)+'</b></span><span class="di-data-state-chip not-comparable">'+esc(t.stNc)+' <b>'+esc(notComparable)+'</b></span></div></div>'+
      '<div class="di-data-health-stats">'+
        '<div><b>'+esc(h.observations)+'</b><span>'+esc(t.obs)+'</span></div>'+
        '<div><b>'+esc(samples)+'</b><span>'+esc(t.sample)+'</span></div>'+
        '<div><b>'+esc(verified)+'</b><span>'+esc(t.verified)+'</span></div>'+
        '<div><b>'+esc(h.pendingDates)+'</b><span>'+esc(t.pending)+'</span></div>'+
      '</div>'+
      '<div class="di-data-health-note">'+esc(notComparable)+' '+esc(extra.notComparable)+'. '+esc(h.pendingDates)+' '+esc(extra.pendingStatus)+'.</div>'+
    '</section>';
  }

  /* Procedencia y metodología de las pestañas informativas (Madera y Vino a granel): cifras puntuales de un organismo oficial, con su fecha.
     Mientras una cifra no tenga canalización automática se dice con claridad; el botón abre la misma ventana que el resto de tarjetas. */
  var FQ={monthly:{es:'Mensual',en:'Monthly',fr:'Mensuelle',it:'Mensile'},daily:{es:'Diaria',en:'Daily',fr:'Quotidienne',it:'Giornaliera'},weekly:{es:'Semanal',en:'Weekly',fr:'Hebdomadaire',it:'Settimanale'},quarterly:{es:'Trimestral',en:'Quarterly',fr:'Trimestrielle',it:'Trimestrale'},annual:{es:'Anual',en:'Annual',fr:'Annuelle',it:'Annuale'}};
  var ST={es:'Cifra puntual de la fecha indicada; no se actualiza sola',en:'One-off figure for the date shown; not updated automatically',fr:'Chiffre ponctuel à la date indiquée ; non mis à jour automatiquement',it:'Cifra puntuale alla data indicata; non si aggiorna da sola'};
  var CP={es:'No directamente comparable',en:'Not directly comparable',fr:'Pas directement comparable',it:'Non direttamente comparabile'};
  function L(a){return{es:a[0],en:a[1],fr:a[2],it:a[3]};}
  var INFO={
    'madera-us':{src:'CME Group',url:'https://www.cmegroup.com/markets/agriculture/lumber-and-softs/lumber/quotes.html',fq:'daily',
      mk:L(['Futuro de madera aserrada de construcción (framing lumber), contrato de vencimiento más próximo','Framing lumber futures, nearest expiry contract','Contrat à terme de bois d’œuvre de construction (framing lumber), échéance la plus proche','Future sul legname da costruzione (framing lumber), scadenza più vicina']),
      ty:L(['Futuro cotizado (mercado de derivados)','Exchange-traded future','Contrat à terme coté','Future quotato']),ob:L(['25 sep 2026','25 Sep 2026','25 sept. 2026','25 set 2026']),
      me:L(['Precio por 1.000 pies tabla (unos 2,36 m³) de madera aserrada, ya cortada. Es la referencia diaria de la construcción en Norteamérica. La cifra de la tarjeta se copió del sitio de CME en esa fecha; CME licencia sus cotizaciones y no las redistribuimos, por eso no guardamos un histórico propio.','Price per 1,000 board feet (about 2.36 m³) of sawn lumber. It is the daily benchmark for North American construction. The figure was copied from the CME site on that date; CME licenses its quotes and we do not redistribute them, so we keep no history of our own.','Prix pour 1 000 pieds-planche (environ 2,36 m³) de bois scié. C’est la référence quotidienne de la construction en Amérique du Nord. Le chiffre a été relevé sur le site du CME à cette date ; le CME concède ses cotations sous licence et nous ne les redistribuons pas, nous ne conservons donc pas d’historique propre.','Prezzo per 1.000 piedi tavola (circa 2,36 m³) di legname segato. È il riferimento giornaliero dell’edilizia nordamericana. La cifra è stata copiata dal sito del CME a quella data; il CME concede le sue quotazioni in licenza e noi non le ridistribuiamo, perciò non conserviamo uno storico proprio.'])},
    'madera-uk':{src:'Forest Research (Reino Unido)',url:'https://www.forestresearch.gov.uk/tools-and-resources/statistics/statistics-by-topic/timber-statistics/timber-price-indices/',fq:'quarterly',
      mk:L(['Índice de precios de venta en pie de coníferas','Standing sales price index, conifers','Indice des prix de vente sur pied, résineux','Indice dei prezzi di vendita in piedi, conifere']),
      ty:L(['Índice oficial de precios medios','Official average price index','Indice officiel de prix moyens','Indice ufficiale dei prezzi medi']),ob:L(['Primer trimestre de 2026 (marzo)','Q1 2026 (March)','1er trimestre 2026 (mars)','1° trimestre 2026 (marzo)']),
      me:L(['Precio de la madera sin talar, todavía en el bosque (no aserrada), en libras por metro cúbico. La variación es frente al mismo trimestre del año anterior.','Price of standing timber, still in the forest (not sawn), in pounds per cubic metre. The change is against the same quarter a year earlier.','Prix du bois sur pied, encore en forêt (non scié), en livres par mètre cube. La variation est mesurée par rapport au même trimestre un an plus tôt.','Prezzo del legname in piedi, ancora nel bosco (non segato), in sterline per metro cubo. La variazione è rispetto allo stesso trimestre dell’anno prima.'])},
    'madera-fr':{src:'France Bois Forêt / ONF',url:'https://franceboisforet.fr/2026/05/26/prix-de-vente-des-bois-sur-pied-en-foret-privee-indicateur-2026/',fq:'annual',
      mk:L(['Precio medio de venta de madera en pie en bosque privado, por especie','Average standing timber sale price in private forests, by species','Prix moyen de vente des bois sur pied en forêt privée, par essence','Prezzo medio di vendita del legname in piedi nei boschi privati, per specie']),
      ty:L(['Media anual de ventas observadas','Annual average of observed sales','Moyenne annuelle des ventes observées','Media annuale delle vendite osservate']),ob:L(['Campaña 2025 (indicador publicado en mayo de 2026)','2025 campaign (indicator published May 2026)','Campagne 2025 (indicateur publié en mai 2026)','Campagna 2025 (indicatore pubblicato a maggio 2026)']),
      me:L(['Media de las ventas de madera en pie en bosques privados franceses, en euros por metro cúbico. Sale una vez al año, por lo que no hay serie corta que dibujar. La variación es frente a 2024.','Average of standing timber sales in French private forests, in euros per cubic metre. Published once a year, so there is no short series to plot. The change is against 2024.','Moyenne des ventes de bois sur pied en forêt privée française, en euros par mètre cube. Publiée une fois par an : pas de série courte à tracer. La variation est mesurée par rapport à 2024.','Media delle vendite di legname in piedi nei boschi privati francesi, in euro per metro cubo. Esce una volta l’anno, quindi non c’è una serie breve da disegnare. La variazione è rispetto al 2024.'])}
  };
  function info(id,lang0){
    var lang=lang0||(S.getLang?S.getLang():'es'),t=I18N[lang]||I18N.es,c=typeof id==='object'?id:INFO[id];if(!c)return'';
    var pick=function(v){return typeof v==='string'?v:(v[lang]||v.es);};
    var OFF={es:'Dato oficial, leído automáticamente',en:'Official data, read automatically',fr:'Donnée officielle, lue automatiquement',it:'Dato ufficiale, letto automaticamente'};
    var row=function(l,v,h){return '<div class="di-dt-row"><dt>'+esc(l)+'</dt><dd>'+(h?v:esc(v))+'</dd></div>';};
    var body='<dl class="di-dt-list">'+
      row(t.status,'<span class="di-dt-status di-data-trust-verified">'+esc(c.st==='official'?(OFF[lang]||OFF.es):(ST[lang]||ST.es))+'</span>',true)+
      row(t.source,'<a href="'+esc(c.url)+'" target="_blank" rel="noopener noreferrer">'+esc(c.src)+'</a>',true)+
      row(t.market,pick(c.mk))+row(t.type,pick(c.ty))+
      row(t.frequency,(FQ[c.fq]||{})[lang]||'—')+row(t.observation,pick(c.ob))+row(t.comparability,CP[lang]||CP.es)+
      '</dl><div class="di-dt-note"><b>'+esc(t.note)+'</b><p>'+esc(pick(c.me))+'</p></div>';
    return '<div class="di-data-trust di-data-trust-verified"><button type="button" class="di-dt-open" aria-haspopup="dialog"><span class="di-data-trust-dot"></span>'+esc(t.summary)+'</button><template class="di-dt-body">'+body+'</template></div>';
  }

  global.DehesaDataTrust={info:info,render:render,frequencyFor:frequencyFor,comparability:comparability ,renderHealth:renderHealth};
})(window);
