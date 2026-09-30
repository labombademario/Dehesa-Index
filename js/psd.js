/* Dehesa Index — utilidades comunes de oferta y demanda (USDA PSD). Sin datos, no inventa nada. */
(function () {
  'use strict';
  var CAL = { cerdo: 1, vacuno: 1, pollo: 1, leche: 1 }; // campaña = año natural
  var N = {
    es: { trigo: 'Trigo', maiz: 'Maíz', arroz: 'Arroz', cebada: 'Cebada', soja: 'Soja (grano)', harina_soja: 'Harina de soja', colza: 'Colza', oliva: 'Aceite de oliva', cerdo: 'Cerdo', vacuno: 'Vacuno', pollo: 'Pollo', leche: 'Leche', azucar: 'Azúcar' },
    en: { trigo: 'Wheat', maiz: 'Corn', arroz: 'Rice', cebada: 'Barley', soja: 'Soybeans', harina_soja: 'Soybean meal', colza: 'Rapeseed', oliva: 'Olive oil', cerdo: 'Pork', vacuno: 'Beef', pollo: 'Chicken', leche: 'Milk', azucar: 'Sugar' },
    fr: { trigo: 'Blé', maiz: 'Maïs', arroz: 'Riz', cebada: 'Orge', soja: 'Soja (grain)', harina_soja: 'Tourteau de soja', colza: 'Colza', oliva: 'Huile d’olive', cerdo: 'Porc', vacuno: 'Bœuf', pollo: 'Poulet', leche: 'Lait', azucar: 'Sucre' },
    it: { trigo: 'Grano', maiz: 'Mais', arroz: 'Riso', cebada: 'Orzo', soja: 'Soia (semi)', harina_soja: 'Farina di soia', colza: 'Colza', oliva: 'Olio d’oliva', cerdo: 'Maiale', vacuno: 'Bovino', pollo: 'Pollo', leche: 'Latte', azucar: 'Zucchero' }
  };
  var A = {
    es: { production: 'Producción', imports: 'Importaciones', exports: 'Exportaciones', consumption: 'Consumo', endingStocks: 'Existencias finales', beginningStocks: 'Existencias iniciales', totalSupply: 'Oferta total', feed: 'de ello, pienso', crush: 'de ello, trituración', area: 'Superficie cosechada' },
    en: { production: 'Production', imports: 'Imports', exports: 'Exports', consumption: 'Consumption', endingStocks: 'Ending stocks', beginningStocks: 'Beginning stocks', totalSupply: 'Total supply', feed: 'of which feed', crush: 'of which crush', area: 'Harvested area' },
    fr: { production: 'Production', imports: 'Importations', exports: 'Exportations', consumption: 'Consommation', endingStocks: 'Stocks finaux', beginningStocks: 'Stocks initiaux', totalSupply: 'Offre totale', feed: 'dont alimentation animale', crush: 'dont trituration', area: 'Surface récoltée' },
    it: { production: 'Produzione', imports: 'Importazioni', exports: 'Esportazioni', consumption: 'Consumo', endingStocks: 'Scorte finali', beginningStocks: 'Scorte iniziali', totalSupply: 'Offerta totale', feed: 'di cui mangimi', crush: 'di cui frantumazione', area: 'Superficie raccolta' }
  };
  var EUN = { es: 'Unión Europea (agregado)', en: 'European Union (aggregate)', fr: 'Union européenne (agrégat)', it: 'Unione europea (aggregato)' };
  var WORLD = { es: 'Mundo (suma de países PSD)', en: 'World (sum of PSD countries)', fr: 'Monde (somme des pays PSD)', it: 'Mondo (somma dei paesi PSD)' };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  var dn = {};
  function countryName(iso, fallback) {
    var l = lang();
    if (iso === 'EU') return EUN[l] || EUN.es;
    try { if (window.Intl && Intl.DisplayNames) { dn[l] = dn[l] || new Intl.DisplayNames([l], { type: 'region' }); var r = dn[l].of(iso); if (r && r !== iso) return r; } } catch (e) {}
    return fallback || iso;
  }
  function myLabel(id, my) { return CAL[id] ? String(my) : my + '/' + String((my + 1) % 100 + 100).slice(1); }
  function nf(v, d) { var l = lang(); try { return v.toLocaleString(l, { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0, useGrouping: 'always' }); } catch (e) { return v.toFixed(d || 0); } }
  function big(v) { return Math.abs(v) >= 1000 ? nf(v / 1000, Math.abs(v) >= 10000 ? 0 : 1) + ' Mt' : nf(v, 0) + ' kt'; }
  function sgnPct(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + ' %'; }
  var cache = {};
  function load(file) {
    if (!cache[file]) cache[file] = fetch(file).then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }).then(function (d) { return d && d.commodities && d.commodities.length ? d : null; }).catch(function () { return null; });
    return cache[file];
  }
  window.DehesaPSD = { names: function () { return N[lang()] || N.es; }, attrs: function () { return A[lang()] || A.es; }, world: function () { return WORLD[lang()] || WORLD.es; }, countryName: countryName, myLabel: myLabel, nf: nf, big: big, sgnPct: sgnPct, load: load, isCal: function (id) { return !!CAL[id]; } };
})();
