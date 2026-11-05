#!/usr/bin/env python3
"""Sonda 51: actualizador del MMO."""
import subprocess, sys
print("codigo", subprocess.run([sys.executable, "scripts/update-uk-mmo-fish.py"]).returncode)
