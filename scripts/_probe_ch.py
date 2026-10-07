import json, urllib.request, urllib.parse, sys, os
OUT = "probe-ch"; os.makedirs(OUT, exist_ok=True)
def sparql(q, name):
    req = urllib.request.Request("https://lindas.admin.ch/query", data=urllib.parse.urlencode({"query": q}).encode(), headers={"Accept": "application/sparql-results+json", "User-Agent": "DehesaIndex-probe"})
    try:
        r = urllib.request.urlopen(req, timeout=90).read().decode()
        open(f"{OUT}/{name}.json", "w").write(r); print(name, "OK", len(r))
        return json.loads(r)
    except Exception as e:
        open(f"{OUT}/{name}.err", "w").write(repr(e)); print(name, "ERR", e); return None
G = "https://lindas.admin.ch/foag/agricultural-market-data"
r = sparql("""PREFIX cube: <https://cube.link/> PREFIX schema: <http://schema.org/>
SELECT ?cube ?title ?modified WHERE { GRAPH <%s> { ?cube a cube:Cube ; schema:name ?title . OPTIONAL { ?cube schema:dateModified ?modified } FILTER(lang(?title)='en' || lang(?title)='') } } ORDER BY ?title""" % G, "cubes")
if r:
    cubes = [b["cube"]["value"] for b in r["results"]["bindings"]]
    print(len(cubes), "cubes")
    # observaciones del primer cubo de leche y huevos como muestra
    for i, c in enumerate(cubes[:400]):
        pass
    sparql("""PREFIX cube: <https://cube.link/> PREFIX schema: <http://schema.org/>
SELECT ?cube ?dim ?dimname WHERE { GRAPH <%s> { ?cube cube:observationConstraint/<http://www.w3.org/ns/shacl#property> ?p . ?p <http://www.w3.org/ns/shacl#path> ?dim . OPTIONAL { ?p schema:name ?dimname FILTER(lang(?dimname)='en') } } }""" % G, "dims")
for u, n in (("https://www.pxweb.bfs.admin.ch/api/v1/en", "bfs_root"), ("https://www.agrarmarktdaten.ch", "agrarmarktdaten"), ("https://data.geo.admin.ch", "geoadmin"), ("https://opendata.swiss/api/3/action/package_search?q=marktzahlen&rows=100", "ckan_search")):
    try:
        b = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "DehesaIndex-probe"}), timeout=60).read()
        open(f"{OUT}/{n}.txt", "wb").write(b[:300000]); print(n, "OK", len(b))
    except Exception as e:
        open(f"{OUT}/{n}.err", "w").write(repr(e)); print(n, "ERR", e)
