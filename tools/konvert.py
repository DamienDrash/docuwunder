"""Uebersetzt die DC-Vorlage nach htm.

Mechanisch statt von Hand: 1.397 Zeilen mit 145 sc-if, 46 sc-for und 659
Bindungen von Hand umzuschreiben waere fehleranfaellig und nicht nachvollziehbar.
Ein Konverter macht dieselbe Regel ueberall gleich und laesst sich pruefen.

Regeln:
    {{ x }} im Text          ->  ${x}
    attr="{{ x }}"           ->  attr=${x}
    style="a:b;{{ x }}"      ->  style=${stil(`a:b;${x}`)}
    style="a:b"              ->  style=${stil('a:b')}
    <sc-if value="{{ x }}">  ->  ${x ? html`…` : null}
    <sc-for list="{{ xs }}" as="d">  ->  ${(xs||[]).map((d, i) => html`…`)}

Verworfen werden die reinen Entwurfshilfen des alten Runtimes
(hint-placeholder-*, data-screen-label bleibt als Testanker erhalten).
"""
import pathlib
import re
import sys

QUELLE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/paperless-app/mobile.dc.html")

# Attribute, die nur der alte Entwurfsmodus brauchte.
WEG = re.compile(r'\s(?:hint-placeholder-\w+|hint-size|component-from-global-scope)="[^"]*"')


def binde(ausdruck: str) -> str:
    """Ein {{ … }} zu einem ${ … }."""
    return "${" + ausdruck.strip() + "}"


def attribut(name: str, wert: str) -> str:
    """Ein Attribut samt Wert in htm-Schreibweise."""
    voll = re.fullmatch(r"\{\{\s*(.+?)\s*\}\}", wert.strip())

    if name == "style":
        if voll:
            # Reine Bindung: kann Objekt oder Zeichenkette sein, stil() nimmt beides.
            return f"style=${{stil({voll.group(1)})}}"
        if "{{" in wert:
            # Gemischt: als Template-Zeichenkette zusammensetzen.
            inner = re.sub(r"\{\{\s*(.+?)\s*\}\}", lambda m: "${" + m.group(1) + "}", wert)
            return "style=${stil(`" + inner + "`)}"
        return "style=${stil('" + wert.replace("\\", "\\\\").replace("'", "\\'") + "')}"

    if voll:
        return f"{name}=${{{voll.group(1)}}}"
    if "{{" in wert:
        inner = re.sub(r"\{\{\s*(.+?)\s*\}\}", lambda m: "${" + m.group(1) + "}", wert)
        return f"{name}=" + "${`" + inner + "`}"
    return f'{name}="{wert}"'


def attribute(roh: str) -> str:
    """Alle Attribute eines Tags umschreiben."""
    roh = WEG.sub("", roh)
    aus = []
    for m in re.finditer(r'([a-zA-Z_:][\w:.-]*)="([^"]*)"', roh):
        aus.append(attribut(m.group(1), m.group(2)))
    return (" " + " ".join(aus)) if aus else ""


def finde_ende(text: str, start: int, tag: str) -> int:
    """Position des zugehoerigen schliessenden Tags, verschachtelungssicher."""
    tiefe = 0
    muster = re.compile(r"</?" + tag + r"\b")
    for m in muster.finditer(text, start):
        if text[m.start() + 1] == "/":
            tiefe -= 1
            if tiefe == 0:
                return m.start()
        else:
            tiefe += 1
    raise ValueError(f"kein schliessendes </{tag}> ab {start}")


def steuerung(text: str) -> str:
    """sc-if und sc-for aufloesen - innerste zuerst, damit Verschachtelung stimmt."""
    while True:
        m = re.search(r'<sc-(if|for)\b([^>]*)>', text)
        if not m:
            return text
        art, attrs = m.group(1), m.group(2)
        ende = finde_ende(text, m.start(), "sc-" + art)
        rumpf = text[m.end():ende]
        rumpf = steuerung(rumpf)  # verschachtelte zuerst
        nach = text[ende + len(f"</sc-{art}>"):]

        if art == "if":
            bed = re.search(r'value="\{\{\s*(.+?)\s*\}\}"', attrs)
            if not bed:
                raise ValueError("sc-if ohne value: " + attrs[:60])
            ersatz = "${" + bed.group(1) + " ? html`" + rumpf.strip() + "` : null}"
        else:
            liste = re.search(r'list="\{\{\s*(.+?)\s*\}\}"', attrs)
            alias = re.search(r'as="(\w+)"', attrs)
            if not (liste and alias):
                raise ValueError("sc-for ohne list/as: " + attrs[:60])
            v = alias.group(1)
            # key: React braucht einen stabilen Schluessel je Eintrag. Wo der
            # Eintrag eine id traegt, wird sie genommen, sonst der Index.
            ersatz = ("${(" + liste.group(1) + " || []).map((" + v + ", " + v + "Idx) => html`"
                      + einfuege_key(rumpf.strip(), v) + "`)}")
        text = text[:m.start()] + ersatz + nach


def einfuege_key(rumpf: str, v: str) -> str:
    """key= an das aeusserste Element einer Schleife haengen."""
    m = re.match(r"<(\w+)((?:\s+[^>]*?)?)>", rumpf)
    if not m:
        return rumpf
    return (f"<{m.group(1)} key=${{{v} && {v}.id != null ? {v}.id : {v}Idx}}"
            + m.group(2) + ">" + rumpf[m.end():])


def wandle(text: str) -> str:
    text = steuerung(text)

    # Tags mit ihren Attributen
    def tag(m):
        return "<" + m.group(1) + attribute(m.group(2)) + m.group(3)
    text = re.sub(r"<(\w[\w-]*)((?:\s+[a-zA-Z_:][\w:.-]*=\"[^\"]*\")*)\s*(/?>)", tag, text)

    # Verbleibende Bindungen im Text
    text = re.sub(r"\{\{\s*(.+?)\s*\}\}", lambda m: binde(m.group(1)), text)

    # Void-Elemente schliessen, htm erwartet das
    for v in ("br", "img", "input", "link", "hr", "meta"):
        text = re.sub(r"(<" + v + r"\b[^>]*?)(?<!/)>", r"\1 />", text)
    return text


if __name__ == "__main__":
    quelle = QUELLE.read_text()
    vorlage = quelle[quelle.index("<x-dc>") + len("<x-dc>"):quelle.index("</x-dc>")]
    # helmet enthaelt Stylesheet und Keyframes - gehoert in index.html, nicht
    # in die Komponente.
    helmet = re.search(r"<helmet>(.*?)</helmet>", vorlage, re.S)
    kopf = helmet.group(1) if helmet else ""
    koerper = vorlage[helmet.end():] if helmet else vorlage

    aus = wandle(koerper)
    ziel = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else "/tmp/vorlage.htm.js")
    ziel.write_text(aus)
    pathlib.Path(str(ziel) + ".helmet").write_text(kopf)
    print(f"{aus.count(chr(10))} Zeilen geschrieben nach {ziel}")
    print("verbliebene DC-Reste:",
          {k: aus.count(k) for k in ("<sc-if", "<sc-for", "{{", "hint-placeholder") if aus.count(k)} or "keine")
