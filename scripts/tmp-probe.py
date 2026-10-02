import os, subprocess, csv, io, gzip, importlib.util
os.makedirs("tmp-probe", exist_ok=True); os.makedirs("scripts/fixtures/cgc", exist_ok=True)
log = []
r = subprocess.run(["python3", "scripts/update-canada-grain.py"], capture_output=True, text=True); log.append("grain rc=%s %s %s" % (r.returncode, r.stdout[-600:], r.stderr[-600:]))
spec = importlib.util.spec_from_file_location("g", "scripts/update-canada-grain.py"); G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)
KEEP = {("Terminal Exports", "Exports"), ("Primary", "Deliveries"), ("Summary", "Stocks")}
for fy, weeks in (("2025-26", lambda w: w >= 49 or w == 9), ("2026-27", lambda w: True)):
    rows = G.rows_of(G.fetch(fy))
    sub = [x for x in rows if (x["worksheet"], x["metric"]) in KEEP and weeks(int(x["Grain Week"]))]
    buf = io.StringIO(); w = csv.DictWriter(buf, fieldnames=list(rows[0].keys()), quoting=csv.QUOTE_ALL); w.writeheader(); w.writerows(sub)
    open("scripts/fixtures/cgc/gsw-%s-excerpt.csv.gz" % fy, "wb").write(gzip.compress(buf.getvalue().encode("utf-8"), 9)); log.append("fixture %s %d filas" % (fy, len(sub)))
open("tmp-probe/run11.txt", "w").write("\n".join(log))
