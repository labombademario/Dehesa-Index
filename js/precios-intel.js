/* Dehesa Index — Precios: inteligencia de mercado (Dehesa Market Map,
   Dehesa Agricultural Momentum, Matriz de correlaciones, Ranking de
   volatilidad, Estacionalidad, Ratios agrícolas y Margen del productor).
   Extraído y adaptado del artefacto Design original (Main.dc.html): mismos
   algoritmos (squarify, Pearson, volatilidad anualizada, desviación
   estacional media, ratios), mismo histórico ilustrativo de 5 años
   histórico normalizado disponible en data/history.json; si la cadencia o cobertura
   no es suficiente, el módulo queda explícitamente en estado PENDIENTE.
   Incluye también Local vs. Global (mercado global EE. UU./Europa/Reino
   Unido vs. desglose físico por país UE), construido sobre el histórico
   corto nativo de cada región vía D.buildRegion/D.deriveCountryRaw.
   Vanilla JS / ES5. Se apoya en window.DehesaPreciosCore (expuesto al final
   de js/precios.js) y window.DehesaData. */
(function (global) {
  'use strict';
  var D = global.DehesaData;

  function core() { return global.DehesaPreciosCore; }
  function esc(s) { return core().esc(s); }
  function lang() { return core().lang(); }
  function ui() { return core().ui(); }
  function productName(nameKey) { return core().productName(nameKey); }

  // ---------------------------------------------------------------------
  // Paleta por tema (mismos hex que css/style.css) para los elementos que
  // estos gráficos dibujan directamente en SVG/inline-style.
  // ---------------------------------------------------------------------
  var PALETTE = {
    light: { border: '#E6E0CF', borderStrong: '#DAD3C2', textMuted: '#6B6550', textFaint: '#8A8471', text: '#241F14', surface: '#FFFFFF', surfaceAlt: '#EFEADB', positive: '#2F7D4F', negative: '#B23A34', neutral: '#8A8471' },
    dark: { border: '#3A3D2C', borderStrong: '#484A37', textMuted: '#ABA68F', textFaint: '#8F8A74', text: '#F2EFE3', surface: '#23261B', surfaceAlt: '#2B2E20', positive: '#4FCB77', negative: '#E8776D', neutral: '#8F8A74' }
  };
  function P() { return PALETTE[global.DehesaShared.getTheme()] || PALETTE.light; }

  function hexToRgb(hex) { return { r: parseInt(hex.substr(1, 2), 16), g: parseInt(hex.substr(3, 2), 16), b: parseInt(hex.substr(5, 2), 16) }; }
  function hx2(v) { var s = v.toString(16); return s.length < 2 ? '0' + s : s; }
  function lerpColor(hexA, hexB, t) {
    var ca = hexToRgb(hexA), cb = hexToRgb(hexB);
    return '#' + hx2(Math.round(ca.r + (cb.r - ca.r) * t)) + hx2(Math.round(ca.g + (cb.g - ca.g) * t)) + hx2(Math.round(ca.b + (cb.b - ca.b) * t));
  }
  function relLuminance(hex) {
    var rgb = hexToRgb(hex);
    function chan(c) { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    return 0.2126 * chan(rgb.r) + 0.7152 * chan(rgb.g) + 0.0722 * chan(rgb.b);
  }
  // gamma<1 (solo la matriz de correlación) resalta valores bajos/medios que
  // de otro modo quedarían casi invisibles frente al máximo teórico (±1).
  function tileStyle(pct, maxAbs, gamma) {
    var p = P();
    var tt = maxAbs > 0 ? Math.min(Math.abs(pct) / maxAbs, 1) : 0;
    if (gamma && gamma !== 1) tt = Math.pow(tt, gamma);
    var endpoint = pct >= 0 ? p.positive : p.negative;
    var bg = lerpColor(p.surfaceAlt, endpoint, tt);
    return { bg: bg, textColor: relLuminance(bg) > 0.45 ? '#1C1912' : '#FFFFFF' };
  }
  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function entryByDashKey(dashKey) { return core().PRODUCT_BY_KEY[dashKey.replace('-', ':')]; }
  function regionFor(entry) {
    var Core = core();
    return Core.resolveDisplay(entry, Core.getLocation(), Core.getEuCountry()).region;
  }
  function seedFor(entry) { return core().seedKeyFor(entry, core().defaultRegionFor(entry)); }
  var REAL_HISTORY = {};
  var REAL_HISTORY_READY = false;
  var INTEL20 = null;

  var INTEL20_READY = false;

  // ---------------------------------------------------------------------
  // Agricultural Relationship Engine
  // ---------------------------------------------------------------------
  // Las relaciones se calculan sobre variaciones de las series verificadas,
  // no sobre niveles, para reducir correlaciones espurias por tendencia.
  // El lag está expresado en periodos de la frecuencia común. La "confianza"
  // es una etiqueta de cobertura/fuerza/estabilidad estadística; no es una
  // probabilidad y no representa una predicción.
  var RAW_SERIES = {};
  var RELATIONSHIP_DEFS = [
    { id:'fertilizer-cereals', a:'eurostat_fertiliser_input_index', b:'eurostat_cereals_output_index', maxLag:4, window:20, minPairs:8,
      label:{es:'Fertilizante → cereales',en:'Fertilizer → cereals',fr:'Engrais → céréales',it:'Fertilizzanti → cereali'} },
    { id:'energy-cereals', a:'eurostat_energy_input_index', b:'eurostat_cereals_output_index', maxLag:4, window:20, minPairs:8,
      label:{es:'Energía → cereales',en:'Energy → cereals',fr:'Énergie → céréales',it:'Energia → cereali'} },
    { id:'fertilizer-milk', a:'eurostat_fertiliser_input_index', b:'eurostat_milk_output_index', maxLag:4, window:20, minPairs:8,
      label:{es:'Fertilizante → leche',en:'Fertilizer → milk',fr:'Engrais → lait',it:'Fertilizzanti → latte'} },
    { id:'energy-milk', a:'eurostat_energy_input_index', b:'eurostat_milk_output_index', maxLag:4, window:20, minPairs:8,
      label:{es:'Energía → leche',en:'Energy → milk',fr:'Énergie → lait',it:'Energia → latte'} },
    { id:'milk-feed', a:'eurostat_milk_output_index', b:'feed_input_index', maxLag:4, window:20, minPairs:8,
      label:{es:'Leche → alimentación',en:'Milk → feed',fr:'Lait → alimentation',it:'Latte → mangimi'} },
    { id:'energy-feed', a:'eurostat_energy_input_index', b:'feed_input_index', maxLag:4, window:20, minPairs:8,
      label:{es:'Energía → alimentación',en:'Energy → feed',fr:'Énergie → alimentation',it:'Energia → mangimi'} }
  ];
  var REGIONAL_RELATIONSHIP_DEFS = [
    {region:'eu', id:'fertilizer-cereals', a:'eurostat_fertiliser_input_index', b:'eurostat_cereals_output_index', maxLag:4, window:20, minPairs:8, label:{es:'Fertilizante → cereales',en:'Fertilizer → cereals',fr:'Engrais → céréales',it:'Fertilizzanti → cereali'}},
    {region:'eu', id:'energy-cereals', a:'eurostat_energy_input_index', b:'eurostat_cereals_output_index', maxLag:4, window:20, minPairs:8, label:{es:'Energía → cereales',en:'Energy → cereals',fr:'Énergie → céréales',it:'Energia → cereali'}},
    {region:'eu', id:'fertilizer-milk', a:'eurostat_fertiliser_input_index', b:'eurostat_milk_output_index', maxLag:4, window:20, minPairs:8, label:{es:'Fertilizante → leche',en:'Fertilizer → milk',fr:'Engrais → lait',it:'Fertilizzanti → latte'}},
    {region:'eu', id:'energy-milk', a:'eurostat_energy_input_index', b:'eurostat_milk_output_index', maxLag:4, window:20, minPairs:8, label:{es:'Energía → leche',en:'Energy → milk',fr:'Énergie → lait',it:'Energia → latte'}},
    {region:'us', id:'fertilizer-cereals', a:'us_fertilizer_input_index', b:'us_cereals_output_index', maxLag:4, window:20, minPairs:8, label:{es:'Fertilizante → cereales',en:'Fertilizer → cereals',fr:'Engrais → céréales',it:'Fertilizzanti → cereali'}},
    {region:'us', id:'energy-cereals', a:'us_energy_input_index', b:'us_cereals_output_index', maxLag:4, window:20, minPairs:8, label:{es:'Energía → cereales',en:'Energy → cereals',fr:'Énergie → céréales',it:'Energia → cereali'}},
    {region:'us', id:'fertilizer-milk', a:'us_fertilizer_input_index', b:'us_milk_output_index', maxLag:4, window:20, minPairs:8, label:{es:'Fertilizante → leche',en:'Fertilizer → milk',fr:'Engrais → lait',it:'Fertilizzanti → latte'}},
    {region:'us', id:'energy-milk', a:'us_energy_input_index', b:'us_milk_output_index', maxLag:4, window:20, minPairs:8, label:{es:'Energía → leche',en:'Energy → milk',fr:'Énergie → lait',it:'Energia → latte'}},
    {region:'uk', id:'fertilizer-cereals', a:'uk_fertilizer_input_index', b:'uk_cereals_output_index', maxLag:4, window:20, minPairs:8, label:{es:'Fertilizante → cereales',en:'Fertilizer → cereals',fr:'Engrais → céréales',it:'Fertilizzanti → cereali'}},
    {region:'uk', id:'energy-cereals', a:'uk_energy_input_index', b:'uk_cereals_output_index', maxLag:4, window:20, minPairs:8, label:{es:'Energía → cereales',en:'Energy → cereals',fr:'Énergie → céréales',it:'Energia → cereali'}},
    {region:'uk', id:'fertilizer-milk', a:'uk_fertilizer_input_index', b:'uk_milk_output_index', maxLag:4, window:20, minPairs:8, label:{es:'Fertilizante → leche',en:'Fertilizer → milk',fr:'Engrais → lait',it:'Fertilizzanti → latte'}},
    {region:'uk', id:'energy-milk', a:'uk_energy_input_index', b:'uk_milk_output_index', maxLag:4, window:20, minPairs:8, label:{es:'Energía → leche',en:'Energy → milk',fr:'Énergie → lait',it:'Energia → latte'}}
  ];
  var RELATIONSHIP_DEFS = REGIONAL_RELATIONSHIP_DEFS.filter(function(d){return d.region==='eu';});
  var RELATIONSHIP_RESULTS = [];
  var TRANSMISSION_DEFS = [
    {region:'eu',id:'fertilizer-cereals-alert',shock:'eurostat_fertiliser_input_index',relationship:'fertilizer-cereals',threshold:5,channel:'input_cost',affected:'eurostat_cereals_output_index',label:{es:'Shock de fertilizante → cereales',en:'Fertilizer shock → cereals',fr:'Choc des engrais → céréales',it:'Shock dei fertilizzanti → cereali'}},
    {region:'eu',id:'energy-cereals-alert',shock:'eurostat_energy_input_index',relationship:'energy-cereals',threshold:5,channel:'input_cost',affected:'eurostat_cereals_output_index',label:{es:'Shock energético → cereales',en:'Energy shock → cereals',fr:'Choc énergétique → céréales',it:'Shock energetico → cereali'}},
    {region:'eu',id:'fertilizer-milk-alert',shock:'eurostat_fertiliser_input_index',relationship:'fertilizer-milk',threshold:5,channel:'input_cost',affected:'eurostat_milk_output_index',label:{es:'Shock de fertilizante → leche',en:'Fertilizer shock → milk',fr:'Choc des engrais → lait',it:'Shock dei fertilizzanti → latte'}},
    {region:'eu',id:'energy-milk-alert',shock:'eurostat_energy_input_index',relationship:'energy-milk',threshold:5,channel:'input_cost',affected:'eurostat_milk_output_index',label:{es:'Shock energético → leche',en:'Energy shock → milk',fr:'Choc énergétique → lait',it:'Shock energetico → latte'}}
  ];
  var TRANSMISSION_ALERTS = [];

  function latestShock(product, region) {
    var rows=RAW_SERIES[product+'|'+(region||'eu')]||[];
    if(rows.length<2) return null;
    var last=rows[rows.length-1], prev=rows[rows.length-2];
    if(!isFinite(last.value)||!isFinite(prev.value)||prev.value===0) return null;
    return {product:product,date:last.date,value:last.value,changePct:((last.value-prev.value)/prev.value)*100,frequency:last.frequency};
  }
  function buildTransmissionAlerts() {
    buildRelationshipEngine();
    var rels=RELATIONSHIP_RESULTS.filter(function(r){return r.region===activeRegion();}), byId={};
    rels.forEach(function(r){byId[r.id]=r;});
    TRANSMISSION_ALERTS=[];
    activeTransmissionDefs().forEach(function(def){
      var shock=latestShock(def.shock, def.region), rel=byId[def.relationship];
      if(!shock||!rel||rel.status!=='ready'||Math.abs(shock.changePct)<def.threshold) return;
      TRANSMISSION_ALERTS.push({
        id:def.id,label:def.label[lang()]||def.label.es,status:'watch',
        severity:Math.abs(shock.changePct)>=10?'elevated':'watch',
        shock:shock,relationship:rel,channel:def.channel,affected:def.affected,
        direction:(shock.changePct>0?'positive':'negative')===rel.direction?'aligned':'opposed',
        message:(def.label[lang()]||def.label.es)+' supera el umbral de '+def.threshold+'% en el último periodo. La relación histórica compatible tiene un lag de '+rel.lagPeriods+' '+(rel.frequency==='quarterly'?(rel.lagPeriods===1?'trimestre':'trimestres'):(rel.lagPeriods===1?'mes':'meses'))+' y confianza '+rel.confidence+'. Esto activa una alerta de transmisión observada, no una predicción.'
      });
    });
    return TRANSMISSION_ALERTS;
  }

  function relationshipSeriesKey(o) {
    return String(o.product || '') + '|' + String(o.region || '');
  }
  function buildRawSeries(observations) {
    RAW_SERIES = {};
    (observations || []).forEach(function(o) {
      if (o.status && o.status !== 'verified') return;
      if (o.comparability === 'not_comparable') return;
      var key = relationshipSeriesKey(o);
      if (!RAW_SERIES[key]) RAW_SERIES[key] = [];
      RAW_SERIES[key].push({
        date:String(o.observationDate),
        value:Number(o.value),
        frequency:String(o.frequency || ''),
        unit:String(o.unit || ''),
        currency:String(o.currency || ''),
        comparability:String(o.comparability || ''),
        sourceId:String(o.sourceId || '')
      });
    });
    Object.keys(RAW_SERIES).forEach(function(k) {
      RAW_SERIES[k].sort(function(a,b){ return a.date.localeCompare(b.date); });
    });
  }
  function periodStepMs(frequency) {
    return frequency === 'monthly' ? 28 * 86400000 : (frequency === 'quarterly' ? 80 * 86400000 : 0);
  }
  function addPeriods(iso, frequency, periods) {
    var d = new Date(iso + 'T00:00:00Z');
    if (isNaN(d.getTime())) return null;
    if (frequency === 'monthly') d.setUTCMonth(d.getUTCMonth() + periods);
    else if (frequency === 'quarterly') d.setUTCMonth(d.getUTCMonth() + periods * 3);
    else return null;
    return d.toISOString().slice(0,10);
  }
  function returnSeries(rows) {
    var out = [];
    for (var i=1;i<rows.length;i++) {
      var prev=Number(rows[i-1].value), cur=Number(rows[i].value);
      if (!isFinite(prev)||!isFinite(cur)||prev===0) continue;
      out.push({date:rows[i].date, value:(cur-prev)/prev});
    }
    return out;
  }
  function correlation(a,b) {
    var n=Math.min(a.length,b.length);
    if(n<3) return null;
    var ma=0,mb=0,i;
    for(i=0;i<n;i++){ma+=a[i];mb+=b[i];}
    ma/=n; mb/=n;
    var num=0,da=0,db=0;
    for(i=0;i<n;i++){var xa=a[i]-ma,xb=b[i]-mb;num+=xa*xb;da+=xa*xa;db+=xb*xb;}
    return da&&db ? num/Math.sqrt(da*db) : null;
  }
  function pairedReturns(aRows,bRows,lag) {
    if(!aRows.length||!bRows.length) return [];
    var a=returnSeries(aRows), b=returnSeries(bRows), bByDate={};
    b.forEach(function(x){bByDate[x.date]=x.value;});
    var out=[];
    a.forEach(function(x){
      var target=addPeriods(x.date,aRows[0].frequency,lag);
      if(target!==null && bByDate.hasOwnProperty(target)) out.push({date:x.date,a:x.value,b:bByDate[target]});
    });
    return out;
  }
  function confidenceFor(n,r,stability) {
    var ar=Math.abs(r);
    if(n>=20 && ar>=0.70 && stability>=0.75) return 'high';
    if(n>=12 && ar>=0.45 && stability>=0.60) return 'medium';
    if(n>=8 && ar>=0.25) return 'low';
    return null;
  }
  function buildRelationship(def) {
    var region=def.region||'eu';
    var aRows=RAW_SERIES[def.a+'|'+region]||[], bRows=RAW_SERIES[def.b+'|'+region]||[];
    if(!aRows.length||!bRows.length) return {id:def.id,label:def.label[lang()]||def.label.es,status:'pending',reason:'missing_series'};
    var frequency=aRows[0].frequency;
    if(!frequency || frequency!==bRows[0].frequency) return {id:def.id,label:def.label[lang()]||def.label.es,status:'pending',reason:'frequency_mismatch'};
    var candidates=[], lagSigns=[];
    for(var lag=0;lag<=def.maxLag;lag++){
      var pairs=pairedReturns(aRows,bRows,lag);
      if(pairs.length<def.minPairs) continue;
      var use=pairs.slice(Math.max(0,pairs.length-def.window));
      var r=correlation(use.map(function(x){return x.a;}),use.map(function(x){return x.b;}));
      if(r===null) continue;
      candidates.push({lag:lag,pairs:use,r:r});
      lagSigns.push(r===0?0:(r>0?1:-1));
    }
    if(!candidates.length) return {id:def.id,label:def.label[lang()]||def.label.es,status:'pending',reason:'insufficient_coverage'};
    var best=candidates[0];
    candidates.forEach(function(c){
      if(Math.abs(c.r)>Math.abs(best.r) || (Math.abs(c.r)===Math.abs(best.r)&&c.lag<best.lag)) best=c;
    });
    var nonZero=lagSigns.filter(function(x){return x!==0;});
    var dominant=best.r>0?1:(best.r<0?-1:0);
    var stable=nonZero.length ? nonZero.filter(function(x){return x===dominant;}).length/nonZero.length : 0;
    var confidence=confidenceFor(best.pairs.length,best.r,stable);
    if(!confidence) return {id:def.id,label:def.label[lang()]||def.label.es,status:'pending',reason:'weak_relationship',sampleSize:best.pairs.length,correlationReturns:best.r,lagPeriods:best.lag,stability:stable};
    var unitLabel=frequency==='quarterly' ? (best.pairs.length+' quarters') : (best.pairs.length+' months');
    var direction=best.r>0?'positive':(best.r<0?'negative':'flat');
    return {
      id:def.id,label:def.label[lang()]||def.label.es,status:'ready',confidence:confidence,
      seriesA:{product:def.a,region:region},seriesB:{product:def.b,region:region},region:region,
      frequency:frequency,lagPeriods:best.lag,window:unitLabel,windowPeriods:best.pairs.length,
      sampleSize:best.pairs.length,correlationReturns:best.r,direction:direction,stability:stable,
      coverageStart:best.pairs.length?best.pairs[0].date:null,
      coverageEnd:best.pairs.length?best.pairs[best.pairs.length-1].date:null,
      interpretation:(def.label[lang()]||def.label.es)+' presenta una asociación '+direction+' en cambios de la serie con un rezago de '+best.lag+' '+(frequency==='quarterly'?'trimestre(s)':'mes(es)')+'. La señal es descriptiva y no implica causalidad ni predicción.'
    };
  }
  function buildRelationshipEngine() {
    RELATIONSHIP_RESULTS=REGIONAL_RELATIONSHIP_DEFS.map(buildRelationship);
    return RELATIONSHIP_RESULTS;
  }
  function activeRegion() {
    try {
      return (global.DehesaPreciosCore && global.DehesaPreciosCore.getLocation) ? global.DehesaPreciosCore.getLocation() : 'us';
    } catch (e) { return 'us'; }
  }
  function activeRelationshipResults() {
    var region=activeRegion(), out={};
    RELATIONSHIP_RESULTS.filter(function(r){return r.region===region;}).forEach(function(r){
      out[r.id]=Object.assign({},r,{id:r.id});
    });
    return out;
  }
  function activeTransmissionDefs() {
    var region=activeRegion();
    return TRANSMISSION_DEFS.filter(function(d){return d.region===region;});
  }
  function realObservationsFor(entry) {
    var key = entry.catId + '-' + entry.nameKey;
    return REAL_HISTORY[key] || [];
  }
  function rangePctChange(entry, days) {
    var rows = realObservationsFor(entry);
    if (rows.length < 2) return null;
    var last = rows[rows.length - 1];
    var lastTime = new Date(last.observationDate).getTime();
    var cutoff = lastTime - days * 86400000;
    var first = null;
    for (var i = rows.length - 1; i >= 0; i--) {
      if (new Date(rows[i].observationDate).getTime() <= cutoff) { first = rows[i]; break; }
    }
    if (!first || !isFinite(Number(first.value)) || !isFinite(Number(last.value))) return null;
    return Number(first.value) ? ((Number(last.value) - Number(first.value)) / Number(first.value)) * 100 : null;
  }
  function loadRealHistory(done) {
    function finish() {
      done();
      try { document.dispatchEvent(new CustomEvent('dehesa:intel-ready')); } catch (e) {}
    }
    if (REAL_HISTORY_READY) { finish(); return; }
    fetch('data/history.json').then(function(r){ if(!r.ok) throw Error('history'); return r.json(); }).then(function(d){
      buildRawSeries(d.observations || []);
      REAL_HISTORY = {};
      (d.observations || []).forEach(function(o){
        var key = 'cereales-' + o.product;
        var dashKey = key;
        if (!REAL_HISTORY[dashKey]) REAL_HISTORY[dashKey] = [];
        REAL_HISTORY[dashKey].push(o);
      });
      Object.keys(REAL_HISTORY).forEach(function(k){ REAL_HISTORY[k].sort(function(a,b){return String(a.observationDate).localeCompare(String(b.observationDate));}); });
      REAL_HISTORY_READY = true;
      buildRelationshipEngine();
      fetch('data/intelligence.json').then(function(r){ if(!r.ok) throw Error('intelligence'); return r.json(); }).then(function(d){
        INTEL20=d; INTEL20_READY=true; finish();
      }).catch(function(){ INTEL20={series:[]}; INTEL20_READY=true; finish(); });
    }).catch(function(){ REAL_HISTORY_READY = true; RELATIONSHIP_RESULTS=REGIONAL_RELATIONSHIP_DEFS.map(function(d){return {id:d.id,region:d.region,label:d.label[lang()]||d.label.es,status:'pending',reason:'history_unavailable'};}); INTEL20={series:[]}; INTEL20_READY=true; finish(); });
  }

  // ---------------------------------------------------------------------
  // Dehesa Market Map (treemap squarified, Bruls/Huizing/van Wijk 1999)
  // ---------------------------------------------------------------------
  // Agrupación por familia (clave catId-nameKey). Sin ponderaciones inventadas:
  // todos los cuadros tienen el mismo tamaño; solo se dibujan productos con dato verificado.
  var MAP_GROUP = {
    'cereales-maiz': 'cereales', 'cereales-trigo': 'cereales', 'cereales-arroz': 'cereales', 'cereales-cebada': 'cereales',
    'cereales-avena': 'cereales', 'cereales-centeno': 'cereales', 'cereales-sorgo': 'cereales', 'cereales-colza': 'cereales',
    'lacteos-leche': 'lacteos', 'lacteos-mantequilla': 'lacteos', 'lacteos-leche_polvo': 'lacteos',
    'ganado-vaca': 'ganaderia', 'ganado-cabra': 'ganaderia', 'porcino-cerdo': 'ganaderia', 'ovino-cordero': 'ganaderia',
    'avicultura-huevos': 'ganaderia', 'avicultura-pollo': 'ganaderia',
    'pienso-pienso': 'pienso', 'pienso-harina_soja': 'pienso',
    'fertilizantes-urea': 'fertilizantes', 'fertilizantes-dap': 'fertilizantes', 'fertilizantes-potasa': 'fertilizantes',
    'azucar-azucar': 'azucar', 'aceite-oliva': 'aceite', 'energia-diesel': 'energia'
  };
  var MAP_GROUP_ORDER = ['cereales', 'ganaderia', 'lacteos', 'pienso', 'fertilizantes', 'azucar', 'aceite', 'energia'];

  // Variación del último dato frente al de ~1 mes antes, con fechas reales
  function mapChange(pts, days) {
    if (!pts || pts.length < 2) return null;
    var last = pts[pts.length - 1], cutoff = last.ts - (days || 27) * 86400000, ref = null;
    for (var i = pts.length - 2; i >= 0; i--) { if (pts[i].ts <= cutoff) { ref = pts[i]; break; } }
    if (!ref || !ref.value) return null;
    // un dato de hace más de 4 meses no es "actual"
    if (Date.now() - last.ts > 120 * 86400000) return null;
    return ((last.value - ref.value) / ref.value) * 100;
  }
  function sparkSvg(pts, color) {
    var v = pts.slice(-26).map(function (p) { return p.value; });
    if (v.length < 2) return '';
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), W = 100, H = 26, rng = mx - mn || 1;
    var d = v.map(function (y, i) { return (i ? 'L' : 'M') + (i / (v.length - 1) * W).toFixed(1) + ' ' + (H - 2 - (y - mn) / rng * (H - 4)).toFixed(1); }).join('');
    return '<svg class="di-map-spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>';
  }

  function buildMarketMap() {
    var Core = core(), t = ui(), byGroup = {}, maxAbs = 0, items = [];
    Core.PRODUCTS.forEach(function (e) {
      var key = e.catId + '-' + e.nameKey, g = MAP_GROUP[key];
      if (!g || !Core.mapInfo) return;
      var info = Core.mapInfo(e);
      if (!info || !info.pts) return;
      var chg = mapChange(info.pts);
      if (chg !== null && Math.abs(chg) > maxAbs) maxAbs = Math.abs(chg);
      items.push({ key: key, g: g, entry: e, info: info, chg: chg });
    });
    items.forEach(function (it) { (byGroup[it.g] = byGroup[it.g] || []).push(it); });
    return MAP_GROUP_ORDER.filter(function (g) { return byGroup[g]; }).map(function (g) {
      return {
        id: g, label: t['mapGroup' + capitalize(g)],
        products: byGroup[g].map(function (it) {
          var name = productName(it.entry.nameKey);
          var style = it.chg === null ? { bg: P().surfaceAlt, textColor: P().textFaint || '#5b5a52' } : tileStyle(it.chg, maxAbs);
          var changeLabel = it.chg === null ? '—' : D.fmtChange(it.chg);
          return { key: it.key, name: name, price: it.info.price, unit: it.info.unit, changeLabel: changeLabel, bg: style.bg, textColor: style.textColor,
            spark: sparkSvg(it.info.pts, style.textColor), tileTitle: name + ' · ' + it.info.price + ' ' + it.info.unit + ' · ' + changeLabel + (it.info.date ? ' · ' + it.info.date : '') };
        })
      };
    });
  }

  function intelPendingHtml(title, message, id) {
    return '<div class="di-intel-section di-intel-pending" id="' + id + '">' +
      '<div class="di-intel-head"><h2>' + esc(title) + '</h2><p>' + esc(message) + '</p><span class="di-intel-state pending">PENDIENTE</span></div>' +
    '</div>';
  }

  function renderMarketMapHtml() {
    var t = ui();
    var groups = buildMarketMap();
    if (!groups.length) return intelPendingHtml(t.mapTitle, t.mapEmpty || 'Aún no hay productos con dato verificado en este mercado.', 'di-intel-map');
    var groupsHtml = groups.map(function (g) {
      var tilesHtml = g.products.map(function (p) {
        return '<button type="button" class="di-map-tile" data-open="' + p.key + '" title="' + esc(p.tileTitle) + '" style="background:' + p.bg + ';color:' + p.textColor + ';">' +
          '<span class="di-map-tile-name">' + esc(p.name) + '</span>' +
          '<span class="di-map-tile-change">' + esc(p.changeLabel) + '</span>' +
          p.spark +
          '<span class="di-map-tile-price">' + esc(p.price) + ' <small>' + esc(p.unit) + '</small></span>' +
          '</button>';
      }).join('');
      return '<div class="di-map-group" style="flex:' + g.products.length + ' 1 ' + (g.products.length * 156) + 'px;"><div class="di-map-group-label">' + esc(g.label) + '</div><div class="di-map-grid">' + tilesHtml + '</div></div>';
    }).join('');
    return (
      '<div class="di-intel-section" id="di-intel-map">' +
        '<div class="di-intel-head"><h2>' + esc(t.mapTitle) + '</h2><p>' + esc(t.mapIntro) + '</p></div>' +
        '<div class="di-map-wrap">' + groupsHtml + '</div>' +
        '<div class="di-intel-disclaimer">' + esc(t.mapDisclaimer) + '</div>' +
      '</div>'
    );
  }

  // ---------------------------------------------------------------------
  // Dehesa Agricultural Momentum (scatter 3M vs 1W)
  // ---------------------------------------------------------------------
  var MOMENTUM_CANVAS_W = 700, MOMENTUM_CANVAS_H = 420;
  var MOMENTUM_MARGIN_LEFT = 50, MOMENTUM_MARGIN_RIGHT = 16, MOMENTUM_MARGIN_TOP = 18, MOMENTUM_MARGIN_BOTTOM = 42;
  var MOMENTUM_GROUP_COLORS = {
    cereales: '#C99A2E', ganaderia: '#B15E3B', lacteos: '#3B6EA8', pienso: '#9C8552',
    fertilizantes: '#7B5EA7', azucar: '#C06B92', aceite: '#A69026', energia: '#5C7080'
  };
  function niceStep(rawStep) {
    if (!(rawStep > 0)) return 1;
    var exp = Math.floor(Math.log(rawStep) / Math.LN10);
    var base = Math.pow(10, exp);
    var frac = rawStep / base;
    var niceFrac = frac <= 1 ? 1 : (frac <= 2 ? 2 : (frac <= 5 ? 5 : 10));
    return niceFrac * base;
  }
  function niceTicks(maxAbsData, halfCountTarget) {
    var padded = ((maxAbsData || 0) * 1.15) || 1;
    var step = niceStep(padded / halfCountTarget);
    var halfCount = Math.max(1, Math.ceil((padded - 1e-9) / step));
    var ticks = [];
    for (var i = -halfCount; i <= halfCount; i++) ticks.push(Math.round((i * step) * 1000) / 1000);
    return { step: step, ticks: ticks, domain: halfCount * step };
  }
  function fmtTick(v) {
    var sign = v > 0 ? '+' : (v < 0 ? '−' : '');
    return sign + (Math.round(Math.abs(v) * 100) / 100) + '%';
  }

  function buildMomentum() {
    var Core = core();
    var raw = Core.PRODUCTS.map(function (e) {
      var key = e.catId + '-' + e.nameKey;
      var info = Core.mapInfo ? Core.mapInfo(e) : null;
      if (!info || !info.pts) return null;
      var x = mapChange(info.pts, 88), y = mapChange(info.pts, 27);
      return x === null || y === null ? null : {
        key: key, name: productName(e.nameKey), group: MAP_GROUP[key] || 'otros', x: x, y: y
      };
    });
    raw = raw.filter(function(p){ return !!p; });
    var maxAbsX = Math.max.apply(null, raw.map(function (p) { return Math.abs(p.x); })) || 0;
    var maxAbsY = Math.max.apply(null, raw.map(function (p) { return Math.abs(p.y); })) || 0;
    var ticksX = niceTicks(maxAbsX, 3), ticksY = niceTicks(maxAbsY, 3);
    var domainX = ticksX.domain, domainY = ticksY.domain;
    var plotX = MOMENTUM_MARGIN_LEFT, plotY = MOMENTUM_MARGIN_TOP;
    var plotW = MOMENTUM_CANVAS_W - MOMENTUM_MARGIN_LEFT - MOMENTUM_MARGIN_RIGHT;
    var plotH = MOMENTUM_CANVAS_H - MOMENTUM_MARGIN_TOP - MOMENTUM_MARGIN_BOTTOM;
    var plotRight = plotX + plotW, plotBottom = plotY + plotH;
    var originX = plotX + plotW / 2, originY = plotY + plotH / 2;
    function toPx(x) { return plotX + ((x + domainX) / (2 * domainX)) * plotW; }
    function toPy(y) { return plotBottom - ((y + domainY) / (2 * domainY)) * plotH; }
    var points = raw.map(function (p) {
      var px = toPx(p.x), py = toPy(p.y);
      var nearRightEdge = px > plotRight - plotW * 0.15;
      return {
        key: p.key, name: p.name, color: MOMENTUM_GROUP_COLORS[p.group] || P().textFaint,
        tileTitle: p.name + ' · 3M ' + D.fmtChange(p.x) + ' · 1M ' + D.fmtChange(p.y),
        cx: px, cy: py,
        labelX: nearRightEdge ? px - 8 : px + 8,
        labelY: Math.max(plotY + 10, Math.min(plotBottom - 4, py + 4)),
        labelAnchor: nearRightEdge ? 'end' : 'start'
      };
    });
    // Evita etiquetas superpuestas cuando varios productos caen muy cerca
    // (frecuente cerca del origen): pase simple de separación vertical,
    // procesando de izquierda a derecha y desplazando hacia arriba/abajo
    // en pasos alternos hasta no chocar con ninguna etiqueta ya colocada.
    var byX = points.slice().sort(function (a, b) { return a.cx - b.cx; });
    var placedLabels = [];
    byX.forEach(function (pt) {
      var w = pt.name.length * 5.2 + 6, h = 11;
      var baseY = pt.cy + 4;
      var x1 = pt.labelAnchor === 'end' ? pt.labelX - w : pt.labelX;
      var x2 = x1 + w;
      var y = Math.max(plotY + 10, Math.min(plotBottom - 4, baseY));
      for (var tries = 0; tries < 8; tries++) {
        var y1 = y - h + 2, y2 = y + 2;
        var collide = placedLabels.some(function (b) { return x1 < b.x2 && x2 > b.x1 && y1 < b.y2 && y2 > b.y1; });
        if (!collide) break;
        var dir = (tries % 2 === 0) ? 1 : -1;
        var mag = Math.ceil((tries + 1) / 2) * 11;
        y = Math.max(plotY + 10, Math.min(plotBottom - 4, baseY + dir * mag));
      }
      pt.labelY = y;
      placedLabels.push({ x1: x1, x2: x2, y1: y - h + 2, y2: y + 2 });
    });
    var xGrid = ticksX.ticks.filter(function (v) { return v !== 0; }).map(function (v) { return { x: toPx(v), label: fmtTick(v) }; });
    var yGrid = ticksY.ticks.filter(function (v) { return v !== 0; }).map(function (v) { return { y: toPy(v), label: fmtTick(v) }; });
    var present = {}; raw.forEach(function (r) { present[r.group] = 1; });
    var legend = MAP_GROUP_ORDER.filter(function (g) { return present[g]; }).map(function (g) { return { id: g, color: MOMENTUM_GROUP_COLORS[g], label: ui()['mapGroup' + capitalize(g)] }; });
    return {
      plotX: plotX, plotY: plotY, plotW: plotW, plotH: plotH, plotRight: plotRight, plotBottom: plotBottom,
      originX: originX, originY: originY, xGrid: xGrid, yGrid: yGrid, points: points, legend: legend
    };
  }

  function renderMomentumHtml() {
    var t = ui();
    var p = P();
    var m = buildMomentum();
    if (!m.points.length) return intelPendingHtml(t.momentumTitle, t.momentumEmpty || 'Aún no hay productos con al menos tres meses de dato verificado en este mercado.', 'di-intel-momentum');
    var gridX = m.xGrid.map(function (g) {
      return '<line x1="' + g.x + '" y1="' + m.plotY + '" x2="' + g.x + '" y2="' + m.plotBottom + '" stroke="' + p.border + '" stroke-width="1"/>' +
        '<text x="' + g.x + '" y="' + (m.plotBottom + 16) + '" font-size="9.5" text-anchor="middle" fill="' + p.textMuted + '">' + g.label + '</text>';
    }).join('');
    var gridY = m.yGrid.map(function (g) {
      return '<line x1="' + m.plotX + '" y1="' + g.y + '" x2="' + m.plotRight + '" y2="' + g.y + '" stroke="' + p.border + '" stroke-width="1"/>' +
        '<text x="' + (m.plotX - 6) + '" y="' + (g.y + 3) + '" font-size="9.5" text-anchor="end" fill="' + p.textMuted + '">' + g.label + '</text>';
    }).join('');
    var pointsHtml = m.points.map(function (pt) {
      return '<g class="di-momentum-point" data-open="' + pt.key + '" style="cursor:pointer;">' +
        '<circle cx="' + pt.cx + '" cy="' + pt.cy + '" r="5.5" fill="' + pt.color + '" stroke="' + p.surface + '" stroke-width="1.5"><title>' + pt.tileTitle + '</title></circle>' +
        '<text x="' + pt.labelX + '" y="' + pt.labelY + '" font-size="9" text-anchor="' + pt.labelAnchor + '" fill="' + p.text + '" style="pointer-events:none;">' + pt.name + '</text>' +
      '</g>';
    }).join('');
    var quadFontSize = 9.5;
    var quadrants =
      '<text x="' + (m.plotRight - 8) + '" y="' + (m.plotY + 14) + '" font-size="' + quadFontSize + '" font-weight="700" text-anchor="end" fill="' + p.textFaint + '">' + esc(t.momentumQuadrantSS) + '</text>' +
      '<text x="' + (m.plotRight - 8) + '" y="' + (m.plotBottom - 8) + '" font-size="' + quadFontSize + '" font-weight="700" text-anchor="end" fill="' + p.textFaint + '">' + esc(t.momentumQuadrantSW) + '</text>' +
      '<text x="' + (m.plotX + 8) + '" y="' + (m.plotY + 14) + '" font-size="' + quadFontSize + '" font-weight="700" text-anchor="start" fill="' + p.textFaint + '">' + esc(t.momentumQuadrantWS) + '</text>' +
      '<text x="' + (m.plotX + 8) + '" y="' + (m.plotBottom - 8) + '" font-size="' + quadFontSize + '" font-weight="700" text-anchor="start" fill="' + p.textFaint + '">' + esc(t.momentumQuadrantWW) + '</text>';
    var axisTitles =
      '<text x="' + (m.plotX + m.plotW / 2) + '" y="' + (MOMENTUM_CANVAS_H - 6) + '" font-size="10.5" text-anchor="middle" fill="' + p.textMuted + '">' + esc(t.momentumAxisXTitle) + '</text>' +
      '<text x="14" y="' + (m.plotY + m.plotH / 2) + '" font-size="10.5" text-anchor="middle" fill="' + p.textMuted + '" transform="rotate(-90 14 ' + (m.plotY + m.plotH / 2) + ')">' + esc(t.momentumAxisYTitle) + '</text>';
    var legendHtml = m.legend.map(function (l) { return '<span><i style="background:' + l.color + ';"></i>' + esc(l.label) + '</span>'; }).join('');
    var svg =
      '<svg viewBox="0 0 ' + MOMENTUM_CANVAS_W + ' ' + MOMENTUM_CANVAS_H + '">' +
        '<rect x="' + m.plotX + '" y="' + m.plotY + '" width="' + m.plotW + '" height="' + m.plotH + '" fill="none" stroke="' + p.borderStrong + '"/>' +
        gridX + gridY +
        '<line x1="' + m.originX + '" y1="' + m.plotY + '" x2="' + m.originX + '" y2="' + m.plotBottom + '" stroke="' + p.borderStrong + '" stroke-width="1.5"/>' +
        '<line x1="' + m.plotX + '" y1="' + m.originY + '" x2="' + m.plotRight + '" y2="' + m.originY + '" stroke="' + p.borderStrong + '" stroke-width="1.5"/>' +
        quadrants + axisTitles + pointsHtml +
      '</svg>';
    return (
      '<div class="di-intel-section" id="di-intel-momentum">' +
        '<div class="di-intel-head"><h2>' + esc(t.momentumTitle) + '</h2><p>' + esc(t.momentumIntro) + '</p></div>' +
        '<div class="di-chart-svg-wrap">' + svg + '</div>' +
        '<div class="di-momentum-legend">' + legendHtml + '</div>' +
        '<div class="di-intel-disclaimer">' + esc(t.momentumDisclaimer) + '</div>' +
      '</div>'
    );
  }

  // ---------------------------------------------------------------------
  // Matriz de correlaciones + Ranking de volatilidad (retornos diarios,
  // último año, mismo histórico ilustrativo de 5 años)
  // ---------------------------------------------------------------------
  var CORR_WINDOW_DAYS = 365;
  var CORR_COLOR_GAMMA = 0.35;
  function dailyReturns(history, days) {
    var slice = history.slice(history.length - days);
    var rets = [];
    for (var i = 1; i < slice.length; i++) { var prev = slice[i - 1]; if (prev) rets.push((slice[i] - prev) / prev); }
    return rets;
  }
  function stdDev(arr) {
    if (!arr.length) return 0;
    var mean = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
    var variance = arr.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / arr.length;
    return Math.sqrt(variance);
  }
  function pearson(a, b) {
    var n = Math.min(a.length, b.length);
    if (n < 2) return 0;
    var meanA = 0, meanB = 0;
    for (var i = 0; i < n; i++) { meanA += a[i]; meanB += b[i]; }
    meanA /= n; meanB /= n;
    var num = 0, denA = 0, denB = 0;
    for (var j = 0; j < n; j++) { var da = a[j] - meanA, db = b[j] - meanB; num += da * db; denA += da * da; denB += db * db; }
    var den = Math.sqrt(denA * denB);
    return den ? (num / den) : 0;
  }
  function fmtCorr(r) { var sign = r > 0 ? '+' : (r < 0 ? '−' : ''); return sign + Math.abs(r).toFixed(2); }

  // Retornos mensuales reales: último dato de cada mes, solo meses consecutivos (sin rellenar huecos).
  var CORR_MONTHS = 60, CORR_MIN_RETURNS = 18, CORR_MIN_OVERLAP = 18;
  function monthlyReturns(pts) {
    var byMonth = {}, order = [];
    var limit = Date.now() - CORR_MONTHS * 31 * 86400000;
    pts.forEach(function (p) {
      if (p.ts < limit) return;
      var d = new Date(p.ts), k = d.getUTCFullYear() * 12 + d.getUTCMonth();
      if (byMonth[k] === undefined) order.push(k);
      byMonth[k] = p.value;
    });
    order.sort(function (x, y) { return x - y; });
    var out = {};
    for (var i = 1; i < order.length; i++) {
      var k = order[i], prev = byMonth[order[i - 1]];
      if (order[i - 1] === k - 1 && prev) out[k] = (byMonth[k] - prev) / prev;
    }
    return out;
  }
  function buildCorrAndVol() {
    var Core = core();
    var returnsByKey = {}, keys = [];
    Core.PRODUCTS.forEach(function (e) {
      var key = e.catId + '-' + e.nameKey;
      var info = Core.mapInfo ? Core.mapInfo(e) : null;
      if (!info || !info.pts || !MAP_GROUP[key]) return;
      if (Date.now() - info.pts[info.pts.length - 1].ts > 120 * 86400000) return;
      var r = monthlyReturns(info.pts);
      if (Object.keys(r).length >= CORR_MIN_RETURNS) { returnsByKey[key] = r; keys.push(key); }
    });
    var corrCache = {};
    function getCorr(a, b) {
      if (a === b) return 1;
      var ck = a < b ? a + '|' + b : b + '|' + a;
      if (corrCache.hasOwnProperty(ck)) return corrCache[ck];
      var ra = returnsByKey[a], rb = returnsByKey[b], xa = [], xb = [];
      Object.keys(ra).forEach(function (m) { if (rb[m] !== undefined) { xa.push(ra[m]); xb.push(rb[m]); } });
      var r = xa.length >= CORR_MIN_OVERLAP ? pearson(xa, xb) : null;
      corrCache[ck] = r;
      return r;
    }
    var rows = keys.map(function (rowKey) {
      var rowEntry = entryByDashKey(rowKey);
      var cells = keys.map(function (colKey) {
        if (rowKey === colKey) return { bg: P().surfaceAlt, textColor: P().textFaint, title: productName(rowEntry.nameKey), value: '' };
        var r = getCorr(rowKey, colKey);
        var colEntry = entryByDashKey(colKey);
        if (r === null) return { bg: P().surfaceAlt, textColor: P().textFaint, title: productName(rowEntry.nameKey) + ' × ' + productName(colEntry.nameKey) + ': —', value: '—' };
        var style = tileStyle(r, 1, CORR_COLOR_GAMMA);
        return { bg: style.bg, textColor: style.textColor, title: productName(rowEntry.nameKey) + ' × ' + productName(colEntry.nameKey) + ': r = ' + fmtCorr(r), value: fmtCorr(r) };
      });
      return { key: rowKey, name: productName(rowEntry.nameKey), cells: cells };
    });
    var volList = keys.map(function (k) {
      var dailyVol = stdDev(Object.keys(returnsByKey[k]).map(function (m) { return returnsByKey[k][m]; }));
      var entry = entryByDashKey(k);
      return { key: k, name: productName(entry.nameKey), annualPct: dailyVol * Math.sqrt(12) * 100 };
    });
    volList.sort(function (a, b) { return b.annualPct - a.annualPct; });
    var maxVol = volList.length ? volList[0].annualPct : 0;
    var ranking = volList.map(function (item, idx) {
      return { rank: idx + 1, key: item.key, name: item.name, valueLabel: D.fmtNumber(item.annualPct) + '%', barPct: maxVol > 0 ? Math.max(2, (item.annualPct / maxVol) * 100) : 0 };
    });
    return { rows: rows, keys: keys, ranking: ranking };
  }

  function renderCorrelationHtml(data) {
    var t = ui();
    if (data.keys.length < 2) return intelPendingHtml(t.corrTitle, t.corrEmpty || 'Aún no hay al menos dos productos con histórico verificado suficiente.', 'di-intel-corr');
    var headerCells = data.keys.map(function (k) { var e = entryByDashKey(k); return '<th title="' + esc(productName(e.nameKey)) + '">' + esc(productName(e.nameKey).slice(0, 4)) + '</th>'; }).join('');
    var bodyRows = data.rows.map(function (row) {
      var cells = row.cells.map(function (c) {
        return '<td class="di-corr-cell" style="background:' + c.bg + ';color:' + c.textColor + ';" title="' + esc(c.title) + '">' + esc(c.value) + '</td>';
      }).join('');
      return '<tr><th class="di-corr-row-label" data-open="' + row.key + '">' + esc(productName(entryByDashKey(row.key).nameKey)) + '</th>' + cells + '</tr>';
    }).join('');
    return (
      '<div class="di-intel-section" id="di-intel-corr">' +
        '<div class="di-intel-head"><h2>' + esc(t.corrTitle) + '</h2><p>' + esc(t.corrIntro) + '</p></div>' +
        '<div class="di-corr-scroll"><table class="di-corr-table"><thead><tr><th></th>' + headerCells + '</tr></thead><tbody>' + bodyRows + '</tbody></table></div>' +
        '<div class="di-intel-disclaimer">' + esc(t.corrDisclaimer) + '</div>' +
      '</div>'
    );
  }

  function renderVolatilityHtml(data) {
    var t = ui();
    if (!data.ranking.length) return intelPendingHtml(t.volTitle, t.corrEmpty || 'Aún no hay histórico verificado suficiente.', 'di-intel-vol');
    var rows = data.ranking.map(function (r) {
      return '<button type="button" class="di-vol-row" data-open="' + r.key + '">' +
        '<span class="di-vol-rank">' + r.rank + '</span>' +
        '<span class="di-vol-name-col"><span>' + esc(r.name) + '</span><span class="di-vol-bar-wrap"><span class="di-vol-bar" style="width:' + r.barPct + '%;"></span></span></span>' +
        '<span class="di-vol-value">' + esc(r.valueLabel) + '</span>' +
      '</button>';
    }).join('');
    return (
      '<div class="di-intel-section" id="di-intel-vol">' +
        '<div class="di-intel-head"><h2>' + esc(t.volTitle) + '</h2><p>' + esc(t.volIntro) + '</p></div>' +
        '<div class="di-card" style="padding:6px 16px;">' + rows + '</div>' +
        '<div class="di-intel-disclaimer">' + esc(t.volDisclaimer) + '</div>' +
      '</div>'
    );
  }

  // ---------------------------------------------------------------------
  // Estacionalidad (patrón estacional medio por producto, selector)
  // ---------------------------------------------------------------------
  var SEASON_CANVAS_W = 700, SEASON_CANVAS_H = 220;
  var SEASON_MARGIN_LEFT = 40, SEASON_MARGIN_RIGHT = 12, SEASON_MARGIN_TOP = 14, SEASON_MARGIN_BOTTOM = 24;
  var seasonProductKey = 'cereales-trigo';

  function buildSeasonality(dashKey) {
    var entry = entryByDashKey(dashKey);
    if (!entry) return { ready:false };
    var rows = realObservationsFor(entry);
    if (rows.length < 12) return { ready:false, count: rows.length };
    var firstDate = new Date(rows[0].observationDate), lastDate = new Date(rows[rows.length - 1].observationDate);
    if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime()) || (lastDate - firstDate) < 330 * 86400000) return { ready:false, count: rows.length };
    var monthSum = [0,0,0,0,0,0,0,0,0,0,0,0], monthCount = [0,0,0,0,0,0,0,0,0,0,0,0];
    var overallSum = 0;
    for (var i = 0; i < rows.length; i++) {
      var value = Number(rows[i].value);
      var date = new Date(rows[i].observationDate);
      if (!isFinite(value) || isNaN(date.getTime())) continue;
      var m = date.getUTCMonth();
      monthSum[m] += value; monthCount[m] += 1; overallSum += value;
    }
    var n = monthCount.reduce(function(a,b){return a+b;},0);
    if (n < 3 || !isFinite(overallSum)) return { ready:false, count:n };
    var overallAvg = overallSum / n;
    var raw = [];
    for (var mm = 0; mm < 12; mm++) {
      var avg = monthCount[mm] ? (monthSum[mm] / monthCount[mm]) : null;
      raw.push(avg === null || !overallAvg ? null : ((avg - overallAvg) / overallAvg) * 100);
    }
    var observedRaw = raw.filter(function (v) { return v !== null && isFinite(v); });
    var maxAbs = observedRaw.length ? Math.max.apply(null, observedRaw.map(function (v) { return Math.abs(v); })) : 0;
    var ticks = niceTicks(maxAbs, 3);
    var domain = ticks.domain || 1;
    var plotX = SEASON_MARGIN_LEFT, plotY = SEASON_MARGIN_TOP;
    var plotW = SEASON_CANVAS_W - SEASON_MARGIN_LEFT - SEASON_MARGIN_RIGHT;
    var plotH = SEASON_CANVAS_H - SEASON_MARGIN_TOP - SEASON_MARGIN_BOTTOM;
    var plotBottom = plotY + plotH;
    var originY = plotY + plotH / 2;
    function toPy(v) { return plotBottom - ((v + domain) / (2 * domain)) * plotH; }
    var slotW = plotW / 12;
    var barW = Math.max(slotW - 8, 4);
    var monthNames = ui().seasonMonths;
    var observedIdx = raw.map(function(v, idx){ return v === null ? null : idx; }).filter(function(v){ return v !== null; });
    if (!observedIdx.length) return { ready:false, count:n };
    var peakIdx = observedIdx[0], troughIdx = observedIdx[0];
    for (var k2 = 1; k2 < observedIdx.length; k2++) { var oi = observedIdx[k2]; if (raw[oi] > raw[peakIdx]) peakIdx = oi; if (raw[oi] < raw[troughIdx]) troughIdx = oi; }
    var months = raw.map(function (pct, idx) {
      var slotX = plotX + idx * slotW;
      var barX = slotX + (slotW - barW) / 2;
      var y0 = originY, y1 = toPy(pct);
      var top = Math.min(y0, y1);
      var h = Math.max(Math.abs(y1 - y0), 1);
      if (pct === null) return { month: monthNames[idx], x: barX, w: barW, y: originY, h: 0, color: 'transparent', labelX: slotX + slotW / 2, tooltip: monthNames[idx] + ': sin observación' };
      var style = tileStyle(pct, maxAbs);
      return { month: monthNames[idx], x: barX, w: barW, y: top, h: h, color: style.bg, labelX: slotX + slotW / 2, tooltip: monthNames[idx] + ': ' + D.fmtChange(pct) };
    });
    var yGrid = ticks.ticks.filter(function (v) { return v !== 0; }).map(function (v) { return { y: toPy(v), label: fmtTick(v) }; });
    return {
      ready:true, count:n, plotX: plotX, plotY: plotY, plotW: plotW, plotH: plotH, plotBottom: plotBottom, originY: originY,
      months: months, yGrid: yGrid,
      peakText: monthNames[peakIdx] + ' (' + D.fmtChange(raw[peakIdx]) + ')', peakColor: D.changeColor(raw[peakIdx], P()),
      troughText: monthNames[troughIdx] + ' (' + D.fmtChange(raw[troughIdx]) + ')', troughColor: D.changeColor(raw[troughIdx], P())
    };
  }

  function renderSeasonalityHtml() {
    var t = ui();
    var Core = core();
    var p = P();
    if (!entryByDashKey(seasonProductKey)) seasonProductKey = 'cereales-trigo';
    var s = buildSeasonality(seasonProductKey);
    if (!s.ready) return '<div class="di-intel-section di-intel-pending" id="di-intel-season"><div class="di-intel-head"><h2>' + esc(t.seasonTitle) + '</h2><p>Histórico real insuficiente para calcular estacionalidad. No se utilizan series sintéticas.</p><span class="di-intel-state pending">PENDIENTE</span></div></div>';
    var options = Core.PRODUCTS.map(function (e) {
      var k = e.catId + '-' + e.nameKey;
      return '<option value="' + k + '"' + (k === seasonProductKey ? ' selected' : '') + '>' + esc(productName(e.nameKey)) + '</option>';
    }).join('');
    var yGrid = s.yGrid.map(function (g) {
      return '<line x1="' + s.plotX + '" y1="' + g.y + '" x2="' + (s.plotX + s.plotW) + '" y2="' + g.y + '" stroke="' + p.border + '" stroke-width="1"/>' +
        '<text x="' + (s.plotX - 6) + '" y="' + (g.y + 3) + '" font-size="9.5" text-anchor="end" fill="' + p.textMuted + '">' + g.label + '</text>';
    }).join('');
    var bars = s.months.map(function (mo) {
      return '<rect x="' + mo.x + '" y="' + mo.y + '" width="' + mo.w + '" height="' + mo.h + '" fill="' + mo.color + '" rx="2"><title>' + esc(mo.tooltip) + '</title></rect>' +
        '<text x="' + mo.labelX + '" y="' + (s.plotBottom + 14) + '" font-size="9.5" text-anchor="middle" fill="' + p.textMuted + '">' + esc(mo.month) + '</text>';
    }).join('');
    var svg =
      '<svg viewBox="0 0 ' + SEASON_CANVAS_W + ' ' + SEASON_CANVAS_H + '">' +
        yGrid +
        '<line x1="' + s.plotX + '" y1="' + s.originY + '" x2="' + (s.plotX + s.plotW) + '" y2="' + s.originY + '" stroke="' + p.borderStrong + '" stroke-width="1.5"/>' +
        bars +
      '</svg>';
    return (
      '<div class="di-intel-section" id="di-intel-season">' +
        '<div class="di-intel-head"><h2>' + esc(t.seasonTitle) + '</h2><p>' + esc(t.seasonIntro) + '</p></div>' +
        '<div class="di-season-select-row"><label class="di-field-label">' + esc(t.seasonProductLabel) + '</label><select class="di-eu-country-select" id="di-season-select">' + options + '</select></div>' +
        '<div class="di-chart-svg-wrap">' + svg + '</div>' +
        '<div class="di-season-stats"><span>' + esc(t.seasonPeakLabel) + ' <b style="color:' + s.peakColor + ';">' + esc(s.peakText) + '</b></span><span>' + esc(t.seasonTroughLabel) + ' <b style="color:' + s.troughColor + ';">' + esc(s.troughText) + '</b></span></div>' +
        '<div class="di-intel-disclaimer">' + esc(t.seasonDisclaimer) + '</div>' +
      '</div>'
    );
  }

  // ---------------------------------------------------------------------
  // Dehesa Atlantic Spread — readiness gate
  // No calculamos un spread transatlántico cuando las dos observaciones no
  // comparten fecha, unidad/basis y metodología comparables. El panel debe
  // mostrar explícitamente por qué una comparación está pendiente.
  // ---------------------------------------------------------------------
  function trustForDashKey(dashKey) {
    var parts = dashKey.split('-');
    var productId = parts.slice(0, -1).join('-');
    var region = parts[parts.length - 1];
    var trust = D.DATA_TRUST || {};
    return trust[productId + '-' + region] || null;
  }

  function renderAtlanticSpreadHtml() {
    var labels = {
      es:{title:'Dehesa Atlantic Spread',intro:'Comparación transatlántica normalizada: solo se calcula cuando las observaciones tienen base metodológica y fecha suficientes.',pending:'Pendiente de datos comparables',date:'Fecha de observación',method:'Metodología',basis:'Comparabilidad',note:'No mostramos un diferencial numérico si mezclar las dos cotizaciones podría inducir a una conclusión falsa.'},
      en:{title:'Dehesa Atlantic Spread',intro:'Normalized transatlantic comparison: calculated only when observations have sufficient methodological and date coverage.',pending:'Comparable data pending',date:'Observation date',method:'Methodology',basis:'Comparability',note:'No numeric spread is shown when mixing the two quotations could produce a misleading conclusion.'},
      fr:{title:'Dehesa Atlantic Spread',intro:'Comparaison transatlantique normalisée: calculée uniquement lorsque les observations sont suffisamment comparables et datées.',pending:'Données comparables en attente',date:"Date d'observation",method:'Méthodologie',basis:'Comparabilité',note:'Aucun différentiel numérique n’est affiché lorsque le mélange des deux cotations pourrait être trompeur.'},
      it:{title:'Dehesa Atlantic Spread',intro:'Confronto transatlantico normalizzato: calcolato solo quando le osservazioni sono sufficientemente comparabili e datate.',pending:'Dati comparabili in attesa',date:'Data osservazione',method:'Metodologia',basis:'Comparabilità',note:'Nessun differenziale numerico viene mostrato quando combinare le due quotazioni potrebbe risultare fuorviante.'}
    };
    var t=labels[lang()]||labels.es;
    var products=[['cereales-trigo','Trigo','Wheat'],['cereales-maiz','Maíz','Corn'],['energia-diesel','Diésel','Diesel']];
    var cards=products.map(function(p){
      var us=trustForDashKey(p[0]+'-us'), eu=trustForDashKey(p[0]+'-eu');
      if(!us||!eu) return '';
      var comparable=us.comparability==='direct'&&eu.comparability==='direct';
      var dated=!!us.observationDate&&!!eu.observationDate;
      var ready=us.status==='verified'&&eu.status==='verified'&&comparable&&dated;
      var status=ready ? 'Ready' : t.pending;
      var basis=(us.comparability||'—')+' / '+(eu.comparability||'—');
      return '<div class="di-card di-atlantic-card">'+
        '<div class="di-product-name">'+esc(p[0]==='energia-diesel'?(lang()==='es'?'Diésel':lang()==='fr'?'Diesel':lang()==='it'?'Diesel':'Diesel'):(lang()==='es'?p[1]:lang()==='en'?p[2]:p[1]))+'</div>'+
        '<div class="di-atlantic-status">'+esc(status)+'</div>'+
        '<div class="di-atlantic-grid">'+
          '<div><span>'+esc(t.date)+'</span><b>'+esc(us.observationDate||'—')+' / '+esc(eu.observationDate||'—')+'</b></div>'+
          '<div><span>'+esc(t.basis)+'</span><b>'+esc(basis)+'</b></div>'+
        '</div>'+
        '<div class="di-atlantic-method">'+esc(t.method)+': '+esc(us.methodology||'—')+' · '+esc(eu.methodology||'—')+'</div>'+
        '<div class="di-spread-note">'+esc(t.note)+'</div>'+
      '</div>';
    }).join('');
    return '<div class="di-intel-section" id="di-intel-atlantic"><div class="di-intel-head"><h2>'+esc(t.title)+'</h2><p>'+esc(t.intro)+'</p></div><div class="di-atlantic-grid">'+cards+'</div></div>';
  }

  // ---------------------------------------------------------------------
  // Ratios agrícolas (Spreads)
  // ---------------------------------------------------------------------
  function spreadRatioSeries(numEntry, denEntry, native) {
    return numEntry.history.map(function (v, i) {
      if (native) return v / denEntry.history[i];
      return (v / numEntry.kgPerUnit) / (denEntry.history[i] / denEntry.kgPerUnit);
    });
  }
  function buildSpread(label, formula, numEntry, denEntry, native, note) {
    var series = spreadRatioSeries(numEntry, denEntry, native);
    var current = series[series.length - 1];
    var first = series[0];
    var pctChange = first ? ((current - first) / first) * 100 : 0;
    var t = ui();
    var p = P();
    var trendText = pctChange > 0 ? t.spreadTrendUp : (pctChange < 0 ? t.spreadTrendDown : t.spreadTrendFlat);
    var trendColor = pctChange > 0 ? p.positive : (pctChange < 0 ? p.negative : p.neutral);
    return { label: label, value: D.fmtNumber(current), changeLabel: D.fmtChange(pctChange), changeColor: D.changeColor(pctChange, p), formula: formula, trendText: trendText, trendColor: trendColor, note: note || '' };
  }
  function renderSpreadsHtml() {
    var t = ui();
    return '<div class="di-intel-section di-intel-pending" id="di-intel-spreads"><div class="di-intel-head"><h2>' + esc(t.spreadsTitle) + '</h2><p>Spreads pendientes: no se calcula un diferencial hasta disponer de observaciones reales compatibles para ambos componentes.</p><span class="di-intel-state pending">PENDIENTE</span></div></div>';
  }


  // ---------------------------------------------------------------------
  // Margen del productor
  // ---------------------------------------------------------------------
  var MARGIN_WINDOW_DAYS = 30;
  function marginPctChange(dashKey) {
    var entry = entryByDashKey(dashKey);
    return rangePctChange(regionFor(entry), seedFor(entry), MARGIN_WINDOW_DAYS);
  }
  function buildMargin(label, dashKey, piensoChange, energiaChange, fertChange, costIndexChange) {
    var t = ui();
    var p = P();
    var revenueChange = marginPctChange(dashKey);
    var deltaPts = revenueChange - costIndexChange;
    var verdict = deltaPts > 0 ? t.marginImproves : (deltaPts < 0 ? t.marginWorsens : t.marginFlat);
    var verdictColor = deltaPts > 0 ? p.positive : (deltaPts < 0 ? p.negative : p.neutral);
    var deltaSign = deltaPts > 0 ? '+' : (deltaPts < 0 ? '−' : '');
    return {
      label: label, revenueLabel: D.fmtChange(revenueChange), revenueColor: D.changeColor(revenueChange, p),
      costLabel: D.fmtChange(costIndexChange), costColor: D.changeColor(-costIndexChange, p),
      deltaLabel: deltaSign + Math.abs(deltaPts).toFixed(1) + ' pts', verdict: verdict, verdictColor: verdictColor
    };
  }
  function renderMarginHtml() {
    var t = ui();
    return '<div class="di-intel-section di-intel-pending" id="di-intel-margin"><div class="di-intel-head"><h2>' + esc(t.marginTitle) + '</h2><p>Margen pendiente: requiere series reales de ingresos y costes con cobertura temporal suficiente.</p><span class="di-intel-state pending">PENDIENTE</span></div></div>';
  }


  // ---------------------------------------------------------------------
  // Local vs. Global -- mismo producto visto a la vez desde el mercado
  // global (EE. UU., referencia/futuro europeo y, si existe, Reino Unido)
  // y desde el precio físico real en cada país de la UE. Reutiliza
  // D.buildRegion / D.deriveCountryRaw sobre el histórico corto nativo de
  // cada región (el mismo que usan las tarjetas normales de Precios), no
  // el histórico ilustrativo de 5 años de los otros widgets de esta página.
  // ---------------------------------------------------------------------
  var LG_COUNTRY_ORDER = ['es', 'fr', 'de', 'it'];
  var lgProductKey = 'cereales:trigo';

  function lgMarketLabel(product, marketKey, generic) {
    return (product.quoteTypes && product.quoteTypes[marketKey] && product.quoteTypes[marketKey].market) ? product.quoteTypes[marketKey].market : generic;
  }

  function buildLocalGlobal(productKey) {
    var Core = core();
    var entry = Core.PRODUCT_BY_KEY[productKey] || Core.PRODUCT_BY_KEY['cereales:trigo'];
    var product = entry.product;
    var UL = D.UNIT_LABELS[lang()] || D.UNIT_LABELS.es;
    var RG = D.REGION[lang()] || D.REGION.es;
    var ER = D.ENERGY_REGIONS[lang()] || D.ENERGY_REGIONS.es;
    var t = P();
    var rows = [];
    // mapCode: código ISO-2 (mayúsculas) que usa jsVectorMap para pintar el
    // país en el "🗺️ Global Price Map" -- null cuando la fila no
    // corresponde a un único país (la referencia/futuro europeo "eu" es un
    // precio de conjunto, no de un país concreto, así que no se pinta).
    rows.push({ flag: '🇺🇸', mapCode: 'US', label: lgMarketLabel(product, 'us', RG.us), built: D.buildRegion(product.us, lgMarketLabel(product, 'us', RG.us), 'USD', product.imperialKgPerUnit, UL[product.imperialUnitKey], D.FX, t) });
    rows.push({ flag: '🇪🇺', mapCode: null, label: lgMarketLabel(product, 'eu', RG.eu), built: D.buildRegion(product.eu, lgMarketLabel(product, 'eu', RG.eu), 'EUR', product.metricKgPerUnit, UL[product.metricUnitKey], D.FX, t) });
    if (product.uk) {
      rows.push({ flag: '🇬🇧', mapCode: 'GB', label: lgMarketLabel(product, 'uk', RG.uk), built: D.buildRegion(product.uk, lgMarketLabel(product, 'uk', RG.uk), 'GBP', product.metricKgPerUnit, UL[product.metricUnitKey], D.FX, t) });
    }
    // Mismo criterio que el resto del panel: si el producto no tiene
    // countryFactors (o un país concreto no publica cotización propia), no
    // se inventa nada -- ese país simplemente no aparece en la lista ni en
    // el mapa.
    var noCountryData = !product.countryFactors;
    var MAP_CODE_BY_COUNTRY = { es: 'ES', fr: 'FR', de: 'DE', it: 'IT' };
    if (product.countryFactors) {
      LG_COUNTRY_ORDER.forEach(function (c) {
        var factor = product.countryFactors[c];
        if (factor == null) return;
        var raw = D.deriveCountryRaw(product.eu, factor);
        var label = ER[D.COUNTRY_ER_KEY[c]];
        rows.push({ flag: D.COUNTRY_FLAG[c], mapCode: MAP_CODE_BY_COUNTRY[c], label: label, built: D.buildRegion(raw, label, 'EUR', product.metricKgPerUnit, UL[product.metricUnitKey], D.FX, t) });
      });
    }
    return { rows: rows, noCountryData: noCountryData };
  }

  // Última data de Local vs. Global construida por renderLocalGlobalHtml,
  // guardada para que render() pueda inicializar el mapa después de meter
  // el HTML en el DOM (jsVectorMap necesita que el contenedor #di-lg-map ya
  // exista). La instancia del mapa en sí se guarda en lgMapInstance para
  // poder destruirla de forma limpia antes de recrearla (cambio de
  // producto, de idioma o de tema).
  var lgLastData = null;
  var lgMapInstance = null;

  function renderLocalGlobalHtml() {
    var t = ui();
    return '<div class="di-intel-section" id="di-intel-localglobal"><div class="di-intel-head"><h2>🌍 ' + esc(t.localGlobalTitle) + '</h2><p>' + esc(t.localGlobalText) + '</p><a class="di-link-btn" href="mapa.html?layer=price">' + esc(t.localGlobalLink) + ' →</a></div></div>';
  }



  // ---------------------------------------------------------------------
  // Inicializa (o reinicializa) el mapa jsVectorMap dentro de #di-lg-map
  // con los países presentes en `rows` (cada uno con su mapCode). La
  // librería se carga desde un CDN en precios.html; si por lo que sea no
  // está disponible (sin red, bloqueada, CDN caído) se muestra un aviso de
  // texto en su lugar en vez de dejar un hueco vacío o un error en consola.
  // ---------------------------------------------------------------------
  function destroyGlobalPriceMap() {
    if (lgMapInstance) {
      try { lgMapInstance.destroy(); } catch (e) { /* contenedor ya no existe -- ignorar */ }
      lgMapInstance = null;
    }
  }

  function initGlobalPriceMap() {
    destroyGlobalPriceMap();
    var container = document.getElementById('di-lg-map');
    var fallback = document.getElementById('di-lg-map-fallback');
    if (!container) return;
    if (typeof global.jsVectorMap !== 'function') {
      if (fallback) { fallback.textContent = ui().localGlobalMapUnavailable; fallback.style.display = 'block'; }
      return;
    }
    var t = ui();
    var p = P();
    var data = lgLastData;
    if (!data) return;

    // codeData: código ISO-2 -> info de esa fila (para el color y el tooltip).
    var codeData = {};
    data.rows.forEach(function (r) {
      if (!r.mapCode) return;
      codeData[r.mapCode] = r;
    });

    try {
      lgMapInstance = new global.jsVectorMap({
        selector: '#di-lg-map',
        map: 'world',
        backgroundColor: 'transparent',
        zoomButtons: true,
        zoomOnScroll: false, // que el scroll de la página no quede atrapado en el mapa
        showTooltip: true,
        regionStyle: {
          initial: { fill: p.surfaceAlt, fillOpacity: 1, stroke: p.border, strokeWidth: 0.5 },
          hover: { fillOpacity: 0.8, cursor: 'pointer' },
          selected: {}
        },
        onRegionTooltipShow: function (event, tooltip, code) {
          var r = codeData[code];
          if (!r) return; // país sin datos para este producto -- tooltip por defecto (solo el nombre)
          var b = r.built;
          tooltip.text(
            '<strong>' + r.flag + ' ' + esc(r.label) + '</strong><br>' +
            esc(b.price) + ' ' + esc(b.unit) + ' ' +
            '<span style="color:' + b.changeColor + ';">' + esc(b.changeLabel) + '</span>',
            true
          );
        }
      });
      // Colorear cada país con datos según si sube, baja o no cambia --
      // mismos tres colores (verde/rojo/gris) que el resto del panel usa
      // para esta misma señal (fmtChange/changeColor en data.js).
      Object.keys(codeData).forEach(function (code) {
        var region = lgMapInstance.regions && lgMapInstance.regions[code];
        if (!region) return; // código no presente en el mapa mundial (no debería pasar con ES/FR/DE/IT/GB/US)
        try { region.element.setStyle('fill', codeData[code].built.changeColor); } catch (e) {}
      });
    } catch (e) {
      lgMapInstance = null;
      if (fallback) { fallback.textContent = t.localGlobalMapUnavailable; fallback.style.display = 'block'; }
    }
  }

  function renderRelationshipsHtml() {
    var rel=buildRelationshipEngine();
    var ready=rel.filter(function(r){return r.status==='ready';});
    var pending=rel.filter(function(r){return r.status!=='ready';});
    var labels={
      es:{title:'Relaciones agrícolas observadas',intro:'Correlación de cambios, no niveles. El motor prueba rezagos por periodo y asigna confianza según cobertura, fuerza y estabilidad de la asociación; no es una probabilidad ni una predicción.',corr:'Correlación Δ',lag:'Lag',window:'Ventana',pending:'relación(es) permanecen pendientes por falta de cobertura compatible.',periodQ:'trimestre',periodQs:'trimestres',periodM:'mes',periodMs:'meses',note:'La señal es descriptiva y no implica causalidad ni predicción.'},
      en:{title:'Observed agricultural relationships',intro:'Correlation of changes, not levels. The engine tests period lags and assigns confidence from coverage, strength and stability; it is not a probability or a forecast.',corr:'Δ correlation',lag:'Lag',window:'Window',pending:'relationship(s) remain pending because compatible coverage is unavailable.',periodQ:'quarter',periodQs:'quarters',periodM:'month',periodMs:'months',note:'The signal is descriptive and does not imply causality or forecasting.'},
      fr:{title:'Relations agricoles observées',intro:'Corrélation des variations, pas des niveaux. Le moteur teste les décalages par période et attribue une confiance selon la couverture, la force et la stabilité ; ce n’est ni une probabilité ni une prévision.',corr:'Corrélation Δ',lag:'Décalage',window:'Fenêtre',pending:'relation(s) restent en attente faute de couverture compatible.',periodQ:'trimestre',periodQs:'trimestres',periodM:'mois',periodMs:'mois',note:'Le signal est descriptif et n’implique ni causalité ni prévision.'},
      it:{title:'Relazioni agricole osservate',intro:'Correlazione delle variazioni, non dei livelli. Il motore testa i ritardi per periodo e assegna la confidenza in base a copertura, forza e stabilità; non è una probabilità né una previsione.',corr:'Correlazione Δ',lag:'Ritardo',window:'Finestra',pending:'relazione/i restano in attesa per mancanza di copertura compatibile.',periodQ:'trimestre',periodQs:'trimestri',periodM:'mese',periodMs:'mesi',note:'Il segnale è descrittivo e non implica causalità né previsione.'}
    };
    var t=labels[lang()]||labels.es;
    var names={
      eurostat_fertiliser_input_index:{es:'Fertilizantes · índice de compra',en:'Fertilizer · purchase index',fr:'Engrais · indice d’achat',it:'Fertilizzanti · indice di acquisto'},
      eurostat_energy_input_index:{es:'Energía · índice de compra',en:'Energy · purchase index',fr:'Énergie · indice d’achat',it:'Energia · indice di acquisto'},
      eurostat_cereals_output_index:{es:'Cereales · índice de producción',en:'Cereals · output index',fr:'Céréales · indice de production',it:'Cereali · indice di produzione'},
      eurostat_milk_output_index:{es:'Leche · índice de producción',en:'Milk · output index',fr:'Lait · indice de production',it:'Latte · indice di produzione'},
      feed_input_index:{es:'Alimentación · índice de costes',en:'Feed · cost index',fr:'Alimentation · indice de coûts',it:'Mangimi · indice dei costi'}
    };
    if(!ready.length){
      return '<section class="di-intel-section di-relationships"><div class="di-intel-head"><span class="di-intel-kicker">RELATIONSHIP ENGINE</span><h2>'+esc(t.title)+'</h2><p class="di-intel-muted">'+esc(t.intro)+'</p></div></section>';
    }
    var rank={high:3,medium:2,low:1};
    ready.sort(function(a,b){return (rank[b.confidence]||0)-(rank[a.confidence]||0);});
    var cards=ready.slice(0,6).map(function(r){
      var corr=Number(r.correlationReturns);
      var lagUnit=r.frequency==='quarterly'?(r.lagPeriods===1?t.periodQ:t.periodQs):(r.lagPeriods===1?t.periodM:t.periodMs);
      var aName=(names[r.seriesA.product]&&names[r.seriesA.product][lang()])||r.seriesA.product;
      var bName=(names[r.seriesB.product]&&names[r.seriesB.product][lang()])||r.seriesB.product;
      return '<article class="di-rel-card">'+
        '<div class="di-rel-top"><span>'+esc(r.label)+'</span><b class="di-rel-confidence '+esc(r.confidence)+'">'+esc(r.confidence.toUpperCase())+'</b></div>'+
        '<div class="di-rel-series">'+esc(aName)+' · EU <span>→</span> '+esc(bName)+' · EU</div>'+
        '<div class="di-rel-metrics"><div><small>'+esc(t.corr)+'</small><strong>'+corr.toFixed(2)+'</strong></div><div><small>'+esc(t.lag)+'</small><strong>'+esc(String(r.lagPeriods)+' '+lagUnit)+'</strong></div><div><small>'+esc(t.window)+'</small><strong>'+esc(r.window)+'</strong></div></div>'+
        '<p class="di-rel-note">'+esc(r.interpretation)+'</p>'+
      '</article>';
    }).join('');
    var pendingNote=pending.length ? '<div class="di-rel-note" style="margin-top:12px;">'+esc(pending.length+' '+t.pending)+'</div>' : '';
    var alerts=buildTransmissionAlerts();
    var alertCards=alerts.map(function(a){
      var lagUnit=a.relationship.frequency==='quarterly'?(a.relationship.lagPeriods===1?t.periodQ:t.periodQs):(a.relationship.lagPeriods===1?t.periodM:t.periodMs);
      return '<article class="di-rel-card di-transmission-card">'+
        '<div class="di-rel-top"><span>⚠ '+esc(a.label)+'</span><b class="di-rel-confidence '+esc(a.relationship.confidence)+'">'+esc(a.severity.toUpperCase())+'</b></div>'+
        '<div class="di-rel-series">Shock: <strong>'+esc(a.shock.changePct.toFixed(1))+'%</strong> · '+esc(a.shock.date)+'</div>'+
        '<div class="di-rel-metrics"><div><small>Canal</small><strong>Input cost</strong></div><div><small>Lag</small><strong>'+esc(String(a.relationship.lagPeriods)+' '+lagUnit)+'</strong></div><div><small>Confianza</small><strong>'+esc(a.relationship.confidence.toUpperCase())+'</strong></div></div>'+
        '<p class="di-rel-note">'+esc(a.message)+'</p>'+
      '</article>';
    }).join('');
    var alertSection=alerts.length ? '<div class="di-transmission-wrap"><div class="di-intel-head"><span class="di-intel-kicker">TRANSMISSION WATCH</span><h3>Input shock → mercado afectado</h3><p class="di-intel-muted">Las alertas se activan cuando un input supera un umbral y existe una relación histórica compatible. No estiman precios futuros.</p></div><div class="di-rel-grid">'+alertCards+'</div></div>' : '';
    return '<section class="di-intel-section di-relationships"><div class="di-intel-head"><span class="di-intel-kicker">RELATIONSHIP ENGINE</span><h2>'+esc(t.title)+'</h2><p class="di-intel-muted">'+esc(t.intro)+'</p></div><div class="di-rel-grid">'+cards+'</div>'+pendingNote+alertSection+'</section>';
  }


  function renderIntelligence20Html() {
    var p=P();
    var rows=(INTEL20&&INTEL20.series)||[];
    if(!rows.length) return '<section class="di-intel-section di-intel-engine20"><div class="di-intel-head"><span class="di-intel-kicker">INTELLIGENCE ENGINE 2.0</span><h2>Señales reales</h2><p class="di-intel-muted">Pendiente: el motor no tiene todavía una serie con cobertura suficiente.</p></div></section>';
    var labels={
      eurostat_cereals_output_index:'Cereales EU · índice de producción',
      eurostat_milk_output_index:'Leche EU · índice de producción',
      eurostat_fertiliser_input_index:'Fertilizantes EU · índice de compra',
      eurostat_energy_input_index:'Energía EU · índice de compra'
    };
    var cards=rows.filter(function(r){return /^eurostat_/.test(r.product);}).map(function(r){
      var ch=r.periodChangePct;
      var yoy=r.yoyPct;
      var chText=ch===null?'—':((ch>=0?'+':'')+ch.toFixed(1)+'%');
      var yoyText=yoy===null?'Pendiente':((yoy>=0?'+':'')+yoy.toFixed(1)+'%');
      var vol=r.volatility===null?'Pendiente':(r.volatility*100).toFixed(1)+'%';
      var state=r.points>=5?'REAL':'PENDIENTE';
      return '<article class="di-intel-engine-card"><div class="di-intel-engine-top"><span>'+esc(labels[r.product]||r.product)+'</span><b class="'+(state==='REAL'?'real':'pending')+'">'+state+'</b></div>'+
        '<div class="di-intel-engine-value">'+esc(String(r.latest))+' <small>2020=100</small></div>'+
        '<div class="di-intel-engine-metrics"><div><small>Último periodo</small><strong>'+esc(chText)+'</strong></div><div><small>YoY</small><strong>'+esc(yoyText)+'</strong></div><div><small>Volatilidad</small><strong>'+esc(vol)+'</strong></div></div>'+
        '<div class="di-intel-engine-foot">'+esc(r.observationDate)+' · '+r.points+' observaciones · Eurostat</div></article>';
    }).join('');
    return '<section class="di-intel-section di-intel-engine20"><div class="di-intel-head"><span class="di-intel-kicker">INTELLIGENCE ENGINE 2.0</span><h2>Señales calculadas sobre datos reales</h2><p class="di-intel-muted">Momentum, YoY y volatilidad solo aparecen cuando la serie supera los umbrales de cobertura. Sin series sintéticas ni conversiones entre metodologías incompatibles.</p></div><div class="di-intel-engine-grid">'+cards+'</div></section>';
  }

  // ---------------------------------------------------------------------
  // News → Market Impact Panel
  // ---------------------------------------------------------------------
  function renderNewsImpactPanelHtml() {
    var Core=core(), idx=global.DehesaNewsIndex||{}, region=Core.getLocation ? Core.getLocation() : 'us', rels=relationshipSnapshot(), alerts=buildTransmissionAlerts();
    var active=Core.getActiveTab ? Core.getActiveTab() : 'cereales';
    var entries=(Core.PRODUCTS||[]).filter(function(e){return e.catId===active;});
    var keys={}; entries.forEach(function(e){keys[e.nameKey]=true;});
    var stories=[], seen={};
    Object.keys(idx).forEach(function(k){
      if(!keys[k]) return;
      (idx[k]||[]).forEach(function(n){if(!seen[n.id]){seen[n.id]=true;stories.push(n);}});
    });
    if(!stories.length) Object.keys(idx).forEach(function(k){(idx[k]||[]).forEach(function(n){if(!seen[n.id]){seen[n.id]=true;stories.push(n);}});});
    stories.sort(function(a,b){return String(a.date)<String(b.date)?1:-1;});
    stories=stories.slice(0,5);

    var labels={
      es:{kicker:'NEWS → MARKET INTELLIGENCE',title:'Impacto de noticias en el mercado',intro:'Cada noticia se conecta con un canal, un mercado y, cuando existe evidencia compatible, una relación observada y su señal estadística.',news:'NEWS',channel:'CHANNEL',market:'MARKET',relationship:'RELATIONSHIP',signal:'SIGNAL',alert:'ALERT',observed:'RELACIÓN OBSERVADA',none:(region==='eu'?'Sin relación estadística compatible':'Sin relación estadística regional disponible'),watch:'TRANSMISSION WATCH',context:'Contexto descriptivo · no es una predicción.',empty:'No hay noticias enlazadas para este mercado.'},
      en:{kicker:'NEWS → MARKET INTELLIGENCE',title:'News market impact',intro:'Each story is linked to a channel, a market and, where compatible evidence exists, an observed relationship and its statistical signal.',news:'NEWS',channel:'CHANNEL',market:'MARKET',relationship:'RELATIONSHIP',signal:'SIGNAL',alert:'ALERT',observed:'OBSERVED RELATIONSHIP',none:'No compatible regional statistical relationship',watch:'TRANSMISSION WATCH',context:'Descriptive context · not a forecast.',empty:'No linked news is available for this market.'},
      fr:{kicker:'NEWS → MARKET INTELLIGENCE',title:'Impact des nouvelles sur le marché',intro:'Chaque actualité est reliée à un canal, un marché et, lorsque les données le permettent, à une relation observée et à son signal statistique.',news:'NEWS',channel:'CHANNEL',market:'MARKET',relationship:'RELATIONSHIP',signal:'SIGNAL',alert:'ALERT',observed:'RELATION OBSERVÉE',none:'Aucune relation statistique régionale compatible',watch:'TRANSMISSION WATCH',context:'Contexte descriptif · pas une prévision.',empty:'Aucune actualité liée à ce marché.'},
      it:{kicker:'NEWS → MARKET INTELLIGENCE',title:'Impatto delle notizie sul mercato',intro:'Ogni notizia è collegata a un canale, a un mercato e, quando i dati sono compatibili, a una relazione osservata e al relativo segnale statistico.',news:'NEWS',channel:'CHANNEL',market:'MARKET',relationship:'RELATIONSHIP',signal:'SIGNAL',alert:'ALERT',observed:'RELAZIONE OSSERVATA',none:'Nessuna relazione statistica regionale compatibile',watch:'TRANSMISSION WATCH',context:'Contesto descrittivo · non è una previsione.',empty:'Nessuna notizia collegata a questo mercato.'}
    };
    var t=labels[lang()]||labels.es;
    var channelLabels={input_cost:'INPUT COST',trade:'TRADE',weather:'WEATHER',supply:'SUPPLY',energy:'ENERGY',policy:'POLICY',market_impact:'MARKET IMPACT'};
    function productLabel(k){return Core.productName ? Core.productName(k) : k;}
    function alertFor(relId){return alerts.some(function(a){return a.relationship&&a.relationship.id===relId;});}
    function relFor(link){return link.relation&&rels[link.relation]&&rels[link.relation].status==='ready'?rels[link.relation]:null;}
    function storyCard(n){
      var links=n.marketLinks||[];
      var link=links[0]||{market:(n.products||[])[0]||'—',channel:n.impactChannel||'market_impact'};
      var r=null;
      for(var j=0;j<links.length;j++){r=relFor(links[j]);if(r){link=links[j];break;}}
      var alert=r&&alertFor(r.id);
      var corr=r&&isFinite(Number(r.correlationReturns))?Number(r.correlationReturns):null;
      var signal=r ? (corr>=0?'Δ + asociación':'Δ − asociación') : t.none;
      var signalClass=r ? (corr>=0?'positive':'negative') : 'neutral';
      var relationText=r ? r.label : t.none;
      var lag=r ? String(r.lagPeriods)+' '+(r.frequency==='quarterly'?(r.lagPeriods===1?'trimestre':'trimestres'):(r.lagPeriods===1?'mes':'meses')) : '—';
      return '<article class="di-news-impact-card">'+
        '<div class="di-news-impact-flow">'+
          '<div class="di-news-impact-node news"><small>'+t.news+'</small><strong>'+esc(n.source)+'</strong><span>'+esc(n.date)+'</span></div>'+
          '<span class="di-news-impact-arrow">→</span>'+
          '<div class="di-news-impact-node"><small>'+t.channel+'</small><strong>'+esc(channelLabels[link.channel]||'MARKET IMPACT')+'</strong></div>'+
          '<span class="di-news-impact-arrow">→</span>'+
          '<div class="di-news-impact-node"><small>'+t.market+'</small><strong>'+esc(productLabel(link.market))+'</strong></div>'+
          '<span class="di-news-impact-arrow">→</span>'+
          '<div class="di-news-impact-node"><small>'+t.relationship+'</small><strong>'+esc(relationText)+'</strong></div>'+
          '<span class="di-news-impact-arrow">→</span>'+
          '<div class="di-news-impact-node signal '+signalClass+'"><small>'+t.signal+'</small><strong>'+esc(signal)+'</strong><span>'+esc(r ? ('r '+corr.toFixed(2)+' · lag '+lag) : '—')+'</span></div>'+
          (alert?'<span class="di-news-impact-alert-node">⚠ '+t.watch+'</span>':'')+
        '</div>'+
        '<div class="di-news-impact-story"><a href="'+esc(n.url)+'" target="_blank" rel="noopener noreferrer">'+esc((n.headline&& (n.headline[lang()]||n.headline.es))||'')+'</a><span>'+esc(t.context)+'</span></div>'+
      '</article>';
    }
    return '<section class="di-intel-section di-news-impact-panel"><div class="di-intel-head"><span class="di-intel-kicker">'+t.kicker+'</span><h2>'+t.title+'</h2><p class="di-intel-muted">'+t.intro+'</p></div>'+
      (stories.length ? '<div class="di-news-impact-stack">'+stories.map(storyCard).join('')+'</div>' : '<div class="di-news-impact-empty">'+t.empty+'</div>')+
      '</section>';
  }

  // ---------------------------------------------------------------------
  // Orquestación
  // ---------------------------------------------------------------------
  function wireOpenTargets(root) {
    Array.prototype.forEach.call(root.querySelectorAll('[data-open]'), function (el) {
      el.addEventListener('click', function () {
        var dashKey = el.getAttribute('data-open');
        var entry = entryByDashKey(dashKey);
        if (entry) core().openHistory(entry.catId + ':' + entry.nameKey);
      });
    });
  }

  function render() {
    var root = document.getElementById('pr-intel');
    if (!root) return;
    if (!REAL_HISTORY_READY) {
      root.innerHTML = '<div class="di-intel-section"><div class="di-intel-head"><h2>Inteligencia basada en histórico real</h2><p>Cargando observaciones normalizadas. Las series sintéticas no se utilizan para estos cálculos.</p></div></div>';
      loadRealHistory(function(){ render(); });
      return;
    }
    var corrVolData = buildCorrAndVol();
    root.innerHTML =
      renderNewsImpactPanelHtml() +
      renderIntelligence20Html() +
      renderRelationshipsHtml() +
      renderMarketMapHtml() +
      renderMomentumHtml() +
      '<div class="di-intel-grid-2">' + renderCorrelationHtml(corrVolData) + renderVolatilityHtml(corrVolData) + '</div>' +
      renderSeasonalityHtml() +
      renderLocalGlobalHtml() +
      renderAtlanticSpreadHtml() +
      renderSpreadsHtml() +
      renderMarginHtml();
    wireOpenTargets(root);
    var seasonSelect = document.getElementById('di-season-select');
    if (seasonSelect) seasonSelect.addEventListener('change', function (e) {
      seasonProductKey = e.target.value;
      render();
    });
    var lgSelect = document.getElementById('di-lg-select');
    if (lgSelect) lgSelect.addEventListener('change', function (e) {
      lgProductKey = e.target.value;
      render();
    });
    // El contenedor #di-lg-map recién insertado por innerHTML ya existe en
    // el DOM en este punto, así que el mapa se (re)crea aquí y no dentro de
    // renderLocalGlobalHtml (que solo devuelve una cadena de HTML).
    initGlobalPriceMap();
  }

  function relationshipSnapshot() {
    return activeRelationshipResults();
  }
  function transmissionSnapshot() {
    var out = {};
    buildTransmissionAlerts().forEach(function(a){ out[a.id] = a; });
    return out;
  }
  global.DehesaPreciosIntel = {
    render: render,
    getRelationships: relationshipSnapshot,
    getTransmissionAlerts: transmissionSnapshot,
    getActiveRegion: activeRegion
  };
})(window);
