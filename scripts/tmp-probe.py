import importlib.util, os, collections, json
os.makedirs("tmp-probe", exist_ok=True)
spec = importlib.util.spec_from_file_location("s", "scripts/update-canada-stats.py"); S = importlib.util.module_from_spec(spec); spec.loader.exec_module(S)
log = []
for pid in (32100359, 32100130, 32100160, 32100129, 32100045, 32100052, 32100216):
    try:
        rows = S.load(pid)
    except Exception as e:
        log.append("== %s ERR %r" % (pid, e)); continue
    cols = list(rows[0].keys()); log.append("== %s rows=%d cols=%s" % (pid, len(rows), cols))
    for c in cols:
        if c in ("REF_DATE", "VALUE", "DGUID", "UOM_ID", "SCALAR_ID", "VECTOR", "COORDINATE", "STATUS", "SYMBOL", "TERMINATED", "DECIMALS"): continue
        u = collections.Counter(r[c] for r in rows)
        log.append("  %s (%d): %s" % (c, len(u), list(u)[:45] if len(u) <= 60 else list(u)[:15]))
    ds = sorted({r["REF_DATE"] for r in rows}); log.append("  REF_DATE %s .. %s (%d)" % (ds[0], ds[-1], len(ds)))
open("tmp-probe/run21.txt", "w").write("\n".join(log))
