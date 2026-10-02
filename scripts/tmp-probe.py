import json, os, urllib.request
import shapely.geometry as sg
U = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson"
g = json.load(urllib.request.urlopen(U, timeout=180))
out = []
for f in g["features"]:
    p = f["properties"]
    if p.get("adm0_a3") == "AUS":
        s = sg.shape(f["geometry"]).simplify(0.03)
        out.append({"type": "Feature", "geometry": sg.mapping(s), "properties": {k: p.get(k) for k in ("name", "iso_3166_2", "type_en")}})
json.dump({"AUS": out}, open("scripts/ref/ne-admin1-au.json", "w"), separators=(",", ":"))
