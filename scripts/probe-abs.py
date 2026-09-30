import sys,json
try:
    d=json.load(sys.stdin)
    for f in d['data']['dataflows']:
        n=f.get('name','')
        if any(k in n.lower() for k in ['agri','crop','livestock','farm','commodit','export','trade in goods','price']): print(f['id'],n)
except Exception as e:
    print('ERR',e)
