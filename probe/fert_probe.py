import json, os, urllib.parse, urllib.request
H = {"User-Agent": "Mozilla/5.0 dehesaindex"}
key = os.environ.get("NASS_API_KEY", "")
def out(*a): print(*a, flush=True)
def qs(path, **p):
    p["key"] = key; p["format"] = "JSON"
    u = "https://quickstats.nass.usda.gov/api/%s?%s" % (path, urllib.parse.urlencode(p))
    try: return json.loads(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=120).read())
    except Exception as e:
        try: return {"error": repr(e), "body": e.read()[:200].decode()}
        except Exception: return {"error": repr(e)}
for com in ("FERTILIZER", "FERTILIZER TOTALS", "FERTILIZER & CHEMICAL TOTALS"):
    j = qs("get_param_values", param="short_desc", source_desc="CENSUS", commodity_desc=com)
    out("CENSUS", com, j.get("short_desc"), j.get("error"))
    j = qs("api_GET", source_desc="CENSUS", agg_level_desc="STATE", state_alpha="IA", commodity_desc=com, year="2022")
    for r in j.get("data", [])[:12]: out("  IA", r["short_desc"], r["domain_desc"], r["Value"], r["unit_desc"])
    out("  err", j.get("error"), j.get("body"))
for src, sec in (("SURVEY", "ECONOMICS"), ("SURVEY", "ENVIRONMENTAL"), ("SURVEY", "CROPS")):
    j = qs("get_param_values", param="group_desc", source_desc=src, sector_desc=sec)
    out(src, sec, "groups", [g for g in j.get("group_desc", []) if "FERT" in g.upper() or "CHEM" in g.upper()], j.get("error"))
j = qs("get_param_values", param="sector_desc", source_desc="SURVEY"); out("sectors", j.get("sector_desc"))
j = qs("get_param_values", param="short_desc", source_desc="SURVEY", commodity_desc="FERTILIZER TOTALS"); out("SURVEY FERT TOTALS short_desc", j.get("short_desc"), j.get("error"))
for yr in ("2023","2024","2025"):
    j = qs("api_GET", source_desc="SURVEY", commodity_desc="CORN", group_desc="FERTILIZER", year=yr, agg_level_desc="STATE")
    out("SURVEY corn FERT group", yr, len(j.get("data", [])), j.get("error"), [ (r["state_alpha"], r["short_desc"], r["Value"]) for r in j.get("data", [])[:4]])
