#!/usr/bin/env python3
"""Prueft, was die App als installierbare PWA zusagt.

Ein Manifest und ein Service Worker fallen nicht auf, wenn sie kaputt sind: die
App laeuft im Browser weiter wie zuvor, sie laesst sich nur nicht mehr
installieren oder startet ohne Netz nicht mehr. Beides merkt man erst am
Telefon, im Flugmodus, ohne Werkzeuge. Deshalb hier.

Geprueft wird das, was auseinanderlaufen kann:

  * das Manifest gegen die Dateien, die es verspricht (Symbole, Groessen),
  * die Kurzbefehle gegen die Ziele, die die Komponente kennt,
  * die Liste der Huelle in sw.js gegen die Platte,
  * und gegen das, was index.html tatsaechlich laedt - eine neue Datei im
    Einstiegspunkt, die niemand in die Huelle eingetragen hat, faellt sonst
    erst offline auf.

Aufruf: python3 tests/pwa_check.py
"""
import json
import pathlib
import re
import struct
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
# Unter dieser Adresse liefert Caddy die App aus; start_url und scope muessen
# darin liegen, sonst startet die installierte App woanders.
BASIS = "https://beispiel.invalid/paperless-app/"

fehler = []


def pruefe(bedingung, meldung, hinweis="", grund=""):
    """`hinweis` steht immer dabei, `grund` nur, wenn die Pruefung fehlschlaegt.

    Sonst liest sich eine bestandene Pruefung wie ihr eigener Widerspruch:
    „trifft ein Ziel, das die App kennt - kommt in startZiel() nicht vor".
    """
    if bedingung:
        print(f"  ok      {meldung}" + (f" – {hinweis}" if hinweis else ""))
    else:
        fehler.append(meldung)
        nach = grund or hinweis
        print(f"  FEHLER  {meldung}" + (f": {nach}" if nach else ""))


def png_groesse(pfad: pathlib.Path):
    """Kantenlaengen aus dem IHDR-Block - ohne Bildbibliothek."""
    kopf = pfad.read_bytes()[:24]
    if kopf[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">II", kopf[16:24])


def datei_zu(url: str):
    """Adresse aus Manifest oder Worker auf die Datei auf der Platte abbilden."""
    voll = urllib.parse.urljoin(BASIS, url)
    if not voll.startswith(BASIS):
        return None
    rest = urllib.parse.urlparse(voll).path[len("/paperless-app/"):] or "index.html"
    return ROOT / urllib.parse.unquote(rest)


# --- Manifest ---------------------------------------------------------------
print("Manifest")
mf_pfad = ROOT / "manifest.webmanifest"
manifest = {}
if not mf_pfad.exists():
    pruefe(False, "manifest.webmanifest vorhanden")
else:
    try:
        manifest = json.loads(mf_pfad.read_text(encoding="utf-8"))
        pruefe(True, "manifest.webmanifest ist gueltiges JSON")
    except json.JSONDecodeError as e:
        pruefe(False, "manifest.webmanifest ist gueltiges JSON", str(e))

if manifest:
    for feld in ("name", "short_name", "start_url", "scope", "display", "icons", "theme_color", "background_color"):
        pruefe(feld in manifest, f"Manifest nennt {feld}")

    pruefe(manifest.get("display") in ("standalone", "fullscreen", "minimal-ui"),
           "display ist ein eigenstaendiger Modus", str(manifest.get("display")))

    for feld in ("start_url", "scope"):
        wert = manifest.get(feld, "")
        voll = urllib.parse.urljoin(BASIS, wert)
        pruefe(voll.startswith(BASIS), f"{feld} liegt im Auslieferungspfad", f"{wert} -> {voll}")

    symbole = manifest.get("icons", [])
    zwecke = set()
    for sym in symbole:
        quelle, groesse = sym.get("src", ""), sym.get("sizes", "")
        zwecke.update((sym.get("purpose") or "any").split())
        pfad = datei_zu(quelle)
        if pfad is None or not pfad.is_file():
            pruefe(False, f"Symbol {quelle} liegt auf der Platte")
            continue
        tat = png_groesse(pfad)
        soll = tuple(int(x) for x in groesse.lower().split("x")) if re.fullmatch(r"\d+x\d+", groesse) else None
        pruefe(tat is not None and soll is not None and tat == soll,
               f"Symbol {quelle} ist {groesse}", grund=f"tatsaechlich {tat}")

    # 'any' wird unveraendert angezeigt, 'maskable' vom System beschnitten -
    # ein Symbol kann nicht beides gut sein, deshalb braucht es beide.
    pruefe("any" in zwecke, "es gibt ein frei stehendes Symbol (purpose any)")
    pruefe("maskable" in zwecke, "es gibt ein beschneidbares Symbol (purpose maskable)")
    pruefe(any(s.get("sizes") == "512x512" for s in symbole),
           "es gibt ein Symbol mit 512x512", grund="kleiner nimmt der Installationsdialog nicht")

    # Die App hat genau ein Fenster und raeumt ihr ?tab= nach dem Start weg.
    # Ohne diese Angabe oeffnet ein Kurzbefehl daneben ein zweites - zwei
    # Fenster derselben App, die nichts voneinander wissen.
    pruefe(manifest.get("launch_handler", {}).get("client_mode") == "navigate-existing",
           "ein Kurzbefehl benutzt das offene Fenster",
           grund=str(manifest.get("launch_handler")))

