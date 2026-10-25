#!/usr/bin/env python3
"""data/cap/index.json: contrato comun de la PAC por pais (PAC 2.0) y vigilancia de cambios (PAC Watch).
Solo LEE ficheros ya validados de data/cap/<CC>/ y declara, componente a componente, que hay y que no hay. No inventa nada:
un componente sin fuente oficial ingerida sale NOT_INGESTED con la razon. Los plazos son las fechas generales de la norma (las comunidades pueden
modificarlas: se copia el aviso). Sin consejo juridico ni calculo de ayudas individuales.
Eventos PAC Watch: RULE_CHANGED (reviewNeeded de las huellas del texto oficial), AMOUNT_CHANGED (registro de cambios de importes),
DEADLINE_APPROACHING (plazos proximos; el navegador decide la ventana con daysTo), NEW_RULE (no detectable hoy: ver eventTypes).
Uso: python3 scripts/build-cap-index.py [--check]"""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data' / 'cap'
OUT = D / 'index.json'
COMPONENTS = ['strategicPlan', 'interventions', 'amounts', 'rules', 'importantDates', 'watch']
def J(p, default=None):
    try: return json.loads((D / p).read_text(encoding='utf-8'))
    except Exception: return default
def comp(state, file=None, reason=None, **kw):
    c = {'state': state}
    if file: c['file'] = file
    if reason: c['reason'] = reason
    c.update({k: v for k, v in kw.items() if v is not None}); return c
def ni(reason, code): return comp('NOT_INGESTED', reason=reason, reasonCode=code)
NO_SOURCE = 'sin sondeo de fuente oficial legible; requiere fuente institucional y aprobacion del License Gate antes de ingerir'
def country_es():
    r, a, w = J('es/rules.json'), J('es/amounts.json'), J('es/watch.json')
    if not (r and a and w): return None
    src = r['source']
    return {'cc': 'ES', 'name': 'Espana', 'scheme': r['scheme'], 'legalAct': {'title': src['instrument'], 'ref': src['boeRef'], 'url': src['url'], 'sourceId': src['id']},
            'updatedAt': max(r['verifiedAt'], a['verifiedAt'], w['checkedAt']),
            'components': {
                'strategicPlan': comp('INGESTED', 'es/rules.json', scheme=r['scheme'], note='Reglas del PEPAC leidas del Real Decreto 1048/2022; el texto del plan estrategico en si no se reproduce'),
                'interventions': comp('INGESTED', 'es/amounts.json', count=len(a['ecoschemes']), note='Ecorregimenes con practica y tipo de superficie; ayudas asociadas en amounts.json'),
                'amounts': comp('INGESTED', 'es/amounts.json', campaigns=a['campaigns'], kind=a['kind'], note='Importes planificados, minimos y maximos fijados por el Real Decreto; no son importes pagados por campana'),
                'rules': comp('INGESTED', 'es/rules.json', count=len(r['rules'])),
                'importantDates': comp('INGESTED', 'es/rules.json', count=len(r['calendar']), note='Fechas generales de la norma; cada comunidad autonoma puede modificarlas'),
                'watch': comp('INGESTED', 'es/watch.json', checkedAt=w['checkedAt'], reviewNeeded=len(w['reviewNeeded']))}}
def country_dk():
    a, w = J('dk/amounts.json'), J('dk/watch.json')
    if not (a and w): return None
    d0 = a['documents'][0]
    return {'cc': 'DK', 'name': 'Dinamarca', 'scheme': 'Direct payments %s (Bekendtgorelser)' % a['campaign'], 'legalAct': {'title': ' / '.join(x['title'] for x in a['documents']), 'ref': ', '.join('BEK ' + str(x['number']) for x in a['documents']), 'url': d0['url'], 'sourceId': a['source']['id']},
            'updatedAt': max(a['verifiedAt'], w['checkedAt']),
            'components': {
                'strategicPlan': ni('el plan estrategico danes no se ha leido: solo los decretos de pagos directos', 'NOT_READ'),
                'interventions': comp('INGESTED', 'dk/amounts.json', count=len(a['schemes']), note='Esquemas de pago directo con sus importes'),
                'amounts': comp('INGESTED', 'dk/amounts.json', campaigns=[a['campaign']], kind=a['kind']),
                'rules': comp('PARTIAL', 'dk/amounts.json', count=len(a['thresholds']), note='Solo umbrales numericos (superficies minimas, agricultor activo); no hay catalogo de reglas'),
                'importantDates': ni('los decretos daneses leidos no fijan un calendario estructurado', 'NOT_READ'),
                'watch': comp('INGESTED', 'dk/watch.json', checkedAt=w['checkedAt'], reviewNeeded=len(w['reviewNeeded']))}}
