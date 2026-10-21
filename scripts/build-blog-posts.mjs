// Blog para la app: las notas de js/blog.js (escritas a mano, 4 idiomas) como JSON -> data/blog/posts.json.
// La web sigue siendo la fuente: se evalúa el bloque de textos de js/blog.js sin tocar el DOM. Sin fecha de generación para no crear cambios vacíos.
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(ROOT, 'js', 'blog.js'), 'utf8');
const a = src.indexOf('var SRC = {'), b = src.indexOf('var STRINGS = buildStrings();');
if (a < 0 || b < 0) throw new Error('build-blog-posts: no se encontró el bloque de textos de js/blog.js');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(src.slice(a, b) + '\nthis.__S = buildStrings();', ctx);
const S = ctx.__S, out = { schemaVersion: 1, langs: {} };
for (const l of ['es', 'en', 'fr', 'it']) {
  const t = S[l]; if (!t || !Array.isArray(t.posts) || !t.posts.length) throw new Error('build-blog-posts: faltan notas en ' + l);
  // Norma: cada nota tiene UNA fecha (la de publicacion, ISO en date); las fechas de las fuentes van junto a cada fuente. Orden: la mas nueva primero.
  t.posts.forEach((p, i) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date || '')) throw new Error('build-blog-posts: nota sin fecha ISO (' + l + ' #' + i + ')');
    if (/·|\s-\s|–/.test(p.dateLabel || '')) throw new Error('build-blog-posts: la fecha visible debe ser una sola (' + l + ' #' + i + '): ' + p.dateLabel);
    if (i && t.posts[i - 1].date < p.date) throw new Error('build-blog-posts: notas desordenadas, la mas nueva va primero (' + l + ')');
  });
  out.langs[l] = { h1: t.h1, sub: t.sub, updated: t.updated, disclaimer: t.disclaimer,
    posts: t.posts.map(p => ({ category: p.category, date: p.date, dateLabel: p.dateLabel, title: p.title, paras: [p.para1, p.para2].filter(Boolean), sources: p.sources.filter(s => /^https:\/\//.test(s.url)) })) };
}
fs.mkdirSync(path.join(ROOT, 'data', 'blog'), { recursive: true });
const f = path.join(ROOT, 'data', 'blog', 'posts.json'), body = JSON.stringify(out) + '\n';
if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== body) fs.writeFileSync(f, body);
console.log('blog posts: ' + out.langs.es.posts.length + ' notas x 4 idiomas');
