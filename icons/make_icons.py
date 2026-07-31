#!/usr/bin/env python3
"""Erzeugt die App-Symbole aus einer Beschreibung statt aus Bilddateien.

Das Projekt hat bewusst keinen Build-Schritt. Symbole sind aber Binaerdateien:
waeren sie nur eingecheckt, liesse sich spaeter nicht mehr nachvollziehen, wie
sie zustande kamen, und eine Farb- oder Formaenderung waere Handarbeit in einem
Bildprogramm. Deshalb steht die Zeichnung hier als Code; die PNGs daneben sind
sein Ergebnis und werden mitversioniert, damit die App ohne Python auskommt.

    python3 icons/make_icons.py

Drei Zuschnitte, weil die Systeme drei verschiedene Dinge damit tun:

  icon-…            frei stehend, mit eigenen runden Ecken (Android-Launcher,
                    Aufgabenleisten, Installationsdialog).
  icon-maskable-…   randlos; das System schneidet eine beliebige Form heraus
                    (Kreis, Squircle, Tropfen). Das Motiv sitzt deshalb klein
                    in der Mitte, innerhalb der garantiert sichtbaren Zone.
  apple-touch-icon  randlos, aber mit dem Motiv in voller Groesse: iOS legt nur
                    seine eigene, leichte Rundung darueber und mag keine
                    Transparenz.
"""
import pathlib

from PIL import Image, ImageDraw

HIER = pathlib.Path(__file__).resolve().parent

# Gezeichnet wird immer in diesem Raster und danach heruntergerechnet - so
# bekommen die Kanten ihre Glaettung, ohne dass ein Zeichenbefehl davon weiss.
RASTER = 1024
UEBER = 4

# Die Akzentfarbe der Oberflaeche (--acc im Hellmodus).
BLAU = (0, 122, 255)
BLAU_TIEF = (0, 96, 214)
PAPIER = (255, 255, 255)
FALZ = (186, 214, 250)
ZEILE = (170, 202, 240)


def grund(d: ImageDraw.ImageDraw, kante: int, radius: int) -> None:
    """Verlaufsflaeche als Hintergrund, optional mit runden Ecken."""
    # Der Verlauf entsteht aus waagerechten Linien; ein echter Gradient ist in
    # PIL nicht vorgesehen und waere hier auch nicht mehr zu erkennen.
    for y in range(kante):
        t = y / max(kante - 1, 1)
        farbe = tuple(round(a + (b - a) * t) for a, b in zip(BLAU, BLAU_TIEF))
        d.line([(0, y), (kante, y)], fill=farbe + (255,))
    if radius > 0:
        # Ecken wieder frei stellen: die Maske traegt die Rundung.
        maske = Image.new("L", (kante, kante), 0)
        ImageDraw.Draw(maske).rounded_rectangle([0, 0, kante - 1, kante - 1], radius=radius, fill=255)
        return maske
    return None


def blatt(d: ImageDraw.ImageDraw, mitte: float, groesse: float) -> None:
    """Ein Blatt Papier mit umgeschlagener Ecke, zentriert um `mitte`."""
    def p(x, y):
        return (mitte + x * groesse, mitte + y * groesse)

    # Koordinaten relativ zur Bildmitte, in Anteilen der Motivgroesse.
    li, re, ob, un, falz = -0.21, 0.21, -0.29, 0.29, 0.15

    d.polygon([p(li, ob), p(re - falz, ob), p(re, ob + falz), p(re, un), p(li, un)], fill=PAPIER)
    d.polygon([p(re - falz, ob), p(re, ob + falz), p(re - falz, ob + falz)], fill=FALZ)

    # Drei Textzeilen; die oberste ist kuerzer, damit sie unter dem Falz bleibt.
    staerke = 0.032 * groesse
    for i, (von, bis) in enumerate([(-0.13, 0.04), (-0.13, 0.13), (-0.13, 0.13)]):
        y = mitte + (0.02 + i * 0.10) * groesse
        d.rounded_rectangle(
            [mitte + von * groesse, y - staerke / 2, mitte + bis * groesse, y + staerke / 2],
            radius=staerke / 2, fill=ZEILE,
        )


def zeichne(kante: int, radius_anteil: float, motiv: float) -> Image.Image:
    gross = RASTER * UEBER
    bild = Image.new("RGBA", (gross, gross), (0, 0, 0, 0))
    d = ImageDraw.Draw(bild)
    maske = grund(d, gross, round(gross * radius_anteil))
    blatt(d, gross / 2, gross * motiv)
    if maske is not None:
        bild.putalpha(maske)
    return bild.resize((kante, kante), Image.LANCZOS)


# (Datei, Kantenlaenge, Eckradius als Anteil der Kante, Motivgroesse als Anteil)
#
# Beim maskierbaren Symbol steht das Motiv auf 0.62 statt 1.0: sichtbar
# garantiert ist nur der innere Kreis mit 80 % Durchmesser, alles darueber
# hinaus kann das System wegschneiden.
BILDER = [
    ("icon-192.png", 192, 0.22, 1.0),
    ("icon-512.png", 512, 0.22, 1.0),
    ("icon-maskable-192.png", 192, 0.0, 0.62),
    ("icon-maskable-512.png", 512, 0.0, 0.62),
    ("apple-touch-icon-180.png", 180, 0.0, 1.0),
]


def main() -> None:
    for name, kante, radius, motiv in BILDER:
        bild = zeichne(kante, radius, motiv)
        if name.startswith("apple-") or "maskable" in name:
            # Randlos heisst auch: keine Transparenz. iOS legt sonst Schwarz
            # unter die Ecken.
            flach = Image.new("RGB", bild.size, BLAU)
            flach.paste(bild, mask=bild.split()[3])
            flach.save(HIER / name, "PNG", optimize=True)
        else:
            bild.save(HIER / name, "PNG", optimize=True)
        print(f"  {name}  {kante}x{kante}")


if __name__ == "__main__":
    main()
