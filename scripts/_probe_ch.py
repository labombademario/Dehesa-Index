import json, urllib.request, urllib.parse, os
OUT = "probe-ch"; os.makedirs(OUT, exist_ok=True)
G = "https://lindas.admin.ch/foag/agricultural-market-data"
D = "https://agriculture.ld.admin.ch/foag/dimension/"
def sparql(q):
    req = urllib.request.Request("https://lindas.admin.ch/query", data=urllib.parse.urlencode({"query": q}).encode(), headers={"Accept": "application/sparql-results+json", "User-Agent": "DehesaIndex-probe"})
    return json.loads(urllib.request.urlopen(req, timeout=170).read().decode())
cubes = [b["cube"]["value"] for b in json.load(open("probe-ch/cubes.json"))["results"]["bindings"]]
try:
    r = sparql("""PREFIX schema: <http://schema.org/> SELECT ?i ?n (LANG(?n) AS ?l) WHERE { GRAPH <%s> { ?i schema:name ?n FILTER(STRSTARTS(STR(?i),'https://agriculture.ld.admin.ch/foag/') && !STRSTARTS(STR(?i),'https://agriculture.ld.admin.ch/foag/cube')) } }""" % G)
    json.dump([[b["i"]["value"].replace("https://agriculture.ld.admin.ch/foag/", ""), b["n"]["value"], b["l"]["value"]] for b in r["results"]["bindings"]], open("probe-ch/labels_all.json", "w"), ensure_ascii=False)
except Exception as e: open("probe-ch/labels_all.err", "w").write(repr(e))
EXTRA = ["market","product-properties","product-origin","usage","foreign-trade","cost-component","value-chain-detail","key-indicator-type","product-subgroup","product-group"]
SKIP = ("Import_", "Export_", "FruitsVegetablesPotatoes", "Gastronomy")
for c in cubes:
    if any(x in c for x in SKIP): continue
    short = c.replace("https://agriculture.ld.admin.ch/foag/cube/", "").replace("/", "__")
    meas = "price" if "Price" in c else ("quantity" if "Quantity" in c else ("index" if "Index" in c else ("percentage" if "Percentage" in c else "contribution")))
    opt = " ".join("OPTIONAL { ?o <%s%s> ?%s }" % (D, e, v) for e, v in [("product","p"),("production-system","s"),("unit","u"),("currency","cur"),("value-chain","vc"),("data-method","dm"),("data-source","ds"),("sales-region","sr")] + [(e, "x%d" % k) for k, e in enumerate(EXTRA)])
    q = "PREFIX cube: <https://cube.link/> SELECT * WHERE { GRAPH <%s> { <%s> cube:observationSet/cube:observation ?o . ?o <%sdate> ?d ; <https://agriculture.ld.admin.ch/foag/measure/%s> ?v . %s } }" % (G, c, D, meas, opt)
    try:
        r = sparql(q)
        rows = [[b.get(k, {}).get("value", "").replace("https://agriculture.ld.admin.ch/foag/", "") for k in ["p", "s", "u", "cur", "d", "v", "vc", "dm", "ds", "sr"] + ["x%d" % i for i in range(len(EXTRA))]] for b in r["results"]["bindings"]]
        json.dump(rows, open("probe-ch/obs_%s.json" % short, "w"), ensure_ascii=False, separators=(",", ":")); print(short, len(rows))
    except Exception as e:
        open("probe-ch/obs_%s.err" % short, "w").write(repr(e)); print(short, "ERR", e)