def country_de():
    a = J('de/amounts.json')
    if not a: return None
    dw = J('de/watch.json')
    de_watch = ni('sin vigilancia automatica: el Bundesanzeiger no se lee desde los servidores de GitHub; el contrato avisa si falta el importe real de 2026 pasado el 15 de diciembre', 'SOURCE_UNREACHABLE') if not dw else \
        comp('INGESTED' if dw['status'] == 'OK' else 'PARTIAL', 'de/watch.json', checkedAt=dw['checkedAt'], reviewNeeded=len(dw['reviewNeeded']), note='Huella de tres páginas del Ministerio federal (BMLEH) sobre la GAP y páginas nuevas en su sección; no vigila el texto de la GAPDZV (gesetze-im-internet.de no responde desde GitHub) ni los Bekanntmachungen del Bundesanzeiger')
    docs = {d['id']: d for d in a['documents']}
    return {'cc': 'DE', 'name': 'Alemania', 'scheme': 'Direktzahlungen und Oko-Regelungen (Bundesanzeiger y GAPDZV)', 'legalAct': {'title': 'GAP-Direktzahlungen-Gesetz (GAPDZG) y GAP-Direktzahlungen-Verordnung (GAPDZV); Bekanntmachungen de los importes reales', 'ref': 'GAPDZV Anlagen 3, 4, 6 y 7; ' + ', '.join(docs['BAnz-%d' % y]['ref'] for y in (2023, 2024, 2025)), 'url': 'https://www.gesetze-im-internet.de/gapdzv/', 'sourceId': 'gesetze_im_internet'},
            'updatedAt': a['verifiedAt'],
            'components': {
                'strategicPlan': ni('el plan estrategico aleman no se ha leido: solo los importes por unidad', 'NOT_READ'),
                'interventions': comp('INGESTED', 'de/amounts.json', count=len(a['items']), note='Prima basica, redistributiva, jovenes, siete Oko-Regelungen y las dos ayudas asociadas, con su importe por unidad'),
                'amounts': comp('INGESTED', 'de/amounts.json', campaigns=a['years'], kind=a['kind'], note='Importes reales 2023-2025 (Bekanntmachung del Bundesanzeiger) y planificados de las Oko-Regelungen y ayudas asociadas 2023-2026 (GAPDZV); el importe real de 2026 sale en noviembre-diciembre'),
                'rules': comp('PARTIAL', 'de/amounts.json', count=len(a['conditions']), note='Resumen de las condiciones de las diez Oko-Regelungen (GAPDZV Anlage 5); no incluye listas ni metodos que fijan los Lander ni el resto de la normativa'),
                'importantDates': ni('no se han leido los plazos de solicitud (los fijan los Lander)', 'NOT_READ'),
                'watch': de_watch}}
NO_WATCH = {
    'PT': 'sin vigilancia automatica: no se ha podido probar la lectura del Diario da Republica ni del IFAP desde estos servidores, asi que no se promete una vigilancia que no se ha visto funcionar',
    'BE': 'sin vigilancia automatica: no se ha podido probar la lectura del Moniteur belge, del Codex Vlaanderen ni de Wallex desde estos servidores',
    'HR': 'sin vigilancia automatica: no se ha podido probar la lectura de Narodne novine desde estos servidores',
    'EL': 'sin vigilancia automatica: no se ha podido probar la lectura del ΦΕΚ (Εθνικό Τυπογραφείο) ni de la AADE desde estos servidores',
    'NL': 'sin vigilancia automatica: no se ha probado la lectura de wetten.overheid.nl ni del Staatscourant desde estos servidores',
    'AT': 'sin vigilancia automatica: no se ha probado la lectura del RIS desde estos servidores',
    'IE': 'sin vigilancia automatica: las paginas de gov.ie no se han probado desde estos servidores',
    'RO': 'sin vigilancia automatica: legislatie.just.ro no se puede leer con robots (ROBOTS_DISALLOWED)',
    'HU': 'sin vigilancia automatica: no se ha probado la lectura de Magyar Kozlony ni del Nemzeti Jogszabalytar desde estos servidores',
    'CZ': 'sin vigilancia automatica: e-Sbirka no se pudo leer; el texto se leyo en una copia editorial',
    'SE': 'sin vigilancia automatica: no se ha probado la lectura de la Svensk forfattningssamling desde estos servidores'}
