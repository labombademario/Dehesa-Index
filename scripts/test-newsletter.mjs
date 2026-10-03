// Suscripcion del blog (Substack): el formulario exige email y consentimiento, enlaza al aviso legal, y el aviso legal
// nombra al proveedor, remite a SU politica de privacidad y no afirma nada sobre borrado que no hayamos comprobado.
import fs from 'fs';
const R = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const shared = R('js/shared.js'), blog = R('js/blog.js'), legal = R('js/legal.js');
let fail = 0; const bad = m => { fail++; console.log('FALLA', m); };
const m = /newsletter:\s*\{\s*action:\s*'([^']+)',\s*provider:\s*'([^']+)'/.exec(shared);
if (!m) bad('DehesaShared.newsletter sin action/provider');
else { if (!/^https:\/\/[a-z0-9-]+\.substack\.com\//.test(m[1])) bad('action no apunta a una publicacion de Substack: ' + m[1]); if (!/Substack/.test(m[2])) bad('provider no nombra a Substack'); }
if (!/name="email" type="email" required/.test(blog)) bad('el campo de email no es obligatorio');
if (!/<input type="checkbox" required>/.test(blog)) bad('el consentimiento no es obligatorio');
if (!/href="legal\.html"/.test(blog)) bad('el formulario no enlaza al aviso legal');
if (!/method="post"/.test(blog) || !/target="_blank"/.test(blog)) bad('el formulario debe ser POST y abrirse en otra ventana');
const nlp = legal.slice(legal.indexOf('var NLP')); 
if ((nlp.match(/https:\/\/substack\.com\/privacy/g) || []).length < 4) bad('el aviso legal debe enlazar a la privacidad de Substack en los 4 idiomas');
if (/se borra tu direcci|deletes your address|supprime votre adresse|viene cancellato/.test(nlp)) bad('el aviso legal afirma un borrado no comprobado');
console.log('newsletter: ' + fail + ' fallos'); process.exit(fail ? 1 : 0);
