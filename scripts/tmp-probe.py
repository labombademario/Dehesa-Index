import json, urllib.request, os, re
os.makedirs("tmp-probe", exist_ok=True)
out = []
def get(url, n=None):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 Dehesa-Index-data-bot"})
        r = urllib.request.urlopen(req, timeout=90); b = r.read()
        return r.status, r.headers.get("content-type"), len(b), (b if n is None else b[:n]).decode("utf-8", "replace")
    except Exception as e:
        return "ERR", repr(e), 0, ""
s,t,n,b = get("https://agriculture.canada.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/geoJSON/")
out.append("== drought geojson dir %s %s %s" % (s,t,n)); out.append(re.sub(r"\s+"," ",b)[:3000])
links = re.findall(r'href="([^"]+)"', b)
out.append("links: " + " | ".join(links[:60]))
for l in links:
    if re.search(r"\.(zip|json|geojson)$", l, re.I):
        u = l if l.startswith("http") else "https://agriculture.canada.ca" + (l if l.startswith("/") else "/atlas/data_donnees/canadianDroughtMonitor/data_donnees/geoJSON/" + l)
        s,t,n,b = get(u, 1500); out.append("== %s -> %s %s %s\n%s" % (u,s,t,n,b)); break
s,t,n,b = get("https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/")
out.append("== CGC GSW page %s %s" % (s,n)); out.append(" | ".join(re.findall(r'href="([^"]*(?:csv|gsw)[^"]*)"', b)[:50]))
s,t,n,b = get("https://open.canada.ca/data/api/action/package_show?id=4c513dab-cdd0-471d-80f8-7da9f06fa654")
try:
    j=json.loads(b); rs=j["result"]["resources"]; out.append("CGC resources %d, last: %s" % (len(rs), [(x.get("format"),x.get("url"),x.get("name")) for x in rs[-8:]]))
except Exception as e: out.append("pkg parse "+repr(e))
try:
  req = urllib.request.Request("https://www150.statcan.gc.ca/t1/wds/rest/getCubeMetadata", data=json.dumps([{"productId":18100122},{"productId":18100112}]).encode(), headers={"User-Agent":"Dehesa-Index-data-bot/1.0","Content-Type":"application/json"})
  for r in json.loads(urllib.request.urlopen(req,timeout=60).read()):
    r=r["object"]; out.append("== %s %s freq %s %s-%s" % (r["productId"], r["cubeTitleEn"], r.get("frequencyCode"), r.get("cubeStartDate"), r.get("cubeEndDate")))
    for d in r["dimension"]: out.append("  dim %s: %d: %s" % (d["dimensionNameEn"], len(d["member"]), "; ".join(m["memberNameEn"] for m in d["member"][:30])))
except Exception as e: out.append("statcan ERR "+repr(e))
open("tmp-probe/probe3.txt","w").write("\n".join(out)[:60000])
