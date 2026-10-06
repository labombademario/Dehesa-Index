#!/usr/bin/env python3
"""Histórico de los Informes de Contratación del Seguro Agrario (ENESA, nº 1-31, 2013-2022).

Lee el texto (pdftotext -layout) de cada informe y extrae la tabla "Grandes cifras":
  - ejercicios cerrados (pólizas, animales, producción, capital, coste neto, subvenciones, indemnizaciones)
  - evolución del 1 de enero a una fecha de corte (sin indemnizaciones)
Fuente: Agroseguro; elaboración ENESA. ENESA autoriza su uso citando el origen.
Dato HISTÓRICO: el último informe es el nº 31 (1.er semestre 2022). No se actualiza.
Uso: build-enesa-contratacion.py <dir_txt> <salida.json>
Las cifras se copian tal cual; si una fila no cuadra con el formato esperado se descarta y se anota.
"""
import datetime, json, os, re, sys

NUM = re.compile(r"^\d{1,3}(?:\.\d{3})*(?:,\d+)?$|^\d+(?:,\d+)?$")
MESES = {"enero":1,"febrero":2,"marzo":3,"abril":4,"mayo":5,"junio":6,"julio":7,"agosto":8,
         "septiembre":9,"octubre":10,"noviembre":11,"diciembre":12}
ANNUAL = ["polizas","animales_millones","produccion_kt","capital_meur","coste_neto_meur",
          "subv_enesa_meur","subv_ccaa_meur","indemnizaciones_meur"]
YTD = ANNUAL[:7]

def num(tok):
    return float(tok.replace(".", "").replace(",", "."))

def report_no(fname):
    f = fname.lower()
    m = re.search(r"icp_?(\d)_?(\d{4})?", f)
    if "icp_1-2013" in f or "avance_contrat_n1" in f: return 1
    if "icp_2-2013" in f: return 2
    if "icp_3-2013" in f: return 3
    if "icp4" in f: return 4
    if "icp5" in f: return 5
    if "ic6" in f: return 6
    if "ic7" in f: return 7
    if "ic8" in f: return 8
    if "ic9" in f: return 9
    if "n_16" in f: return 16
    if "n302" in f or "n30" in f: return 30
    m = re.search(r"ic[_]?(\d{2})", f)
    if m: return int(m.group(1))
    return None

SENT = re.compile(r"del\s+1\s+de\s+enero\s+al\s+(\d{1,2})\s+de\s+([a-záéíóú]+)", re.I)
SENT_ASOF = re.compile(r"con\s+datos\s+a\s+(\d{1,2})\s+de\s+([a-záéíóú]+)\s+del?\s+(\d{4})", re.I)

def parse(txt):
    """Devuelve (filas, nota). Cada bloque 'Grandes cifras' / 'Evolución del seguro' se interpreta por separado.
    El corte se toma de la frase descriptiva ('del 1 de enero al 8 de junio'), no del título, porque en algunos
    informes el título y la frase no coinciden (error de la fuente; se anota)."""
    lines = txt.splitlines()
    starts = [i for i, l in enumerate(lines)
              if re.search(r"GRANDES CIFRAS DEL SEGURO|EVOLUCI[ÓO]N DEL SEGURO", l.upper())]
    if not starts:
        return [], "sin tabla de grandes cifras", []
    rows, warns = [], []
    for n, st in enumerate(starts):
        en = starts[n + 1] if n + 1 < len(starts) else min(len(lines), st + 60)
        blk = lines[st:min(en, st + 60)]
        head = " ".join(blk[:14])
        m = SENT.search(head)
        kind, cut, asof = "annual", None, {}
        if m:
            mes = MESES.get(m.group(2).lower())
            if mes: kind, cut = "ytd", {"day": int(m.group(1)), "month": mes}
            t = re.search(r"PERIODO\s+(?:DEL\s+)?1\s+DE\s+ENERO\s+A\s+(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚ]+)", blk[0].upper() + " " + (blk[1].upper() if len(blk) > 1 else ""))
            if t and cut and (int(t.group(1)), MESES.get(t.group(2).lower())) != (cut["day"], cut["month"]):
                warns.append("título y frase de corte no coinciden (%s %s vs %d/%d); se usa la frase" % (t.group(1), t.group(2), cut["day"], cut["month"]))
        elif re.search(r"con\s+datos\s+a\s*\d", head, re.I):
            kind = "snapshot"
            asof = {}
            for d_, m_, y_, e_ in re.findall(r"a\s*(\d{1,2})\s+de\s+([a-záéíóú]+)\s+del?\s+(\d{4})\s+para\s+el\s+ejercicio\s+(\d{4})", head, re.I):
                if MESES.get(m_.lower()): asof[int(e_)] = "%s-%02d-%02d" % (y_, MESES[m_.lower()], int(d_))
        elif kind == "annual" and re.search(r"ejercicio\s+\d{4}\s*,?\s+a\s+(?:fecha\s+)?\d", head, re.I):
            for e_, d_, m_, y_ in re.findall(r"ejercicio\s+(\d{4})\s*,?\s+a\s+(?:fecha\s+)?(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})", head, re.I):
                if MESES.get(m_.lower()) and not (int(d_) == 31 and MESES[m_.lower()] == 12):
                    asof[int(e_)] = "%s-%02d-%02d" % (y_, MESES[m_.lower()], int(d_))
        elif "PERIODO" in blk[0].upper():
            continue  # tabla de periodo sin frase de corte fiable: no se interpreta
        up = head.upper()
        if "M TN" in up or "MILLONES DE T" in up:
            continue  # unidad redondeada (millones de t): se omite, hay informes posteriores con kt
        for ln in blk:
            mm = re.match(r"^\s*(20[12]\d)\s*(\*{0,3})\s+(.*)$", ln)
            if not mm: continue
            toks = [t for t in re.split(r"\s+", mm.group(3).strip()) if NUM.match(t)]
            if len(toks) not in (7, 8) or (len(toks) == 8 and kind == "ytd"):
                rows.append({"_skip": ln.strip()[:90], "ctx": kind}); continue
            vals = [num(t) for t in toks]
            r = dict(zip(ANNUAL, vals))
            # La cabecera del PDF a veces dice "(t)" con valores en miles de t (o al revés): se decide por magnitud
            # (en miles de t nunca supera 100.000; en toneladas sí, desde 1 millón).
            r["produccion_kt"] = round(r["produccion_kt"] / 1000.0 if r["produccion_kt"] > 200000 else r["produccion_kt"], 1)
            r.setdefault("indemnizaciones_meur", None)
            r.update({"year": int(mm.group(1)), "provisional": bool(mm.group(2)), "kind": kind})
            if kind == "annual" and r["year"] in asof:
                r["kind"] = "snapshot"; r["as_of"] = asof[r["year"]]
            if kind == "ytd": r["cutoff"] = cut
            if kind == "snapshot":
                r["as_of"] = asof.get(r["year"])
                if not r["as_of"]: rows.append({"_skip": ln.strip()[:90], "ctx": "snapshot sin fecha"}); continue
            rows.append(r)
    return rows, None, warns

