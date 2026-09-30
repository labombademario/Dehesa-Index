import json,os,base64,urllib.request,urllib.parse
K=os.environ['MARS_API_KEY']
H={'Authorization':'Basic '+base64.b64encode((K+':').encode()).decode()}
B='https://marsapi.ams.usda.gov/services/v1.2/reports/'
out=open('scripts/.probe-output.txt','w')
def raw(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=90); return r.status,r.read().decode()
    except urllib.error.HTTPError as e: return e.code,e.read().decode()[:400]
    except Exception as e: return 0,str(e)
for i in ['1083','1089','1048','1095','1427','1602','1603']:
    for q in ['report_begin_date=09/01/2026:09/30/2026','report_date=09/01/2026:09/30/2026','']:
        u=B+i+('?q='+urllib.parse.quote(q,safe='=:/')+'&allSections=true' if q else '?allSections=true')
        s,t=raw(u); out.write('## %s q=[%s] http=%s len=%d :: %s\n'%(i,q,s,len(t),t[:300].replace('\n',' ')))
    out.flush()
for i in ['2710','2885','3646','2843','2734','2833','1655','3641','2842','2810','2839','3208']:
    s,t=raw(B+i+'?q='+urllib.parse.quote('report_begin_date=09/01/2026:09/30/2026',safe='=:/')+'&allSections=true')
    try: d=json.loads(t)
    except Exception: out.write('## %s bad json %s\n'%(i,t[:200])); continue
    for sec in (d if isinstance(d,list) else [d]):
        n=sec.get('reportSection'); rs=sec.get('results') or []
        if n=='Report Header' or not rs: continue
        out.write('## %s [%s] rows=%d\n   %s\n'%(i,n,len(rs),json.dumps({k:v for k,v in rs[0].items() if v not in (None,'') and k not in('office_name','office_city','office_state','published_date','slug_id','slug_name','report_title','market_type')})[:700]))
        if len(rs)>1: out.write('   %s\n'%json.dumps({k:v for k,v in rs[len(rs)//2].items() if v not in (None,'') and k not in('office_name','office_city','office_state','published_date','slug_id','slug_name','report_title','market_type')})[:500])
    out.flush()
