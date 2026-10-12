#!/usr/bin/env python3
"""Belgica (Flandes): nitrato en las aguas superficiales de zonas agricolas (red MAP) -> data/be-nitrates.json
Fuente: Vlaamse Milieumaatschappij (VMM), indicador «Nitraat in oppervlaktewater in landbouwgebied»: por ano de invierno (julio a junio), la
concentracion media de nitrato (mg/l) en los puntos de la red de control del plan de abonado (MAP-meetnet) y el porcentaje de puntos que superan
el umbral de 50 mg/l de la Directiva de Nitratos. Objetivos de los planes de abonado: como mucho 16 % de puntos en 2014 (MAP 4) y 5 % en 2018
(MAP 5). Se lee el CSV que la VMM adjunta al grafico del indicador. Licencia: Modellicentie voor gratis hergebruik (Gobierno flamenco).
Valonia no publica un dato equivalente en formato abierto. Uso: python3 scripts/update-be-nitrates.py"""
import csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "be-nitrates.json"
PAGE = "https://vmm.vlaanderen.be/feiten-cijfers/water/kwaliteit-waterlopen/fysisch-chemische-toestand/indicator-nitraat-in-oppervlaktewater-in-landbouwgebied"
CSV = PAGE + "/nitraat-in-oppervlaktewater-in-landbouwgebied/@@download/csv"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
def get(u, t=120):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-80:], last))
def num(s):
    s = (s or "").strip().replace(",", ".")
    try: return float(s)
    except ValueError: return None
def main():
    try:
        rows = list(csv.reader(io.StringIO(get(CSV).decode("utf-8-sig"))))
        hdr = [h.strip().lower() for h in rows[0]]
        im = next(i for i, h in enumerate(hdr) if "gemiddelde" in h); ip = next(i for i, h in enumerate(hdr) if "overschrijding" in h)
        out = []
        for r in rows[1:]:
            if not r or not re.match(r"^\d{4}-\d{4}$", r[0].strip()): continue
            m = num(r[im]) if im < len(r) else None; p = num(r[ip]) if ip < len(r) else None
            if p is None: continue
            if not 0 <= p <= 100 or (m is not None and not 0 < m < 100): raise ValueError("valor raro en %s: %s" % (r[0], r))
            out.append([r[0].strip(), m, p])
        if len(out) < 15: raise ValueError("solo %d anos de invierno" % len(out))
    except Exception as e:
        print("FALLO indicador de la VMM:", e); return 0 if OUT.exists() else 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": out[-1][0], "region": "Vlaanderen",
           "source": {"name": "Vlaamse Milieumaatschappij (VMM), indicator Nitraat in oppervlaktewater in landbouwgebied (MAP-meetnet)", "url": PAGE, "csv": CSV,
                      "license": "Modellicentie voor gratis hergebruik (Vlaamse overheid)"},
           "fields": ["winterYear", "meanMgL", "pctAbove50"], "threshold": 50, "targets": {"2014": 16, "2018": 5}, "series": out}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("be-nitrates.json: %d anos de invierno %s..%s; ultimo %s" % (len(out), out[0][0], out[-1][0], out[-1]))
    return 0
if __name__ == "__main__": sys.exit(main())
