#!/usr/bin/env python3
"""España: existencias MENSUALES de arroz, cereales y oleaginosas (MAPA, SIEGA — «sistema informático de información de existencias para la garantía alimentaria»)
-> data/spain-siega-stats.json (formato de ficheros de estadisticas por pais, grupo «stocks»).

Fuente: el informe publico de Power BI «Evolucion de existencias» que el MAPA enlaza en sus paginas de cultivos herbaceos (cereales, arroz, oleaginosas). Los operadores declaran
existencias cada mes (Reglamento de Ejecucion (UE) 2022/791) y el MAPA publica el agregado nacional desde la campaña 2022/23. El informe no tiene API documentada: se consulta el mismo
extremo publico que usa el visor (`/public/reports/querydata`) con la clave del propio enlace publico. Si el visor cambia, el script falla en rojo y NO escribe nada: nunca se sustituye por una estimacion.
Se publica cada serie tal cual la da el informe (toneladas -> miles de toneladas, sin coeficientes: el arroz queda en su modalidad —cascara, descascarillado, blanqueado— y los cereales
en equivalente grano). Los aceites y las variedades de arroz (indica/japonica) del informe no se publican (ver SKIPPED). Las combinaciones producto/modalidad que no estan en LABELS ni en SKIPPED se descartan y se anotan en el log (no se inventa una etiqueta).
Uso: update-spain-siega.py [--out DIR] [--fixture DIR]   (--fixture lee las respuestas guardadas q_*.json en vez de llamar a la red; solo pruebas)"""
import argparse, base64, datetime, json, os, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
KEY = "eyJrIjoiOGVhODFiNWMtOTE0Zi00NjI2LWJhMjktMDU2YzgyMTFlNTcxIiwidCI6Ijk1MjIxYzAzLTRlYmYtNGViNS04Zjc4LTUzODA3MTAwMDRiYyIsImMiOjl9"
REPORT_URL = "https://app.powerbi.com/view?r=" + KEY
HOSTS = ["https://wabi-west-europe-d-primary-api.analysis.windows.net"]   # extremo que atiende el informe publico (el enrutador api.powerbi.com devuelve 403 desde los runners)
# (producto, modalidad) -> (texto de la etiqueta, clave corta del id). Etiquetas en ingles como el resto del catalogo; «oil» y «meal» evitan la palabra «aceite» (el catalogo la etiqueta como oliva).
LABELS = {
    ("AR", "CAS"): ("rice, paddy (in husk)", "rice-paddy"), ("AR", "DCA"): ("rice, husked (brown)", "rice-husked"), ("AR", "BLA"): ("rice, milled (whitened)", "rice-milled"),
    ("TB", "EGR"): ("common wheat, grain equivalent", "wheat-common"), ("TD", "EGR"): ("durum wheat, grain equivalent", "wheat-durum"),
    ("CB", "EGR"): ("barley, grain equivalent", "barley"), ("MZ", "EGR"): ("maize, grain equivalent", "maize"),
    ("CL", "GRA"): ("rapeseed, seed", "rapeseed-seed"), ("CL", "TOH"): ("rapeseed, meal and cake", "rapeseed-meal"),
    ("SJ", "GRA"): ("soybeans, seed", "soybean-seed"), ("SJ", "TOH"): ("soybean meal and cake", "soybean-meal"),
    ("GR", "GRA"): ("sunflower seed", "sunflower-seed"), ("GR", "TOH"): ("sunflower meal and cake", "sunflower-meal"),
}
# El informe trae tambien aceites (crudo, refinado, alto oleico, linoleico) y el arroz por variedad (indica, japonica; ya en equivalente de arroz blanqueado). No se publican:
# el presupuesto de datos de la ficha de España (scripts/page-budget.json) no admite cincuenta series mas, y las existencias de aceite no son el producto que sigue la web.
# Se pueden añadir a LABELS si se amplia ese presupuesto. Se descartan sin avisar en el log; cualquier otra combinacion nueva si avisa.
SKIPPED = {("AR", "IND"), ("AR", "JAP"), ("CL", "ACC"), ("CL", "ACR"), ("SJ", "ACC"), ("SJ", "ACR"), ("GR", "ACC"), ("GR", "ACR"), ("GR", "AOL"), ("GR", "LIN")}
MIN_SERIES = 10
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)

def http(url, data=None, headers=None, tries=3, timeout=120):
    last = None
    for i in range(tries):
        try:
            h = dict(UA); h.update(headers or {})
            with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=timeout) as r: return r.read().decode("utf-8", "replace")
        except Exception as e:
            last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s -> %s" % (url[:120], str(last)[:160]))

