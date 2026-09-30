import os, json, urllib.request
os.makedirs('data/probe', exist_ok=True)
API='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
out=[]
for ds in ['apri_pi20_outq','apri_pi20_inq','apri_ap_crpouta','apri_ap_anouta','apro_mk_colm','apro_mk_pobta','apro_mt_lscatl','apro_mt_lspig','apro_mt_lssheep','apro_mt_pann','apro_cpsh1','org_cropar','apri_ap_ina','apro_ec_poulfa','apro_mk_cola']:
    u=API+ds+'?lang=EN&geo=AT&lastTimePeriod=3'
    try:
        j=json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'DehesaIndex'}),timeout=60))
        out.append('=== %s | %s | updated %s | size %s'%(ds,j.get('label'),j.get('updated'),j.get('size')))
        for d in j['id']:
            c=j['dimension'][d]['category']
            lab=c.get('label',{})
            out.append('  %s (%d): %s'%(d,len(lab),'; '.join('%s=%s'%(k,v) for k,v in list(lab.items())[:60])[:1400]))
        out.append('  values %d'%len(j.get('value',{})))
    except Exception as e:
        out.append('=== %s ERR %s'%(ds,e))
open('data/probe/at20.txt','w').write('\n'.join(out))
