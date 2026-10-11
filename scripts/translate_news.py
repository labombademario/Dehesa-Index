#!/usr/bin/env python3
"""Traduccion automatica de los titulares de Noticias a los idiomas de la web (es, en, fr, it).

Entrada: data/views/news-feed.json (titular `h` y resumen `x` en el idioma original `l`). Salida: data/views/news-tr-<idioma>.json = {id: [titular, resumen]}
solo para los idiomas distintos del original. NUNCA sustituye al original: la web enseña el texto traducido marcado como «traduccion automatica» con enlace/indicacion
del idioma original, y el titular original sigue siendo el que enlaza a la fuente.
Motor: modelos Argos Translate (OPUS-MT, CC BY 4.0) ejecutados en local con CTranslate2; los idiomas sin modelo directo pasan por el ingles. Si un idioma no tiene modelo
(p. ej. croata), la noticia se queda sin traducir y se ve en su idioma original. Cada ejecucion traduce como mucho --limit noticias nuevas (el atraso se recupera en las siguientes).
Uso: python3 scripts/translate_news.py [--limit 120] [--models DIR]. Salida con codigo 0 aunque no haya modelos (la web sigue funcionando con los originales)."""
import argparse, datetime, glob, html, json, os, re, shutil, sys, time, urllib.request, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FEED = os.path.join(ROOT, 'data', 'views', 'news-feed.json')
TARGETS = ('es', 'en', 'fr', 'it')
INDEX = 'https://raw.githubusercontent.com/argosopentech/argospm-index/main/index.json'
ENGINE = 'Argos Translate (OPUS-MT, CC BY 4.0)'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}

def log(*a): print(*a, flush=True)
def fetch(url, t=300):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=t) as r: return r.read()

class Models:
    def __init__(self, base):
        self.base = base; os.makedirs(base, exist_ok=True); self.idx = None; self.loaded = {}; self.missing = set(); self.failed = set(); self.downloaded = 0
    def _index(self):
        if self.idx is None: self.idx = {(p['from_code'], p['to_code']): p for p in json.loads(fetch(INDEX))}
        return self.idx
    def path(self, a, b):
        d = os.path.join(self.base, '%s_%s' % (a, b))
        if os.path.isdir(os.path.join(d, 'model')): return d
        p = self._index().get((a, b))
        if not p: return None
        url = next((l for l in p['links'] if l.startswith('https://')), None)
        if not url: return None
        z = os.path.join(self.base, '%s_%s.zip' % (a, b)); open(z, 'wb').write(fetch(url))
        tmp = d + '.tmp'
        with zipfile.ZipFile(z) as f: f.extractall(tmp)
        os.remove(z)
        top = next(os.path.join(r) for r, ds, fs in os.walk(tmp) if 'model' in ds and ('sentencepiece.model' in fs or 'bpe.model' in fs))
        os.rename(top, d); shutil.rmtree(tmp, ignore_errors=True); self.downloaded += 1
        return d
    def get(self, a, b):
        if (a, b) in self.loaded: return self.loaded[(a, b)]
        if (a, b) in self.missing: return None
        try: d = self.path(a, b)
        except Exception as e: log('  modelo %s->%s: fallo de descarga: %s' % (a, b, repr(e)[:120])); self.failed.add((a, b)); self.missing.add((a, b)); return None
        if not d: self.missing.add((a, b)); return None
        import ctranslate2, sentencepiece
        meta = json.load(open(os.path.join(d, 'metadata.json'))) if os.path.exists(os.path.join(d, 'metadata.json')) else {}
        tok = None
        try:
            if os.path.exists(os.path.join(d, 'sentencepiece.model')):
                sp = sentencepiece.SentencePieceProcessor(); sp.Load(os.path.join(d, 'sentencepiece.model'))
                tok = (lambda t, sp=sp: sp.encode(t, out_type=str), lambda h: ''.join(h).replace('\u2581', ' '))
            else:   # paquetes antiguos de Argos: codigos BPE (subword-nmt) con tokenizador OpenNMT «conservative»
                import pyonmttok
                pt = pyonmttok.Tokenizer('conservative', bpe_model_path=os.path.join(d, 'bpe.model'), joiner='@@', joiner_annotate=True)   # estilo subword-nmt: «pal@@ abra»
                fix = lambda t: [x[2:] if x.startswith('@@') and len(x) > 2 and not re.search(r'\w', x[2:]) else x for x in t]   # la puntuacion va suelta, sin marca
                tok = (lambda t, pt=pt, fix=fix: fix(pt.tokenize(t)[0]), lambda h: re.sub(r'@@ ?', '', ' '.join(h)))
        except Exception as e: log('  modelo %s->%s: tokenizador no compatible (%s)' % (a, b, repr(e)[:80])); self.missing.add((a, b)); return None
        tr = ctranslate2.Translator(os.path.join(d, 'model'), device='cpu', inter_threads=1, intra_threads=2)
        m = self.loaded[(a, b)] = (tr, tok, meta.get('source_prefix') or '', meta.get('target_prefix') or '')
        return m

def sentences(t):
    return [s for s in re.split(r'(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ0-9«"“¿¡])', t.strip()) if s]

