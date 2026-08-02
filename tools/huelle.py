#!/usr/bin/env python3
"""Setzt die Huellenversion im Service Worker aus dem Inhalt.

    python3 tools/huelle.py [--pruefen]

Warum: `const VERSION = 'v8'` wurde von Hand hochgezaehlt. Vergisst man es,
bleibt der Cache stehen und behobene Fehler erreichen niemanden - genau das
ist in diesem Projekt schon einmal passiert (docs/AUDIT.md, H-5).

Die Version ist jetzt eine Pruefsumme ueber genau die Dateien, die der Worker
vorhaelt. Aendert sich eine davon, aendert sich die Version; aendert sich
nichts, bleibt sie gleich. Das ist die Eigenschaft, die man will - eine
Zaehlung waere schon wieder etwas, das jemand vergessen kann.

--pruefen aendert nichts und endet mit 1, wenn die eingetragene Version nicht
zum Inhalt passt. So laeuft es in der CI.
"""
import hashlib
import pathlib
import re
import sys

WURZEL = pathlib.Path(__file__).resolve().parent.parent
SW = WURZEL / "sw.js"


def huellen_dateien(quelle: str):
    """Die Pfade aus der HUELLE-Liste des Workers."""
    block = re.search(r"const HUELLE = \[(.*?)\];", quelle, re.S)
    if not block:
        raise SystemExit("HUELLE-Liste in sw.js nicht gefunden")
    return [p for p in re.findall(r"'\./([^']*)'", block.group(1)) if p]


def summe(quelle: str) -> str:
    h = hashlib.sha256()
    for pfad in sorted(huellen_dateien(quelle)):
        datei = WURZEL / pfad
        h.update(pfad.encode())
        # Fehlende Dateien fliessen als Name ein: dann faellt der Unterschied
        # spaetestens der pwa_check-Stufe auf, nicht erst dem Browser.
        if datei.is_file():
            h.update(datei.read_bytes())
    # Der Worker selbst zaehlt mit - ohne seine Zeile mit der Version, sonst
    # jagte sich die Pruefsumme selbst.
    h.update(re.sub(r"const VERSION = '[^']*';", "", quelle).encode())
    return h.hexdigest()[:12]


def main() -> int:
    quelle = SW.read_text(encoding="utf-8")
    jetzt = re.search(r"const VERSION = '([^']*)';", quelle)
    if not jetzt:
        raise SystemExit("VERSION in sw.js nicht gefunden")
    soll = summe(quelle)
    if jetzt.group(1) == soll:
        print(f"  ok      Huellenversion passt zum Inhalt ({soll})")
        return 0
    if "--pruefen" in sys.argv:
        print(f"  FEHLER  Huellenversion {jetzt.group(1)} passt nicht zum Inhalt ({soll})")
        print("          python3 tools/huelle.py setzt sie richtig.")
        return 1
    SW.write_text(quelle.replace(f"const VERSION = '{jetzt.group(1)}';",
                                 f"const VERSION = '{soll}';"), encoding="utf-8")
    print(f"  ok      Huellenversion gesetzt: {jetzt.group(1)} -> {soll}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
