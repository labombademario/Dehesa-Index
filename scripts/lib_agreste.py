"""Agreste (SSP, ministerio de Agricultura de Francia): descarga con reintentos y lectores de Excel sin dependencias.

Agreste es intermitente: a ratos responde 400, "Acces non autorise" (una pagina HTML con estado 200) o agota el tiempo. Por eso toda descarga de un fichero
comprueba el tipo real (firma PK/zip/OLE o texto) y reintenta con esperas largas. Nunca se inventa un dato: si no se puede leer, la pipeline conserva lo publicado.
"""
import html, io, re, time, urllib.parse, urllib.request, zipfile
import xml.etree.ElementTree as ET

H = "https://agreste.agriculture.gouv.fr/agreste-web/"
DL = H + "download/publication/publie/"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)", "Accept": "*/*", "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.5"}
ERR_MARK = "Accès non autorisé"


def _get(url, timeout=120):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.headers.get("content-type", ""), r.read()


def fetch(url, kind="bin", tries=6, wait=20, timeout=120, log=print):
    """kind: 'bin' (zip/xlsx/xls: exige la firma del formato), 'csv'/'html' (texto). Devuelve bytes o lanza RuntimeError tras agotar los intentos."""
    last = "?"
    for i in range(tries):
        try:
            st, ct, b = _get(url, timeout)
            head = b[:4]
            if st == 200 and kind == "bin" and (head[:2] == b"PK" or head == b"\xd0\xcf\x11\xe0"):
                return b
            if st == 200 and kind in ("csv", "html") and ERR_MARK not in b[:6000].decode("utf8", "replace") and len(b) > 300:
                return b
            last = "HTTP %s %s %d bytes %s" % (st, ct[:30], len(b), re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", b[:1500].decode("utf8", "replace")))[:80])
        except Exception as e:
            last = str(e)[:120]
        log("agreste: intento %d/%d fallido (%s)" % (i + 1, tries, last))
        time.sleep(wait * (i + 1) if i < tries - 1 else 0)
    raise RuntimeError("%s -> %s" % (url, last))


def clean_html(t):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", t, flags=re.S)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t))).strip()


def detail_page(pub_id, log=print):
    """HTML de una ficha de publicacion /disaron/<id>/detail/."""
    return fetch(H + "disaron/%s/detail/" % pub_id, kind="html", log=log).decode("utf8", "replace")


def detail_files(pub_id, log=print):
    """URL absolutas de los ficheros descargables de la ficha (sin jsessionid)."""
    t = detail_page(pub_id, log)
    out = []
    for m in re.findall(r'href="([^"#]+)"', t):
        m = html.unescape(re.sub(r";jsessionid=[^/?\"]*", "", m))
        if re.search(r"/download/publication/", m, re.I):
            out.append(m if m.startswith("http") else "https://agreste.agriculture.gouv.fr" + m)
    return list(dict.fromkeys(out)), t


def pick(urls, pattern):
    for u in urls:
        if re.search(pattern, urllib.parse.unquote(u), re.I):
            return u
    return None


def quote_url(u):
    sp = urllib.parse.urlsplit(u)
    return urllib.parse.urlunsplit((sp.scheme, sp.netloc, urllib.parse.quote(urllib.parse.unquote(sp.path)), sp.query, ""))


# ---- xlsx sin dependencias -------------------------------------------------------------------------------------------------------------------------
_M = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def _col(ref):
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group():
        n = n * 26 + ord(ch) - 64
    return n - 1


class XL:
    """Lector de .xlsx por flujo (hojas grandes sin cargar todo el DOM). rows(nombre) -> listas de cadenas ('' si vacio)."""

    def __init__(self, data):
        self.z = zipfile.ZipFile(io.BytesIO(data) if isinstance(data, (bytes, bytearray)) else data)
        self.ss = []
        if "xl/sharedStrings.xml" in self.z.namelist():
            for ev, el in ET.iterparse(self.z.open("xl/sharedStrings.xml")):
                if el.tag == "{%s}si" % _M:
                    self.ss.append("".join(t.text or "" for t in el.iter("{%s}t" % _M)))
                    el.clear()
        wb = ET.fromstring(self.z.read("xl/workbook.xml"))
        rel = {r.get("Id"): r.get("Target") for r in ET.fromstring(self.z.read("xl/_rels/workbook.xml.rels"))}
        self.sheets = [(x.get("name"), rel[x.get("{%s}id" % _R)]) for x in wb.find("{%s}sheets" % _M)]

    def names(self):
        return [n for n, _ in self.sheets]

    def rows(self, name):
        tg = dict(self.sheets)[name]
        p = tg.lstrip("/") if tg.startswith("/") else "xl/" + tg
        for ev, el in ET.iterparse(self.z.open(p)):
            if el.tag == "{%s}row" % _M:
                v = {}
                for c in el.findall("{%s}c" % _M):
                    x = c.find("{%s}v" % _M)
                    if x is None or x.text is None:
                        t = c.find("{%s}is" % _M)
                        if t is not None:
                            v[_col(c.get("r"))] = "".join(q.text or "" for q in t.iter("{%s}t" % _M))
                        continue
                    v[_col(c.get("r"))] = self.ss[int(x.text)] if c.get("t") == "s" else x.text
                n = (max(v) + 1) if v else 0
                yield [v.get(i, "") for i in range(n)]
                el.clear()


def num(s):
    """'' / 'NC' / texto -> None; si no, float (entero si lo es)."""
    if s is None or s == "":
        return None
    try:
        f = float(s)
    except ValueError:
        return None
    if f != f:
        return None
    return int(f) if f == int(f) and abs(f) < 1e15 else round(f, 6)