def mt(models, a, b, texts):
    """Traduce una lista de frases de a a b; None donde no hay modelo o el resultado no es fiable."""
    m = models.get(a, b)
    if not m: return [None] * len(texts)
    tr, (enc, dec), sp_pre, tp_pre = m
    toks = [enc(sp_pre + t) for t in texts]
    res = tr.translate_batch(toks, target_prefix=[[tp_pre]] * len(toks) if tp_pre else None, beam_size=4, length_penalty=0.2, replace_unknowns=True, max_batch_size=16, max_decoding_length=256)
    out = []
    for t, r in zip(texts, res):
        h = r.hypotheses[0]
        if tp_pre and h and h[0] == tp_pre: h = h[1:]
        s = html.unescape(re.sub(r'\s+', ' ', dec(h))).strip()   # los modelos Argos emiten trozos con «▁» como espacio
        s = re.sub(r'\s+([.,;:!?%)\]])', r'\1', re.sub(r'([(\[])\s+', r'\1', s))
        # descarta lo no fiable: vacio, mucho mas largo que el original o con una palabra repetida muchas veces seguidas
        if not s or len(s) > 3 * len(t) + 40 or re.search(r'\b(\w+)(?:\W+\1\b){3,}', s, re.I): out.append(None)
        else: out.append(s)
    return out

def translate_item(models, src, h, x, tgts):
    """-> {destino: [titular, resumen]} para cada destino traducible. Pasa por el ingles si no hay modelo directo."""
    hs = sentences(h) or [h]; nh = len(hs); parts = hs + sentences(x)
    res = {}
    en = None
    if src == 'en': en = parts
    elif models.get(src, 'en'):
        en = mt(models, src, 'en', parts)
        if any(v is None for v in en[:nh]): en = None
    for t in tgts:
        if t == 'en':
            if en and src != 'en' and all(en[:nh]): res['en'] = [' '.join(en[:nh]), ' '.join(v for v in en[nh:] if v)]
            continue
        base, a = (parts, src) if models.get(src, t) else (en, 'en')
        if not base: continue
        out = mt(models, a, t, base)
        if all(out[:nh]) and not (t != 'en' and base is en and out[:nh] == base[:nh] and src != 'en'): res[t] = [' '.join(out[:nh]), ' '.join(v for v in out[nh:] if v)]
    return res

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--limit', type=int, default=120); ap.add_argument('--models', default=os.path.expanduser('~/.cache/dehesa-mt')); ap.add_argument('--sample', default='')
    a = ap.parse_args()
    feed = json.load(open(FEED)); items = feed['items']
    cur = {}
    for t in TARGETS:
        f = os.path.join(ROOT, 'data', 'views', 'news-tr-%s.json' % t)
        cur[t] = (json.load(open(f)).get('items') if os.path.exists(f) else None) or {}
    ids = {x['id'] for x in items}
    for t in TARGETS: cur[t] = {k: v for k, v in cur[t].items() if k in ids}
    done = set().union(*[set(c) for c in cur.values()]); tried = set()
    ft = os.path.join(ROOT, 'data', 'views', 'news-tr-tried.json')
    if os.path.exists(ft): tried = set(json.load(open(ft)).get('ids', [])) & ids
    todo = [x for x in items if x['id'] not in done and x['id'] not in tried and x.get('l') and x.get('h')]
    todo.sort(key=lambda x: (x['d'], x.get('v', 0)), reverse=True)
    log('%d noticias, %d pendientes (limite %d)' % (len(items), len(todo), a.limit))
    models = Models(a.models); t0 = time.time(); n = 0
    for x in todo[:a.limit]:
        if time.time() - t0 > 900: log('tiempo agotado'); break
        tgts = [t for t in TARGETS if t != x['l']]
        try: r = translate_item(models, x['l'], x['h'], x.get('x') or '', tgts)
        except Exception as e: log('  fallo en %s: %s' % (x['id'], repr(e)[:160])); r = {}
        for t, v in r.items(): cur[t][x['id']] = v
        if (r or (x['l'], 'en') in models.missing and x['l'] != 'en') and not models.failed: tried.add(x['id'])
        n += 1
    log('traducidas %d noticias en %.0f s; modelos descargados: %d' % (n, time.time() - t0, models.downloaded))
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    for t in TARGETS:
        json.dump({'generatedAt': now, 'engine': ENGINE, 'target': t, 'items': cur[t]}, open(os.path.join(ROOT, 'data', 'views', 'news-tr-%s.json' % t), 'w'), ensure_ascii=False, separators=(',', ':'))
    json.dump({'ids': sorted(tried)}, open(ft, 'w'), separators=(',', ':'))
    if a.sample:
        s = {x['id']: {'src': x['l'], 'h': x['h']} for x in items}
        json.dump({k: {'src': s[k], 'tr': {t: cur[t][k] for t in TARGETS if k in cur[t]}} for k in list(s)[:0] + sorted({k for t in TARGETS for k in cur[t]})[:200]}, open(a.sample, 'w'), ensure_ascii=False, indent=1)
    open(os.path.join(a.models, '.downloads'), 'w').write(str(models.downloaded))

if __name__ == '__main__':
    try: main()
    except Exception as e:
        log('ERROR no fatal:', repr(e)[:300]); sys.exit(0)
