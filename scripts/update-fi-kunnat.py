#!/usr/bin/env python3
"""Finlandia por municipio (kunta, ~300): explotaciones, cultivos y ganado (Luke) -> data/fi-kunnat/<NUTS2>.json (FI19 FI1B FI1C FI1D FI20) + index.json
Fuente: Luke (Instituto de Recursos Naturales de Finlandia), base abierta statdb.luke.fi (CC BY 4.0, id luke_fi), ultimo anio publicado de tres cuadros por municipio:
  yrirak/0100_yrirak  numero de empresas agricolas y hortofruticolas
  kamama/0200_kamama  superficie agraria utilizada (ha) por cultivo, y explotaciones
  kotlkm/0200_kotlkm  ganado a 1 de abril/mayo (cabezas) por especie, y explotaciones
La relacion municipio -> gran region NUTS 2 sale de la tabla de correspondencia de Estadisticas de Finlandia (data.stat.fi, clasificaciones kunta -> nuts_2 del anio).
Luke deja en blanco o con punto lo que protege el secreto estadistico: queda como hueco (null), nunca se rellena ni se reparte.
Controles (si fallan no se escribe nada): entre 250 y 330 municipios con datos; los 5 NUTS 2; la suma de municipios no se aparta mas de 1 % del total nacional en superficie agraria y trigo, ni mas de
2 % en explotaciones; ganado no supera el total nacional (1 %) ni queda por debajo del 80 % (el secreto estadistico deja huecos, sobre todo en cerdos); sin negativos.
Uso: update-fi-kunnat.py [--out DIRECTORIO]"""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
LUKE = "https://statdb.luke.fi/PxWeb/api/v1/en/LUKE/maa/"
CLS = "https://data.stat.fi/api/classifications/v2/correspondenceTables/%s/maps?content=data&meta=min&lang=en"
UA = {"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
NUTS2 = ("FI19", "FI1B", "FI1C", "FI1D", "FI20")
CROPS = [("uaa", "KAMAMA_YHT"), ("wheatw", "VEHNSY"), ("wheats", "VEHNKE"), ("rye", "RUIS"), ("barleyf", "OHRARE"), ("barleym", "OHRAMA"), ("oats", "KAUR"), ("grass", "REHUNU"), ("pasture", "LAID"),
         ("potato", "PERU"), ("beet", "SOKEJ"), ("turnip", "RYPS"), ("rape", "RAPS"), ("peas", "HERN"), ("hort", "PUUTKASV"), ("fallow", "KESAT"), ("green", "KASVVILJ")]
LIVE = [("cattle", "NAUD"), ("dairy", "LEHML"), ("suckler", "LEHME"), ("pigs", "SIAT"), ("sows", "EMAK8"), ("sheep", "LAMP"), ("goats", "VUOH")]
KEYS = ["farms", "cropfarms"] + [k for k, _ in CROPS] + ["cattlefarms", "pigfarms", "sheepfarms"] + [k for k, _ in LIVE]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def call(url, body=None, tries=4):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None, headers=dict(UA, **({"Content-Type": "application/json"} if body else {})))
            with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read().decode("utf-8-sig"))
        except Exception as e:
            last = str(e)[:160]; time.sleep(8 * (i + 1))
    raise RuntimeError("%s -> %s" % (url.split("?")[0][-70:], last))
def q(path, sel):
    return call(LUKE + path, {"query": [{"code": c, "selection": {"filter": "item", "values": v}} for c, v in sel], "response": {"format": "json"}})["data"]
def num(v):
    v = (v or "").strip().replace(" ", "")
    if v in ("", ".", "..", "...", "-"): return None
    try: x = float(v.replace(",", "."))
    except ValueError: return None
    if x < 0: raise RuntimeError("valor negativo %r" % v)
    return int(round(x)) if x == int(x) else round(x, 2)
