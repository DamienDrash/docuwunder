#!/usr/bin/env python3
"""Syntaxpruefung der Komponenten-Skripte und der eigenstaendigen JS-Dateien.

Die Logik der DC-Komponenten steckt in <script type="text/x-dc"> innerhalb der
HTML-Dateien und wird erst zur Laufzeit per new Function() ausgewertet - ein
Syntaxfehler faellt dort sonst erst im Browser auf. Dieses Skript zieht die
Bloecke heraus und laesst `node --check` darueber laufen.

Aufruf: python3 tests/syntax_check.py
"""
import pathlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = []  # keine DC-Skriptbloecke mehr - die Oberflaeche ist reines JavaScript
JS = ["logik.js", "api.js", "ui.js", "app.js", "vorlage.js",
      "vorlage/tabs.js", "vorlage/dokument.js", "vorlage/ordnung.js",
      "vorlage/verwaltung.js", "vorlage/sheets.js", "vorlage/erfassen.js",
      "vorlage/onboarding.js", "sw.js"]

BLOCK = re.compile(
    r'<script[^>]*\bdata-dc-script\b[^>]*>(.*?)</script>', re.S | re.I
)

fehler = 0


def pruefe(name: str, quelle: str) -> None:
    global fehler
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as fh:
        fh.write(quelle)
        tmp = fh.name
    r = subprocess.run(["node", "--check", tmp], capture_output=True, text=True)
    pathlib.Path(tmp).unlink()
    if r.returncode == 0:
        print(f"  ok      {name}")
    else:
        fehler += 1
        melde = (r.stderr or r.stdout).strip().splitlines()
        # Die ersten Zeilen enthalten Datei/Zeile und die Fehlermeldung.
        print(f"  FEHLER  {name}")
        for zeile in melde[:8]:
            print(f"          {zeile}")


print("Syntaxpruefung")
for datei in HTML:
    pfad = ROOT / datei
    if not pfad.exists():
        print(f"  fehlt   {datei}")
        fehler += 1
        continue
    bloecke = BLOCK.findall(pfad.read_text(encoding="utf-8"))
    if not bloecke:
        print(f"  ok      {datei} (kein Komponenten-Skript)")
        continue
    for i, b in enumerate(bloecke):
        pruefe(f"{datei} [Block {i + 1}]", b)

for datei in JS:
    pfad = ROOT / datei
    if not pfad.exists():
        print(f"  fehlt   {datei}")
        fehler += 1
        continue
    pruefe(datei, pfad.read_text(encoding="utf-8"))

print()
if fehler:
    print(f"{fehler} Datei(en) mit Fehlern")
    sys.exit(1)
print("Alle Skripte syntaktisch in Ordnung")
