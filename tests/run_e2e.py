#!/usr/bin/env python3
"""Fuehrt alle Pruefungen der App aus.

    python3 tests/run_e2e.py            alles
    python3 tests/run_e2e.py --statisch nur ohne Server (Syntax, Bindungen)

Die Stufen bauen aufeinander auf und laufen von schnell nach langsam:

  1. syntax_check    Syntax der Komponenten-Skripte und JS-Dateien
  2. template_check  jede {{ Bindung }} hat einen Wert aus renderVals
  3. pwa_check       Manifest, Service Worker und Einstiegspunkt passen zusammen
  4. api_check       die Zusagen der Paperless-API, auf die die App baut
  5. browser_check   die App im echten Browser gegen den echten Server

Fuer 3 und 4 wird ein API-Token gebraucht:

    PAPERLESS_TOKEN=… python3 tests/run_e2e.py

Ersatzweise aus tests/.token (nicht versioniert). Die Adresse des Servers
laesst sich mit PAPERLESS_URL uebersteuern; Vorgabe ist
http://127.0.0.1:8099/paperless/api.
"""
import pathlib
import subprocess
import sys

HIER = pathlib.Path(__file__).resolve().parent

STATISCH = [
    ("Syntax", "syntax_check.py"),
    # Direkt nach der Syntax: die Logik-Tests brauchen weder Browser noch
    # Server und sagen am genauesten, wo ein Fehler sitzt.
    ("Logik", "logik_check.py"),
    ("Template-Bindungen", "template_check.py"),
    ("PWA", "pwa_check.py"),
]
GEGEN_SERVER = [
    ("API-Vertrag", "api_check.py"),
    ("Browser", "browser_check.py"),
]


def lauf(titel, skript):
    # Ohne flush landet die Ueberschrift nach der Ausgabe des Unterprozesses.
    print(f"\n{'=' * 62}\n{titel}\n{'=' * 62}", flush=True)
    r = subprocess.run([sys.executable, str(HIER / skript)])
    return r.returncode


def main():
    nur_statisch = "--statisch" in sys.argv
    stufen = STATISCH + ([] if nur_statisch else GEGEN_SERVER)

    fehlgeschlagen = []
    for titel, skript in stufen:
        if lauf(titel, skript) != 0:
            fehlgeschlagen.append(titel)
            # Laeuft die Syntax nicht, sagen die spaeteren Stufen nichts mehr.
            if skript == "syntax_check.py":
                break

    print(f"\n{'=' * 62}")
    if fehlgeschlagen:
        print("Fehlgeschlagen: " + ", ".join(fehlgeschlagen))
        return 1
    print(f"Alle Stufen bestanden ({len(stufen)})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
