#!/usr/bin/env python3
"""PAC Polonia: tasas de pago (zloty) de los reglamentos del Ministro de Agricultura -> data/cap/pl/amounts.json
Fuente: Dziennik Ustaw (Diario de Leyes de la Republica de Polonia), leido de la API ELI del Sejm (api.sejm.gov.pl/eli). Los actos normativos y los documentos oficiales
quedan fuera del derecho de autor (ley de derecho de autor de 4-feb-1994, art. 4 puntos 1 y 2; texto unificado Dz.U. 2025 poz. 24).
Cada tasa es la de un reglamento anual (art. 49 ust. 1 de la ley del Plan Estrategico de la PAC, Dz.U. 2023 poz. 412): acoplados por produccion, ecoesquemas y bienestar animal, por ano de campana.
Los reglamentos de anticipos (art. 50) llevan, solo en 2026, una tasa ESTIMADA de cada ayuda, incluidas las que no tienen reglamento propio (pago basico, redistributivo, jovenes): se publican aparte y como estimacion.
NO estan las tasas definitivas del pago basico, redistributivo ni de jovenes (no se han encontrado en el Dziennik Ustaw) ni las de 2026 (los reglamentos de tasas se publican hacia el 15 de octubre).
Uso: python3 scripts/build-cap-pl.py [--check]"""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'cap' / 'pl' / 'amounts.json'
API = 'https://api.sejm.gov.pl/eli/acts/'
# id, ELI, fecha del acto, fecha de promulgacion, fichero pdf, tipo, campana, titulo
D = [
 ('K23', 'DU/2023/2219', '2023-10-13', '2023-10-16', 'D20232219.pdf', 'rates', 2023, 'Rozporządzenie MRiRW z dnia 13 października 2023 r. w sprawie stawek płatności w ramach wsparcia dochodów związanego z produkcją za 2023 r.'),
 ('K24', 'DU/2024/1525', '2024-10-14', '2024-10-15', 'D20241525.pdf', 'rates', 2024, 'Rozporządzenie MRiRW z dnia 14 października 2024 r. w sprawie stawek płatności w ramach wsparcia dochodów związanego z produkcją za 2024 r.'),
 ('K25', 'DU/2025/1394', '2025-10-14', '2025-10-15', 'D20251394.pdf', 'rates', 2025, 'Rozporządzenie MRiRW z dnia 14 października 2025 r. w sprawie stawek płatności w ramach wsparcia dochodów związanego z produkcją za 2025 r.'),
 ('E23', 'DU/2024/265', '2024-02-27', '2024-02-27', 'D20240265.pdf', 'rates', 2023, 'Rozporządzenie MRiRW z dnia 27 lutego 2024 r. w sprawie stawek płatności w ramach schematów na rzecz klimatu i środowiska za 2023 r.'),
 ('E24', 'DU/2024/1517', '2024-10-14', '2024-10-15', 'D20241517.pdf', 'rates', 2024, 'Rozporządzenie MRiRW z dnia 14 października 2024 r. w sprawie stawek płatności w ramach schematów na rzecz klimatu i środowiska za 2024 r.'),
 ('E25', 'DU/2025/1397', '2025-10-14', '2025-10-15', 'D20251397.pdf', 'rates', 2025, 'Rozporządzenie MRiRW z dnia 14 października 2025 r. w sprawie stawek płatności w ramach schematów na rzecz klimatu i środowiska za 2025 r.'),
 ('W23', 'DU/2024/645', '2024-04-25', '2024-04-26', 'D20240645.pdf', 'rates', 2023, 'Rozporządzenie MRiRW z dnia 25 kwietnia 2024 r. w sprawie stawek płatności w ramach schematów na rzecz dobrostanu zwierząt za 2023 r.'),
 ('W24', 'DU/2025/557', '2025-04-24', '2025-04-28', 'D20250557.pdf', 'rates', 2024, 'Rozporządzenie MRiRW z dnia 24 kwietnia 2025 r. w sprawie stawek płatności w ramach schematów na rzecz dobrostanu zwierząt za 2024 r.'),
 ('W25', 'DU/2026/560', '2026-04-22', '2026-04-23', 'D20260560.pdf', 'rates', 2025, 'Rozporządzenie MRiRW z dnia 22 kwietnia 2026 r. w sprawie stawek płatności w ramach schematów na rzecz dobrostanu zwierząt za 2025 r.'),
 ('Z26', 'DU/2026/1173', '2026-09-03', '2026-09-03', 'D20261173.pdf', 'advance', 2026, 'Rozporządzenie MRiRW z dnia 3 września 2026 r. w sprawie wypłaty zaliczek za 2026 r. z tytułu niektórych rodzajów pomocy w ramach Planu Strategicznego dla Wspólnej Polityki Rolnej na lata 2023–2027'),
]
def R(**kw): return {y.replace('y', ''): {'value': v[0], 'doc': v[1]} for y, v in kw.items()}   # y2023=(valor, doc) -> {'2023': {...}}
# id, grupo, etiqueta oficial (polaco), unidad, tasas por ano
ITEMS = [
 ('legumes', 'coupled-plant', 'Rośliny strączkowe na nasiona', 'PLN/ha', R(y2023=(823.91, 'K23'), y2024=(794.08, 'K24'), y2025=(879.96, 'K25'))),
 ('fodder', 'coupled-plant', 'Rośliny pastewne', 'PLN/ha', R(y2023=(471.53, 'K23'), y2024=(430.18, 'K24'), y2025=(430.18, 'K25'))),
 ('starch-potato', 'coupled-plant', 'Ziemniaki skrobiowe', 'PLN/ha', R(y2023=(1501.05, 'K23'), y2024=(1580.89, 'K24'), y2025=(1580.89, 'K25'))),
 ('sugar-beet', 'coupled-plant', 'Buraki cukrowe', 'PLN/ha', R(y2023=(1391.96, 'K23'), y2024=(1253.34, 'K24'), y2025=(1284.14, 'K25'))),
 ('tomato', 'coupled-plant', 'Pomidory', 'PLN/ha', R(y2023=(2047.34, 'K23'), y2024=(2097.56, 'K24'), y2025=(2097.56, 'K25'))),
 ('hops', 'coupled-plant', 'Chmiel', 'PLN/ha', R(y2023=(1985.54, 'K23'), y2024=(1852.03, 'K24'), y2025=(1864.49, 'K25'))),
 ('strawberry', 'coupled-plant', 'Truskawki', 'PLN/ha', R(y2023=(1237.42, 'K23'), y2024=(1154.20, 'K24'), y2025=(1495.79, 'K25'))),
 ('flax', 'coupled-plant', 'Len', 'PLN/ha', R(y2023=(463.10, 'K23'), y2024=(431.98, 'K24'), y2025=(542.69, 'K25'))),
 ('hemp', 'coupled-plant', 'Konopie włókniste', 'PLN/ha', R(y2023=(134.35, 'K23'), y2024=(125.32, 'K24'), y2025=(168.99, 'K25'))),
 ('cattle', 'coupled-animal', 'Płatność do bydła', 'PLN/head', R(y2023=(343.46, 'K23'), y2024=(320.35, 'K24'), y2025=(322.49, 'K25'))),
 ('cows', 'coupled-animal', 'Płatność do krów', 'PLN/head', R(y2023=(439.41, 'K23'), y2024=(409.86, 'K24'), y2025=(412.63, 'K25'))),
 ('sheep', 'coupled-animal', 'Owca domowa', 'PLN/head', R(y2023=(116.44, 'K23'), y2024=(109.40, 'K24'), y2025=(110.16, 'K25'))),
 ('goat', 'coupled-animal', 'Koza domowa', 'PLN/head', R(y2023=(47.84, 'K23'), y2024=(47.83, 'K24'), y2025=(48.12, 'K25'))),
 ('honey', 'eco', 'Obszary z roślinami miododajnymi', 'PLN/ha', R(y2023=(1256.77, 'E23'), y2024=(898.66, 'E24'), y2025=(931.07, 'E25'))),
 ('carbon-point', 'eco', 'Rolnictwo węglowe i zarządzanie składnikami odżywczymi (za punkt)', 'PLN/point', R(y2023=(104.89, 'E23'), y2024=(87.02, 'E24'), y2025=(87.52, 'E25'))),
 ('ipr', 'eco', 'Integrowana produkcja roślin (jedna stawka w 2023 i 2024)', 'PLN/ha', R(y2023=(1363.77, 'E23'), y2024=(818.92, 'E24'))),
 ('ipr-orchard', 'eco', 'Integrowana produkcja roślin: uprawy sadownicze', 'PLN/ha', R(y2025=(1185.24, 'E25'))),
 ('ipr-berry', 'eco', 'Integrowana produkcja roślin: uprawy jagodowe', 'PLN/ha', R(y2025=(1069.41, 'E25'))),
 ('ipr-arable', 'eco', 'Integrowana produkcja roślin: uprawy rolnicze', 'PLN/ha', R(y2025=(505.18, 'E25'))),
 ('ipr-veg', 'eco', 'Integrowana produkcja roślin: uprawy warzywne', 'PLN/ha', R(y2025=(1069.41, 'E25'))),
 ('bio-protection', 'eco', 'Biologiczna ochrona upraw (jedna stawka w 2023 i 2024)', 'PLN/ha', R(y2023=(419.64, 'E23'), y2024=(300.06, 'E24'))),
 ('bio-micro', 'eco', 'Biologiczna uprawa: mikrobiologiczne środki ochrony roślin', 'PLN/ha', R(y2025=(310.88, 'E25'))),
 ('bio-fert', 'eco', 'Biologiczna uprawa: nawozowe produkty mikrobiologiczne', 'PLN/ha', R(y2025=(87.52, 'E25'))),
 ('water', 'eco', 'Retencjonowanie wody na trwałych użytkach zielonych', 'PLN/ha', R(y2023=(292.27, 'E23'), y2024=(244.57, 'E24'), y2025=(245.98, 'E25'))),
 ('fallow', 'eco', 'Grunty wyłączone z produkcji', 'PLN/ha', R(y2024=(422.34, 'E24'), y2025=(437.57, 'E25'))),
 ('seed-cereal', 'eco', 'Materiał siewny elitarny lub kwalifikowany: zboża', 'PLN/ha', R(y2025=(104.15, 'E25'))),
 ('seed-legume', 'eco', 'Materiał siewny elitarny lub kwalifikowany: rośliny strączkowe', 'PLN/ha', R(y2025=(168.93, 'E25'))),
 ('seed-potato', 'eco', 'Materiał siewny elitarny lub kwalifikowany: ziemniaki', 'PLN/ha', R(y2025=(436.76, 'E25'))),
 ('welfare-point', 'welfare', 'Dobrostan: świnie oraz bydło (za punkt)', 'PLN/point', R(y2023=(104, 'W23'), y2024=(92.75, 'W24'), y2025=(80.83, 'W25'))),
 ('welfare-sheep', 'welfare', 'Dobrostan: owca domowa', 'PLN/head', R(y2023=(160.68, 'W23'), y2024=(143.30, 'W24'), y2025=(124.89, 'W25'))),
 ('welfare-goat', 'welfare', 'Dobrostan: koza domowa', 'PLN/head', R(y2023=(155.18, 'W23'), y2024=(138.39, 'W24'), y2025=(120.61, 'W25'))),
 ('welfare-horse-indoor', 'welfare', 'Dobrostan: koń, pomieszczenia lub budynki', 'PLN/head', R(y2023=(449.98, 'W23'), y2024=(401.32, 'W24'), y2025=(349.75, 'W25'))),
 ('welfare-horse-open', 'welfare', 'Dobrostan: koń, system otwarty', 'PLN/head', R(y2023=(203.72, 'W23'), y2024=(181.68, 'W24'), y2025=(158.34, 'W25'))),
 ('welfare-hen', 'welfare', 'Dobrostan: kury nioski', 'PLN/head', R(y2023=(14.72, 'W23'), y2024=(13.12, 'W24'), y2025=(11.43, 'W25'))),
 ('welfare-broiler', 'welfare', 'Dobrostan: kurczęta brojlery (jedna stawka w 2023)', 'PLN/head', R(y2023=(0.21, 'W23'))),
 ('welfare-broiler-std', 'welfare', 'Dobrostan: kurczęta brojlery, wymogi z ust. 30 załącznika nr 2', 'PLN/head', R(y2024=(0.18, 'W24'), y2025=(0.16, 'W25'))),
 ('welfare-broiler-pr', 'welfare', 'Dobrostan: kurczęta brojlery, praktyka z § 3 ust. 2 pkt 7', 'PLN/head', R(y2024=(0.15, 'W24'), y2025=(0.13, 'W25'))),
 ('welfare-turkey', 'welfare', 'Dobrostan: indyki (jedna stawka w 2023)', 'PLN/head', R(y2023=(3.12, 'W23'))),
 ('welfare-turkey-std', 'welfare', 'Dobrostan: indyki, wymogi z ust. 31 załącznika nr 2', 'PLN/head', R(y2024=(2.78, 'W24'), y2025=(2.42, 'W25'))),
 ('welfare-turkey-pr', 'welfare', 'Dobrostan: indyki, praktyka z § 3 ust. 2 pkt 7', 'PLN/head', R(y2024=(1.00, 'W24'), y2025=(0.87, 'W25'))),
]
# Tasas ESTIMADAS 2026 (reglamento de anticipos, art. 50): sirven para calcular el anticipo (75 %), no son las definitivas
EST = [
 ('basic', 'basic', 'Podstawowe wsparcie dochodów (art. 20 pkt 1 lit. a)', 'PLN/ha', 436.23),
 ('redistributive', 'basic', 'Płatność redystrybucyjna (lit. b)', 'PLN/ha', 179.12),
 ('young', 'basic', 'Płatność dla młodych rolników (lit. c)', 'PLN/ha', 248.70),
 ('small-farms', 'basic', 'Płatność dla małych gospodarstw (lit. f)', 'PLN/ha', 941.42),
 ('complementary-basic', 'basic', 'Uzupełniająca płatność podstawowa (przejściowe wsparcie krajowe, pkt 2)', 'PLN/ha', 48.04),
 ('tobacco', 'basic', 'Płatność niezwiązana do tytoniu (za kg)', 'PLN/kg', 1.92),
 ('legumes', 'coupled-plant', 'Rośliny strączkowe na nasiona', 'PLN/ha', 878.45), ('fodder', 'coupled-plant', 'Rośliny pastewne', 'PLN/ha', 421.55),
 ('starch-potato', 'coupled-plant', 'Ziemniaki skrobiowe', 'PLN/ha', 1549.16), ('sugar-beet', 'coupled-plant', 'Buraki cukrowe', 'PLN/ha', 1258.37),
 ('tomato', 'coupled-plant', 'Pomidory', 'PLN/ha', 2055.44), ('hops', 'coupled-plant', 'Chmiel', 'PLN/ha', 1843.14), ('strawberry', 'coupled-plant', 'Truskawki', 'PLN/ha', 1465.77),
 ('flax', 'coupled-plant', 'Len', 'PLN/ha', 429.92), ('hemp', 'coupled-plant', 'Konopie włókniste', 'PLN/ha', 124.73),
 ('cattle', 'coupled-animal', 'Płatność do bydła', 'PLN/head', 318.83), ('cows', 'coupled-animal', 'Płatność do krów', 'PLN/head', 407.91),
 ('sheep', 'coupled-animal', 'Owca domowa', 'PLN/head', 108.91), ('goat', 'coupled-animal', 'Koza domowa', 'PLN/head', 47.57),
 ('honey', 'eco', 'Obszary z roślinami miododajnymi', 'PLN/ha', 1111.35), ('carbon-point', 'eco', 'Rolnictwo węglowe (za punkt)', 'PLN/point', 92.76),
 ('ipr-orchard', 'eco', 'Integrowana produkcja roślin: sadownicze', 'PLN/ha', 1414.74), ('ipr-berry', 'eco', 'Integrowana produkcja roślin: jagodowe', 'PLN/ha', 1276.48),
 ('ipr-arable', 'eco', 'Integrowana produkcja roślin: rolnicze', 'PLN/ha', 603.00), ('ipr-veg', 'eco', 'Integrowana produkcja roślin: warzywne', 'PLN/ha', 1276.48),
 ('bio-micro', 'eco', 'Biologiczna uprawa: mikrobiologiczne środki ochrony roślin', 'PLN/ha', 371.08), ('bio-fert', 'eco', 'Biologiczna uprawa: nawozowe produkty mikrobiologiczne', 'PLN/ha', 92.76),
 ('water', 'eco', 'Retencjonowanie wody na trwałych użytkach zielonych', 'PLN/ha', 260.69), ('fallow', 'eco', 'Grunty wyłączone z produkcji', 'PLN/ha', 522.30),
 ('seed-cereal', 'eco', 'Materiał siewny: zboża', 'PLN/ha', 110.38), ('seed-legume', 'eco', 'Materiał siewny: rośliny strączkowe', 'PLN/ha', 179.04), ('seed-potato', 'eco', 'Materiał siewny: ziemniaki', 'PLN/ha', 462.89),
]
def build():
    docs = {d[0]: d for d in D}; errs = []; seen = set()
    if len(docs) != len(D) or len({d[1] for d in D}) != len(D): errs.append('documentos repetidos')
    for sid, grp, label, unit, vals in ITEMS:
        if sid in seen: errs.append('%s: tasa repetida' % sid)
        seen.add(sid)
        for y, v in vals.items():
            if v['doc'] not in docs: errs.append('%s: documento %s desconocido' % (sid, v['doc']))
            elif str(docs[v['doc']][6]) != y: errs.append('%s %s: el documento %s es de la campana %s' % (sid, y, v['doc'], docs[v['doc']][6]))
    if errs: raise SystemExit('\n'.join(errs))
    return {'schemaVersion': 1, 'country': 'PL', 'kind': 'OFFICIAL_UNIT_RATES', 'currency': 'PLN', 'campaigns': [2023, 2024, 2025, 2026],
            'sources': [{'id': 'sejm_eli', 'name': 'Sejm de la República de Polonia — API ELI del Dziennik Ustaw', 'url': 'https://api.sejm.gov.pl/eli/acts/'}],
            'documents': [{'id': d[0], 'eli': d[1], 'signed': d[2], 'published': d[3], 'kind': d[5], 'campaign': d[6], 'title': d[7], 'url': API + d[1]} for d in D],
            'items': [{'id': sid, 'group': grp, 'label': label, 'unit': unit, 'values': vals, 'latestCampaign': int(max(vals)), 'latest': vals[max(vals)]['value']} for sid, grp, label, unit, vals in ITEMS],
            'estimates2026': {'doc': 'Z26', 'campaign': 2026, 'kind': 'ESTIMATED_RATE_FOR_ADVANCES', 'advanceShare': 0.75, 'advanceFrom': '2026-09-08',
                              'items': [{'id': sid, 'group': grp, 'label': label, 'unit': unit, 'value': v} for sid, grp, label, unit, v in EST]},
            'notes': ['Tasas por campaña de los reglamentos del Ministro de Agricultura y Desarrollo Rural (art. 49 de la ley del Plan Estratégico de la PAC), en zlotys. La tasa 2025 del bienestar animal se fijó el 22-abr-2026 y la de 2023, el 25-abr-2024: cada reglamento llega meses después de la campaña.',
                      'Faltan las tasas definitivas del pago básico, el redistributivo y el de jóvenes: no se encontraron en el Dziennik Ustaw. Solo hay la tasa estimada de 2026 del reglamento de anticipos, que sirve para pagar el 75 % del anticipo y no es la tasa definitiva.',
                      'La campaña 2026 aún no tiene reglamentos de tasas (los de 2024 y 2025 se firmaron el 14 de octubre): cuando salgan, la vigilancia lo avisará.',
                      'Las etiquetas de «ipr», «bio-protection», «welfare-broiler» y «welfare-turkey» cambian de estructura entre 2023, 2024 y 2025: cada año se recoge tal como lo fija su reglamento, sin repartir una tasa única entre variantes.',
                      'Leído de la API ELI del Sejm; la edición que manda es la publicada en el Dziennik Ustaw.'],
            'verifiedAt': datetime.date.today().isoformat()}
if __name__ == '__main__':
    doc = build()
    if '--check' in sys.argv: print('ok', len(doc['items'])); sys.exit(0)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8'); print('escrito', OUT, len(doc['items']))
