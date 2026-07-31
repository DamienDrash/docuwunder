"""Übersetzt die DC-Vorlage nach htm.

Mechanisch statt von Hand: 1.397 Zeilen mit 145 sc-if, 46 sc-for und 659
Bindungen umzuschreiben wäre fehleranfällig und nicht nachvollziehbar. Ein
Konverter wendet dieselbe Regel überall gleich an und lässt sich prüfen.

Regeln:
    {{ x }} im Text          ->  ${v.x}
    attr="{{ x }}"           ->  attr=${v.x}
    style="a:b;{{ x }}"      ->  style=${stil(`a:b;${v.x}`)}
    style="a:b"              ->  style=${stil('a:b')}
    <sc-if value="{{ x }}">  ->  ${v.x ? html`…` : null}
    <sc-for list="{{ xs }}" as="d">  ->  ${(v.xs || []).map((d, dIdx) => html`…`)}

Werte aus renderVals werden mit `v.` qualifiziert, Schleifenvariablen nicht.
Deshalb führt der Konverter die Sichtbarkeit der Aliase mit: innerhalb einer
sc-for-Schleife ist `d` die Laufvariable, außerhalb wäre es ein Wert aus
renderVals. Ein pauschales Voranstellen würde genau das verwechseln.

Aufruf:
    python3 tools/konvert.py mobile.dc.html vorlage.js
"""
import pathlib
import re
import sys

# Attribute, die nur der Entwurfsmodus des alten Runtimes brauchte.
WEG = re.compile(r'\s(?:hint-placeholder-\w+|hint-size|component-from-global-scope)="[^"]*"')

# Werte, die keine Bindung an renderVals sind.
LITERALE = {"true", "false", "null", "undefined", "this"}

VOID = ("br", "img", "input", "link", "hr", "meta")


def qualifiziere(ausdruck, aliase):
    """Wurzelbezeichner mit `v.` versehen, sofern er kein Schleifenalias ist."""
    a = ausdruck.strip()
    wurzel = re.split(r"[.\[]", a, 1)[0]
    if wurzel in aliase or wurzel in LITERALE:
        return a
    return "v." + a


def attribut(name, wert, aliase):
    voll = re.fullmatch(r"\{\{\s*(.+?)\s*\}\}", wert.strip())

    def innen(text):
        return re.sub(r"\{\{\s*(.+?)\s*\}\}",
                      lambda m: "${" + qualifiziere(m.group(1), aliase) + "}", text)

    if name == "style":
        if voll:
            # Reine Bindung: kann Objekt oder Zeichenkette sein, stil() nimmt beides.
            return "style=${stil(" + qualifiziere(voll.group(1), aliase) + ")}"
        if "{{" in wert:
            return "style=${stil(`" + innen(wert) + "`)}"
        return "style=${stil('" + wert.replace("\\", "\\\\").replace("'", "\\'") + "')}"

    if voll:
        return name + "=${" + qualifiziere(voll.group(1), aliase) + "}"
    if "{{" in wert:
        return name + "=${`" + innen(wert) + "`}"
    return '%s="%s"' % (name, wert)


def attribute(roh, aliase):
    roh = WEG.sub("", roh)
    aus = [attribut(m.group(1), m.group(2), aliase)
           for m in re.finditer(r'([a-zA-Z_:][\w:.-]*)="([^"]*)"', roh)]
    return (" " + " ".join(aus)) if aus else ""


def finde_ende(text, start, tag):
    """Position des zugehörigen schliessenden Tags, verschachtelungssicher."""
    tiefe = 0
    for m in re.finditer(r"</?" + tag + r"\b", text[start:]):
        if text[start + m.start() + 1] == "/":
            tiefe -= 1
            if tiefe == 0:
                return start + m.start()
        else:
            tiefe += 1
    raise ValueError("kein schliessendes </%s>" % tag)


# htm dekodiert keine HTML-Entitaeten - anders als der Browser beim Parsen von
# HTML. Ein &amp; im Text stuende danach woertlich auf dem Schirm. Deshalb hier
# aufloesen; die Vorlage ist ab jetzt JavaScript, nicht mehr HTML.
ENTITAETEN = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'",
    "&apos;": "'", "&nbsp;": "\u00a0", "&shy;": "\u00ad", "&hellip;": "…",
    "&ndash;": "–", "&mdash;": "—", "&laquo;": "«", "&raquo;": "»",
    "&bdquo;": "„", "&ldquo;": "“", "&rdquo;": "”", "&szlig;": "ß",
}