def decode(obj):
    """Respuesta de querydata (formato DSR de Power BI) -> (nombres de columna, filas). Los valores repetidos (R) y nulos (Ø) se expanden; los textos van por diccionario (DN)."""
    d = obj["results"][0]["result"]["data"]
    names = [s["Name"] for s in d["descriptor"]["Select"]]
    ds = d["dsr"]["DS"][0]; vd = ds.get("ValueDicts", {}); rows = []; prev = None
    if ds.get("RT") or any("RT" in ph for ph in ds["PH"]): raise ValueError("respuesta paginada (el informe devolvio un testigo de reinicio: hay mas filas de las pedidas)")   # «IC» solo dice que el resultado llego entero a su ventana; no indica truncado
    for ph in ds["PH"]:
        for dm in ph.values():
            for r in dm:
                S = r.get("S") or (prev["S"] if prev else None)
                if S is None: raise ValueError("fila sin esquema")
                R = r.get("R", 0); Z = r.get("Ø", 0); C = list(r.get("C", [])); vals = []; ci = 0
                for i in range(len(S)):
                    if (Z >> i) & 1: vals.append(None)
                    elif (R >> i) & 1: vals.append(prev["vals"][i] if prev else None)
                    else: vals.append(C[ci] if ci < len(C) else None); ci += 1
                prev = {"S": S, "vals": vals}
                rows.append([vd[S[i]["DN"]][v] if (S[i].get("DN") and v is not None and S[i]["DN"] in vd) else v for i, v in enumerate(vals)])
    return names, rows

def col(entity, prop): return {"Column": {"Expression": {"SourceRef": {"Source": "t"}}, "Property": prop}, "Name": entity + "." + prop}
TOP = 20000   # filas maximas por consulta; cada consulta es de una sola serie (decenas de meses), asi que no se acerca
def query_body(model, entity, props, where=None, top=TOP):
    sel = [col(entity, p) for p in props]
    q = {"Version": 2, "From": [{"Name": "t", "Entity": entity, "Type": 0}], "Select": sel}
    if where:
        q["Where"] = [{"Condition": {"In": {"Expressions": [{"Column": {"Expression": {"SourceRef": {"Source": "t"}}, "Property": p}}], "Values": [[{"Literal": {"Value": "'%s'" % v}}]]}}} for p, v in where]
    cmd = {"SemanticQueryDataShapeCommand": {"Query": q, "Binding": {"Primary": {"Groupings": [{"Projections": list(range(len(sel)))}]}, "DataReduction": {"DataVolume": 3, "Primary": {"Top": {"Count": top}}}, "Version": 1}, "ExecutionMetricsKind": 1}}
    return {"version": "1.0.0", "queries": [{"Query": {"Commands": [cmd]}, "QueryId": "", "ApplicationContext": {"DatasetId": model["dbName"], "Sources": []}}], "cancelQueries": [], "modelId": model["id"]}

class Net:
    def __init__(self):
        k = json.loads(base64.b64decode(KEY + "==")); self.rk = k["k"]
        self.h = {"X-PowerBI-ResourceKey": self.rk, "Accept": "application/json", "Content-Type": "application/json;charset=UTF-8"}
        self.host = None; self.model = None
        hosts = list(HOSTS)
        last = None
        for h in hosts:
            try:
                m = json.loads(http(h + "/public/reports/%s/modelsAndExploration?preferReadOnlySession=true" % self.rk, headers=self.h, tries=2))
                self.model = {"id": m["models"][0]["id"], "dbName": m["models"][0]["dbName"], "name": m["models"][0].get("displayName"), "refresh": m["models"][0].get("LastRefreshTime")}; self.host = h; break
            except Exception as e: last = e
        if not self.host: raise RuntimeError("no se pudo abrir el informe publico del MAPA: %s" % str(last)[:160])
    def q(self, entity, props, where=None):
        raw = http(self.host + "/public/reports/querydata?synchronous=true", data=json.dumps(query_body(self.model, entity, props, where)).encode("utf-8"), headers=self.h)
        return json.loads(raw)

def load_fixture(d):
    d = Path(d)
    class F:
        model = {"id": 0, "dbName": "fixture", "name": "Siega", "refresh": None}
        def q(self, entity, props, where=None):
            return json.loads((d / ("q_" + re.sub(r"\W", "_", entity)[:40] + ".json")).read_text("utf-8"))
    return F()

def month(ms):
    t = datetime.datetime.fromtimestamp(ms / 1000, datetime.timezone.utc)
    if t.day != 1: raise ValueError("fecha que no es dia 1: %s" % t.isoformat())
    return "%04d-%02d" % (t.year, t.month)

