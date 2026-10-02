import json, urllib.request, os, re
os.makedirs("tmp-probe", exist_ok=True)
out = []
def get(url, n=None):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 Dehesa-Index-data-bot"})
        r = urllib.request.urlopen(req, timeout=120); b = r.read()
        return r.status, r.headers.get("content-type"), len(b), (b if n is None else b[:n]).decode("utf-8", "replace")
    except Exception as e:
        return "ERR", repr(e), 0, ""
def save():
    open("tmp-probe/probe4.txt","w").write("\n".join(out)[:60000])
base = "https://agriculture.canada.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/geoJSON/areasofDrought/"
s,t,n,b = get(base)
rows = re.findall(r'href="([^"?]+)"[^<]*</a>\s*</td><td[^>]*>([^<]*)</td><td[^>]*>([^<]*)', b)
out.append("== drought dir %s %s entries; last 25:" % (s, len(rows)))
for r in rows[-25:]: out.append("  %s | %s | %s" % r)
save()
files = [r[0] for r in rows if r[0].lower().endswith(("json", "zip"))]
if files:
    u = base + files[-1]
    s,t,n,b = get(u)
    out.append("== %s -> %s %s %s bytes" % (u, s, t, n))
    try:
        j = json.loads(b); out.append("type %s features %d" % (j.get("type"), len(j.get("features", []))))
        out.append("crs " + str(j.get("crs")))
        for f in j["features"][:6]:
            out.append("  props " + json.dumps(f["properties"], ensure_ascii=False)[:400] + " geom " + f["geometry"]["type"] + " npts " + str(len(json.dumps(f["geometry"]["coordinates"]))))
    except Exception as e: out.append("parse " + repr(e) + " " + b[:500])
save()
for u in ("https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/2026-27/gsw-shg-en.csv",
          "https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/2025-26/gsw-shg-en.csv"):
    s,t,n,b = get(u)
    out.append("== %s -> %s %s %s bytes" % (u, s, t, n))
    lines = b.splitlines(); out.append("lines %d" % len(lines))
    out.extend(lines[:12]); out.extend(["..."] + lines[-4:])
    if n > 2000:
        cols = lines[0].split(",") if lines else []
        out.append("distinct (col1..3) sample:")
        for i in (1, 2, 3, 4):
            vals = sorted({l.split(",")[i] for l in lines[1:] if l.count(",") > i})
            out.append("  col%d: %s" % (i, vals[:40]))
    save()
save()
