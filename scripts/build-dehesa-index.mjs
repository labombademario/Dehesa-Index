#!/usr/bin/env node
// Dehesa Index (UE): índice compuesto mensual, base 100, construido SOLO con series verificadas
// de data/latest.json. No inventa datos: series sin historia suficiente quedan fuera y se listan.
import {readFile,writeFile} from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd();
const latest=JSON.parse(await readFile(path.join(root,'data','latest.json'),'utf8'));
const REGIONS={
 eu:{file:'dehesa-index.json',label:{es:'UE',en:'EU'},groups:[
 {id:'cereales',weight:25,members:['trigo','maiz','arroz']},
 {id:'ganaderia',weight:25,members:['cerdo','vaca','cordero','pollo','huevos']},
 {id:'lacteos',weight:15,members:['leche']},
 {id:'pienso',weight:15,members:['harina_soja']},
 {id:'fertilizantes',weight:10,members:['dap','potasa']},
 {id:'energia',weight:10,members:['diesel','petroleo_brent','gas_natural']}
 ],limits:'Solo mercado UE: US tiene su propio índice (dehesa-index-us.json) y UK no tiene series de precio verificadas con historia; se añadirá cuando alcance ≥24 meses.'},
 ca:{file:'dehesa-index-ca.json',label:{es:'Canadá',en:'Canada'},lastFromSeries:true,groups:[
 {id:'cereales',weight:25,members:['trigo','maiz','cebada','avena']},
 {id:'ganaderia',weight:25,members:['cerdo','vaca','cordero','pollo','huevos']},
 {id:'lacteos',weight:15,members:['leche']},
 {id:'pienso',weight:15,members:['harina_soja']},
 {id:'fertilizantes',weight:10,members:['urea','dap','potasa']},
 {id:'energia',weight:10,members:['diesel','petroleo_wti','gas_natural']}
 ],limits:'Solo Canadá (Statistics Canada, tabla 32-10-0077, precios al productor en dólares canadienses). Sin grupos de pienso, fertilizantes y energía: no hay series verificadas de Canadá con historia suficiente; el resto de pesos se reescala. Cada serie usa la provincia de referencia de su ficha. Statistics Canada publica con unos dos meses de retraso, por lo que el último mes del índice es el último mes con dato de todas las series (las semanales de Alberta no entran: solo cubren unos 20 meses).'},
 us:{file:'dehesa-index-us.json',label:{es:'EE. UU.',en:'US'},groups:[
 {id:'cereales',weight:25,members:['trigo','maiz','arroz']},
 {id:'ganaderia',weight:25,members:['cerdo','vaca','pollo','huevos']},
 {id:'lacteos',weight:15,members:['leche']},
 {id:'pienso',weight:15,members:['harina_soja']},
 {id:'fertilizantes',weight:10,members:['urea','dap','potasa']},
 {id:'energia',weight:10,members:['diesel','petroleo_wti','gas_natural']}
 ],limits:'Solo EE. UU. (USDA NASS, USDA AMS, EIA). Sin grupo de fertilizantes: no hay serie verificada de fertilizantes de EE. UU. (la urea de DTN no tiene licencia pública); el resto de pesos se reescala. Cordero no tiene serie mensual de NASS. Petróleo WTI en lugar de Brent. Base 2024-10 (la de la UE) porque la harina de soja de AMS solo tiene historia desde sep-2024.'}
};
const BASE='2024-10'; // primer mes completo con todas las series semanales
const pad=n=>String(n).padStart(2,'0');
const MN={JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12};
function monthKey(h){const p=String(h.period);const m=/^\d{2}-\d{2}$/.test(p)?p.slice(0,2):pad(MN[p.toUpperCase()]||Number(p));return h.year+'-'+m}
function monthly(o){const acc={};for(const h of o.history){const v=Number(h.value);if(!Number.isFinite(v))continue;const k=monthKey(h);(acc[k]??=[]).push(v)}
 const out={};for(const k of Object.keys(acc))out[k]=acc[k].reduce((s,x)=>s+x,0)/acc[k].length;return out}
