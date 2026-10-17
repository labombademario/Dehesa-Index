import json, os, urllib.request, time
UA = {"User-Agent": "Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)", "Accept": "*/*"}
OUT = "probe/eu-out"; os.makedirs(OUT, exist_ok=True)
def get(u, t=120):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(5)
    raise RuntimeError("%s %r" % (u, last))
log = []
try:
    cfg = json.loads(get("https://api.tech.ec.europa.eu/agrifood/v3/api-docs/swagger-config"))
    open(OUT + "/swagger-config.json", "w").write(json.dumps(cfg, indent=1))
    paths = {}
    urls = cfg.get("urls") or [{"name": "all", "url": cfg.get("url")}]
    for g in ["cereals","beef","pigmeat","poultry","sheepAndGoat","dairy","fruitAndVegetable","rice","oilseeds","sugar","oliveOil","wine","taxud","cmef","pmef","fertiliser","organic","rawMilk","eggs","general"]:
        urls.append({"name": g, "url": "/agrifood/v3/api-docs/" + g})
    for u in urls:
        name, url = u.get("name"), u.get("url")
        try:
            spec = json.loads(get("https://api.tech.ec.europa.eu" + url if url.startswith("/") else url))
            for p, ops in spec.get("paths", {}).items():
                for m, op in ops.items():
                    paths["%s %s" % (m.upper(), p)] = {"group": name, "summary": op.get("summary") or op.get("description"), "params": [(x.get("name"), x.get("required")) for x in op.get("parameters", [])]}
        except Exception as e: log.append("spec %s: %r" % (name, e))
    open(OUT + "/agrifood-paths.json", "w").write(json.dumps(paths, indent=1, ensure_ascii=False))
    log.append("agrifood: %d paths" % len(paths))
except Exception as e: log.append("swagger: %r" % e)
try:
    t = get("https://ec.europa.eu/eurostat/api/dissemination/catalogue/toc/txt?lang=en", 300)
    open(OUT + "/eurostat-toc.txt", "wb").write(t); log.append("toc %d bytes" % len(t))
except Exception as e: log.append("toc: %r" % e)
open(OUT + "/log.txt", "w").write("\n".join(log) + "\n")