def colv(names, rows, entity, prop):
    i = names.index(entity + "." + prop); return [r[i] for r in rows]

def build_series(net):
    n, dims = decode(net.q("Dim Dimensiones", ["COD_PRODUCTO", "COD_MODALIDAD", "Producto", "Modalidad", "Sector"]))
    pairs = sorted(set(zip(colv(n, dims, "Dim Dimensiones", "COD_PRODUCTO"), colv(n, dims, "Dim Dimensiones", "COD_MODALIDAD"))))
    out = []; skipped = []
    for pc, mc in pairs:
        if (pc, mc) in SKIPPED: continue
        if (pc, mc) not in LABELS: skipped.append("%s_%s" % (pc, mc)); continue
        names, rows = decode(net.q("Valores Mensuales", ["COD_PRODUCTO", "COD_MODALIDAD", "Fecha", "Existencias Mensuales"], where=[("COD_PRODUCTO", pc), ("COD_MODALIDAD", mc)]))
        if len(rows) >= TOP: raise ValueError("%s_%s: la respuesta alcanza el limite de filas (%d); podria estar truncada" % (pc, mc, TOP))
        E = "Valores Mensuales"; P = colv(names, rows, E, "COD_PRODUCTO"); M = colv(names, rows, E, "COD_MODALIDAD"); F = colv(names, rows, E, "Fecha"); V = colv(names, rows, E, "Existencias Mensuales")
        pts = {}
        for p_, m_, f, v in zip(P, M, F, V):
            if (p_, m_) != (pc, mc) or f is None or v is None: continue   # el filtro lo aplica el servidor; aqui se comprueba otra vez
            p = month(f); v = float(v)
            if v < 0: raise ValueError("%s_%s %s: existencias negativas" % (pc, mc, p))
            if p in pts: raise ValueError("%s_%s: mes repetido %s" % (pc, mc, p))
            pts[p] = round(v / 1000.0, 3)
        out.append((pc, mc, sorted(pts.items())))
    if skipped: log("combinaciones sin etiqueta (se descartan):", ", ".join(skipped))
    return out

def make_doc(series_raw, refresh):
    series = []
    for pc, mc, pl in series_raw:
        if len(pl) < 6: log("serie con menos de 6 meses, se descarta:", pc, mc); continue
        txt, key = LABELS[(pc, mc)]
        # meses consecutivos: un hueco rompe la serie mensual (no se interpola)
        ys = [int(p[:4]) * 12 + int(p[5:]) for p, _ in pl]
        gaps = [pl[i][0] for i in range(1, len(pl)) if ys[i] - ys[i - 1] != 1]
        if gaps: log("AVISO: huecos mensuales en %s_%s antes de %s (se publican tal cual, sin rellenar)" % (pc, mc, ", ".join(gaps[:3])))
        prev = pl[-2][1] if len(pl) > 1 else None
        series.append({"id": "es-siega-stock-" + key, "group": "stocks", "label": "Monthly stocks: %s (MAPA SIEGA operator declarations)" % txt, "unit": "thousand t", "frequency": "monthly",
                       "latestPeriod": pl[-1][0], "latest": pl[-1][1], "changePct": round((pl[-1][1] - prev) / prev * 100, 2) if prev else None, "points": [[p, v] for p, v in pl], "sourceGroup": "MAPA SIEGA"})
    return series

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); ap.add_argument("--fixture"); a = ap.parse_args()
    outdir = Path(a.out) if a.out else ROOT / "data"
    try:
        net = load_fixture(a.fixture) if a.fixture else Net()
        raw = build_series(net)
    except Exception as e:
        log("ERROR:", e); return 1
    series = make_doc(raw, net.model.get("refresh"))
    if len(series) < MIN_SERIES: log("ERROR: solo %d series (se esperan %d o mas); no se escribe nada" % (len(series), MIN_SERIES)); return 1
    src = {"name": "MAPA — SIEGA, existencias mensuales de cereales, arroz y oleaginosas (informe publico)", "url": REPORT_URL, "license": "MAPA aviso legal: reuse without prior authorisation if the source is cited"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"ES": {"name": "Spain", "extend": True, "source": src, "series": sorted(series, key=lambda s: s["id"])}}, "log": LOG[-30:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "spain-siega-stats.json.tmp"
    tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "spain-siega-stats.json")
    log("OK: %d series; ultimo mes %s; actualizacion del modelo del MAPA: %s" % (len(series), max(s["latestPeriod"] for s in series), net.model.get("refresh")))
    return 0

if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "spain-siega-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)
