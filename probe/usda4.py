import urllib.request, urllib.parse, os, json
H={"User-Agent":"Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)","Accept":"application/json"}
OUT="probe/usda-out4"; os.makedirs(OUT,exist_ok=True); rep=[]
B="https://mpr.datamart.ams.usda.gov/services/v1.1/reports/"
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=120).read().decode("utf-8")
for rid in [3355,3354,3345,3351,3357,3352,3462,3353]:
    try:
        t=get(B+str(rid)); d=json.loads(t)
        secs=d.get("reportSections") or []
        rep.append("%s sections %s stats %s"%(rid,secs,d.get("stats")))
        open(OUT+"/%s-index.json"%rid,"w").write(t[:4000])
        for s in secs[:4]:
            try:
                tt=get(B+str(rid)+"/"+urllib.parse.quote(s)); dd=json.loads(tt)
                rs=dd.get("results",[])
                rep.append("  %s/%s rows=%d"%(rid,s,len(rs)))
                open(OUT+"/%s-%s.json"%(rid,s.replace(' ','_').replace('/','_')),"w").write(json.dumps(rs[:3],indent=0)+"\nLAST\n"+json.dumps(rs[-2:],indent=0))
            except Exception as e: rep.append("  ERR %s/%s %r"%(rid,s,str(e)[:80]))
    except Exception as e: rep.append("ERR %s %r"%(rid,str(e)[:100]))
open(OUT+"/report4.txt","w").write("\n".join(rep))
