import csv, datetime, io, json, os, re, sys, urllib.parse, urllib.request, zipfile
H = {"User-Agent": "Mozilla/5.0 dehesaindex"}
def out(*a): print(*a, flush=True)
# 1) ERS FIWS state file
PAGE = "https://www.ers.usda.gov/data-products/farm-income-and-wealth-statistics/data-files-u-s-and-state-level-farm-income-and-wealth-statistics"
try:
    page = urllib.request.urlopen(urllib.request.Request(PAGE, headers=H), timeout=120).read().decode("utf-8", "replace")
    rel = []
    for href in set(re.findall(r'href="([^"]+-release[^"]*\.zip)"', page)):
        m = re.search(r"/([a-z]+)-(\d{1,2})-(\d{4})-release", href)
        if m: rel.append((datetime.datetime.strptime("%s %s %s" % m.groups(), "%B %d %Y").date(), href))
    d, href = max(rel); url = urllib.parse.urljoin(PAGE, href); out("ERS release", d, url)
    z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=300).read()))
    out("files", z.namelist())
    name = next(n for n in z.namelist() if n.lower().endswith(".csv"))
    rd = csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8-sig", errors="replace"))
    seen = {}
    for r in rd:
        ds = r.get("VariableDescriptionTotal", "")
        if re.search(r"fertili|lime|chemic|pesticide", ds, re.I):
            k = ds
            seen.setdefault(k, []).append((r.get("State"), r.get("Year"), r.get("Amount")))
    for k, v in seen.items(): out("ERS VAR", k, "filas", len(v), "estados", len({x[0] for x in v}), "anios", sorted({x[1] for x in v})[-3:], "ej", [x for x in v if x[0] in ("IA", "Iowa")][-2:])
    out("cols", list(r.keys()))
except Exception as e: out("ERS FALLO", repr(e))
# 2) NASS Quick Stats
key = os.environ.get("NASS_API_KEY", "")
def qs(path, **p):
    p["key"] = key; p["format"] = "JSON"
    u = "https://quickstats.nass.usda.gov/api/%s?%s" % (path, urllib.parse.urlencode(p))
    try: return json.loads(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=120).read())
    except Exception as e:
        try: return {"error": repr(e), "body": e.read()[:200].decode()}
        except Exception: return {"error": repr(e)}
for p in ("commodity_desc", "statisticcat_desc"):
    j = qs("get_param_values", param=p, source_desc="CENSUS", commodity_desc="FERTILIZER TOTAL, INCL LIME & SOIL CONDITIONERS") if p == "statisticcat_desc" else None
    if j: out("NASS", p, j)
j = qs("api_GET", source_desc="CENSUS", year="2022", agg_level_desc="STATE", commodity_desc="FERTILIZER TOTAL, INCL LIME & SOIL CONDITIONERS")
out("NASS census fert total:", len(j.get("data", [])) if isinstance(j, dict) else j, str(j)[:300] if "data" not in j else "")
for r in j.get("data", [])[:3]: out(" ", {k: r[k] for k in ("state_alpha", "short_desc", "unit_desc", "Value", "year")})
j = qs("get_param_values", param="commodity_desc", source_desc="CENSUS", year="2022")
out("NASS census commodity list with FERT:", [c for c in j.get("commodity_desc", []) if "FERT" in c.upper() or "LIME" in c.upper() or "MANURE" in c.upper()], j.get("error"))
j = qs("get_param_values", param="short_desc", source_desc="SURVEY", sector_desc="ENVIRONMENTAL", commodity_desc="FERTILIZER")
out("NASS survey fert short_desc:", len(j.get("short_desc", [])), j.get("short_desc", [])[:25], j.get("error"))
for sec in ("ECONOMICS", "ENVIRONMENTAL", "CROPS"):
    j = qs("get_param_values", param="commodity_desc", source_desc="SURVEY", sector_desc=sec)
    out("NASS survey", sec, [c for c in j.get("commodity_desc", []) if "FERT" in c.upper()], j.get("error"))