def plausible(r):
    return (50_000 < r["polizas"] < 1_000_000 and 10 < r["animales_millones"] < 1000
            and 1_000 < r["produccion_kt"] < 100_000 and 500 < r["capital_meur"] < 30_000
            and 20 < r["coste_neto_meur"] < 2_000)

def main(d, out):
    reports, notes, best = [], [], {}
    for fn in sorted(os.listdir(d)):
        if not fn.endswith(".txt") or "calendario" in fn: continue
        no = report_no(fn)
        txt = open(os.path.join(d, fn), encoding="utf-8", errors="replace").read()
        rows, err, warns = parse(txt)
        for w in set(warns): notes.append(f"nº {no}: {w}")
        good = []
        for r in rows:
            if "_skip" in r:
                notes.append(f"nº {no}: fila descartada ({r['ctx']}): {r['_skip']}"); continue
            if not plausible(r):
                notes.append(f"nº {no}: fila {r['year']} {r['kind']} fuera de rango, descartada"); continue
            r["report"] = no
            good.append(r)
        if err or not good: notes.append(f"nº {no}: sin filas válidas ({err or 'formato no reconocido'})")
        reports.append({"report": no, "file": fn, "rows": len(good)})
        for r in good:
            key = (r["kind"], r["year"], json.dumps(r.get("cutoff"), sort_keys=True), r.get("as_of"))
            prev = best.get(key)
            if prev is None or no > prev["report"]:
                if prev is not None:
                    diff = [k for k in ANNUAL if r.get(k) is not None and prev.get(k) is not None and abs(r[k]-prev[k]) > 0.02*max(abs(prev[k]),1)]
                    if diff: notes.append(f"{key[0]} {key[1]}: nº {prev['report']} vs nº {no} difieren en {','.join(diff)} (se usa el nº {no})")
                best[key] = r
    annual = sorted([r for r in best.values() if r["kind"] == "annual"], key=lambda r: r["year"])
    ytd = sorted([r for r in best.values() if r["kind"] == "ytd"],
                 key=lambda r: (r["year"], (r["cutoff"] or {}).get("month") or 0, (r["cutoff"] or {}).get("day") or 0))
    snaps = sorted([r for r in best.values() if r["kind"] == "snapshot"], key=lambda r: (r["year"], r["as_of"]))
    for r in annual + ytd + snaps: r.pop("kind", None)
    obj = {"schemaVersion": 1, "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
           "meta": {"source": "ENESA (MAPA) — Informes de Contratación del Seguro Agrario nº 1-31",
                    "dataSource": "Agroseguro; elaboración ENESA",
                    "url": "https://www.mapa.gob.es/es/enesa/datos_sobre_el_seguro/informes_de_contratacion_del_seguro_agrario/",
                    "license": "ENESA autoriza su utilización total o parcial siempre que se cite expresamente su origen",
                    "historical": True, "lastReport": 31, "lastReportPeriod": "1.er semestre 2022",
                    "note": "Serie histórica cerrada: ENESA no ha publicado informes posteriores al nº 31. No es un dato actual.",
                    "units": {"polizas":"nº","animales_millones":"millones","produccion_kt":"miles de t","capital_meur":"M€",
                              "coste_neto_meur":"M€","subv_enesa_meur":"M€","subv_ccaa_meur":"M€","indemnizaciones_meur":"M€"},
                    "reports": reports, "notes": notes},
           "annual": annual, "ytd": ytd, "snapshots": snaps}
    with open(out, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1); f.write("\n")
    print(len(annual), "ejercicios,", len(ytd), "cortes parciales,", len(notes), "notas")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