def entitaeten(text):
    for e, z in ENTITAETEN.items():
        text = text.replace(e, z)
    # Numerische Entitaeten, dezimal wie hexadezimal.
    text = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), text)
    text = re.sub(r"&#x([0-9a-fA-F]+);", lambda m: chr(int(m.group(1), 16)), text)
    return text


def einfaches(text, aliase):
    """Ein Stück ohne Steuerelemente: Tags, Attribute, Bindungen, Void-Tags."""
    text = entitaeten(text)
    def tag(m):
        return "<" + m.group(1) + attribute(m.group(2), aliase) + m.group(3)
    text = re.sub(r"<(\w[\w-]*)((?:\s+[a-zA-Z_:][\w:.-]*=\"[^\"]*\")*)\s*(/?>)", tag, text)
    text = re.sub(r"\{\{\s*(.+?)\s*\}\}",
                  lambda m: "${" + qualifiziere(m.group(1), aliase) + "}", text)
    for v in VOID:
        text = re.sub(r"(<" + v + r"\b[^>]*?)(?<!/)>", r"\1 />", text)
    return text


def einfuege_key(rumpf, v):
    """React braucht je Schleifeneintrag einen stabilen Schlüssel."""
    m = re.match(r"<(\w+)((?:\s+[^>]*?)?)>", rumpf)
    if not m:
        return rumpf
    schluessel = " key=${%s && %s.id != null ? %s.id : %sIdx}" % (v, v, v, v)
    return "<" + m.group(1) + schluessel + m.group(2) + ">" + rumpf[m.end():]


def wandle(text, aliase=frozenset()):
    """Text mit Steuerelementen übersetzen; Aliase gelten für diese Ebene."""
    aus = []
    rest = text
    while True:
        m = re.search(r"<sc-(if|for)\b([^>]*)>", rest)
        if not m:
            aus.append(einfaches(rest, aliase))
            return "".join(aus)

        aus.append(einfaches(rest[:m.start()], aliase))
        art, attrs = m.group(1), m.group(2)
        ende = finde_ende(rest, m.start(), "sc-" + art)
        rumpf = rest[m.end():ende]
        rest = rest[ende + len("</sc-%s>" % art):]

        if art == "if":
            bed = re.search(r'value="\{\{\s*(.+?)\s*\}\}"', attrs)
            if not bed:
                raise ValueError("sc-if ohne value: " + attrs[:60])
            aus.append("${" + qualifiziere(bed.group(1), aliase)
                       + " ? html`" + wandle(rumpf.strip(), aliase) + "` : null}")
        else:
            liste = re.search(r'list="\{\{\s*(.+?)\s*\}\}"', attrs)
            alias = re.search(r'as="(\w+)"', attrs)
            if not (liste and alias):
                raise ValueError("sc-for ohne list/as: " + attrs[:60])
            v = alias.group(1)
            # Innerhalb der Schleife ist der Alias sichtbar und darf nicht
            # qualifiziert werden.
            innen = wandle(rumpf.strip(), aliase | {v})
            aus.append("${(" + qualifiziere(liste.group(1), aliase) + " || []).map(("
                       + v + ", " + v + "Idx) => html`" + einfuege_key(innen, v) + "`)}")



# --- Aufteilung ------------------------------------------------------------
# Die uebersetzte Vorlage ist ein einziger Baum. Fuer die Wartung wird sie in
# Bildschirme zerlegt: jeder ${v.X ? html`…` : null} auf oberster Ebene wird
# eine eigene Funktion. Damit ist wieder auffindbar, wo etwas steht - der
# eigentliche Zweck der Aufteilung.

# Zuordnung Bildschirm -> Datei. Was hier nicht steht, landet in sonstiges.js.
BEREICHE = {
    "tabs": ["tabHome", "tabDocs", "tabInbox", "tabMore", "tabbarOn", "selbarOn"],
    "dokument": ["showDoc", "docPaneEmpty", "showRev", "showSearch"],
    "ordnung": ["showOrg", "showListe", "showTrash"],
    "verwaltung": ["showSet", "showAuto", "showAutoD", "showMail", "showUsers",
                   "showTasks", "showStatus"],
    "sheets": ["sheetOn"],
    "erfassen": ["scanOn", "toastOn"],
    "onboarding": ["showOnb"],
}


def bloecke(text):
    """Alle ${v.X ? html`…` : null} dieser Ebene mit Position und Inhalt."""
    aus = []
    i = 0
    while i < len(text):
        if text.startswith("${", i):
            j, d = i + 2, 1
            while j < len(text) and d:
                if text[j] == "{":
                    d += 1
                elif text[j] == "}":
                    d -= 1
                j += 1
            stueck = text[i:j]
            m = re.match(r"\$\{v\.(\w+) \? html`", stueck)
            if m:
                aus.append((m.group(1), i, j, stueck))
            i = j
        else:
            i += 1
    return aus


