#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const ok = [];

function read(p) { return fs.readFileSync(path.join(root,p),'utf8'); }
function exists(p) { return fs.existsSync(path.join(root,p)); }
function check(cond,msg){ if(cond) ok.push(msg); else failures.push(msg); }

const htmlPages = ['index.html','precios.html','noticias.html','calendario.html','informacion.html','blog.html','empresas.html','contacto.html','metodologia.html','legal.html','clima.html'];
for (const page of htmlPages) {
  check(exists(page), `page exists: ${page}`);
  if (!exists(page)) continue;
  const html = read(page);
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]);
  for (const src of scripts) {
    if (/^https?:\/\//i.test(src)) continue;
    check(exists(src.replace(/[?#].*$/,'').replace(/^\.\//,'')), `${page} local script exists: ${src}`);
  }
}

const shared = read('js/shared.js');
const news = read('js/noticias.js');
const calendar = read('js/calendario.js');
const prices = read('js/precios.js');

check(shared.includes('function renderContextBar'), 'shared context bar exists');
check(shared.includes('window.history.back()'), 'context back action exists');
check(shared.includes("sitePath('assets/logo.png')"), 'footer logo uses nested-page-safe path');
check(shared.includes('backButton + siblingLinks'), 'context bar renders the defined sibling links');
check(!shared.includes('siblingHref') && !shared.includes('siblingLabel'), 'context bar has no stale undefined link variables');
check(news.includes('window.history.pushState'), 'news filters create browser history entries');
check(calendar.includes('window.history.pushState'), 'calendar filters create browser history entries');
check(news.includes("window.addEventListener('popstate'"), 'news restores state on back/forward');
check(calendar.includes("window.addEventListener('popstate'"), 'calendar restores state on back/forward');
check(prices.includes("window.addEventListener('popstate', restorePriceUrl)"), 'prices restores state on back/forward');
check(prices.includes('function syncPriceUrl'), 'prices has URL state writer');
check(prices.includes('function restorePriceUrl'), 'prices has URL state reader');

check(!/noticias\.js[\s\S]{0,6000}history\.replaceState/.test(news), 'news no longer replaces filter history');
check(/function optionHtml\([\s\S]*?var esc = window\.DehesaShared\.esc;/.test(news), 'news filter options use the shared escape helper in scope');
check(!/calendario\.js[\s\S]{0,6000}history\.replaceState/.test(calendar), 'calendar no longer replaces filter history');

const productPages = ['trigo','maiz','leche','urea','diesel'];
for (const product of productPages) {
  const p = `precios/${product}/index.html`;
  check(exists(p), `product landing exists: ${product}`);
  if (!exists(p)) continue;
  const html = read(p);
  check(html.includes('../../precios.html?product=' + product), `${product} landing -> prices deep link`);
  check(html.includes('../../noticias.html?product=' + (product === 'urea' ? 'fertilizantes' : product)), `${product} landing -> news deep link`);
  const crop = product === 'urea' ? 'fertilizantes' : product;
  check(html.includes('../../calendario.html?crop=' + crop), `${product} landing -> calendar deep link`);
}

const validTabs = ['cereales','lacteos','fertilizantes','energia','seguro','vino','madera'];
for (const tab of validTabs) check(prices.includes("'" + tab + "'"), `prices tab allowlist contains: ${tab}`);

const jsFiles = [];
function walk(dir) {
  for (const ent of fs.readdirSync(path.join(root,dir), {withFileTypes:true})) {
    const rel = path.join(dir,ent.name);
    if (ent.isDirectory()) walk(rel);
    else if (ent.isFile() && rel.endsWith('.js') && !rel.includes('node_modules')) jsFiles.push(rel);
  }
}
walk('js');
for (const f of jsFiles) {
  try { execFileSync(process.execPath,['--check',f],{stdio:'pipe'}); ok.push('syntax ok: '+f); }
  catch { failures.push('syntax error: '+f); }
}

console.log(`Navigation QA: ${ok.length} checks passed, ${failures.length} failed.`);
for (const x of failures) console.error('FAIL',x);
if (failures.length) process.exit(1);
