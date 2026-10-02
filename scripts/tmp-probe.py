import json, os, urllib.request, urllib.parse, re
os.makedirs("tmp-probe", exist_ok=True)
out = []
req = urllib.request.Request('https://ec.europa.eu/eurostat/api/dissemination/catalogue/toc/txt?lang=en', headers={'User-Agent': 'DehesaIndex'})
txt = urllib.request.urlopen(req, timeout=180).read().decode('utf-8', 'replace')
for line in txt.splitlines():
    if re.search(r'\b(agr_r_|ef_r_|apro_.*_r|ef_lsk|ef_m_|ef_ov|ef_pmp|ef_lus)', line) or re.search(r'NUTS ?2|regional', line, re.I) and re.search(r'agri|crop|livestock|farm', line, re.I):
        out.append(line[:230])
open("tmp-probe/eurostat-toc.txt", "w").write("\n".join(out))