def rumpf_von(stueck):
    """Den html`…`-Inhalt eines Blocks herausloesen."""
    anfang = stueck.index("html`") + len("html`")
    return stueck[anfang:stueck.rindex("` : null}")]


def teile(text, ziel_verzeichnis):
    """Schreibt je Bereich eine Datei und gibt die Wurzelvorlage zurueck."""
    ziel = pathlib.Path(ziel_verzeichnis)
    ziel.mkdir(parents=True, exist_ok=True)

    # showApp aufbrechen, seine Bildschirme sind die eigentlichen Einheiten.
    oberste = bloecke(text)
    teilstuecke = {}
    wurzel = text
    for name, a, b, stueck in reversed(oberste):
        if name == "showApp":
            innen = rumpf_von(stueck)
            for n2, a2, b2, st2 in reversed(bloecke(innen)):
                teilstuecke[n2] = rumpf_von(st2)
                innen = innen[:a2] + "${DWVorlage." + n2 + "(v, html, stil)}" + innen[b2:]
            wurzel = wurzel[:a] + "${v.showApp ? html`" + innen + "` : null}" + wurzel[b:]
        else:
            teilstuecke[name] = rumpf_von(stueck)
            wurzel = wurzel[:a] + "${DWVorlage." + name + "(v, html, stil)}" + wurzel[b:]

    zu_bereich = {n: b for b, ns in BEREICHE.items() for n in ns}
    dateien = {}
    for name, rumpf in teilstuecke.items():
        dateien.setdefault(zu_bereich.get(name, "sonstiges"), []).append((name, rumpf))

    for bereich, eintraege in sorted(dateien.items()):
        zeilen = ["// Vorlage: %s. Maschinell erzeugt aus der DC-Fassung" % bereich,
                  "// (tools/konvert.py) - Aenderungen gehoeren hierher, nicht in eine",
                  "// erneute Uebersetzung.",
                  "(function (global) {",
                  "  'use strict';",
                  "  const V = global.DWVorlage = global.DWVorlage || {};",
                  ""]
        for name, rumpf in sorted(eintraege):
            zeilen.append("  V.%s = function (v, html, stil) {" % name)
            zeilen.append("    return v.%s ? html`%s` : null;" % (name, rumpf))
            zeilen.append("  };")
            zeilen.append("")
        zeilen.append("})(typeof globalThis !== 'undefined' ? globalThis : this);")
        (ziel / (bereich + ".js")).write_text("\n".join(zeilen), encoding="utf-8")

    return wurzel, sorted(dateien)


def main():
    quelle = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "mobile.dc.html")
    ziel = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else "vorlage.js")

    s = quelle.read_text(encoding="utf-8")
    vorlage = s[s.index("<x-dc>") + len("<x-dc>"):s.index("</x-dc>")]
    # helmet trägt Stylesheet und Keyframes - gehört in index.html, nicht in
    # die Komponente.
    helmet = re.search(r"<helmet>(.*?)</helmet>", vorlage, re.S)
    koerper = vorlage[helmet.end():] if helmet else vorlage

    aus = wandle(koerper).strip()

    if len(sys.argv) > 3 and sys.argv[3] == "--teilen":
        wurzel, bereiche = teile(aus, ziel.parent / "vorlage")
        ziel.write_text(
            "// Wurzel der Vorlage. Die Bildschirme liegen in vorlage/ und\n"
            "// haengen sich an globalThis.DWVorlage.\n"
            "(function (global) {\n"
            "  'use strict';\n"
            "  const V = global.DWVorlage = global.DWVorlage || {};\n"
            "  V.wurzel = function (v, html, stil) {\n"
            "    return html`" + wurzel + "`;\n"
            "  };\n"
            "})(typeof globalThis !== 'undefined' ? globalThis : this);\n",
            encoding="utf-8")
        print("Bereiche:", ", ".join(bereiche))
    else:
        ziel.write_text(aus, encoding="utf-8")

    reste = {k: aus.count(k) for k in ("<sc-if", "<sc-for", "{{", "hint-placeholder")
             if aus.count(k)}
    print("%d Zeilen -> %s" % (aus.count("\n") + 1, ziel))
    print("DC-Reste:", reste or "keine")
    if helmet:
        (ziel.parent / (ziel.stem + ".helmet.html")).write_text(helmet.group(1), encoding="utf-8")
    return 1 if reste else 0


if __name__ == "__main__":
    sys.exit(main())
