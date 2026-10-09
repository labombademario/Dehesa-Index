#!/usr/bin/env python3
"""PAC Francia: importes unitarios de la campana 2025 (arretes del Ministerio de Agricultura) -> data/cap/fr/amounts.json
Fuente: Journal officiel de la Republique francaise (JORF), leido del volcado de datos abiertos de la DILA (echanges.dila.gouv.fr/OPENDATA/JORF/),
cuya reutilizacion es gratuita (Arrete du 24 juin 2014). Se transcriben a mano los articulos de 15 arretes; no hay workflow (la sonda se hizo una vez).
Cada importe tiene su cadena de versiones: el arrete inicial y los arretes modificativos que lo sustituyen (25-nov-2025, 11-mar-2026, 5-jun-2026). El vigente es el ultimo.
NO esta el importe unitario de la ayuda de base (no se ha encontrado su arrete) ni los arretes de la campana 2026 (no aparecen en el volcado hasta el 9-oct-2026).
Uso: python3 scripts/build-cap-fr.py [--check]"""
import json, sys, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'cap' / 'fr' / 'amounts.json'
# id, fecha publicacion JORF, fecha firma, NOR, JORFTEXT, titulo oficial (abreviado tal cual), ambito
D = [
 ('A1', '2025-10-01', '2025-09-23', 'AGRT2524991A', 'JORFTEXT000052328766', "Arrêté du 23 septembre 2025 fixant les montants de l'aide redistributive complémentaire au revenu pour un développement durable, de l'aide complémentaire au revenu pour les jeunes agriculteurs et du taux de réduction des montants de l'aide de base au revenu pour la campagne 2025"),
 ('A2', '2025-10-01', '2025-09-23', 'AGRT2524997A', 'JORFTEXT000052328776', "Arrêté du 23 septembre 2025 fixant les montants unitaires du programme volontaire pour le climat et le bien-être animal dit « écorégime » pour la campagne 2025"),
 ('A3', '2025-10-08', '2025-09-30', 'AGRT2525874A', 'JORFTEXT000052372817', "Arrêté du 30 septembre 2025 relatif aux montants des aides ovines et de l'aide caprine dans les départements métropolitains hors Corse pour la campagne 2025"),
 ('A4', '2025-10-08', '2025-09-30', 'AGRT2525877A', 'JORFTEXT000052372828', "Arrêté du 30 septembre 2025 relatif aux montants de l'aide aux petits ruminants en Corse pour la campagne 2025"),
 ('M1', '2025-11-28', '2025-11-25', 'AGRT2531186A', 'JORFTEXT000052869147', "Arrêté du 25 novembre 2025 modifiant l'arrêté du 23 septembre 2025 (aide redistributive, aide jeunes agriculteurs, taux de réduction)"),
 ('M2', '2025-11-28', '2025-11-25', 'AGRT2531189A', 'JORFTEXT000052869158', "Arrêté du 25 novembre 2025 modifiant l'arrêté du 23 septembre 2025 (écorégime)"),
 ('M3', '2025-11-28', '2025-11-25', 'AGRT2531191A', 'JORFTEXT000052869177', "Arrêté du 25 novembre 2025 modifiant l'arrêté du 30 septembre 2025 (aide aux petits ruminants en Corse)"),
 ('M4', '2025-11-28', '2025-11-25', 'AGRT2531193A', 'JORFTEXT000052869184', "Arrêté du 25 novembre 2025 modifiant l'arrêté du 30 septembre 2025 (aides ovines hors Corse)"),
 ('V1', '2026-02-28', '2026-02-24', 'AGRT2604635A', 'JORFTEXT000053594055', "Arrêté du 24 février 2026 fixant les montants unitaires des aides couplées végétales pour la campagne 2025"),
 ('V2', '2026-03-13', '2026-03-11', 'AGRT2606117A', 'JORFTEXT000053659009', "Arrêté du 11 mars 2026 modifiant l'arrêté du 24 février 2026 fixant les montants unitaires des aides couplées végétales pour la campagne 2025"),
 ('J1', '2026-06-12', '2026-06-05', 'AGRT2614148A', 'JORFTEXT000054237656', "Arrêté du 5 juin 2026 modifiant l'arrêté du 23 septembre 2025 (aide redistributive, aide jeunes agriculteurs, taux de réduction)"),
 ('J2', '2026-06-12', '2026-06-05', 'AGRT2614150A', 'JORFTEXT000054237666', "Arrêté du 5 juin 2026 modifiant l'arrêté du 23 septembre 2025 (écorégime)"),
 ('J3', '2026-06-12', '2026-06-05', 'AGRT2614152A', 'JORFTEXT000054237685', "Arrêté du 5 juin 2026 modifiant l'arrêté du 24 février 2026 (aides couplées végétales)"),
 ('J4', '2026-06-12', '2026-06-05', 'AGRT2614157A', 'JORFTEXT000054237700', "Arrêté du 5 juin 2026 modifiant l'arrêté du 30 septembre 2025 (aides ovines et caprine hors Corse)"),
 ('J5', '2026-06-12', '2026-06-05', 'AGRT2614158A', 'JORFTEXT000054237709', "Arrêté du 5 juin 2026 modifiant l'arrêté du 30 septembre 2025 (aide aux petits ruminants en Corse)"),
]
V = lambda *p: [{'doc': d, 'value': v} for d, v in p]
# id, grupo, etiqueta oficial, unidad, [(doc, valor)...]
ITEMS = [
 ('redistributive', 'direct', "Aide redistributive complémentaire au revenu pour un développement durable (CRISS)", 'EUR/ha', V(('A1', 47.81), ('M1', 48.58), ('J1', 50.20))),
 ('young', 'direct', "Aide complémentaire au revenu pour les jeunes agriculteurs (montant forfaitaire)", 'EUR', V(('A1', 3100), ('M1', 4300), ('J1', 4469))),
 ('reduction', 'direct', "Taux de réduction (art. D. 614-67 du code rural)", 'PCT', V(('A1', 2.9195), ('J1', 3.8774))),
 ('eco-base', 'eco', "Écorégime, niveau de base", 'EUR/ha', V(('A2', 45.46), ('M2', 46.34), ('J2', 46.34))),
 ('eco-upper', 'eco', "Écorégime, niveau supérieur", 'EUR/ha', V(('A2', 62.05), ('M2', 63.39), ('J2', 63.39))),
 ('eco-bio', 'eco', "Écorégime, niveau spécifique à l'agriculture biologique", 'EUR/ha', V(('A2', 92.05), ('M2', 93.39), ('J2', 101.67))),
 ('eco-hedge', 'eco', "Écorégime, bonus haies", 'EUR/ha', V(('A2', 20), ('M2', 20), ('J2', 20))),
 ('sheep-base', 'coupled-animal', "Aide ovine de base (hors Corse)", 'EUR/head', V(('A3', 20), ('M4', 21), ('J4', 21.56))),
 ('sheep-first500', 'coupled-animal', "Majoration pour les 500 premières brebis primées (hors Corse)", 'EUR/head', V(('A3', 2), ('M4', 2), ('J4', 2))),
 ('sheep-new', 'coupled-animal', "Aide ovine complémentaire, nouveaux producteurs (hors Corse)", 'EUR/head', V(('A3', 6), ('M4', 6), ('J4', 6.57))),
 ('goat', 'coupled-animal', "Aide caprine (hors Corse)", 'EUR/head', V(('A3', 14.24), ('J4', 15.64))),
 ('corse-ewe-base', 'coupled-animal', "Corse, montant de base, femelles ovines", 'EUR/head', V(('A4', 22.23), ('M3', 23.41), ('J5', 25.00))),
 ('corse-goat-base', 'coupled-animal', "Corse, montant de base, femelles caprines", 'EUR/head', V(('A4', 15.43), ('M3', 16.25), ('J5', 17.36))),
 ('corse-ewe-upper', 'coupled-animal', "Corse, montant supérieur, femelles ovines", 'EUR/head', V(('A4', 44.47), ('M3', 46.82), ('J5', 50.00))),
 ('corse-goat-upper', 'coupled-animal', "Corse, montant supérieur, femelles caprines", 'EUR/head', V(('A4', 30.88), ('M3', 32.51), ('J5', 34.72))),
 ('pulses', 'coupled-plant', "Légumineuses à graines et légumineuses fourragères déshydratées ou destinées à la production de semences", 'EUR', V(('V1', 122.00), ('J3', 138.04))),
 ('forage-mountain', 'coupled-plant', "Légumineuses fourragères en zones de montagne", 'EUR', V(('V1', 148.43), ('J3', 154.00))),
 ('forage-plain', 'coupled-plant', "Légumineuses fourragères hors zones de montagne", 'EUR', V(('V1', 124.00), ('J3', 141.01))),
 ('durum', 'coupled-plant', "Blé dur", 'EUR', V(('V1', 60.76), ('J3', 69.88))),
 ('starch-potato', 'coupled-plant', "Pommes de terre féculières", 'EUR', V(('V1', 172.80), ('J3', 224.64))),
 ('rice', 'coupled-plant', "Riz", 'EUR', V(('V1', 120.00), ('J3', 143.00))),
 ('hops', 'coupled-plant', "Houblon", 'EUR', V(('V1', 440.00), ('J3', 565.83))),
 ('hemp', 'coupled-plant', "Chanvre", 'EUR', V(('V1', 67.00), ('J3', 92.74))),
 ('grass-seed', 'coupled-plant', "Semences de graminées prairiales", 'EUR', V(('V2', 43.83), ('J3', 48.22))),
 ('plum', 'coupled-plant', "Prunes d'Ente destinées à la transformation", 'EUR', V(('V2', 946.37), ('J3', 1041.01))),
 ('tomato', 'coupled-plant', "Tomates destinées à la transformation", 'EUR', V(('V2', 950.00), ('J3', 1205.38))),
 ('cherry', 'coupled-plant', "Cerises Bigarreau destinées à la transformation", 'EUR', V(('V2', 587.74), ('J3', 646.52))),
 ('peach', 'coupled-plant', "Pêches Pavie destinées à la transformation", 'EUR', V(('V2', 450.00), ('J3', 560.85))),
 ('market-garden', 'coupled-plant', "Maraîchage", 'EUR', V(('V2', 1581.94), ('J3', 1740.34))),
 ('pear', 'coupled-plant', "Poires Williams destinées à la transformation", 'EUR', V(('V2', 950.00), ('J3', 1295.04))),
]
def build():
    docs = {d[0]: d for d in D}; errs = []
    for sid, grp, label, unit, vs in ITEMS:
        last = None
        for v in vs:
            if v['doc'] not in docs: errs.append('%s: documento %s desconocido' % (sid, v['doc']))
            else:
                dt = docs[v['doc']][1]
                if last and dt < last: errs.append('%s: versiones desordenadas' % sid)
                last = dt
    if errs: raise SystemExit('\n'.join(errs))
    return {'schemaVersion': 1, 'country': 'FR', 'kind': 'OFFICIAL_UNIT_AMOUNTS', 'campaign': 2025,
            'sources': [{'id': 'dila_jorf', 'name': 'DILA — Journal officiel de la République française (données ouvertes JORF)', 'url': 'https://echanges.dila.gouv.fr/OPENDATA/JORF/'}],
            'documents': [{'id': d[0], 'published': d[1], 'signed': d[2], 'nor': d[3], 'jorfText': d[4], 'title': d[5], 'url': 'https://www.legifrance.gouv.fr/jorf/id/' + d[4]} for d in D],
            'items': [{'id': sid, 'group': grp, 'label': label, 'unit': unit, 'versions': vs, 'current': vs[-1]['value'], 'currentDoc': vs[-1]['doc']} for sid, grp, label, unit, vs in ITEMS],
            'notes': ['Importes de la campaña 2025 tal como los fijan los arrêtés del Ministerio de Agricultura y sus modificaciones; el vigente es el del último arrêté (5 de junio de 2026 en casi todos).',
                      'Las ayudas acopladas vegetales figuran en el texto oficial en «euros», sin indicar la unidad: no se completa.',
                      'No incluye el importe unitario de la ayuda de base (no se ha encontrado su arrêté) ni los arrêtés de la campaña 2026 (no aparecen en el volcado de la DILA hasta el 9 de octubre de 2026).',
                      'Textos leídos del volcado de datos abiertos de la DILA el 8-9 de octubre de 2026; la edición que manda es la del Journal officiel.'],
            'verifiedAt': datetime.date.today().isoformat()}
if __name__ == '__main__':
    doc = build()
    if '--check' in sys.argv: print('ok', len(doc['items'])); sys.exit(0)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8'); print('escrito', OUT, len(doc['items']))
