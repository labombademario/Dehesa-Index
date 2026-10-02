import os, subprocess, csv, io, gzip, sys, importlib.util
os.makedirs("tmp-probe", exist_ok=True); os.makedirs("scripts/fixtures/cgc", exist_ok=True)
log = []
r = subprocess.run(["python3", "scripts/update-canada-stats.py"], env=dict(os.environ, ONLY="costs"), capture_output=True, text=True); log.append("stats rc=%s %s" % (r.returncode, r.stdout[-300:]))
r = subprocess.run(["python3", "scripts/update-canada-grain.py"], capture_output=True, text=True); log.append("grain rc=%s %s %s" % (r.returncode, r.stdout[-600:], r.stderr[-600:]))
spec = importlib.util.spec_from_file_location("g", "scripts/update-canada-grain.py"); G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)
KEEP = {("Terminal Exports", "Exports"), ("Primary", "Deliveries"), ("Summary", "Stocks")}
for fy, minweek in (("2025-26", 49), ("2026-27", 1)):
    try:
        rows = G.rows_of(G.fetch(fy))
        sub = [x for x in rows if (x["worksheet"], x["metric"]) in KEEP and int(x["Grain Week"]) >= minweek]
        buf = io.StringIO(); w = csv.DictWriter(buf, fieldnames=list(rows[0].keys()), quoting=csv.QUOTE_ALL); w.writeheader(); w.writerows(sub)
        open("scripts/fixtures/cgc/gsw-%s-excerpt.csv.gz" % fy, "wb").write(gzip.compress(buf.getvalue().encode("utf-8"), 9))
        log.append("fixture %s %d filas" % (fy, len(sub)))
    except Exception as e: log.append("fixture ERR %s %r" % (fy, e))
open("tmp-probe/run9.txt", "w").write("\n".join(log))
