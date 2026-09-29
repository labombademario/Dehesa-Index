#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const checks = [];
async function read(rel){ return readFile(path.join(root, rel), 'utf8'); }
function ok(name, condition, detail=''){ checks.push({name,ok:!!condition}); if(!condition) failures.push(name + (detail ? ': '+detail : '')); }

const rootPages = ['index.html','precios.html','noticias.html','calendario.html','informacion.html','blog.html','empresas.html','contacto.html'];
for (const file of rootPages) {
  const c = await read(file);
  ok(file+' loads shared.js', /js\/shared\.js/.test(c));
  ok(file+' has viewport', /name="viewport"/.test(c));
}
const productPages = ['trigo','maiz','leche','urea','diesel'];
for (const product of productPages) {
  const c = await read('precios/'+product+'/index.html');
  ok(product+' landing has prices deep link', new RegExp('precios\\.html\\?product='+product).test(c));
  ok(product+' landing has news link', new RegExp('noticias\\.html\\?product='+(product==='urea'?'fertilizantes':product)).test(c));
  ok(product+' landing has calendar link', /calendario\.html\?crop=/.test(c));
}
const shared = await read('js/shared.js');
ok('shared footer uses nested-page-safe logo path', /sitePath\('assets\/logo\.png'\)/.test(shared));
ok('shared exposes context bar', /function renderContextBar/.test(shared));
ok('shared context back uses history.back', /window\.history\.back\(\)/.test(shared));

const prices = await read('js/precios.js');
ok('prices validates canonical tabs', /validTabs = \['cereales','lacteos','fertilizantes','energia','seguro','vino','madera'\]/.test(prices));
ok('prices has pushState URL sync', /history\.pushState/.test(prices));
ok('prices restores popstate', /addEventListener\('popstate', restorePriceUrl\)/.test(prices));

const news = await read('js/noticias.js');
ok('news uses pushState', /history\.pushState/.test(news));
ok('news restores popstate', /addEventListener\('popstate'/.test(news));
ok('news avoids nested article anchors', !/<a[^>]*class=["'][^"']*\\bdi-news-item\\b[^"']*["'][^>]*>[\\s\\S]*<a[^>]*di-news-item-price-link/.test(news));

const cal = await read('js/calendario.js');
ok('calendar uses pushState', /history\.pushState/.test(cal));
ok('calendar restores popstate', /addEventListener\('popstate'/.test(cal));
ok('calendar does not alias unsupported barley/soy to corn/wheat', !/cebada:'trigo'|soja:'maiz/.test(cal));

for (const file of ['data/latest.json','data/history.json','data/catalog.json','data/api.json']) {
  try { JSON.parse(await read(file)); ok(file+' is valid JSON', true); }
  catch(e){ ok(file+' is valid JSON', false, e.message); }
}
const latest = JSON.parse(await read('data/latest.json'));
ok('latest has observations', Array.isArray(latest.observations) && latest.observations.length > 0);
for (const o of (latest.observations || [])) {
  ok('latest '+o.id+' has verified status', o.status === 'verified');
  ok('latest '+o.id+' has observation date', /^\d{4}-\d{2}/.test(o.observationDate || ''));
  ok('latest '+o.id+' has source', !!o.sourceId);
}

console.log('Dehesa Index QA: '+checks.filter(x=>x.ok).length+'/'+checks.length+' checks passed');
if (failures.length) {
  console.error('\nFAILURES');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
