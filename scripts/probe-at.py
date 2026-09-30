import os, json, urllib.request
os.makedirs('data/probe', exist_ok=True)
A='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
out=[]
for ds,dims in [('apro_mt_lsorg',['unit','animals']),('org_aprod',['unit','agriprod']),('apro_ec_eggorg',['unit']),('org_coptyp',['procstat','operator']),('ef_lus_org',['unit'])]:
    d=json.load(urllib.request.urlopen(urllib.request.Request(A+ds+'?lang=EN&geo=AT&time=2020',headers={'User-Agent':'DehesaIndex'}),timeout=150))
    for k in dims: out.append('%s %s %s'%(ds,k,list(d['dimension'][k]['category']['label'].items())[:30]))
open('data/probe/at4.txt','w').write('\n'.join(out))
