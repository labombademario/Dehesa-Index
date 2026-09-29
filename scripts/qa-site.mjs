#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd(), failures=[], checks=[];
async function read(rel){return readFile(path.join(root,rel),'utf8');}
function check(name,value){checks.push([name,!!value]);if(!value)failures.push(name);}

const rootPages=['index.html','precios.html','noticias.html','calendario.html','informacion.html','blog.html','empresas.html','contacto.html'];
for(const file of rootPages){const c=await read(file);check(file+' has shared.js',c.includes('js/shared.js'));check(file+' has viewport',c.includes('name="viewport"'));}
for(const product of ['trigo','maiz','leche','urea','diesel']){
 const c=await read('precios/'+product+'/index.html');
 check(product+' landing -> prices',c.includes('precios.html?product='+product));
 check(product+' landing -> news',c.includes('noticias.html?product='+(product==='urea'?'fertilizantes':product)));
 check(product+' landing -> calendar',c.includes('calendario.html?crop='));
}
const shared=await read('js/shared.js');
check('nested footer logo uses sitePath',shared.includes("sitePath('assets/logo.png')"));
check('context bar exists',shared.includes('function renderContextBar'));
check('context back uses history.back',shared.includes('window.history.back()'));

const prices=await read('js/precios.js');
check('price URL sync uses pushState',prices.includes('history.pushState'));
check('price URL restores popstate',prices.includes("addEventListener('popstate', restorePriceUrl)"));
check('price category ids are canonical',prices.includes("['cereales','lacteos','fertilizantes','energia','seguro','vino','madera']"));

const news=await read('js/noticias.js');
check('news URL sync uses pushState',news.includes('history.pushState'));
check('news URL restores popstate',news.includes("addEventListener('popstate'"));
check('news has direct price navigation',news.includes('di-news-item-price-link'));

const cal=await read('js/calendario.js');
check('calendar URL sync uses pushState',cal.includes('history.pushState'));
check('calendar URL restores popstate',cal.includes("addEventListener('popstate'"));
check('calendar avoids false barley mapping',!cal.includes("cebada:'trigo'"));
check('calendar avoids false soy mapping',!cal.includes("soja:'maiz'"));

for(const file of ['data/latest.json','data/history.json','data/catalog.json','data/api.json','data/quality.json']){
 try{JSON.parse(await read(file));check(file+' valid JSON',true);}catch(e){check(file+' valid JSON',false);}
}
for(const file of ['data/intelligence.json','data/normalized.json','data/cross-market.json','data/alerts.json']){
 try{JSON.parse(await read(file));check(file+' valid JSON',true);}catch(e){check(file+' generated when present',e.code==='ENOENT');}
}
const latest=JSON.parse(await read('data/latest.json'));
check('latest has observations',Array.isArray(latest.observations)&&latest.observations.length>0);
try {
 const intelligence=JSON.parse(await read('data/intelligence.json')); check('intelligence has schema v2',intelligence.schemaVersion==='2.0');
 const normalized=JSON.parse(await read('data/normalized.json')); check('normalized has policy',normalized.policy&&normalized.policy.neverTreatIndexAsPrice===true);
 const relationships=JSON.parse(await read('data/cross-market.json')); check('relationship engine has v2 schema',relationships.schemaVersion==='2.0'); check('relationship engine documents causality caveat',relationships.methodology&&relationships.methodology.causality==='No causal inference.');
 const alerts=JSON.parse(await read('data/alerts.json')); check('alerts are informational',alerts.status==='informational');
} catch(e) { if(e.code!=='ENOENT') throw e; }

for(const o of latest.observations){
 check(o.id+' verified',o.status==='verified');
 check(o.id+' has source',!!o.sourceId);
 check(o.id+' has observation date',/^\d{4}-\d{2}/.test(o.observationDate||''));
}
const passed=checks.filter(x=>x[1]).length;
console.log('Dehesa Index QA: '+passed+'/'+checks.length+' checks passed');
if(failures.length){console.error('FAILURES');failures.forEach(x=>console.error(' - '+x));process.exit(1);}
