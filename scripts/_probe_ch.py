import json, urllib.request, urllib.parse, os, re
OUT = "probe-ch"; os.makedirs(OUT, exist_ok=True)
G = "https://lindas.admin.ch/foag/agricultural-market-data"
def sparql(q):
    req = urllib.request.Request("https://lindas.admin.ch/query", data=urllib.parse.urlencode({"query": q}).encode(), headers={"Accept": "application/sparql-results+json", "User-Agent": "DehesaIndex-probe"})
    return json.loads(urllib.request.urlopen(req, timeout=120).read().decode())
cubes = [b["cube"]["value"] for b in json.load(open("probe-ch/cubes.json"))["results"]["bindings"]]
D = "https://agriculture.ld.admin.ch/foag/dimension/"
out = {}
for c in cubes:
    short = c.replace("https://agriculture.ld.admin.ch/foag/cube/", "")
    meas = "price" if "Price" in short else ("quantity" if "Quantity" in short else None)
    q = """PREFIX cube: <https://cube.link/> PREFIX schema: <http://schema.org/>
SELECT ?prod ?sub ?sys ?vc ?unit ?cur ?dm ?src (COUNT(?o) AS ?n) (MIN(?d) AS ?min) (MAX(?d) AS ?max) WHERE { GRAPH <%s> { <%s> cube:observationSet/cube:observation ?o .
 ?o <%sproduct> ?p ; <%sproduct-subgroup> ?ps ; <%sproduct-group> ?pg ; <%sproduct-properties> ?pp ; <%sproduct-origin> ?po ; <%sproduct-subgroup> ?psg; <%sproduct-group> ?pgg ; <%sproduct-properties> ?ppp ; <%sproduct-origin> ?poo ; <%sproduct-subgroup> ?pss; <%sproduct-group> ?pggg ; <%sproduct-properties> ?pppp ; <%sproduct-origin> ?pooo; <%sproduct-subgroup> ?psss ; <%sproduct-group> ?pgggg ; <%sproduct-properties> ?ppppp ; <%sproduct-origin> ?poooo ; <%sproduct-subgroup> ?psssss ; <%sproduct-group> ?pgggggg ; <%sproduct-properties> ?pppppp ; <%sproduct-origin> ?pooooo ; <%sproduct-subgroup> ?x1 .
 } }""" 
    # consulta simple y robusta: sin etiquetas, devolvemos IRIs y etiquetas aparte
    q = """PREFIX cube: <https://cube.link/> PREFIX schema: <http://schema.org/>
SELECT ?p ?s ?v ?u ?cur ?dm (COUNT(?o) AS ?n) (MIN(?d) AS ?min) (MAX(?d) AS ?max) WHERE { GRAPH <%s> { <%s> cube:observationSet/cube:observation ?o .
 ?o <%sproduct> ?p ; <%sproduct-subgroup> ?sg ; <%sproduct-properties> ?pr ; <%sproduct-origin> ?po ; <%sproduct-group> ?pg ; <%sproduct-properties> ?pr2 ; <%sproduct-origin> ?po2 . } } LIMIT 1""" % (G, c, *([D] * 7))
    q = """PREFIX cube: <https://cube.link/>
SELECT ?p ?s ?v ?u ?cur ?dm (COUNT(?o) AS ?n) (MIN(?d) AS ?min) (MAX(?d) AS ?max) WHERE { GRAPH <%s> { <%s> cube:observationSet/cube:observation ?o .
 ?o <%sproduct> ?p ; <%sproduct-subgroup> ?sg ; <%sdate> ?d . OPTIONAL { ?o <%sproduction-system> ?s } OPTIONAL { ?o <%svalue-chain> ?v } OPTIONAL { ?o <%sunit> ?u } OPTIONAL { ?o <%scurrency> ?cur } OPTIONAL { ?o <%sdata-method> ?dm } } } GROUP BY ?p ?s ?v ?u ?cur ?dm ORDER BY ?p""" % (G, c, D, D, D, D, D, D, D, D)
    try:
        r = sparql(q)
        out[short] = [{k: v["value"].replace("https://agriculture.ld.admin.ch/foag/", "") for k, v in b.items()} for b in r["results"]["bindings"]]
        print(short, len(out[short]), "combos")
    except Exception as e:
        out[short] = "ERR " + repr(e); print(short, "ERR", e)
json.dump(out, open("probe-ch/combos.json", "w"), ensure_ascii=False)
# etiquetas: nombres de todos los productos y valores de dimension usados
try:
    r = sparql("""PREFIX schema: <http://schema.org/> SELECT ?i ?n WHERE { GRAPH <https://lindas.admin.ch/foag/agricultural-market-data> { ?i schema:name ?n FILTER(lang(?n)='en' && STRSTARTS(STR(?i),'https://agriculture.ld.admin.ch/foag/') && !STRSTARTS(STR(?i),'https://agriculture.ld.admin.ch/foag/cube')) } } """)
    json.dump([{k: v["value"] for k, v in b.items()} for b in r["results"]["bindings"]], open("probe-ch/labels.json", "w"), ensure_ascii=False)
except Exception as e: open("probe-ch/labels.err", "w").write(repr(e))
