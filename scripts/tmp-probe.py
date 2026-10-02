import json, urllib.request, os, re
os.makedirs("tmp-probe", exist_ok=True)
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0", "Content-Type": "application/json"}
out = []
def post(path, body):
    req = urllib.request.Request("https://www150.statcan.gc.ca/t1/wds/rest/" + path, data=json.dumps(body).encode(), headers=UA)
    return json.loads(urllib.request.urlopen(req, timeout=60).read())
for pid in (32100049, 32100050, 32100051, 18100001, 18100002, 32100143, 32100130, 32100045):
    try:
        r = post("getCubeMetadata", [{"productId": pid}])[0]["object"]
        out.append("== %s %s | freq %s | %s - %s" % (pid, r["cubeTitleEn"], r.get("frequencyCode"), r.get("cubeStartDate"), r.get("cubeEndDate")))
        for d in r["dimension"]:
            out.append("  dim %s: %d members: %s" % (d["dimensionNameEn"], len(d["member"]), "; ".join(m["memberNameEn"] for m in d["member"][:25])))
    except Exception as e:
        out.append("== %s ERROR %r" % (pid, e))
def get(url, n=3000):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 Dehesa-Index-data-bot"})
        r = urllib.request.urlopen(req, timeout=60); b = r.read()
        return r.status, r.headers.get("content-type"), len(b), b[:n].decode("utf-8", "replace")
    except Exception as e:
        return "ERR", repr(e), 0, ""
for url in ("https://open.canada.ca/data/api/action/package_search?q=grain+statistics+weekly&rows=5",
            "https://open.canada.ca/data/api/action/package_search?q=canadian+drought+monitor&rows=5",
            "https://open.canada.ca/data/api/action/package_search?q=retail+prices+diesel+weekly&rows=5"):
    s, t, n, b = get(url, 4000)
    out.append("== %s -> %s %s %s" % (url, s, t, n))
    try:
        j = json.loads(b if n < 4000 else get(url, 10**7)[3])
        for p in j["result"]["results"]:
            out.append("  - %s | %s | lic %s | %s" % (p["id"], p.get("title"), p.get("license_title"), [(x.get("format"), x.get("url")) for x in p.get("resources", [])][:6]))
    except Exception as e:
        out.append("  parse " + repr(e) + " " + b[:300])
open("tmp-probe/probe1.txt", "w").write("\n".join(out)[:60000])
