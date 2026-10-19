import urllib.request, json, os
os.makedirs("probe/land-out", exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
A = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=180).read()
Q = {
 "irri_pt.json": "ef_mp_irri?lang=EN&geo=PT&geo=PT1C&geo=PT19&geo=PT1A&geo=PT16&geo=PT18&geo=PT11",
 "irri_all.json": "ef_mp_irri?lang=EN&statinfo=TOTAL&irrmeth=TOTAL&wat_src=TOTAL&irr_area=UAA_IT&unit=HA",
 "lus_pt.json": "ef_lus_main?lang=EN&geo=PT&geo=PT1C&geo=PT19&geo=PT18&geo=PT16&unit=HA&farmtype=TOTAL&so_eur=TOTAL&uaarea=TOTAL&statinfo=TOTAL",
 "lus_all.json": "ef_lus_main?lang=EN&crops=UAA&crops=FA&unit=HA&farmtype=TOTAL&so_eur=TOTAL&uaarea=TOTAL&statinfo=TOTAL",
}
for n, q in Q.items():
    try:
        b = get(A + q); open("probe/land-out/" + n, "wb").write(b); print(n, len(b))
    except Exception as e: print(n, "ERROR", str(e)[:200])
