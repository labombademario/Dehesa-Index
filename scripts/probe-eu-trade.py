import urllib.request, json, os
os.makedirs("data/probe", exist_ok=True)
out=[]
def p(*a):
    out.append(" ".join(str(x) for x in a)); open("data/probe/eu-trade.txt","w").write("\n".join(out))
B="https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
def get(u, to=120):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Dehesa-Index-data-bot/1.0"}),timeout=to); return r.status, r.read()
    except Exception as e: return "ERR", repr(e)[:300].encode()
def dims(ds, q):
    s,b=get(B+ds+"?format=JSON&lang=EN&"+q)
    p("==",ds,q,s,len(b))
    if s!=200: p(b[:300]); return
    j=json.loads(b); p("id",j["id"],"size",j["size"])
    for d in j["id"]:
        c=j["dimension"][d]["category"]; lab=c.get("label",{})
        p("  ",d,len(c["index"]),list(lab.items())[:25])
    p("  value count",len(j.get("value",{})))
dims("ext_st_eu27_2020sitc","geo=ES&sinceTimePeriod=2026-06")
dims("ext_lt_intratrd","geo=ES&sinceTimePeriod=2024")
dims("ext_st_27_2020msbec","geo=ES&sinceTimePeriod=2026-06")
dims("ext_lt_maineu","sinceTimePeriod=2024&geo=EU27_2020&partner=US")
