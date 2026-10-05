#!/usr/bin/env python3
"""PAC 2023-2027 de la UE por Estado miembro -> data/cap/eu/allocations.json
Fuente: Reglamento (UE) 2021/2115 (planes estrategicos de la PAC), version consolidada mas reciente de EUR-Lex:
  - Anexo V: asignaciones para pagos directos por ano natural (EUR, precios corrientes).
  - Anexo XI: ayuda de la Union (FEADER) para desarrollo rural por ano (EUR, precios corrientes).
Comprobaciones: estan los 27 Estados, cada fila tiene 5 anos y, en el anexo XI, la suma de paises coincide con la fila 'Total EU-27'.
Si algo no cuadra, falla y se conserva el fichero anterior. Tambien se guarda la frase de reutilizacion del aviso legal de EUR-Lex como evidencia.
Son importes del reglamento (techos/asignaciones), no pagos ejecutados ni importes por hectarea."""
import datetime, html, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUTF = ROOT / 'data' / 'cap' / 'eu' / 'allocations.json'; LOGF = ROOT / 'data' / 'cap' / 'eu' / 'allocations-log.txt'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def cellar(celex):
    """Mismo texto oficial desde el repositorio de la Oficina de Publicaciones (Cellar), por negociacion de contenido; EUR-Lex a veces responde vacio a los runners."""
    last = None
    for acc in ('application/xhtml+xml', 'text/html'):
        try:
            req = urllib.request.Request('https://publications.europa.eu/resource/celex/' + celex, headers={'User-Agent': UA['User-Agent'], 'Accept': acc, 'Accept-Language': 'eng'})
            with urllib.request.urlopen(req, timeout=180) as r:
                b = r.read()
                if r.headers.get('Content-Type', '').startswith('application/zip') or b[:2] == b'PK':
                    import io, zipfile
                    z = zipfile.ZipFile(io.BytesIO(b)); n = next((x for x in z.namelist() if x.lower().endswith(('.xhtml', '.html', '.htm'))), None)
                    if n: return z.read(n).decode('utf-8', 'replace')
                return b.decode('utf-8', 'replace')
        except Exception as e: last = e
    raise RuntimeError('Cellar %s -> %s' % (celex, last))
def get(u, t=180):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read().decode('utf-8', 'replace')
        except Exception as e: last = e; time.sleep(10 * (i + 1))
    raise RuntimeError('%s -> %s' % (u, last))
MS = [('Belgium', 'BE'), ('Bulgaria', 'BG'), ('Czechia', 'CZ'), ('Denmark', 'DK'), ('Germany', 'DE'), ('Estonia', 'EE'), ('Ireland', 'IE'), ('Greece', 'EL'), ('Spain', 'ES'), ('France', 'FR'), ('Croatia', 'HR'), ('Italy', 'IT'), ('Cyprus', 'CY'),
      ('Latvia', 'LV'), ('Lithuania', 'LT'), ('Luxembourg', 'LU'), ('Hungary', 'HU'), ('Malta', 'MT'), ('Netherlands', 'NL'), ('Austria', 'AT'), ('Poland', 'PL'), ('Portugal', 'PT'), ('Romania', 'RO'), ('Slovenia', 'SI'), ('Slovakia', 'SK'), ('Finland', 'FI'), ('Sweden', 'SE')]
CELL = ' ¦ '   # separador de celdas: los miles van con espacios, asi que las columnas solo se distinguen por la celda de la tabla
def text(h, cells=False):
    t = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', h)
    if cells: t = re.sub(r'(?i)</t[dh]>', CELL, t)
    t = re.sub(r'<[^>]+>', ' ', t); t = html.unescape(t)
    t = re.sub(r'[▼►◄]\s*[A-Z]\d*', ' ', t)   # marcas de modificacion de la version consolidada
    return re.sub(r'[ \t\r\n ]+', ' ', t)
def cellint(c):
    c = c.strip()
    if not re.fullmatch(r'\d{1,3}(?:[  ]\d{3})*', c): return None
    return int(re.sub(r'\D', '', c))
def annex(t, title, nvals):
    i = -1
    for m in re.finditer(re.escape(title), t): i = m.start()   # la ultima aparicion: el anexo, no el indice
    if i < 0: raise RuntimeError('no esta el anexo: ' + title)
    cells = [c.strip() for c in t[i:i + 40000].split(CELL.strip())]
    yrs = [c[:4] for c in cells[:40] if re.match(r'20\d\d\b', c)][:5]   # «2027 and subsequent years» cuenta como 2027
    def row(label):
        for k, c in enumerate(cells):
            if c == label or c.startswith(label + ' '):
                vals = [cellint(x) for x in cells[k + 1:k + 1 + nvals]]
                if all(v is not None for v in vals): return vals
        return None
    out = {}
    for name, cc in MS:
        v = row(name)
        if not v: raise RuntimeError('%s: falta %s (o no tiene %d cifras)' % (title[:40], name, nvals))
        out[cc] = v
    return yrs, out, row('Total EU-27')
