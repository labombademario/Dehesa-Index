#!/usr/bin/env node
// Clima por provincia de España: precipitación y temperatura mensuales frente a la media 2001-2020 del mismo mes
// (NASA POWER, reanálisis MERRA-2) en un punto por provincia: su capital. NO son estaciones ni promedios de la
// provincia: es la celda de la malla (~50 km) que contiene la capital. La media 2001-2020 se calcula aquí con los mismos datos mensuales de la fuente (mes a mes, 15 años válidos como mínimo).
// Si la fuente falla o devuelve -999, ese dato no se escribe (no se inventa ni se rellena). Con pocas provincias
// validas no se sobrescribe el fichero.
import {readFile,writeFile} from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const B=process.env.POWER_BASE||'https://power.larc.nasa.gov/api/temporal';
// codigo INE de provincia (el mismo que usa data/spain-crops y data/spain-livestock) -> capital y coordenadas
const P=[
 ['01','Vitoria-Gasteiz',42.85,-2.67],['02','Albacete',38.99,-1.86],['03','Alicante',38.35,-0.48],['04','Almería',36.84,-2.46],['05','Ávila',40.66,-4.70],
 ['06','Badajoz',38.88,-6.97],['07','Palma',39.57,2.65],['08','Barcelona',41.39,2.17],['09','Burgos',42.34,-3.70],['10','Cáceres',39.47,-6.37],
 ['11','Cádiz',36.53,-6.29],['12','Castellón de la Plana',39.99,-0.04],['13','Ciudad Real',38.99,-3.93],['14','Córdoba',37.89,-4.78],['15','A Coruña',43.37,-8.40],
 ['16','Cuenca',40.07,-2.14],['17','Girona',41.98,2.82],['18','Granada',37.18,-3.60],['19','Guadalajara',40.63,-3.17],['20','San Sebastián',43.32,-1.98],
 ['21','Huelva',37.26,-6.95],['22','Huesca',42.14,-0.41],['23','Jaén',37.78,-3.79],['24','León',42.60,-5.57],['25','Lleida',41.62,0.62],
 ['26','Logroño',42.47,-2.45],['27','Lugo',43.01,-7.56],['28','Madrid',40.42,-3.70],['29','Málaga',36.72,-4.42],['30','Murcia',37.99,-1.13],
 ['31','Pamplona',42.82,-1.64],['32','Ourense',42.34,-7.86],['33','Oviedo',43.36,-5.85],['34','Palencia',42.01,-4.53],['35','Las Palmas de Gran Canaria',28.12,-15.43],
 ['36','Pontevedra',42.43,-8.64],['37','Salamanca',40.97,-5.66],['38','Santa Cruz de Tenerife',28.47,-16.25],['39','Santander',43.46,-3.81],['40','Segovia',40.95,-4.12],
 ['41','Sevilla',37.39,-5.99],['42','Soria',41.76,-2.47],['43','Tarragona',41.12,1.24],['44','Teruel',40.34,-1.11],['45','Toledo',39.86,-4.02],
 ['46','Valencia',39.47,-0.38],['47','Valladolid',41.65,-4.72],['48','Bilbao',43.26,-2.93],['49','Zamora',41.50,-5.75],['50','Zaragoza',41.65,-0.89]
];
const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const round=(n,d=1)=>Number(n.toFixed(d));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function getJson(url){for(let i=0;i<3;i++){try{const r=await fetch(url);if(r.ok)return await r.json();console.error('HTTP',r.status,url)}catch(e){console.error(e.message)}await wait(2000*(i+1))}return null}
const year=new Date().getUTCFullYear();
const provinces=[],missing=[];
for(const [code,city,lat,lon] of P){
 const q=`parameters=PRECTOTCORR,T2M&community=AG&longitude=${lon}&latitude=${lat}&format=JSON`;
 const m=await getJson(`${B}/monthly/point?${q}&start=2001&end=${year}`); await wait(300);
 if(!m){missing.push({id:code,reason:'fuente no disponible'});continue}
 let Pr,Tm;
 try{Pr=m.properties.parameter.PRECTOTCORR;Tm=m.properties.parameter.T2M}catch(e){missing.push({id:code,reason:'respuesta inesperada'});continue}
 const ok=(p,t)=>typeof p==='number'&&p>-990&&typeof t==='number'&&t>-990;
 // media 2001-2020 de cada mes calendario (mm/dia y grados), calculada aqui con los mismos datos mensuales: hacen falta 15 anos validos
 const sp=Array(12).fill(0),st=Array(12).fill(0),n=Array(12).fill(0);
 for(let y=2001;y<=2020;y++)for(let mi=0;mi<12;mi++){const k=y+String(mi+1).padStart(2,'0');if(ok(Pr[k],Tm[k])){sp[mi]+=Pr[k];st[mi]+=Tm[k];n[mi]++}}
 if(n.some(v=>v<15)){missing.push({id:code,reason:'menos de 15 años válidos para la media 2001-2020'});continue}
 const months=[];
 for(const k of Object.keys(Pr).sort()){
  if(!/^\d{6}$/.test(k)||k.endsWith('13'))continue;
  const y=+k.slice(0,4),mi=+k.slice(4)-1;
  if(y<year-2||!ok(Pr[k],Tm[k]))continue;
  const cp=sp[mi]/n[mi],ct=st[mi]/n[mi]; if(!(cp>0))continue;
  const days=new Date(Date.UTC(y,mi+1,0)).getUTCDate(),p=Pr[k],t=Tm[k];
  months.push({period:y+'-'+String(mi+1).padStart(2,'0'),precipMm:round(p*days),precipBaselineMm:round(cp*days),precipAnomalyPct:round(100*(p/cp-1)),tempC:round(t),tempBaselineC:round(ct),tempAnomalyC:round(t-ct)});
 }
 if(months.length<3){missing.push({id:code,reason:'menos de 3 meses válidos'});continue}
 provinces.push({id:code,city,lat,lon,months:months.slice(-12)});
}
if(provinces.length<40){console.error('Demasiadas provincias sin datos ('+missing.length+'); no se sobrescribe data/es-climate-provinces.json');process.exit(1)}
const lastPeriod=provinces.map(v=>v.months[v.months.length-1].period).sort().pop();
const result={schemaVersion:'1.0',generatedAt:new Date().toISOString(),lastPeriod,baseline:'2001-2020',
 source:{id:'nasa_power',name:'NASA POWER (Prediction Of Worldwide Energy Resources), reanálisis MERRA-2',url:'https://power.larc.nasa.gov/',license:'Datos de NASA de uso libre; se cita la fuente.',parameters:{precipitation:'PRECTOTCORR (mm/día, convertido a mm/mes)',temperature:'T2M (°C, media mensual a 2 m)'}},
 methodology:{es:'Para cada provincia se toma el punto de su capital y se obtienen la precipitación y la temperatura media mensuales del reanálisis MERRA-2 (NASA POWER), que se comparan con la climatología 2001-2020 del mismo mes. La precipitación se expresa como % sobre la media y la temperatura como diferencia en °C. Son datos de reanálisis en una celda de malla (~50 km) que contiene la capital, no de estaciones ni promedios de toda la provincia; en islas y costas la celda mezcla tierra y mar. Solo se publican los meses cerrados con dato válido. Miden desviación climática, no predicen cosechas ni precios.',
  en:'For each province the point of its capital city is used and the monthly precipitation and mean temperature from the MERRA-2 reanalysis (NASA POWER) are compared with the 2001-2020 climatology for the same month. Precipitation is shown as % of the mean and temperature as a difference in °C. It is reanalysis data for one grid cell (~50 km) containing the capital, not station data or a whole-province average; on islands and coasts the cell mixes land and sea. Only closed months with valid data are published. They measure climatic deviation and do not forecast crops or prices.'},
 missing,provinces};
await writeFile(path.join(root,'data','es-climate-provinces.json'),JSON.stringify(result)+'\n');
console.log('Clima por provincia: '+provinces.length+' provincias, último mes '+lastPeriod+(missing.length?' · sin datos: '+missing.map(x=>x.id).join(','):''));
