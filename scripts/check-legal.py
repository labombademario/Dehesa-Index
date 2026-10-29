#!/usr/bin/env python3
"""Comprueba que el aviso legal (js/legal.js) dice lo que el sitio hace de verdad, y escribe data/legal-review.json.

No «revisa» el texto jurídico: eso lo hace una persona. Lo que si puede hacer una maquina, todos los dias, es contrastar afirmaciones comprobables:
  - cada clave de localStorage/sessionStorage que usa el codigo esta nombrada en el aviso (y en los cuatro idiomas con el mismo numero de bloques),
  - el sitio no carga scripts, hojas de estilo, imagenes ni iframes de terceros desde su HTML, ni usa cookies, ni analitica,
  - las peticiones fetch a otros dominios son solo las que el aviso declara,
  - el correo de contacto del aviso es el de la pagina de contacto.
El fichero recoge: fecha de la ultima comprobacion automatica, resultado de cada control y la fecha en que cambio el texto del aviso (huella sha256 del bloque de textos).
Uso: python3 scripts/check-legal.py            escribe data/legal-review.json (sale con 1 si algun control falla)
     python3 scripts/check-legal.py --check    CI: falla si un control falla o si el texto cambio y el fichero no se regenero"""
import datetime, glob, hashlib, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'legal-review.json'
ALLOWED_FETCH = {'https://dehesaindex.com'}     # api-docs.js: ejemplo de la API propia
THIRD_PARTY_DECLARED = {'www.ifap.pt': 'ifap.pt'}   # visor de parcelas de Portugal: declarado en «Servicios de terceros»
ANALYTICS = re.compile(r'google-analytics|googletagmanager|(?-i:\bgtag\()|plausible\.io|hotjar|fbq\(|doubleclick|matomo|segment\.com|clarity\.ms|mixpanel|sentry\.io', re.I)


def rd(p): return Path(p).read_text(encoding='utf-8', errors='ignore')


def text_block(src):
    i = src.index('var STRINGS = {'); j = src.index('\n  };', i)
    return src[i:j]


def storage_keys():
    keys = {}
    for f in sorted(glob.glob(str(ROOT / 'js' / '*.js'))):
        s = rd(f)
        for m in re.finditer(r"(?:localStorage|sessionStorage)\s*\.\s*(?:getItem|setItem|removeItem)\(\s*['\"]([^'\"]+)['\"]", s):
            keys.setdefault(m.group(1), set()).add(Path(f).name)
        for m in re.finditer(r"(?:localStorage|sessionStorage)\s*\.\s*(?:getItem|setItem|removeItem)\(\s*([A-Za-z_$][\w$]*)\s*[,)]", s):
            for d in re.finditer(r"(?:var\s+|,\s*|;\s*)" + re.escape(m.group(1)) + r"\s*=\s*['\"]([A-Za-z][\w:.-]{3,})['\"]", s):
                keys.setdefault(d.group(1), set()).add(Path(f).name)
            for d in re.finditer(r"(?:var\s+|,\s*|;\s*)" + re.escape(m.group(1)) + r"\s*=\s*['\"]([\w-]+-)['\"]\s*\+", s):
                keys.setdefault(d.group(1), set()).add(Path(f).name)
    return keys


