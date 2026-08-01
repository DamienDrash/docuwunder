#!/usr/bin/env python3
"""Prueft, ob jeder Wert, den die Bildschirme lesen, auch aus renderVals kommt.

Die Bildschirme unter vorlage/ greifen ausschliesslich ueber `v` auf Werte zu -
`v.docsCountLabel`, `v.showDoc` und so fort. Fehlt so ein Schluessel in
renderVals, faellt das weder bei `node --check` noch beim Laden auf: die Stelle
bleibt im Browser einfach leer, oder es steht "undefined" auf dem Schirm.

Genau das ist zweimal passiert und erst auf einem Screenshot aufgefallen. Diese
Pruefung findet es in Millisekunden.

Geprueft wird in beide Richtungen:
  - jeder v.NAME der Bildschirme hat einen Schluessel in renderVals
  - jeder Schluessel in renderVals wird von einem Bildschirm auch gelesen

Schleifenvariablen (d.titel in einer map-Schleife) sind nicht qualifiziert und
tauchen hier deshalb gar nicht erst auf - der Konverter unterscheidet das
bereits (tools/konvert.py).

renderVals liefert kein einzelnes Objektliteral mehr, sondern legt die
Abschnitte (valsRahmen, valsSheets, ...) zusammen. Geprueft wird deshalb jeder
Abschnitt, den renderVals nennt. Findet sich einer davon nicht - oder gibt es in
app.js einen vals-Abschnitt, den renderVals gar nicht zusammenlegt -, ist das
ein Fehler: sonst wuerde die Pruefung stillschweigend loecherig, und genau das
soll sie ja verhindern.

Aufruf: python3 tests/template_check.py
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VORLAGEN = sorted((ROOT / "vorlage").glob("*.js")) + [ROOT / "vorlage.js"]
LOGIK = ROOT / "app.js"

# v.name oder v.name.tiefer - nur der erste Bezeichner zaehlt.
ZUGRIFF = re.compile(r"\bv\.([A-Za-z_$][\w$]*)")


def objekt_schluessel(quelle: str, start: int) -> set:
    """Die Schluessel auf oberster Ebene des Objektliterals ab `start`."""
    # Zeichenweise bis zur schliessenden Klammer der Rueckgabe, damit
    # verschachtelte Objekte, Zeichenketten und Funktionen nicht stoeren.
    i = quelle.index("{", start)
    tiefe, j, in_str, escape = 0, i, None, False
    while j < len(quelle):
        c = quelle[j]
        if in_str:
            if escape:
                escape = False
            elif c == "\\":
                escape = True
            elif c == in_str:
                in_str = None
        elif c in "\"'`":
            in_str = c
        elif c == "{":
            tiefe += 1
        elif c == "}":
            tiefe -= 1
            if tiefe == 0:
                break
        j += 1
    koerper = quelle[i + 1:j]

    # Schluessel auf oberster Ebene der Rueckgabe.
    schluessel, tiefe, in_str, escape, k = set(), 0, None, False, 0
    while k < len(koerper):
        c = koerper[k]
        if in_str:
            if escape:
                escape = False
            elif c == "\\":
                escape = True
            elif c == in_str:
                in_str = None
            k += 1
            continue
        if c in "\"'`":
            in_str = c
        elif c in "{[(":
            tiefe += 1
        elif c in "}])":
            tiefe -= 1
        elif tiefe == 0:
            m = re.match(r"([A-Za-z_$][\w$]*)\s*:", koerper[k:])
            if m and (k == 0 or koerper[k - 1] in ",\n\t {"):
                schluessel.add(m.group(1))
                k += m.end()
                continue
        k += 1
    return schluessel


def abschnitt_schluessel(quelle: str, name: str) -> set:
    """Die Schluessel eines einzelnen Abschnitts (valsRahmen, valsSheets, ...)."""
    m = re.search(r"\n  " + re.escape(name) + r"\s*\([^)]*\)\s*\{", quelle)
    if m is None:
        print(f"  FEHLER  Abschnitt {name}() steht nicht in app.js")
        sys.exit(1)
    start = quelle.find("return {", m.end())
    if start < 0:
        print(f"  FEHLER  Abschnitt {name}() gibt kein Objekt zurueck")
        sys.exit(1)
    return objekt_schluessel(quelle, start)


def render_vals_schluessel(quelle: str) -> set:
    """Alles, was renderVals liefert - ueber die Abschnitte, die es zusammenlegt."""
    pos = quelle.find("renderVals()")
    if pos < 0:
        return set()
    ende = quelle.find("\n  }", pos)
    kopf = quelle[pos:ende if ende > 0 else len(quelle)]
    genutzt = re.findall(r"this\.(vals[A-Za-z_$][\w$]*)\s*\(", kopf)
    if not genutzt:
        # Ein einzelnes Literal, wie vor der Aufteilung.
        start = quelle.find("return {", pos)
        return objekt_schluessel(quelle, start) if start >= 0 else set()

    # Ein Abschnitt, den renderVals nicht zusammenlegt, liefert nichts an die
    # Bildschirme - dann stimmt entweder der Name oder die Liste nicht.
    vergessen = sorted(set(re.findall(r"\n  (vals[A-Za-z_$][\w$]*)\s*\(", quelle)) - set(genutzt))
    if vergessen:
        print("  FEHLER  Abschnitt(e) ohne Anschluss an renderVals: " + ", ".join(vergessen))
        sys.exit(1)

    schluessel = set()
    for name in genutzt:
        schluessel |= abschnitt_schluessel(quelle, name)
    return schluessel


fehler = 0
print("Werte der Bildschirme")

if not LOGIK.exists():
    print(f"  fehlt   {LOGIK.name}")
    sys.exit(1)

geliefert = render_vals_schluessel(LOGIK.read_text(encoding="utf-8"))
if not geliefert:
    print("  FEHLER  renderVals in app.js nicht auswertbar")
    sys.exit(1)

gelesen = {}
for pfad in VORLAGEN:
    if not pfad.exists():
        print(f"  fehlt   {pfad.relative_to(ROOT)}")
        fehler += 1
        continue
    for name in ZUGRIFF.findall(pfad.read_text(encoding="utf-8")):
        gelesen.setdefault(name, set()).add(pfad.name)

offen = sorted(set(gelesen) - geliefert)
ungenutzt = sorted(geliefert - set(gelesen))

if offen:
    fehler += 1
    print(f"  FEHLER  {len(offen)} Wert(e) werden gelesen, aber nicht geliefert:")
    for n in offen:
        print(f"          v.{n}  (in {', '.join(sorted(gelesen[n]))})")
else:
    print(f"  ok      {len(gelesen)} gelesene Werte, alle aus renderVals")

if ungenutzt:
    # Kein Fehler, aber ein Hinweis: solche Schluessel werden bei jedem Render
    # berechnet, ohne dass sie jemand liest.
    print(f"  Hinweis {len(ungenutzt)} Schluessel aus renderVals liest niemand:")
    for n in ungenutzt[:12]:
        print(f"          {n}")
    if len(ungenutzt) > 12:
        print(f"          … und {len(ungenutzt) - 12} weitere")

print()
if fehler:
    print("Es fehlen Werte")
    sys.exit(1)
print("Alle gelesenen Werte sind belegt")
