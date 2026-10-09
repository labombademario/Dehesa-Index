import json, urllib.request
B='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
out=[]
def log(*a):
    s=' '.join(str(x) for x in a); print(s); out.append(s); open('probe/probe-log.txt','w').write('\n'.join(out)+'\n')
def get(u): return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'dehesa-index-probe'}),timeout=120).read())
def show(code,q):
    try:
        d=get(B+code+'?format=JSON&lang=en&'+q)
    except Exception as e:
        log('ERR',code,repr(e)[:150]); return
    ids=d['id']; size=d['size']; dim=d['dimension']
    log('==',code,q,'size',dict(zip(ids,size)),'values',len(d.get('value',{})))
    for k in ids:
        c=dim[k]['category']; lab=c.get('label',{})
        if len(lab)<=40: log('  ',k,{a:lab[a] for a in lab})
        else: log('  ',k,len(lab),'labels')
    st=[1]*len(ids)
    for i in range(len(ids)-2,-1,-1): st[i]=st[i+1]*size[i+1]
    inv={k:{v:c for c,v in dim[k]['category']['index'].items()} for k in ids}
    ex={}
    for pos,val in d.get('value',{}).items():
        p=int(pos); ix=[(p//st[i])%size[i] for i in range(len(ids))]
        key=tuple(inv[ids[i]][ix[i]] for i in range(len(ids)) if ids[i]!='time')
        ex.setdefault(key,[]).append(inv['time'][ix[ids.index('time')]]+'='+str(val))
    for k,v in list(ex.items())[:25]: log('   ',k,v[-4:])
G='&'.join('geo='+g for g in ['EL','FI','IE','DE'])
show('apro_ec_eggcon',G+'&sinceTimePeriod=2018')
show('apri_pi_inq',G+'&unit=I20&sinceTimePeriod=2025-Q1')
show('apri_pi20_inq',G+'&sinceTimePeriod=2025-Q1')
show('apri_pi15_inq',G+'&sinceTimePeriod=2024-Q1')
show('apri_pi_outq',G+'&unit=I20&sinceTimePeriod=2026-Q1')
