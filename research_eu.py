import os, json, re, urllib.request, urllib.parse, ssl, time
os.makedirs('research_out', exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndexProbe/1.0; +https://dehesaindex.com)'}
log = []
def get(name, url, rng=None, keep=400000, timeout=60):
    h = dict(UA)
    if rng: h['Range'] = 'bytes=0-%d' % rng
    t = time.time()
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=timeout)
        b = r.read(keep)
        log.append({'name': name, 'url': url, 'status': r.status, 'bytes': len(b), 'ctype': r.headers.get('Content-Type'), 'len': r.headers.get('Content-Length'), 'lm': r.headers.get('Last-Modified')})
        open('research_out/%s.bin' % name, 'wb').write(b)
        return b
    except Exception as e:
        log.append({'name': name, 'url': url, 'error': str(e)[:200]})
        return b''
q = urllib.parse.quote
# VigiEau CSVs
base = 'https://static.data.gouv.fr/resources/donnee-secheresse-vigieau/'
get('vg_restrictions_head', base + '20260915-040258/restrictions.csv', 60000, 60000)
get('vg_arretes_head', base + '20260915-040006/arretes.csv', 40000, 40000)
get('vg_guide', base + '20240426-071653/restriction-guide-secheresse.csv', 20000, 20000)
get('vg_arretes_cadre_head', base + '20260915-040104/arretes-cadre.csv', 30000, 30000)
get('vg_zones_api', 'https://api.vigieau.beta.gouv.fr/api/zones?profil=exploitation&lon=2.35&lat=48.85')
get('vg_api_ref', 'https://api.vigieau.beta.gouv.fr/api/reglementation?lon=2.35&lat=48.85&profil=exploitation')
get('vg_api_stats', 'https://api.vigieau.beta.gouv.fr/api/statistiques')
get('vg_api_zonesall', 'https://api.vigieau.beta.gouv.fr/api/zones')
# Cere'Obs listing
get('co_listing', 'https://visionet.franceagrimer.fr/Pages/SeriesChronologiques.aspx?menuurl=SeriesChronologiques%2Fproductions%20vegetales%2Fgrandes%20cultures%2Fetats%20des%20cultures')
for code in ['BT', 'BD', 'O', 'OH', 'OP', 'B', 'BLE', 'ORGE']:
    u = 'https://visionet.franceagrimer.fr/Pages/OpenDocument.aspx?fileurl=SeriesChronologiques%2fproductions%20vegetales%2fgrandes%20cultures%2fetats%20des%20cultures%2fSCR-GRC-CEREOBS_' + code + '_depuis_2015-A26.xlsx&telechargersanscomptage=oui'
    get('co_guess_' + code, u, 3000, 3000)
get('dg_cereobs_q1', 'https://www.data.gouv.fr/api/1/datasets/?q=cereobs&page_size=20')
get('dg_cereobs_org', 'https://www.data.gouv.fr/api/1/datasets/?organization=534fff8ea3a7292c64a77f02&page_size=100')
get('dg_cereobs_q2', 'https://www.data.gouv.fr/api/1/datasets/?q=%C3%A9tat%20des%20cultures&page_size=20')
# Agreste
for n, u in [
  ('ag_home', 'https://agreste.agriculture.gouv.fr/agreste-web/'),
  ('ag_disaron', 'https://agreste.agriculture.gouv.fr/agreste-web/disaron/'),
  ('ag_methadon', 'https://agreste.agriculture.gouv.fr/agreste-web/methadon/'),
  ('ag_stats_home', 'https://stats.agriculture.gouv.fr/'),
  ('ag_stats_disaron', 'https://stats.agriculture.gouv.fr/disaron-web/'),
  ('ag_saa', 'https://agreste.agriculture.gouv.fr/agreste-web/download/service/SAA/'),
  ('ag_agri_gouv', 'https://agriculture.gouv.fr/mot-cle/agreste'),
  ('ag_dg_org', 'https://www.data.gouv.fr/api/1/organizations/?q=agriculture&page_size=10'),
  ('ag_dg_q1', 'https://www.data.gouv.fr/api/1/datasets/?q=agreste&page_size=30'),
  ('ag_dg_q2', 'https://www.data.gouv.fr/api/1/datasets/?q=statistique%20agricole%20annuelle&page_size=20'),
  ('ag_dg_q3', 'https://www.data.gouv.fr/api/1/datasets/?q=cheptel%20departement&page_size=20'),
  ('ag_dg_q4', 'https://www.data.gouv.fr/api/1/datasets/?q=superficie%20rendement%20production%20departement&page_size=20'),
  ('ag_dg_q5', 'https://www.data.gouv.fr/api/1/datasets/?q=recensement%20agricole&page_size=20'),
  ('ag_asp', 'https://www.asp-public.fr/'),
]:
    get(n, u, None, 300000)
json.dump(log, open('research_out/_log7.json', 'w'), indent=1)
print(len(log))
