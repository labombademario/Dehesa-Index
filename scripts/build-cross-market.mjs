#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const h=JSON.parse(await readFile(path.join(root,'data','history.json'),'utf8')).observations||[];
const groups={}; for(const o of h){if(o.status!=='verified')continue; const k=[o.product,o.region,o.sourceId,o.frequency].join('|');(groups[k]??=[]).push(o)}
const round=n=>Number(n.toFixed(4));
function pearson(a,b){const n=a.length,ma=a.reduce((s,x)=>s+x,0)/n,mb=b.reduce((s,x)=>s+x,0)/n;let xy=0,xx=0,yy=0;for(let i=0;i<n;i++){const x=a[i]-ma,y=b[i]-mb;xy+=x*y;xx+=x*x;yy+=y*y}return xx&&yy?xy/Math.sqrt(xx*yy):null}
function returns(arr){const m=new Map(arr.map(o=>[o.observationDate,Number(o.value)]));const dates=[...m.keys()].sort();const out=[];for(let i=1;i<dates.length;i++){const a=m.get(dates[i-1]),b=m.get(dates[i]);if(Number.isFinite(a)&&a!==0&&Number.isFinite(b))out.push({date:dates[i],value:b/a-1})}return out}
function lagged(a,b,lag){const mb=new Map(b.map(x=>[x.date,x.value]));const dates=a.map(x=>x.date);const pairs=[];for(let i=0;i<a.length;i++){const targetIndex=i+lag;if(targetIndex>=dates.length)break;const target=dates[targetIndex];if(mb.has(target))pairs.push([a[i].value,mb.get(target),target])}return pairs}
function confidence(n,r){const coverage=n>=24?1:n>=12?.8:n>=8?.65:.45;const strength=Math.min(1,Math.abs(r));const confidence=Math.round(100*coverage*strength);return confidence>=75?'high':confidence>=55?'medium':'low'}
function windowName(n){return n>=24?'24+ periods':n>=12?'12–23 periods':n>=8?'8–11 periods':'6–7 periods'}
const relationshipCatalog=[
 {id:'fertiliser_to_cereal',from:/^urea\|/,to:/^(trigo|maiz)\|/,label:'Fertilizante → cereal',hypothesis:'La variación del coste del fertilizante y la variación del cereal pueden mostrar co-movimiento con rezagos, pero la relación depende de mercado, estructura de costes y otras variables.',preferredLags:[0,1,2,3]},
 {id:'energy_to_cereal',from:/^eurostat_energy_input_index\|/,to:/^eurostat_cereals_output_index\|/,label:'Energía → cereal',hypothesis:'Los costes de energía y los precios de producción agrícola pueden moverse conjuntamente en determinados periodos; no implica causalidad.',preferredLags:[0,1,2]},
 {id:'fertiliser_to_energy',from:/^eurostat_fertiliser_input_index\|/,to:/^eurostat_energy_input_index\|/,label:'Fertilizante ↔ energía',hypothesis:'Fertilizantes y energía son insumos agrícolas relacionados; el co-movimiento puede reflejar shocks comunes y estructura de costes.',preferredLags:[0,1,2]},
 {id:'milk_to_cereal',from:/^eurostat_milk_output_index\|/,to:/^eurostat_cereals_output_index\|/,label:'Leche ↔ cereal',hypothesis:'Los precios de leche y cereales pueden compartir factores de oferta y demanda dentro del complejo agrícola.',preferredLags:[0,1,2]},
 {id:'energy_to_fertiliser',from:/^eurostat_energy_input_index\|/,to:/^eurostat_fertiliser_input_index\|/,label:'Energía → fertilizante',hypothesis:'La energía es un insumo relevante para la fabricación de fertilizantes; esta relación estadística no identifica por sí sola causalidad.',preferredLags:[0,1,2,3]}
];
const keys=Object.keys(groups),relationships=[];
for(const spec of relationshipCatalog){
 for(const ak of keys.filter(k=>spec.from.test(k))) for(const bk of keys.filter(k=>spec.to.test(k))){
  const a=groups[ak],b=groups[bk]; if(a[0].frequency!==b[0].frequency)continue;
  const ra=returns(a),rb=returns(b); let best=null;
  for(const lag of spec.preferredLags){const p=lagged(ra,rb,lag);if(p.length<6)continue;const r=pearson(p.map(x=>x[0]),p.map(x=>x[1]));if(r!==null&&(!best||Math.abs(r)>Math.abs(best.r)))best={lag,r,pairs:p}}
  if(!best)continue;
  const n=best.pairs.length, abs=Math.abs(best.r);
  relationships.push({id:spec.id+'__'+ak+'__'+bk,label:spec.label,seriesA:{product:a[0].product,region:a[0].region,sourceId:a[0].sourceId},seriesB:{product:b[0].product,region:b[0].region,sourceId:b[0].sourceId},frequency:a[0].frequency,lagPeriods:best.lag,commonPeriods:n,window:windowName(n),correlationReturns:round(best.r),direction:best.r>=0?'positive':'negative',strength:abs>=.7?'strong':abs>=.4?'moderate':'weak',confidence:confidence(n,best.r),hypothesis:spec.hypothesis,interpretation:'Asociación estadística descriptiva en cambios; no es una predicción ni demuestra causalidad.',coverageStart:best.pairs[0]?.[2]||null,coverageEnd:best.pairs[n-1]?.[2]||null});
 }
}
const result={schemaVersion:'2.0',generatedAt:new Date().toISOString(),methodology:{method:'Pearson correlation of period returns on common dates after tested lag offsets.',minimumPeriods:6,lagPolicy:'Test only economically plausible lags defined per relationship family; choose the strongest absolute correlation for description, not prediction.',confidence:'Combines sample coverage and absolute correlation strength; not a statistical significance test.',causality:'No causal inference.'},relationships,relationshipFamilies:relationshipCatalog.map(x=>({id:x.id,label:x.label,hypothesis:x.hypothesis,preferredLags:x.preferredLags}))};
await writeFile(path.join(root,'data','cross-market.json'),JSON.stringify(result,null,2)+'\n'); console.log('Agricultural relationships: '+relationships.length);
