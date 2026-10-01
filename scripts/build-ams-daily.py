#!/usr/bin/env python3
"""Ofertas diarias de grano (USDA AMS, informes diarios ya descargados en data/ams/) -> data/ams-grain-daily.json (pequeño, para la ficha de producto).
Por producto: mediana de todas las estaciones por dia (ultimos 90 dias) y, por informe/estacion, ultimo precio, cambio a 1 dia y a ~30 dias. No inventa nada:
promedia solo series con la misma especificacion (maiz amarillo n.º 2, soja n.º 1, trigo HRW/SRW/DNS, cebada forrajera n.º 2)."""
import datetime, json, statistics, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / "data" / "ams"
SPECS = {"maiz": [("Corn", "Yellow", "US #2")], "soja": [("Soybeans", "", "US #1")], "trigo": [("Wheat", "Hard Red Winter", "US #1"), ("Wheat", "Soft Red Winter", "US #2"), ("Wheat", "NS/DNS", "US #1")], "cebada": [("Barley", "Feed", "US #2")]}
def price(row):
    if len(row) > 1 and row[1] is not None: return float(row[1])
    if len(row) > 3 and row[2] is not None and row[3] is not None: return (float(row[2]) + float(row[3])) / 2
    return None
def main():
    idx = json.loads((D / "index.json").read_text())["reports"]; out = {}; asof = ""
    for r in idx:
        if r.get("fam") != "grain" or r.get("freq") != "d": continue
        try: d = json.loads((D / ("%d.json" % r["id"])).read_text())
        except Exception: continue
        dn = d.get("dn") or []
        for s in d["series"]:
            v = dict(zip(dn, s["v"])); key = (v.get("commodity"), v.get("class") or "", v.get("grade"))
            for prod, specs in SPECS.items():
                for sp in specs:
                    if key == sp:
                        o = out.setdefault(prod, {}).setdefault(sp[1] or sp[0], {"unit": s.get("u"), "spec": " · ".join(x for x in sp if x), "stations": {}})
                        pts = {p[0]: price(p) for p in s["p"] if price(p) is not None}
                        st = o["stations"].setdefault(r["id"], {"id": r["id"], "title": r["title"], "pts": {}})
                        for k, x in pts.items(): st["pts"].setdefault(k, []).append(x)
    res = {"schemaVersion": 1, "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "source": {"name": "USDA AMS Market News (API MARS)", "url": "https://mymarketnews.ams.usda.gov/", "license": "Public domain (U.S. Government work)"}, "products": {}}
    for prod, classes in out.items():
        lst = []
        for cname, o in classes.items():
            days = {}; stations = []
            for st in o["stations"].values():
                pts = sorted((k, statistics.mean(v)) for k, v in st["pts"].items())
                if len(pts) < 2: continue
                last = pts[-1]; prev = pts[-2]; ld = datetime.date.fromisoformat(last[0]); m30 = None
                for k, x in pts:
                    if (ld - datetime.date.fromisoformat(k)).days >= 28: m30 = x
                stations.append({"id": st["id"], "title": st["title"], "date": last[0], "price": round(last[1], 4), "chg1": round(last[1] - prev[1], 4), "chg30": round(last[1] - m30, 4) if m30 is not None else None})
                for k, x in pts: days.setdefault(k, []).append(x)
            if len(stations) < 3: continue
            latest = max(s["date"] for s in stations); asof = max(asof, latest)
            stations = [s for s in stations if (datetime.date.fromisoformat(latest) - datetime.date.fromisoformat(s["date"])).days <= 4]
            # nivel de referencia: mediana de las estaciones del ultimo dia, y hacia atras con la mediana de los cambios de las MISMAS estaciones
            # entre dias consecutivos (asi no salta cuando cambia el conjunto de informes de un dia)
            per = {}
            for st in o["stations"].values():
                for k, v in st["pts"].items(): per.setdefault(st["id"], {})[k] = statistics.mean(v)
            dates = sorted(k for k, v in days.items() if len(v) >= 3)[-91:]
            if len(dates) < 5: continue
            lv = {dates[-1]: statistics.median([per[i][dates[-1]] for i in per if dates[-1] in per[i]])}
            for a, b in zip(reversed(dates[:-1]), reversed(dates[1:])):
                ch = [per[i][b] - per[i][a] for i in per if a in per[i] and b in per[i]]
                lv[a] = lv[b] - (statistics.median(ch) if len(ch) >= 3 else 0.0)
            med = [[k, round(lv[k], 4)] for k in sorted(lv)][-90:]
            if len(stations) < 3: continue
            stations.sort(key=lambda s: -s["price"])
            lst.append({"class": cname, "unit": o["unit"], "spec": o["spec"], "n": len(stations), "latest": latest, "median": med, "stations": stations[:40]})
        if lst: res["products"][prod] = lst
    res["asOf"] = asof
    (ROOT / "data" / "ams-grain-daily.json").write_text(json.dumps(res, ensure_ascii=False, separators=(",", ":")))
    print("productos", {k: [(c["class"], c["n"]) for c in v] for k, v in res["products"].items()}, "asOf", asof)
main()
