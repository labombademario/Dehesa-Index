// Auditoria de traducciones: busca en js/*.js los bloques {es:..., en:..., fr:..., it:...} y compara los cuatro idiomas.
// Informa de: idioma ausente, claves que faltan, cadenas vacias, cadenas iguales al español (sin traducir) y español colado en otros idiomas.
// Uso: NODE_PATH=$(npm root -g) node scripts/audit-i18n.mjs [--json]   (necesita el paquete typescript solo como analizador)
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path';
const require = createRequire(import.meta.url); const ts = require('typescript');
const LG = ['es', 'en', 'fr', 'it'];
const ES_WORDS = /\b(el|los|las|del|para|con|por|una|que|sus|más|años|año|datos|precio|precios|fuente|fuentes|meses|semana|última|último|sin|este|esta|según|desde|hasta|entre|ganado|leche|país|países|de la|superficie)\b/gi;
const EN_WORDS = /\b(the|and|of|for|with|from|this|that|are|is|data|price|prices|source|sources|last|month|week)\b/gi;
function name(p) { const n = p.name; return n ? (ts.isIdentifier(n) || ts.isStringLiteral(n) ? n.text : null) : null; }
function val(n, src) { // devuelve {t:'s',v} | {t:'o',k:{}} | {t:'a',e:[]} | {t:'f',v}
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return { t: 's', v: n.text };
  if (ts.isObjectLiteralExpression(n)) { const k = {}; for (const p of n.properties) { const nm = name(p); if (nm == null) continue; if (ts.isPropertyAssignment(p)) k[nm] = val(p.initializer, src); else if (ts.isMethodDeclaration(p)) k[nm] = { t: 'f', v: p.getText(src) }; } return { t: 'o', k }; }
  if (ts.isArrayLiteralExpression(n)) return { t: 'a', e: n.elements.map(e => val(e, src)) };
  if (ts.isParenthesizedExpression(n)) return val(n.expression, src);
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) { const a = val(n.left, src), b = val(n.right, src); if (a.t === 's' && b.t === 's') return { t: 's', v: a.v + b.v }; return { t: 'f', v: n.getText(src) }; }
  return { t: 'f', v: n.getText(src) };
}
const out = []; const DUMP = [];
function walkCmp(path, vs, loc) { // vs: {lang: val}
  const langs = Object.keys(vs);
  const types = new Set(langs.map(l => vs[l].t));
  if (types.size > 1 && !(types.size === 2 && types.has('f') && types.has('s'))) { out.push({ loc, path, kind: 'tipo distinto', detail: langs.map(l => l + ':' + vs[l].t).join(' ') }); return; }
  const t = vs[langs[0]].t;
  if (t === 'o') {
    const keys = new Set(langs.flatMap(l => Object.keys(vs[l].k)));
    for (const k of keys) { const have = langs.filter(l => vs[l].k[k] !== undefined); const miss = langs.filter(l => vs[l].k[k] === undefined); if (miss.length) out.push({ loc, path: path + '.' + k, kind: 'clave ausente', detail: 'falta en ' + miss.join(',') }); if (have.length > 1) walkCmp(path + '.' + k, Object.fromEntries(have.map(l => [l, vs[l].k[k]])), loc); }
  } else if (t === 'a') {
    const n = langs.map(l => vs[l].e.length); if (new Set(n).size > 1) out.push({ loc, path, kind: 'lista de distinta longitud', detail: langs.map((l, i) => l + ':' + n[i]).join(' ') });
    const m = Math.min(...n); for (let i = 0; i < m; i++) walkCmp(path + '[' + i + ']', Object.fromEntries(langs.map(l => [l, vs[l].e[i]])), loc);
  } else if (t === 's') {
    for (const l of langs) DUMP.push({ loc, path, l, v: vs[l].v });
    const es = vs.es && vs.es.t === 's' ? vs.es.v : null;
    for (const l of langs) { const v = vs[l].v; if (!v.trim()) out.push({ loc, path, kind: 'vacia', detail: l }); }
    if (es && es.length >= 18) for (const l of langs) if (l !== 'es' && vs[l].t === 's') {
      const v = vs[l].v;
      if (v === es && /[a-záéíóúñ]{3}/i.test(v) && (v.match(ES_WORDS) || []).length >= 1 && !/^[\w\s.,:;()\/%€$£+·–—-]*\d[\w\s.,:;()\/%€$£+·–—-]*$/.test(v)) out.push({ loc, path, kind: 'igual al español', detail: l + ': ' + v.slice(0, 80) });
      else if (l !== 'es' && v !== es) { const sp = (v.match(ES_WORDS) || []).length, w = v.split(/\s+/).length; if (w >= 5 && sp >= 2) out.push({ loc, path, kind: 'español en ' + l, detail: v.slice(0, 80) }); }
    }
    if (vs.en && vs.en.t === 's') { for (const l of ['fr', 'it']) if (vs[l] && vs[l].t === 's' && vs[l].v === vs.en.v && vs.en.v.length >= 25 && (vs.en.v.match(EN_WORDS) || []).length >= 3) out.push({ loc, path, kind: 'igual al inglés', detail: l + ': ' + vs.en.v.slice(0, 80) }); }
  }
}
const files = fs.readdirSync('js').filter(f => f.endsWith('.js')).sort();
let groups = 0;
for (const f of files) {
  const src = ts.createSourceFile(f, fs.readFileSync('js/' + f, 'utf8'), ts.ScriptTarget.ES2019, true);
  (function visit(n) {
    if (ts.isObjectLiteralExpression(n)) {
      const props = {}; for (const p of n.properties) { const nm = name(p); if (nm && LG.includes(nm) && ts.isPropertyAssignment(p)) props[nm] = p; }
      const ks = Object.keys(props);
      if (ks.length >= 2 && ks.length === n.properties.length - n.properties.filter(p => !LG.includes(name(p))).length) {
        groups++; const loc = f + ':' + (src.getLineAndCharacterOfPosition(n.getStart()).line + 1);
        if (ks.length < 4 && ks.includes('es')) out.push({ loc, path: '', kind: 'idioma ausente', detail: 'falta ' + LG.filter(l => !ks.includes(l)).join(',') });
        else if (ks.length < 4) out.push({ loc, path: '', kind: 'idioma ausente', detail: 'tiene ' + ks.join(',') });
        walkCmp('', Object.fromEntries(ks.map(l => [l, val(props[l].initializer, src)])), loc);
        return; // no entrar dentro: ya comparado
      }
    }
    ts.forEachChild(n, visit);
  })(src);
}
if (process.argv.includes('--dump')) { fs.writeFileSync(process.argv[process.argv.indexOf('--dump') + 1], JSON.stringify(DUMP)); }
if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 1));
else { const by = {}; for (const o of out) (by[o.kind] = by[o.kind] || []).push(o); console.log('bloques de idiomas:', groups, '| hallazgos:', out.length); for (const [k, v] of Object.entries(by)) { console.log('\n== ' + k + ' (' + v.length + ')'); for (const o of v.slice(0, 40)) console.log(' ', o.loc, o.path, '-', o.detail); } }
