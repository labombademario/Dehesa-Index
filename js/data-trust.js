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
    es:{summary:'Ver procedencia y metodología',status:'Estado del dato',sample:'Pendiente de verificación',source:'Fuente',market:'Mercado / referencia',type:'Tipo de cotización',frequency:'Frecuencia',frequencyUnknown:'Pendiente de verificación',observation:'Fecha de observación',notDeclared:'No declarada en el dataset',publication:'Fecha de publicación',comparability:'Comparabilidad',review:'Revisión necesaria',conditional:'Condicional',direct:'Directa',directional:'Direccional',note:'Nota',compareNote:'La comparación depende de que unidad, mercado, base de medición y frecuencia sean equivalentes.'},
    en:{summary:'View provenance & methodology',status:'Data status',sample:'Pending verification',source:'Source',market:'Market / benchmark',type:'Quote type',frequency:'Frequency',frequencyUnknown:'Pending verification',observation:'Observation date',notDeclared:'Not declared in dataset',publication:'Publication date',comparability:'Comparability',review:'Review required',conditional:'Conditional',direct:'Direct',directional:'Directional',note:'Note',compareNote:'Comparison depends on equivalent unit, market, measurement basis and frequency.'},
    fr:{summary:'Voir provenance et méthodologie',status:'Statut de la donnée',sample:'Vérification en attente',source:'Source',market:'Marché / référence',type:'Type de cotation',frequency:'Fréquence',frequencyUnknown:'Vérification en attente',observation:'Date d’observation',notDeclared:'Non déclarée dans le dataset',publication:'Date de publication',comparability:'Comparabilité',review:'Révision nécessaire',conditional:'Conditionnelle',direct:'Directe',directional:'Directionnelle',note:'Note',compareNote:'La comparaison dépend d’une unité, d’un marché, d’une base de mesure et d’une fréquence équivalents.'},
    it:{summary:'Vedi provenienza e metodologia',status:'Stato del dato',sample:'Verifica in corso',source:'Fonte',market:'Mercato / riferimento',type:'Tipo di quotazione',frequency:'Frequenza',frequencyUnknown:'Verifica in corso',observation:'Data di osservazione',notDeclared:'Non dichiarata nel dataset',publication:'Data di pubblicazione',comparability:'Comparabilità',review:'Revisione necessaria',conditional:'Condizionale',direct:'Diretta',directional:'Direzionale',note:'Nota',compareNote:'Il confronto dipende da unità, mercato, base di misurazione e frequenza equivalenti.'}
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
  function render(entry,disp){
    if(!entry||!disp||!disp.quoteType)return'';
    var lang=S.getLang?S.getLang():'es',t=I18N[lang]||I18N.es;
    var region=disp.regionCode||disp.region||disp.quoteType.region||null;
    var productId=entry.catId+'-'+entry.product.nameKey;
    var key=productId+'-'+(region||'');
    var observation=D.DATA_TRUST&&D.DATA_TRUST[key];
    if(!observation){
      var fallbackRegion=region==='uk'?'uk':region==='eu'?'eu':'us';
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
    var observationDate=observation.observationDate||t.notDeclared;
    var publicationDate=observation.publicationDate||t.notDeclared;
    var sourceHtml=observation.sourceUrl
      ? '<a href="'+esc(observation.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(observation.source)+'</a>'
      : esc(observation.source||'—');

    return '<details class="di-data-trust di-data-trust-'+statusClass+'">'+
      '<summary><span class="di-data-trust-dot"></span>'+esc(t.summary)+'<span class="di-data-trust-id">'+esc(observation.id)+'</span></summary>'+
      '<div class="di-data-trust-body">'+
        '<div class="di-data-trust-grid">'+
          '<div><span class="di-data-trust-label">'+esc(t.status)+'</span><strong class="di-data-trust-'+statusClass+'">'+esc(statusLabel)+'</strong></div>'+
          '<div><span class="di-data-trust-label">'+esc(t.source)+'</span><strong>'+sourceHtml+'</strong></div>'+
          '<div><span class="di-data-trust-label">'+esc(t.market)+'</span><strong>'+esc(observation.market||'—')+'</strong></div>'+
          '<div><span class="di-data-trust-label">'+esc(t.type)+'</span><strong>'+esc(typeDef?typeDef.label:(observation.quoteType||'—'))+'</strong></div>'+
          '<div><span class="di-data-trust-label">'+esc(t.frequency)+'</span><strong>'+esc(frequency)+'</strong></div>'+
          '<div><span class="di-data-trust-label">'+esc(t.observation)+'</span><strong>'+esc(observationDate)+'</strong></div>'+
          '<div><span class="di-data-trust-label">'+esc(t.publication)+'</span><strong>'+esc(publicationDate)+'</strong></div>'+
          '<div><span class="di-data-trust-label">'+esc(t.comparability)+'</span><strong>'+esc(compLabel)+'</strong></div>'+
        '</div>'+
        '<div class="di-data-trust-note"><b>'+esc(t.note)+':</b> '+esc(observation.methodology||t.compareNote)+'</div>'+
      '</div></details>';
  }

  function renderHealth(){
    var h=D.DATA_TRUST_HEALTH||{observations:0,warnings:[],errors:[]},lang=S.getLang?S.getLang():'es';
    var labels={
      es:{title:'Salud de los datos',obs:'observaciones documentadas',pending:'fechas pendientes',status:'Estado',ready:'Esquema válido',review:'Revisión requerida',sample:'muestras',verified:'verificadas'},
      en:{title:'Data health',obs:'documented observations',pending:'pending dates',status:'Status',ready:'Schema valid',review:'Review required',sample:'samples',verified:'verified'},
      fr:{title:'Santé des données',obs:'observations documentées',pending:'dates en attente',status:'Statut',ready:'Schéma valide',review:'Révision requise',sample:'échantillons',verified:'vérifiées'},
      it:{title:'Salute dei dati',obs:'osservazioni documentate',pending:'date in attesa',status:'Stato',ready:'Schema valido',review:'Revisione richiesta',sample:'campioni',verified:'verificate'}
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
      '<div class="di-data-health-head"><div><span class="di-data-health-kicker">'+esc(t.title)+'</span><strong>'+esc(status)+'</strong></div><div class="di-data-state-legend"><span class="di-data-state-chip real">REAL <b>'+esc(verified)+'</b></span><span class="di-data-state-chip pending">PENDIENTE <b>'+esc(samples)+'</b></span><span class="di-data-state-chip not-comparable">NO COMPARABLE <b>'+esc(notComparable)+'</b></span></div></div>'+
      '<div class="di-data-health-stats">'+
        '<div><b>'+esc(h.observations)+'</b><span>'+esc(t.obs)+'</span></div>'+
        '<div><b>'+esc(samples)+'</b><span>'+esc(t.sample)+'</span></div>'+
        '<div><b>'+esc(verified)+'</b><span>'+esc(t.verified)+'</span></div>'+
        '<div><b>'+esc(h.pendingDates)+'</b><span>'+esc(t.pending)+'</span></div>'+
      '</div>'+
      '<div class="di-data-health-note">'+esc(notComparable)+' '+esc(extra.notComparable)+'. '+esc(h.pendingDates)+' '+esc(extra.pendingStatus)+'.</div>'+
    '</section>';
  }

  global.DehesaDataTrust={render:render,frequencyFor:frequencyFor,comparability:comparability ,renderHealth:renderHealth};
})(window);
