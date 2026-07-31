#!/usr/bin/env python3
"""Prueft, ob jede Template-Bindung einen Wert aus renderVals hat.

Die DC-Vorlagen binden Werte als {{ name }}. Fehlt der Name in renderVals,
faellt das weder bei `node --check` noch beim Laden auf - die Stelle bleibt
im Browser einfach leer. Genau das passiert leicht, wenn Logik umgebaut und
eine Bindung dabei umbenannt wird.

Geprueft wird in beide Richtungen:
  - jede Bindung im Template hat einen Schluessel in renderVals
  - jeder Schluessel in renderVals wird im Template auch benutzt

Namen mit Punkt (r.titel) gehoeren zur Laufvariablen eines sc-for und werden
gegen deren `as`-Namen geprueft, nicht gegen renderVals.

Aufruf: python3 tests/template_check.py
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATEIEN = ["mobile.dc.html", "index.html", "design/iphone.html"]

BINDUNG = re.compile(r"\{\{\s*([A-Za-z_$][\w$]*)((?:\.[\w$]+)*)\s*\}\}")
SC_FOR_AS = re.compile(r'<sc-for\b[^>]*\bas="([^"]+)"', re.I)
SKRIPT = re.compile(r"<script[^>]*\bdata-dc-script\b[^>]*>(.*?)</script>", re.S | re.I)
# Der Rumpf von renderVals: vom `return {` bis zur schliessenden Klammer auf
# derselben Einrueckung - oder einzeilig.
RETURN_BLOCK = re.compile(r"\n(\s*)return \{\n(.*?)\n\1\};", re.S)
RETURN_ZEILE = re.compile(r"\n\s*return \{(.*?)\};[ \t]*\n", re.S)
# Laufzeit-Hinweise fuer die Vorschau, keine Datenbindungen.
HINT_ATTR = re.compile(r'\bhint-[\w-]+="[^"]*"')

# Bindungen, die das Laufzeitsystem selbst aufloest, nicht die Komponente.
EINGEBAUT = {"farbschema", "isDark", "start", "onDark"}


def schluessel_aus_render_vals(quelle: str) -> set:
    """Namen der obersten Ebene aus dem von renderVals gelieferten Objekt."""
    pos = quelle.find("renderVals()")
    if pos < 0:
        return set()
    m = RETURN_BLOCK.search(quelle, pos)
    rumpf = m.group(2) if m else None
    if rumpf is None:
        m = RETURN_ZEILE.search(quelle, pos)
        if not m:
            return set()
        rumpf = m.group(1)
    namen = set()
    tiefe = 0
    # Ein Schluessel steht immer am Anfang des Objekts oder nach einem Komma
    # auf Tiefe 0. Verschachtelte Objekte (etwa themeVars) und alles in
    # Zeichenketten oder Kommentaren bleiben aussen vor.
    neuer_eintrag = True
    # Positionen, nach denen ein / einen regulaeren Ausdruck beginnt und keine
    # Division ist. Ohne diese Unterscheidung liest der Scanner das // in
    # /^https?:\/\// als Zeilenkommentar und verliert den Rest der Zeile.
    REGEX_START = set("(,=:[!&|?{};+-*%~^")
    letztes = None
    i = 0
    while i < len(rumpf):
        c = rumpf[i]
        if c == "/" and i + 1 < len(rumpf) and rumpf[i + 1] == "/":
            i = rumpf.find("\n", i)
            if i < 0:
                break
            continue
        if c == "/" and (letztes is None or letztes in REGEX_START):
            i += 1
            while i < len(rumpf) and rumpf[i] != "/":
                i += 2 if rumpf[i] == "\\" else 1
            letztes = "/"
            neuer_eintrag = False
            i += 1
            continue
        if c in "{[(":
            tiefe += 1
            neuer_eintrag = False
        elif c in "}])":
            tiefe -= 1
            neuer_eintrag = False
        elif c in "'\"`":
            ende = c
            i += 1
            while i < len(rumpf) and rumpf[i] != ende:
                i += 2 if rumpf[i] == "\\" else 1
            neuer_eintrag = False
        elif c == "," and tiefe == 0:
            neuer_eintrag = True
        elif c in " \t\n":
            i += 1
            continue
        else:
            if tiefe == 0 and neuer_eintrag:
                m2 = re.match(r"([A-Za-z_$][\w$]*)\s*:", rumpf[i:])
                if m2:
                    namen.add(m2.group(1))
                    i += m2.end()
                    letztes = ":"
                    neuer_eintrag = False
                    continue
            neuer_eintrag = False
        letztes = c
        i += 1
    return namen


def pruefe(datei: str) -> int:
    pfad = ROOT / datei
    if not pfad.exists():
        print(f"  fehlt   {datei}")
        return 1
    text = pfad.read_text(encoding="utf-8")

    bloecke = SKRIPT.findall(text)
    if not bloecke:
        print(f"  ok      {datei} (kein Komponenten-Skript)")
        return 0
    schluessel = schluessel_aus_render_vals(bloecke[0])
    if not schluessel:
        print(f"  FEHLER  {datei}: renderVals liess sich nicht auswerten")
        return 1

    # Laufvariablen der Schleifen; ihre Felder werden hier nicht geprueft,
    # weil sie erst zur Laufzeit entstehen.
    schleifen = set(SC_FOR_AS.findall(text))

    vorlage = HINT_ATTR.sub("", SKRIPT.sub("", text))
    benutzt, fehlend = set(), set()
    for name, rest in BINDUNG.findall(vorlage):
        if name in schleifen or name in EINGEBAUT:
            continue
        if rest:
            # Punktzugriff auf etwas, das keine Laufvariable ist.
            fehlend.add(name + rest + " (kein Schleifenwert)")
            continue
        benutzt.add(name)
        if name not in schluessel:
            fehlend.add(name)

    ungenutzt = {k for k in schluessel if k not in benutzt} - EINGEBAUT

    if not fehlend and not ungenutzt:
        print(f"  ok      {datei} ({len(benutzt)} Bindungen)")
        return 0

    print(f"  FEHLER  {datei}")
    for n in sorted(fehlend):
        print(f"          fehlt in renderVals: {n}")
    for n in sorted(ungenutzt):
        print(f"          nie im Template benutzt: {n}")
    return 1


print("Template-Bindungen")
fehler = sum(pruefe(d) for d in DATEIEN)
print()
if fehler:
    print(f"{fehler} Datei(en) mit Fehlern")
    sys.exit(1)
print("Alle Bindungen aufgeloest")
