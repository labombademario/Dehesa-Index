#!/usr/bin/env python3
"""Sonda 47: ejecuta el actualizador del MMO (Reino Unido)."""
import subprocess, sys
r = subprocess.run([sys.executable, "scripts/update-uk-mmo-fish.py"])
print("codigo", r.returncode)
# 48
