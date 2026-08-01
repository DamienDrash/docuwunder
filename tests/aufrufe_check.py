#!/usr/bin/env python3
"""Trifft jeder Aufruf im Zustand eine Methode, die es gibt?

    python3 tests/aufrufe_check.py

Diese Stufe existiert wegen eines konkreten Fehlers. Die Knoepfe "Foto" und
"Datei" riefen `this.dateiWaehlen(...)` auf - eine Methode, die nirgends
definiert war. Jeder Klick warf "this.dateiWaehlen is not a function", still
in die Konsole, ohne sichtbare Wirkung. Die Knoepfe waren da, sie sahen richtig
aus, und sie taten nichts.

Warum keine der vorhandenen Stufen das gefunden hat:

  - Syntaxpruefung: die Datei ist syntaktisch tadellos.
  - Vorlagenpruefung: `pickPhoto` wird von renderVals geliefert und vom
    Bildschirm gelesen - die Bindung stimmt. Was *hinter* der Bindung liegt,
    sieht sie nicht.
  - Browserpruefung: sie klickte diese beiden Knoepfe nicht.

Ein Fehler, den React nicht einmal anzeigt: Ausnahmen in Ereignisbehandlungen
fangen keine Fehlergrenzen ab, sie landen nur in der Konsole. Genau die Sorte
Attrappe, gegen die dieses Projekt sonst schon zweimal antreten musste.

Geprueft wird deshalb statisch: jedes `this.name(` muss eine Definition haben -
gleich, ob sie in der Klasse selbst steht oder ueber Object.assign aus einem
Sachgebiet an den Prototyp kommt.
"""
import pathlib
import re
import sys

WURZEL = pathlib.Path(__file__).resolve().parent.parent

# React bringt diese mit; sie stehen in keiner unserer Dateien.
GEERBT = {"setState", "forceUpdate", "render"}


def definitionen(quelle: str) -> set:
    """Namen aller Methoden - in einer Klasse wie in einem methoden-Objekt.

    Beide sehen gleich aus (`name(args) {`), stehen aber verschieden tief
    eingerueckt. Die Einrueckung ist daher egal; entscheidend ist, dass ein
    Bezeichner mit Klammerpaar und oeffnender geschweifter Klammer am
    Zeilenanfang steht - ein Aufruf haette dort ein `this.` oder ein
    Zuweisungszeichen davor.
    """
    return set(re.findall(r"^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{", quelle, re.M))


def main() -> int:
    print("Aufrufe im Zustand")

    # app.js ruft auf; die Sachgebiete steuern Methoden bei, die per
    # Object.assign an denselben Prototyp gehen.
    beitraege = [WURZEL / "app.js"] + sorted(
        p for p in WURZEL.glob("*.js") if re.search(r"\bmethoden\s*:", p.read_text(encoding="utf-8"))
    )
    vorhanden = set()
    for p in beitraege:
        vorhanden |= definitionen(p.read_text(encoding="utf-8"))

    quelle = (WURZEL / "app.js").read_text(encoding="utf-8")
    aufrufe = {}
    for m in re.finditer(r"this\.([A-Za-z_$][\w$]*)\s*\(", quelle):
        aufrufe.setdefault(m.group(1), []).append(quelle[: m.start()].count("\n") + 1)

    fehlend = {k: v for k, v in aufrufe.items() if k not in vorhanden and k not in GEERBT}

    quellen = ", ".join(p.name for p in beitraege)
    print(f"  ok      {len(vorhanden)} Methoden aus {quellen}")
    if fehlend:
        for name, zeilen in sorted(fehlend.items()):
            stellen = ", ".join(str(z) for z in zeilen[:5])
            print(f"  FEHLER  this.{name}() ist nirgends definiert – Zeile {stellen}")
        print(f"\n{len(fehlend)} Aufrufe gehen ins Leere")
        return 1

    print(f"  ok      {len(aufrufe)} verschiedene Aufrufe, alle treffen eine Methode")
    print("\nJeder Aufruf trifft eine Methode")
    return 0


if __name__ == "__main__":
    sys.exit(main())