def country_nat(cc, name, amounts_comp):
    """FR, IT y PL: reglas curadas (rules.json), vigilancia (watch.json) e importes si los hay. Solo pagos directos: el resto de la PAC no se ha leido."""
    r, w = J('%s/rules.json' % cc.lower()), J('%s/watch.json' % cc.lower())
    if not r: return None
    if not w and cc not in NO_WATCH: return None
    src = r['source']
    wc = ni(NO_WATCH[cc], 'SOURCE_UNREACHABLE') if not w else comp('INGESTED', '%s/watch.json' % cc.lower(), checkedAt=w['checkedAt'], reviewNeeded=len(w['reviewNeeded'])) if w['status'] == 'OK' else \
        comp('PARTIAL', '%s/watch.json' % cc.lower(), checkedAt=w['checkedAt'], reviewNeeded=len(w['reviewNeeded']), note={'NOT_YET_RUN': 'vigilancia configurada, aun sin primera lectura automatica', 'UNREACHABLE': 'la ultima lectura no llego a la fuente oficial', 'PARTIAL': 'la lectura quedo a medias (se continua en la siguiente ejecucion)'}.get(w['status']))
    return {'cc': cc, 'name': name, 'scheme': r['scheme'], 'legalAct': {'title': src['instrument'], 'ref': src['ref'], 'url': src['url'], 'sourceId': src['id']},
            'updatedAt': max([r['verifiedAt']] + ([w['checkedAt']] if w and w['checkedAt'] else []) + amounts_comp[1]),
            'components': {
                'strategicPlan': ni('el texto del plan estrategico no se ha leido: solo las reglas de los pagos directos', 'NOT_READ'),
                'interventions': comp('PARTIAL', '%s/rules.json' % cc.lower(), count=len(r['interventions']), note='Intervenciones de pagos directos con su base legal; el desarrollo rural y las intervenciones sectoriales no se han leido'),
                'amounts': amounts_comp[0],
                'rules': comp('PARTIAL', '%s/rules.json' % cc.lower(), count=len(r['rules']), note='Reglas de pagos directos leidas a mano de la norma oficial; no es el articulado completo ni consejo juridico'),
                'importantDates': (comp('PARTIAL', '%s/rules.json' % cc.lower(), count=len(r['calendar']), note='Fecha general de la norma; las prorrogas de cada campana figuran como excepcion cuando se han leido') if r['calendar'] else ni('las fechas leidas son de la campana 2025 de cada region y figuran como reglas; no hay un calendario general que se repita cada ano', 'NOT_READ')),
                'watch': wc}}
def country_fr():
    a = J('fr/amounts.json')
    if not a: return None
    return country_nat('FR', 'Francia', (comp('PARTIAL', 'fr/amounts.json', campaigns=a['campaigns'], kind=a['kind'], count=len(a['items']), note='Importes de los arretes de las campanas 2025 y 2026 (con sus modificaciones); faltan el importe unitario de la ayuda de base y, en 2026, el ecorregimen y las ayudas acopladas vegetales'), [a['verifiedAt']]))
def country_it():
    return country_nat('IT', 'Italia', (ni('el decreto no fija importes unitarios (los calcula AGEA) y las circulares de AGEA no se pueden leer desde los servidores de GitHub', 'SOURCE_UNREACHABLE'), []))
def country_pl():
    a = J('pl/amounts.json')
    if not a: return None
    return country_nat('PL', 'Polonia', (comp('PARTIAL', 'pl/amounts.json', campaigns=a['campaigns'], kind=a['kind'], count=len(a['items']), note='Tasas oficiales de las ayudas acopladas, ecorregimenes y bienestar animal 2023-2025 y anticipos 2026; faltan las tasas definitivas de 2026 y las del pago basico, redistributivo y jovenes'), [a['verifiedAt']]))
def country_pt():
    return country_nat('PT', 'Portugal', (ni('los importes unitarios de ecorregimes y ayudas asociadas no se han leido; los importes indicativos del ARC y del pago a pequenos agricultores figuran en las reglas', 'NOT_READ'), []))
def country_hr():
    return country_nat('HR', 'Croacia', (ni('los importes planificados por hectarea y por animal del Pravilnik de 2026 (ayudas asociadas incluidas) figuran en las reglas; no se han leido los pagos efectivos', 'NOT_READ'), []))
def country_el():
    return country_nat('EL', 'Grecia', (ni('las decisiones de 2023 no fijan importes; solo se han leido tres decisiones de importes de ayudas asociadas (figuran en las reglas) y faltan basica, redistributiva, jovenes y ecoesquemas', 'NOT_READ'), []))
