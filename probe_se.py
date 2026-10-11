import json, urllib.request, os
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'DehesaIndex/1.0'}), timeout=60) as r: return json.loads(r.read())
    except Exception as e: return {'error': str(e)}
out = {}
def walk(base, path, depth, key):
    j = get(base + path)
    if isinstance(j, dict): out[key + ':' + path] = j; return
    for e in j:
        out.setdefault(key, []).append([path + '/' + e['id'], e.get('text'), e.get('type')])
        if e['type'] == 'l' and depth > 0: walk(base, path + '/' + e['id'], depth - 1, key)
for lang in ('en',):
    walk('https://api.scb.se/OV0104/v1/doris/%s/ssd' % lang, '/JO', 3, 'scb')
for u in ('https://statistik.sjv.se/PXWeb/api/v1/sv/Jordbruksverkets%20statistikdatabas',):
    walk(u, '', 3, 'sjv')
os.makedirs('probe_se', exist_ok=True)
json.dump(out, open('probe_se/tree.json', 'w'), ensure_ascii=False, indent=0)
print({k: len(v) for k, v in out.items()})
