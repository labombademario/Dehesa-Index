import json,os,base64,urllib.request,urllib.parse,time
K=os.environ['MARS_API_KEY']
H={'Authorization':'Basic '+base64.b64encode((K+':').encode()).decode()}
B='https://marsapi.ams.usda.gov/services/v1.2/reports/'
out=open('scripts/.probe-output.txt','w')
def raw(u):
    for i in range(3):
        try:
            r=urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=150); return r.status,r.read().decode()
        except urllib.error.HTTPError as e:
            last=(e.code,e.read().decode()[:300]); time.sleep(3)
        except Exception as e: last=(0,str(e))
    return last
for i in ['1083','1092']:
    for q in ['report_end_date=09/25/2026','report_date=09/21/2026','published_date=09/23/2026:09/30/2026','report_begin_date=09/21/2026']:
        s,t=raw(B+i+'?q='+urllib.parse.quote(q,safe='=:/'))
        try: d=json.loads(t); n=len(d[0].get('results',[])) if isinstance(d,list) else -1
        except Exception: n=-2
        out.write('%s q=%s http=%s rows=%s %s\n'%(i,q,s,n,t[:150].replace('\n',' ') if n<=0 else ''))
        out.flush()
    s,t=raw(B+i)
    d=json.loads(t); rs=d[0]['results']
    rs=sorted(rs,key=lambda r:(r.get('report_end_date','')[6:]+r.get('report_end_date','')[:5]),reverse=True)
    out.write('%s unfiltered rows=%d newest=%s\n'%(i,len(rs),json.dumps({k:v for k,v in rs[0].items() if v not in(None,'')})[:900]))
    out.flush()
