import os, urllib.request, re, json, io, zipfile
os.makedirs("tmp-probe", exist_ok=True); os.makedirs("scripts/ref", exist_ok=True)
from shapely.geometry import shape, mapping
log = []
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
def raw(u):
    r = urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=180); return r.read()
B = "https://agriculture.canada.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/geoJSON/areasofDrought/"
try:
    z = zipfile.ZipFile(io.BytesIO(raw(B + "2026/cdm_2608_drought_areas_json.zip")))
    log.append("zip: %s" % [(i.filename, i.file_size) for i in z.infolist()])
    for n in z.namelist():
        d = json.loads(z.read(n)); fs = d["features"]
        g = [shape(f["geometry"]) for f in fs]
        from shapely.ops import unary_union
        u = unary_union([x.buffer(0) for x in g])
        log.append("%s keys=%s crs=%s nfeat=%d props0=%s bounds=%s area_deg2=%.1f" % (n, list(d), d.get("crs"), len(fs), fs[0]["properties"] if fs else None, [round(v, 2) for v in u.bounds], u.area))
    # fixture: ventana de las praderas (-112..-100, 49..53) simplificada
    from shapely.geometry import box
    import math
    R = 6378137.0; mx = lambda lo: math.radians(lo) * R; my = lambda la: math.log(math.tan(math.pi / 4 + math.radians(la) / 2)) * R
    win = box(mx(-112), my(49), mx(-100), my(53)); fx = {"type": "FeatureCollection", "files": {}}
    for n in z.namelist():
        d = json.loads(z.read(n)); out = []
        for f in d["features"]:
            gg = shape(f["geometry"]).buffer(0).intersection(win).simplify(1500)
            if not gg.is_empty: out.append({"type": "Feature", "properties": f["properties"], "geometry": mapping(gg)})
        fx["files"][n] = {"type": "FeatureCollection", "features": out}
    s = json.dumps(fx, separators=(",", ":")); log.append("fixture json %d bytes" % len(s))
    import gzip; open("scripts/fixtures/cdm-2608-window.json.gz", "wb").write(gzip.compress(s.encode(), 9))
except Exception as e:
    import traceback; log.append("ERR " + traceback.format_exc())
open("tmp-probe/run18.txt", "w").write("\n".join(log))
