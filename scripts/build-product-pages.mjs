#!/usr/bin/env node
/* SEO de producto: una pagina estatica e indexable por producto en precios/<producto>/ con el ULTIMO precio real por mercado (EE. UU., UE, Canada, Reino Unido)
   leido de data/prices/latest/*.json: valor, unidad, periodo, variacion, fuente con enlace y metodologia. Titulo y descripcion llevan la cifra actual.
   Se ejecuta al final de scripts/build-seo-pages.mjs (workflow "Rebuild SEO landing pages") y reescribe el bloque marcado de sitemap.xml. */
import fs from 'node:fs';
const read = f => fs.readFileSync(f, 'utf8');
const SITE = 'https://dehesaindex.com';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// [nombre, "precio del/de la ...", genero para concordar "actualizado"]
const NAMES = {
  trigo: ['Trigo', 'del trigo'], maiz: ['Maíz', 'del maíz'], cebada: ['Cebada', 'de la cebada'], avena: ['Avena', 'de la avena'], centeno: ['Centeno', 'del centeno'],
  arroz: ['Arroz', 'del arroz'], sorgo: ['Sorgo', 'del sorgo'], colza: ['Colza', 'de la colza'], harina_soja: ['Harina de soja', 'de la harina de soja'],
  leche: ['Leche', 'de la leche'], leche_polvo: ['Leche en polvo', 'de la leche en polvo'], mantequilla: ['Mantequilla', 'de la mantequilla'],
  vaca: ['Ganado vacuno', 'del ganado vacuno'], cerdo: ['Cerdo', 'del cerdo'], cordero: ['Cordero', 'del cordero'], pollo: ['Pollo', 'del pollo'], huevos: ['Huevos', 'de los huevos'],
  azucar: ['Azúcar', 'del azúcar'], oliva: ['Aceite de oliva', 'del aceite de oliva'],
  urea: ['Urea', 'de la urea'], dap: ['Fosfato DAP', 'del fosfato DAP'], potasa: ['Potasa', 'de la potasa'],
  diesel: ['Diésel', 'del diésel'], gas_natural: ['Gas natural', 'del gas natural'], petroleo_wti: ['Petróleo WTI', 'del petróleo WTI'], petroleo_brent: ['Petróleo Brent', 'del petróleo Brent']
};
const TOPIC = { urea: 'fertilizantes', dap: 'fertilizantes', potasa: 'fertilizantes' };
const REG = { us: 'EE. UU.', eu: 'Unión Europea', ca: 'Canadá', uk: 'Reino Unido' };
const UNIT = { cwt: '/cwt (100 libras)', bushel: '/bushel', tonelada: '/tonelada', '100kg': '/100 kg', litro: '/litro', gal: '/galón', mmbtu: '/MMBtu', docena: '/docena', lb: '/libra', ton_corta: '/tonelada corta', barril: '/barril', kg: '/kg' };
const UNIT_SHORT = { cwt: '/cwt', bushel: '/bu', tonelada: '/t', '100kg': '/100 kg', litro: '/l', gal: '/gal', mmbtu: '/MMBtu', docena: '/docena', lb: '/lb', ton_corta: '/t corta', barril: '/barril', kg: '/kg' };
const CUR = { USD: 'USD', EUR: 'EUR', CAD: 'CAD', GBP: 'GBP' };
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const per = p => { const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(p || ''); return m ? (m[3] ? +m[3] + ' ' : '') + MES[+m[2] - 1] + ' ' + m[1] : (p || ''); };
const nf = v => v.toLocaleString('es-ES', { minimumFractionDigits: Math.abs(v) >= 100 ? 0 : 2, maximumFractionDigits: Math.abs(v) >= 100 ? 1 : 2 });
const pct = v => v == null ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
let cite = {}; try { cite = JSON.parse(read('data/views/license-cite.json')).sources || {}; } catch (e) { /* sin vista de citas: se usa el id */ }
const byProd = {};
for (const r of ['us', 'eu', 'ca', 'uk']) {
  let d; try { d = JSON.parse(read('data/prices/latest/' + r + '.json')); } catch (e) { continue; }
  for (const o of d.observations || []) if (NAMES[o.product] && o.currency !== 'INDEX' && typeof o.value === 'number') (byProd[o.product] = byProd[o.product] || []).push({ r, ...o });
}
const ORDER = ['us', 'eu', 'ca', 'uk'];
const slugs = Object.keys(byProd).sort();
const urls = [];
const lastDay = new Date().toISOString().slice(0, 10);
for (const p of slugs) {
  const obs = byProd[p].sort((a, b) => ORDER.indexOf(a.r) - ORDER.indexOf(b.r)), [name, de] = NAMES[p];
  const url = SITE + '/precios/' + p + '/';
  const line = o => nf(o.value) + ' ' + CUR[o.currency] + (UNIT_SHORT[o.unit] || '/' + o.unit);
  const head = obs.slice(0, 2).map(o => (o.r === 'eu' ? 'UE' : REG[o.r]) + ' ' + line(o)).join(' · ');
  const title = 'Precio ' + de + ' hoy: ' + head + ' | Dehesa Index';
  const latest = obs.reduce((m, o) => o.observationDate > m ? o.observationDate : m, '');
  const desc = ('Precio ' + de + ' actualizado: ' + obs.map(o => REG[o.r] + ' ' + line(o) + ' (' + per(o.observationDate) + (o.changePct != null ? ', ' + pct(o.changePct) : '') + ')').join('; ') + '. Fuentes oficiales con enlace, unidad y metodología.').slice(0, 300);
  const rows = obs.map(o => {
    const s = cite[o.sourceId] || {};
    return '<tr><th scope="row" style="text-align:left;padding:8px 6px">' + esc(REG[o.r]) + '</th><td style="text-align:right;padding:8px 6px"><b>' + esc(nf(o.value)) + '</b></td><td style="padding:8px 6px">' + esc(CUR[o.currency] + (UNIT[o.unit] || '/' + o.unit)) + '</td><td style="padding:8px 6px">' + esc(per(o.observationDate)) + '</td><td style="text-align:right;padding:8px 6px">' + esc(pct(o.changePct)) + '</td><td style="padding:8px 6px">' + (s.url ? '<a href="' + esc(s.url) + '" rel="noopener">' + esc(s.short || s.name || o.sourceId) + '</a>' : esc(o.sourceId)) + '</td></tr>';
  }).join('\n');
  const meth = obs.filter(o => o.methodology).map(o => '<li><b>' + esc(REG[o.r]) + ':</b> ' + esc(o.methodology) + '</li>').join('\n');
  const faq = obs.map(o => '<h3 style="font-size:15px;margin:14px 0 4px">¿Cuál es el precio ' + esc(de) + ' en ' + esc(o.r === 'eu' ? 'la Unión Europea' : REG[o.r]) + '?</h3><p>' + esc(nf(o.value) + ' ' + CUR[o.currency] + (UNIT[o.unit] || '/' + o.unit)) + ', dato de ' + esc(per(o.observationDate)) + (o.changePct != null ? ', con una variación de ' + esc(pct(o.changePct)) + ' respecto al dato anterior' : '') + '. Frecuencia de la fuente: ' + (o.frequency === 'weekly' ? 'semanal' : o.frequency === 'daily' ? 'diaria' : o.frequency === 'monthly' ? 'mensual' : esc(o.frequency || 'según la fuente')) + '.</p>').join('\n');
  const others = slugs.filter(x => x !== p).map(x => '<a href="../' + x + '/">' + esc(NAMES[x][0]) + '</a>').join(' · ');
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Dataset', name: 'Precio ' + de + ' en ' + obs.map(o => REG[o.r]).join(', '), description: desc, url, inLanguage: 'es', isAccessibleForFree: true, dateModified: lastDay, temporalCoverage: latest, creator: { '@type': 'Organization', name: 'Dehesa Index', url: SITE }, isBasedOn: obs.map(o => (cite[o.sourceId] || {}).url).filter(Boolean) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Dehesa Index', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Precios', item: SITE + '/precios.html' }, { '@type': 'ListItem', position: 3, name, item: url }] }
  ] };
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Dehesa Index">
<link rel="icon" href="../../assets/icon-192.png">
<link rel="stylesheet" href="../../css/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<div id="di-nav-root"></div>
<main class="di-page">
  <article class="di-main di-content-narrow">
    <div class="di-page-head">
      <h1>Precio ${esc(de)}: ${esc(obs.length > 1 ? 'último dato por mercado' : 'último dato')}</h1>
      <p>Último precio ${esc(de)} publicado por fuentes oficiales: ${esc(head)}. Dato más reciente: ${esc(per(latest))}.</p>
    </div>
    <div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:560px;font-size:14px">
