#!/usr/bin/env node
// Oferta y demanda: USDA FAS PSD (Production, Supply and Distribution), descarga masiva oficial (CC BY 4.0).
// Lee los CSV ya descargados y descomprimidos en PSD_DIR y escribe:
//   data/supply-demand.json      series por país (los principales) y total mundial, últimas 13 campañas
//   data/supply-demand-map.json  todos los países, dos últimas campañas, para el mapa
// No inventa nada: solo copia valores de PSD; el "total mundial" es la suma de países de la base (sin doble
// conteo de la UE) y así se declara. Si falta un fichero o el resultado no es coherente, no se sobrescribe.
import fs from 'node:fs'; import readline from 'node:readline'; import path from 'node:path';
const DIR=process.env.PSD_DIR||'/tmp/psd';
const OUT=path.join(process.cwd(),'data');
const COMMODITIES=[
 {id:'trigo',file:'grains_pulses',name:'Wheat'},{id:'maiz',file:'grains_pulses',name:'Corn'},{id:'arroz',file:'grains_pulses',name:'Rice, Milled'},{id:'cebada',file:'grains_pulses',name:'Barley'},
 {id:'soja',file:'oilseeds',name:'Oilseed, Soybean'},{id:'harina_soja',file:'oilseeds',name:'Meal, Soybean'},{id:'colza',file:'oilseeds',name:'Oilseed, Rapeseed'},{id:'oliva',file:'oilseeds',name:'Oil, Olive'},
 {id:'cerdo',file:'livestock',name:'Meat, Swine'},{id:'vacuno',file:'livestock',name:'Meat, Beef and Veal'},{id:'pollo',file:'livestock',name:'Meat, Chicken'},
 {id:'leche',file:'dairy',name:'Dairy, Milk, Fluid'},{id:'azucar',file:'sugar',name:'Sugar, Centrifugal'}
];
const ATTR={'Production':'production','Imports':'imports','Exports':'exports','Domestic Consumption':'consumption','Ending Stocks':'endingStocks','Beginning Stocks':'beginningStocks','Area Harvested':'area','Crush':'crush','Feed Dom. Consumption':'feed','Total Supply':'totalSupply'};
const EU_MEMBERS=new Set(['Austria','Belgium-Luxembourg','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic','Denmark','Estonia','Finland','France','Germany','Germany, Federal Republic of','German Democratic Republic','Greece','Hungary','Ireland','Italy','Latvia','Lithuania','Luxembourg','Malta','Netherlands','Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden']);
const NON_COUNTRY=new Set(['EU-15','Union of Soviet Socialist Repu','Former Czechoslovakia','Former Yugoslavia','Yugoslavia (>05/92)','Serbia and Montenegro','Yemen (Aden)','Yemen (Sanaa)']);
const ISO={'Afghanistan':'AF','Albania':'AL','Algeria':'DZ','Angola':'AO','Argentina':'AR','Armenia':'AM','Australia':'AU','Azerbaijan':'AZ','Bahrain':'BH','Bangladesh':'BD','Barbados':'BB','Belarus':'BY','Belize':'BZ','Benin':'BJ','Bhutan':'BT','Bolivia':'BO','Bosnia and Herzegovina':'BA','Botswana':'BW','Brazil':'BR','Brunei':'BN','Burkina Faso':'BF','Burma':'MM','Burundi':'BI','Cabo Verde':'CV','Cambodia':'KH','Cameroon':'CM','Canada':'CA','Central African Republic':'CF','Chad':'TD','Chile':'CL','China':'CN','Colombia':'CO','Congo (Brazzaville)':'CG','Congo (Kinshasa)':'CD','Costa Rica':'CR',"Cote d'Ivoire":'CI','Cuba':'CU','Djibouti':'DJ','Dominican Republic':'DO','Ecuador':'EC','Egypt':'EG','El Salvador':'SV','Eritrea':'ER','Eswatini':'SZ','Ethiopia':'ET','Fiji':'FJ','Gabon':'GA','Gambia, The':'GM','Georgia':'GE','Ghana':'GH','Guatemala':'GT','Guinea':'GN','Guinea-Bissau':'GW','Guyana':'GY','Haiti':'HT','Honduras':'HN','Iceland':'IS','India':'IN','Indonesia':'ID','Iran':'IR','Iraq':'IQ','Israel':'IL','Jamaica':'JM','Japan':'JP','Jordan':'JO','Kazakhstan':'KZ','Kenya':'KE','Korea, North':'KP','Korea, South':'KR','Kuwait':'KW','Kyrgyzstan':'KG','Laos':'LA','Lebanon':'LB','Lesotho':'LS','Liberia':'LR','Libya':'LY','Madagascar':'MG','Malawi':'MW','Malaysia':'MY','Mali':'ML','Mauritania':'MR','Mauritius':'MU','Mexico':'MX','Moldova':'MD','Mongolia':'MN','Morocco':'MA','Mozambique':'MZ','Namibia':'NA','Nepal':'NP','New Zealand':'NZ','Nicaragua':'NI','Niger':'NE','Nigeria':'NG','North Macedonia':'MK','Norway':'NO','Oman':'OM','Pakistan':'PK','Panama':'PA','Papua New Guinea':'PG','Paraguay':'PY','Peru':'PE','Philippines':'PH','Qatar':'QA','Russia':'RU','Rwanda':'RW','Saudi Arabia':'SA','Senegal':'SN','Serbia':'RS','Sierra Leone':'SL','Singapore':'SG','Somalia':'SO','South Africa':'ZA','South Sudan':'SS','Sri Lanka':'LK','Sudan':'SD','Suriname':'SR','Switzerland':'CH','Syria':'SY','Taiwan':'TW','Tajikistan':'TJ','Tanzania':'TZ','Thailand':'TH','Togo':'TG','Trinidad and Tobago':'TT','Tunisia':'TN','Turkey':'TR','Turkmenistan':'TM','Uganda':'UG','Ukraine':'UA','United Arab Emirates':'AE','United Kingdom':'GB','United States':'US','Uruguay':'UY','Uzbekistan':'UZ','Venezuela':'VE','Vietnam':'VN','Yemen':'YE','Zambia':'ZM','Zimbabwe':'ZW',
 'Austria':'AT','Bulgaria':'BG','Croatia':'HR','Cyprus':'CY','Czech Republic':'CZ','Denmark':'DK','Estonia':'EE','Finland':'FI','France':'FR','Germany':'DE','Greece':'GR','Hungary':'HU','Ireland':'IE','Italy':'IT','Latvia':'LV','Lithuania':'LT','Malta':'MT','Netherlands':'NL','Poland':'PL','Portugal':'PT','Romania':'RO','Slovakia':'SK','Slovenia':'SI','Spain':'ES','Sweden':'SE','Belgium':'BE','Luxembourg':'LU'};
