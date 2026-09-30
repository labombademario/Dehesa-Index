#!/bin/bash
O=scripts/.probe-output.txt
: > $O
curl -s -m 120 -u "$MARS_API_KEY:" "https://marsapi.ams.usda.gov/services/v1.2/reports" -o scripts/.mars-list.json -w "http %{http_code}\n" >> $O
python3 - >> $O <<'PY'
import json
d=json.load(open('scripts/.mars-list.json'))
r=d if isinstance(d,list) else d.get('results',d)
print(len(r), list(r[0].keys()))
for x in sorted(r,key=lambda x:int(x['slug_id'])):
    print(x['slug_id'],'|',x.get('report_title'),'|',x.get('report_date'),'|',x.get('office_name') if 'office_name' in x else '','|',len(x.get('markets') or []))
PY
