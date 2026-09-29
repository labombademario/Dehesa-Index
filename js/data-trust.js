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
    es:{summary:'Ver procedencia y metodología',status:'Estado del dato',sample:'Muestra documentada',source:'Fuente',market:'Mercado / referencia',type:'Tipo de cotización',frequency:'Frecuencia',frequencyUnknown:'Pendiente de verificación',observation:'Fecha de observación',notDeclared:'No declarada en el dataset',publication:'Fecha de publicación',comparability:'Comparabilidad',review:'Revisión necesaria',conditional:'Condicional',direct:'Directa',directional:'Direccional',note:'Nota',compareNote:'La comparación depende de que unidad, mercado, base de medición y frecuencia sean equivalentes.'},
    en:{summary:'View provenance & methodology',status:'Data status',sample:'Documented sample',source:'Source',market:'Market / benchmark',type:'Quote type',frequency:'Frequency',frequencyUnknown:'Pending verification',observation:'Observation date',notDeclared:'Not declared in dataset',publication:'Publication date',comparability:'Comparability',review:'Review required',conditional:'Conditional',direct:'Direct',directional:'Directional',note:'Note',compareNote:'Comparison depends on equivalent unit, market, measurement basis and frequency.'},
    fr:{summary:'Voir provenance et méthodologie',status:'Statut de la donnée',sample:'Échantillon documenté',source:'Source',market:'Marché / référence',type:'Type de cotation',frequency:'Fréquence',frequencyUnknown:'Vérification en attente',observation:'Date d’observation',notDeclared:'Non déclarée dans le dataset',publication:'Date de publication',comparability:'Comparabilité',review:'Révision nécessaire',conditional:'Conditionnelle',direct:'Directe',directional:'Directionnelle',note:'Note',compareNote:'La comparaison dépend d’une unité, d’un marché, d’une base de mesure et d’une fréquence équivalents.'},
    it:{summary:'Vedi provenienza e metodologia',status:'Stato del dato',sample:'Campione documentato',source:'Fonte',market:'Mercato / riferimento',type:'Tipo di quotazione',frequency:'Frequenza',frequencyUnknown:'Verifica in corso',observation:'Data di osservazione',notDeclared:'Non dichiarata nel dataset',publication:'Data di pubblicazione',comparability:'Comparabilità',review:'Revisione necessaria',conditional:'Condizionale',direct:'Diretta',directional:'Direzionale',note:'Nota',compareNote:'Il confronto dipende da unità, mercato, base di misurazione e frequenza equivalenti.'}
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
    var qt=(D.QUOTE_TYPES[lang]||D.QUOTE_TYPES.es)[disp.quoteType.type];
    var source=sourceFor(entry,disp.quoteType),freq=frequencyFor(disp.quoteType.market),comp=comparability(entry);
    var sourceHtml=source?'<a href="'+esc(source.url)+'" target="_blank" rel="noopener noreferrer">'+esc(disp.quoteType.market||source.name)+'</a>':esc(disp.quoteType.market||'—');
    var note=entry.product.footnoteKey?((D.FOOT[lang]||D.FOOT.es)[entry.product.footnoteKey]||t.compareNote):t.compareNote;
    return '<details class="di-data-trust"><summary><span class="di-data-trust-dot"></span>'+esc(t.summary)+'</summary><div class="di-data-trust-body"><div class="di-data-trust-grid">'+
      '<div><span class="di-data-trust-label">'+esc(t.status)+'</span><strong class="di-data-trust-sample">'+esc(t.sample)+'</strong></div>'+
      '<div><span class="di-data-trust-label">'+esc(t.source)+'</span><strong>'+sourceHtml+'</strong></div>'+
      '<div><span class="di-data-trust-label">'+esc(t.market)+'</span><strong>'+esc(disp.quoteType.market||'—')+'</strong></div>'+
      '<div><span class="di-data-trust-label">'+esc(t.type)+'</span><strong>'+esc(qt?qt.label:(disp.quoteType.type||'—'))+'</strong></div>'+
      '<div><span class="di-data-trust-label">'+esc(t.frequency)+'</span><strong>'+esc(frequencyLabel(freq,t))+'</strong></div>'+
      '<div><span class="di-data-trust-label">'+esc(t.observation)+'</span><strong>'+esc(t.notDeclared)+'</strong></div>'+
      '<div><span class="di-data-trust-label">'+esc(t.publication)+'</span><strong>'+esc(t.notDeclared)+'</strong></div>'+
      '<div><span class="di-data-trust-label">'+esc(t.comparability)+'</span><strong>'+esc(compLabel(comp,t))+'</strong></div>'+
      '</div><div class="di-data-trust-note"><b>'+esc(t.note)+':</b> '+esc(note)+'</div></div></details>';
  }
  global.DehesaDataTrust={render:render,frequencyFor:frequencyFor,comparability:comparability};
})(window);
