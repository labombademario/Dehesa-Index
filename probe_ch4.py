import json, urllib.request, urllib.parse, os, re, io, subprocess, sys, site, importlib
subprocess.run([sys.executable,'-m','pip','install','--break-system-packages','--user','-q','openpyxl','xlrd'],check=False); sys.path.append(site.getusersitepackages()); importlib.invalidate_caches()
os.makedirs('probe',exist_ok=True); S=open('probe/summary_ch4.txt','w')
def log(*a): s=' '.join(str(x) for x in a); print(s); S.write(s+'\n'); S.flush()
UA={'User-Agent':'DehesaIndex-research/1.0 (+https://dehesaindex.com)'}
def get(u,t=200):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t) as r: return r.status,r.read()
    except urllib.error.HTTPError as e: return e.code,e.read()[:2000]
    except Exception as e: return 0,repr(e).encode()[:300]
for name in ('produzentenpreisindex-landwirtschaft','einkaufspreisindex-landwirtschaftlicher-produktionsmittel5','aussenhandel-nach-waren5','aussenhandel-nach-ausgewahlten-warengruppen-cpa','produzenten-und-importpreisindex-produzentenpreisindex-ppi-total5'):
    st,b=get('https://opendata.swiss/api/3/action/package_show?id='+name)
    if st!=200: log('PKG',name,st); continue
    p=json.loads(b)['result']; d=p.get('description') or {}
    log('PKG',name,'| issued',p.get('issued'),'| accrual',p.get('accrual_periodicity'),'|',(d.get('de') or d.get('en') or '')[:300].replace('\n',' '))
    done=0
    for r in p['resources']:
        u=r.get('download_url') or r.get('url'); log('   RES',r.get('format'),r.get('rights','').split('#')[-1],(r.get('title') or {}).get('de') if isinstance(r.get('title'),dict) else r.get('title'),u)
        if r.get('format') in ('XLS','XLSX') and u and done<1:
            st2,b2=get(u); log('    get',st2,len(b2))
            if st2!=200: continue
            done+=1; fn='probe/'+name[:40]+('.xlsx' if b2[:2]==b'PK' else '.xls'); open(fn,'wb').write(b2)
S.close()