# --- Kurzbefehle gegen die Komponente ---------------------------------------
print("\nKurzbefehle")
komponente = (ROOT / "mobile.dc.html").read_text(encoding="utf-8")
m = re.search(r"\n  startZiel\(\) \{(.*?)\n  \}\n", komponente, re.S)
if not m:
    pruefe(False, "startZiel() in mobile.dc.html gefunden",
           grund="ohne die Methode laesst sich nicht pruefen, welche Ziele die App kennt")
else:
    quelle = m.group(1)
    kurz = manifest.get("shortcuts", [])
    if not kurz:
        print("  --      keine Kurzbefehle angegeben")
    for k in kurz:
        url = k.get("url", "")
        pfad = datei_zu(url)
        pruefe(pfad is not None, f"Kurzbefehl „{k.get('name')}“ zeigt in den Auslieferungspfad", url)
        ziel = urllib.parse.parse_qs(urllib.parse.urlparse(urllib.parse.urljoin(BASIS, url)).query).get("tab", [None])[0]
        pruefe(ziel is not None and f"'{ziel}'" in quelle,
               f"Kurzbefehl „{k.get('name')}“ trifft ein Ziel, das die App kennt",
               grund=f"tab={ziel} kommt in startZiel() nicht vor")

# --- Service Worker ---------------------------------------------------------
print("\nService Worker")
sw_pfad = ROOT / "sw.js"
huelle = []
if not sw_pfad.exists():
    pruefe(False, "sw.js vorhanden")
else:
    sw = sw_pfad.read_text(encoding="utf-8")
    m = re.search(r"const HUELLE = \[(.*?)\];", sw, re.S)
    pruefe(m is not None, "sw.js nennt eine Huelle (HUELLE)")
    if m:
        huelle = re.findall(r"'([^']+)'", m.group(1))
        pruefe(bool(huelle), "die Huelle ist nicht leer", f"{len(huelle)} Eintraege")
        for eintrag in huelle:
            pfad = datei_zu(eintrag)
            pruefe(pfad is not None and pfad.is_file(), f"Huelle: {eintrag} liegt auf der Platte")

    # Die API darf nicht in den Cache: sie enthaelt Dokumente, und eine alte
    # Liste waere eine Aussage ueber den Bestand, die der Server nicht deckt.
    pruefe("/paperless/" not in "".join(huelle), "die Huelle enthaelt keine API-Antworten")
    pruefe(re.search(r"caches\.delete", sw) is not None,
           "alte Caches werden verworfen", grund="sonst waechst der Speicher mit jeder Fassung")

# --- Einstiegspunkt ---------------------------------------------------------
print("\nEinstiegspunkt")
index = (ROOT / "index.html").read_text(encoding="utf-8")
pruefe('rel="manifest"' in index, "index.html verweist auf das Manifest")
pruefe('rel="apple-touch-icon"' in index, "index.html nennt ein Symbol fuer iOS")
pruefe('name="theme-color"' in index, "index.html nennt eine theme-color")
pruefe("apple-mobile-web-app-capable" in index, "index.html erlaubt den eigenstaendigen Modus auf iOS")
pruefe("serviceWorker" in index and "sw.js" in index, "index.html meldet den Service Worker an")
pruefe("viewport-fit=cover" in index,
       "index.html fordert den ganzen Bildschirm an", grund="sonst meldet das System keine safe-area-Werte")

# theme-color faerbt im installierten Zustand die Leiste des Systems ueber der
# App. Im Kopf steht sie je Systemschema - wer in den App-Einstellungen
# ausdruecklich Hell oder Dunkel waehlt, bekaeme sonst eine Leiste, die zum
# System passt statt zur Oberflaeche davor.
pruefe('onDark="{{ onDark }}"' in index and 'meta[name="theme-color"]' in index,
       "die Leiste folgt dem Schema der App, nicht dem des Systems",
       grund="index.html schreibt die theme-color nicht um")

# Die Farben stehen zweimal da: als Angabe im Kopf und als Konstante fuer das
# Umschreiben. Laufen sie auseinander, springt die Leiste beim Start.
kopf = set(re.findall(r'<meta name="theme-color" content="(#[0-9A-Fa-f]{6})"', index))
um = set(re.findall(r"const LEISTE_(?:HELL|DUNKEL) = '(#[0-9A-Fa-f]{6})'", index))
pruefe(len(kopf) == 2 and kopf == um, "Kopf und Umschaltung nennen dieselben Farben",
       grund=f"Kopf {sorted(kopf)}, Umschaltung {sorted(um)}")

pruefe("env(safe-area-inset-bottom" in komponente,
       "die Oberflaeche weicht dem Bereich des Systems aus",
       grund="sonst liegt die Tableiste auf dem Streifen der Home-Geste")

# Alles, was der Einstiegspunkt selbst laedt, muss auch offline da sein.
geladen = set(re.findall(r'(?:src|href)="(\./[^"]+)"', index))
# Das Manifest und die Symbole holt das System beim Installieren, nicht beim
# Starten - sie muessen nicht in der Huelle stehen, um die App lauffaehig zu halten.
noetig = {p for p in geladen if not p.startswith("./icons/") and p != "./manifest.webmanifest"}
fehlend = sorted(noetig - set(huelle))
pruefe(not fehlend, "index.html laedt nichts, was der Huelle fehlt", grund=", ".join(fehlend))

# Die Komponente holt sich das Runtime zur Laufzeit nach (dc-import).
pruefe("./mobile.dc.html" in huelle, "die Oberflaeche selbst steht in der Huelle")

print()
if fehler:
    print(f"{len(fehler)} Pruefung(en) fehlgeschlagen")
    sys.exit(1)
print("Manifest, Service Worker und Einstiegspunkt passen zusammen")
