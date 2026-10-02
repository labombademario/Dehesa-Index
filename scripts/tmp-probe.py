import json, os, urllib.request
os.makedirs("tmp-probe", exist_ok=True)
U = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson"
g = json.load(urllib.request.urlopen(U, timeout=120))
out = {}
rep = []
for f in g["features"]:
    p = f["properties"]; a = p.get("adm0_a3")
    if a in ("ESP", "FRA", "DEU", "ITA", "AUS"):
        out.setdefault(a, []).append(f)
        rep.append("%s|%s|%s|%s|%s|%s" % (a, p.get("name"), p.get("region"), p.get("iso_3166_2"), p.get("type_en"), p.get("woe_name")))
open("tmp-probe/admin1-props.txt", "w").write("\n".join(rep))
json.dump(out, open("scripts/ref/ne-admin1-5c.json", "w"), separators=(",", ":"))