def main():
    cons = []
    for i in range(3):   # EUR-Lex a veces sirve una pagina de espera: se reintenta y se registra lo que devolvio
        try:
            allp = get('https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:32021R2115'); cons = sorted(set(re.findall(r'02021R2115-(\d{8})', allp)))
            if cons: break
            log('intento %d sin lista de versiones; respuesta:' % (i + 1), re.sub(r'\s+', ' ', allp[:300]))
        except Exception as e: log('intento %d fallido:' % (i + 1), str(e)[:200])
        time.sleep(20 * (i + 1))
    if not cons and OUTF.exists():   # sin lista: la ultima version consolidada que ya se leyo bien
        try: cons = [json.loads(OUTF.read_text())['source']['celex'].split('-')[1]]; log('se usa la ultima version conocida', cons[0])
        except Exception: pass
    if not cons: cons = ['20260818']; log('se usa la version consolidada verificada el 2026-10-05 (02021R2115-20260818)')
    v = cons[-1]; celex = '02021R2115-' + v; url = 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:' + celex
    log('version consolidada', celex)
    via = 'EUR-Lex'
    try: raw = get(url)
    except Exception as e: raw = ''; log('EUR-Lex no respondio:', str(e)[:200])
    t = text(raw, cells=True)
    if 'ANNEX V' not in t:
        log('EUR-Lex sin el anexo (respuesta de %d caracteres); se pide a Cellar' % len(raw))
        raw = cellar(celex); t = text(raw, cells=True); via = 'Cellar (Publications Office)'
        if 'ANNEX V' not in t: raise RuntimeError('ni EUR-Lex ni Cellar devuelven el anexo V (%d caracteres)' % len(raw))
    log('texto leido via', via)
    y5, dp, _ = annex(t, 'MEMBER STATES’ ALLOCATIONS FOR DIRECT PAYMENTS REFERRED TO IN ARTICLE 87(1), FIRST SUBPARAGRAPH', 5)
    y6, rd, rdt = annex(t, 'BREAKDOWN OF UNION SUPPORT FOR TYPES OF INTERVENTION FOR RURAL DEVELOPMENT', 6)
    if y5 != ['2023', '2024', '2025', '2026', '2027']: raise RuntimeError('anos inesperados en el anexo V: %s' % y5)
    if not rdt: raise RuntimeError('anexo XI sin fila Total EU-27')
    for k in range(5):   # cada ano: exacto
        s = sum(rd[cc][k] for cc in rd)
        if s != rdt[k]: raise RuntimeError('anexo XI: la suma de paises (%d) no cuadra con el total (%d) en %s' % (s, rdt[k], y6[k] if k < len(y6) else k))
    s5 = sum(rd[cc][5] for cc in rd)
    if abs(s5 - rdt[5]) > 5: raise RuntimeError('anexo XI: el total 2023-2027 no cuadra (%d frente a %d)' % (s5, rdt[5]))
    if s5 != rdt[5]: log('nota: el total 2023-2027 del anexo XI difiere en %d EUR de la suma de paises (redondeo del propio Reglamento); no se usa' % (rdt[5] - s5))
    for cc in rd:   # la columna de total por pais no se usa: los anos ya estan comprobados contra el total EU-27
        if sum(rd[cc][:5]) != rd[cc][5]: log('nota: %s, la suma 2023-2027 (%d) difiere de su columna de total (%d) en %d EUR; se publican los anos' % (cc, sum(rd[cc][:5]), rd[cc][5], rd[cc][5] - sum(rd[cc][:5])))
    log('anexo V: 27 paises; anexo XI: 27 paises, sumas comprobadas')
    reuse = ''
    try:   # evidencia de la licencia: articulo 3 de la Decision 2011/833/UE (reutilizacion de documentos), desde Cellar
        dt = text(cellar('32011D0833'))
        m = re.search(r'(Article \d+\s+General principle\s+.{0,900}?)\s+Article \d+\s', dt)
        reuse = m.group(1).strip() if m else ''
        log('Decision 2011/833/UE (principio general):', reuse[:700] or 'no encontrado')
    except Exception as e: log('AVISO: no se pudo leer la Decision 2011/833/UE:', str(e)[:200])
    notice = ''
    try:
        ln = text(get('https://eur-lex.europa.eu/content/legal-notice/legal-notice.html'))
        m = re.search(r'([^.]{0,200}(?:reuse|re-use)[^.]{0,300}\.)', ln, re.I); notice = m.group(1).strip() if m else ''
        if not notice: log('aviso legal sin la palabra reuse; inicio de la respuesta:', ln[:300])
        log('aviso legal EUR-Lex (reutilizacion):', notice[:400] or 'no encontrado')
    except Exception as e: log('AVISO: no se pudo leer el aviso legal:', str(e)[:200])
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'sourceIds': ['eur_lex'],
           'source': {'title': 'Regulation (EU) 2021/2115 (CAP Strategic Plans Regulation)', 'celex': celex, 'consolidatedVersion': '%s-%s-%s' % (v[:4], v[4:6], v[6:]), 'url': url,
                      'legalNoticeExcerpt': notice[:600], 'reuseDecisionExcerpt': reuse[:800], 'readVia': via, 'note': 'Allocations set in the Regulation (current prices). They are ceilings/allocations, not payments made, and not amounts per hectare. Only the Official Journal text is authentic.'},
           'unit': 'EUR (current prices)', 'directPayments': {'annex': 'V', 'years': y5, 'countries': dp},
           'ruralDevelopment': {'annex': 'XI', 'years': ['2023', '2024', '2025', '2026', '2027'], 'countries': {cc: vals[:5] for cc, vals in rd.items()}, 'totalEU27': rdt[:5]}}
    OUTF.parent.mkdir(parents=True, exist_ok=True)
    OUTF.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8'); LOGF.write_text('\n'.join(LOG) + '\n', encoding='utf-8')
if __name__ == '__main__':
    try: main()
    except Exception as e:
        log('FALLO:', str(e)[:400]); LOGF.parent.mkdir(parents=True, exist_ok=True); LOGF.write_text('\n'.join(LOG) + '\n', encoding='utf-8'); sys.exit(1)
