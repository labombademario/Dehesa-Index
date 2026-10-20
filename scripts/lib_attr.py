"""Atribución sin marcas sin rellenar. El registro de licencias (data/license-registry.json) guarda el texto que EXIGE cada licencia, que a veces es una plantilla
(«Source: Eurostat (online data code: <code>)», «Adapted from Statistics Canada, <table name/number>, <reference date>…»).
Las salidas que se publican (CSV/XLSX del paquete de datos, API, cestas, vista de citas) no deben llevar esas marcas: se rellena lo que se puede deducir sin inventar
(la fecha de la última observación) y, si no, se quita la cláusula entera. Nunca se escribe un valor que no se conozca."""
import re

def resolve(text, last_date=None):
    s = str(text or '')
    if '<' not in s: return s
    if last_date: s = s.replace('<reference date>', str(last_date))   # la fecha de referencia es la de la última observación; la de acceso o el año de edición no se deducen
    s = re.sub(r',?\s*accessed\s*<[^>]+>', '', s)
    s = re.sub(r'\s*\([^)<]*<[^>]*>[^)]*\)', '', s)             # «(online data code: <code>)»
    s = re.sub(r',\s*<[^>]+>', '', s)                             # «, <table name/number>»
    s = re.sub(r'(?<=[/:])<[^>]+>', '', s)                        # «StatBank.dk/<table code>»
    s = re.sub(r':\s*<[^>]+>', '', s)                             # «The World Bank: <indicator name>»
    s = re.sub(r'\s*<[^>]+>\.?', '', s)                           # cualquier otra marca suelta
    s = re.sub(r'/(?=[.\s]|$)', '', s)
    s = re.sub(r'\s+([.,])', r'\1', s)
    s = re.sub(r'\.\s*\.', '.', s)
    return re.sub(r'\s{2,}', ' ', s).strip(' ,')
