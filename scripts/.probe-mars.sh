#!/bin/bash
O=scripts/.probe-output.txt
: > $O
B=https://marsapi.ams.usda.gov/services/v1.2/reports
curl -s -m 90 -u "$MARS_API_KEY:" "$B/3511?q=report_begin_date=09/21/2026:09/25/2026&allSections=true" -o /tmp/r.json -w "http %{http_code}\n" >> $O
python3 - >> $O <<'PY'
import json
d=json.load(open('/tmp/r.json'))
print(type(d).__name__, len(d))
secs=d if isinstance(d,list) else [d]
for s in secs:
    print("SECTION",s.get('reportSection'),s.get('stats'))
    r=s.get('results',[])
    if r: print("KEYS",list(r[0].keys()))
    n=0
    for x in r:
        if 'meal' in json.dumps(x).lower() and 'soy' in json.dumps(x).lower():
            print(json.dumps(x)); n+=1
            if n>=12: break
PY
