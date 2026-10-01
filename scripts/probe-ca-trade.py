import json, urllib.request, re, sys
W="https://www150.statcan.gc.ca/t1/wds/rest/"
H={"User-Agent":"Dehesa-Index-data-bot/1.0","Content-Type":"application/json"}
out=[]
def p(*a):
    out.append(" ".join(str(x) for x in a)); open("data/probe/ca-trade.txt","w").write("\n".join(out))
try:
    cubes=json.loads(urllib.request.urlopen(urllib.request.Request(W+"getAllCubesListLite",headers=H),timeout=90).read())
    for c in cubes:
        t=c.get("cubeTitleEn","")
        if re.search(r"trade",t,re.I) and re.search(r"commodit|agri|food|HS|merchandise|grain|meat",t,re.I) and c.get("archived")!="1":
            p(c["productId"],c.get("cubeEndDate"),t[:150])
    for pid in (12100011,12100119,12100121,12100099,12100173):
        try:
            r=urllib.request.Request(W+"getCubeMetadata",data=json.dumps([{"productId":pid}]).encode(),headers=H)
            m=json.loads(urllib.request.urlopen(r,timeout=60).read())[0]["object"]
            p("META",pid,m["cubeTitleEn"],m["cubeStartDate"],m["cubeEndDate"],m["frequencyCode"])
            for d in m["dimension"]:
                mem=[x["memberNameEn"] for x in d["member"]]
                p("  DIM",d["dimensionNameEn"],len(mem),mem[:12])
        except Exception as e: p("META",pid,"ERR",e)
except Exception as e: p("ERR",e)
