#!/bin/bash
O=scripts/.probe-output.txt
: > $O
B=https://marsapi.ams.usda.gov/services/v1.2/reports
curl -s -m 120 -u "$MARS_API_KEY:" "$B/3511?q=report_begin_date=06/01/2026:09/25/2026&allSections=true" -o /tmp/r.json -w "http %{http_code}\n" >> $O
python3 - >> $O <<'PY'
import json,collections
d=json.load(open('/tmp/r.json'))
det=[s for s in d if s.get('reportSection')=='Report Detail'][0]['results']
hd=[s for s in d if s.get('reportSection')=='Report Header'][0]['results']
print("detail rows",len(det),"header rows",len(hd))
print("narratives",[ (h['report_date'],h['report_narrative'],h['special_notes']) for h in hd if h['report_narrative'] or h['special_notes']][:5])
print("commodities",collections.Counter(x['commodity'] for x in det).most_common(30))
sm=[x for x in det if x['commodity']=='Soybean Meal']
print("SBM rows",len(sm))
print("combos",collections.Counter((x['trade Loc'],x['protein'],x['quote_type'],x['sale_type'],x['freight'],x['trans_mode'],x['price_unit']) for x in sm).most_common(60))
by=collections.defaultdict(list)
for x in sm:
    if x['trade Loc'] in('Iowa','Illinois','Minnesota','KC Region'):
        by[x['report_begin_date']].append((x['trade Loc'],x['protein'],x['freight'],x['trans_mode'],x['sale_type'],x['quote_type'],x['price_min'],x['price_max'],x['avg_price']))
for k in sorted(by,key=lambda s:(s[6:],s[:5])): print(k,by[k])
PY
