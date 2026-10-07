#!/usr/bin/env python3
"""Italia (Eurostat, geo=IT) -> data/italy-eurostat-stats.json (countries.IT, extend)
Italia no tiene una fuente nacional integrada (ISTAT no esta en el registro de licencias); Eurostat publica los datos oficiales italianos (ISTAT/MASAF) con politica de reutilizacion y cita de la fuente.
Toda la logica vive en scripts/eurostat_country.py (nucleo comun con Polonia)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from eurostat_country import run
run({'geo': 'IT', 'pfx': 'it', 'slug': 'italy', 'name': 'Italy', 'source': 'Eurostat (official Italian data: ISTAT, MASAF)', 'extend': True})
