#!/usr/bin/env python3
"""Guarda comun antes de publicar datos (la llama .github/actions/publish): un fallo pasajero de la fuente no puede borrar series que estaban al dia.

Para cada fichero preparado (git add) con forma {"countries": {CC: {"series": [{"id", "points"}]}}}, compara con lo publicado (HEAD).
Si desaparecen series AL DIA (ultimo dato reciente):
  - y el log de ESTA ejecucion (lineas nuevas de data/<nombre>-log.txt) registra un fallo de la fuente (FALLO, HTTPError, Traceback...):
    se reponen tal cual (mismos puntos, nada estimado), con ::warning:: y nota en el "log" del fichero. Caso real: 404 del azucar, 21-oct-2026.
  - sin fallo registrado: no se reponen (suele ser una retirada a proposito tras un cambio de codigo), pero se avisa con la lista
    (::warning::) para que no pase en silencio. Repasado sobre un mes de publicaciones: 11 de 13 casos eran retiradas a proposito.
  - si la que desaparece ya era vieja, se deja ir: es la poda normal por antiguedad de cada pipeline.
  - las que se retiran a proposito (renombrados, bajas) se anotan en scripts/series-retired.json y se dejan ir.
  - PUBLISH_ALLOW_SERIES_LOSS=1 desactiva la guarda en una ejecucion concreta.
Al dia = anual: ano >= actual - 2; resto: ultimos 12 meses.
Uso: python3 scripts/guard-series-loss.py [ficheros...]   (sin argumentos: los .json preparados bajo data/)"""
import json, os, re, subprocess, sys, datetime
FAIL = re.compile(r"\bFALLO\b|HTTPError|URLError|Traceback|timed out|ConnectionError|RemoteDisconnected|SSLError", re.I)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def sh(*a):
    return subprocess.run(a, cwd=ROOT, capture_output=True, text=True).stdout

def last_period(s):
    pts = s.get("points") or s.get("data") or []
    ds = [str(p[0]) for p in pts if isinstance(p, (list, tuple)) and p]
    return max(ds) if ds else ""

def fresh(period, today=None):
    t = today or datetime.date.today()
    m = re.match(r"^(\d{4})(?:[-/](\d{1,2}|Q\d|S\d|W\d+))?", period or "")
    if not m: return False
    y, sub = int(m.group(1)), m.group(2)
    if sub and sub[0] == "Q": sub = str(int(sub[1:]) * 3)   # trimestre -> su ultimo mes
    if sub is None or not sub.isdigit() or "/" in period[:7]:   # anual, semestre o campana 2026/27
        return y >= t.year - 2
    mo = min(int(sub), 12)
    return (t.year * 12 + t.month) - (y * 12 + mo) <= 12

def series_by_id(doc):
    out = {}
    for cc, c in ((doc or {}).get("countries") or {}).items():
        for s in (c or {}).get("series") or []:
            if isinstance(s, dict) and s.get("id"): out[s["id"]] = (cc, s)
    return out

def guard(old, new, today=None):
    """Devuelve (doc_nuevo_con_repuestas, repuestas[(cc,id,periodo)], viejas_que_se_van[id])."""
    o, n = series_by_id(old), series_by_id(new)
    back, gone_old = [], []
    for sid, (cc, s) in o.items():
        if sid in n: continue
        p = last_period(s)
        if fresh(p, today): back.append((cc, sid, p))
        else: gone_old.append(sid)
    if back:
        C = new.setdefault("countries", {})
        for cc, sid, p in back:
            if cc not in C:
                C[cc] = {k: v for k, v in old["countries"][cc].items() if k != "series"}; C[cc]["series"] = []
            C[cc].setdefault("series", []).append(o[sid][1])
        if isinstance(new.get("log"), list):
            new["log"] = (new["log"] + ["REPUESTA %s (dato al dia hasta %s): no llego en esta ejecucion; se conserva lo publicado" % (sid, p) for _, sid, p in back])[-60:]
    return new, back, gone_old

def pts(s):
    return {str(p[0]): p[1] for p in (s.get("points") or s.get("data") or []) if isinstance(p, (list, tuple)) and len(p) > 1}

def find_renames(old, new):
    """Series que no desaparecen sino que cambian de id: la nueva no existia antes y comparte al menos 3 periodos con los mismos valores
    en el 80 % o mas de los periodos comunes (las revisiones de la fuente cambian alguno). Devuelve {id_viejo: id_nuevo}."""
    o, n = series_by_id(old), series_by_id(new)
    gone = [k for k in o if k not in n]; born = [k for k in n if k not in o]
    out = {}
    for g in gone:
        pg, best = pts(o[g][1]), None
        for b in born:
            if o[g][0] != n[b][0] or b in out.values(): continue
            pb = pts(n[b][1]); com = [k for k in pg if k in pb]
            if len(com) < 3: continue
            eq = sum(1 for k in com if pg[k] is not None and pb[k] is not None and abs(pg[k] - pb[k]) <= 1e-9 * max(1, abs(pg[k])))
            sc = eq / float(len(com))
            if sc >= 0.8 and (best is None or sc > best[0] or sc == best[0] and len(com) > best[2] or (sc == best[0] and len(com) == best[2] and b.startswith(g))): best = (sc, b, len(com))
        if best: out[g] = best[1]
    return out