<thead><tr><th scope="col" style="text-align:left;padding:8px 6px;font-size:11px">Mercado</th><th scope="col" style="text-align:right;padding:8px 6px;font-size:11px">Precio</th><th scope="col" style="text-align:left;padding:8px 6px;font-size:11px">Unidad</th><th scope="col" style="text-align:left;padding:8px 6px;font-size:11px">Periodo</th><th scope="col" style="text-align:right;padding:8px 6px;font-size:11px">Variación</th><th scope="col" style="text-align:left;padding:8px 6px;font-size:11px">Fuente</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>
    <p style="margin:14px 0"><a class="di-btn-gold-solid" href="../../precios.html?product=${esc(p)}">Ver gráfica e histórico →</a></p>
    <p class="di-movers-hint"><a href="../../noticias.html?product=${esc(TOPIC[p] || p)}">Noticias ${esc(de)}</a> · <a href="../../calendario.html?crop=${esc(TOPIC[p] || p)}">Calendario de informes ${esc(de)}</a></p>
    <p class="di-movers-hint">Los precios de mercados distintos no son directamente comparables: cambian la unidad, la moneda, el punto de la cadena y la calidad del producto. Cifras tal como las publica cada fuente, sin conversión. <a href="../../metodologia.html">Metodología</a> · Página generada el ${esc(lastDay)}.</p>