def country_nl():
    return country_nat('NL', 'Paises Bajos', (ni('las tarifas reales de 2023 a 2025 (provisionales y definitivas, RVO y Staatscourant) figuran en las reglas; de 2026 solo un minimo previsto', 'NOT_READ'), []))
def country_at():
    return country_nat('AT', 'Austria', (ni('los importes finales de 2024 y previstos de 2026 de la AMA figuran en las reglas; no se han leido los de la ecorregulacion', 'NOT_READ'), []))
def country_ie():
    return country_nat('IE', 'Irlanda', (ni('importes planificados en 2022 y el del ecoesquema 2025 figuran en las reglas; no se han leido las condiciones de 2026', 'NOT_READ'), []))
def country_ro():
    return country_nat('RO', 'Rumania', (ni('solo hay importes adoptados de la campana 2023 (Ordin 447/2023); los de 2025 son borradores y no hay de 2024 ni 2026', 'NOT_READ'), []))
def country_hu():
    return country_nat('HU', 'Hungria', (ni('solo intervalos minimo-maximo de 2025-2026 y anticipos de 2026 en forintos; ningun importe unitario final', 'NOT_READ'), []))
def country_cz():
    return country_nat('CZ', 'Chequia', (ni('solo tipos planificados de 2026 de BISS, CRISS, lupulo y hortalizas; faltan ecorregimenes, jovenes y el resto de asociadas', 'NOT_READ'), []))
def country_se():
    return country_nat('SE', 'Suecia', (ni('margenes del anexo 3 de la ordenanza y cifras planificadas de 2026 o ya fijadas de 2025 figuran en las reglas; no se han leido los definitivos de 2026', 'NOT_READ'), []))
def country_be():
    return country_nat('BE', 'Belgica', (ni('en Valonia el ministro fija los importes y en Flandes no se han leido; no hay importes por hectarea', 'NOT_READ'), []))
def country_eu():
    e = J('eu/allocations.json')
    if not e: return None
    s = e['source']
    return {'cc': 'EU', 'name': 'Union Europea', 'scheme': 'CAP Strategic Plans Regulation (EU) 2021/2115', 'legalAct': {'title': s['title'], 'ref': 'CELEX ' + s['celex'], 'url': s['url'], 'sourceId': 'eur_lex'},
            'updatedAt': e['generatedAt'][:10],
            'components': {
                'strategicPlan': ni('los planes estrategicos nacionales no se ingieren; solo las asignaciones del Reglamento', 'EU_LEVEL_ONLY'),
                'interventions': ni('el Reglamento define tipos de intervencion, no importes por pais', 'EU_LEVEL_ONLY'),
                'amounts': comp('INGESTED', 'eu/allocations.json', note='Asignaciones financieras de los anexos V y XI por Estado miembro, a precios corrientes'),
                'rules': ni('no se reproduce el articulado', 'NOT_READ'),
                'importantDates': ni('el Reglamento no fija un calendario de solicitud (lo fija cada Estado miembro)', 'NOT_APPLICABLE'),
                'watch': ni('sin vigilancia de cambios del texto consolidado (solo se anota la version consolidada)', 'NOT_BUILT')}}
def blocked(cc, name, reason, code):
    return {'cc': cc, 'name': name, 'scheme': None, 'legalAct': None, 'updatedAt': None, 'components': {k: ni(reason, code) for k in COMPONENTS}}
PENDING = []
def next_occurrence(cal, today):
    w = cal['when']; best = None
    for y in (today.year - 1, today.year, today.year + 1):
        try: d = datetime.date(y + w['yearOffset'], w['month'], w['day'])
        except ValueError: continue
        if d >= today and (best is None or d < best): best = d
    return best
