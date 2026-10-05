#!/usr/bin/env node
// Clima agrícola: anomalías mensuales de precipitación y temperatura en puntos representativos de
// regiones productoras (NASA POWER, reanálisis MERRA-2). Mide desviación frente a la media 2001-2020 del
// mismo mes. NO son estaciones ni promedios de región: es la celda de la malla que contiene el punto.
// Si la fuente falla o devuelve -999, ese dato no se escribe (no se inventa ni se rellena).
import {readFile,writeFile} from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const B='https://power.larc.nasa.gov/api/temporal';
const LOCATIONS=[
 {id:'us-iowa',name:'Iowa',region:'us',country:'US',lat:42.0,lon:-93.6,crops:['maiz','soja']},
 {id:'us-illinois',name:'Illinois',region:'us',country:'US',lat:40.0,lon:-89.0,crops:['maiz','soja']},
 {id:'us-kansas',name:'Kansas',region:'us',country:'US',lat:38.5,lon:-98.5,crops:['trigo']},
 {id:'us-north-dakota',name:'North Dakota',region:'us',country:'US',lat:47.5,lon:-100.0,crops:['trigo']},
 {id:'us-nebraska',name:'Nebraska (Platte central)',region:'us',country:'US',lat:40.8,lon:-98.4,crops:['maiz','soja']},
 {id:'us-minnesota',name:'Minnesota (suroeste)',region:'us',country:'US',lat:44.2,lon:-95.3,crops:['maiz','soja']},
 {id:'us-indiana',name:'Indiana (centro)',region:'us',country:'US',lat:40.2,lon:-86.4,crops:['maiz','soja']},
 {id:'us-ohio',name:'Ohio (noroeste)',region:'us',country:'US',lat:40.9,lon:-83.8,crops:['maiz','soja']},
 {id:'us-south-dakota',name:'South Dakota (este)',region:'us',country:'US',lat:44.3,lon:-97.9,crops:['maiz','soja','trigo']},
 {id:'us-missouri',name:'Missouri (norte)',region:'us',country:'US',lat:39.6,lon:-92.6,crops:['maiz','soja','vacuno']},
 {id:'us-texas',name:'Texas (Panhandle)',region:'us',country:'US',lat:35.2,lon:-101.8,crops:['trigo','sorgo','vacuno']},
 {id:'us-oklahoma',name:'Oklahoma (oeste)',region:'us',country:'US',lat:36.0,lon:-98.6,crops:['trigo','vacuno']},
 {id:'us-colorado',name:'Colorado (noreste)',region:'us',country:'US',lat:40.4,lon:-103.3,crops:['trigo','vacuno']},
 {id:'us-montana',name:'Montana (centro-norte)',region:'us',country:'US',lat:48.3,lon:-110.9,crops:['trigo']},
 {id:'us-washington',name:'Washington (Palouse)',region:'us',country:'US',lat:46.9,lon:-117.4,crops:['trigo']},
 {id:'us-california',name:'California (valle de San Joaquín)',region:'us',country:'US',lat:36.5,lon:-119.8,crops:['leche','algodon']},
 {id:'us-arkansas',name:'Arkansas (Delta)',region:'us',country:'US',lat:35.0,lon:-91.0,crops:['arroz','soja']},
 {id:'us-mississippi',name:'Mississippi (Delta)',region:'us',country:'US',lat:33.5,lon:-90.7,crops:['soja','algodon']},
 {id:'us-georgia',name:'Georgia (sur)',region:'us',country:'US',lat:31.5,lon:-83.6,crops:['algodon','maiz']},
 {id:'us-wisconsin',name:'Wisconsin (centro)',region:'us',country:'US',lat:44.5,lon:-89.6,crops:['leche','maiz']},
 {id:'us-north-carolina',name:'North Carolina (este)',region:'us',country:'US',lat:35.5,lon:-78.0,crops:['cerdo','soja']},
 {id:'eu-aragon',name:'Aragón (Zaragoza)',region:'eu',country:'ES',lat:41.65,lon:-0.9,crops:['trigo','cebada']},
 {id:'eu-castilla-leon',name:'Castilla y León (Valladolid)',region:'eu',country:'ES',lat:41.65,lon:-4.7,crops:['trigo','cebada']},
 {id:'eu-beauce',name:'Beauce (Francia)',region:'eu',country:'FR',lat:48.3,lon:1.8,crops:['trigo']},
 {id:'eu-saxony-anhalt',name:'Sajonia-Anhalt (Alemania)',region:'eu',country:'DE',lat:52.0,lon:11.5,crops:['trigo']},
 {id:'eu-po-valley',name:'Valle del Po (Italia)',region:'eu',country:'IT',lat:45.0,lon:10.5,crops:['maiz','arroz']},
 {id:'eu-poland',name:'Cuyavia (Polonia)',region:'eu',country:'PL',lat:52.7,lon:18.5,crops:['trigo','maiz']},
 {id:'uk-lincolnshire',name:'Lincolnshire (Reino Unido)',region:'uk',country:'GB',lat:53.1,lon:-0.3,crops:['trigo']},
 {id:'uk-east-anglia',name:'East Anglia (Reino Unido)',region:'uk',country:'GB',lat:52.5,lon:0.9,crops:['trigo','cebada']},
 {id:'ca-saskatchewan-south',name:'Saskatchewan sur (Regina)',region:'ca',country:'CA',lat:50.4,lon:-104.6,crops:['trigo','lenteja','guisante_seco']},
 {id:'ca-saskatchewan-north',name:'Saskatchewan centro (Saskatoon)',region:'ca',country:'CA',lat:52.1,lon:-106.6,crops:['colza','trigo']},
 {id:'ca-alberta-south',name:'Alberta sur (Lethbridge)',region:'ca',country:'CA',lat:49.7,lon:-112.8,crops:['trigo','cebada']},
 {id:'ca-alberta-peace',name:'Alberta Peace River',region:'ca',country:'CA',lat:56.2,lon:-117.3,crops:['colza','trigo']},
 {id:'ca-manitoba',name:'Manitoba (Winnipeg)',region:'ca',country:'CA',lat:49.9,lon:-97.2,crops:['colza','soja_grano','trigo']},
 {id:'ca-ontario',name:'Ontario sur (London)',region:'ca',country:'CA',lat:43.0,lon:-81.2,crops:['maiz','soja_grano']},
 {id:'ca-quebec',name:'Quebec (Montérégie)',region:'ca',country:'CA',lat:45.5,lon:-73.0,crops:['maiz','leche']},
 {id:'eu-netherlands-flevoland',name:'Flevoland (Países Bajos)',region:'eu',country:'NL',lat:52.5,lon:5.6,crops:['trigo','patata','remolacha']},
 {id:'eu-netherlands-groningen',name:'Groningen (Países Bajos)',region:'eu',country:'NL',lat:53.2,lon:6.6,crops:['trigo','cebada','patata']},
 {id:'eu-netherlands-brabant',name:'Brabante Septentrional (Países Bajos)',region:'eu',country:'NL',lat:51.5,lon:5.3,crops:['cerdo','leche','maiz']},
 {id:'au-wheatbelt-wa',name:'Wheatbelt, Australia Occidental (Northam)',region:'au',country:'AU',lat:-31.65,lon:116.67,crops:['trigo','cebada','colza']},
 {id:'au-sa-mallee',name:'Australia Meridional (Mid North, Clare)',region:'au',country:'AU',lat:-33.8,lon:138.6,crops:['trigo','cebada']},
 {id:'au-vic-wimmera',name:'Wimmera, Victoria (Horsham)',region:'au',country:'AU',lat:-36.7,lon:142.2,crops:['trigo','cebada','colza']},
 {id:'au-nsw-central-west',name:'Nueva Gales del Sur centro-oeste (Dubbo)',region:'au',country:'AU',lat:-32.25,lon:148.6,crops:['trigo','cebada','colza']},
 {id:'au-nsw-north',name:'Nueva Gales del Sur norte (Moree)',region:'au',country:'AU',lat:-29.45,lon:149.85,crops:['trigo','sorgo','algodon']},
 {id:'au-qld-darling-downs',name:'Darling Downs, Queensland (Toowoomba)',region:'au',country:'AU',lat:-27.56,lon:151.95,crops:['trigo','sorgo','vacuno']},
 {id:'au-qld-central',name:'Queensland central (Rockhampton)',region:'au',country:'AU',lat:-23.4,lon:150.5,crops:['vacuno']},
 {id:'eu-denmark-jutland',name:'Jutlandia (Dinamarca)',region:'eu',country:'DK',lat:56.2,lon:9.3,crops:['trigo','cebada','cerdo','leche']},
 {id:'eu-denmark-zealand',name:'Selandia (Dinamarca)',region:'eu',country:'DK',lat:55.4,lon:11.8,crops:['trigo','cebada','colza']},
 {id:'eu-austria-marchfeld',name:'Marchfeld, Baja Austria (Austria)',region:'eu',country:'AT',lat:48.3,lon:16.6,crops:['trigo','maiz','remolacha']},
 {id:'eu-austria-upper',name:'Alta Austria (Wels)',region:'eu',country:'AT',lat:48.15,lon:14.0,crops:['leche','maiz','cerdo']},
 {id:'eu-portugal-alentejo',name:'Alentejo (Beja) · montado',region:'eu',country:'PT',lat:38.0,lon:-7.9,crops:['trigo','corcho','vacuno']},
 {id:'eu-portugal-ribatejo',name:'Ribatejo (Santarém)',region:'eu',country:'PT',lat:39.2,lon:-8.7,crops:['maiz','arroz','tomate']},
 {id:'eu-belgium-hesbaye',name:'Hesbaye (Lieja, Bélgica)',region:'eu',country:'BE',lat:50.65,lon:5.1,crops:['trigo','remolacha','patata']},
 {id:'eu-belgium-flanders',name:'Flandes Occidental (Roeselare, Bélgica)',region:'eu',country:'BE',lat:50.95,lon:3.1,crops:['patata','cerdo','maiz']}
];
const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const round=(n,d=1)=>Number(n.toFixed(d));
async function getJson(url){for(let i=0;i<3;i++){try{const r=await fetch(url);if(r.ok)return await r.json();console.error('HTTP',r.status,url)}catch(e){console.error(e.message)}await new Promise(r=>setTimeout(r,2000*(i+1)))}return null}
const year=new Date().getUTCFullYear();
const HIST_START=1981; // toda la historia mensual que da la fuente (NASA POWER empieza en 1981)
const out=[],missing=[],hist=[];
for(const loc of LOCATIONS){
 const q=`parameters=PRECTOTCORR,T2M&community=AG&longitude=${loc.lon}&latitude=${loc.lat}&format=JSON`;
 const m=await getJson(`${B}/monthly/point?${q}&start=${HIST_START}&end=${year}`);
 const c=await getJson(`${B}/climatology/point?${q}`);
 if(!m||!c){missing.push({id:loc.id,reason:'fuente no disponible'});continue}
 const P=m.properties.parameter.PRECTOTCORR,T=m.properties.parameter.T2M,CP=c.properties.parameter.PRECTOTCORR,CT=c.properties.parameter.T2M;
 const months=[];
 for(const k of Object.keys(P).sort()){
  if(!/^\d{6}$/.test(k)||k.endsWith('13'))continue;
  const y=+k.slice(0,4),mi=+k.slice(4)-1;
  const p=P[k],t=T[k],cp=CP[MON[mi]],ct=CT[MON[mi]];
  if([p,t,cp,ct].some(v=>typeof v!=='number'||v<=-990))continue;
  const days=new Date(Date.UTC(y,mi+1,0)).getUTCDate();
  months.push({period:y+'-'+String(mi+1).padStart(2,'0'),
   precipMm:round(p*days),precipBaselineMm:round(cp*days),precipAnomalyPct:round(100*(p/cp-1)),
   tempC:round(t),tempBaselineC:round(ct),tempAnomalyC:round(t-ct)});
 }
 if(months.length<3){missing.push({id:loc.id,reason:'menos de 3 meses válidos'});continue}
 // histórico compacto: una posición por mes desde HIST_START-01; null = sin dato válido (mes en curso o hueco de la fuente)
 const hp=[],ht=[];
 for(let y=HIST_START;y<=year;y++)for(let mi=0;mi<12;mi++){const k=y+String(mi+1).padStart(2,'0');const p=P[k],t=T[k];const ok=typeof p==='number'&&p>-990&&typeof t==='number'&&t>-990;hp.push(ok?round(p,2):null);ht.push(ok?round(t,2):null)}
 hist.push({id:loc.id,precipMmDay:hp,tempC:ht,baselinePrecipMmDay:MON.map(k=>round(CP[k],2)),baselineTempC:MON.map(k=>round(CT[k],2))});
 out.push({id:loc.id,name:loc.name,region:loc.region,country:loc.country,lat:loc.lat,lon:loc.lon,crops:loc.crops,months:months.slice(-12)});
}
if(out.length<8){console.error('Demasiados puntos sin datos ('+missing.length+'); no se sobrescribe data/climate.json');process.exit(1)}
const lastPeriod=out.map(l=>l.months[l.months.length-1].period).sort().pop();
const result={schemaVersion:'1.0',generatedAt:new Date().toISOString(),lastPeriod,baseline:'2001-2020',
 source:{name:'NASA POWER (Prediction Of Worldwide Energy Resources), reanálisis MERRA-2',url:'https://power.larc.nasa.gov/',license:'Datos de NASA de uso libre; se cita la fuente.',parameters:{precipitation:'PRECTOTCORR (mm/día, convertido a mm/mes)',temperature:'T2M (°C, media mensual a 2 m)'}},
 methodology:{es:'Para cada punto representativo de una región productora se toma la precipitación y la temperatura media mensuales del reanálisis MERRA-2 (NASA POWER) y se comparan con la climatología 2001-2020 del mismo mes. La precipitación se expresa como % sobre la media y la temperatura como diferencia en °C. Son datos de reanálisis en una celda de malla (~50 km), no de estaciones ni promedios de la región entera, y solo se publican los meses cerrados con dato válido. Miden desviación climática, no predicen cosechas ni precios.',
  en:'For each representative point in a producing region, monthly precipitation and mean temperature from the MERRA-2 reanalysis (NASA POWER) are compared with the 2001-2020 climatology for the same month. Precipitation is shown as % of the mean and temperature as a difference in °C. It is reanalysis data for a grid cell (~50 km), not station data or a whole-region average, and only closed months with valid data are published. They measure climatic deviation and do not forecast crops or prices.'},
 missing,locations:out};
await writeFile(path.join(root,'data','climate-history.json'),JSON.stringify({schemaVersion:'1.0',generatedAt:result.generatedAt,start:HIST_START+'-01',baseline:'2001-2020',source:result.source,units:{precipMmDay:'mm/día (media del mes)',tempC:'°C (media mensual)'},note:'Una posición por mes desde start; null = sin dato válido. La climatología (baseline*) es la media 2001-2020 de cada mes del año (enero a diciembre).',locations:hist})+'\n');
await writeFile(path.join(root,'data','climate.json'),JSON.stringify(result,null,2)+'\n');
console.log('Clima: '+out.length+' puntos, último mes '+lastPeriod+(missing.length?' · sin datos: '+missing.map(x=>x.id).join(','):''));
