#!/usr/bin/env python3
"""Sequia prolongada y escasez en Espana por unidad territorial -> data/es-drought-ute.json
Fuente: MITECO, Observatorio Nacional de la Sequia, «Informe de la situacion de sequia y escasez» mensual, anexo 3 «Evolucion de indicadores
por demarcacion hidrografica» (PDF). Solo cubre las demarcaciones intercomunitarias (las que gestiona el Estado); las cuencas internas de
Cataluna, Andalucia, Galicia, Pais Vasco, Baleares y Canarias no estan. Reutilizacion: aviso legal del MITECO (Ley 37/2007, citando la fuente).
Se lee el texto del PDF (pdftotext -layout) y, de cada tabla, el indicador del ultimo mes con el codigo de unidad del plan especial de sequia
vigente (ESxxx_yy). Los indicadores van de 0 a 1. Escenario (calculo de Dehesa Index con los umbrales generales de los planes especiales de
sequia): escasez normalidad >= 0,50, prealerta 0,30-0,50, alerta 0,15-0,30, emergencia < 0,15; sequia prolongada si el indicador es < 0,30.
Cada mes se anade al historico propio (el anexo solo trae el ano hidrologico en curso). Si algo falla se conserva el fichero anterior.
Uso: python3 scripts/update-es-drought-ute.py [--txt fichero.txt]"""
import datetime, html, json, re, subprocess, sys, tempfile, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "es-drought-ute.json"
PAGE = "https://www.miteco.gob.es/es/agua/temas/observatorio-nacional-de-la-sequia/informes-mapas-seguimiento.html"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
MON = {"OCT": 10, "NOV": 11, "DIC": 12, "ENE": 1, "FEB": 2, "MAR": 3, "ABR": 4, "MAY": 5, "JUN": 6, "JUL": 7, "AGO": 8, "SEP": 9}
def get(u, t=180):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def scenario(v): return "normal" if v >= 0.5 else "prealert" if v >= 0.3 else "alert" if v >= 0.15 else "emergency"
FL = r"(?:0|1)\.\d{3}"
def parse(txt):
    """-> (fecha de referencia, {demarcacion: {'uts': [...], 'ute': [...], 'global': {...}}})"""
    m = re.search(r"Sequ[ií]a y Escasez a (\d{1,2})/(\d{1,2})/(\d{4})", txt)
    if not m: raise ValueError("sin fecha de referencia")
    ref = datetime.date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    parts = re.split(r"\n\s*Demarcaci[oó]n Hidrogr[aá]fica (?:del? |de la )?([^\n]+)\n\s*Mapas de Sequ", txt)
    out = {}
    for name, body in zip(parts[1::2], parts[2::2]):
        name = re.sub(r"\s+", " ", name).strip()
        d = {"uts": [], "ute": [], "global": {}}
        sec = None; months = None
        for ln in body.splitlines():
            if re.search(r"Indicadores de sequ[ií]a prolongada", ln): sec = "uts"; continue
            if re.search(r"Indicadores y escenarios de escasez", ln): sec = "ute"; continue
            if re.search(r"Indicadores globales", ln): sec = "global"; continue
            if re.search(r"\bCOD\b.*\b(UTS|UTE)\b", ln) or "INDICADOR D.H." in ln:
                months = re.findall(r"\b(OCT|NOV|DIC|ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP)\b", ln)   # los del plan vigente son los ultimos
                continue
            if sec in ("uts", "ute"):
                mm = re.search(r"(ES\d{3}_\d+[A-Z]?)\s+(.+?)\s+((?:" + FL + r"\s*)+)$", ln)
                if not mm or not months: continue
                vals = [float(x) for x in re.findall(FL, mm.group(3))]
                if len(vals) > len(months): continue
                v = vals[-1]
                row = {"code": mm.group(1), "name": re.sub(r"\s+", " ", mm.group(2)).strip(), "value": v, "months": months[-len(vals):], "series": vals}
                row["state"] = ("drought" if v < 0.3 else "none") if sec == "uts" else scenario(v)
                d[sec].append(row)
            elif sec == "global":
                mm = re.search(r"GLOBAL (SEQU[IÍ]A|ESCASEZ)\s+((?:" + FL + r"\s*)+)$", ln)
                if mm and months:
                    vals = [float(x) for x in re.findall(FL, mm.group(2))]
                    d["global"]["drought" if mm.group(1).startswith("SEQU") else "scarcity"] = vals[-1]
        if d["uts"] or d["ute"]: out[name] = d
    return ref, out
def main():
    args = sys.argv[1:]
    try:
        if args[:1] == ["--txt"]: txt = Path(args[1]).read_text(encoding="utf-8"); src = args[1]
        else:
            page = get(PAGE).decode("utf-8", "replace")
            links = [(urllib.parse.urljoin(PAGE, html.unescape(h)), re.sub(r"<[^>]+>|\s+", " ", t)) for h, t in re.findall(r'href="([^"]+\.pdf)"[^>]*>(.*?)</a>', page, re.S)]
            src = next(u for u, t in links if re.search(r"Anexo\s*3", t + u, re.I) and re.search(r"indicadores", t + u, re.I))
            with tempfile.TemporaryDirectory() as tmp:
                p = Path(tmp) / "a.pdf"; p.write_bytes(get(src))
                subprocess.run(["pdftotext", "-layout", str(p), str(p) + ".txt"], check=True)
                txt = Path(str(p) + ".txt").read_text(encoding="utf-8", errors="replace")
        ref, dems = parse(txt)
    except Exception as e:
        print("FALLO lectura del informe:", e); return 0 if OUT.exists() else 1
    nu = sum(len(d["ute"]) for d in dems.values()); ns = sum(len(d["uts"]) for d in dems.values())
    if len(dems) < 8 or nu < 60 or ns < 40: print("FALLO tablas incompletas: %d demarcaciones, %d UTE, %d UTS" % (len(dems), nu, ns)); return 0 if OUT.exists() else 1
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    hist = {h["date"]: h for h in old.get("history", [])}
    cnt = {k: sum(1 for d in dems.values() for r in d["ute"] if r["state"] == k) for k in ("normal", "prealert", "alert", "emergency")}
    hist[ref.isoformat()] = {"date": ref.isoformat(), "ute": cnt, "utsDrought": sum(1 for d in dems.values() for r in d["uts"] if r["state"] == "drought"), "uts": ns,
                             "byDemarcation": {k: [d["global"].get("drought"), d["global"].get("scarcity")] for k, d in dems.items()}}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": ref.isoformat(),
           "source": {"name": "MITECO, Observatorio Nacional de la Sequía, informe mensual de sequía y escasez (anexo 3)", "url": PAGE, "file": src.rsplit("/", 1)[-1],
                      "license": "Aviso legal del MITECO (reutilización citando la fuente, Ley 37/2007)"},
           "thresholds": {"scarcity": {"normal": 0.5, "prealert": 0.3, "alert": 0.15}, "drought": 0.3},
           "demarcations": dems, "history": [hist[k] for k in sorted(hist)]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("es-drought-ute.json a %s: %d demarcaciones, %d UTE %s, %d UTS (%d en sequia prolongada)" % (ref, len(dems), nu, cnt, ns, hist[ref.isoformat()]["utsDrought"]))
    return 0
if __name__ == "__main__": sys.exit(main())
