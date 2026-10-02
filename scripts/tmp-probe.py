import os, subprocess, csv, io, gzip, importlib.util, collections, json
os.makedirs("tmp-probe", exist_ok=True); os.makedirs("scripts/fixtures/cgc", exist_ok=True)
log = []
spec = importlib.util.spec_from_file_location("g", "scripts/update-canada-grain.py"); G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)
KEEP = {("Terminal Exports", "Exports"), ("Primary", "Deliveries"), ("Summary", "Stocks")}
anom_weeks = {}
for fy in ("2024-25", "2025-26", "2026-27"):
    rows = G.rows_of(G.fetch(fy)); keep = [r for r in rows if (r["worksheet"], r["metric"]) in KEEP]
    txt = collections.defaultdict(collections.Counter)
    for r in keep: txt[int(r["Grain Week"])][r["Week Ending Date"]] += 1
    multi = {w: dict(c) for w, c in txt.items() if len(c) > 1}
    log.append("== %s weeks %d; semanas con mas de un texto de fecha: %s" % (fy, len(txt), json.dumps(multi)))
    try:
        wd = G.week_dates(keep); log.append("   resueltas: " + json.dumps({str(k[1]): v for k, v in sorted(wd.items())}))
    except Exception as e: log.append("   week_dates ERROR %r" % e)
    anom_weeks[fy] = set(multi)
    try:
        mism = {w: (list(c)[0], wd[(keep[0]["Crop Year"], w)]) for w, c in txt.items() if G.iso(list(c)[0]) != wd[(keep[0]["Crop Year"], w)]}
        log.append("   texto != fecha resuelta: " + json.dumps(mism))
        for w in mism: multi[w] = {"x": 1}
    except Exception as e: log.append("   mism ERROR %r" % e)
    # fixture: semanas anomalas +-1, mas semana 1 y 52
    want = set()
    for w in list(multi) + ([1, 2, 52, 53] if fy == "2024-25" else []):
        want |= {w - 1, w, w + 1}
    if fy == "2025-26": want |= {9} | set(range(49, 54))
    if fy == "2026-27": want = set(range(1, 60))
    sub = [x for x in keep if int(x["Grain Week"]) in want]
    buf = io.StringIO(); w = csv.DictWriter(buf, fieldnames=list(rows[0].keys()), quoting=csv.QUOTE_ALL); w.writeheader(); w.writerows(sub)
    open("scripts/fixtures/cgc/gsw-%s-excerpt.csv.gz" % fy, "wb").write(gzip.compress(buf.getvalue().encode("utf-8"), 9)); log.append("   fixture %d filas" % len(sub))
r = subprocess.run(["python3", "scripts/update-canada-grain.py"], capture_output=True, text=True); log.append("grain rc=%s %s %s" % (r.returncode, r.stdout[-800:], r.stderr[-800:]))
open("tmp-probe/run12.txt", "w").write("\n".join(log))
