#!/usr/bin/env python3
"""Ediciones del blog semanal (data/blog/editions/<AAAA-Www>.json): UN solo archivo editorial por semana, derivado de data/blog/weekly/<semana>.json.
Cada edicion lleva, en es/en/fr/it: titulo, extracto, articulo en Markdown limpio y version corta para newsletter; fuentes (medio + enlace al titular
original), URL canonica en dehesaindex.com y estado editorial. Substack es solo distribucion: aqui NO se publica nada.
Reglas: sin LLM ni prosa inventada (el texto sale de las cifras y de los titulares ya archivados, igual que la web); toda edicion nace DRAFT y solo una
persona la pasa a APPROVED editando el fichero (reviewedBy/reviewedAt); una edicion que ya no es DRAFT no se vuelve a tocar. Solo semanas completas.
Uso: python3 scripts/build-blog-editions.py [--check]"""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; W = ROOT / 'data' / 'blog' / 'weekly'; OUT = ROOT / 'data' / 'blog' / 'editions'
SITE = 'https://dehesaindex.com'
LANGS = ('es', 'en', 'fr', 'it')
MONTH = {'es': 'ene feb mar abr may jun jul ago sep oct nov dic', 'en': 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec', 'fr': 'janv. févr. mars avr. mai juin juil. août sept. oct. nov. déc.', 'it': 'gen feb mar apr mag giu lug ago set ott nov dic'}
T = {
  'es': {'title': 'Resumen semanal: del {a} al {b}', 'intro': 'Dehesa Index recogió {n} noticias de {m} medios. Los temas más frecuentes fueron {t1} ({n1}) y {t2} ({n2}); por región, {r1} reunió {p1} % de las noticias.', 'intro1': 'Dehesa Index recogió {n} noticias de {m} medios. El tema más frecuente fue {t1} ({n1}); por región, {r1} reunió {p1} % de las noticias.',
         'top': 'Titulares más relevantes', 'reg': 'Por región', 'cov': 'Cobertura desde el {d}: antes de esa fecha todavía no archivábamos las noticias.', 'more': 'Resumen completo con todas las regiones', 'sources': 'Fuentes',
         'note': 'Resumen automático: cuenta y enlaza los titulares que Dehesa Index ha recogido; no los reescribe ni los verifica. Cada titular va en el idioma del medio. La relevancia es la puntuación de nuestro clasificador, no un juicio editorial.'},
  'en': {'title': 'Weekly digest: {a} to {b}', 'intro': 'Dehesa Index collected {n} news items from {m} outlets. The most frequent topics were {t1} ({n1}) and {t2} ({n2}); by region, {r1} accounted for {p1}% of the items.', 'intro1': 'Dehesa Index collected {n} news items from {m} outlets. The most frequent topic was {t1} ({n1}); by region, {r1} accounted for {p1}% of the items.',
         'top': 'Most relevant headlines', 'reg': 'By region', 'cov': 'Coverage from {d}: before that date we were not yet archiving the news.', 'more': 'Full digest with every region', 'sources': 'Sources',
         'note': 'Automatic digest: it counts and links the headlines Dehesa Index collected; it does not rewrite or verify them. Each headline is in the outlet’s language. Relevance is our classifier’s score, not an editorial judgement.'},
  'fr': {'title': 'Résumé hebdomadaire : du {a} au {b}', 'intro': 'Dehesa Index a collecté {n} actualités de {m} médias. Les sujets les plus fréquents : {t1} ({n1}) et {t2} ({n2}) ; par région, {r1} représente {p1} % des actualités.', 'intro1': 'Dehesa Index a collecté {n} actualités de {m} médias. Le sujet le plus fréquent : {t1} ({n1}) ; par région, {r1} représente {p1} % des actualités.',
         'top': 'Titres les plus pertinents', 'reg': 'Par région', 'cov': 'Couverture depuis le {d} : avant cette date nous n’archivions pas encore les actualités.', 'more': 'Résumé complet avec toutes les régions', 'sources': 'Sources',
         'note': 'Résumé automatique : il compte et relie les titres collectés par Dehesa Index ; il ne les réécrit ni ne les vérifie. Chaque titre est dans la langue du média. La pertinence est le score de notre classificateur, pas un jugement éditorial.'},
  'it': {'title': 'Riepilogo settimanale: dal {a} al {b}', 'intro': 'Dehesa Index ha raccolto {n} notizie da {m} testate. I temi più frequenti: {t1} ({n1}) e {t2} ({n2}); per regione, {r1} rappresenta il {p1} % delle notizie.', 'intro1': 'Dehesa Index ha raccolto {n} notizie da {m} testate. Il tema più frequente: {t1} ({n1}); per regione, {r1} rappresenta il {p1} % delle notizie.',
         'top': 'Titoli più rilevanti', 'reg': 'Per regione', 'cov': 'Copertura dal {d}: prima di quella data non archiviavamo ancora le notizie.', 'more': 'Riepilogo completo con tutte le regioni', 'sources': 'Fonti',
         'note': 'Riepilogo automatico: conta e collega i titoli raccolti da Dehesa Index; non li riscrive né li verifica. Ogni titolo è nella lingua della testata. La rilevanza è il punteggio del nostro classificatore, non un giudizio editoriale.'}}
REG = {'us': {'es': 'EE. UU.', 'en': 'United States', 'fr': 'États-Unis', 'it': 'Stati Uniti'}, 'ca': {'es': 'Canadá', 'en': 'Canada', 'fr': 'Canada', 'it': 'Canada'}, 'uk': {'es': 'Reino Unido', 'en': 'United Kingdom', 'fr': 'Royaume-Uni', 'it': 'Regno Unito'},
       'eu': {'es': 'Europa', 'en': 'Europe', 'fr': 'Europe', 'it': 'Europa'}, 'global': {'es': 'Mundo', 'en': 'World', 'fr': 'Monde', 'it': 'Mondo'}}
TOP = {'es': dict(clima='Clima', costes='Costes', comercio='Comercio', politica='Política agraria', oferta='Oferta y cosecha', tecnologia='Tecnología', energia='Energía', ayudas='Ayudas', precios='Precios y mercado', sanidad='Sanidad animal'),
       'en': dict(clima='Weather', costes='Costs', comercio='Trade', politica='Agricultural policy', oferta='Supply & harvest', tecnologia='Technology', energia='Energy', ayudas='Support & aid', precios='Prices & markets', sanidad='Animal health'),
       'fr': dict(clima='Climat', costes='Coûts', comercio='Commerce', politica='Politique agricole', oferta='Offre & récolte', tecnologia='Technologie', energia='Énergie', ayudas='Aides', precios='Prix et marchés', sanidad='Santé animale'),
       'it': dict(clima='Clima', costes='Costi', comercio='Commercio', politica='Politica agricola', oferta='Offerta e raccolto', tecnologia='Tecnologia', energia='Energia', ayudas='Aiuti', precios='Prezzi e mercati', sanidad='Sanità animale')}
def fill(s, o): return s.format(**o)
def dfmt(iso, lg, year=False):
    y, m, d = (int(x) for x in iso.split('-')); mn = MONTH[lg].split()[m - 1]
    return ('%d %s %d' % (d, mn, y)) if year else ('%d %s' % (d, mn))
def srt(o): return sorted(o.items(), key=lambda kv: (-kv[1], kv[0]))
def clean(s): return ' '.join(str(s).replace('\n', ' ').replace('[', '(').replace(']', ')').split())
def md_item(h, lg): return '- [%s](%s) — %s, %s' % (clean(h['h']), h['url'], clean(h['source']), dfmt(h['date'], lg))
def build_lang(w, lg, canon):
    t, tt = T[lg], w['totals']; th, rg = srt(tt['byTopic']), srt(tt['byRegion'])
    tn = lambda k: TOP[lg].get(k, k).lower()
    intro = fill(t['intro'] if len(th) > 1 else t['intro1'], {'n': tt['items'], 'm': tt['sources'], 't1': tn(th[0][0]), 'n1': th[0][1], 't2': tn(th[1][0]) if len(th) > 1 else '', 'n2': th[1][1] if len(th) > 1 else '', 'r1': REG[rg[0][0]][lg] if rg[0][0] in REG else rg[0][0], 'p1': round(rg[0][1] / tt['items'] * 100)})
    title = fill(t['title'], {'a': dfmt(w['from'], lg), 'b': dfmt(w['to'], lg, True)})
    cov = fill(t['cov'], {'d': dfmt(w['coverage']['from'], lg, True)}) if w['coverage']['from'] > w['from'] else ''
    art = ['# ' + title, '', intro, ''] + ([cov, ''] if cov else []) + ['## ' + t['top'], ''] + [md_item(h, lg) for h in w['top']] + ['']
    for r, n in rg:
        if w['byRegion'].get(r): art += ['## %s (%d)' % (REG[r][lg] if r in REG else r, n), ''] + [md_item(h, lg) for h in w['byRegion'][r]] + ['']
    art += ['---', '', t['note'], '']
    nl = ['# ' + title, '', intro, ''] + ([cov, ''] if cov else []) + ['## ' + t['top'], ''] + [md_item(h, lg) for h in w['top'][:5]] + ['', '[%s](%s)' % (t['more'], canon), '']
    return {'title': title, 'excerpt': intro, 'markdown': '\n'.join(art), 'newsletterMarkdown': '\n'.join(nl)}
def edition(w):
    canon = '%s/blog.html#%s' % (SITE, w['week'])
    seen, srcs = set(), []
    for h in w['top'] + [x for r in w['byRegion'].values() for x in r]:
        if h['url'] in seen: continue
        seen.add(h['url']); srcs.append({'source': h['source'], 'headline': clean(h['h']), 'url': h['url']})
    return {'schemaVersion': 1, 'week': w['week'], 'from': w['from'], 'to': w['to'], 'status': 'DRAFT', 'canonicalUrl': canon,
            'editorial': {'reviewedBy': None, 'reviewedAt': None},
            'distribution': {'substack': {'state': 'NOT_PUBLISHED', 'url': None, 'note': 'La distribucion en Substack es manual y posterior a la revision; el canonico es Dehesa Index.'}},
            'derivedFrom': 'data/blog/weekly/%s.json' % w['week'], 'languages': {lg: build_lang(w, lg, canon) for lg in LANGS}, 'sources': srcs}
def main():
    OUT.mkdir(parents=True, exist_ok=True); made = skipped = 0; bad = []
    for f in sorted(W.glob('20*.json')):
        w = json.loads(f.read_text(encoding='utf-8'))
        if not w.get('complete'): continue
        p = OUT / (w['week'] + '.json'); ed = edition(w)
        if p.exists():
            old = json.loads(p.read_text(encoding='utf-8'))
            if old.get('status') != 'DRAFT': skipped += 1; continue      # ya revisada por una persona: no se toca
            if {k: v for k, v in old.items() if k != 'status'} == {k: v for k, v in ed.items() if k != 'status'}: continue
            ed['editorial'] = old.get('editorial', ed['editorial'])
        if '--check' in sys.argv: bad.append(w['week']); continue
        p.write_text(json.dumps(ed, ensure_ascii=False, indent=1) + '\n', encoding='utf-8'); made += 1
    if '--check' in sys.argv:
        if bad: print('ediciones desactualizadas:', bad); sys.exit(1)
        print('ediciones OK'); return
    print('ediciones: %d escritas, %d ya revisadas (intactas)' % (made, skipped))
main()