const NAMES={es:{cereales:'Cereales',ganaderia:'Ganadería',lacteos:'Lácteos',pienso:'Pienso',fertilizantes:'Fertilizantes',energia:'Energía'},en:{cereales:'Cereals',ganaderia:'Livestock',lacteos:'Dairy',pienso:'Feed',fertilizantes:'Fertilisers',energia:'Energy'}};
for(const [reg,cfg] of Object.entries(REGIONS)){
const GROUPS=cfg.groups;const obs=latest.observations.filter(o=>o.status==='verified'&&o.region===reg&&Array.isArray(o.history));
const lastComplete=cfg.lastFromSeries?(()=>{ // región con fuente mensual retrasada: último mes con dato de TODAS las series de los grupos
 const ms=GROUPS.flatMap(g=>g.members).map(p=>obs.find(x=>x.product===p)).filter(Boolean).map(o=>Object.keys(monthly(o)).sort().pop());return ms.sort()[0]})():(()=>{ // último mes cerrado: excluye el mes en curso de la última observación semanal
 const d=obs.map(o=>o.observationDate).sort().pop();const ym=d.slice(0,7);const [y,m]=ym.split('-').map(Number);const pm=m===1?[y-1,12]:[y,m-1];return pm[0]+'-'+pad(pm[1])})();
const months=[];{let [y,m]=BASE.split('-').map(Number);while((y+'-'+pad(m))<=lastComplete){months.push(y+'-'+pad(m));m++;if(m>12){m=1;y++}}}
const included=[],excluded=[],groupSeries={};
for(const g of GROUPS){const rebased=[];
 for(const p of g.members){const o=obs.find(x=>x.product===p);
  if(!o){excluded.push({product:p,reason:'sin serie verificada'});continue}
  const mo=monthly(o);const base=mo[BASE];const filled=[];
  // hueco aislado de 1 mes en el origen: se arrastra el mes anterior y se declara (no se inventa nada más)
  months.forEach((m,i)=>{if(mo[m]===undefined&&i>0&&mo[months[i-1]]!==undefined&&mo[months[i+1]]!==undefined){mo[m]=mo[months[i-1]];filled.push(m)}});
  if(!base||months.some(m=>mo[m]===undefined)){excluded.push({product:p,reason:'historia insuficiente para el periodo del índice'});continue}
  included.push({group:g.id,product:p,sourceId:o.sourceId,unit:o.unit,currency:o.currency,basePeriod:BASE,baseValue:Number(base.toFixed(4)),gapFilledMonths:filled});
  rebased.push(months.map(m=>100*mo[m]/base))}
 if(!rebased.length){excluded.push({group:g.id,reason:'grupo sin series'});continue}
 groupSeries[g.id]=months.map((_,i)=>rebased.reduce((s,r)=>s+r[i],0)/rebased.length)}
const active=GROUPS.filter(g=>groupSeries[g.id]);const wsum=active.reduce((s,g)=>s+g.weight,0);
const r2=n=>Number(n.toFixed(2));
const series=months.map((m,i)=>({period:m,value:r2(active.reduce((s,g)=>s+g.weight*groupSeries[g.id][i],0)/wsum),groups:Object.fromEntries(active.map(g=>[g.id,r2(groupSeries[g.id][i])]))}));
const cur=series[series.length-1],prev=series[series.length-2],yoyBase=series[series.length-13];
const result={schemaVersion:'1.0',generatedAt:new Date().toISOString(),region:reg,base:{period:BASE,value:100},lastPeriod:cur.period,
 value:cur.value,changeMoMPct:prev?r2(100*(cur.value/prev.value-1)):null,changeYoYPct:yoyBase?r2(100*(cur.value/yoyBase.value-1)):null,
 weights:Object.fromEntries(active.map(g=>[g.id,r2(100*g.weight/wsum)])),
 groups:active.map(g=>({id:g.id,weightPct:r2(100*g.weight/wsum),value:r2(groupSeries[g.id][months.length-1]),members:included.filter(x=>x.group===g.id).map(x=>x.product)})),
 included,excluded,series,
 methodology:{es:'Índice mensual base 100 = '+BASE+'. Cada serie verificada se convierte a media mensual y se reexpresa a base 100; cada grupo es la media simple de sus series; el índice es la media ponderada de los grupos ('+active.map(g=>NAMES.es[g.id]+' '+r2(100*g.weight/wsum)).join(', ')+'). Solo usa series REAL de data/latest.json; las series sin historia suficiente se excluyen y se listan. Huecos aislados de un mes en el origen se rellenan con el mes anterior y se declaran en gapFilledMonths. No mezcla monedas: cada serie se reexpresa en su propia unidad (números índice), por lo que es una medida de evolución, no un precio. No es asesoramiento financiero.',en:'Monthly index, base 100 = '+BASE+'. Each verified series is converted to a monthly average and rebased to 100; each group is the simple mean of its series; the index is the weighted mean of groups ('+active.map(g=>NAMES.en[g.id]+' '+r2(100*g.weight/wsum)).join(', ')+'). It uses only verified series from data/latest.json; series without enough history are excluded and listed. Each series is rebased in its own unit, so it measures evolution, not a price. Not financial advice.'},
 limits:cfg.limits};
await writeFile(path.join(root,'data',cfg.file),JSON.stringify(result,null,2)+'\n');
console.log('Dehesa Index '+reg.toUpperCase()+' '+cur.period+': '+cur.value+' (MoM '+result.changeMoMPct+'%, YoY '+result.changeYoYPct+'%) · incluidas '+included.length+' · excluidas '+excluded.length);

}
