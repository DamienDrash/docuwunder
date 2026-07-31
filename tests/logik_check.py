#!/usr/bin/env python3
"""Fuehrt die Unit-Tests der reinen Logik aus (tests/logik.test.js).

Eigene Stufe, weil sie ohne Browser und ohne Server laufen und deshalb vor
allem Langsameren drankommen: schlaegt hier etwas fehl, sagen die spaeteren
Stufen nichts mehr aus.

Aufruf: python3 tests/logik_check.py
"""
import pathlib
import re
import subprocess
import sys

HIER = pathlib.Path(__file__).resolve().parent

print("Unit-Tests der Logik")

r = subprocess.run(
    ["node", "--test", str(HIER / "logik.test.js")],
    capture_output=True, text=True, cwd=str(HIER.parent),
)
aus = r.stdout + r.stderr

# Der TAP-Bericht von node --test ist ausfuehrlich; hier zaehlt die Bilanz.
def zahl(feld):
    m = re.search(r"^# " + feld + r" (\d+)", aus, re.M)
    return int(m.group(1)) if m else None

bestanden, fehlgeschlagen = zahl("pass"), zahl("fail")

if bestanden is None:
    print("  FEHLER  node --test lieferte keinen auswertbaren Bericht")
    print("\n".join("          " + z for z in aus.strip().splitlines()[:15]))
    sys.exit(1)

if fehlgeschlagen:
    # Nur die fehlgeschlagenen Faelle zeigen, nicht den ganzen Bericht.
    for block in re.findall(r"^not ok \d+ - (.+)$", aus, re.M):
        print(f"  FEHLER  {block}")
    for zeile in re.findall(r"^\s+(?:error|expected|actual):.*$", aus, re.M)[:12]:
        print(f"          {zeile.strip()}")
    print(f"\n{fehlgeschlagen} von {bestanden + fehlgeschlagen} Faellen fehlgeschlagen")
    sys.exit(1)

print(f"  ok      {bestanden} Faelle")
print(f"\nAlle {bestanden} Unit-Tests bestanden")
