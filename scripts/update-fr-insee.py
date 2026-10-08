#!/usr/bin/env python3
"""Francia: indices de precios agricolas del INSEE (BDM, SDMX anonimo) -> data/france-insee-stats.json
Conjunto IPAGRI-BASE-2020: IPPAP (precios agricolas a la produccion, es decir, lo que recibe el agricultor), IPGA y IPAMPA (precios de los medios de produccion que compra).
Licence Ouverte 2.0 (Etalab), «Source: Insee». Solo series vigentes (no «arretees»), mensuales, brutas, Francia entera, en forma de indice (base 2020=100); nada se estima.
Uso: update-fr-insee.py [--out DIR]"""
import datetime, json, re, sys, time, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
H = {"User-Agent": "Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)"}
URL = "https://bdm.insee.fr/series/sdmx/data/IPAGRI-BASE-2020?startPeriod=1995-01"
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, tries=3):
    last = None
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=300).read()
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError("%s: %r" % (url, last))
NOW = datetime.date.today()
GROUP = {"IPPAP": "idx_perc", "IPGA": "idx_perc", "IPAMPA": "idx_pag"}
def main():
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    root = ET.fromstring(get(URL)); ser = []; seen = set(); stats = {"total": 0, "arretee": 0, "no_m": 0, "no_indice": 0, "old": 0, "short": 0}
    for s in root.iter():
        if s.tag.split("}")[-1] != "Series": continue
        a = s.attrib; stats["total"] += 1
        if a.get("SERIE_ARRETEE") != "FALSE": stats["arretee"] += 1; continue
        if a.get("FREQ") != "M" or a.get("CORRECTION", "BRUT") != "BRUT" or a.get("REF_AREA", "FE") != "FE": stats["no_m"] += 1; continue
        if a.get("NATURE") != "INDICE": stats["no_indice"] += 1; continue
        pts = {}
        for o in s:
            if o.tag.split("}")[-1] != "Obs": continue
            t, v = o.attrib.get("TIME_PERIOD"), o.attrib.get("OBS_VALUE")
            try: v = float(v)
            except Exception: continue
            if t and re.match(r"\d{4}-\d{2}$", t) and v == v: pts[t] = v
        pts = sorted(pts.items())
        if len(pts) < 24: stats["short"] += 1; continue
        if (int(pts[-1][0][:4]), int(pts[-1][0][5:])) < (NOW.year - 1, NOW.month): stats["old"] += 1; continue
        ind = a.get("INDICATEUR", "IPPAP"); idb = a.get("IDBANK")
        code0 = a.get("PRODUITS_IPAGRI_2020", "") or ""
        d0 = len(re.sub(r"^[A-Z]+_", "", code0)) // 2
        # nivel de detalle: IPPAP hasta 5 (sin floricultura), IPAMPA hasta 4; los niveles mas finos son ruido para un panel
        if (ind == "IPAMPA" and d0 > 4) or (ind != "IPAMPA" and (d0 > 5 or code0.startswith("IPPAP_0101050"))): stats["detail"] = stats.get("detail", 0) + 1; continue
        if idb in seen: continue
        seen.add(idb)
        te = re.sub(r"\s+", " ", a.get("TITLE_EN", "")).strip()
        parts = re.split(r"\s+[-\u2013]\s+", te, maxsplit=1)
        prod = parts[1] if len(parts) > 1 else te
        code = a.get("PRODUITS_IPAGRI_2020", "") or ""
        depth = len(re.sub(r"^[A-Z]+_", "", code)) // 2
        prod = re.sub(r"\s*\(?\s*(Series|Discontinued).*$", "", prod).strip()
        kind = {"IPPAP": "agricultural producer price index (IPPAP)", "IPGA": "gross agricultural price index (IPGA)", "IPAMPA": "agricultural input price index (IPAMPA)"}.get(ind, ind)
        prev = pts[-2][1]
        ser.append(dict(id="fr-insee-%s" % idb, group=GROUP.get(ind, "idx_perc"), label="France %s: %s (INSEE, 2020=100, monthly)" % (kind, prod), unit="index 2020=100", frequency="monthly",
                        latestPeriod=pts[-1][0], latest=round(pts[-1][1], 2), changePct=round((pts[-1][1] / prev - 1) * 100, 2) if prev else None, points=[[p, round(v, 2)] for p, v in pts], sourceGroup="insee", code=code.replace("IPPAP_", "").replace("IPAMPA_", "")))
        log("serie", idb, ind, "d%d" % depth, code, prod[:90], len(pts), pts[-1][0])
    labs = {}
    for x in ser: labs.setdefault(x["label"], []).append(x)
    for lab, xs in labs.items():   # mismo nombre en dos ramas del arbol (p. ej. semillas con y sin tratamiento): se distingue con el codigo INSEE
        if len(xs) > 1:
            for x in xs: x["label"] = lab.replace(" (INSEE,", " [%s] (INSEE," % x["code"])
    for x in ser: x.pop("code", None)
    log("resumen", stats, "guardadas", len(ser))
    if not ser: log("sin series"); sys.exit(1)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    doc = {"schemaVersion": 1, "generatedAt": now, "countries": {"FR": {"name": "France", "extend": True, "source": {"name": "INSEE – indices des prix dans l'agriculture (IPPAP, IPGA, IPAMPA)", "url": "https://www.insee.fr/fr/statistiques/serie/liste-series/IPAGRI-BASE-2020", "license": "Licence Ouverte 2.0 (Etalab) – Source: Insee"}, "series": ser}}, "log": LOG[-30:]}
    (outdir / "france-insee-stats.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (outdir / "france-insee-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
if __name__ == "__main__": main()