function parse(line){const r=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"')q=!q;else if(c===','&&!q){r.push(cur);cur=''}else cur+=c}r.push(cur);return r}
const r2=n=>Math.round(n*100)/100;
const commodityOut=[],mapOut=[],problems=[];
const byFile={};for(const c of COMMODITIES)(byFile[c.file]??=[]).push(c);
for(const [file,list] of Object.entries(byFile)){
 const fp=path.join(DIR,'psd_'+file+'.csv');
 if(!fs.existsSync(fp)){problems.push('falta '+fp);continue}
 const want=new Map(list.map(c=>[c.name,c]));
 // rows[commodityId] = Map key(country|MY|attr) -> {v, cal, month}
 const rows={};for(const c of list)rows[c.id]=new Map();
 const meta={};for(const c of list)meta[c.id]={units:new Map(),maxMY:0,pub:'0000-00'};
 let first=true;
 for await(const line of readline.createInterface({input:fs.createReadStream(fp)})){
  if(first){first=false;continue}
  const c=parse(line); const com=want.get(c[1]); if(!com)continue;
  const attr=ATTR[c[8]]; if(!attr)continue;
  const my=+c[4]; const v=parseFloat(c[11]); if(!Number.isFinite(my)||!Number.isFinite(v))continue;
  const m=meta[com.id]; if(my>m.maxMY)m.maxMY=my;
  m.units.set(attr,c[10]);
  const key=c[3]+'|'+my+'|'+attr; const prev=rows[com.id].get(key); const stamp=c[5]+'-'+c[6];
  if(!prev||stamp>=prev.stamp)rows[com.id].set(key,{v,stamp,cal:c[5],month:c[6]});
  const pub=c[5]+'-'+c[6]; if(my===m.maxMY&&pub>m.pub&&+c[5]>=2000)m.pub=pub;
 }
 for(const com of list){
  const m=meta[com.id]; if(!m.maxMY){problems.push('sin datos '+com.name);continue}
  const from=m.maxMY-12, years=[];for(let y=from;y<=m.maxMY;y++)years.push(y);
  // valores[country][MY][attr]
  const val={};
  for(const [key,o] of rows[com.id]){const [country,my,attr]=key.split('|');const y=+my;if(y<from)continue;((val[country]??={})[y]??={})[attr]=o.v}
  const countries=Object.keys(val);
  const euHas=y=>!!(val['European Union']&&val['European Union'][y]&&val['European Union'][y].production!==undefined);
  // total mundial: suma de países sin doble conteo de la UE
  const world={};
  for(const y of years){const w={};
   for(const country of countries){
    if(NON_COUNTRY.has(country))continue;
    if(country!=='European Union'&&EU_MEMBERS.has(country)&&euHas(y))continue;
    const d=val[country][y]; if(!d)continue;
    for(const [a,v] of Object.entries(d))w[a]=(w[a]||0)+v}
   world[y]=Object.fromEntries(Object.entries(w).map(([a,v])=>[a,r2(v)]))}
  // países a publicar: unión de los principales en la última campaña con datos completos (maxMY-1 = estimación) y la previsión
  const ref=m.maxMY, top=new Set();
  const rank=(attr,n)=>countries.filter(c=>!NON_COUNTRY.has(c)&&!(c!=='European Union'&&EU_MEMBERS.has(c)&&euHas(ref))).map(c=>[c,(val[c][ref]||{})[attr]||0]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,n).forEach(x=>top.add(x[0]));
  rank('production',15);rank('exports',10);rank('imports',10);rank('consumption',10);rank('endingStocks',8);
  const series={};
  for(const c of top){const iso=c==='European Union'?'EU':ISO[c];const s={};for(const y of years){const d=val[c][y];if(d)s[y]=Object.fromEntries(Object.entries(d).map(([a,v])=>[a,r2(v)]))}series[c]={iso:iso||null,years:s}}
  const unit=(m.units.get('production')||'(1000 MT)').replace(/[()]/g,'');
  commodityOut.push({id:com.id,psdName:com.name,unit,latestMarketYear:m.maxMY,publishedMonth:m.pub,marketYears:years,attributes:[...m.units.keys()],world,countries:series});
  // mapa: todos los países, dos últimas campañas, 4 atributos
  const mp={};
  for(const c of countries){
   if(NON_COUNTRY.has(c))continue;
   const iso=c==='European Union'?'EU':ISO[c]; if(!iso){continue}
   if(c!=='European Union'&&EU_MEMBERS.has(c)&&euHas(m.maxMY))continue;
   const o={};for(const y of [m.maxMY-1,m.maxMY]){const d=val[c][y];if(!d)continue;const e={};for(const a of ['production','exports','imports','endingStocks','consumption'])if(d[a]!==undefined)e[a]=r2(d[a]);if(Object.keys(e).length)o[y]=e}
   if(Object.keys(o).length)mp[iso]={name:c,years:o}}
  mapOut.push({id:com.id,unit,latestMarketYear:m.maxMY,countries:mp});
 }
}
if(problems.length||commodityOut.length<COMMODITIES.length){console.error('PSD incompleto: '+problems.join('; ')+' (commodities '+commodityOut.length+'/'+COMMODITIES.length+'); no se sobrescribe nada');process.exit(1)}
// coherencia mínima: trigo mundial (producción) plausible
const w=commodityOut.find(c=>c.id==='trigo'),wp=w.world[w.latestMarketYear-1].production;
if(!(wp>600000&&wp<1000000)){console.error('Producción mundial de trigo fuera de rango ('+wp+'); no se sobrescribe');process.exit(1)}
const generatedAt=new Date().toISOString();
const source={name:'USDA Foreign Agricultural Service — PSD Online (Production, Supply and Distribution)',url:'https://apps.fas.usda.gov/psdonline/',license:'Datos oficiales de USDA, publicados con licencia CC BY 4.0 en data.gov; se cita la fuente. Se actualizan con el informe mensual WASDE.'};
fs.writeFileSync(path.join(OUT,'supply-demand.json'),JSON.stringify({schemaVersion:'1.0',generatedAt,source,
 methodology:{es:'Balances de oferta y demanda por país y campaña de comercialización, tal como los publica USDA (PSD). La campaña indicada (p. ej. 2025) es la que empieza ese año (2025/26); la más reciente es una PREVISIÓN y las anteriores son estimaciones o cifras finales. Los valores están en las unidades de PSD (miles de toneladas; carne en equivalente canal). "Mundo" es la suma de los países de la base PSD, contando la UE una sola vez (como agregado); no es una cifra publicada por USDA. Las campañas de comercialización no coinciden entre países. Solo se publican los países principales; el resto está en el mapa.',en:'Supply and demand balances by country and marketing year, as published by USDA (PSD). The year shown (e.g. 2025) is the marketing year starting that year (2025/26); the latest one is a FORECAST and earlier ones are estimates or final figures. Values are in PSD units (thousand tonnes; meat in carcass-weight equivalent). "World" is the sum of the countries in the PSD database, counting the EU once (as an aggregate); it is not a figure published by USDA. Marketing years differ between countries. Only the main countries are published here; the rest are on the map.'},
 commodities:commodityOut})+'\n');
fs.writeFileSync(path.join(OUT,'supply-demand-map.json'),JSON.stringify({schemaVersion:'1.0',generatedAt,source,note:'iso EU = agregado de la Unión Europea (se pinta en los 27 países). Valores en las unidades de cada materia prima (miles de toneladas).',commodities:mapOut})+'\n');
console.log('PSD: '+commodityOut.length+' materias primas; trigo mundial MY'+(w.latestMarketYear-1)+': '+wp+' (miles de t)');
