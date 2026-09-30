import json,os,base64,urllib.request,urllib.parse,time
K=os.environ['MARS_API_KEY']
H={'Authorization':'Basic '+base64.b64encode((K+':').encode()).decode()}
B='https://marsapi.ams.usda.gov/services/v1.2/reports/'
out=open('scripts/.probe-output.txt','w')
def raw(u):
    for i in range(3):
        try:
            r=urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=100); return r.status,r.read().decode()
        except urllib.error.HTTPError as e:
            last=(e.code,e.read().decode()[:300]); time.sleep(3)
        except Exception as e: last=(0,str(e))
    return last
def rows(i,q):
    s,t=raw(B+i+'?q='+urllib.parse.quote(q,safe='=:/')+'&allSections=true')
    if s!=200: return s,t[:200]
    d=json.loads(t); return s,d
for i,q in [('1048','report_begin_date=09/01/2026:09/30/2026'),('1602','report_begin_date=09/01/2026:09/30/2026'),('1603','report_begin_date=09/28/2026:09/30/2026'),('1092','report_begin_date=07/01/2026:09/30/2026'),('1083','report_begin_date=01/01/2026:09/30/2026'),('1083','report_begin_date=09/22/2026:09/26/2026'),('3486','report_begin_date=09/20/2026:09/30/2026'),('2842','report_begin_date=09/01/2026:09/30/2026'),('3046','report_begin_date=09/25/2026:09/30/2026'),('1655','report_begin_date=09/20/2026:09/30/2026'),('2887','report_begin_date=09/28/2026:09/30/2026'),('3804','report_begin_date=09/25/2026:09/30/2026'),('2810','report_begin_date=09/14/2026:09/30/2026'),('2914','report_begin_date=09/20/2026:09/30/2026')]:
    s,d=rows(i,q)
    out.write('#### %s %s http=%s\n'%(i,q,s))
    if s!=200: out.write(str(d)+'\n'); out.flush(); continue
    for sec in d:
        rs=sec.get('results') or []
        out.write('  [%s] rows=%d\n'%(sec.get('reportSection'),len(rs)))
        for r in rs[:2]:
            out.write('    '+json.dumps({k:v for k,v in r.items() if v not in (None,'') and k not in('office_name','office_city','office_state','office_code','slug_id','slug_name','report_title','market_type')})[:900]+'\n')
    out.flush()
