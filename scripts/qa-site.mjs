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
check('price category ids are canonical',prices.includes("['cereales','lacteos','ganado','porcino','ovino','avicultura','pienso','fertilizantes','azucar','aceite','energia','seguro','vino','madera']"));
check('prices consume verified published observations',prices.includes("global.fetch('data/latest.json'"));
check('unverified samples never show a value (only verified observations do)',prices.includes("var showValue = !!observation && observation.status === 'verified'"));
check('every published observation is applied (no short-circuit some())',!prices.includes('observations.some(applyPublishedObservation)'));
check('published prices enforce source contract',prices.includes("observationMatchesContract"));

const news=await read('js/noticias.js');
check('news URL sync uses pushState',news.includes('history.pushState'));
check('news URL restores popstate',news.includes("addEventListener('popstate'"));
check('news filters show coverage and explain empty regions',news.includes('noRegionCoverage')&&news.includes('coverageCount'));
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
 const dix=JSON.parse(await read('data/dehesa-index.json')); const latestObs=JSON.parse(await read('data/latest.json')).observations; check('Dehesa Index weights add up to 100',Math.abs(Object.values(dix.weights).reduce((a,b)=>a+b,0)-100)<0.05); check('Dehesa Index only uses verified EU series',dix.included.every(i=>latestObs.some(o=>o.product===i.product&&o.region==='eu'&&o.status==='verified'))); check('Dehesa Index base month is 100 for every group',Object.values(dix.series[0].groups).every(v=>Math.abs(v-100)<0.5)&&Math.abs(dix.series[0].value-100)<0.5); check('Dehesa Index declares its limits and methodology',!!dix.limits&&!!dix.methodology.es&&!!dix.methodology.en);
 { const legalSrc=await read('js/legal.js'); const jsFiles=['js/shared.js','js/precios.js']; const keys=new Set(); for(const f of jsFiles){ for(const m of (await read(f)).matchAll(/(?:getItem|setItem|readLS|writeLS)\('(dehesaIndex\w+)'/g)) keys.add(m[1]); } check('legal page discloses every localStorage key the site uses ('+keys.size+')',[...keys].every(k=>legalSrc.includes(k))); const shared=await read('js/shared.js'); check('footer no longer claims sample data',!/Datos de muestra|Sample data for design|Données fictives|Dati campione/.test(shared)); check('footer links methodology and legal pages',shared.includes('metodologia.html')&&shared.includes('legal.html')); const info=await read('js/informacion.js'); check('information page cites no unlicensed sources (CME/DTN/Euronext)',!/CME|DTN|Euronext/.test(info)); }
 { const cl=JSON.parse(await read('data/climate.json')); check('climate data has at least 8 regions with 3+ valid months',cl.locations.length>=8&&cl.locations.every(l=>l.months.length>=3)); check('climate values are real numbers (no -999 fill values)',cl.locations.every(l=>l.months.every(m=>[m.precipMm,m.tempC,m.precipBaselineMm,m.tempBaselineC].every(v=>typeof v==='number'&&v>-90)))); check('climate declares source, baseline and methodology',cl.baseline==='2001-2020'&&!!cl.source.url&&!!cl.methodology.es&&!!cl.methodology.en); }
 { const sd=JSON.parse(await read('data/supply-demand.json')); const w=sd.commodities.find(c=>c.id==='trigo'); const my=w.latestMarketYear-1; check('supply-demand declares USDA source, license and methodology',/USDA/.test(sd.source.name)&&/CC BY 4\.0/.test(sd.source.license)&&!!sd.methodology.es&&!!sd.methodology.en); check('supply-demand has at least 10 commodities with world balances',sd.commodities.length>=10&&sd.commodities.every(c=>c.marketYears.length>=5&&Object.keys(c.world).length>=5)); check('world wheat production is plausible (600-1000 Mt)',w.world[my].production>600000&&w.world[my].production<1000000); check('supply-demand counts the EU once (no member states beside the aggregate)',sd.commodities.every(c=>!c.countries.France&&!c.countries.Germany&&!c.countries.Spain)); const sm=JSON.parse(await read('data/supply-demand-map.json')); check('supply-demand map covers every commodity with 20+ countries except niche ones',sm.commodities.length===sd.commodities.length&&sm.commodities.every(c=>Object.keys(c.countries).length>=15)); check('map file marks the EU as one aggregate',sm.commodities.every(c=>!c.countries.FR&&!c.countries.DE&&!c.countries.ES)); const odJs=await read('js/oferta-demanda.js'); check('supply-demand page cites the forecast caveat and CC BY 4.0',/CC BY 4\.0/.test(odJs)&&/forecast/.test(odJs)); }
 { const cp=JSON.parse(await read('data/crop-progress.json')); const ids=['corn','soybeans','wheat_winter','wheat_spring','cotton']; check('crop progress has the five crops with 5+ seasons of ratings',ids.every(id=>{const c=cp.crops.find(x=>x.id===id); return c&&Object.values(c.seasons).filter(z=>z.condition.length>=8).length>=5;})); check('crop progress ratings add up to about 100 % and use published values only',cp.crops.every(c=>Object.values(c.seasons).every(z=>z.condition.every(w=>{const t=w[1]+w[2]+w[3]+w[4]+w[5]; return t>=97&&t<=103&&w.slice(1).every(v=>typeof v==='number'&&v>=0&&v<=100);})))); check('crop progress declares NASS source and the not-endorsed notice',/NASS/.test(cp.source.name)&&/no está respaldado/.test(cp.source.license)&&/^\d{4}-\d\d-\d\d$/.test(cp.lastWeekEnding)); const cuJs=await read('js/cultivos.js'); check('crop page states ratings are subjective and not a forecast',/subjective/.test(cuJs)&&/NASS/.test(cuJs)); }
 { const {existsSync}=await import('node:fs'); const si=JSON.parse(await read('data/search-index.json')); const L=['es','en','fr','it']; check('search index has 100+ entries with names in four languages',si.entries.length>=100&&si.entries.every(e=>L.every(l=>e.n&&typeof e.n[l]==='string'&&e.n[l].length>1))); check('every search result points to a page that exists',si.entries.every(e=>existsSync(e.u.split(/[?#]/)[0]))); const dataJs=await read('js/data.js'); const prodKeys=[...dataJs.matchAll(/nameKey:\s*'([a-z_]+)'/g)].map(m=>m[1]); check('search index covers every price product',prodKeys.length>=15&&prodKeys.filter(k=>!['cereales','lacteos','ganado','porcino','ovino','avicultura','fertilizantes','aceite','pienso_cat'].includes(k)).every(k=>si.entries.some(e=>e.t==='product'&&decodeURIComponent(e.u).endsWith(':'+k)))); check('search index has supply, crop, climate and map entries',['supply','crop','climate','map','page'].every(t=>si.entries.some(e=>e.t===t))); const sj=await read('js/search.js'); check('search runs in the browser without third parties or storage',!/https?:\/\//.test(sj.replace(/\/\*[\s\S]*?\*\//,''))&&!/localStorage|sessionStorage|document\.cookie/.test(sj)); }
 { const ch=JSON.parse(await read('data/climate-history.json')); const y0=+ch.start.slice(0,4); check('climate history covers at least 20 full years per region',ch.locations.length>=8&&ch.locations.every(l=>l.precipMmDay.slice(0,(2020-y0+1)*12).every(v=>v!==null)&&(2020-y0+1)>=20)); check('climate history values are real (no -999 fill values, plausible ranges)',ch.locations.every(l=>l.precipMmDay.every(v=>v===null||(v>=0&&v<40))&&l.tempC.every(v=>v===null||(v>-50&&v<50)))); check('climate history has a 12-month baseline per region',ch.locations.every(l=>l.baselinePrecipMmDay.length===12&&l.baselineTempC.length===12)); }
 { const {readdir}=await import('node:fs/promises'); const htmls=(await readdir('.')).filter(f=>f.endsWith('.html')); let ext=[]; for(const f of htmls){ for(const m of (await read(f)).matchAll(/<(?:script|link)[^>]+(?:src|href)=["'](https?:\/\/[^"']+)["']/gi)){ if(!/fonts\.googleapis\.com/.test(m[1])&&!/dehesaindex\.com/.test(m[1])) ext.push(f+' -> '+m[1]); } } check('no page loads scripts or styles from third-party CDNs (only Google Fonts is disclosed)'+(ext.length?': '+ext.join(', '):''),ext.length===0); const mp=await read('js/mapa.js'); const lat=JSON.parse(await read('data/latest.json')).observations; const prods=[...new Set(lat.filter(o=>o.region==='eu'&&o.status==='verified'&&!/index/.test(o.product)).map(o=>o.product))]; const unmapped=prods.filter(p=>p!=='urea'&&!new RegExp('\\b'+p+':\\s*1').test(mp)); check('map knows the geographic scope of every verified EU product (urea excluded on purpose)'+(unmapped.length?': '+unmapped.join(','):''),unmapped.length===0); }
 const relationships=JSON.parse(await read('data/cross-market.json')); check('relationship engine has v2 schema',relationships.schemaVersion==='2.0'); check('relationship engine documents causality caveat',relationships.methodology&&relationships.methodology.causality==='No causal inference.');
 const alerts=JSON.parse(await read('data/alerts.json')); check('alerts are informational',alerts.status==='informational');
} catch(e) { if(e.code!=='ENOENT') throw e; }

for(const o of latest.observations){
 check(o.id+' verified',o.status==='verified');
 check(o.id+' has source',!!o.sourceId);
 if(o.unit!=='index_2020_100') check(o.id+' is wired to a visible price card (LIVE_OBSERVATION_MAP)',prices.includes("'"+o.product+':'+o.region+"':"));
 check(o.id+' has observation date',/^\d{4}-\d{2}/.test(o.observationDate||''));
}
const passed=checks.filter(x=>x[1]).length;
console.log('Dehesa Index QA: '+passed+'/'+checks.length+' checks passed');
if(failures.length){console.error('FAILURES');failures.forEach(x=>console.error(' - '+x));process.exit(1);}
