#!/usr/bin/env python3
"""Polonia: avisos de sequia hidrologica del IMGW-PIB por voivodato -> data/pl-hydro-drought.json
Fuente: API publica del Instituto de Meteorologia y Gestion del Agua (IMGW-PIB), «warningshydro»: avisos hidrologicos vigentes. Un aviso
de «susza hidrologiczna» se emite cuando los caudales de las estaciones representativas de una zona estan por debajo del caudal minimo medio
(SNQ) durante al menos 10 dias. Reutilizacion libre citando la fuente («Źródłem pochodzenia danych jest IMGW-PIB») e indicando que los datos se
han procesado (reglamento de puesta a disposicion de datos del IMGW-PIB).
Dehesa Index cuenta, por voivodato, los avisos vigentes y las cuencas afectadas, y guarda cada dia el recuento en un historico propio.
Uso: python3 scripts/update-pl-hydro-drought.py"""
import datetime, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "pl-hydro-drought.json"
API = "https://danepubliczne.imgw.pl/api/data/warningshydro"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
V = {"dolnośląskie": "DS", "kujawsko-pomorskie": "KP", "lubelskie": "LU", "lubuskie": "LB", "łódzkie": "LD", "małopolskie": "MA", "mazowieckie": "MZ", "opolskie": "OP",
     "podkarpackie": "PK", "podlaskie": "PD", "pomorskie": "PM", "śląskie": "SL", "świętokrzyskie": "SK", "warmińsko-mazurskie": "WN", "wielkopolskie": "WP", "zachodniopomorskie": "ZP"}
def get(u, t=120):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return json.loads(r.read().decode("utf-8"))
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u, last))
def main():
    try: W = get(API)
    except Exception as e: print("FALLO API:", e); return 0 if OUT.exists() else 1
    if not isinstance(W, list): print("FALLO: respuesta inesperada"); return 0 if OUT.exists() else 1
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) + datetime.timedelta(hours=2)   # hora de Polonia aproximada; los avisos llevan hora local
    reg = {k: {"warnings": 0, "areas": []} for k in V.values()}; items = []
    for w in W:
        if "susza" not in (w.get("zdarzenie") or "").lower(): continue
        try:
            a = datetime.datetime.strptime(w["data_od"][:19], "%Y-%m-%d %H:%M:%S"); b = datetime.datetime.strptime(w["data_do"][:19], "%Y-%m-%d %H:%M:%S")
        except Exception: continue
        if not a <= now <= b: continue
        areas = []
        for o in w.get("obszary") or []:
            v = V.get((o.get("wojewodztwo") or "").strip().lower())
            if not v: continue
            name = (o.get("opis") or "").split(",")[1].strip() if "," in (o.get("opis") or "") else (o.get("opis") or "")
            if name and name not in reg[v]["areas"]: reg[v]["areas"].append(name)
            areas.append([v, name])
        for v in set(x[0] for x in areas): reg[v]["warnings"] += 1
        items.append({"published": w.get("opublikowano"), "from": w["data_od"][:10], "office": w.get("biuro"), "text": (w.get("przebieg") or "")[:400], "areas": areas})
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    hist = [h for h in old.get("history", []) if h["date"] != now.date().isoformat()]
    hist.append({"date": now.date().isoformat(), "warnings": len(items), "voivodeships": sum(1 for v in reg.values() if v["warnings"])})
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": now.date().isoformat(),
           "source": {"name": "IMGW-PIB, ostrzeżenia hydrologiczne (susza hydrologiczna)", "url": "https://danepubliczne.imgw.pl/", "api": API, "license": "Reutilización libre citando la fuente (reglamento de datos del IMGW-PIB; ley polaca de datos abiertos)"},
           "voivodeships": reg, "warnings": items, "history": hist[-400:]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("pl-hydro-drought.json %s: %d avisos de sequia vigentes; voivodatos %s" % (doc["asOf"], len(items), {k: v["warnings"] for k, v in reg.items() if v["warnings"]}))
    return 0
if __name__ == "__main__": sys.exit(main())
