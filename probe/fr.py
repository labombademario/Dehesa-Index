import json, re, os, urllib.request, urllib.parse
os.makedirs("probe/fr-out", exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0)"}
def get(u, t=90):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read(), r.headers.get("content-type", "")
    except Exception as e: return None, str(e)[:150]
out = {}
b, ct = get("https://www.data.gouv.fr/api/1/datasets/agreste-valeur-venale-des-terres/")
res = json.loads(b).get("resources", []) if b else []
out["resources"] = [{"title": r.get("title"), "url": r.get("url"), "fmt": r.get("format"), "size": r.get("filesize")} for r in res]
for i, r in enumerate(res[:12]):
    u = r.get("url") or ""; b, ct = get(u)
    rec = {"url": u, "type": ct, "bytes": len(b) if b else 0}
    if b:
        t = b.decode("utf-8", "ignore").lower()
        rec["irrig_hits"] = len(re.findall("irrig|arros|regad", t)); rec["secano_hits"] = len(re.findall("sec ", t))
        open("probe/fr-out/r%d.bin" % i, "wb").write(b[:400000])
        rec["head"] = t[:400]
    out["r%d" % i] = rec
for k, u in (("disaron", "https://agreste.agriculture.gouv.fr/agreste-web/disaron/venale/745fcc0d-4e89-4a99-b151-835d2a9be2df/search/"),
             ("rica_irrig", "https://www.data.gouv.fr/api/1/datasets/?q=irrigation+terres+prix&page_size=10")):
    b, ct = get(u); rec = {"bytes": len(b) if b else 0, "type": ct}
    if b: t = b.decode("utf-8", "ignore"); rec["irrig_hits"] = len(re.findall("(?i)irrig", t)); open("probe/fr-out/%s.txt" % k, "w").write(t[:200000])
    out[k] = rec
json.dump(out, open("probe/fr-out/summary.json", "w"), ensure_ascii=False, indent=1)