${meth ? '    <h2 style="font-size:17px;margin-top:22px">Qué mide exactamente cada precio</h2>\n    <ul>' + meth + '</ul>' : ''}
    <h2 style="font-size:17px;margin-top:22px">Preguntas frecuentes</h2>
${faq}
    <h2 style="font-size:17px;margin-top:22px">Otros precios</h2>
    <p>${others}</p>
  </article>
</main>
<div id="di-footer-root"></div>
<script src="../../js/shared.js?v=20260929-context-fix"></script>
<script>if(window.DehesaShared&&window.DehesaShared.init)window.DehesaShared.init('informacion');</script>
</body>
</html>
`;
  fs.mkdirSync('precios/' + p, { recursive: true }); fs.writeFileSync('precios/' + p + '/index.html', html); urls.push(url);
}
// sitemap: bloque marcado propio; se quitan las 5 entradas manuales de precios/ que ahora genera este script
let sm = read('sitemap.xml'); const A = '  <!-- product-pages:start -->', B = '  <!-- product-pages:end -->';
sm = sm.replace(/^  <url><loc>https:\/\/dehesaindex\.com\/precios\/[a-z_]+\/<\/loc><\/url>\n/gm, '');
const block = A + '\n' + urls.sort().map(u => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n' + B;
if (sm.includes(A)) sm = sm.replace(new RegExp(A + '[\\s\\S]*?' + B), block); else sm = sm.replace('</urlset>', block + '\n</urlset>');
fs.writeFileSync('sitemap.xml', sm);
console.log('paginas de producto', urls.length);
