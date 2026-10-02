import os, importlib.util, collections, re, json
os.makedirs("tmp-probe", exist_ok=True)
spec = importlib.util.spec_from_file_location("g", "scripts/update-canada-grain.py"); G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)
out = []
for fy in ("2024-25", "2025-26", "2023-24"):
    try:
        rows = G.rows_of(G.fetch(fy)); bad = [r for r in rows if not re.fullmatch(r"-?\d+(\.\d+)?", r["Ktonnes"] or "0")]
        out.append("== %s rows %d nonnumeric %d patterns %s" % (fy, len(rows), len(bad), collections.Counter(re.sub(r"\d", "9", r["Ktonnes"]) for r in bad).most_common(8)))
        by = collections.Counter((r["worksheet"], r["metric"]) for r in bad); out.append("   by sheet: " + str(by.most_common(10)))
        for r in bad[:8]: out.append("   " + json.dumps(r))
        kept = [r for r in bad if (r["worksheet"], r["metric"]) in {("Terminal Exports", "Exports"), ("Primary", "Deliveries"), ("Summary", "Stocks")}]
        out.append("   in kept sheets: %d" % len(kept))
        for r in kept[:6]: out.append("   KEPT " + json.dumps(r))
    except Exception as e: out.append("ERR %s %r" % (fy, e))
open("tmp-probe/run10.txt", "w").write("\n".join(out))
