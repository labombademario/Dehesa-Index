#!/usr/bin/env python3
"""PAC Alemania: importes por unidad de los pagos directos y de las Öko-Regelungen -> data/cap/de/amounts.json
Fuentes oficiales (obras oficiales: § 5 Abs. 1 UrhG), transcritas a mano de los textos publicados porque ni gesetze-im-internet.de ni el Bundesanzeiger
son legibles desde los servidores de GitHub (el primero no responde; el segundo exige sesion). Por eso NO hay workflow: este script solo valida y escribe.
 - Importes REALES (tatsaechliche Einheitsbetraege): Bekanntmachung del ministerio federal en el Bundesanzeiger, una por campana
     2023: BAnz AT 08.12.2023 B5 (8-dic-2023)   2024: BAnz AT 29.11.2024 B3 (21-nov-2024)   2025: BAnz AT 01.12.2025 B6 (20-nov-2025)
 - Importes PLANIFICADOS (geplante Einheitsbetraege) de las Öko-Regelungen y de la ayuda asociada, 2023-2026: GAPDZV Anlagen 4, 6 y 7 (gesetze-im-internet.de)
 - Asignaciones indicativas de las Öko-Regelungen en euros, 2023-2026: GAPDZV Anlage 3
Los importes planificados de la prima basica, la redistributiva y jovenes NO estan en la ley (los calcula el ministerio y los publica en el Bundesanzeiger): no se ponen.
El importe real de 2026 se publica en noviembre-diciembre de 2026: hasta entonces 2026 solo tiene lo planificado, y el contrato avisa si falta tras el 15-dic-2026.
Control de transcripcion: dentro de cada campana, importe real / importe planificado es la misma razon para todas las Öko-Regelungen (1,30 en 2023; 1,0852 en 2024; 1,00 en 2025).
Uso: python3 scripts/build-cap-de.py [--check]"""
import json, sys, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'cap' / 'de' / 'amounts.json'
YEARS = [2023, 2024, 2025, 2026]
DOCS = [
    {'id': 'BAnz-2023', 'year': 2023, 'kind': 'ACTUAL', 'ref': 'BAnz AT 08.12.2023 B5', 'date': '2023-12-08', 'title': 'Bekanntmachung der tatsächlichen Einheitsbeträge für die im Rahmen der Gemeinsamen Agrarpolitik finanzierten Direktzahlungen für das Antragsjahr 2023', 'issuer': 'Bundesministerium für Ernährung und Landwirtschaft', 'url': 'https://www.bundesanzeiger.de/'},
    {'id': 'BAnz-2024', 'year': 2024, 'kind': 'ACTUAL', 'ref': 'BAnz AT 29.11.2024 B3', 'date': '2024-11-21', 'title': 'Bekanntmachung der tatsächlichen Einheitsbeträge für die im Rahmen der Gemeinsamen Agrarpolitik finanzierten Direktzahlungen für das Antragsjahr 2024', 'issuer': 'Bundesministerium für Ernährung und Landwirtschaft', 'url': 'https://www.bundesanzeiger.de/'},
    {'id': 'BAnz-2025', 'year': 2025, 'kind': 'ACTUAL', 'ref': 'BAnz AT 01.12.2025 B6', 'date': '2025-11-20', 'title': 'Bekanntmachung der tatsächlichen Einheitsbeträge für die im Rahmen der Gemeinsamen Agrarpolitik finanzierten Direktzahlungen für das Antragsjahr 2025', 'issuer': 'Bundesministerium für Landwirtschaft, Ernährung und Heimat', 'url': 'https://www.bundesanzeiger.de/'},
    {'id': 'GAPDZV-A3', 'year': None, 'kind': 'ALLOCATION', 'ref': 'GAPDZV Anlage 3 (zu § 15 Absatz 2)', 'date': None, 'title': 'Indikative Mittelzuweisungen in Euro für die Öko-Regelungen', 'issuer': 'Bundesrepublik Deutschland', 'url': 'https://www.gesetze-im-internet.de/gapdzv/anlage_3.html'},
    {'id': 'GAPDZV-A4', 'year': None, 'kind': 'PLANNED', 'ref': 'GAPDZV Anlage 4 (zu § 16 Absatz 1)', 'date': None, 'title': 'Geplante Einheitsbeträge je Hektar für die Öko-Regelungen', 'issuer': 'Bundesrepublik Deutschland', 'url': 'https://www.gesetze-im-internet.de/gapdzv/anlage_4.html'},
    {'id': 'GAPDZV-A6', 'year': None, 'kind': 'PLANNED', 'ref': 'GAPDZV Anlage 6 (zu § 18 Absatz 1)', 'date': None, 'title': 'Geplante Einheitsbeträge für die Zahlung für Mutterschafe und -ziegen', 'issuer': 'Bundesrepublik Deutschland', 'url': 'https://www.gesetze-im-internet.de/gapdzv/anlage_6.html'},
    {'id': 'GAPDZV-A7', 'year': None, 'kind': 'PLANNED', 'ref': 'GAPDZV Anlage 7 (zu § 20 Absatz 1)', 'date': None, 'title': 'Geplante Einheitsbeträge für die Zahlung für Mutterkühe', 'issuer': 'Bundesrepublik Deutschland', 'url': 'https://www.gesetze-im-internet.de/gapdzv/anlage_7.html'},
]
# (id, grupo, codigo, etiqueta alemana oficial, unidad, [real 2023, 2024, 2025], [planificado 2023..2026] o None, documento del planificado)
A = lambda *v: dict(zip((2023, 2024, 2025), v))
P = lambda *v: dict(zip(YEARS, v))
ITEMS = [
    ('basic', 'direct', 'GAPDZG § 4', 'Einkommensgrundstützung (Basisprämie)', 'EUR/ha', A(170.93, 157.63, 152.44), None, None),
    ('redistributive-1', 'direct', 'GAPDZG § 8', 'Umverteilungseinkommensstützung, Gruppe 1', 'EUR/ha', A(76.28, 72.36, 68.05), None, None),
    ('redistributive-2', 'direct', 'GAPDZG § 8', 'Umverteilungseinkommensstützung, Gruppe 2', 'EUR/ha', A(45.76, 43.41, 40.83), None, None),
    ('young', 'direct', 'GAPDZG § 13', 'Junglandwirte-Einkommensstützung', 'EUR/ha', A(141.75, 126.58, 120.64), None, None),
    ('eco-1a-1', 'eco', 'ÖR 1a, Stufe 1', 'Nichtproduktive Flächen auf Ackerland (bis 1 % des Ackerlands)', 'EUR/ha', A(1690.00, 1410.83, 1300.00), P(1300, 1300, 1300, 1300), 'GAPDZV-A4'),
    ('eco-1a-2', 'eco', 'ÖR 1a, Stufe 2', 'Nichtproduktive Flächen auf Ackerland (über 1 % bis 2 %)', 'EUR/ha', A(650.00, 542.62, 500.00), P(500, 500, 500, 500), 'GAPDZV-A4'),
    ('eco-1a-3', 'eco', 'ÖR 1a, Stufe 3', 'Nichtproduktive Flächen auf Ackerland (über 2 %)', 'EUR/ha', A(390.00, 325.57, 300.00), P(300, 300, 300, 300), 'GAPDZV-A4'),
    ('eco-1b', 'eco', 'ÖR 1b', 'Blühstreifen oder -flächen auf Ackerland', 'EUR/ha', A(195.00, 217.05, 200.00), P(150, 200, 200, 200), 'GAPDZV-A4'),
    ('eco-1c', 'eco', 'ÖR 1c', 'Blühstreifen oder -flächen in Dauerkulturen', 'EUR/ha', A(195.00, 217.05, 200.00), P(150, 200, 200, 200), 'GAPDZV-A4'),
    ('eco-1d-1', 'eco', 'ÖR 1d, Stufe 1', 'Altgrasstreifen oder -flächen in Dauergrünland (bis 1 %)', 'EUR/ha', A(1170.00, 976.72, 900.00), P(900, 900, 900, 1000), 'GAPDZV-A4'),
    ('eco-1d-2', 'eco', 'ÖR 1d, Stufe 2', 'Altgrasstreifen oder -flächen in Dauergrünland (über 1 % bis 3 %)', 'EUR/ha', A(520.00, 434.10, 400.00), P(400, 400, 400, 450), 'GAPDZV-A4'),
    ('eco-1d-3', 'eco', 'ÖR 1d, Stufe 3', 'Altgrasstreifen oder -flächen in Dauergrünland (über 3 %)', 'EUR/ha', A(260.00, 217.05, 200.00), P(200, 200, 200, 200), 'GAPDZV-A4'),
    ('eco-2', 'eco', 'ÖR 2', 'Vielfältige Kulturen im Ackerbau (mindestens fünf Hauptfruchtarten, Leguminosen mindestens 10 %)', 'EUR/ha', A(58.50, 65.11, 60.00), P(45, 60, 60, 60), 'GAPDZV-A4'),
    ('eco-3', 'eco', 'ÖR 3', 'Beibehaltung einer agroforstlichen Bewirtschaftungsweise', 'EUR/ha', A(78.00, 217.05, 200.00), P(60, 200, 200, 600), 'GAPDZV-A4'),
    ('eco-4', 'eco', 'ÖR 4', 'Extensivierung des gesamten Dauergrünlands des Betriebs', 'EUR/ha', A(149.50, 108.52, 100.00), P(115, 100, 100, 100), 'GAPDZV-A4'),
    ('eco-5', 'eco', 'ÖR 5', 'Ergebnisorientierte extensive Bewirtschaftung von Dauergrünland (mindestens vier Kennarten)', 'EUR/ha', A(312.00, 260.46, 225.00), P(240, 240, 225, 210), 'GAPDZV-A4'),
    ('eco-6-1', 'eco', 'ÖR 6, Stufe 1', 'Verzicht auf chemisch-synthetische Pflanzenschutzmittel, Stufe 1', 'EUR/ha', A(169.00, 162.78, 150.00), P(130, 150, 150, 150), 'GAPDZV-A4'),
    ('eco-6-2', 'eco', 'ÖR 6, Stufe 2', 'Verzicht auf chemisch-synthetische Pflanzenschutzmittel, Stufe 2', 'EUR/ha', A(65.00, 54.26, 50.00), P(50, 50, 50, 50), 'GAPDZV-A4'),
    ('eco-7', 'eco', 'ÖR 7', 'Landbewirtschaftungsmethoden in Natura-2000-Gebieten', 'EUR/ha', A(52.00, 43.41, 40.00), P(40, 40, 40, 40), 'GAPDZV-A4'),
    ('ewes-goats', 'coupled', 'GAPDZG § 22', 'Zahlung für Mutterschafe und -ziegen', 'EUR/head', A(38.31, 37.88, 36.14), P(34.83, 34.44, 39.00, 37.89), 'GAPDZV-A6'),
    ('suckler-cows', 'coupled', 'GAPDZG § 26', 'Zahlung für Mutterkühe', 'EUR/head', A(85.72, 84.76, 89.37), P(77.93, 77.06, 87.72, 85.22), 'GAPDZV-A7'),
]
# GAPDZV Anlage 3: indikative Mittelzuweisung je Öko-Regelung (EUR), Antragsjahre 2023-2026
ALLOC = {
    'ÖR 1': P(326273710, 336005670, 330500464, 268268869), 'ÖR 2': P(120315992, 161510657, 164333859, 155822273), 'ÖR 3': P(1500000, 1500000, 1900000, 2300000),
    'ÖR 4': P(227479352, 197808132, 197808132, 158246480), 'ÖR 5': P(153745143, 153745143, 144136071, 267432276), 'ÖR 6': P(135754299, 103192794, 98124721, 56468100), 'ÖR 7': P(52480464, 52480464, 52480464, 52480464),
}
EXPECT_RATIO = {2023: 1.3, 2024: 1.0852, 2025: 1.0}
def build():
    errs = []
    for it in ITEMS:
        if it[1] != 'eco': continue
        for y, r in EXPECT_RATIO.items():
            ratio = it[5][y] / it[6][y]
            if abs(ratio - r) > 0.0006: errs.append('%s %d: razon real/planificado %.4f, se esperaba %.4f' % (it[0], y, ratio, r))
    if errs: raise SystemExit('Control de transcripcion fallido:\n  ' + '\n  '.join(errs))
    items = []
    for sid, grp, code, label, unit, act, plan, pdoc in ITEMS:
        items.append({'id': sid, 'group': grp, 'code': code, 'label': label, 'unit': unit,
                      'actual': {str(y): v for y, v in act.items()}, 'planned': ({str(y): v for y, v in plan.items()} if plan else None), 'plannedDoc': pdoc})
    return {'schemaVersion': 1, 'country': 'DE', 'kind': 'OFFICIAL_UNIT_AMOUNTS', 'years': YEARS, 'lastActualYear': 2025,
            'sources': [{'id': 'bundesanzeiger', 'name': 'Bundesanzeiger (amtlicher Teil) — Bekanntmachungen des BMEL/BMLEH', 'url': 'https://www.bundesanzeiger.de/'},
                        {'id': 'gesetze_im_internet', 'name': 'Gesetze im Internet (BMJ/BfJ) — GAPDZG und GAPDZV', 'url': 'https://www.gesetze-im-internet.de/gapdzv/'}],
            'documents': DOCS, 'items': items,
            'ecoAllocations': {k: {str(y): v for y, v in d.items()} for k, d in ALLOC.items()},
            'notes': ['Importe reales: los fija cada año el ministerio en noviembre-diciembre; el de 2026 aún no se ha publicado.',
                      'Importes planificados de prima básica, redistributiva y jóvenes: no figuran en la ley (los calcula y publica el ministerio): no se muestran.',
                      'Transcritos de los textos oficiales; los importes reales de las Öko-Regelungen salen de multiplicar el planificado por un factor común de cada año (1,30 en 2023; 1,0852 en 2024; 1,00 en 2025).'],
            'verifiedAt': datetime.date.today().isoformat()}
if __name__ == '__main__':
    doc = build()
    if '--check' in sys.argv: print('ok', len(doc['items']), 'importes'); sys.exit(0)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8'); print('escrito', OUT, len(doc['items']), 'importes')
