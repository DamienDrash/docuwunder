#!/usr/bin/env python3
"""Liegt in den versionierten Dateien etwas, das dort nicht hingehoert?

    python3 tests/geheim_check.py

Diese Stufe hat eine Vorgeschichte. In diesem Projekt ist zweimal ein echter
Paperless-Zugangsschluessel in Dateien gelandet, und einmal hat ein externer
Scanner angeschlagen - auf eine erfundene Testvorgabe, aber das wusste er
nicht. Beides kostet Zeit: das eine, weil der Schluessel gewechselt und die
Historie geprueft werden muss; das andere, weil ein Repository, das staendig
Fehlalarm ausloest, dazu erzieht, Alarme zu ueberlesen.

Geprueft werden ausschliesslich **versionierte** Dateien - was
`.gitignore` erfasst, geht diese Stufe nichts an. Genau darum steht auch die
Frage mit im Programm, ob die bekannten Geheimnisdateien tatsaechlich ignoriert
werden: eine Zeile in `.gitignore`, die jemand versehentlich entfernt, faellt
sonst erst auf, wenn es zu spaet ist.

Was hier NICHT geprueft wird: die Historie. Ein Geheimnis, das einmal
eingecheckt war, bleibt in alten Commits, auch wenn die Datei heute sauber ist.
Dafuer ist ein Scanner mit Historienzugriff da (GitGuardian), nicht diese Stufe.
"""
import pathlib
import re
import subprocess
import sys

WURZEL = pathlib.Path(__file__).resolve().parent.parent

# Dateien, die niemals versioniert sein duerfen.
NIE_VERSIONIERT = ["tests/.token", ".env"]

# Muster, die auf ein Geheimnis hindeuten. Bewusst wenige und scharfe: eine
# Stufe, die bei jedem zweiten Commit anschlaegt, wird abgeschaltet.
MUSTER = [
    # Ein Paperless-Zugangsschluessel: 40 Zeichen hexadezimal. Der haeufigste
    # Fall in diesem Projekt.
    (re.compile(r"\b[0-9a-f]{40}\b"), "sieht aus wie ein Zugangsschluessel (40 Zeichen hex)"),
    # nutzer:wort@host in einer Adresse.
    (re.compile(r"https?://[^\s/:@]+:[^\s/:@]+@"), "Zugangsdaten in einer Adresse"),
    # Ein Geheimnis, das einem Schluessel direkt zugewiesen wird. Der Wert
    # darf kein `+` enthalten - sonst trifft es jede Verkettung, die zufaellig
    # "Passwort:" enthaelt, und eine Stufe mit Fehlalarmen wird abgeschaltet.
    (re.compile(r"(?i)(?:^|[{,\s])(passwor[dt]|secret|api[_-]?key|token)\s*[:=]\s*"
                r"['\"][^'\"+]{12,}['\"]"),
     "Zuweisung mit einem laengeren Geheimnis"),
]

# Verzeichnisse, die nicht von uns stammen. native/android und native/ios
# erzeugt Capacitor; dort stehen Pruefsummen und Quelltext-Adressen, die wie
# Schluessel aussehen und keine sind.
FREMDE_BAEUME = ("native/android/", "native/ios/", "vendor/")


def harmlos(pfad: str, zeile: str, was: str) -> bool:
    """Bekannte, begruendete Ausnahmen.

    Jede braucht einen Grund. Eine Ausnahmeliste ohne Begruendung ist eine
    abgeschaltete Pruefung.
    """
    if pfad.startswith(FREMDE_BAEUME):
        return True
    if "40 Zeichen hex" in was:
        treffer = re.search(r"\b[0-9a-f]{40}\b", zeile).group(0)
        # Immer dasselbe Zeichen: ein Platzhalter, kein Schluessel. Genutzt,
        # um den 401-Pfad zu pruefen.
        if len(set(treffer)) <= 2:
            return True
        # In einer Adresse: ein Git-Objektname, kein Geheimnis.
        if re.search(r"https?://\S*" + treffer, zeile):
            return True
        # In der Dokumentation genannte Commits.
        if pfad.endswith(".md") and ("commit" in zeile.lower() or "`" in zeile):
            return True
    return False


def versionierte_dateien():
    lauf = subprocess.run(["git", "ls-files"], cwd=WURZEL, capture_output=True, text=True)
    if lauf.returncode:
        print("  FEHLER  git ls-files nicht ausfuehrbar")
        sys.exit(1)
    return [p for p in lauf.stdout.split("\n") if p]


def ignoriert(pfad: str) -> bool:
    lauf = subprocess.run(["git", "check-ignore", "-q", pfad], cwd=WURZEL)
    return lauf.returncode == 0


def main() -> int:
    print("Geheimnisse in versionierten Dateien")
    fehler = []

    for pfad in NIE_VERSIONIERT:
        if pfad in versionierte_dateien():
            fehler.append(f"{pfad} ist versioniert")
        elif (WURZEL / pfad).exists() and not ignoriert(pfad):
            fehler.append(f"{pfad} liegt da, wird aber von .gitignore nicht erfasst")
    print(f"  ok      {len(NIE_VERSIONIERT)} Geheimnisdateien geprueft")

    geprueft = 0
    for pfad in versionierte_dateien():
        datei = WURZEL / pfad
        if not datei.is_file() or datei.suffix.lower() in {".png", ".ico", ".woff2", ".jpg", ".pdf"}:
            continue
        try:
            inhalt = datei.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        geprueft += 1
        for nr, zeile in enumerate(inhalt.split("\n"), 1):
            for muster, was in MUSTER:
                if not muster.search(zeile):
                    continue
                if harmlos(pfad, zeile, was):
                    continue
                fehler.append(f"{pfad}:{nr} – {was}")
    print(f"  ok      {geprueft} Dateien durchsucht")

    if fehler:
        print()
        for f in fehler:
            print(f"  FEHLER  {f}")
        print(f"\n{len(fehler)} Fund(e). Ist es echt: Schluessel wechseln, dann entfernen.")
        print("Ist es eine Testvorgabe: aus Teilen bauen, statt sie als Ganzes hinzuschreiben.")
        return 1

    print("\nNichts Geheimes in den versionierten Dateien")
    return 0


if __name__ == "__main__":
    sys.exit(main())
