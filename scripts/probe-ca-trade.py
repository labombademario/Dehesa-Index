import urllib.request, json, os
os.makedirs("data/probe", exist_ok=True)
out=[]
def p(*a):
    out.append(" ".join(str(x) for x in a)); open("data/probe/ca-trade.txt","w").write("\n".join(out))
W="https://www150.statcan.gc.ca/t1/wds/rest/"; H={"User-Agent":"Dehesa-Index-data-bot/1.0","Content-Type":"application/json"}
for pid in (12100175,12100174):
    try:
        m=json.loads(urllib.request.urlopen(urllib.request.Request(W+"getCubeMetadata",data=json.dumps([{"productId":pid}]).encode(),headers=H),timeout=60).read())[0]["object"]
        p("META",pid,m["cubeTitleEn"],m["cubeStartDate"],m["cubeEndDate"],m["frequencyCode"])
        for d in m["dimension"]:
            mem=d["member"]; p("  DIM",d["dimensionPositionId"],d["dimensionNameEn"],len(mem),[(x["memberId"],x["memberNameEn"][:60]) for x in mem][:45])
    except Exception as e: p("ERR",pid,e)
