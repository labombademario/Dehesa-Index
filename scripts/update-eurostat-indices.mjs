#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SNAP_DIR = path.join(ROOT, 'data', 'snapshots');
const API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/';
const GEO = 'EU27_2020';

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Dehesa-Index/2.0' } });
  if (!r.ok) throw new Error(`Eurostat HTTP ${r.status}: ${url}`);
  return r.json();
}
function categories(dim) {
  const index = dim?.category?.index || {};
  const labels = dim?.category?.label || {};
  return Object.keys(index).sort((a,b)=>index[a]-index[b]).map(code=>({code,label:String(labels[code]||code),index:index[code]}));
}
function norm(s) {
  return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ');
}
function pickDimension(data, id, patterns) {
  const dim = data.dimension?.[id];
  if (!dim) throw new Error(`Eurostat dimension missing: ${id}; available=${Object.keys(data.dimension||{}).join(',')}`);
  const cats = categories(dim);
  const found = cats.find(c => patterns.some(p => p.test(norm(c.label))));
  if (!found) throw new Error(`Eurostat category not found in ${id}: ${patterns.map(String).join(', ')}`);
  return found;
}
function cellIndex(coords, sizes) {
  let idx=0;
  for(let i=0;i<sizes.length;i++) idx = idx*sizes[i] + coords[i];
  return idx;
}
function series(data, targetProduct, targetPadj, targetUnit) {
  const ids=data.id, sizes=data.size, dims=data.dimension;
  const pCats=categories(dims.am_item), aCats=categories(dims.p_adj), uCats=categories(dims.unit), tCats=categories(dims.time);
  const p=targetProduct, a=targetPadj, u=targetUnit;
  const pi=ids.indexOf('am_item'), ai=ids.indexOf('p_adj'), ui=ids.indexOf('unit'), ti=ids.indexOf('time'), gi=ids.indexOf('geo');
  if ([pi,ai,ui,ti].some(x=>x<0)) throw new Error('Unexpected Eurostat JSON-stat dimensions: '+ids.join(','));
  const geoCats=gi>=0?categories(dims.geo):[];
  const geo=geoCats.find(c=>c.code===GEO);
  const fixed=new Array(ids.length).fill(0);
  fixed[pi]=p.index; fixed[ai]=a.index; fixed[ui]=u.index; if(gi>=0) fixed[gi]=geo?geo.index:0;
  const points=[];
  for(const t of tCats){
    fixed[ti]=t.index;
    const value=data.value?.[cellIndex(fixed,sizes)];
    if(value===null || value===undefined || !Number.isFinite(Number(value))) continue;
    const m=String(t.code).match(/^(\d{4})-Q([1-4])$/);
    if(!m) continue;
    points.push({period:'Q'+m[2],year:Number(m[1]),value:Number(value)});
  }
  return points;
}
async function load(dataset) {
  const url=API+dataset+'?lang=EN&geo='+encodeURIComponent(GEO)+'&lastTimePeriod=24';
  return getJson(url);
}
const configs = [
  {dataset:'apri_pi_outq', key:'eurostat_cereals_output_index', label:'Cereales — índice de precios de producción', product:/cereals/, source:'eurostat', comparability:'directional', patterns:[/cereals/], out:true},
  {dataset:'apri_pi_outq', key:'eurostat_milk_output_index', label:'Leche — índice de precios de producción', product:/milk/, source:'eurostat', comparability:'directional', patterns:[/^milk$/,/milk/], out:true},
  {dataset:'apri_pi_inq', key:'eurostat_fertiliser_input_index', label:'Fertilizantes y mejoradores del suelo — índice de precios de compra', product:/fertilisers|fertilizers/, source:'eurostat', comparability:'directional', patterns:[/fertilisers.*soil improvers/,/fertilizers.*soil improvers/,/fertilisers/,/fertilizers/], out:false},
  {dataset:'apri_pi_inq', key:'eurostat_energy_input_index', label:'Energía y lubricantes — índice de precios de compra', product:/energy.*lubricants/, source:'eurostat', comparability:'directional', patterns:[/energy.*lubricants/], out:false}
];

const grouped={};
for(const cfg of configs){
  const data=await load(cfg.dataset);
  const p=pickDimension(data,'am_item',cfg.patterns);
  const a=pickDimension(data,'p_adj',[/nominal/]);
  const u=pickDimension(data,'unit',[/2020.?=.?100/,/index.*2020/]);
  const points=series(data,p,a,u);
  if(points.length<4) throw new Error(`${cfg.key}: only ${points.length} points`);
  grouped[cfg.key]={...cfg,productCode:p.code,productLabel:p.label,unitCode:u.code,unitLabel:u.label,history:points};
}

const snapshotDate=new Date().toISOString().slice(0,10);
const observations=Object.values(grouped).map(s=>{
  const last=s.history[s.history.length-1];
  const quarterEnd={Q1:'03-31',Q2:'06-30',Q3:'09-30',Q4:'12-31'}[last.period];
  return {
    id:'di_'+s.key,
    product:s.key,
    region:'eu',
    sourceId:'eurostat',
    observationDate:last.year+'-'+quarterEnd,
    value:last.value,
    currency:'INDEX',
    unit:'index_2020_100',
    frequency:'quarterly',
    status:'verified',
    verifiedAt:new Date().toISOString(),
    comparability:'directional',
    methodology:s.dataset+'; EU27_2020; nominal agricultural price index, 2020=100.',
    history:s.history
  };
});
await import('node:fs/promises').then(fs=>fs.mkdir(SNAP_DIR,{recursive:true}));
const file=path.join(SNAP_DIR,snapshotDate+'.json');
let doc={schemaVersion:'1.0',generatedAt:new Date().toISOString(),observations:[]};
try{doc=JSON.parse(await readFile(file,'utf8'));}catch{}
doc.observations=(doc.observations||[]).filter(o=>!(o.sourceId==='eurostat' && o.region==='eu'));
doc.observations.push(...observations);
await writeFile(file,JSON.stringify(doc,null,2)+'\n');
console.log('Eurostat updated: '+observations.map(o=>o.product+'='+o.value).join(', '));
