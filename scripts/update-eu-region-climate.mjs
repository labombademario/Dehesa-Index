#!/usr/bin/env node
// Clima por region de Belgica, Austria, Grecia, Italia y Alemania (las mismas regiones que las fichas de region): precipitacion y temperatura
// mensuales frente a la media 2001-2020 del mismo mes (NASA POWER, reanalisis MERRA-2) en UN punto por region: su ciudad principal.
// NO son estaciones ni promedios de la region: es la celda de la malla (~50 km) que contiene esa ciudad. Misma metodologia que
// scripts/update-es-climate.mjs. Si la fuente falla o devuelve -999, ese dato no se escribe (no se inventa ni se rellena).
import {readFile,writeFile} from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const B=process.env.POWER_BASE||'https://power.larc.nasa.gov/api/temporal';
// pais -> [id de la region en la ficha, ciudad de referencia, lat, lon]
const C={
 BE:[['BRU','Bruxelles',50.85,4.35],['VAN','Antwerpen',51.22,4.40],['VLI','Hasselt',50.93,5.34],['VOV','Gent',51.05,3.72],['VBR','Leuven',50.88,4.70],['VWV','Brugge',51.21,3.22],['WBR','Wavre',50.72,4.61],['WHT','Mons',50.45,3.95],['WLG','Liège',50.63,5.57],['WLX','Arlon',49.68,5.82],['WNA','Namur',50.47,4.87]],
 AT:[['B','Eisenstadt',47.85,16.52],['NO','St. Pölten',48.20,15.63],['W','Wien',48.21,16.37],['K','Klagenfurt',46.62,14.31],['ST','Graz',47.07,15.44],['OO','Linz',48.31,14.29],['S','Salzburg',47.80,13.04],['T','Innsbruck',47.26,11.39],['V','Bregenz',47.50,9.75]],
 EL:[['ATT','Athína',37.98,23.73],['NAE','Mytilíni',39.11,26.55],['SAE','Ermoúpoli',37.44,24.94],['KRI','Irákleio',35.34,25.14],['EMT','Komotiní',41.12,25.41],['KMA','Thessaloníki',40.64,22.94],['DMA','Kozáni',40.30,21.79],['IPE','Ioánnina',39.67,20.85],['THS','Lárisa',39.64,22.42],['ION','Kérkyra',39.62,19.92],['WGR','Pátra',38.25,21.73],['CGR','Lamía',38.90,22.43],['PEL','Trípoli',37.51,22.37]],
 IT:[['PIE','Torino',45.07,7.69],['VDA','Aosta',45.74,7.32],['LIG','Genova',44.41,8.93],['LOM','Milano',45.46,9.19],['ABR',"L'Aquila",42.35,13.40],['MOL','Campobasso',41.56,14.66],['CAM','Napoli',40.85,14.27],['PUG','Bari',41.12,16.87],['BAS','Potenza',40.64,15.80],['CAL','Catanzaro',38.91,16.59],['SIC','Palermo',38.12,13.36],['SAR','Cagliari',39.22,9.12],['TAA','Bolzano',46.50,11.35],['VEN','Padova',45.41,11.88],['FVG','Udine',46.06,13.24],['EMR','Bologna',44.49,11.34],['TOS','Firenze',43.77,11.26],['UMB','Perugia',43.11,12.39],['MAR','Ancona',43.62,13.52],['LAZ','Roma',41.90,12.50]],
 DE:[['BW','Stuttgart',48.78,9.18],['BY','München',48.14,11.58],['BE','Berlin',52.52,13.40],['BB','Potsdam',52.40,13.07],['HB','Bremen',53.08,8.80],['HH','Hamburg',53.55,9.99],['HE','Wiesbaden',50.08,8.24],['MV','Schwerin',53.63,11.41],['NI','Hannover',52.37,9.73],['NW','Düsseldorf',51.23,6.78],['RP','Mainz',50.00,8.27],['SL','Saarbrücken',49.24,6.99],['SN','Dresden',51.05,13.74],['ST','Magdeburg',52.13,11.63],['SH','Kiel',54.32,10.14],['TH','Erfurt',50.98,11.03]]
};
const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const round=(n,d=1)=>Number(n.toFixed(d));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function getJson(url){for(let i=0;i<3;i++){try{const r=await fetch(url);if(r.ok)return await r.json();console.error('HTTP',r.status,url)}catch(e){console.error(e.message)}await wait(2000*(i+1))}return null}
const year=new Date().getUTCFullYear();
const countries={},missing=[],bad=[];
for(const cc of Object.keys(C)){ const regs={};
for(const [code,city,lat,lon] of C[cc]){
 const q=`parameters=PRECTOTCORR,T2M&community=AG&longitude=${lon}&latitude=${lat}&format=JSON`;
 const m=await getJson(`${B}/monthly/point?${q}&start=1991&end=${year}`); await wait(300);
 if(!m){missing.push({id:cc+'/'+code,reason:'fuente no disponible'});continue}
 let Pr,Tm;
 try{Pr=m.properties.parameter.PRECTOTCORR;Tm=m.properties.parameter.T2M}catch(e){missing.push({id:cc+'/'+code,reason:'respuesta inesperada'});continue}
 // valores imposibles de la fuente (p. ej. >48 mm/dia = mas de 1500 mm al mes, como los de ene-mar 2026 en el sur de Italia y Cerdena): se descartan y se listan, nunca se corrigen
 // y, desde 2021, una lluvia mensual de mas del triple del maximo 1991-2020 de ese punto en ese mes (Cagliari, marzo de 2026: 39 mm/dia de media, 1.217 mm en el mes)
 const MX=Array(12).fill(0);for(let y=1991;y<=2020;y++)for(let mi=0;mi<12;mi++){const v=Pr[y+String(mi+1).padStart(2,'0')];if(typeof v==='number'&&v>-990&&v<=48&&v>MX[mi])MX[mi]=v}
 let K='';const ok=(p,t)=>{const v=typeof p==='number'&&p>-990&&typeof t==='number'&&t>-990;const y=+K.slice(0,4),mi=+K.slice(4)-1;
  if(v&&(p>48||(y>2020&&p>3&&MX[mi]>0&&p>3*MX[mi]))){bad.push({id:cc+'/'+code,reason:'precipitacion imposible en la fuente ('+p+' mm/dia en '+K.slice(0,4)+'-'+K.slice(4)+')'});return false}return v};
 // media 2001-2020 de cada mes calendario (mm/dia y grados), calculada aqui con los mismos datos mensuales: hacen falta 15 anos validos
 const sp=Array(12).fill(0),st=Array(12).fill(0),n=Array(12).fill(0);
 for(let y=2001;y<=2020;y++)for(let mi=0;mi<12;mi++){const k=y+String(mi+1).padStart(2,'0');K=k;if(ok(Pr[k],Tm[k])){sp[mi]+=Pr[k];st[mi]+=Tm[k];n[mi]++}}
 if(n.some(v=>v<15)){missing.push({id:cc+'/'+code,reason:'menos de 15 años válidos para la media 2001-2020'});continue}
 // medias por mes calendario con las cifras que se publican (mm/dia a 6 decimales, grados a 3): la pagina recalcula con ellas el historico y coincide con lo que se publica
 const bp=sp.map((v,i)=>round(v/n[i],6)),bt=st.map((v,i)=>round(v/n[i],3));
 const months=[];
 for(const k of Object.keys(Pr).sort()){
  if(!/^\d{6}$/.test(k)||k.endsWith('13'))continue;
  const y=+k.slice(0,4),mi=+k.slice(4)-1;
  K=k;if(y<year-2||!ok(Pr[k],Tm[k]))continue;
  const cp=bp[mi],ct=bt[mi]; if(!(cp>0))continue;
  const days=new Date(Date.UTC(y,mi+1,0)).getUTCDate(),p=Pr[k],t=Tm[k];
  const rp=round(p*days),rb=round(cp*days),rt=round(t),rbt=round(ct); if(!(rb>0))continue;  // las anomalías se calculan con las cifras ya redondeadas, para que cuadren con lo que se publica
  months.push({period:y+'-'+String(mi+1).padStart(2,'0'),precipMm:rp,precipBaselineMm:rb,precipAnomalyPct:round(100*(rp/rb-1)),tempC:rt,tempBaselineC:rbt,tempAnomalyC:round(rt-rbt)});
 }
 // historico completo desde 2001: lluvia (mm/mes) y temperatura (°C) mes a mes, null = sin dato valido; las medias 2001-2020 van aparte, una por mes del año
 const hk=Object.keys(Pr).filter(k=>/^\d{6}$/.test(k)&&!k.endsWith('13')&&+k.slice(0,4)>=2001).sort();
 const hp=[],ht=[];
 for(const k of hk){const y=+k.slice(0,4),mi=+k.slice(4)-1,days=new Date(Date.UTC(y,mi+1,0)).getUTCDate();
  K=k;const tv=typeof Tm[k]==='number'&&Tm[k]>-990;if(ok(Pr[k],Tm[k])){hp.push(round(Pr[k]*days));ht.push(round(Tm[k]))}else{hp.push(null);ht.push(tv?round(Tm[k]):null)}}   // lluvia descartada: la temperatura del mes se conserva
 const history={from:'2001-01',p:hp,t:ht,baseMmDay:bp,baseTempC:bt};
 if(months.length<3){missing.push({id:cc+'/'+code,reason:'menos de 3 meses válidos'});continue}
 regs[code]={city,lat,lon,months:months.slice(-12),history};
}
missing.push(...[...new Map(bad.map(x=>[x.id,x])).values()]);bad.length=0;
countries[cc]=regs; }
const total=Object.values(countries).reduce((a,r)=>a+Object.keys(r).length,0);
if(total<55){console.error('Demasiadas regiones sin datos ('+missing.length+'); no se sobrescribe data/eu-region-climate.json');process.exit(1)}
const lastPeriod=Object.values(countries).flatMap(r=>Object.values(r)).map(v=>v.months[v.months.length-1].period).sort().pop();
const result={schemaVersion:'1.0',generatedAt:new Date().toISOString(),lastPeriod,baseline:'2001-2020',
 source:{id:'nasa_power',name:'NASA POWER (Prediction Of Worldwide Energy Resources), reanálisis MERRA-2',url:'https://power.larc.nasa.gov/',license:'Datos de NASA de uso libre; se cita la fuente.',parameters:{precipitation:'PRECTOTCORR (mm/día, convertido a mm/mes)',temperature:'T2M (°C, media mensual a 2 m)'}},
 methodology:{
  es:'Para cada región se toma el punto de su ciudad principal y se obtienen la precipitación y la temperatura media mensuales del reanálisis MERRA-2 (NASA POWER), que se comparan con la climatología 2001-2020 del mismo mes. Es la celda de malla (~50 km) que contiene esa ciudad, no una estación ni el promedio de toda la región; en costas y montaña la celda puede no representar la región entera. Solo se publican los meses cerrados con dato válido. Miden desviación climática, no predicen cosechas ni precios. La lluvia de la fuente trae a veces valores imposibles (sobre todo en el sur de Italia y Cerdeña desde 2025 y en Dinamarca en marzo y abril de 2024): si un mes pasa de 48 mm al día de media o triplica el máximo 1991-2020 de ese mes en ese punto, no se publica.',
  en:'For each region the point of its main city is used and the monthly precipitation and mean temperature from the MERRA-2 reanalysis (NASA POWER) are compared with the 2001-2020 climatology for the same month. It is the grid cell (~50 km) containing that city, not a station or a whole-region average; on coasts and in mountains the cell may not represent the whole region. Only closed months with valid data are published. They measure climate deviation and do not predict harvests or prices. The source rainfall sometimes has impossible values (above all in southern Italy and Sardinia since 2025, and in Denmark in March and April 2024): if a month averages over 48 mm a day or triples the 1991-2020 maximum for that month at that point, it is not published.'},
 countries,missing};
await writeFile(path.join(root,'data','eu-region-climate.json'),JSON.stringify(result)+'\n');
console.log('Clima por región: '+total+' regiones, último mes '+lastPeriod+(missing.length?' · sin datos o con meses descartados por la fuente: '+missing.map(x=>x.id).join(','):''));
