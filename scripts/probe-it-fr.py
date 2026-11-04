#!/usr/bin/env python3
"""Sonda 36: ejecuta update-es-municipios.py y deja el resultado en data/es-municipios."""
import subprocess, sys
sys.exit(subprocess.call([sys.executable, "scripts/update-es-municipios.py"]))