def nk(c): return c[2:].zfill(3)   # Luke escribe Vantaa como KU092 en unas tablas y KU92 en otras
def norm(d):
    o = {}
    for k, v in d.items():
        kk = (nk(k[0]),) + tuple(k[1:]) if isinstance(k, tuple) else nk(k)
        if o.get(kk) is None: o[kk] = v
    return o
def codes(path, var):
    m = call(LUKE + path); v = [x for x in m["variables"] if x["code"] == var][0]
    return v["values"], v["valueTexts"]
def main():
    args = sys.argv[1:]; out = ROOT / "data" / "fi-kunnat"
    if "--out" in args: out = Path(args[args.index("--out") + 1])
    logf = ROOT / "data" / "fi-kunnat-log.txt"
    def fail(*m): log("FALLO:", *m); logf.write_text("\n".join(LOG) + "\n"); return 1
    try:
        ku, kut = codes("yrirak/0100_yrirak.px", "KU"); yrs = [int(a) for a in codes("yrirak/0100_yrirak.px", "A")[0]]
        year = max(yrs); log("anio de empresas", year)
        if year not in [int(a) for a in codes("kamama/0200_kamama.px", "A")[0]] or year not in [int(a) for a in codes("kotlkm/0200_kotlkm.px", "A")[0]]:
            year = min(year, max(int(a) for a in codes("kamama/0200_kamama.px", "A")[0]), max(int(a) for a in codes("kotlkm/0200_kotlkm.px", "A")[0]))
        ys = str(year); log("anio comun", ys)
        # empresas
        d = q("yrirak/0100_yrirak.px", [("INFO", ["KPL"]), ("KU", ku), ("A", [ys])])
        farms = norm({r["key"][0]: num(r["values"][0]) for r in d})
        kk, _ = codes("kamama/0200_kamama.px", "KU")
        # el formato json con dos medidas pone una columna por medida: se pide cada una por separado para no depender del orden
        ha = {}; cf = {}
        for inf, dst in (("HA_VALA", ha), ("TILA_KPL", cf)):
            for r in q("kamama/0200_kamama.px", [("INFO", [inf]), ("A", [ys]), ("KU", kk), ("LJ", [c for _, c in CROPS])]): dst[(r["key"][1], r["key"][2])] = num(r["values"][0])
        lk, _ = codes("kotlkm/0200_kotlkm.px", "KU"); li = {}; lf = {}
        for inf, dst in (("ELA_YKS", li), ("TILA_KPL", lf)):
            for r in q("kotlkm/0200_kotlkm.px", [("INFO", [inf]), ("A", [ys]), ("KU", lk), ("LJ", [c for _, c in LIVE])]): dst[(r["key"][1], r["key"][2])] = num(r["values"][0])
        ha, cf, li, lf = norm(ha), norm(cf), norm(li), norm(lf)
        # totales nacionales
        natf = [num(r["values"][0]) for r in q("yrirak/0200_yrirak.px", [("INFO", ["KPL"]), ("A", [ys]), ("ELY", ["SSS"]), ("TUOTS", ["TUOTS_YHT"])])][0]
        natl = {}
        for r in q("kotlkm/0100_kotlkm.px", [("INFO", ["ELA_YKS"]), ("A", [ys]), ("MK", ["SSS"]), ("LJ", [c for _, c in LIVE])]): natl[r["key"][-1]] = num(r["values"][0])
        # correspondencia municipio -> NUTS 2
        corr = None
        for ver in ("%s0101" % year, "%s0101" % (year + 1), "20250101"):
            try: corr = call(CLS % ("kunta_1_%s%%23nuts_2_%s" % (ver, ver))); break
            except RuntimeError: continue
        if not corr: return fail("no se pudo leer la correspondencia municipio -> NUTS 2")
    except RuntimeError as e: return fail(str(e))
    reg = {}
    for x in corr:
        t = x["targetLocalId"].split("/")[-1]
        if t in NUTS2: reg[x["sourceLocalId"].split("/")[-1]] = t
    names = {}
    for k, t in zip(ku, kut): names[nk(k)] = re.sub(r"^\d+\s+", "", t).title() if t.split(' ', 1)[-1].isupper() else re.sub(r"^\d+\s+", "", t)
    nat = {"uaa": None}
    for r in q("kamama/0200_kamama.px", [("INFO", ["HA_VALA"]), ("A", [ys]), ("KU", ["SSS"]), ("LJ", ["KAMAMA_YHT", "VEHNSY"])]): nat["uaa" if r["key"][-1] == "KAMAMA_YHT" else "wheatw"] = num(r["values"][0])
    regs = {}; sums = {k: 0 for k in KEYS}; kept = 0; nomap = []
    allk = sorted({nk(c) for c in ku + kk + lk if c != "SSS"})
    for code in allk:
        c = code
        vals = {"farms": farms.get(c)}
        vals["cropfarms"] = cf.get((c, "KAMAMA_YHT"))
        for k, cc in CROPS: vals[k] = ha.get((c, cc))
        vals["cattlefarms"] = lf.get((c, "NAUD")); vals["pigfarms"] = lf.get((c, "SIAT")); vals["sheepfarms"] = lf.get((c, "LAMP"))
        for k, cc in LIVE: vals[k] = li.get((c, cc))
        if not (vals["farms"] or vals["uaa"]): continue
        if code not in reg: nomap.append(code); continue
        nm = names.get(c) or c
        regs.setdefault(reg[code], {})[code] = [nm] + [vals[k] for k in KEYS]; kept += 1
        for k in KEYS: sums[k] += vals[k] or 0
    log("municipios con datos", kept, "NUTS 2", sorted(regs), "sin region", nomap[:6], len(nomap))
    if nomap: return fail("municipios con datos sin region NUTS 2:", nomap[:10])
    if not 250 <= kept <= 330 or set(regs) != set(NUTS2): return fail("municipios o regiones fuera de rango:", kept, sorted(regs))
    chk = [("uaa", sums["uaa"], nat["uaa"], 0.01), ("wheatw", sums["wheatw"], nat["wheatw"], 0.01), ("farms", sums["farms"], natf, 0.02)]
    for k, cc in LIVE:
        if natl.get(cc): chk.append((k, sums[k], natl[cc], 0.1 if False else 0.01))
    for k, s, n, tol in chk:
        if not n: return fail("sin total nacional para", k)
        log("  control %-8s municipios %12s nacional %12s (%.2f %%)" % (k, round(s, 1), n, 100 * s / n))
        if k in [x for x, _ in LIVE]:
            if s > n * 1.01 or (k in ('cattle', 'dairy', 'pigs') and s < n * 0.8): return fail("%s: municipios %s frente a total nacional %s" % (k, s, n))
        elif abs(s - n) > n * tol: return fail("%s: la suma de municipios %s se aparta mas de %.0f %% del total %s" % (k, s, tol * 100, n))
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.json"): old.unlink()
    src = {"id": "luke_fi", "url": "https://statdb.luke.fi/PxWeb/pxweb/en/LUKE/LUKE__02%20Maatalous__04%20Tuotanto__02%20Maatalous__kamama/"}
    for r, cm in sorted(regs.items()):
        (out / (r + ".json")).write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "region": r, "year": year, "ind": KEYS, "kunnat": cm}, ensure_ascii=False, separators=(",", ":")) + "\n")
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "year": year, "kunnat": kept, "ind": KEYS, "regions": {r: len(cm) for r, cm in sorted(regs.items())},
                                               "totals": {k: round(v, 2) for k, v in sums.items()}, "national": {"uaa": nat["uaa"], "wheatw": nat["wheatw"], "farms": natf, **{k: natl.get(cc) for k, cc in LIVE}}}, ensure_ascii=False, separators=(",", ":")) + "\n")
    log("escrito", len(regs), "regiones")
    logf.write_text("\n".join(LOG) + "\n"); return 0
if __name__ == "__main__":
    sys.exit(main())
