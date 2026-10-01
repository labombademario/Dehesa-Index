import json, urllib.request, re, sys
W="https://www150.statcan.gc.ca/t1/wds/rest/"
H={"User-Agent":"Dehesa-Index-data-bot/1.0","Content-Type":"application/json"}
import os; os.makedirs("data/probe",exist_ok=True)
out=[]
def p(*a):
    out.append(" ".join(str(x) for x in a)); open("data/probe/ca-trade.txt","w").write("\n".join(out))
try:
    for pid in (12100163,12100011):
        r=urllib.request.Request(W+"getCubeMetadata",data=json.dumps([{"productId":pid}]).encode(),headers=H)
        m=json.loads(urllib.request.urlopen(r,timeout=60).read())[0]["object"]
        p("META",pid,m["cubeTitleEn"],m["cubeStartDate"],m["cubeEndDate"])
        for d in m["dimension"]:
            p("  DIM",d["dimensionNameEn"],len(d["member"]))
            if len(d["member"])>2 and len(d["member"])<400:
                for x in d["member"]: p("     ",x["memberId"],x["memberNameEn"],"| parent",x.get("parentMemberId"))
except Exception as e: p("ERR",e)