def record_renames(ren, path, today=None):
    """Anade los renombrados a data/series-renames.json ({"renames": {viejo: nuevo}, "log": [...]}), encadenando a->b->c."""
    if not ren: return False
    f = os.path.join(ROOT, "data/series-renames.json")
    try: d = json.load(open(f, encoding="utf-8"))
    except Exception: d = {"note": "Series que cambiaron de id con los mismos datos. La lista de seguimiento migra sola las entradas guardadas con el id viejo. Lo escribe scripts/guard-series-loss.py al publicar.", "renames": {}, "log": []}
    R = d.setdefault("renames", {})
    for a, b in ren.items():
        for k, v in list(R.items()):
            if v == a: R[k] = b
        R[a] = b
    d.setdefault("log", []).append("%s %s: %d renombradas" % ((today or datetime.date.today()).isoformat(), path, len(ren)))
    d["log"] = d["log"][-100:]
    with open(f, "w", encoding="utf-8") as h: json.dump(d, h, ensure_ascii=False, indent=1, sort_keys=True); h.write("\n")
    subprocess.run(["git", "add", "--", "data/series-renames.json"], cwd=ROOT)
    return True

def retired():
    """Ids que se retiran a proposito (renombrados o fuentes dadas de baja): scripts/series-retired.json {"ids": [...], "prefixes": [...]}."""
    try: d = json.load(open(os.path.join(ROOT, "scripts/series-retired.json"), encoding="utf-8"))
    except Exception: return set(), ()
    return set(d.get("ids") or []), tuple(d.get("prefixes") or [])

def failure_lines(path):
    """Lineas nuevas (preparadas) del log del pipeline que registran un fallo de la fuente."""
    base = os.path.basename(path)[:-5]
    cands = {"data/%s-log.txt" % base, "data/%s-log.txt" % re.sub(r"-stats$", "", base)}
    out = []
    for lg in sorted(cands):
        diff = sh("git", "diff", "--cached", "-U0", "--", lg)
        if not diff and not sh("git", "ls-files", "--", lg).strip():
            try: diff = "\n".join("+" + l for l in open(os.path.join(ROOT, lg), encoding="utf-8").read().splitlines())   # log nuevo sin preparar
            except Exception: diff = ""
        out += [l[1:] for l in diff.splitlines() if l.startswith("+") and not l.startswith("+++") and FAIL.search(l)]
    return out

def main(argv):
    if os.environ.get("PUBLISH_ALLOW_SERIES_LOSS") == "1": print("guard-series-loss: desactivada en esta ejecucion"); return
    files = argv or [f for f in sh("git", "diff", "--cached", "--name-only", "--diff-filter=M").split() if f.startswith("data/") and f.endswith(".json")]
    total = 0
    for f in files:
        try:
            old_txt = sh("git", "show", "HEAD:" + f)
            if '"countries"' not in old_txt[:200000] or not old_txt: continue
            new_txt = open(os.path.join(ROOT, f), encoding="utf-8").read()
            old, new = json.loads(old_txt), json.loads(new_txt)
        except Exception:
            continue
        if not isinstance(old, dict) or "countries" not in old: continue
        ren = find_renames(old, new)
        if ren:
            record_renames(ren, f)
            print("::notice::%s: %d series cambian de id con los mismos datos (anotadas en data/series-renames.json): %s" % (f, len(ren), ", ".join("%s -> %s" % kv for kv in list(ren.items())[:6])))
            for c in (old.get("countries") or {}).values(): c["series"] = [x for x in c.get("series") or [] if x.get("id") not in ren]
        ids, pre = retired()
        o = series_by_id(old)
        for sid in [k for k in o if k in ids or (pre and k.startswith(pre))]: del o[sid]   # retiradas a proposito: no se reponen
        old = {"countries": {}}
        for sid, (cc, s) in o.items(): old["countries"].setdefault(cc, {"series": []})["series"].append(s)
        for cc in old["countries"]: old["countries"][cc].update({k: v for k, v in json.loads(old_txt)["countries"][cc].items() if k != "series"})
        fixed, back, gone_old = guard(old, new)
        if not back: continue
        why = failure_lines(f)
        if not why:
            print("::warning::%s: desaparecen %d series que estaban al dia, sin fallo registrado en el log (se dejan ir; si no es a proposito, revisar): %s" % (f, len(back), ", ".join(b[1] for b in back[:12]) + (" ..." if len(back) > 12 else "")))
            continue
        compact = "\n" not in new_txt.strip()
        with open(os.path.join(ROOT, f), "w", encoding="utf-8") as h:
            if compact: json.dump(fixed, h, ensure_ascii=False, separators=(",", ":"))
            else: json.dump(fixed, h, ensure_ascii=False, indent=1); h.write("\n")
        subprocess.run(["git", "add", "--", f], cwd=ROOT, check=True)
        total += len(back)
        print("::warning::%s: la fuente fallo (%s) y no trajo %d series que estaban al dia; se reponen las publicadas: %s" % (f, why[0][:120], len(back), ", ".join(b[1] for b in back[:12]) + (" ..." if len(back) > 12 else "")))
    print("guard-series-loss: %d series repuestas" % total)

if __name__ == "__main__":
    main(sys.argv[1:])
