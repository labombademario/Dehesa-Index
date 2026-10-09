// Utilidades SEO comunes a los generadores de paginas estaticas (datos, regiones, productos).
// Google recorta los titulos en ~600 px (~60 caracteres) y las descripciones en ~155-160: lo importante va primero y se acorta sin cortar palabras.
export const BRAND = 'Dehesa Index';
const OG = { es: 'og-es.png', en: 'og-en.png', fr: 'og-fr.png', it: 'og-it.png' };
const ORIGIN = 'https://dehesaindex.com';
// Titulo: el nucleo sin marca; la marca solo se anade si cabe en 65 caracteres (la marca ya va en og:site_name y en el dominio).
export function seoTitle(core) {
  const c = String(core).replace(/\s+/g, ' ').trim();
  return (c + ' | ' + BRAND).length <= 65 ? c + ' | ' + BRAND : c;
}
// Descripcion: frases completas mientras quepan en `max`; si ni la primera cabe, corta en palabra y cierra con puntos suspensivos.
export function seoDesc(text, max = 158) {
  const t = String(text).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const P = t.replace(/EE\. UU\./g, 'EE. UU.');
  const parts = P.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÇÑ¿¡"“])/);
  let out = '';
  for (const s of parts) { const n = out ? out + ' ' + s : s; if (n.length > max) break; out = n; }
  if (out.length >= 60) return out.replace(/ /g, ' ');
  const cut = P.slice(0, max - 1), sp = cut.lastIndexOf(' ');
  return (sp > 60 ? cut.slice(0, sp) : cut).replace(/[\s,;:·(–-]+$/, '').replace(/ /g, ' ') + '…';
}
// Etiquetas para compartir (Open Graph y X/Twitter) con la imagen de marca del idioma de la pagina.
export function socialMeta(lg) {
  const img = ORIGIN + '/assets/' + (OG[lg] || OG.es);
  return '<meta property="og:image" content="' + img + '"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + img + '">';
}

// Puerta de calidad: una landing generada solo se indexa si trae datos suficientes. Con menos, la pagina sigue existiendo y enlazada
// (utiles para quien llega desde el sitio), pero lleva noindex,follow y no va en el sitemap. Se reevalua en cada regeneracion:
// cuando los datos crecen, la pagina vuelve sola al indice.
export const GATE = { minRows: 3, minWords: 150, minHubLinks: 3, product: { minRows: 1, minWords: 150 } };   // producto: una pagina de precio con un dato real, fecha, fuente y FAQ es util aunque tenga una fila
export const isProduct = u => /\/(precios|prices|prix|prezzi)\/[^/]+\/$/.test(String(u));
export const NOINDEX = '<meta name="robots" content="noindex,follow">';
export function pageQuality(html) {
  const art = (/<article[\s\S]*?<\/article>/.exec(html) || [html])[0];
  const rows = (art.match(/<tr[^>]*>(?:(?!<\/tr>)[\s\S])*?<td/g) || []).length;
  const words = art.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return { rows, words };
}
export function isThinLeaf(q, u) { const g = isProduct(u) ? GATE.product : GATE; return q.rows < g.minRows || q.words < g.minWords; }
