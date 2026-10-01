import urllib.request, json, os, time, re
os.makedirs("data/probe", exist_ok=True)
out=[]
def p(*a):
    out.append(" ".join(str(x) for x in a)); open("data/probe/au-trade.txt","w").write("\n".join(out))
B="https://data.api.abs.gov.au/rest/"
def get(u, acc="application/vnd.sdmx.structure+json", to=120):
    try:
        r=urllib.request.urlopen(urllib.request.Request(B+u,headers={"Accept":acc,"User-Agent":"Dehesa-Index-data-bot/1.0"}),timeout=to); return r.read().decode("utf-8","ignore")
    except Exception as e: return "ERR "+repr(e)[:300]
s=get("dataflow/ABS?detail=allcompletestubs")
try:
    j=json.loads(s)
    for d in j["data"]["dataflows"]:
        if re.search(r"MERCH|TRADE|IMP|EXP|ITPI",d["id"]+d.get("name",""),re.I): p("DF",d["id"],d.get("name"))
except Exception as e: p("DFERR",s[:300])
for df in ("MERCH_EXP","MERCH_IMP"):
    s=get("datastructure/ABS/%s?references=descendants&detail=full"%df)
    p("==",df,len(s),s[:200] if s.startswith("ERR") else "")
    try:
        j=json.loads(s)
        for cl in j["data"]["codelists"]:
            p(" CL",cl["id"],len(cl["codes"]),[(c["id"],c["name"]) for c in cl["codes"]][:14])
        for ds in j["data"]["dataStructures"]:
            p(" DIMS",[d["id"] for d in ds["dataStructureComponents"]["dimensionList"]["dimensions"]])
    except Exception as e: p(" parse",repr(e)[:100])
for q in ("MERCH_IMP/all?startPeriod=2026-01&lastNObservations=1&format=csvfilewithlabels",):
    s=get(q,acc="application/vnd.sdmx.data+csv"); p("DATA",q,len(s),s[:600])
