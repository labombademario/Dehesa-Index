#!/usr/bin/env python3
"""Batería de titulares de prueba del clasificador de noticias (scripts/update_news.py): evita asociaciones erróneas entre cultivo, tema y canal.
Casos reales de la auditoría del 9-oct-2026: un anuncio de tractor con «napraforgó» (girasol) salía como noticia de colza; las plagas de colza no
se reconocían como sanidad ni como canal de oferta. Cada caso: (titular, idioma, ¿medio general?, esperado) con esperado = None (descartar) o
dict con 'products' (todos presentes), 'no_topics' (ausentes) y 'channel' (canal del primer enlace)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import update_news as u
CASES = [
 ("NAS 1276 napraforgó adapter korához képest megfelelő műszaki állapotban, 1999-es évjáratú", "hu", True, None),
 ("Tractor John Deere se vende con cosechadora de trigo, año 2005", "es", True, None),
 ("Plagas de la colza: el gusano del tallo se extiende por Castilla y León", "es", False, {"products": ["colza"], "no_topics": ["comercio"], "channel": "supply"}),
 ("Rapeseed pests: cabbage stem flea beetle damage spreads in northern France", "en", False, {"products": ["colza"], "no_topics": ["comercio"], "channel": "supply"}),
 ("New sunflower hybrid launched for 2027 season by seed company", "en", True, {"products": ["colza"], "no_topics": ["comercio", "sanidad"]}),
 ("Wheat exports fall as tariffs hit Black Sea trade", "en", False, {"products": ["trigo"], "channel": "trade"}),
 ("Drought cuts corn yields in Illinois", "en", False, {"products": ["maiz"], "channel": "weather"}),
]
def main():
    fails = 0
    for title, lang, general, exp in CASES:
        c = u.classify(title, "", "eu", lang, general)
        if exp is None:
            if c is not None: print("FALLO: debía descartarse:", title, c); fails += 1
            continue
        if c is None: print("FALLO: se descartó:", title); fails += 1; continue
        products, topics = c[0], c[1]
        links = u.build_market_links(products, topics, title, "")
        for p in exp.get("products", []):
            if p not in products: print("FALLO: falta producto", p, "en", title, products); fails += 1
        for t in exp.get("no_topics", []):
            if t in topics: print("FALLO: tema indebido", t, "en", title, topics); fails += 1
        if "channel" in exp and (not links or links[0]["channel"] != exp["channel"]):
            print("FALLO: canal", links[0]["channel"] if links else None, "!=", exp["channel"], "en", title); fails += 1
    print("test-news-classify: %d casos, %d fallos" % (len(CASES), fails)); return 1 if fails else 0
sys.exit(main())