def main():
    legal = rd(ROOT / 'js' / 'legal.js')
    block = text_block(legal)
    checks = []

    def add(i, ok, detail): checks.append({'id': i, 'ok': bool(ok), 'detail': detail})

    keys = storage_keys()
    miss = sorted(k for k in keys if (k[:-1] if k.endswith('-') else k) not in block)
    add('storage-keys-listed', not miss and len(keys) >= 15, ('%d claves de almacenamiento local en el codigo, todas nombradas en el aviso' % len(keys)) if not miss and len(keys) >= 15 else 'sin nombrar en el aviso: %s' % ', '.join(miss[:12]) if miss else 'se esperaban al menos 15 claves y se leyeron %d' % len(keys))

    parts = re.split(r'\n    (?:es|en|fr|it): \{\n      title', block)[1:]
    cnt = [p.split('sections:')[1].count("{ b: '") for p in parts if 'sections:' in p]
    add('four-languages-same-keys', len(cnt) == 4 and len(set(cnt)) == 1, 'bloques de almacenamiento por idioma (es, en, fr, it): %s' % cnt)

    html = {f: rd(f) for f in glob.glob(str(ROOT / '*.html'))}
    ext = sorted({'%s: %s' % (Path(f).name, m.group(1)[:60]) for f, s in html.items() for m in re.finditer(r'<(?:script|iframe|img|link)\b[^>]+(?:src|href)="(https?://[^"]+)"', s) if not re.search(r'<link\b[^>]+rel="(?:canonical|alternate|me)"', m.group(0)) and 'dehesaindex.com' not in m.group(1)})
    add('no-third-party-embeds', not ext, 'ninguna pagina carga scripts, estilos, imagenes ni iframes de otros dominios' if not ext else 'carga externa: ' + '; '.join(ext[:6]))

    jsfiles = {f: rd(f) for f in glob.glob(str(ROOT / 'js' / '*.js'))}
    ana = sorted({Path(f).name for f, s in list(jsfiles.items()) + list(html.items()) if ANALYTICS.search(s) and Path(f).name not in ('legal.js', 'sw.js')})
    add('no-analytics', not ana, 'no hay analitica ni rastreo en el codigo' if not ana else 'posible analitica en: ' + ', '.join(ana[:8]))

    ck = sorted(Path(f).name for f, s in jsfiles.items() if re.search(r'document\.cookie\s*=', s))
    add('no-cookies', not ck, 'el codigo no escribe cookies' if not ck else 'escribe cookies: ' + ', '.join(ck))

    hosts = {}
    for f, s in jsfiles.items():
        for m in re.finditer(r"fetch\(\s*['\"](https?://[^'\"/]+)", s): hosts.setdefault(m.group(1), set()).add(Path(f).name)
    bad = sorted(h for h in hosts if h not in ALLOWED_FETCH and h.split('//')[1] not in THIRD_PARTY_DECLARED)
    decl = all(v in legal for v in THIRD_PARTY_DECLARED.values())
    add('third-party-requests-declared', not bad and decl, 'peticiones a otros dominios: solo las declaradas (IFAP Portugal)' if not bad and decl else 'peticiones no declaradas: %s' % ', '.join(bad or ['(falta mencionar ifap.pt en el aviso)']))

    em = [e.rstrip('.') for e in re.findall(r'[\w.+-]+@[\w-]+\.[\w.]+', block)]
    em = sorted(set(e for e in em if e.endswith('gmail.com') or '@' in e))
    contact = rd(ROOT / 'contacto.html') + rd(ROOT / 'js' / 'shared.js')
    add('contact-email-matches', len(em) == 1 and em[0] in contact, 'el correo del aviso (%s) es el de la pagina de contacto' % em[0] if len(em) == 1 and em[0] in contact else 'correos en el aviso: %s' % em)

    h = hashlib.sha256(block.encode('utf-8')).hexdigest()
    prev = json.loads(rd(OUT)) if OUT.exists() else {}
    today = datetime.date.today().isoformat()
    ok = all(c['ok'] for c in checks)
    if '--check' in sys.argv:
        for c in checks:
            if not c['ok']: print('FALLA', c['id'], c['detail'])
        if prev.get('textHash') != h: print('FALLA el texto del aviso cambio y data/legal-review.json no se regenero: python3 scripts/check-legal.py'); ok = False
        print('aviso legal: %d controles, %s' % (len(checks), 'OK' if ok else 'con fallos')); sys.exit(0 if ok else 1)
    doc = {'schemaVersion': 1, 'checkedAt': today, 'ok': ok, 'textHash': h, 'textChangedAt': today if prev.get('textHash') != h else prev.get('textChangedAt', today), 'checks': checks,
           'note': 'Control automatico de afirmaciones comprobables del aviso frente al codigo del sitio. No sustituye la revision juridica del texto, que hace una persona.'}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    for c in checks: print('OK   ' if c['ok'] else 'FALLA', c['id'], '-', c['detail'])
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
