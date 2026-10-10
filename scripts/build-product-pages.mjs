#!/usr/bin/env node
/* SEO de producto: una pagina estatica e indexable por producto e idioma (es, en, fr, it) con el ULTIMO precio real por mercado (EE. UU., UE, Canada, Reino Unido)
   leido de data/prices/latest/*.json: valor, unidad, periodo, variacion, fuente con enlace (y metodologia en espanol). Titulo y descripcion llevan la cifra actual.
   URLs: es /precios/<producto>/ · en /en/prices/<slug>/ · fr /fr/prix/<slug>/ · it /it/prezzi/<slug>/ (hreflang reciproco + x-default).
   Se ejecuta al final de scripts/build-seo-pages.mjs (workflow "Rebuild SEO landing pages") y reescribe el bloque marcado de sitemap.xml. */
import fs from 'node:fs';
import { seoTitle, seoDesc, socialMeta } from './lib_seo.mjs';
const read = f => fs.readFileSync(f, 'utf8');
const SITE = 'https://dehesaindex.com';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// clave -> { es, en, fr, it: [nombre, "precio de(l) ..."-genitivo/articulo] , slug en/fr/it }
const P = {
  trigo: { es: ['Trigo', 'del trigo'], en: ['Wheat', 'wheat'], fr: ['Blé', 'du blé'], it: ['Grano', 'del grano'], s: ['wheat', 'ble', 'grano'] },
  maiz: { es: ['Maíz', 'del maíz'], en: ['Corn', 'corn'], fr: ['Maïs', 'du maïs'], it: ['Mais', 'del mais'], s: ['corn', 'mais', 'mais'] },
  cebada: { es: ['Cebada', 'de la cebada'], en: ['Barley', 'barley'], fr: ['Orge', 'de l’orge'], it: ['Orzo', 'dell’orzo'], s: ['barley', 'orge', 'orzo'] },
  avena: { es: ['Avena', 'de la avena'], en: ['Oats', 'oats'], fr: ['Avoine', 'de l’avoine'], it: ['Avena', 'dell’avena'], s: ['oats', 'avoine', 'avena'] },
  centeno: { es: ['Centeno', 'del centeno'], en: ['Rye', 'rye'], fr: ['Seigle', 'du seigle'], it: ['Segale', 'della segale'], s: ['rye', 'seigle', 'segale'] },
  arroz: { es: ['Arroz', 'del arroz'], en: ['Rice', 'rice'], fr: ['Riz', 'du riz'], it: ['Riso', 'del riso'], s: ['rice', 'riz', 'riso'] },
  sorgo: { es: ['Sorgo', 'del sorgo'], en: ['Sorghum', 'sorghum'], fr: ['Sorgho', 'du sorgho'], it: ['Sorgo', 'del sorgo'], s: ['sorghum', 'sorgho', 'sorgo'] },
  colza: { es: ['Colza', 'de la colza'], en: ['Rapeseed', 'rapeseed'], fr: ['Colza', 'du colza'], it: ['Colza', 'della colza'], s: ['rapeseed', 'colza', 'colza'] },
  harina_soja: { es: ['Harina de soja', 'de la harina de soja'], en: ['Soybean meal', 'soybean meal'], fr: ['Tourteau de soja', 'du tourteau de soja'], it: ['Farina di soia', 'della farina di soia'], s: ['soybean-meal', 'tourteau-de-soja', 'farina-di-soia'] },
  leche: { es: ['Leche', 'de la leche'], en: ['Milk', 'milk'], fr: ['Lait', 'du lait'], it: ['Latte', 'del latte'], s: ['milk', 'lait', 'latte'] },
  leche_polvo: { es: ['Leche en polvo', 'de la leche en polvo'], en: ['Milk powder', 'milk powder'], fr: ['Lait en poudre', 'du lait en poudre'], it: ['Latte in polvere', 'del latte in polvere'], s: ['milk-powder', 'lait-en-poudre', 'latte-in-polvere'] },
  mantequilla: { es: ['Mantequilla', 'de la mantequilla'], en: ['Butter', 'butter'], fr: ['Beurre', 'du beurre'], it: ['Burro', 'del burro'], s: ['butter', 'beurre', 'burro'] },
  vaca: { es: ['Ganado vacuno', 'del ganado vacuno'], en: ['Cattle', 'cattle'], fr: ['Bovins', 'des bovins'], it: ['Bovini', 'dei bovini'], s: ['cattle', 'bovins', 'bovini'] },
  cerdo: { es: ['Cerdo', 'del cerdo'], en: ['Pork (hogs)', 'hogs and pork'], fr: ['Porc', 'du porc'], it: ['Suino', 'del suino'], s: ['hogs', 'porc', 'suino'] },
  cordero: { es: ['Cordero', 'del cordero'], en: ['Lamb', 'lamb'], fr: ['Agneau', 'de l’agneau'], it: ['Agnello', 'dell’agnello'], s: ['lamb', 'agneau', 'agnello'] },
  pollo: { es: ['Pollo', 'del pollo'], en: ['Chicken', 'chicken'], fr: ['Poulet', 'du poulet'], it: ['Pollo', 'del pollo'], s: ['chicken', 'poulet', 'pollo'] },
  huevos: { es: ['Huevos', 'de los huevos'], en: ['Eggs', 'eggs'], fr: ['Œufs', 'des œufs'], it: ['Uova', 'delle uova'], s: ['eggs', 'oeufs', 'uova'] },
  azucar: { es: ['Azúcar', 'del azúcar'], en: ['Sugar', 'sugar'], fr: ['Sucre', 'du sucre'], it: ['Zucchero', 'dello zucchero'], s: ['sugar', 'sucre', 'zucchero'] },
  oliva: { es: ['Aceite de oliva', 'del aceite de oliva'], en: ['Olive oil', 'olive oil'], fr: ['Huile d’olive', 'de l’huile d’olive'], it: ['Olio d’oliva', 'dell’olio d’oliva'], s: ['olive-oil', 'huile-olive', 'olio-oliva'] },
  urea: { es: ['Urea', 'de la urea'], en: ['Urea', 'urea fertilizer'], fr: ['Urée', 'de l’urée'], it: ['Urea', 'dell’urea'], s: ['urea', 'uree', 'urea'] },
  dap: { es: ['Fosfato DAP', 'del fosfato DAP'], en: ['DAP fertilizer', 'DAP fertilizer'], fr: ['Phosphate DAP', 'du phosphate DAP'], it: ['Fosfato DAP', 'del fosfato DAP'], s: ['dap-fertilizer', 'phosphate-dap', 'fosfato-dap'] },
  potasa: { es: ['Potasa', 'de la potasa'], en: ['Potash', 'potash'], fr: ['Potasse', 'de la potasse'], it: ['Potassio', 'del potassio'], s: ['potash', 'potasse', 'potassio'] },
  diesel: { es: ['Diésel', 'del diésel'], en: ['Diesel', 'diesel'], fr: ['Gazole', 'du gazole'], it: ['Gasolio', 'del gasolio'], s: ['diesel', 'gazole', 'gasolio'] },
  gas_natural: { es: ['Gas natural', 'del gas natural'], en: ['Natural gas', 'natural gas'], fr: ['Gaz naturel', 'du gaz naturel'], it: ['Gas naturale', 'del gas naturale'], s: ['natural-gas', 'gaz-naturel', 'gas-naturale'] },
  petroleo_wti: { es: ['Petróleo WTI', 'del petróleo WTI'], en: ['WTI crude oil', 'WTI crude oil'], fr: ['Pétrole WTI', 'du pétrole WTI'], it: ['Petrolio WTI', 'del petrolio WTI'], s: ['wti-crude-oil', 'petrole-wti', 'petrolio-wti'] },
  petroleo_brent: { es: ['Petróleo Brent', 'del petróleo Brent'], en: ['Brent crude oil', 'Brent crude oil'], fr: ['Pétrole Brent', 'du pétrole Brent'], it: ['Petrolio Brent', 'del petrolio Brent'], s: ['brent-crude-oil', 'petrole-brent', 'petrolio-brent'] }
};
const L = {
  es: { code: 'es', dir: p => 'precios/' + p.es_slug, root: 'precios', up: '../../', locale: 'es-ES',
    reg: { us: 'EE. UU.', eu: 'Unión Europea', ca: 'Canadá', uk: 'Reino Unido' }, regShort: { eu: 'UE' }, mon: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'],
    unit: { cwt: '/cwt (100 libras)', bushel: '/bushel', tonelada: '/tonelada', '100kg': '/100 kg', litro: '/litro', gal: '/galón', mmbtu: '/MMBtu', docena: '/docena', lb: '/libra', ton_corta: '/tonelada corta', barril: '/barril', kg: '/kg' },
    title: (de, head) => 'Precio ' + de + ' hoy: ' + head, descIntro: de => 'Precio ' + de + ' actualizado: ', descEnd: '. Fuentes oficiales con enlace, unidad y metodología.',
    h1: (de, n) => 'Precio ' + de + ': ' + (n > 1 ? 'último dato por mercado' : 'último dato'), lead: (de, head, per) => 'Último precio ' + de + ' publicado por fuentes oficiales: ' + head + '. Dato más reciente: ' + per + '.',
    th: ['Mercado', 'Precio', 'Unidad', 'Periodo', 'Variación', 'Fuente'], cta: 'Ver gráfica e histórico →', news: n => 'Noticias ' + n, cal: n => 'Calendario de informes ' + n,
    note: 'Los precios de mercados distintos no son directamente comparables: cambian la unidad, la moneda, el punto de la cadena y la calidad del producto. Cifras tal como las publica cada fuente, sin conversión.', meth: 'Metodología', gen: 'Página generada el', what: 'Qué mide exactamente cada precio',
    faqH: 'Preguntas frecuentes', q: (de, m) => '¿Cuál es el precio ' + de + ' en ' + m + '?', a: (v, per, ch, fr) => v + ', dato de ' + per + (ch ? ', con una variación de ' + ch + ' respecto al dato anterior' : '') + '. Frecuencia de la fuente: ' + fr + '.',
    freq: { weekly: 'semanal', daily: 'diaria', monthly: 'mensual' }, regQ: { eu: 'la Unión Europea', us: 'EE. UU.', ca: 'Canadá', uk: 'el Reino Unido' }, others: 'Otros precios', prices: 'Precios', dsName: (de, rs) => 'Precio ' + de + ' en ' + rs, home: 'precios.html', metodo: 'metodologia.html' },
  en: { code: 'en', root: 'en/prices', up: '../../../', locale: 'en-GB',
    reg: { us: 'United States', eu: 'European Union', ca: 'Canada', uk: 'United Kingdom' }, regShort: { us: 'US', eu: 'EU' }, mon: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    unit: { cwt: '/cwt (100 lb)', bushel: '/bushel', tonelada: '/tonne', '100kg': '/100 kg', litro: '/litre', gal: '/gallon', mmbtu: '/MMBtu', docena: '/dozen', lb: '/lb', ton_corta: '/short ton', barril: '/barrel', kg: '/kg' },
    unitS: { bushel: '/bu', tonelada: '/t', litro: '/l', gal: '/gal', docena: '/doz', ton_corta: '/short ton', barril: '/bbl' },
    title: (de, head) => de[0].toUpperCase() + de.slice(1) + ' price today: ' + head, descIntro: de => 'Current ' + de + ' price: ', descEnd: '. Official sources with links, units and methodology.',
    h1: (de, n) => de[0].toUpperCase() + de.slice(1) + ' price: ' + (n > 1 ? 'latest data by market' : 'latest data'), lead: (de, head, per) => 'Latest ' + de + ' price published by official sources: ' + head + '. Most recent data point: ' + per + '.',
    th: ['Market', 'Price', 'Unit', 'Period', 'Change', 'Source'], cta: 'See chart and history →', news: n => n + ' news', cal: n => n + ' report calendar',
    note: 'Prices from different markets are not directly comparable: unit, currency, point in the supply chain and product quality all differ. Figures are shown as each source publishes them, without conversion.', meth: 'Methodology', gen: 'Page generated on', what: '',
    faqH: 'Frequently asked questions', q: (de, m) => 'What is the price of ' + de + ' in ' + m + '?', a: (v, per, ch, fr) => v + ', data for ' + per + (ch ? ', ' + ch + ' versus the previous data point' : '') + '. Source frequency: ' + fr + '.',
    freq: { weekly: 'weekly', daily: 'daily', monthly: 'monthly' }, regQ: { eu: 'the European Union', us: 'the United States', ca: 'Canada', uk: 'the United Kingdom' }, others: 'Other prices', prices: 'Prices', dsName: (de, rs) => de[0].toUpperCase() + de.slice(1) + ' price in ' + rs, home: 'precios.html', metodo: 'metodologia.html' },
  fr: { code: 'fr', root: 'fr/prix', up: '../../../', locale: 'fr-FR',
    reg: { us: 'États-Unis', eu: 'Union européenne', ca: 'Canada', uk: 'Royaume-Uni' }, regShort: { eu: 'UE', us: 'É.-U.' }, mon: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    unit: { cwt: '/cwt (100 livres)', bushel: '/bushel', tonelada: '/tonne', '100kg': '/100 kg', litro: '/litre', gal: '/gallon', mmbtu: '/MMBtu', docena: '/douzaine', lb: '/livre', ton_corta: '/tonne courte', barril: '/baril', kg: '/kg' },
    unitS: { bushel: '/bu', tonelada: '/t', litro: '/l', gal: '/gal', docena: '/douz.', ton_corta: '/t courte', barril: '/baril' },
    title: (de, head) => 'Prix ' + de + ' aujourd’hui : ' + head, descIntro: de => 'Prix ' + de + ' actualisé : ', descEnd: '. Sources officielles avec liens, unités et méthodologie.',
    h1: (de, n) => 'Prix ' + de + ' : ' + (n > 1 ? 'dernière donnée par marché' : 'dernière donnée'), lead: (de, head, per) => 'Dernier prix ' + de + ' publié par des sources officielles : ' + head + '. Donnée la plus récente : ' + per + '.',
    th: ['Marché', 'Prix', 'Unité', 'Période', 'Variation', 'Source'], cta: 'Voir le graphique et l’historique →', news: n => 'Actualités : ' + n, cal: n => 'Calendrier des rapports : ' + n,
    note: 'Les prix de marchés différents ne sont pas directement comparables : l’unité, la devise, le stade de la chaîne et la qualité du produit changent. Chiffres tels que publiés par chaque source, sans conversion.', meth: 'Méthodologie', gen: 'Page générée le', what: '',
    faqH: 'Questions fréquentes', q: (de, m) => 'Quel est le prix ' + de + ' en ' + m + ' ?', a: (v, per, ch, fr) => v + ', donnée de ' + per + (ch ? ', variation de ' + ch + ' par rapport à la donnée précédente' : '') + '. Fréquence de la source : ' + fr + '.',
    freq: { weekly: 'hebdomadaire', daily: 'quotidienne', monthly: 'mensuelle' }, regQ: { eu: 'l’Union européenne', us: 'aux États-Unis', ca: 'au Canada', uk: 'au Royaume-Uni' }, others: 'Autres prix', prices: 'Prix', dsName: (de, rs) => 'Prix ' + de + ' : ' + rs, home: 'precios.html', metodo: 'metodologia.html' },
  it: { code: 'it', root: 'it/prezzi', up: '../../../', locale: 'it-IT',
    reg: { us: 'Stati Uniti', eu: 'Unione europea', ca: 'Canada', uk: 'Regno Unito' }, regShort: { eu: 'UE', us: 'USA' }, mon: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
    unit: { cwt: '/cwt (100 libbre)', bushel: '/bushel', tonelada: '/tonnellata', '100kg': '/100 kg', litro: '/litro', gal: '/gallone', mmbtu: '/MMBtu', docena: '/dozzina', lb: '/libbra', ton_corta: '/tonnellata corta', barril: '/barile', kg: '/kg' },
    unitS: { bushel: '/bu', tonelada: '/t', litro: '/l', gal: '/gal', docena: '/dozz.', ton_corta: '/t corta', barril: '/barile' },
    title: (de, head) => 'Prezzo ' + de + ' oggi: ' + head, descIntro: de => 'Prezzo ' + de + ' aggiornato: ', descEnd: '. Fonti ufficiali con link, unità e metodologia.',
    h1: (de, n) => 'Prezzo ' + de + ': ' + (n > 1 ? 'ultimo dato per mercato' : 'ultimo dato'), lead: (de, head, per) => 'Ultimo prezzo ' + de + ' pubblicato da fonti ufficiali: ' + head + '. Dato più recente: ' + per + '.',
    th: ['Mercato', 'Prezzo', 'Unità', 'Periodo', 'Variazione', 'Fonte'], cta: 'Vedi grafico e storico →', news: n => 'Notizie: ' + n, cal: n => 'Calendario dei rapporti: ' + n,
    note: 'I prezzi di mercati diversi non sono direttamente confrontabili: cambiano unità, valuta, punto della filiera e qualità del prodotto. Cifre come le pubblica ogni fonte, senza conversione.', meth: 'Metodologia', gen: 'Pagina generata il', what: '',
    faqH: 'Domande frequenti', q: (de, m) => 'Qual è il prezzo ' + de + ' in ' + m + '?', a: (v, per, ch, fr) => v + ', dato di ' + per + (ch ? ', variazione di ' + ch + ' rispetto al dato precedente' : '') + '. Frequenza della fonte: ' + fr + '.',
    freq: { weekly: 'settimanale', daily: 'giornaliera', monthly: 'mensile' }, regQ: { eu: 'l’Unione europea', us: 'negli Stati Uniti', ca: 'in Canada', uk: 'nel Regno Unito' }, others: 'Altri prezzi', prices: 'Prezzi', dsName: (de, rs) => 'Prezzo ' + de + ': ' + rs, home: 'precios.html', metodo: 'metodologia.html' }
};
const CUR = { USD: 'USD', EUR: 'EUR', CAD: 'CAD', GBP: 'GBP' };
const TOPIC = { urea: 'fertilizantes', dap: 'fertilizantes', potasa: 'fertilizantes' };
const US = { cwt: '/cwt', bushel: '/bu', tonelada: '/t', '100kg': '/100 kg', litro: '/l', gal: '/gal', mmbtu: '/MMBtu', docena: '/docena', lb: '/lb', ton_corta: '/t corta', barril: '/barril', kg: '/kg' };
let cite = {}; try { cite = JSON.parse(read('data/views/license-cite.json')).sources || {}; } catch (e) { /* sin vista de citas: se usa el id */ }
const byProd = {};
for (const r of ['us', 'eu', 'ca', 'uk']) {
  let d; try { d = JSON.parse(read('data/prices/latest/' + r + '.json')); } catch (e) { continue; }
  for (const o of d.observations || []) if (P[o.product] && o.currency !== 'INDEX' && typeof o.value === 'number') (byProd[o.product] = byProd[o.product] || []).push({ r, ...o });
}
const ORDER = ['us', 'eu', 'ca', 'uk'];
const keys = Object.keys(byProd).sort();
const urlOf = (lg, k) => SITE + '/' + L[lg].root + '/' + (lg === 'es' ? k : P[k].s[['en', 'fr', 'it'].indexOf(lg)]) + '/';
const lastDay = new Date().toISOString().slice(0, 10), urls = [];
for (const lg of Object.keys(L)) {
  const T = L[lg];
  const per = p => { const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(p || ''); return m ? (m[3] ? +m[3] + ' ' : '') + T.mon[+m[2] - 1] + ' ' + m[1] : (p || ''); };
  const nf = v => v.toLocaleString(T.locale, { minimumFractionDigits: Math.abs(v) >= 100 ? 0 : 2, maximumFractionDigits: Math.abs(v) >= 100 ? 1 : 2 });
  const pct = v => v == null ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(T.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
  for (const p of keys) {
    const obs = byProd[p].sort((a, b) => ORDER.indexOf(a.r) - ORDER.indexOf(b.r)), [name, de] = P[p][lg];
    const url = urlOf(lg, p), up = T.up, rg = o => T.reg[o.r], un = o => T.unit[o.unit] || '/' + o.unit;
    const line = o => nf(o.value) + ' ' + CUR[o.currency] + ((T.unitS && T.unitS[o.unit]) || US[o.unit] || '/' + o.unit);
    const head = obs.slice(0, 2).map(o => (T.regShort[o.r] || T.reg[o.r]) + ' ' + line(o)).join(' · ');
    const head1 = obs.slice(0, 1).map(o => (T.regShort[o.r] || T.reg[o.r]) + ' ' + line(o)).join(' · ');
    const title = seoTitle(T.title(de, T.title(de, head).length <= 62 ? head : head1));   // <= ~62 caracteres: si dos mercados no caben, solo el primero (el resto va en la descripcion)
    const latest = obs.reduce((m, o) => o.observationDate > m ? o.observationDate : m, '');
    const desc = (T.descIntro(de) + obs.map(o => rg(o) + ' ' + line(o) + ' (' + per(o.observationDate) + (o.changePct != null ? ', ' + pct(o.changePct) : '') + ')').join('; ') + T.descEnd).slice(0, 300);
    const rows = obs.map(o => { const s = cite[o.sourceId] || {};
      return '<tr><th scope="row" style="text-align:left;padding:8px 6px">' + esc(rg(o)) + '</th><td style="text-align:right;padding:8px 6px"><b>' + esc(nf(o.value)) + '</b></td><td style="padding:8px 6px">' + esc(CUR[o.currency] + un(o)) + '</td><td style="padding:8px 6px">' + esc(per(o.observationDate)) + '</td><td style="text-align:right;padding:8px 6px">' + esc(pct(o.changePct)) + '</td><td style="padding:8px 6px">' + (s.url ? '<a href="' + esc(s.url) + '" rel="noopener">' + esc(s.short || s.name || o.sourceId) + '</a>' : esc(o.sourceId)) + '</td></tr>'; }).join('\n');
    const meth = lg === 'es' ? obs.filter(o => o.methodology).map(o => '<li><b>' + esc(rg(o)) + ':</b> ' + esc(o.methodology) + '</li>').join('\n') : '';
    const faq = obs.map(o => '<h3 style="font-size:15px;margin:14px 0 4px">' + esc(T.q(de, T.regQ[o.r])) + '</h3><p>' + esc(T.a(nf(o.value) + ' ' + CUR[o.currency] + un(o), per(o.observationDate), o.changePct != null ? pct(o.changePct) : '', T.freq[o.frequency] || o.frequency || '')) + '</p>').join('\n');
    const others = keys.filter(x => x !== p).map(x => '<a href="../' + (lg === 'es' ? x : P[x].s[['en', 'fr', 'it'].indexOf(lg)]) + '/">' + esc(P[x][lg][0]) + '</a>').join(' · ');
    const alts = Object.keys(L).map(l2 => '<link rel="alternate" hreflang="' + l2 + '" href="' + urlOf(l2, p) + '">').join('\n') + '\n<link rel="alternate" hreflang="x-default" href="' + urlOf('en', p) + '">';
    const topic = TOPIC[p] || p;
    const ld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Dataset', name: T.dsName(de, obs.map(rg).join(', ')), description: desc, url, inLanguage: lg, isAccessibleForFree: true, dateModified: lastDay, temporalCoverage: latest, creator: { '@type': 'Organization', name: 'Dehesa Index', url: SITE }, isBasedOn: obs.map(o => (cite[o.sourceId] || {}).url).filter(Boolean) },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Dehesa Index', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: T.prices, item: SITE + '/precios.html' }, { '@type': 'ListItem', position: 3, name, item: url }] }
    ] };
    const html = `<!doctype html>
<html lang="${lg}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(seoDesc(desc))}">
<link rel="canonical" href="${url}">
${alts}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(seoDesc(desc))}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Dehesa Index">${socialMeta(lg)}
<link rel="icon" href="${up}assets/icon-192.png">
<link rel="stylesheet" href="${up}css/fonts.css">
<link rel="stylesheet" href="${up}css/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<div id="di-nav-root"></div>
<main class="di-page">
  <article class="di-main di-content-narrow">
    <div class="di-page-head">
      <h1>${esc(T.h1(de, obs.length))}</h1>
      <p>${esc(T.lead(de, head, per(latest)))}</p>
    </div>
    <div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:560px;font-size:14px">
<thead><tr>${T.th.map((h, i) => '<th scope="col" style="text-align:' + (i === 1 || i === 4 ? 'right' : 'left') + ';padding:8px 6px;font-size:11px">' + esc(h) + '</th>').join('')}</tr></thead>
<tbody>
${rows}
</tbody></table></div>
    <p style="margin:14px 0"><a class="di-btn-gold-solid" href="${up}precios.html?product=${esc(p)}">${esc(T.cta)}</a></p>
    <p class="di-movers-hint"><a href="${up}noticias.html?product=${esc(topic)}">${esc(T.news(name))}</a> · <a href="${up}calendario.html?crop=${esc(topic)}">${esc(T.cal(name))}</a></p>
    <p class="di-movers-hint">${esc(T.note)} <a href="${up}${T.metodo}">${esc(T.meth)}</a> · ${esc(T.gen)} ${esc(lastDay)}.</p>
${meth ? '    <h2 style="font-size:17px;margin-top:22px">' + esc(T.what) + '</h2>\n    <ul>' + meth + '</ul>' : ''}
    <h2 style="font-size:17px;margin-top:22px">${esc(T.faqH)}</h2>
${faq}
    <h2 style="font-size:17px;margin-top:22px">${esc(T.others)}</h2>
    <p>${others}</p>
  </article>
</main>
<div id="di-footer-root"></div>
<script>try{if(!localStorage.getItem('dehesaIndexLang'))localStorage.setItem('dehesaIndexLang','${lg}')}catch(e){}</script>
<script src="${up}js/shared.js?v=20260929-context-fix"></script>
<script>if(window.DehesaShared&&window.DehesaShared.init)window.DehesaShared.init('informacion');</script>
</body>
</html>
`;
    const dir = url.replace(SITE + '/', '');
    fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(dir + 'index.html', html); urls.push(url);
  }
}
// sitemap: bloque marcado propio; se quitan las entradas manuales de precios/ que ahora genera este script
let sm = read('sitemap.xml'); const A = '  <!-- product-pages:start -->', B = '  <!-- product-pages:end -->';
sm = sm.replace(/^  <url><loc>https:\/\/dehesaindex\.com\/precios\/[a-z_]+\/<\/loc><\/url>\n/gm, '');
const block = A + '\n' + urls.sort().map(u => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n' + B;
if (sm.includes(A)) sm = sm.replace(new RegExp(A + '[\\s\\S]*?' + B), block); else sm = sm.replace('</urlset>', block + '\n</urlset>');
fs.writeFileSync('sitemap.xml', sm);
console.log('paginas de producto', urls.length);
