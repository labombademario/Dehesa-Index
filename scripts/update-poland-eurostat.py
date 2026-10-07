#!/usr/bin/env python3
"""Polonia (Eurostat, geo=PL) -> data/poland-eurostat-stats.json (countries.PL)
Eurostat publica los datos oficiales polacos (GUS, Ministerio de Agricultura) con politica de reutilizacion y cita de la fuente. Los precios y cosechas nacionales (GUS, BDL) van en data/poland-stats.json.
Toda la logica vive en scripts/eurostat_country.py (nucleo comun con Italia)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from eurostat_country import run
run({'geo': 'PL', 'pfx': 'pl', 'slug': 'poland', 'name': 'Poland', 'source': 'Eurostat (official Polish data: GUS, Ministry of Agriculture)'})
