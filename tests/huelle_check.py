#!/usr/bin/env python3
"""Passt die Cache-Version des Service Workers zum Inhalt der Huelle?

    python3 tests/huelle_check.py

Diese Stufe existiert wegen eines konkreten Vorfalls: die Version wurde von
Hand hochgezaehlt, jemand vergass es, und behobene Fehler erreichten die
installierte App nicht mehr (docs/AUDIT.md, H-5). Seitdem ist die Version eine
Pruefsumme ueber den Inhalt - und diese Stufe stellt sicher, dass sie stimmt.

Die Arbeit macht tools/huelle.py; hier wird nur geprueft.
"""
import pathlib
import subprocess
import sys

WURZEL = pathlib.Path(__file__).resolve().parent.parent

print("Huellenversion")
lauf = subprocess.run([sys.executable, str(WURZEL / "tools" / "huelle.py"), "--pruefen"],
                      capture_output=True, text=True)
print(lauf.stdout.rstrip() or lauf.stderr.rstrip())
if lauf.returncode:
    print("\nDie Huellenversion passt nicht zum Inhalt")
    sys.exit(1)
print("\nDie Huelle wird beim naechsten Start ausgetauscht, wenn sie sich geaendert hat")
