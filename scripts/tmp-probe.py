import json, urllib.request, os, re, urllib.parse
os.makedirs("tmp-probe", exist_ok=True)
out = []
def get(url, n=None, ua="Mozilla/5.0 Dehesa-Index-data-bot"):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": ua})
        r = urllib.request.urlopen(req, timeout=60); b = r.read()
        return r.status, r.headers.get("content-type"), len(b), (b if n is None else b[:n]).decode("utf-8", "replace")
    except Exception as e:
        return "ERR", repr(e), 0, ""
for q in ("drought monitor agriculture", "Canadian Drought Monitor Agriculture and Agri-Food", "crop condition report", "farm input prices fertilizer", "livestock slaughter weekly", "Saskatchewan crop report"):
    s, t, n, b = get("https://open.canada.ca/data/api/action/package_search?rows=8&q=" + urllib.parse.quote(q))
    out.append("== %s -> %s" % (q, s))
    try:
        for p in json.loads(b)["result"]["results"]:
            out.append("  - %s | %s | %s | org %s | %s" % (p["id"][:8], p.get("title"), p.get("license_title"), (p.get("organization") or {}).get("title", "")[:40], [(x.get("format"), (x.get("url") or "")[:110]) for x in p.get("resources", [])][:4]))
    except Exception as e:
        out.append("  parse " + repr(e))
for y in ("2025-26", "2024-25"):
    u = "https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/%s/csv/gsw-shg-en.csv" % y
    s, t, n, b = get(u, 3500)
    out.append("== CGC %s -> %s %s %s\n%s" % (y, s, t, n, b))
out_s = "\n".join(out)
open("tmp-probe/probe2.txt", "w").write(out_s[:60000])
