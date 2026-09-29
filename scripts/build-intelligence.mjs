#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const h=JSON.parse(await readFile(path.join(root,'data','history.json'),'utf8')).observations||[];
const groups={};
for(const o of h){const k=[o.product,o.region,o.sourceId,o.frequency,o.unit,o.currency].join('|');(groups[k]??=[]).push(o);}
const out=[];
for(const [k,arr0] of Object.entries(groups)){
 const arr=arr0.sort((a,b)=>String(a.observationDate).localeCompare(String(b.observationDate)));
 const vals=arr.map(x=>Number(x.value)).filter(Number.isFinite);
 if(vals.length<3) continue;
 const last=vals[vals.length-1], prev=vals[vals.length-2];
 const changes=vals.slice(1).map((v,i)=>vals[i]?v/vals[i]-1:null).filter(Number.isFinite);
 const vol=changes.length>=3?Math.sqrt(changes.reduce((s,x)=>s+x*x,0)/changes.length-(changes.reduce((s,x)=>s+x,0)/changes.length)**2):null;
 const quarterly=arr[0]?.frequency==='quarterly';
 const monthly=arr[0]?.frequency==='monthly';
 const yoy=quarterly&&vals.length>=5?((last/vals[vals.length-5])-1)*100:(monthly&&vals.length>=13?((last/vals[vals.length-13])-1)*100:null);
 out.push({id:arr[0].id.replace(/:\d{4}-\d{2}-\d{2}$/,''),product:arr[0].product,region:arr[0].region,sourceId:arr[0].sourceId,frequency:arr[0].frequency,unit:arr[0].unit,currency:arr[0].currency,latest:last,observationDate:arr[arr.length-1].observationDate,periodChangePct:prev?((last/prev)-1)*100:null,yoyPct:yoy,volatility:vol,points:vals.length,coverageStart:arr[0].observationDate,coverageEnd:arr[arr.length-1].observationDate,status:arr.every(x=>x.status==='verified')?'verified':'pending',comparability:arr[arr.length-1].comparability||'review'});
}
const thresholds={momentum:{minPoints:3},volatility:{minPoints:6},yoy:{quarterlyMinPoints:5,monthlyMinPoints:13},seasonality:{monthlyMinPoints:24}};
const result={schemaVersion:'2.0',generatedAt:new Date().toISOString(),engine:'Dehesa Intelligence Engine 2.0',methodology:{noSyntheticSeries:true,momentum:'last observation versus previous observation',yoy:'same quarter or same month year-ago observation when sufficient coverage exists',volatility:'standard deviation of period returns when >=6 observations',seasonality:'disabled until >=24 monthly observations',correlation:'disabled unless common-date coverage is sufficient'},thresholds,series:out};
await writeFile(path.join(root,'data','intelligence.json'),JSON.stringify(result,null,2)+'\n');
console.log('Intelligence 2.0: '+out.length+' series.');
