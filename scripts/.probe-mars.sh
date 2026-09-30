#!/bin/bash
O=scripts/.probe-output.txt
: > $O
B=https://marsapi.ams.usda.gov/services/v1.2/reports
echo "== key set: ${MARS_API_KEY:+yes}" >> $O
curl -s -m 60 -u "$MARS_API_KEY:" "$B" -o /tmp/list.json -w "list http %{http_code}\n" >> $O
python3 - >> $O <<'PY'
import json
try:
    d=json.load(open('/tmp/list.json'))
    r=d if isinstance(d,list) else d.get('results',d)
    print("count",len(r))
    for x in r:
        s=json.dumps(x)
        if '3511' in s or 'meal' in s.lower() or 'soybean' in s.lower(): print(s[:300])
except Exception as e:
    print("ERR",e); print(open('/tmp/list.json').read()[:500])
PY
curl -s -m 60 -u "$MARS_API_KEY:" "$B/3511" -o /tmp/r.json -w "3511 http %{http_code}\n" >> $O
head -c 6000 /tmp/r.json >> $O
