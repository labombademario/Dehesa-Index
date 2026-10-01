import urllib.request, json, os, time
os.makedirs("data/probe", exist_ok=True)
out=[]
def p(*a):
    out.append(" ".join(str(x) for x in a)); open("data/probe/us-tariff.txt","w").write("\n".join(out))
H={"User-Agent":"Mozilla/5.0 Dehesa-Index-data-bot/1.0","Accept":"application/json"}
def get(u,to=120):
    t=time.time()
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=to); b=r.read(); return r.status,b,time.time()-t
    except Exception as e: return "ERR",repr(e)[:300].encode(),time.time()-t
for u in ("https://hts.usitc.gov/reststop/currentRelease","https://hts.usitc.gov/reststop/releaseList",
          "https://hts.usitc.gov/reststop/search?keyword=wheat",
          "https://hts.usitc.gov/reststop/exportList?from=1001&to=1001&format=JSON&styles=false",
          "https://hts.usitc.gov/reststop/exportList?from=0201&to=0202&format=JSON&styles=false"):
    s,b,dt=get(u); p("==",u,s,len(b),"%.1fs"%dt); p(b[:1500].decode("utf-8","ignore"))