def build(today):
    cs = [x for x in (country_es(), country_dk(), country_eu()) if x]
    cs += [blocked(cc, n, r, c) for cc, n, r, c in PENDING]
    cs += [x for x in (country_de(), country_fr(), country_it(), country_pl(), country_pt(), country_be(), country_hr(), country_el(), country_nl(), country_at(), country_ie(), country_ro(), country_hu(), country_cz(), country_se()) if x]   # al final: las pruebas de contrato indexan los primeros paises
    rules, events, deadlines = J('es/rules.json'), [], []
    for cc, f in (('ES', 'es/watch.json'), ('DK', 'dk/watch.json')):
        w = J(f)
        if not w: continue
        for it in w.get('reviewNeeded', []):
            events.append({'type': 'RULE_CHANGED', 'cc': cc, 'detail': it if isinstance(it, str) else json.dumps(it, ensure_ascii=False, sort_keys=True), 'detectedAt': w['checkedAt'], 'officialUrl': (rules['source']['url'] if cc == 'ES' else J('dk/amounts.json')['documents'][0]['url'])})
    for cc in ('FR', 'IT', 'PL', 'PT', 'BE', 'HR', 'EL', 'NL', 'AT', 'IE', 'RO', 'HU', 'CZ', 'SE'):
        w, rr = J('%s/watch.json' % cc.lower()), J('%s/rules.json' % cc.lower())
        for it in (w or {}).get('reviewNeeded', []):
            events.append({'type': 'RULE_CHANGED', 'cc': cc, 'detail': it, 'detectedAt': w['checkedAt'], 'officialUrl': rr['source']['url']})
    for cc, f in (('ES', 'es/amounts.json'), ('DK', 'dk/amounts.json')):
        a = J(f)
        for ch in (a or {}).get('changes', []):
            events.append({'type': 'AMOUNT_CHANGED', 'cc': cc, 'detail': ch if isinstance(ch, str) else json.dumps(ch, ensure_ascii=False, sort_keys=True), 'detectedAt': a['verifiedAt'], 'officialUrl': a['source']['url']})
    if rules:
        for c in rules['calendar']:
            d = next_occurrence(c, today)
            if d: deadlines.append({'cc': 'ES', 'id': c['id'], 'kind': c['kind'], 'date': d.isoformat(), 'text': c['text'], 'regionalNote': c.get('regional') or None, 'legalBasis': c['legalBasis'], 'officialUrl': rules['source']['url']})
    for cc in ('FR', 'IT', 'PL', 'PT', 'BE', 'HR', 'EL', 'NL', 'AT', 'IE', 'RO', 'HU', 'CZ', 'SE'):
        rr = J('%s/rules.json' % cc.lower())
        for c in (rr or {}).get('calendar', []):
            d = next_occurrence(c, today)
            if d: deadlines.append({'cc': cc, 'id': c['id'], 'kind': c['kind'], 'date': d.isoformat(), 'text': c['text'], 'legalBasis': c['legalBasis'], 'officialUrl': rr['source']['url']})
    deadlines.sort(key=lambda x: (x['date'], x['cc'], x['id']))
    for x in deadlines:
        if x.get('regionalNote', 1) is None: del x['regionalNote']
    return {'schemaVersion': 1, 'asOf': today.isoformat(),
            'contract': {'doc': 'Contrato comun de la PAC por pais en data/cap/<CC>/. Cada componente declara INGESTED, PARTIAL o NOT_INGESTED (con razon). Un pais solo pasa a INGESTED con una fuente institucional oficial y licencia aprobada en el License Gate. Sin consejo juridico ni calculo de ayudas individuales.',
                         'components': COMPONENTS, 'states': ['INGESTED', 'PARTIAL', 'NOT_INGESTED']},
            'countries': cs,
            'watch': {'eventTypes': {'RULE_CHANGED': 'ACTIVE', 'AMOUNT_CHANGED': 'ACTIVE', 'DEADLINE_APPROACHING': 'ACTIVE', 'NEW_RULE': 'NOT_DETECTABLE'},
                      'newRuleNote': 'NEW_RULE exige un indice de articulos del acto legal para detectar disposiciones nuevas; hoy solo se vigilan las huellas de las ya leidas, asi que no se emite.',
                      'deadlineNote': 'Cada plazo es la siguiente fecha general de la norma; el cliente calcula la proximidad. Las comunidades autonomas pueden modificarlo.',
                      'events': events, 'deadlines': deadlines}}
def main():
    obj = build(datetime.datetime.now(datetime.timezone.utc).date())
    txt = json.dumps(obj, ensure_ascii=False, indent=1) + '\n'
    if '--check' in sys.argv:
        old = json.loads(OUT.read_text(encoding='utf-8')); old.pop('asOf', None); old['watch']['deadlines'] = []; n = json.loads(txt); n.pop('asOf'); n['watch']['deadlines'] = []
        if old != n: print('data/cap/index.json desactualizado: python3 scripts/build-cap-index.py'); sys.exit(1)
        print('cap index OK'); return
    OUT.write_text(txt, encoding='utf-8'); print('cap index: %d paises, %d eventos, %d plazos' % (len(obj['countries']), len(obj['watch']['events']), len(obj['watch']['deadlines'])))
main()
